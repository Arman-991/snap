import { useEffect, useRef, useState } from 'react';
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

const FALLBACK_HERO_IMAGE =
  '/src/assets/images/hero_fresh_market_1795087971030.jpg';

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
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setImgSrc(activeBanner?.imageUrl || FALLBACK_HERO_IMAGE);
  }, [activeBanner?.imageUrl]);

  if (!activeBanner) return null;

  const title = getBannerTitleByLang(activeBanner, language);
  const deliveryHours = getDeliveryHoursByLang(
    settings.deliveryHoursText,
    language
  );

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (banners.length <= 1) return;
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (banners.length <= 1 || touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 36) return;
    if (deltaX < 0) {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    } else {
      setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  return (
    <section
      aria-label={t.brandName}
      data-testid="hero-banner"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative h-40 overflow-hidden rounded-2xl border border-gray-200/80 bg-[#142018] shadow-xs sm:h-44"
    >
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

      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="min-w-0">
          <h1 className="line-clamp-2 font-display text-lg font-extrabold leading-snug tracking-tight text-white rtl:leading-[1.35] sm:text-xl">
            {title}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-[#E1EAE4]">
            <span className="inline-flex items-center gap-1 truncate">
              <Clock
                className="h-3.5 w-3.5 shrink-0 text-[#86D9A6]"
                aria-hidden="true"
              />
              <span className="truncate">{deliveryHours}</span>
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Wallet
                className="h-3.5 w-3.5 shrink-0 text-[#86D9A6]"
                aria-hidden="true"
              />
              <span>
                {t.storefront.minOrderLabel}:{' '}
                {formatIqd(settings.minimumOrder, language)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              onSelectCategory(activeBanner.linkCategoryId || 'all')
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-green-600 px-3.5 text-xs font-bold text-white shadow-xs transition-transform duration-100 hover:bg-green-700 active:scale-95"
          >
            <span>{t.cart.browseCta}</span>
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 rtl:rotate-180"
              aria-hidden="true"
            />
          </button>

          {banners.length > 1 && (
            <div
              className="flex items-center gap-1"
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
                    className="flex h-8 min-w-[28px] items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-150 ${
                        isCurrent ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
