export interface OneSignalNotificationPayload {
  app_id: string;
  include_subscription_ids?: string[];
  include_aliases?: {
    external_id: string[];
  };
  target_channel: 'push';
  headings: {
    en: string;
  };
  contents: {
    en: string;
  };
  url?: string;
}

/**
 * Builds the exact OneSignal REST API v16+ payload.
 * Prefers `include_subscription_ids` when the device's subscriptionId is known,
 * otherwise falls back to `include_aliases.external_id` (Firebase UID).
 * OneSignal requires the `en` key in `headings` and `contents` even for Kurdish/Arabic copy.
 */
export function buildOneSignalNotificationPayload(params: {
  appId: string;
  externalUserId?: string;
  subscriptionId?: string | null;
  title: string;
  body: string;
  url?: string;
}): OneSignalNotificationPayload {
  const cleanSubId = params.subscriptionId?.trim() || '';
  const cleanExtId = params.externalUserId?.trim() || '';

  const payload: OneSignalNotificationPayload = {
    app_id: params.appId.trim(),
    target_channel: 'push',
    headings: {
      en: params.title.trim(),
    },
    contents: {
      en: params.body.trim(),
    },
  };

  if (cleanSubId) {
    payload.include_subscription_ids = [cleanSubId];
  } else if (cleanExtId) {
    payload.include_aliases = {
      external_id: [cleanExtId],
    };
  }

  if (params.url && params.url.trim()) {
    payload.url = params.url.trim();
  }

  return payload;
}

/**
 * Extracts a clear, human-readable error message from a OneSignal REST API response.
 * Handles both non-2xx HTTP errors (e.g., 401/403 bad API key) AND HTTP 200 responses
 * where OneSignal reports `errors` (e.g. "All included players are not subscribed" or `invalid_aliases`).
 * Returns `null` when the notification was accepted without errors.
 */
export function extractOneSignalErrorMessage(
  httpStatus: number,
  data: unknown
): string | null {
  const record =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const errors = record.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    const joined = errors
      .map((entry) => (typeof entry === 'string' ? entry : JSON.stringify(entry)))
      .join('; ');
    if (/not subscribed/i.test(joined)) {
      return `${joined} — Ask the customer to open the Median Android APK and allow notifications.`;
    }
    return joined;
  }

  if (errors && typeof errors === 'object') {
    const errObj = errors as Record<string, unknown>;
    if (errObj.invalid_aliases) {
      return `Customer device is not registered in OneSignal yet (invalid_aliases: ${JSON.stringify(errObj.invalid_aliases)}). Open the Median APK on the phone and tap "Enable Mobile Alerts".`;
    }
    if (errObj.invalid_player_ids || errObj.invalid_subscription_ids) {
      return `Saved phone subscription ID is no longer active in OneSignal (${JSON.stringify(errors)}). Re-open the Median APK to refresh registration.`;
    }
    return JSON.stringify(errors);
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return `Invalid OneSignal REST API Key or App ID (HTTP ${httpStatus}). Make sure you pasted your os_v2_app_... App API Key.`;
  }

  if (httpStatus < 200 || httpStatus >= 300) {
    return `OneSignal API returned HTTP ${httpStatus}`;
  }

  return null;
}
