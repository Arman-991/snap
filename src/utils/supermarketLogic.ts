import type {
  CartItem,
  GpsCoordinates,
  Language,
  LiveCartSummary,
  OrderRecord,
  OrderStatus,
  Product,
  ProfileFormInput,
  ProfileValidationErrors,
  ResolvedCartLine,
  StoreSettings,
} from '../types/grocery';

export const MAX_CART_QUANTITY = 50;

export function normalizeDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0));
}

export interface NormalizedIraqiPhoneResult {
  valid: boolean;
  phoneNormalized: string;
  phoneDisplay: string;
}

/**
 * Accepts Iraqi local mobile numbers (0750..., 0770..., 0780..., 0790...)
 * or international (+9647..., 009647..., 9647...) in Western, Arabic, or Kurdish digits.
 * Normalizes valid numbers to 13 digits: 9647XXXXXXXXX.
 */
export function normalizeIraqiPhone(raw: string): NormalizedIraqiPhoneResult {
  const western = normalizeDigits(raw).trim();
  const digitsOnly = western.replace(/[^\d]/g, '');

  let subscriber10 = '';
  if (digitsOnly.startsWith('00964')) {
    subscriber10 = digitsOnly.slice(5);
  } else if (digitsOnly.startsWith('964')) {
    subscriber10 = digitsOnly.slice(3);
  } else if (digitsOnly.startsWith('0')) {
    subscriber10 = digitsOnly.slice(1);
  } else {
    subscriber10 = digitsOnly;
  }

  // Must be 10 digits starting with 7 (Iraqi mobile prefixes: 075x, 077x, 078x, 079x, etc.)
  if (!/^7\d{9}$/.test(subscriber10)) {
    return {
      valid: false,
      phoneNormalized: '',
      phoneDisplay: western,
    };
  }

  const phoneNormalized = `964${subscriber10}`;
  const localFormatted = `0${subscriber10.slice(0, 3)} ${subscriber10.slice(3, 6)} ${subscriber10.slice(6)}`;

  return {
    valid: true,
    phoneNormalized,
    phoneDisplay: localFormatted,
  };
}

/**
 * Normalizes Kurdish Sorani, Arabic, and English strings so keyboard variants
 * (ی/ي/ى, ک/ك, ە/ه/ة, diacritics, Alef forms) match reliably during search.
 */
export function normalizeSearchText(input: string): string {
  return normalizeDigits(input)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // strip Arabic/Kurdish diacritics + tatweel
    .replace(/[یيێى]/g, 'ي')
    .replace(/[کك]/g, 'ك')
    .replace(/[ەهة]/g, 'ه')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ۆؤ]/g, 'و')
    .replace(/ڕ/g, 'ر')
    .replace(/ڵ/g, 'ل')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesProductSearch(product: Product, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  const haystack = normalizeSearchText(
    `${product.nameKu} ${product.nameAr} ${product.nameEn} ${product.size}`
  );
  if (haystack.includes(query)) return true;

  // Allow casual Kurdish/Arabic typing where internal vowel ە/ه is omitted (e.g. تماته -> تەماتە)
  const relaxedQuery = query.replace(/ه/g, '');
  if (relaxedQuery.length >= 2) {
    const relaxedHaystack = haystack.replace(/ه/g, '');
    if (relaxedHaystack.includes(relaxedQuery)) return true;
  }

  return false;
}

export function sanitizeCartQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.min(Math.floor(quantity), MAX_CART_QUANTITY);
}

export function updateCartItems(
  items: CartItem[],
  productId: string,
  nextQuantity: number
): CartItem[] {
  const safeQty = sanitizeCartQuantity(nextQuantity);
  const exists = items.some((entry) => entry.productId === productId);

  if (safeQty === 0) {
    return exists ? items.filter((entry) => entry.productId !== productId) : items;
  }

  if (!exists) {
    return [...items, { productId, quantity: safeQty }];
  }

  return items.map((entry) =>
    entry.productId === productId ? { ...entry, quantity: safeQty } : entry
  );
}

export function isProductOrderable(product: Product | undefined): product is Product {
  return Boolean(product && product.isActive && product.inStock !== false);
}

export function resolveLiveCartLines(
  items: CartItem[],
  productsMap: Map<string, Product>
): ResolvedCartLine[] {
  const lines: ResolvedCartLine[] = [];

  for (const item of items) {
    const product = productsMap.get(item.productId);
    if (!isProductOrderable(product)) continue;
    const qty = sanitizeCartQuantity(item.quantity);
    if (qty <= 0) continue;

    const unitSavings = Math.max(0, product.marketPrice - product.ourPrice);
    lines.push({
      product,
      quantity: qty,
      lineTotal: product.ourPrice * qty,
      lineSavings: unitSavings * qty,
    });
  }

  return lines;
}

export function reorderCartItemsFromLiveCatalog(
  currentCart: CartItem[],
  previousOrderItems: Array<{ productId: string; quantity: number }>,
  productsMap: Map<string, Product>
): { nextCart: CartItem[]; addedCount: number; skippedCount: number } {
  let nextCart = [...currentCart];
  let addedCount = 0;
  let skippedCount = 0;

  for (const entry of previousOrderItems) {
    const liveProduct = productsMap.get(entry.productId);
    if (isProductOrderable(liveProduct)) {
      const existingQty =
        nextCart.find((c) => c.productId === entry.productId)?.quantity ?? 0;
      nextCart = updateCartItems(nextCart, entry.productId, existingQty + entry.quantity);
      addedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  return { nextCart, addedCount, skippedCount };
}

/**
 * Returns true when a cart contains the exact same productIds and quantities as an order.
 * Used to automatically clear stale carts left over from Confirmed/Delivered orders.
 */
export function doesCartMatchOrder(
  cart: CartItem[],
  orderItems: Array<{ productId: string; quantity: number }>
): boolean {
  if (cart.length === 0 || orderItems.length === 0) return false;

  const cartCounts = new Map<string, number>();
  for (const c of cart) {
    const qty = sanitizeCartQuantity(c.quantity);
    if (qty > 0) {
      cartCounts.set(c.productId, (cartCounts.get(c.productId) ?? 0) + qty);
    }
  }

  const orderCounts = new Map<string, number>();
  for (const item of orderItems) {
    const qty = sanitizeCartQuantity(item.quantity);
    if (qty > 0) {
      orderCounts.set(item.productId, (orderCounts.get(item.productId) ?? 0) + qty);
    }
  }

  if (cartCounts.size === 0 || cartCounts.size !== orderCounts.size) return false;
  for (const [productId, qty] of cartCounts) {
    if (orderCounts.get(productId) !== qty) return false;
  }
  return true;
}

/**
 * Returns true if the customer's saved cart still contains any item from the given order.
 */
export function cartOverlapsOrder(
  cart: CartItem[],
  orderItems: Array<{ productId: string; quantity: number }>
): boolean {
  if (cart.length === 0 || orderItems.length === 0) return false;
  const orderIds = new Set(orderItems.map((i) => i.productId));
  return cart.some((c) => sanitizeCartQuantity(c.quantity) > 0 && orderIds.has(c.productId));
}

/**
 * Returns true when the customer has a Confirmed or Delivered order whose items
 * match the current cart, indicating a stale cart that should be cleared on app load.
 */
export function hasStaleCartFromOrders(
  cart: CartItem[],
  orders: Array<{
    status: OrderStatus;
    items: Array<{ productId: string; quantity: number }>;
  }>
): boolean {
  if (cart.length === 0) return false;
  return orders.some(
    (order) =>
      (order.status === 'Confirmed' || order.status === 'Delivered') &&
      doesCartMatchOrder(cart, order.items)
  );
}

export function formatOrderAlertText(template: string, orderNumber: string): string {
  return template.replaceAll('{orderNumber}', orderNumber);
}

export interface LifetimeSavingsSummary {
  lifetimeSavings: number;
  deliveredOrderCount: number;
}

/**
 * Computes a customer's lifetime savings across all Delivered orders
 * (summing positive totalSavings and counting Delivered orders).
 */
export function computeLifetimeSavings(
  orders: Array<{ status: OrderStatus; totalSavings: number }>
): LifetimeSavingsSummary {
  let lifetimeSavings = 0;
  let deliveredOrderCount = 0;

  for (const order of orders) {
    if (order.status !== 'Delivered') continue;
    deliveredOrderCount += 1;
    if (Number.isFinite(order.totalSavings) && order.totalSavings > 0) {
      lifetimeSavings += Math.round(order.totalSavings);
    }
  }

  return {
    lifetimeSavings,
    deliveredOrderCount,
  };
}

export function extractFirstName(fullName?: string | null): string {
  const cleaned = (fullName ?? '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.split(' ')[0] ?? '';
}

export function formatDeliveredThankYouTemplate(
  template: string,
  params: {
    name?: string | null;
    orderNumber: string;
    orderSavings: number;
    lifetimeSavings: number;
  }
): string {
  const firstName = extractFirstName(params.name);
  const orderSavingsFmt = formatIqdNumber(Math.max(0, params.orderSavings));
  const lifetimeSavingsFmt = formatIqdNumber(Math.max(0, params.lifetimeSavings));

  let result = template
    .replaceAll('{orderNumber}', params.orderNumber)
    .replaceAll('{orderSavings}', orderSavingsFmt)
    .replaceAll('{lifetimeSavings}', lifetimeSavingsFmt);

  if (firstName) {
    result = result.replaceAll('{name}', firstName);
  } else {
    // Gracefully remove name placeholders and tidy surrounding punctuation in KU, AR, EN
    result = result
      .replaceAll('، شكراً يا {name}', '، شكراً لك')
      .replaceAll(' يا {name}', '')
      .replaceAll(' {name}،', '،')
      .replaceAll('، {name}', '')
      .replaceAll(', {name}', '')
      .replaceAll(' {name}', '')
      .replaceAll('{name}', '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return result;
}

export function formatLifetimeSavingsSummary(
  template: string,
  lifetimeSavings: number,
  deliveredOrderCount: number
): string {
  return template
    .replaceAll('{amount}', formatIqdNumber(Math.max(0, lifetimeSavings)))
    .replaceAll('{count}', String(Math.max(0, Math.floor(deliveredOrderCount))));
}

export interface UnseenDeliveredOrderResult<
  T extends {
    id: string;
    status: OrderStatus;
    totalSavings: number;
    createdAtMs: number;
    updatedAtMs: number;
  },
> {
  mostRecentUnseen: T | null;
  allUnseenDelivered: T[];
  lifetimeSavings: number;
  deliveredOrderCount: number;
}

/**
 * State-based mobile-reliable check: scans ALL Delivered orders (never relying
 * on a live status diff, since mobile browsers pause background tabs) and returns
 * the most recent Delivered order whose id is not yet in seenDeliveredPopupIds.
 */
export function findUnseenDeliveredOrder<
  T extends {
    id: string;
    status: OrderStatus;
    totalSavings: number;
    createdAtMs: number;
    updatedAtMs: number;
  },
>(orders: T[], seenDeliveredPopupIds: Set<string>): UnseenDeliveredOrderResult<T> {
  const { lifetimeSavings, deliveredOrderCount } = computeLifetimeSavings(orders);

  const unseen = orders
    .filter(
      (order) =>
        order.status === 'Delivered' && !seenDeliveredPopupIds.has(order.id)
    )
    .sort(
      (a, b) =>
        (b.updatedAtMs || b.createdAtMs || 0) -
        (a.updatedAtMs || a.createdAtMs || 0)
    );

  return {
    mostRecentUnseen: unseen[0] ?? null,
    allUnseenDelivered: unseen,
    lifetimeSavings,
    deliveredOrderCount,
  };
}

export interface OrderCartClearDecision {
  shouldClearCart: boolean;
  newlyClearedOrderIds: string[];
}

/**
 * Evaluates live customer orders to decide whether the customer session should
 * clear its own cart (on New, Confirmed, or Delivered), strictly guarded so:
 * - Each order ID triggers an automatic clear at most once (never wiping a new
 *   cart the customer builds afterward),
 * - A live transition into Confirmed/Delivered still clears stale leftover items
 *   matching that order unless the customer intentionally tapped "Order Again".
 */
export function evaluateOrdersForCartClear(params: {
  orders: Array<{
    id: string;
    status: OrderStatus;
    items: Array<{ productId: string; quantity: number }>;
  }>;
  currentCartItems: CartItem[];
  clearedOrderIds: Set<string>;
  reorderedOrderIds: Set<string>;
  prevOrderStatuses: Map<string, OrderStatus> | null;
}): OrderCartClearDecision {
  const {
    orders,
    currentCartItems,
    clearedOrderIds,
    reorderedOrderIds,
    prevOrderStatuses,
  } = params;

  const newlyClearedOrderIds: string[] = [];
  let shouldClearCart = false;

  for (const order of orders) {
    const isClearableStatus =
      order.status === 'New' ||
      order.status === 'Confirmed' ||
      order.status === 'Delivered';

    if (!isClearableStatus) continue;

    // 1. First time seeing this order ID in New / Confirmed / Delivered
    if (!clearedOrderIds.has(order.id)) {
      newlyClearedOrderIds.push(order.id);
      if (!reorderedOrderIds.has(order.id)) {
        shouldClearCart = true;
      }
      continue;
    }

    // 2. Order ID was already processed once; if it just transitioned into
    // Confirmed or Delivered while the cart STILL holds matching leftover items
    // (and user did not intentionally reorder), clear those stale items.
    if (
      prevOrderStatuses !== null &&
      (order.status === 'Confirmed' || order.status === 'Delivered') &&
      prevOrderStatuses.get(order.id) !== order.status &&
      !reorderedOrderIds.has(order.id)
    ) {
      if (
        currentCartItems.length === 0 ||
        doesCartMatchOrder(currentCartItems, order.items)
      ) {
        shouldClearCart = true;
      }
    }
  }

  return {
    shouldClearCart,
    newlyClearedOrderIds,
  };
}

export function calculateLiveCartSummary(
  lines: ResolvedCartLine[],
  settings: Pick<StoreSettings, 'deliveryFee' | 'minimumOrder'>
): LiveCartSummary {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totalSavings = lines.reduce((sum, line) => sum + line.lineSavings, 0);
  const deliveryFee = itemCount === 0 ? 0 : Math.max(0, settings.deliveryFee);
  const grandTotal = subtotal + deliveryFee;
  const minimumOrder = Math.max(0, settings.minimumOrder);
  const meetsMinimumOrder = subtotal >= minimumOrder;
  const remainingForMinimum = Math.max(0, minimumOrder - subtotal);

  return {
    itemCount,
    subtotal,
    totalSavings,
    deliveryFee,
    grandTotal,
    minimumOrder,
    meetsMinimumOrder,
    remainingForMinimum,
  };
}

export function validateProfileForm(
  input: ProfileFormInput
): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  const trimmedName = input.fullName.trim();
  if (!trimmedName) {
    errors.fullName = 'required';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'too_short';
  }

  const trimmedPhone = input.phoneInput.trim();
  if (!trimmedPhone) {
    errors.phoneInput = 'required';
  } else if (!normalizeIraqiPhone(trimmedPhone).valid) {
    errors.phoneInput = 'invalid_iraqi';
  }

  const trimmedAddress = input.addressText.trim();
  if (!trimmedAddress) {
    errors.addressText = 'required';
  } else if (trimmedAddress.length < 3) {
    errors.addressText = 'too_short';
  }

  return errors;
}

export function buildGoogleMapsUrl(gps: GpsCoordinates | null): string {
  if (!gps) return '';
  return `https://maps.google.com/?q=${gps.lat.toFixed(6)},${gps.lng.toFixed(6)}`;
}

export function checkHourlyOrderRateLimit(
  recentTimestampsMs: number[],
  nowMs: number,
  maxOrdersPerHour: number
): { allowed: boolean; activeTimestampsMs: number[] } {
  const oneHourAgo = nowMs - 60 * 60 * 1000;
  const activeTimestampsMs = recentTimestampsMs.filter(
    (ts) => Number.isFinite(ts) && ts > oneHourAgo && ts <= nowMs + 60_000
  );
  // Setting maxOrdersPerHour to 0 disables the hourly order limit completely
  if (!Number.isFinite(maxOrdersPerHour) || maxOrdersPerHour <= 0) {
    return {
      allowed: true,
      activeTimestampsMs,
    };
  }
  return {
    allowed: activeTimestampsMs.length < Math.floor(maxOrdersPerHour),
    activeTimestampsMs,
  };
}

export function mapCustomerVisibleStatus(
  status: OrderStatus
): Exclude<OrderStatus, 'Fake'> {
  return status === 'Fake' ? 'Cancelled' : status;
}

export function generateShortOrderNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SM-${num}`;
}

export function formatIqdNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function buildWhatsAppOrderMessage(
  order: OrderRecord,
  lang: Language
): string {
  const itemLines = order.items.map((item) => {
    const name =
      lang === 'ku' ? item.nameKu : lang === 'ar' ? item.nameAr : item.nameEn;
    return `${item.quantity} x ${name} (${item.size}) — ${formatIqdNumber(item.lineTotal)} IQD`;
  });

  const addressLine = order.buildingNotes
    ? `${order.addressText} (${order.buildingNotes})`
    : order.addressText;

  const lines: string[] = [
    `Order ID: ${order.orderNumber}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phoneDisplay} (${order.phoneNormalized})`,
    `Neighborhood / Landmark: ${addressLine}`,
  ];

  if (order.googleMapsUrl) {
    lines.push(`Google Maps: ${order.googleMapsUrl}`);
  }

  lines.push('', 'Items:', ...itemLines, '');
  lines.push(`Subtotal: ${formatIqdNumber(order.subtotal)} IQD`);
  if (order.totalSavings > 0) {
    lines.push(`Savings: ${formatIqdNumber(order.totalSavings)} IQD`);
  }
  lines.push(`Delivery Fee: ${formatIqdNumber(order.deliveryFee)} IQD`);
  lines.push(`Grand Total (Cash on Delivery): ${formatIqdNumber(order.grandTotal)} IQD`);

  return lines.join('\n');
}

export function buildWhatsAppUrl(
  whatsappPhone: string,
  order: OrderRecord,
  lang: Language
): string {
  const cleanPhone = normalizeDigits(whatsappPhone).replace(/[^\d]/g, '');
  const message = buildWhatsAppOrderMessage(order, lang);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
