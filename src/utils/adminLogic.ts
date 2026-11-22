import type { TranslationDictionary } from '../i18n/translations';
import type {
  AdminRole,
  AdminTabId,
  Category,
  CmsTranslationsDoc,
  Language,
  OrderRecord,
  OrderStatus,
  Product,
  ProductSection,
} from '../types/grocery';
import { formatIqdNumber, normalizeDigits } from './supermarketLogic';

export const OWNER_TABS: AdminTabId[] = [
  'orders',
  'products',
  'categories',
  'customers',
  'home',
  'settings',
  'reports',
  'audit',
  'admins',
];

export const STAFF_TABS: AdminTabId[] = ['orders', 'products'];

export function getVisibleAdminTabs(role: AdminRole): AdminTabId[] {
  return role === 'owner' ? OWNER_TABS : STAFF_TABS;
}

export function isProductInStock(product: Product): boolean {
  return product.inStock !== false;
}

export function matchesProductSectionFlag(
  product: Product,
  section: ProductSection
): boolean {
  if (section === 'deals') {
    return product.showInDeals !== undefined
      ? product.showInDeals
      : product.section === 'deals';
  }
  if (section === 'popular') {
    return product.showInPopular !== undefined
      ? product.showInPopular
      : product.section === 'popular';
  }
  if (section === 'new') {
    return product.isNew !== undefined
      ? product.isNew
      : product.section === 'new';
  }
  return product.section === 'recommended' || (!product.showInDeals && !product.isNew);
}

function pickNonEmpty(override: string | undefined, fallback: string): string {
  const trimmed = override?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function mergeCmsTranslations(
  defaults: TranslationDictionary,
  overrides: CmsTranslationsDoc | null | undefined,
  lang: Language
): TranslationDictionary {
  if (!overrides) return defaults;

  return {
    ...defaults,
    storefront: {
      ...defaults.storefront,
      storeClosedTitle: pickNonEmpty(
        overrides.storeClosedTitle?.[lang],
        defaults.storefront.storeClosedTitle
      ),
      storeClosedBody: pickNonEmpty(
        overrides.storeClosedBody?.[lang],
        defaults.storefront.storeClosedBody
      ),
    },
    cart: {
      ...defaults.cart,
      savingsPrefix: pickNonEmpty(
        overrides.savingsPrefix?.[lang],
        defaults.cart.savingsPrefix
      ),
      savingsSuffix: pickNonEmpty(
        overrides.savingsSuffix?.[lang],
        defaults.cart.savingsSuffix
      ),
    },
    confirmation: {
      ...defaults.confirmation,
      callNotice: pickNonEmpty(
        overrides.confirmationNotice?.[lang],
        defaults.confirmation.callNotice
      ),
    },
    retention: {
      ...defaults.retention,
      thankYouTitle: pickNonEmpty(
        overrides.deliveredThankYouTitle?.[lang],
        defaults.retention.thankYouTitle
      ),
      thankYouBody: pickNonEmpty(
        overrides.deliveredThankYouBody?.[lang],
        defaults.retention.thankYouBody
      ),
    },
    footer: {
      ...defaults.footer,
      tagline: pickNonEmpty(overrides.tagline?.[lang], defaults.footer.tagline),
      copyright: pickNonEmpty(
        overrides.footerNotice?.[lang],
        defaults.footer.copyright
      ),
    },
  };
}

/**
 * Computes relative luminance of a hex color and returns high-contrast text color (#FFFFFF or #141A15).
 */
export function getAccessibleContrastText(
  hexColor: string
): '#FFFFFF' | '#141A15' {
  const clean = hexColor.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return '#FFFFFF';
  }
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.42 ? '#141A15' : '#FFFFFF';
}

export interface BulkEditRowDraft {
  ourPrice: number;
  marketPrice: number;
  inStock: boolean;
}

/**
 * Applies a percentage price adjustment to selected products, rounded to nearest 250 IQD (min 250 IQD).
 */
export function applyBulkPricePercent(
  products: Product[],
  selectedIds: Set<string>,
  targetField: 'ourPrice' | 'marketPrice',
  percentDelta: number,
  existingDrafts: Record<string, BulkEditRowDraft> = {}
): Record<string, BulkEditRowDraft> {
  const next: Record<string, BulkEditRowDraft> = { ...existingDrafts };
  const multiplier = 1 + percentDelta / 100;

  for (const product of products) {
    if (!selectedIds.has(product.id)) continue;
    const base = next[product.id] ?? {
      ourPrice: product.ourPrice,
      marketPrice: product.marketPrice,
      inStock: isProductInStock(product),
    };
    const currentValue = base[targetField];
    const adjusted = Math.max(
      250,
      Math.round((currentValue * multiplier) / 250) * 250
    );
    next[product.id] = {
      ...base,
      [targetField]: adjusted,
    };
  }

  return next;
}

// --- UTF-8 BOM CSV Import / Export ---

export const CSV_HEADERS = [
  'id',
  'nameKu',
  'nameAr',
  'nameEn',
  'categoryId',
  'subcategoryId',
  'size',
  'ourPrice',
  'marketPrice',
  'marketPriceNote',
  'inStock',
  'showInDeals',
  'showInPopular',
  'isNew',
  'isActive',
  'imageUrl',
] as const;

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateProductsCsvTemplate(): string {
  const sampleRow = [
    'p-erbil-example-1',
    'تەماتەی هەولێر',
    'طماطم أربيل',
    'Erbil Vine Tomatoes',
    'produce',
    'vegetables',
    '1 kg',
    '1250',
    '1750',
    'Checked at Erbil Central Market',
    'true',
    'true',
    'true',
    'false',
    'true',
    '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg',
  ];
  return (
    '\uFEFF' +
    CSV_HEADERS.join(',') +
    '\r\n' +
    sampleRow.map(escapeCsvCell).join(',') +
    '\r\n'
  );
}

export function generateProductsCsv(products: Product[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const p of products) {
    const row = [
      p.id,
      p.nameKu,
      p.nameAr,
      p.nameEn,
      p.categoryId,
      p.subcategoryId,
      p.size,
      p.ourPrice,
      p.marketPrice,
      p.marketPriceNote ?? '',
      isProductInStock(p),
      matchesProductSectionFlag(p, 'deals'),
      matchesProductSectionFlag(p, 'popular'),
      matchesProductSectionFlag(p, 'new'),
      p.isActive,
      p.imageUrl,
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

export function parseCsvMatrix(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function parseBoolCell(raw: string | undefined, defaultVal: boolean): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  if (!v) return defaultVal;
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return defaultVal;
}

export interface ParsedCsvProductRow {
  rowNumber: number;
  status: 'new' | 'update' | 'invalid';
  errors: string[];
  product: Product | null;
  rawId: string;
  rawNameEn: string;
}

export interface CsvImportPreview {
  rows: ParsedCsvProductRow[];
  newCount: number;
  updateCount: number;
  invalidCount: number;
}

export function parseProductsCsv(
  csvText: string,
  categories: Category[],
  existingProducts: Product[]
): CsvImportPreview {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length < 2) {
    return { rows: [], newCount: 0, updateCount: 0, invalidCount: 0 };
  }

  const headers = matrix[0].map((h) => h.trim());
  const colIndex = new Map<string, number>();
  headers.forEach((h, idx) => colIndex.set(h, idx));

  const validCategoryIds = new Set(categories.map((c) => c.id));
  const existingMap = new Map(existingProducts.map((p) => [p.id, p]));

  const getCell = (row: string[], key: string) => {
    const idx = colIndex.get(key);
    return idx === undefined ? '' : (row[idx] ?? '').trim();
  };

  const rows: ParsedCsvProductRow[] = [];
  let newCount = 0;
  let updateCount = 0;
  let invalidCount = 0;

  for (let i = 1; i < matrix.length; i++) {
    const r = matrix[i];
    const errors: string[] = [];

    const id = getCell(r, 'id');
    const nameKu = getCell(r, 'nameKu');
    const nameAr = getCell(r, 'nameAr');
    const nameEn = getCell(r, 'nameEn');
    const categoryId = getCell(r, 'categoryId');
    const subcategoryId = getCell(r, 'subcategoryId');
    const size = getCell(r, 'size');
    const ourPrice = Number(normalizeDigits(getCell(r, 'ourPrice')));
    const marketPrice = Number(normalizeDigits(getCell(r, 'marketPrice')));
    const marketPriceNote = getCell(r, 'marketPriceNote');
    const inStock = parseBoolCell(getCell(r, 'inStock'), true);
    const showInDeals = parseBoolCell(getCell(r, 'showInDeals'), false);
    const showInPopular = parseBoolCell(getCell(r, 'showInPopular'), false);
    const isNew = parseBoolCell(getCell(r, 'isNew'), false);
    const isActive = parseBoolCell(getCell(r, 'isActive'), true);
    const imageUrl = getCell(r, 'imageUrl');

    if (!id || !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) {
      errors.push('Invalid id (letters, numbers, _, -)');
    }
    if (!nameKu) errors.push('Missing nameKu');
    if (!nameAr) errors.push('Missing nameAr');
    if (!nameEn) errors.push('Missing nameEn');
    if (!categoryId || (validCategoryIds.size > 0 && !validCategoryIds.has(categoryId))) {
      errors.push(`Unknown categoryId "${categoryId}"`);
    }
    if (!size) errors.push('Missing size');
    if (!Number.isFinite(ourPrice) || ourPrice <= 0) {
      errors.push('ourPrice must be > 0');
    }
    if (!Number.isFinite(marketPrice) || marketPrice < 0) {
      errors.push('marketPrice must be >= 0');
    }

    if (errors.length > 0) {
      invalidCount += 1;
      rows.push({
        rowNumber: i + 1,
        status: 'invalid',
        errors,
        product: null,
        rawId: id,
        rawNameEn: nameEn || nameKu,
      });
      continue;
    }

    const section: ProductSection = showInDeals
      ? 'deals'
      : isNew
        ? 'new'
        : showInPopular
          ? 'popular'
          : 'recommended';

    const existing = existingMap.get(id);
    const status = existing ? 'update' : 'new';
    if (status === 'update') updateCount += 1;
    else newCount += 1;

    rows.push({
      rowNumber: i + 1,
      status,
      errors: [],
      rawId: id,
      rawNameEn: nameEn,
      product: {
        id,
        categoryId,
        subcategoryId: subcategoryId || existing?.subcategoryId || 'general',
        nameKu: nameKu.slice(0, 120),
        nameAr: nameAr.slice(0, 120),
        nameEn: nameEn.slice(0, 120),
        size: size.slice(0, 40),
        ourPrice: Math.round(ourPrice),
        marketPrice: Math.round(marketPrice),
        marketPriceNote: marketPriceNote.slice(0, 200),
        marketPriceUpdatedAt: new Date().toISOString().slice(0, 10),
        imageUrl:
          imageUrl ||
          existing?.imageUrl ||
          '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg',
        section,
        inStock,
        showInDeals,
        showInPopular,
        isNew,
        isActive,
      },
    });
  }

  return { rows, newCount, updateCount, invalidCount };
}

// --- Reports & Analytics Aggregation ---

export interface DailyReportPoint {
  dateKey: string;
  orderCount: number;
  revenue: number;
}

export interface TopSellingProductRow {
  productId: string;
  nameKu: string;
  nameAr: string;
  nameEn: string;
  quantitySold: number;
  revenue: number;
}

export interface OrderReportMetrics {
  totalOrders: number;
  statusBreakdown: Record<OrderStatus, number>;
  revenue: number;
  confirmedOrderCount: number;
  fakeCount: number;
  cancelledCount: number;
  fakeRatePct: number;
  totalSavingsDelivered: number;
  aov: number;
  dailySeries: DailyReportPoint[];
  topProducts: TopSellingProductRow[];
}

const REVENUE_STATUSES = new Set<OrderStatus>([
  'Confirmed',
  'Bought',
  'Delivered',
]);

export function computeOrderReportMetrics(
  orders: OrderRecord[],
  rangeStartMs?: number,
  rangeEndMs?: number
): OrderReportMetrics {
  const statusBreakdown: Record<OrderStatus, number> = {
    New: 0,
    Called: 0,
    Confirmed: 0,
    Bought: 0,
    Delivered: 0,
    Cancelled: 0,
    Fake: 0,
  };

  const filtered = orders.filter((o) => {
    if (rangeStartMs !== undefined && o.createdAtMs < rangeStartMs) return false;
    if (rangeEndMs !== undefined && o.createdAtMs > rangeEndMs) return false;
    return true;
  });

  let revenue = 0;
  let confirmedOrderCount = 0;
  let totalSavingsDelivered = 0;
  const dailyMap = new Map<string, DailyReportPoint>();
  const productMap = new Map<string, TopSellingProductRow>();

  for (const order of filtered) {
    statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    const isRevenueOrder = REVENUE_STATUSES.has(order.status);

    const dayKey = new Date(order.createdAtMs).toISOString().slice(0, 10);
    const point = dailyMap.get(dayKey) ?? {
      dateKey: dayKey,
      orderCount: 0,
      revenue: 0,
    };
    point.orderCount += 1;

    if (isRevenueOrder) {
      revenue += order.grandTotal;
      confirmedOrderCount += 1;
      totalSavingsDelivered += order.totalSavings;
      point.revenue += order.grandTotal;

      for (const item of order.items) {
        const prev = productMap.get(item.productId) ?? {
          productId: item.productId,
          nameKu: item.nameKu,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          quantitySold: 0,
          revenue: 0,
        };
        prev.quantitySold += item.quantity;
        prev.revenue += item.lineTotal;
        productMap.set(item.productId, prev);
      }
    }

    dailyMap.set(dayKey, point);
  }

  const totalOrders = filtered.length;
  const fakeCount = statusBreakdown.Fake;
  const cancelledCount = statusBreakdown.Cancelled;
  const fakeRatePct =
    totalOrders > 0 ? Math.round((fakeCount / totalOrders) * 1000) / 10 : 0;
  const aov =
    confirmedOrderCount > 0 ? Math.round(revenue / confirmedOrderCount) : 0;

  const dailySeries = Array.from(dailyMap.values()).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey)
  );
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalOrders,
    statusBreakdown,
    revenue,
    confirmedOrderCount,
    fakeCount,
    cancelledCount,
    fakeRatePct,
    totalSavingsDelivered,
    aov,
    dailySeries,
    topProducts,
  };
}

export function buildCustomerConfirmationWhatsAppUrl(
  order: OrderRecord,
  lang: Language
): string {
  const cleanPhone = normalizeDigits(order.phoneNormalized).replace(/[^\d]/g, '');
  const totalFormatted = formatIqdNumber(order.grandTotal);
  const text =
    lang === 'ku'
      ? `سڵاو ${order.customerName}، داواکارییەکەت ژمارە ${order.orderNumber} بە کۆی ${totalFormatted} د.ع گەیشتووە. تکایە دڵنیامان بکەرەوە بۆ ئەوەی دەست بکەین بە کڕین و گەیاندن.`
      : lang === 'ar'
        ? `مرحباً ${order.customerName}، استلمنا طلبك رقم ${order.orderNumber} بقيمة ${totalFormatted} د.ع. يرجى تأكيد الطلب للبدء بالتجهيز والتوصيل.`
        : `Hello ${order.customerName}, we received your order ${order.orderNumber} totaling ${totalFormatted} IQD. Please confirm so we can shop and deliver it right away.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Computes lifetime savings across all Delivered orders belonging to the same
 * customer (matched by userId or normalized Iraqi phone number).
 */
export function computeCustomerLifetimeSavingsFromOrders(
  allOrders: OrderRecord[],
  targetOrder: Pick<OrderRecord, 'userId' | 'phoneNormalized'>
): { lifetimeSavings: number; deliveredOrderCount: number } {
  const targetPhone = normalizeDigits(targetOrder.phoneNormalized).replace(
    /[^\d]/g,
    ''
  );
  let lifetimeSavings = 0;
  let deliveredOrderCount = 0;

  for (const order of allOrders) {
    if (order.status !== 'Delivered') continue;
    const orderPhone = normalizeDigits(order.phoneNormalized).replace(/[^\d]/g, '');
    const sameCustomer =
      (targetOrder.userId && order.userId === targetOrder.userId) ||
      (targetPhone.length >= 9 && orderPhone === targetPhone);
    if (!sameCustomer) continue;

    deliveredOrderCount += 1;
    if (Number.isFinite(order.totalSavings) && order.totalSavings > 0) {
      lifetimeSavings += Math.round(order.totalSavings);
    }
  }

  return { lifetimeSavings, deliveredOrderCount };
}

/**
 * Builds a warm, human one-tap WhatsApp Thank-You & Lifetime Savings link for Delivered orders.
 */
export function buildDeliveredThankYouWhatsAppUrl(params: {
  order: OrderRecord;
  lifetimeSavings: number;
  deliveredOrderCount: number;
  lang: Language;
  customBodyTemplate?: string;
}): string {
  const { order, lifetimeSavings, lang, customBodyTemplate } = params;
  const cleanPhone = normalizeDigits(order.phoneNormalized).replace(/[^\d]/g, '');
  const orderSavingsNum = Math.max(0, Math.round(order.totalSavings || 0));
  const totalSavingsNum = Math.max(orderSavingsNum, Math.round(lifetimeSavings || 0));
  const orderSavingsFmt = formatIqdNumber(orderSavingsNum);
  const lifetimeSavingsFmt = formatIqdNumber(totalSavingsNum);

  const firstName = (order.customerName || '').trim().replace(/\s+/g, ' ').split(' ')[0] || '';
  const trimmedCustom = customBodyTemplate?.trim();
  let body: string;

  if (trimmedCustom) {
    let formatted = trimmedCustom
      .replaceAll('{orderNumber}', order.orderNumber)
      .replaceAll('{orderSavings}', orderSavingsFmt)
      .replaceAll('{lifetimeSavings}', lifetimeSavingsFmt);

    if (firstName) {
      formatted = formatted.replaceAll('{name}', firstName);
    } else {
      formatted = formatted
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

    const greeting =
      lang === 'ku'
        ? firstName
          ? `سوپاس ${firstName}، بە خۆشی بەکاریبهێنن!`
          : 'سوپاس، بە خۆشی بەکاریبهێنن!'
        : lang === 'ar'
          ? firstName
            ? `وصلت أغراضك بالسلامة، شكراً يا ${firstName}!`
            : 'وصلت أغراضك بالسلامة، شكراً لك!'
          : firstName
            ? `Thank you, ${firstName} — hope you love your order!`
            : 'Thank you — hope you love your order!';

    body = `${greeting}\n\n${formatted}`;
  } else if (lang === 'ku') {
    const title = firstName
      ? `سوپاس ${firstName}، بە خۆشی بەکاریبهێنن!`
      : 'سوپاس، بە خۆشی بەکاریبهێنن!';
    const message =
      orderSavingsNum > 0
        ? `داواکارییەکەت گەیشتە دەستت و هیوادارین هەموو شتەکان تازە و بە دڵت بووبن. زۆر خۆشحاڵین کە ئەمڕۆ ${orderSavingsFmt} د.ع پاشەکەوتمان بۆ کردیت — تا ئێستا کۆی ${lifetimeSavingsFmt} د.ع لە گیرفانتدا ماوەتەوە. هەر کاتێک ماڵەوە پێویستی بە شتێک بوو، ئێمە هەمیشە لێرەین تا بە نرخی هەرزانتر و بێ ماندووبوون بۆتی بهێنینە بەر دەرگا.`
        : totalSavingsNum > 0
          ? `داواکارییەکەت گەیشتە دەستت و هیوادارین هەموو شتەکان بە دڵت بووبن. تا ئێستا لەگەڵ ئێمە کۆی ${lifetimeSavingsFmt} د.ع پاشەکەوتت کردووە. هەر کاتێک پێویستت بە شتێک بوو، بە خۆشحاڵییەوە خزمەتت دەکەین.`
          : 'داواکارییەکەت گەیشتە دەستت و هیوادارین هەموو شتەکان تازە و بە دڵت بووبن. هەر کاتێک ماڵەوە پێویستی بە شتێک بوو، بە خۆشحاڵییەوە خزمەتت دەکەین.';
    body = `${title}\n\n${message}`;
  } else if (lang === 'ar') {
    const title = firstName
      ? `وصلت أغراضك بالسلامة، شكراً يا ${firstName}!`
      : 'وصلت أغراضك بالسلامة، شكراً لك!';
    const message =
      orderSavingsNum > 0
        ? `نتمنى أن تكون كل الأغراض طازجة وعلى ذوقك. يسعدنا أننا وفّرنا لك ${orderSavingsFmt} د.ع في هذا الطلب، ليصل مجموع ما وفّرته معنا حتى اليوم إلى ${lifetimeSavingsFmt} د.ع. متى ما احتاج بيتك أي شيء، نحن دائماً قريبون منك وبأسعار أرخص وراحة أكبر.`
        : totalSavingsNum > 0
          ? `نتمنى أن تكون كل الأغراض طازجة وعلى ذوقك. مجموع ما وفّرته معنا حتى اليوم وصل إلى ${lifetimeSavingsFmt} د.ع. متى ما احتجت أي شيء للبيت، يسعدنا دائماً خدمتك.`
          : 'نتمنى أن تكون كل الأغراض طازجة وعلى ذوقك. متى ما احتاج بيتك أي شيء، يسعدنا دائماً خدمتك وبكل سرور.';
    body = `${title}\n\n${message}`;
  } else {
    const title = firstName
      ? `Thank you, ${firstName} — hope you love your order!`
      : 'Thank you — hope you love your order!';
    const message =
      orderSavingsNum > 0
        ? `Your groceries have arrived, and we hope everything is fresh and just how you like it. We're so happy we could save you ${orderSavingsFmt} IQD today — bringing your total savings with us to ${lifetimeSavingsFmt} IQD so far. Whenever your home needs anything again, we're always here to keep shopping simple and lighter on your budget.`
        : totalSavingsNum > 0
          ? `Your groceries have arrived, and we hope everything is fresh and just how you like it. You've saved ${lifetimeSavingsFmt} IQD with us so far — whenever your home needs anything again, we're always happy to help.`
          : "Your groceries have arrived, and we hope everything is fresh and just how you like it. Whenever your home needs anything again, we're always happy to help.";
    body = `${title}\n\n${message}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`;
}
