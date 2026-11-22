import type {
  Banner,
  Category,
  DeliveryHoursText,
  Language,
  OrderItemSnapshot,
  Product,
  Subcategory,
} from '../types/grocery';

export function formatIqd(amount: number, lang: Language): string {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return lang === 'en' ? `${formattedNumber} IQD` : `${formattedNumber} د.ع`;
}

export function getNameByLang(
  item: Pick<Product | Category | Subcategory | OrderItemSnapshot, 'nameKu' | 'nameAr' | 'nameEn'>,
  lang: Language
): string {
  if (lang === 'ku') return item.nameKu;
  if (lang === 'ar') return item.nameAr;
  return item.nameEn;
}

export function getBannerTitleByLang(banner: Banner, lang: Language): string {
  if (lang === 'ku') return banner.titleKu;
  if (lang === 'ar') return banner.titleAr;
  return banner.titleEn;
}

export function getDeliveryHoursByLang(
  hours: DeliveryHoursText,
  lang: Language
): string {
  return hours[lang] || hours.en;
}

export function formatOrderTimestamp(ms: number, lang: Language): string {
  try {
    const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
  }
}
