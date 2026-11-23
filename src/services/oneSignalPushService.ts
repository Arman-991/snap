import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import type {
  Language,
  OneSignalPushConfig,
  OrderRecord,
} from '../types/grocery';
import {
  buildOneSignalNotificationPayload,
  buildOrderPushMessage,
  buildTestPushMessage,
  computeOrderAndLifetimeSavingsForPush,
  type PushEligibleOrderStatus,
} from '../utils/oneSignalPushLogic';
import {
  logAdminAction,
  type AdminActor,
} from '../admin/services/adminFirestoreService';

const ONESIGNAL_ENDPOINT = 'https://api.onesignal.com/notifications';

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
 * Sends a push notification via OneSignal REST API targeting a single Firebase UID (External User ID).
 */
export async function sendOneSignalNotification(params: {
  config: OneSignalPushConfig;
  externalUserId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<PushSendResult> {
  const appId = params.config.appId.trim();
  const restApiKey = params.config.restApiKey.trim();
  const targetUid = params.externalUserId.trim();

  if (!appId || !restApiKey) {
    return {
      ok: false,
      status: 'not_configured',
      message: 'OneSignal App ID or REST API Key is not configured.',
    };
  }

  if (!targetUid) {
    return {
      ok: false,
      status: 'error',
      message: 'Missing customer UID.',
    };
  }

  const payload = buildOneSignalNotificationPayload({
    appId,
    externalUserId: targetUid,
    title: params.title,
    body: params.body,
    url: params.url,
  });

  try {
    const response = await fetch(ONESIGNAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Key ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      recipients?: number;
      errors?: unknown;
    };

    if (!response.ok) {
      const errorDetail =
        Array.isArray(data.errors) && data.errors.length > 0
          ? String(data.errors[0])
          : typeof data.errors === 'object' && data.errors !== null
            ? JSON.stringify(data.errors)
            : `HTTP ${response.status}`;
      return {
        ok: false,
        status: 'error',
        message: errorDetail,
      };
    }

    return {
      ok: true,
      status: 'sent',
      recipients: typeof data.recipients === 'number' ? data.recipients : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      message: err instanceof Error ? err.message : 'Network error contacting OneSignal.',
    };
  }
}

async function lookupCustomerLanguage(
  userId: string,
  fallback: Language
): Promise<Language> {
  if (!userId.trim()) return fallback;
  try {
    const snap = await getDoc(doc(db, 'users', userId.trim()));
    if (!snap.exists()) return fallback;
    const lang = snap.data().language;
    if (lang === 'ku' || lang === 'ar' || lang === 'en') {
      return lang;
    }
    return fallback;
  } catch {
    return fallback;
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
    if (!config.appId.trim() || !config.restApiKey.trim()) {
      return { ok: false, status: 'not_configured' };
    }
    if (!config.enabled) {
      return { ok: false, status: 'disabled' };
    }

    const customerLang = await lookupCustomerLanguage(
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
    title: copy.title,
    body: copy.body,
    url: appUrl,
  });
}
