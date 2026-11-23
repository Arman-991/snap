import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  ShoppingBag,
} from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import { formatIqd, formatOrderTimestamp } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { CustomerNotificationItem, Language } from '../types/grocery';
import { TOP_HEADER_BASKET_ID } from '../utils/flyToBasket';
import { formatDeliveredThankYouTemplate } from '../utils/supermarketLogic';

interface HeaderProps {
  t: TranslationDictionary;
  language: Language;
  storeName: string;
  logoUrl?: string;
  notifications: CustomerNotificationItem[];
  onChangeLanguage: (lang: Language) => void;
  onSelectNotification: (item: CustomerNotificationItem) => void;
  onMarkAllNotificationsRead: () => void;
  onSelectMarket: () => void;
  onOpenCart: () => void;
}

const LANGUAGE_OPTIONS: Array<{
  code: Language;
  shortLabel: string;
  fullLabel: string;
}> = [
  { code: 'ku', shortLabel: 'کوردی', fullLabel: 'کوردی (سۆرانی)' },
  { code: 'ar', shortLabel: 'عربي', fullLabel: 'العربية' },
  { code: 'en', shortLabel: 'EN', fullLabel: 'English' },
];

export function Header({
  t,
  language,
  storeName,
  logoUrl,
  notifications,
  onChangeLanguage,
  onSelectNotification,
  onMarkAllNotificationsRead,
  onSelectMarket,
  onOpenCart,
}: HeaderProps) {
  const { itemCount: cartCount } = useCartContext();
  const [logoFailed, setLogoFailed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const bellContainerRef = useRef<HTMLDivElement | null>(null);
  const langContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    if (!bellOpen && !langOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        bellOpen &&
        bellContainerRef.current &&
        !bellContainerRef.current.contains(target)
      ) {
        setBellOpen(false);
      }
      if (
        langOpen &&
        langContainerRef.current &&
        !langContainerRef.current.contains(target)
      ) {
        setLangOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBellOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [bellOpen, langOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const trimmedStoreName = storeName.trim();
  const brandLabel =
    !trimmedStoreName || trimmedStoreName === 'Bazar Fresh'
      ? t.brandName
      : trimmedStoreName;

  const currentLangShort =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language)?.shortLabel ?? 'EN';

  return (
    <header
      data-testid="mobile-app-header"
      className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-gray-100 bg-white/90 px-3 backdrop-blur-md"
    >
      {/* START SIDE: Compact Logo + Notification Bell */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onSelectMarket}
          className="flex min-h-[40px] min-w-0 items-center gap-2 text-start transition-transform duration-100 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={brandLabel}
              onError={() => setLogoFailed(true)}
              className="h-8 w-8 shrink-0 rounded-xl border border-gray-200 object-cover"
            />
          ) : (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-display text-sm font-extrabold text-[var(--brand-primary-fg)] shadow-xs"
              aria-hidden="true"
            >
              S
            </span>
          )}
          <span className="truncate font-display text-base font-extrabold tracking-tight text-[#141A15]">
            {brandLabel}
          </span>
        </button>

        {/* Circular Notification Bell right beside logo */}
        <div ref={bellContainerRef} className="relative shrink-0">
          <button
            type="button"
            data-testid="notification-bell-btn"
            aria-label={t.retention.notificationsBellAria}
            aria-expanded={bellOpen}
            onClick={() => {
              setLangOpen(false);
              setBellOpen((prev) => !prev);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-transform duration-100 hover:bg-gray-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                data-testid="notification-unread-dot"
                className="absolute end-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white"
                aria-hidden="true"
              />
            )}
          </button>

          {bellOpen && (
            <div
              data-testid="notification-bell-popover"
              className="fixed left-1/2 top-15 z-50 w-[calc(100vw-24px)] max-w-[456px] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <h3 className="font-display text-sm font-bold text-[#141A15]">
                  {t.retention.notificationsTitle}
                </h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllNotificationsRead}
                    className="min-h-[34px] rounded-lg px-2 text-xs font-semibold text-green-700 hover:bg-green-50 active:scale-95"
                  >
                    {t.retention.markAllRead}
                  </button>
                )}
              </div>

              <div className="max-h-[65vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-500">
                    {t.retention.notificationsEmpty}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setBellOpen(false);
                            onSelectNotification(item);
                          }}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 ${
                            item.read ? 'bg-white' : 'bg-green-50/50'
                          }`}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate font-display text-xs font-bold text-[#141A15]">
                                {formatDeliveredThankYouTemplate(
                                  t.retention.thankYouTitle,
                                  {
                                    name: item.customerName,
                                    orderNumber: item.orderNumber,
                                    orderSavings: item.orderSavings,
                                    lifetimeSavings: item.lifetimeSavings,
                                  }
                                )}
                              </p>
                              {!item.read && (
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full bg-red-600"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-600 tabular-nums">
                              <bdi dir="ltr">#{item.orderNumber}</bdi>
                              {item.orderSavings > 0 && (
                                <>
                                  {' · '}
                                  <span className="font-semibold text-green-700">
                                    {t.retention.savedThisOrderLabel}:{' '}
                                    {formatIqd(item.orderSavings, language)}
                                  </span>
                                </>
                              )}
                            </p>
                            {item.lifetimeSavings > 0 && (
                              <p className="mt-0.5 text-[11px] font-medium text-green-800 tabular-nums">
                                {t.retention.totalSavedSoFarLabel}:{' '}
                                {formatIqd(item.lifetimeSavings, language)}
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatOrderTimestamp(item.createdAtMs, language)}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* END SIDE: Compact Language Pill + Crisp Green Cart Pill */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Compact Language Switcher Pill with Dropdown */}
        <div ref={langContainerRef} className="relative">
          <button
            type="button"
            data-testid="header-lang-btn"
            aria-label={t.profile.languageSection}
            aria-haspopup="menu"
            aria-expanded={langOpen}
            onClick={() => {
              setBellOpen(false);
              setLangOpen((prev) => !prev);
            }}
            className="flex h-9 items-center gap-1 rounded-full bg-gray-100 px-2.5 text-xs font-bold text-gray-800 transition-transform duration-100 hover:bg-gray-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-600" aria-hidden="true" />
            <span className="whitespace-nowrap">{currentLangShort}</span>
            <ChevronDown
              className={`h-3 w-3 shrink-0 text-gray-500 transition-transform duration-150 ${
                langOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {langOpen && (
            <div
              role="menu"
              data-testid="header-lang-menu"
              className="absolute end-0 top-11 z-50 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl"
            >
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = language === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    data-testid={`header-lang-option-${opt.code}`}
                    onClick={() => {
                      onChangeLanguage(opt.code);
                      setLangOpen(false);
                    }}
                    className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl px-3 text-xs font-bold transition-colors active:scale-[0.98] ${
                      active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{opt.fullLabel}</span>
                    {active && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-green-600"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Crisp Green Cart Pill Button */}
        <button
          id={TOP_HEADER_BASKET_ID}
          type="button"
          data-testid="header-cart-btn"
          aria-label={`${t.nav.cart} (${cartCount})`}
          onClick={onOpenCart}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-3 text-xs font-bold text-white shadow-sm transition-transform duration-100 hover:bg-green-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden whitespace-nowrap min-[380px]:inline">
            {t.nav.cart}
          </span>
          <span
            data-testid="header-cart-count"
            className="inline-block tabular-nums font-extrabold"
          >
            ({cartCount})
          </span>
        </button>
      </div>
    </header>
  );
}
