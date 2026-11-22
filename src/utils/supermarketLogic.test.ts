import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsUrl,
  buildWhatsAppUrl,
  calculateLiveCartSummary,
  cartOverlapsOrder,
  checkHourlyOrderRateLimit,
  computeLifetimeSavings,
  doesCartMatchOrder,
  evaluateOrdersForCartClear,
  extractFirstName,
  findUnseenDeliveredOrder,
  formatDeliveredThankYouTemplate,
  formatLifetimeSavingsSummary,
  formatOrderAlertText,
  hasStaleCartFromOrders,
  mapCustomerVisibleStatus,
  matchesProductSearch,
  normalizeIraqiPhone,
  normalizeSearchText,
  reorderCartItemsFromLiveCatalog,
  resolveLiveCartLines,
  updateCartItems,
  validateProfileForm,
} from './supermarketLogic';
import type { OrderRecord, Product } from '../types/grocery';

const sampleProducts: Product[] = [
  {
    id: 'p-tomato',
    categoryId: 'produce',
    subcategoryId: 'vegetables',
    nameKu: 'تەماتەی لقی هەولێر',
    nameAr: 'طماطم عنقودية أربيل',
    nameEn: 'Erbil Vine Tomatoes',
    size: '1 kg',
    ourPrice: 1250,
    marketPrice: 1750,
    imageUrl: '/tomato.jpg',
    section: 'deals',
    isActive: true,
  },
  {
    id: 'p-bread',
    categoryId: 'bakery',
    subcategoryId: 'flatbread',
    nameKu: 'نانی گەرمی کونجی',
    nameAr: 'خبز تنور بالسمسم',
    nameEn: 'Sesame Flatbread',
    size: '3 pcs',
    ourPrice: 1000,
    marketPrice: 1000,
    imageUrl: '/bread.jpg',
    section: 'popular',
    isActive: true,
  },
  {
    id: 'p-archived',
    categoryId: 'bakery',
    subcategoryId: 'flatbread',
    nameKu: 'بەرهەمی ناچالاک',
    nameAr: 'منتج غير نشط',
    nameEn: 'Inactive Item',
    size: '1 pc',
    ourPrice: 5000,
    marketPrice: 6000,
    imageUrl: '/x.jpg',
    section: 'new',
    isActive: false,
  },
];

test('normalizeIraqiPhone parses local, international, and Kurdish/Arabic digits', () => {
  assert.deepEqual(normalizeIraqiPhone('0750 123 4567'), {
    valid: true,
    phoneNormalized: '9647501234567',
    phoneDisplay: '0750 123 4567',
  });
  assert.deepEqual(normalizeIraqiPhone('+9647709876543'), {
    valid: true,
    phoneNormalized: '9647709876543',
    phoneDisplay: '0770 987 6543',
  });
  assert.deepEqual(normalizeIraqiPhone('٠٧٨٠ ١١١ ٢٢٢٢'), {
    valid: true,
    phoneNormalized: '9647801112222',
    phoneDisplay: '0780 111 2222',
  });
  // Kurdish/Persian extended digits ۰-۹ with +964 prefix and dashes/spaces
  assert.deepEqual(normalizeIraqiPhone('+۹۶۴ ۷۵۰-۴۴۴ ۵۵۶۶'), {
    valid: true,
    phoneNormalized: '9647504445566',
    phoneDisplay: '0750 444 5566',
  });
  assert.equal(normalizeIraqiPhone('0662123456').valid, false);
  assert.equal(normalizeIraqiPhone('0750123').valid, false);
});

test('normalizeSearchText bridges Kurdish and Arabic keyboard variants', () => {
  assert.equal(normalizeSearchText('تەماتەی'), normalizeSearchText('تهماتهي'));
  assert.equal(normalizeSearchText('کەرە'), normalizeSearchText('كهره'));
  assert.equal(matchesProductSearch(sampleProducts[0], 'تماته'), true);
  assert.equal(matchesProductSearch(sampleProducts[0], 'تەماتە'), true);
  assert.equal(matchesProductSearch(sampleProducts[0], 'أربيل'), true);
  assert.equal(matchesProductSearch(sampleProducts[0], 'اربيل'), true);
  assert.equal(matchesProductSearch(sampleProducts[0], 'tomato'), true);
});

test('calculateLiveCartSummary uses live prices, ignores inactive items, and computes exact savings', () => {
  const map = new Map(sampleProducts.map((p) => [p.id, p]));
  let cart = updateCartItems([], 'p-tomato', 2);
  cart = updateCartItems(cart, 'p-bread', 1);
  cart = updateCartItems(cart, 'p-archived', 3);

  const lines = resolveLiveCartLines(cart, map);
  assert.equal(lines.length, 2);

  const summary = calculateLiveCartSummary(lines, {
    deliveryFee: 2500,
    minimumOrder: 10000,
  });

  assert.equal(summary.itemCount, 3);
  assert.equal(summary.subtotal, 3500); // 2*1250 + 1*1000
  assert.equal(summary.totalSavings, 1000); // 2*(1750-1250) + 0
  assert.equal(summary.deliveryFee, 2500);
  assert.equal(summary.grandTotal, 6000);
  assert.equal(summary.meetsMinimumOrder, false);
  assert.equal(summary.remainingForMinimum, 6500);

  // Zero savings when marketPrice === ourPrice
  const breadOnly = resolveLiveCartLines([{ productId: 'p-bread', quantity: 2 }], map);
  const breadSummary = calculateLiveCartSummary(breadOnly, {
    deliveryFee: 2000,
    minimumOrder: 1500,
  });
  assert.equal(breadSummary.totalSavings, 0);
  assert.equal(breadSummary.meetsMinimumOrder, true);
});

test('checkHourlyOrderRateLimit enforces maxOrdersPerHour within rolling 60-minute window', () => {
  const now = 1_700_000_000_000;
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const tenMinAgo = now - 10 * 60 * 1000;

  const allowedResult = checkHourlyOrderRateLimit(
    [twoHoursAgo, tenMinAgo, now - 5 * 60 * 1000],
    now,
    3
  );
  assert.equal(allowedResult.allowed, true);
  assert.equal(allowedResult.activeTimestampsMs.length, 2);

  const blockedResult = checkHourlyOrderRateLimit(
    [tenMinAgo, now - 20 * 60 * 1000, now - 1 * 60 * 1000],
    now,
    3
  );
  assert.equal(blockedResult.allowed, false);

  // Setting maxOrdersPerHour to 0 disables rate limiting completely even with existing timestamps
  const disabledResult = checkHourlyOrderRateLimit(
    [tenMinAgo, now - 20 * 60 * 1000, now - 1 * 60 * 1000, now - 30_000],
    now,
    0
  );
  assert.equal(disabledResult.allowed, true);

  // Raising maxOrdersPerHour applies immediately against existing timestamps without clearing them
  const raisedLimitResult = checkHourlyOrderRateLimit(
    [tenMinAgo, now - 20 * 60 * 1000, now - 1 * 60 * 1000],
    now,
    5
  );
  assert.equal(raisedLimitResult.allowed, true);
});

test('mapCustomerVisibleStatus maps Fake to Cancelled politely', () => {
  assert.equal(mapCustomerVisibleStatus('Fake'), 'Cancelled');
  assert.equal(mapCustomerVisibleStatus('Bought'), 'Bought');
});

test('buildGoogleMapsUrl and buildWhatsAppUrl format complete Cash on Delivery handoff', () => {
  const mapsUrl = buildGoogleMapsUrl({ lat: 36.191113, lng: 44.009167 });
  assert.equal(mapsUrl, 'https://maps.google.com/?q=36.191113,44.009167');

  const order: OrderRecord = {
    id: 'ord-1',
    orderNumber: 'SM-1042',
    userId: 'u1',
    customerName: 'Dara Karim',
    phoneDisplay: '0750 123 4567',
    phoneNormalized: '9647501234567',
    addressText: 'Empire World, Erbil',
    buildingNotes: 'Tower B, Apt 12',
    gps: { lat: 36.191113, lng: 44.009167 },
    googleMapsUrl: mapsUrl,
    items: [
      {
        productId: 'p-tomato',
        nameKu: 'تەماتەی لقی هەولێر',
        nameAr: 'طماطم عنقودية أربيل',
        nameEn: 'Erbil Vine Tomatoes',
        size: '1 kg',
        quantity: 2,
        ourPrice: 1250,
        marketPrice: 1750,
        lineTotal: 2500,
      },
    ],
    subtotal: 2500,
    totalSavings: 1000,
    deliveryFee: 2500,
    grandTotal: 5000,
    status: 'New',
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
  };

  const url = buildWhatsAppUrl('9647509998877', order, 'en');
  assert.equal(url.startsWith('https://wa.me/9647509998877?text='), true);
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.equal(decoded.includes('SM-1042'), true);
  assert.equal(decoded.includes('2 x Erbil Vine Tomatoes'), true);
  assert.equal(decoded.includes('https://maps.google.com/?q=36.191113,44.009167'), true);
  assert.equal(decoded.includes('5,000 IQD'), true);
});

test('validateProfileForm enforces required name, valid Iraqi mobile, and neighborhood', () => {
  const bad = validateProfileForm({
    fullName: 'A',
    phoneInput: '12345',
    addressText: '',
    buildingNotes: '',
    gps: null,
    language: 'ku',
  });
  assert.equal(bad.fullName, 'too_short');
  assert.equal(bad.phoneInput, 'invalid_iraqi');
  assert.equal(bad.addressText, 'required');

  const good = validateProfileForm({
    fullName: 'ئارەڤان محەمەد',
    phoneInput: '٠٧٥٠١٢٣٤٥٦٧',
    addressText: 'ئیمپایەر، هەولێر',
    buildingNotes: '',
    gps: null,
    language: 'ku',
  });
  assert.deepEqual(good, {});
});

test('Order Again uses live Firestore prices and skips out-of-stock or hidden items', () => {
  const liveCatalog: Product[] = [
    {
      ...sampleProducts[0],
      // Live price changed since the old order (was 1250, now 1500; marketPrice 2000)
      ourPrice: 1500,
      marketPrice: 2000,
      inStock: true,
      isActive: true,
    },
    {
      ...sampleProducts[1],
      // Marked out of stock by admin
      inStock: false,
      isActive: true,
    },
    // Hidden/inactive product
    sampleProducts[2],
  ];
  const map = new Map(liveCatalog.map((p) => [p.id, p]));

  const oldOrderItems = [
    { productId: 'p-tomato', quantity: 2 },
    { productId: 'p-bread', quantity: 1 },
    { productId: 'p-archived', quantity: 1 },
    { productId: 'p-deleted', quantity: 1 },
  ];

  const { nextCart, addedCount, skippedCount } = reorderCartItemsFromLiveCatalog(
    [],
    oldOrderItems,
    map
  );
  assert.equal(addedCount, 1);
  assert.equal(skippedCount, 3);
  assert.deepEqual(nextCart, [{ productId: 'p-tomato', quantity: 2 }]);

  const liveLines = resolveLiveCartLines(nextCart, map);
  assert.equal(liveLines.length, 1);
  assert.equal(liveLines[0].product.ourPrice, 1500);
  assert.equal(liveLines[0].lineTotal, 3000);
  assert.equal(liveLines[0].lineSavings, 1000);

  // Confirm savings <= 0 when ourPrice >= marketPrice
  const overMarketMap = new Map<string, Product>([
    [
      'p-tomato',
      { ...sampleProducts[0], ourPrice: 2200, marketPrice: 2000, inStock: true },
    ],
  ]);
  const noSavingsLines = resolveLiveCartLines([{ productId: 'p-tomato', quantity: 2 }], overMarketMap);
  const noSavingsSummary = calculateLiveCartSummary(noSavingsLines, {
    deliveryFee: 2000,
    minimumOrder: 1000,
  });
  assert.equal(noSavingsSummary.totalSavings, 0);
});

test('stale cart detection matches Confirmed and Delivered orders accurately', () => {
  const cart = [
    { productId: 'p-tomato', quantity: 2 },
    { productId: 'p-bread', quantity: 1 },
  ];
  const sameOrderReversed = [
    { productId: 'p-bread', quantity: 1 },
    { productId: 'p-tomato', quantity: 2 },
  ];
  const differentOrder = [{ productId: 'p-tomato', quantity: 1 }];

  assert.equal(doesCartMatchOrder(cart, sameOrderReversed), true);
  assert.equal(doesCartMatchOrder(cart, differentOrder), false);
  assert.equal(doesCartMatchOrder([], sameOrderReversed), false);

  assert.equal(cartOverlapsOrder(cart, differentOrder), true);
  assert.equal(cartOverlapsOrder(cart, [{ productId: 'p-other', quantity: 1 }]), false);

  // Should clear stale cart if Confirmed or Delivered order matches
  assert.equal(
    hasStaleCartFromOrders(cart, [
      { status: 'New', items: sameOrderReversed },
    ]),
    false
  );
  assert.equal(
    hasStaleCartFromOrders(cart, [
      { status: 'Confirmed', items: sameOrderReversed },
    ]),
    true
  );
  assert.equal(
    hasStaleCartFromOrders(cart, [
      { status: 'Delivered', items: sameOrderReversed },
    ]),
    true
  );
  assert.equal(
    hasStaleCartFromOrders(cart, [
      { status: 'Delivered', items: differentOrder },
    ]),
    false
  );

  // Alert message placeholder formatting
  assert.equal(
    formatOrderAlertText(
      'Order Accepted! Your order #{orderNumber} is confirmed and being prepared.',
      'SM-1042'
    ),
    'Order Accepted! Your order #SM-1042 is confirmed and being prepared.'
  );
});

test('evaluateOrdersForCartClear clears once per order ID on New/Confirmed/Delivered without wiping new carts', () => {
  const orderItems = [{ productId: 'p-tomato', quantity: 2 }];
  const newCartItems = [{ productId: 'p-bread', quantity: 3 }];

  // 1. Brand-new order in New status triggers a clear once
  const firstNew = evaluateOrdersForCartClear({
    orders: [{ id: 'ord-1', status: 'New', items: orderItems }],
    currentCartItems: orderItems,
    clearedOrderIds: new Set(),
    reorderedOrderIds: new Set(),
    prevOrderStatuses: null,
  });
  assert.equal(firstNew.shouldClearCart, true);
  assert.deepEqual(firstNew.newlyClearedOrderIds, ['ord-1']);

  // 2. Customer builds a brand-new cart while ord-1 is still New or transitions to Confirmed/Delivered
  const afterNewCart = evaluateOrdersForCartClear({
    orders: [{ id: 'ord-1', status: 'Delivered', items: orderItems }],
    currentCartItems: newCartItems,
    clearedOrderIds: new Set(['ord-1']),
    reorderedOrderIds: new Set(),
    prevOrderStatuses: new Map([['ord-1', 'Confirmed']]),
  });
  assert.equal(afterNewCart.shouldClearCart, false);
  assert.deepEqual(afterNewCart.newlyClearedOrderIds, []);

  // 3. Previously seen order transitioning to Delivered while stale matching items remain STILL clears
  const staleLeftover = evaluateOrdersForCartClear({
    orders: [{ id: 'ord-1', status: 'Delivered', items: orderItems }],
    currentCartItems: orderItems,
    clearedOrderIds: new Set(['ord-1']),
    reorderedOrderIds: new Set(),
    prevOrderStatuses: new Map([['ord-1', 'Confirmed']]),
  });
  assert.equal(staleLeftover.shouldClearCart, true);

  // 4. Intentional Order Again on ord-1 is NEVER wiped
  const reordered = evaluateOrdersForCartClear({
    orders: [{ id: 'ord-1', status: 'Delivered', items: orderItems }],
    currentCartItems: orderItems,
    clearedOrderIds: new Set(['ord-1']),
    reorderedOrderIds: new Set(['ord-1']),
    prevOrderStatuses: new Map([['ord-1', 'Confirmed']]),
  });
  assert.equal(reordered.shouldClearCart, false);
});

test('computeLifetimeSavings sums positive savings strictly across Delivered orders', () => {
  const summary = computeLifetimeSavings([
    { status: 'Delivered', totalSavings: 2500 },
    { status: 'Delivered', totalSavings: 1750 },
    { status: 'Delivered', totalSavings: 0 },
    { status: 'Confirmed', totalSavings: 9000 },
    { status: 'Fake', totalSavings: 4000 },
    { status: 'Cancelled', totalSavings: 1500 },
  ]);
  assert.deepEqual(summary, {
    lifetimeSavings: 4250,
    deliveredOrderCount: 3,
  });

  const empty = computeLifetimeSavings([{ status: 'New', totalSavings: 3000 }]);
  assert.deepEqual(empty, {
    lifetimeSavings: 0,
    deliveredOrderCount: 0,
  });

  assert.equal(
    formatLifetimeSavingsSummary(
      'Your total savings with us: {amount} IQD (across {count} orders)',
      4250,
      3
    ),
    'Your total savings with us: 4,250 IQD (across 3 orders)'
  );

  assert.equal(
    formatDeliveredThankYouTemplate(
      'Order #{orderNumber}: saved {orderSavings} IQD, total {lifetimeSavings} IQD.',
      { orderNumber: 'SM-1099', orderSavings: 1500, lifetimeSavings: 6000 }
    ),
    'Order #SM-1099: saved 1,500 IQD, total 6,000 IQD.'
  );

  assert.equal(extractFirstName('  Dara Karim  '), 'Dara');
  assert.equal(extractFirstName('   '), '');

  // Warm title formatting with name and graceful empty-name fallback in KU, AR, EN
  assert.equal(
    formatDeliveredThankYouTemplate('Thank you, {name} — hope you love your order!', {
      name: 'Dara Karim',
      orderNumber: 'SM-1099',
      orderSavings: 1500,
      lifetimeSavings: 6000,
    }),
    'Thank you, Dara — hope you love your order!'
  );
  assert.equal(
    formatDeliveredThankYouTemplate('Thank you, {name} — hope you love your order!', {
      name: '',
      orderNumber: 'SM-1099',
      orderSavings: 1500,
      lifetimeSavings: 6000,
    }),
    'Thank you — hope you love your order!'
  );
  assert.equal(
    formatDeliveredThankYouTemplate('سوپاس {name}، بە خۆشی بەکاریبهێنن!', {
      name: '',
      orderNumber: 'SM-1099',
      orderSavings: 1500,
      lifetimeSavings: 6000,
    }),
    'سوپاس، بە خۆشی بەکاریبهێنن!'
  );
  assert.equal(
    formatDeliveredThankYouTemplate('وصلت أغراضك بالسلامة، شكراً يا {name}!', {
      name: '',
      orderNumber: 'SM-1099',
      orderSavings: 1500,
      lifetimeSavings: 6000,
    }),
    'وصلت أغراضك بالسلامة، شكراً لك!'
  );
});

test('findUnseenDeliveredOrder returns most recent unseen Delivered order and full lifetime savings', () => {
  const result = findUnseenDeliveredOrder(
    [
      { id: 'ord-old', status: 'Delivered', totalSavings: 1500, createdAtMs: 1000, updatedAtMs: 2000 },
      { id: 'ord-seen', status: 'Delivered', totalSavings: 2500, createdAtMs: 3000, updatedAtMs: 9000 },
      { id: 'ord-newest', status: 'Delivered', totalSavings: 3000, createdAtMs: 4000, updatedAtMs: 5000 },
      { id: 'ord-active', status: 'Confirmed', totalSavings: 8000, createdAtMs: 6000, updatedAtMs: 10000 },
    ],
    new Set(['ord-seen'])
  );

  assert.equal(result.mostRecentUnseen?.id, 'ord-newest');
  assert.equal(result.allUnseenDelivered.length, 2);
  assert.equal(result.lifetimeSavings, 7000); // 1500 + 2500 + 3000
  assert.equal(result.deliveredOrderCount, 3);
});



