import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from '../lib/firebase';
import type {
  Language,
  OneSignalPushConfig,
  OrderRecord,
} from '../types/grocery';
import {
  buildOrderPushMessage,
  buildTestPushMessage,
  computeOrderAndLifetimeSavingsForPush,
  type PushEligibleOrderStatus,
} from '../utils/oneSignalPushLogic';
import {
  logAdminAction,
  type AdminActor,
} from '../admin/services/adminFirestoreService';

const SERVER_SEND_PUSH_URL = '/api/send-push';
const SERVER_PUSH_HEALTH_URL = '/api/push-health';

export const DEFAULT_ONESIGNAL_CONFIG: OneSignalPushConfig = {
  appId: '',
  restApiKey: '',
  enabled: false,
};

export interface PushSendResult {
  ok: boolean;
  status: 'sent' | 'not_configured' | 'disabled' | 'error';
  message?: string;
  recipients?: number;
  httpStatus?: number;
}

export interface PushBackendHealth {
  ok: boolean;
  envConfigured: boolean;
  error?: string;
}

function tsToMs(val: unknown): number | undefined {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'seconds' in (val as Record<string, unknown>)) {
    return Number((val as { seconds: number }).seconds) * 1000;
  }
  return undefined;
}

/**
 * Verifies the Node.js Express backend (/api/push-health) is running and checks
 * whether server-side OneSignal environment secrets are configured.
 */
export async function checkPushBackendHealth(): Promise<PushBackendHealth> {
  try {
    const response = await fetch(SERVER_PUSH_HEALTH_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return {
        ok: false,
        envConfigured: false,
        error: `Backend returned HTTP ${response.status}`,
      };
    }
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      envConfigured?: boolean;
    };
    return {
      ok: Boolean(data.ok),
      envConfigured: Boolean(data.envConfigured),
    };
  } catch (err) {
    return {
      ok: false,
      envConfigured: false,
      error: err instanceof Error ? err.message : 'Backend unreachable',
    };
  }
}

/**
 * Fetches admin-only OneSignal configuration from `adminConfig/onesignal`.
 * Readable only by Owner & Staff per firestore.rules; never exposed to customers.
 */
export async function fetchOneSignalConfigAdmin(): Promise<OneSignalPushConfig> {
  try {
    const snap = await getDoc(doc(db, 'adminConfig', 'onesignal'));
    if (!snap.exists()) {
      return { ...DEFAULT_ONESIGNAL_CONFIG };
    }
    const d = snap.data();
    return {
      appId: typeof d.appId === 'string' ? d.appId : '',
      restApiKey: typeof d.restApiKey === 'string' ? d.restApiKey : '',
      enabled: Boolean(d.enabled),
      updatedAtMs: tsToMs(d.updatedAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'adminConfig/onesignal');
    return { ...DEFAULT_ONESIGNAL_CONFIG };
  }
}

/**
 * Saves OneSignal App ID, REST API Key, and auto-push toggle to `adminConfig/onesignal`.
 * Owner-only per firestore.rules. Never writes the REST API key to auditLogs.
 */
export async function saveOneSignalConfigAdmin(
  actor: AdminActor,
  config: OneSignalPushConfig
): Promise<void> {
  const sanitized = {
    appId: config.appId.trim().slice(0, 128),
    restApiKey: config.restApiKey.trim().slice(0, 256),
    enabled: Boolean(config.enabled),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'adminConfig', 'onesignal'), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'adminConfig/onesignal');
  }

  // Never log restApiKey into auditLogs
  await logAdminAction(
    actor,
    'ONESIGNAL_CONFIG_UPDATE',
    'adminConfig',
    'onesignal',
    `Updated OneSignal mobile push settings (auto-push ${sanitized.enabled ? 'ON' : 'OFF'})`,
    {
      enabled: sanitized.enabled,
      hasAppId: sanitized.appId.length > 0,
      hasRestApiKey: sanitized.restApiKey.length > 0,
    }
  );
}

/**
 * Sends a push notification via our same-origin Node.js Express route `POST /api/send-push`
 * (never calling api.onesignal.com directly from the browser, avoiding CORS failures).
 */
export async function sendOneSignalNotification(params: {
  config: OneSignalPushConfig;
  externalUserId: string;
  subscriptionId?: string | null;
  title: string;
  body: string;
  url?: string;
}): Promise<PushSendResult> {
  const appId = params.config.appId.trim();
  const apiKey = params.config.restApiKey.trim();
  const targetUid = params.externalUserId.trim();
  const subscriptionId = params.subscriptionId?.trim() || '';

  if (!targetUid && !subscriptionId) {
    return {
      ok: false,
      status: 'error',
      message: 'Missing customer UID or OneSignal subscription ID.',
    };
  }

  let idToken = '';
  try {
    idToken = (await auth.currentUser?.getIdToken()) || '';
  } catch {
    idToken = '';
  }

  if (!idToken) {
    return {
      ok: false,
      status: 'error',
      message: 'Admin session token unavailable. Please sign in to /admin again.',
    };
  }

  try {
    const response = await fetch(SERVER_SEND_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        appId,
        apiKey,
        targetUid,
        subscriptionId: subscriptionId || undefined,
        title: params.title,
        body: params.body,
        url: params.url,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      httpStatus?: number;
      recipients?: number;
      error?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        status: response.status === 400 && !appId && !apiKey ? 'not_configured' : 'error',
        httpStatus: data.httpStatus ?? response.status,
        message:
          data.error ||
          `Push backend returned HTTP ${response.status}. Check server logs and OneSignal settings.`,
      };
    }

    return {
      ok: true,
      status: 'sent',
      httpStatus: data.httpStatus ?? response.status,
      recipients: typeof data.recipients === 'number' ? data.recipients : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      message:
        err instanceof Error
          ? `Could not reach backend /api/send-push: ${err.message}`
          : 'Could not reach backend /api/send-push.',
    };
  }
}

async function lookupCustomerPushContext(
  userId: string,
  fallbackLanguage: Language
): Promise<{ language: Language; subscriptionId: string | null }> {
  if (!userId.trim()) {
    return { language: fallbackLanguage, subscriptionId: null };
  }
  try {
    const snap = await getDoc(doc(db, 'users', userId.trim()));
    if (!snap.exists()) {
      return { language: fallbackLanguage, subscriptionId: null };
    }
    const d = snap.data();
    const lang =
      d.language === 'ku' || d.language === 'ar' || d.language === 'en'
        ? d.language
        : fallbackLanguage;
    const subId =
      typeof d.onesignalSubscriptionId === 'string' &&
      d.onesignalSubscriptionId.trim().length > 0
        ? d.onesignalSubscriptionId.trim()
        : null;
    return { language: lang, subscriptionId: subId };
  } catch {
    return { language: fallbackLanguage, subscriptionId: null };
  }
}

/**
 * Triggered automatically when an Admin marks an order Confirmed or Delivered.
 * Never throws so the Firestore order status update is never blocked.
 */
export async function triggerOrderStatusPushAdmin(params: {
  order: OrderRecord;
  nextStatus: PushEligibleOrderStatus;
  allOrders: OrderRecord[];
  fallbackLanguage: Language;
}): Promise<PushSendResult> {
  try {
    const config = await fetchOneSignalConfigAdmin();
    if (!config.enabled) {
      return { ok: false, status: 'disabled' };
    }

    // If neither Firestore config nor server env secrets are set, skip cleanly
    if (!config.appId.trim() || !config.restApiKey.trim()) {
      const health = await checkPushBackendHealth();
      if (!health.envConfigured) {
        return { ok: false, status: 'not_configured' };
      }
    }

    const { language: customerLang, subscriptionId } =
      await lookupCustomerPushContext(
        params.order.userId,
        params.fallbackLanguage
      );

    const { orderSavings, lifetimeSavings } =
      computeOrderAndLifetimeSavingsForPush(
        params.allOrders,
        params.order,
        params.nextStatus
      );

    const copy = buildOrderPushMessage({
      status: params.nextStatus,
      orderNumber: params.order.orderNumber,
      customerName: params.order.customerName,
      orderSavings,
      lifetimeSavings,
      language: customerLang,
    });

    const appUrl =
      typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/?view=orders`
        : undefined;

    return await sendOneSignalNotification({
      config,
      externalUserId: params.order.userId,
      subscriptionId,
      title: copy.title,
      body: copy.body,
      url: appUrl,
    });
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      message: err instanceof Error ? err.message : 'Unexpected push error',
    };
  }
}

/**
 * Owner-only test notification sender from Admin Settings.
 */
export async function sendTestPushAdmin(params: {
  config: OneSignalPushConfig;
  externalUserId: string;
  subscriptionId?: string | null;
  language: Language;
}): Promise<PushSendResult> {
  const copy = buildTestPushMessage(params.language);
  const appUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/?view=orders`
      : undefined;

  return sendOneSignalNotification({
    config: params.config,
    externalUserId: params.externalUserId,
    subscriptionId: params.subscriptionId,
    title: copy.title,
    body: copy.body,
    url: appUrl,
  });
}
