import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Wallet } from 'lucide-react';
import {
  formatIqd,
  getBannerTitleByLang,
  getDeliveryHoursByLang,
} from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Banner, Language, StoreSettings } from '../types/grocery';

interface HeroBannerProps {
  t: TranslationDictionary;
  language: Language;
  banners: Banner[];
  settings: StoreSettings;
  onSelectCategory: (categoryId: string) => void;
}

const FALLBACK_HERO_IMAGE = '/src/assets/images/hero_fresh_market_1795087971030.jpg';

export function HeroBanner({
  t,
  language,
  banners,
  settings,
  onSelectCategory,
}: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = banners.length > 0 ? activeIndex % banners.length : 0;
  const activeBanner = banners[safeIndex] ?? null;
  const [imgSrc, setImgSrc] = useState(
    activeBanner?.imageUrl || FALLBACK_HERO_IMAGE
  );

  useEffect(() => {
    setImgSrc(activeBanner?.imageUrl || FALLBACK_HERO_IMAGE);
  }, [activeBanner?.imageUrl]);

  if (!activeBanner) return null;

  const title = getBannerTitleByLang(activeBanner, language);
  const deliveryHours = getDeliveryHoursByLang(
    settings.deliveryHoursText,
    language
  );

  return (
    <section
      aria-label={t.brandName}
      className="relative overflow-hidden rounded-2xl border border-[#E5E7E4] bg-[#142018]"
    >
      <div className="relative min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]">
        <img
          src={imgSrc}
          alt={title}
          onError={() => {
            if (imgSrc !== FALLBACK_HERO_IMAGE) setImgSrc(FALLBACK_HERO_IMAGE);
          }}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0D1912]/90 via-[#0D1912]/55 to-[#0D1912]/25"
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between p-5 sm:min-h-[260px] sm:p-7 lg:min-h-[300px] lg:p-9">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white leading-[1.18] rtl:leading-[1.34] sm:text-3xl lg:text-4xl">
              {title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-[#E1EAE4] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0 text-[#86D9A6]" aria-hidden="true" />
                <span>
                  {t.storefront.deliveryHoursLabel}: {deliveryHours}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-4 w-4 shrink-0 text-[#86D9A6]" aria-hidden="true" />
                <span className="tabular-nums">
                  {t.storefront.minOrderLabel}:{' '}
                  {formatIqd(settings.minimumOrder, language)}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onSelectCategory(activeBanner.linkCategoryId || 'all')}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-semibold text-[var(--brand-primary-fg)] transition-all hover:opacity-92 active:scale-[0.98]"
            >
              <span>{t.cart.browseCta}</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 rtl:rotate-180"
                aria-hidden="true"
              />
            </button>

            {banners.length > 1 && (
              <div
                className="flex items-center gap-1.5"
                role="tablist"
                aria-label="Promotional banners"
              >
                {banners.map((banner, idx) => {
                  const isCurrent = idx === safeIndex;
                  return (
                    <button
                      key={banner.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      aria-label={getBannerTitleByLang(banner, language)}
                      onClick={() => setActiveIndex(idx)}
                      className="flex h-12 min-w-[48px] items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-white"
                    >
                      <span
                        className={`block h-2 rounded-full transition-all ${
                          isCurrent ? 'w-7 bg-white' : 'w-2.5 bg-white/45'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
