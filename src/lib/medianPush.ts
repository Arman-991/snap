import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface MedianOneSignalInfo {
  subscription?: {
    id?: string | null;
    token?: string | null;
    optedIn?: boolean;
  };
  oneSignalUserId?: string | null;
  externalId?: string | null;
  optedIn?: boolean;
}

interface MedianOneSignalBridge {
  register?: () => unknown;
  login?: (externalId: string) => unknown;
  setExternalUserId?: (externalId: string) => unknown;
  info?: (callback?: (info: MedianOneSignalInfo) => void) => unknown;
  userPrivacyConsent?: {
    grant?: () => unknown;
  };
}

interface MedianWindow extends Window {
  median?: {
    onesignal?: MedianOneSignalBridge;
  };
}

export interface MedianPushSyncResult {
  isMedian: boolean;
  registered: boolean;
  loggedIn: boolean;
  subscriptionId: string | null;
  optedIn: boolean | null;
  savedToFirestore: boolean;
}

/**
 * Safely detects if the app is running inside a Median.co native APK/wrapper.
 * Always returns false in normal web browsers and SSR/Node environments.
 */
export function isMedianApp(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const medianObj = (window as MedianWindow).median;
    return Boolean(medianObj && typeof medianObj === 'object');
  } catch {
    return false;
  }
}

function getMedianOneSignal(): MedianOneSignalBridge | null {
  try {
    if (!isMedianApp()) return null;
    const bridge = (window as MedianWindow).median?.onesignal;
    return bridge && typeof bridge === 'object' ? bridge : null;
  } catch {
    return null;
  }
}

function extractSubscriptionDetails(raw: unknown): {
  subscriptionId: string | null;
  optedIn: boolean | null;
} {
  if (!raw || typeof raw !== 'object') {
    return { subscriptionId: null, optedIn: null };
  }
  const info = raw as MedianOneSignalInfo;
  const subId = info.subscription?.id ?? info.oneSignalUserId ?? null;
  const cleanSubId =
    typeof subId === 'string' && subId.trim().length > 0
      ? subId.trim().slice(0, 128)
      : null;

  const optedIn =
    typeof info.subscription?.optedIn === 'boolean'
      ? info.subscription.optedIn
      : typeof info.optedIn === 'boolean'
        ? info.optedIn
        : null;

  return { subscriptionId: cleanSubId, optedIn };
}

/**
 * Requests Android/iOS native push notification permission via Median OneSignal bridge.
 */
export async function registerMedianPush(): Promise<boolean> {
  try {
    const onesignal = getMedianOneSignal();
    if (!onesignal || typeof onesignal.register !== 'function') {
      return false;
    }
    await Promise.resolve(onesignal.register());
    return true;
  } catch {
    return false;
  }
}

/**
 * Binds the current device to the customer's Firebase UID as OneSignal External User ID.
 */
export async function loginMedianOneSignal(uid: string): Promise<boolean> {
  const cleanUid = uid.trim();
  if (!cleanUid) return false;

  try {
    const onesignal = getMedianOneSignal();
    if (!onesignal) return false;

    if (typeof onesignal.login === 'function') {
      await Promise.resolve(onesignal.login(cleanUid));
      return true;
    }
    if (typeof onesignal.setExternalUserId === 'function') {
      await Promise.resolve(onesignal.setExternalUserId(cleanUid));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Reads OneSignal subscription info from Median bridge, supporting both Promise and callback styles.
 */
export async function fetchMedianOneSignalInfo(): Promise<{
  subscriptionId: string | null;
  optedIn: boolean | null;
}> {
  try {
    const onesignal = getMedianOneSignal();
    if (!onesignal || typeof onesignal.info !== 'function') {
      return { subscriptionId: null, optedIn: null };
    }

    const result = await new Promise<unknown>((resolve) => {
      let settled = false;
      const done = (val: unknown) => {
        if (settled) return;
        settled = true;
        resolve(val);
      };

      const timeoutId = window.setTimeout(() => done(null), 2500);

      try {
        const maybePromise = onesignal.info!((callbackData) => {
          window.clearTimeout(timeoutId);
          done(callbackData);
        });

        if (
          maybePromise &&
          typeof (maybePromise as PromiseLike<unknown>).then === 'function'
        ) {
          Promise.resolve(maybePromise)
            .then((resolvedData) => {
              window.clearTimeout(timeoutId);
              done(resolvedData);
            })
            .catch(() => {
              window.clearTimeout(timeoutId);
              done(null);
            });
        } else if (maybePromise && typeof maybePromise === 'object') {
          window.clearTimeout(timeoutId);
          done(maybePromise);
        }
      } catch {
        window.clearTimeout(timeoutId);
        done(null);
      }
    });

    return extractSubscriptionDetails(result);
  } catch {
    return { subscriptionId: null, optedIn: null };
  }
}

/**
 * Saves OneSignal device mapping fields onto `users/{uid}` in Firestore.
 * Uses `updateDoc` so it only updates an existing user profile document and respects firestore.rules.
 */
export async function saveMedianPushMetadataToUser(
  uid: string,
  subscriptionId: string | null
): Promise<boolean> {
  const cleanUid = uid.trim();
  if (!cleanUid) return false;

  try {
    await updateDoc(doc(db, 'users', cleanUid), {
      onesignalExternalId: cleanUid.slice(0, 128),
      onesignalSubscriptionId: subscriptionId ? subscriptionId.slice(0, 128) : null,
      pushPlatform: 'median-android',
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Full Median APK startup & manual registration sync:
 * 1) Safely skips in regular web browsers.
 * 2) Calls median.onesignal.register() to request Android push permission.
 * 3) Binds the device via median.onesignal.login(uid).
 * 4) Reads median.onesignal.info() (with a short retry if Android just granted permission)
 *    and persists onesignalSubscriptionId onto users/{uid} once the profile exists.
 */
export async function syncMedianPushWithUser(
  uid: string | null | undefined,
  hasProfileDoc: boolean
): Promise<MedianPushSyncResult> {
  if (!isMedianApp()) {
    return {
      isMedian: false,
      registered: false,
      loggedIn: false,
      subscriptionId: null,
      optedIn: null,
      savedToFirestore: false,
    };
  }

  const registered = await registerMedianPush();
  const cleanUid = uid?.trim() || '';

  let loggedIn = false;
  if (cleanUid) {
    loggedIn = await loginMedianOneSignal(cleanUid);
  }

  let info = await fetchMedianOneSignalInfo();
  if (!info.subscriptionId && registered) {
    // Give Median/OneSignal SDK a brief moment to emit the subscription ID after register()
    await new Promise((r) => window.setTimeout(r, 700));
    info = await fetchMedianOneSignalInfo();
  }

  let savedToFirestore = false;
  if (cleanUid && hasProfileDoc) {
    savedToFirestore = await saveMedianPushMetadataToUser(
      cleanUid,
      info.subscriptionId
    );
  }

  return {
    isMedian: true,
    registered,
    loggedIn,
    subscriptionId: info.subscriptionId,
    optedIn: info.optedIn,
    savedToFirestore,
  };
}
