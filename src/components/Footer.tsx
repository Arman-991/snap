import { getDeliveryHoursByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language, StoreSettings } from '../types/grocery';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  t: TranslationDictionary;
  language: Language;
  settings: StoreSettings;
}

export function Footer({ t, language, settings }: FooterProps) {
  const trimmedStoreName = settings.storeName.trim();
  const brandLabel =
    !trimmedStoreName || trimmedStoreName === 'Bazar Fresh'
      ? t.brandName
      : trimmedStoreName;

  return (
    <footer className="mt-8 border-t border-gray-200/80 bg-white px-4 py-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="font-display text-sm font-extrabold text-[#141A15]">
            {brandLabel}
          </p>
          <p className="text-xs leading-relaxed text-gray-500">
            {t.footer.tagline}
          </p>
          <p className="text-[11px] font-medium text-gray-500">
            {t.storefront.deliveryHoursLabel}:{' '}
            {getDeliveryHoursByLang(settings.deliveryHoursText, language)}
          </p>
        </div>

        <PWAInstallButton t={t} />

        <p className="border-t border-gray-100 pt-3 text-[11px] text-gray-400">
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
