import { getDeliveryHoursByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language, StoreSettings } from '../types/grocery';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  t: TranslationDictionary;
  language: Language;
  settings: StoreSettings;
  onChangeLanguage: (lang: Language) => void;
}

const LANGUAGES: Language[] = ['ku', 'ar', 'en'];

export function Footer({
  t,
  language,
  settings,
  onChangeLanguage,
}: FooterProps) {
  const trimmedStoreName = settings.storeName.trim();
  const brandLabel =
    !trimmedStoreName || trimmedStoreName === 'Bazar Fresh'
      ? t.brandName
      : trimmedStoreName;

  return (
    <footer className="mt-14 border-t border-[#E5E7E4] bg-white pb-20 pt-8 md:pb-10">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md space-y-1.5">
            <p className="font-display text-base font-bold text-[#141A15]">
              {brandLabel}
            </p>
            <p className="text-sm text-[#566058]">{t.footer.tagline}</p>
            <p className="text-xs font-medium text-[#6B756D]">
              {t.storefront.deliveryHoursLabel}:{' '}
              {getDeliveryHoursByLang(settings.deliveryHoursText, language)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PWAInstallButton t={t} />

            <div className="inline-flex items-center rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-1">
              {LANGUAGES.map((code) => {
                const active = language === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onChangeLanguage(code)}
                    aria-pressed={active}
                    className={`min-h-[48px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)]'
                        : 'text-[#4E5750] hover:bg-[#ECEFEA]'
                    }`}
                  >
                    {t.languageNames[code]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-6 border-t border-[#ECEFEA] pt-4 text-xs text-[#78827A]">
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
