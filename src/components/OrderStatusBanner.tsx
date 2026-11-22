import { Bell, CheckCircle2, X } from 'lucide-react';
import type { TranslationDictionary } from '../i18n/translations';
import { formatOrderAlertText } from '../utils/supermarketLogic';

export interface ActiveOrderAlert {
  orderId: string;
  orderNumber: string;
  status: 'Confirmed' | 'Delivered';
}

interface OrderStatusBannerProps {
  alert: ActiveOrderAlert;
  t: TranslationDictionary;
  onDismiss: () => void;
  compact?: boolean;
}

export function OrderStatusBanner({
  alert,
  t,
  onDismiss,
  compact = false,
}: OrderStatusBannerProps) {
  const message = formatOrderAlertText(
    alert.status === 'Confirmed'
      ? t.orders.confirmedBanner
      : t.orders.deliveredBanner,
    alert.orderNumber
  );

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="order-status-banner"
      data-order-status={alert.status}
      className={`flex items-center justify-between gap-2.5 rounded-xl border border-[#BCE0CA] bg-[#EFF6F2] text-[#115532] ${
        compact ? 'px-3.5 py-2.5 text-xs' : 'px-4 py-3 text-xs sm:text-sm'
      }`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {alert.status === 'Confirmed' ? (
          <Bell
            className="mt-0.5 h-4 w-4 shrink-0 text-[#15663C]"
            aria-hidden="true"
          />
        ) : (
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-[#15663C]"
            aria-hidden="true"
          />
        )}
        <p className="min-w-0 font-semibold leading-snug">{message}</p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label={t.orders.dismissAlert}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[#115532] transition-colors hover:bg-[#DFEDE5] active:scale-95"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
