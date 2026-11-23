import type {
  Language,
  OrderRecord,
  OrderStatus,
  UserProfile,
} from '../types/grocery';
import { normalizeIraqiPhone } from './supermarketLogic';

export type PushEligibleOrderStatus = Extract<OrderStatus, 'Confirmed' | 'Delivered'>;

export interface OrderPushMessageInput {
  status: PushEligibleOrderStatus;
  orderNumber: string;
  customerName: string;
  orderSavings: number;
  lifetimeSavings: number;
  language: Language;
}

export interface PushNotificationCopy {
  title: string;
  body: string;
}

export interface OneSignalNotificationPayload {
  app_id: string;
  include_aliases: {
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

function formatNumberPlain(amount: number): string {
  return Math.max(0, Math.round(amount)).toLocaleString('en-US');
}

function fallbackCustomerName(name: string, language: Language): string {
  const cleaned = name.trim();
  if (cleaned) return cleaned;
  if (language === 'ku') return 'بەڕێز';
  if (language === 'ar') return 'عزيزنا';
  return 'friend';
}

/**
 * Pure trilingual copy builder for native Median / OneSignal push notifications.
 * Uses a warm, human neighborhood shop-owner tone and omits savings clauses cleanly when 0.
 */
export function buildOrderPushMessage(
  input: OrderPushMessageInput
): PushNotificationCopy {
  const name = fallbackCustomerName(input.customerName, input.language);
  const orderNum = input.orderNumber.trim() || 'SM';
  const orderSav = Math.max(0, Math.round(input.orderSavings || 0));
  const lifeSav = Math.max(0, Math.round(input.lifetimeSavings || 0));
  const orderSavStr = formatNumberPlain(orderSav);
  const lifeSavStr = formatNumberPlain(lifeSav);

  if (input.status === 'Confirmed') {
    if (input.language === 'ku') {
      return {
        title: `داواکارییەکەت پەسەند کرا! (${orderNum})`,
        body: `سڵاو ${name}، داواکارییەکەت دڵنیاکرایەوە و ئێستا بە تازەیی بۆت ئامادە دەکەین.`,
      };
    }
    if (input.language === 'ar') {
      return {
        title: `تم تأكيد طلبك! (${orderNum})`,
        body: `أهلاً ${name}، تم قبول طلبك ونحن الآن نجهّزه لك بعناية للتوصيل.`,
      };
    }
    return {
      title: `Your order is confirmed! (${orderNum})`,
      body: `Hi ${name}, we've confirmed your order and are packing it fresh for delivery.`,
    };
  }

  // Delivered
  if (input.language === 'ku') {
    const title = `داواکارییەکەت گەیشت، ${name}!`;
    if (orderSav > 0 && lifeSav > 0) {
      return {
        title,
        body: `سوپاس بۆ کڕینت! ئەمڕۆ ${orderSavStr} د.ع پاشەکەوتت کرد — کۆی پاشەکەوتت لەگەڵ ئێمە گەیشتە ${lifeSavStr} د.ع.`,
      };
    }
    if (lifeSav > 0) {
      return {
        title,
        body: `داواکارییەکەت گەیشتە دەستت! تا ئێستا ${lifeSavStr} د.ع پاشەکەوتت لەگەڵ ئێمە کردووە. سوپاس بۆ متمانەت!`,
      };
    }
    return {
      title,
      body: 'داواکارییەکەت گەیشتە دەستت و هیوادارین هەموو شتەکان تازە و بە دڵت بن. سوپاس کە لەگەڵ ئێمەیت!',
    };
  }

  if (input.language === 'ar') {
    const title = `وصلت أغراضك بالسلامة، ${name}!`;
    if (orderSav > 0 && lifeSav > 0) {
      return {
        title,
        body: `شكراً لتسوقك معنا! وفّرت اليوم ${orderSavStr} د.ع، ليصل إجمالي توفيرك معنا إلى ${lifeSavStr} د.ع.`,
      };
    }
    if (lifeSav > 0) {
      return {
        title,
        body: `وصلت أغراضك بالسلامة! وصل إجمالي توفيرك معنا حتى الآن إلى ${lifeSavStr} د.ع. شكراً لثقتك بنا!`,
      };
    }
    return {
      title,
      body: 'وصلت أغراضك بالسلامة ونتمنى أن تكون كل الأغراض طازجة وعلى ذوقك. شكراً لتسوقك معنا!',
    };
  }

  // English
  const title = `Your order arrived, ${name}!`;
  if (orderSav > 0 && lifeSav > 0) {
    return {
      title,
      body: `Thank you for shopping with us! You saved ${orderSavStr} IQD today — bringing your total savings with us to ${lifeSavStr} IQD.`,
    };
  }
  if (lifeSav > 0) {
    return {
      title,
      body: `Your groceries have arrived! You've saved ${lifeSavStr} IQD with us so far. Thank you for shopping with us!`,
    };
  }
  return {
    title,
    body: 'Your groceries have arrived — we hope everything is fresh and just how you like it!',
  };
}

export function buildTestPushMessage(language: Language): PushNotificationCopy {
  if (language === 'ku') {
    return {
      title: 'تاقیکردنەوەی ئاگادارکردنەوەی مۆبایل',
      body: 'سڵاو! ئاگادارکردنەوەکانی ئەپەکەت بە سەرکەوتوویی کار دەکەن.',
    };
  }
  if (language === 'ar') {
    return {
      title: 'اختبار إشعارات التطبيق',
      body: 'أهلاً بك! إشعارات الموبايل تعمل بنجاح على جهازك.',
    };
  }
  return {
    title: 'Mobile Push Test',
    body: 'Hello! Native mobile notifications are connected and working on your device.',
  };
}

/**
 * Builds the exact OneSignal REST API v16+ payload targeting a customer via External User ID (Firebase UID).
 * OneSignal requires the `en` key in `headings` and `contents` even when localized Kurdish/Arabic text is sent.
 */
export function buildOneSignalNotificationPayload(params: {
  appId: string;
  externalUserId: string;
  title: string;
  body: string;
  url?: string;
}): OneSignalNotificationPayload {
  const payload: OneSignalNotificationPayload = {
    app_id: params.appId.trim(),
    include_aliases: {
      external_id: [params.externalUserId.trim()],
    },
    target_channel: 'push',
    headings: {
      en: params.title.trim(),
    },
    contents: {
      en: params.body.trim(),
    },
  };

  if (params.url && params.url.trim()) {
    payload.url = params.url.trim();
  }

  return payload;
}

/**
 * Computes the customer's orderSavings and cumulative lifetimeSavings when an Admin transitions
 * an order to Confirmed or Delivered, ensuring the newly Delivered order is counted exactly once.
 */
export function computeOrderAndLifetimeSavingsForPush(
  allOrders: OrderRecord[],
  targetOrder: OrderRecord,
  nextStatus: PushEligibleOrderStatus
): { orderSavings: number; lifetimeSavings: number } {
  const orderSavings = Math.max(0, Math.round(targetOrder.totalSavings || 0));
  let lifetimeSavings = 0;
  let targetIncluded = false;

  for (const order of allOrders) {
    const sameCustomer =
      (targetOrder.userId && order.userId === targetOrder.userId) ||
      (targetOrder.phoneNormalized &&
        order.phoneNormalized === targetOrder.phoneNormalized);
    if (!sameCustomer) continue;

    if (order.id === targetOrder.id) {
      targetIncluded = true;
      if (nextStatus === 'Delivered') {
        lifetimeSavings += Math.max(0, Math.round(order.totalSavings || 0));
      }
      continue;
    }

    if (order.status === 'Delivered') {
      lifetimeSavings += Math.max(0, Math.round(order.totalSavings || 0));
    }
  }

  if (!targetIncluded && nextStatus === 'Delivered') {
    lifetimeSavings += orderSavings;
  }

  return { orderSavings, lifetimeSavings };
}

/**
 * Resolves a test-notification target input that can be EITHER:
 * - an Iraqi phone number (matched against loaded users), OR
 * - a direct Firebase customer UID.
 */
export function resolveTargetUidFromInput(
  rawInput: string,
  users: Pick<UserProfile, 'uid' | 'phoneNormalized' | 'phoneDisplay' | 'fullName' | 'language'>[]
): {
  uid: string | null;
  matchedUser: Pick<UserProfile, 'uid' | 'phoneNormalized' | 'phoneDisplay' | 'fullName' | 'language'> | null;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) return { uid: null, matchedUser: null };

  // 1. Exact UID match in users list
  const byUid = users.find((u) => u.uid === trimmed);
  if (byUid) {
    return { uid: byUid.uid, matchedUser: byUid };
  }

  // 2. Iraqi phone number match
  const normalizedPhone = normalizeIraqiPhone(trimmed);
  if (normalizedPhone.valid) {
    const byPhone = users.find(
      (u) => u.phoneNormalized === normalizedPhone.phoneNormalized
    );
    if (byPhone) {
      return { uid: byPhone.uid, matchedUser: byPhone };
    }
    return { uid: null, matchedUser: null };
  }

  // 3. Otherwise treat as raw Firebase UID if valid ID pattern
  if (/^[a-zA-Z0-9_\-]{6,128}$/.test(trimmed)) {
    return { uid: trimmed, matchedUser: null };
  }

  return { uid: null, matchedUser: null };
}
