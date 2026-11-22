import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS } from '../i18n/translations';
import type { Category, OrderRecord, Product } from '../types/grocery';
import {
  applyBulkPricePercent,
  buildCustomerConfirmationWhatsAppUrl,
  buildDeliveredThankYouWhatsAppUrl,
  computeCustomerLifetimeSavingsFromOrders,
  computeOrderReportMetrics,
  generateProductsCsv,
  generateProductsCsvTemplate,
  getAccessibleContrastText,
  getVisibleAdminTabs,
  isProductInStock,
  matchesProductSectionFlag,
  mergeCmsTranslations,
  parseProductsCsv,
} from './adminLogic';

const mockCategories: Category[] = [
  {
    id: 'produce',
    nameKu: 'سەوزە و میوە',
    nameAr: 'خضار وفواكه',
    nameEn: 'Fresh Produce',
    icon: '🍅',
    subcategories: [],
    sortOrder: 1,
    isActive: true,
  },
];

const mockProducts: Product[] = [
  {
    id: 'p-1',
    categoryId: 'produce',
    subcategoryId: 'vegetables',
    nameKu: 'تەماتە',
    nameAr: 'طماطم',
    nameEn: 'Tomatoes',
    size: '1 kg',
    ourPrice: 1000,
    marketPrice: 1500,
    imageUrl: '/img/a.jpg',
    section: 'deals',
    inStock: true,
    showInDeals: true,
    showInPopular: false,
    isNew: false,
    isActive: true,
  },
  {
    id: 'p-2',
    categoryId: 'produce',
    subcategoryId: 'fruits',
    nameKu: 'هەنار',
    nameAr: 'رمان',
    nameEn: 'Pomegranates',
    size: '1.5 kg',
    ourPrice: 2000,
    marketPrice: 2500,
    imageUrl: '/img/b.jpg',
    section: 'new',
    inStock: false,
    showInDeals: false,
    showInPopular: true,
    isNew: true,
    isActive: true,
  },
];

test('RBAC tab visibility restricts staff strictly to orders and products', () => {
  assert.deepEqual(getVisibleAdminTabs('staff'), ['orders', 'products']);
  const ownerTabs = getVisibleAdminTabs('owner');
  assert.equal(ownerTabs.length, 9);
  assert.ok(ownerTabs.includes('reports'));
  assert.ok(ownerTabs.includes('audit'));
  assert.ok(ownerTabs.includes('admins'));
});

test('inStock and section flags drive storefront filtering accurately', () => {
  assert.equal(isProductInStock(mockProducts[0]), true);
  assert.equal(isProductInStock(mockProducts[1]), false);
  assert.equal(matchesProductSectionFlag(mockProducts[0], 'deals'), true);
  assert.equal(matchesProductSectionFlag(mockProducts[1], 'popular'), true);
  assert.equal(matchesProductSectionFlag(mockProducts[1], 'new'), true);
});

test('mergeCmsTranslations overrides non-empty fields and ignores blank fields safely', () => {
  const merged = mergeCmsTranslations(
    TRANSLATIONS.ku,
    {
      tagline: { ku: 'باشترین سوپەرمارکێتی هەولێر' },
      storeClosedTitle: { ku: '   ' },
      deliveredThankYouTitle: { ku: 'سوپاس بۆ داواکارییەکەت!' },
      deliveredThankYouBody: { ku: 'پاشەکەوتی ئەم داواکارییە: {orderSavings} د.ع' },
    },
    'ku'
  );
  assert.equal(merged.footer.tagline, 'باشترین سوپەرمارکێتی هەولێر');
  assert.equal(
    merged.storefront.storeClosedTitle,
    TRANSLATIONS.ku.storefront.storeClosedTitle
  );
  assert.equal(merged.retention.thankYouTitle, 'سوپاس بۆ داواکارییەکەت!');
  assert.equal(
    merged.retention.thankYouBody,
    'پاشەکەوتی ئەم داواکارییە: {orderSavings} د.ع'
  );
});

test('getAccessibleContrastText selects readable foreground for light and dark brand colors', () => {
  assert.equal(getAccessibleContrastText('#15663C'), '#FFFFFF');
  assert.equal(getAccessibleContrastText('#FACC15'), '#141A15');
});

test('applyBulkPricePercent rounds adjusted IQD prices to nearest 250 IQD', () => {
  const drafts = applyBulkPricePercent(
    mockProducts,
    new Set(['p-1']),
    'ourPrice',
    10
  );
  // 1000 * 1.1 = 1100 -> nearest 250 = 1000; try +25% => 1250
  const drafts25 = applyBulkPricePercent(
    mockProducts,
    new Set(['p-1']),
    'ourPrice',
    25
  );
  assert.equal(drafts['p-1'].ourPrice, 1000);
  assert.equal(drafts25['p-1'].ourPrice, 1250);
  assert.equal(drafts25['p-2'], undefined);
});

test('CSV export includes UTF-8 BOM and parseProductsCsv classifies new, update, and invalid rows', () => {
  const template = generateProductsCsvTemplate();
  assert.ok(template.startsWith('\uFEFF'), 'Template must include UTF-8 BOM');

  const exported = generateProductsCsv(mockProducts);
  assert.ok(exported.startsWith('\uFEFF'), 'Export must include UTF-8 BOM');

  const mixedCsv = [
    exported.trim(),
    'p-new-1,خەیار,خيار,Cucumbers,produce,vegetables,1 kg,1250,1500,Checked,true,false,true,true,true,/img/c.jpg',
    'bad id!,ناو,اسم,Bad,unknown_cat,sub,1kg,-50,100,,true,false,false,false,true,',
  ].join('\r\n');

  const preview = parseProductsCsv(mixedCsv, mockCategories, mockProducts);
  assert.equal(preview.updateCount, 2);
  assert.equal(preview.newCount, 1);
  assert.equal(preview.invalidCount, 1);
  assert.ok(preview.rows[3].errors.length >= 2);
});

test('computeOrderReportMetrics calculates revenue, fake rate, savings, AOV, and top products', () => {
  const now = Date.UTC(2026, 10, 19, 10, 0, 0);
  const orders: OrderRecord[] = [
    {
      id: 'o1',
      orderNumber: 'SM-1001',
      userId: 'u1',
      customerName: 'Dara',
      phoneDisplay: '0750 111 2222',
      phoneNormalized: '9647501112222',
      addressText: 'Empire',
      buildingNotes: '',
      gps: null,
      googleMapsUrl: '',
      items: [
        {
          productId: 'p-1',
          nameKu: 'تەماتە',
          nameAr: 'طماطم',
          nameEn: 'Tomatoes',
          size: '1 kg',
          quantity: 3,
          ourPrice: 1000,
          marketPrice: 1500,
          lineTotal: 3000,
        },
      ],
      subtotal: 3000,
      totalSavings: 1500,
      deliveryFee: 2000,
      grandTotal: 5000,
      status: 'Delivered',
      createdAtMs: now,
      updatedAtMs: now,
    },
    {
      id: 'o2',
      orderNumber: 'SM-1002',
      userId: 'u2',
      customerName: 'Fake User',
      phoneDisplay: '0750 999 8888',
      phoneNormalized: '9647509998888',
      addressText: 'Unknown',
      buildingNotes: '',
      gps: null,
      googleMapsUrl: '',
      items: [
        {
          productId: 'p-2',
          nameKu: 'هەنار',
          nameAr: 'رمان',
          nameEn: 'Pomegranates',
          size: '1.5 kg',
          quantity: 5,
          ourPrice: 2000,
          marketPrice: 2500,
          lineTotal: 10000,
        },
      ],
      subtotal: 10000,
      totalSavings: 2500,
      deliveryFee: 2000,
      grandTotal: 12000,
      status: 'Fake',
      createdAtMs: now,
      updatedAtMs: now,
    },
  ];

  const report = computeOrderReportMetrics(orders);
  assert.equal(report.totalOrders, 2);
  assert.equal(report.revenue, 5000); // excludes Fake
  assert.equal(report.fakeCount, 1);
  assert.equal(report.fakeRatePct, 50);
  assert.equal(report.totalSavingsDelivered, 1500);
  assert.equal(report.aov, 5000);
  assert.equal(report.topProducts.length, 1);
  assert.equal(report.topProducts[0].productId, 'p-1');

  const waUrl = buildCustomerConfirmationWhatsAppUrl(orders[0], 'ku');
  assert.ok(waUrl.startsWith('https://wa.me/9647501112222?text='));
  assert.ok(decodeURIComponent(waUrl).includes('SM-1001'));
});

test('computeCustomerLifetimeSavingsFromOrders and buildDeliveredThankYouWhatsAppUrl compute lifetime savings and format trilingual WhatsApp message', () => {
  const now = Date.UTC(2026, 10, 20, 12, 0, 0);
  const baseOrder: OrderRecord = {
    id: 'o1',
    orderNumber: 'SM-2001',
    userId: 'u-dara',
    customerName: 'Dara',
    phoneDisplay: '0750 111 2222',
    phoneNormalized: '9647501112222',
    addressText: 'Empire',
    buildingNotes: '',
    gps: null,
    googleMapsUrl: '',
    items: [],
    subtotal: 10000,
    totalSavings: 2000,
    deliveryFee: 2000,
    grandTotal: 12000,
    status: 'Delivered',
    createdAtMs: now,
    updatedAtMs: now,
  };

  const orders: OrderRecord[] = [
    baseOrder,
    {
      ...baseOrder,
      id: 'o2',
      orderNumber: 'SM-2002',
      userId: 'other-uid-same-phone',
      totalSavings: 3500,
      status: 'Delivered',
    },
    {
      ...baseOrder,
      id: 'o3',
      orderNumber: 'SM-2003',
      totalSavings: 4000,
      status: 'Confirmed',
    },
    {
      ...baseOrder,
      id: 'o4',
      orderNumber: 'SM-2004',
      userId: 'u-other',
      phoneNormalized: '9647509998888',
      totalSavings: 7000,
      status: 'Delivered',
    },
  ];

  const agg = computeCustomerLifetimeSavingsFromOrders(orders, baseOrder);
  assert.deepEqual(agg, { lifetimeSavings: 5500, deliveredOrderCount: 2 });

  const enUrl = buildDeliveredThankYouWhatsAppUrl({
    order: baseOrder,
    lifetimeSavings: agg.lifetimeSavings,
    deliveredOrderCount: agg.deliveredOrderCount,
    lang: 'en',
  });
  assert.ok(enUrl.startsWith('https://wa.me/9647501112222?text='));
  const decodedEn = decodeURIComponent(enUrl.split('?text=')[1]);
  assert.ok(decodedEn.includes('Thank you, Dara — hope you love your order!'));
  assert.ok(decodedEn.includes('2,000 IQD'));
  assert.ok(decodedEn.includes('5,500 IQD'));

  const arUrl = buildDeliveredThankYouWhatsAppUrl({
    order: { ...baseOrder, customerName: '' },
    lifetimeSavings: agg.lifetimeSavings,
    deliveredOrderCount: agg.deliveredOrderCount,
    lang: 'ar',
  });
  const decodedAr = decodeURIComponent(arUrl.split('?text=')[1]);
  assert.ok(decodedAr.includes('وصلت أغراضك بالسلامة، شكراً لك!'));

  const customKuUrl = buildDeliveredThankYouWhatsAppUrl({
    order: baseOrder,
    lifetimeSavings: agg.lifetimeSavings,
    deliveredOrderCount: agg.deliveredOrderCount,
    lang: 'ku',
    customBodyTemplate: 'داواکاری #{orderNumber} · {orderSavings} · {lifetimeSavings}',
  });
  const decodedKu = decodeURIComponent(customKuUrl.split('?text=')[1]);
  assert.ok(decodedKu.includes('سوپاس Dara، بە خۆشی بەکاریبهێنن!'));
  assert.ok(decodedKu.includes('SM-2001 · 2,000 · 5,500'));
});

