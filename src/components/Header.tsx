import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import { formatIqd, formatOrderTimestamp } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  AppView,
  CustomerNotificationItem,
  Language,
} from '../types/grocery';
import { formatDeliveredThankYouTemplate } from '../utils/supermarketLogic';

interface HeaderProps {
  t: TranslationDictionary;
  language: Language;
  storeName: string;
  logoUrl?: string;
  activeView: AppView;
  isDealsActive: boolean;
  notifications: CustomerNotificationItem[];
  onSelectNotification: (item: CustomerNotificationItem) => void;
  onMarkAllNotificationsRead: () => void;
  onSelectMarket: () => void;
  onSelectDeals: () => void;
  onSelectOrders: () => void;
  onSelectProfile: () => void;
  onOpenCart: () => void;
}

export function Header({
  t,
  language,
  storeName,
  logoUrl,
  activeView,
  isDealsActive,
  notifications,
  onSelectNotification,
  onMarkAllNotificationsRead,
  onSelectMarket,
  onSelectDeals,
  onSelectOrders,
  onSelectProfile,
  onOpenCart,
}: HeaderProps) {
  const { itemCount: cartCount } = useCartContext();
  const [logoFailed, setLogoFailed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    if (!bellOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        bellContainerRef.current &&
        !bellContainerRef.current.contains(event.target as Node)
      ) {
        setBellOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBellOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [bellOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const trimmedStoreName = storeName.trim();
  const brandLabel =
    !trimmedStoreName || trimmedStoreName === 'Bazar Fresh'
      ? t.brandName
      : trimmedStoreName;

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[#E5E7E4] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={onSelectMarket}
          className="flex min-h-[48px] min-w-0 items-center gap-2 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] sm:gap-2.5"
        >
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={brandLabel}
              onError={() => setLogoFailed(true)}
              className="h-8 w-8 shrink-0 rounded-lg border border-[#E5E7E4] object-cover"
            />
          ) : (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] font-display text-sm font-bold text-[var(--brand-primary-fg)]"
              aria-hidden="true"
            >
              B
            </span>
          )}
          <span className="truncate font-display text-base font-bold tracking-tight text-[#141A15] sm:text-lg">
            {brandLabel}
          </span>
        </button>

        {/* Zone 2: Desktop Primary Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          <button
            type="button"
            onClick={onSelectMarket}
            className={`min-h-[48px] rounded-xl px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeView === 'market' && !isDealsActive
                ? 'bg-[#EFF6F2] text-[var(--brand-primary)]'
                : 'text-[#4E5750] hover:bg-[#F4F6F3] hover:text-[#141A15]'
            }`}
          >
            {t.nav.market}
          </button>
          <button
            type="button"
            onClick={onSelectDeals}
            className={`min-h-[48px] rounded-xl px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeView === 'market' && isDealsActive
                ? 'bg-[#EFF6F2] text-[var(--brand-primary)]'
                : 'text-[#4E5750] hover:bg-[#F4F6F3] hover:text-[#141A15]'
            }`}
          >
            {t.nav.deals}
          </button>
          <button
            type="button"
            onClick={onSelectOrders}
            className={`min-h-[48px] rounded-xl px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeView === 'orders'
                ? 'bg-[#EFF6F2] text-[var(--brand-primary)]'
                : 'text-[#4E5750] hover:bg-[#F4F6F3] hover:text-[#141A15]'
            }`}
          >
            {t.nav.orders}
          </button>
          <button
            type="button"
            onClick={onSelectProfile}
            className={`min-h-[48px] rounded-xl px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeView === 'profile'
                ? 'bg-[#EFF6F2] text-[var(--brand-primary)]'
                : 'text-[#4E5750] hover:bg-[#F4F6F3] hover:text-[#141A15]'
            }`}
          >
            {t.nav.profile}
          </button>
        </nav>

        {/* Zone 3: Notification Bell + Primary Action (Cart) */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div ref={bellContainerRef} className="relative">
            <button
              type="button"
              data-testid="notification-bell-btn"
              aria-label={t.retention.notificationsBellAria}
              aria-expanded={bellOpen}
              onClick={() => setBellOpen((prev) => !prev)}
              className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-[#E5E7E4] bg-white text-[#3F4841] transition-colors hover:bg-[#F4F6F3] active:scale-[0.97]"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  data-testid="notification-unread-dot"
                  className="absolute end-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#DC2626] ring-2 ring-white"
                  aria-hidden="true"
                />
              )}
            </button>

            {bellOpen && (
              <div
                data-testid="notification-bell-popover"
                className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-[#DCE1DB] bg-white shadow-xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-14 sm:w-80"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#ECEFEA] px-4 py-3">
                  <h3 className="font-display text-sm font-bold text-[#141A15]">
                    {t.retention.notificationsTitle}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsRead}
                      className="min-h-[36px] rounded-lg px-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[#EFF6F2]"
                    >
                      {t.retention.markAllRead}
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-[#616B63]">
                    {t.retention.notificationsEmpty}
                  </p>
                ) : (
                  <ul className="divide-y divide-[#ECEFEA]">
                    {notifications.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setBellOpen(false);
                            onSelectNotification(item);
                          }}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-[#F5F7F4] ${
                            item.read ? 'bg-white' : 'bg-[#F3FAF6]'
                          }`}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6F2] text-[#15663C]">
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
                                  className="h-2 w-2 shrink-0 rounded-full bg-[#DC2626]"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-[#4E5750] tabular-nums">
                              <bdi dir="ltr">#{item.orderNumber}</bdi>
                              {item.orderSavings > 0 && (
                                <>
                                  {' · '}
                                  <span className="font-semibold text-[#15663C]">
                                    {t.retention.savedThisOrderLabel}:{' '}
                                    {formatIqd(item.orderSavings, language)}
                                  </span>
                                </>
                              )}
                            </p>
                            {item.lifetimeSavings > 0 && (
                              <p className="mt-0.5 text-[11px] font-medium text-[#115532] tabular-nums">
                                {t.retention.totalSavedSoFarLabel}:{' '}
                                {formatIqd(item.lifetimeSavings, language)}
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-[#7A847C]">
                              {formatOrderTimestamp(item.createdAtMs, language)}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--brand-primary-fg)] transition-opacity hover:opacity-92 active:scale-[0.98] sm:gap-2 sm:px-4"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{t.nav.cart}</span>
            <span className="tabular-nums text-xs font-bold opacity-95">
              ({cartCount})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
