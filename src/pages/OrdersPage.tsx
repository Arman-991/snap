import { Check, ClipboardList, RotateCcw, XCircle } from 'lucide-react';
import { LifetimeSavingsCard } from '../components/LifetimeSavingsCard';
import { OrderAlertsToggle } from '../components/OrderAlertsToggle';
import {
  OrderStatusBanner,
  type ActiveOrderAlert,
} from '../components/OrderStatusBanner';
import type { BrowserAlertStatus } from '../hooks/useBrowserOrderAlerts';
import {
  formatIqd,
  formatOrderTimestamp,
  getNameByLang,
} from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language, OrderRecord } from '../types/grocery';
import { mapCustomerVisibleStatus } from '../utils/supermarketLogic';

interface OrdersPageProps {
  t: TranslationDictionary;
  language: Language;
  orders: OrderRecord[];
  loading: boolean;
  lifetimeSavings: number;
  deliveredOrderCount: number;
  browserAlertStatus: BrowserAlertStatus;
  onToggleBrowserAlerts: () => Promise<void>;
  orderAlert?: ActiveOrderAlert | null;
  onDismissOrderAlert?: () => void;
  onOrderAgain: (order: OrderRecord) => void;
  onStartShopping: () => void;
}

const TIMELINE_STEPS = [
  'New',
  'Called',
  'Confirmed',
  'Bought',
  'Delivered',
] as const;

export function OrdersPage({
  t,
  language,
  orders,
  loading,
  lifetimeSavings,
  deliveredOrderCount,
  browserAlertStatus,
  onToggleBrowserAlerts,
  orderAlert = null,
  onDismissOrderAlert,
  onOrderAgain,
  onStartShopping,
}: OrdersPageProps) {
  return (
    <main className="w-full space-y-4 px-3 pt-4">
      <div className="flex flex-col gap-2.5">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-[#141A15]">
            {t.orders.title}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{t.orders.subtitle}</p>
        </div>
        <OrderAlertsToggle
          status={browserAlertStatus}
          t={t}
          onToggle={onToggleBrowserAlerts}
        />
      </div>

      <LifetimeSavingsCard
        lifetimeSavings={lifetimeSavings}
        deliveredOrderCount={deliveredOrderCount}
        t={t}
      />

      {orderAlert && onDismissOrderAlert && (
        <OrderStatusBanner
          alert={orderAlert}
          t={t}
          onDismiss={onDismissOrderAlert}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#E5E7E4] bg-white p-5"
            >
              <div className="h-5 w-1/3 animate-pulse rounded bg-[#ECEFEA]" />
              <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-[#ECEFEA]" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-[#ECEFEA]" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7E4] bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F5F2] text-[#616B63]">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-[#141A15]">
            {t.orders.emptyTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#566058]">
            {t.orders.emptyBody}
          </p>
          <button
            type="button"
            onClick={onStartShopping}
            className="mt-6 min-h-[48px] rounded-xl bg-[#15663C] px-6 text-sm font-semibold text-white hover:bg-[#105230]"
          >
            {t.orders.startShopping}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const visibleStatus = mapCustomerVisibleStatus(order.status);
            const isCancelled = visibleStatus === 'Cancelled';
            const activeStepIndex = TIMELINE_STEPS.indexOf(
              visibleStatus as (typeof TIMELINE_STEPS)[number]
            );
            const totalUnits = order.items.reduce(
              (acc, item) => acc + item.quantity,
              0
            );

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-[#E5E7E4] bg-white p-4 sm:p-6"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ECEFEA] pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-base font-bold text-[#141A15] tabular-nums sm:text-lg">
                        {order.orderNumber}
                      </h2>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          isCancelled
                            ? 'bg-[#FDF2F0] text-[#9A2E20]'
                            : visibleStatus === 'Delivered'
                              ? 'bg-[#EFF6F2] text-[#15663C]'
                              : 'bg-[#F3F5F2] text-[#141A15]'
                        }`}
                      >
                        {t.orders.statuses[visibleStatus]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#616B63]">
                      {formatOrderTimestamp(order.createdAtMs, language)} ·{' '}
                      <span className="tabular-nums">
                        {totalUnits} {t.orders.itemsLabel}
                      </span>{' '}
                      · {t.orders.codBadge}
                    </p>
                  </div>

                  <div className="text-start sm:text-end">
                    <p className="font-display text-lg font-bold text-[#15663C] tabular-nums">
                      {formatIqd(order.grandTotal, language)}
                    </p>
                    {order.totalSavings > 0 && (
                      <p className="text-xs font-semibold text-[#15663C] tabular-nums">
                        {t.product.youSaveLabel}:{' '}
                        {formatIqd(order.totalSavings, language)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Visual Status Timeline */}
                {isCancelled ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] px-3.5 py-2.5 text-xs font-semibold text-[#9A2E20]">
                    <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.orders.statuses.Cancelled}</span>
                  </div>
                ) : (
                  <ol
                    aria-label="Order progress"
                    className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2"
                  >
                    {TIMELINE_STEPS.map((step, index) => {
                      const reached = index <= activeStepIndex;
                      const isCurrent = index === activeStepIndex;
                      return (
                        <li key={step} className="flex flex-col items-center text-center">
                          <div className="flex w-full items-center">
                            <span
                              className={`h-0.5 flex-1 ${
                                index === 0
                                  ? 'bg-transparent'
                                  : reached
                                    ? 'bg-[#15663C]'
                                    : 'bg-[#E2E6E1]'
                              }`}
                            />
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                reached
                                  ? 'bg-[#15663C] text-white'
                                  : 'border border-[#D4DAD2] bg-white text-[#78827A]'
                              } ${isCurrent ? 'ring-4 ring-[#EFF6F2]' : ''}`}
                            >
                              {reached ? (
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                index + 1
                              )}
                            </span>
                            <span
                              className={`h-0.5 flex-1 ${
                                index === TIMELINE_STEPS.length - 1
                                  ? 'bg-transparent'
                                  : index < activeStepIndex
                                    ? 'bg-[#15663C]'
                                    : 'bg-[#E2E6E1]'
                              }`}
                            />
                          </div>
                          <span
                            className={`mt-1.5 text-[10px] leading-tight sm:text-xs ${
                              reached
                                ? 'font-semibold text-[#141A15]'
                                : 'font-medium text-[#78827A]'
                            }`}
                          >
                            {t.orders.statuses[step]}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {/* Order Items */}
                <ul className="mt-4 space-y-1.5 border-t border-[#ECEFEA] pt-3.5 text-sm">
                  {order.items.map((item) => (
                    <li
                      key={`${order.id}-${item.productId}`}
                      className="flex items-center justify-between gap-3 text-[#3F4841]"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-semibold text-[#141A15] tabular-nums">
                          {item.quantity} ×
                        </span>{' '}
                        {getNameByLang(item, language)}{' '}
                        <span className="text-xs text-[#6B756D]">
                          ({item.size})
                        </span>
                      </span>
                      <span className="shrink-0 font-medium text-[#141A15] tabular-nums">
                        {formatIqd(item.lineTotal, language)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Order Again Action */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECEFEA] pt-4">
                  <p className="text-xs text-[#616B63]">
                    {order.addressText}
                    {order.buildingNotes ? ` · ${order.buildingNotes}` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOrderAgain(order)}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--brand-primary)] bg-[#EFF6F2] px-4 text-sm font-semibold text-[var(--brand-primary)] transition-all hover:bg-[#DFEDE5] active:scale-[0.98]"
                  >
                    <RotateCcw className="h-4 w-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
                    <span>{t.orders.orderAgain}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
