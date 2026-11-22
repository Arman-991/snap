import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Heart, ShoppingBag, X } from 'lucide-react';
import { formatIqd } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language } from '../types/grocery';
import { formatDeliveredThankYouTemplate } from '../utils/supermarketLogic';

export interface DeliveredThankYouPayload {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  orderSavings: number;
  lifetimeSavings: number;
  deliveredOrderCount: number;
}

interface DeliveredThankYouModalProps {
  payload: DeliveredThankYouPayload | null;
  hasCustomBodyOverride: boolean;
  t: TranslationDictionary;
  language: Language;
  onContinueShopping: () => void;
  onClose: () => void;
}

export function DeliveredThankYouModal({
  payload,
  hasCustomBodyOverride,
  t,
  language,
  onContinueShopping,
  onClose,
}: DeliveredThankYouModalProps) {
  useEffect(() => {
    if (!payload) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [payload, onClose]);

  if (!payload) return null;

  const orderSavings = Math.max(0, Math.round(payload.orderSavings));
  const lifetimeSavings = Math.max(0, Math.round(payload.lifetimeSavings));

  const templateParams = {
    name: payload.customerName,
    orderNumber: payload.orderNumber,
    orderSavings,
    lifetimeSavings,
  };

  const formattedTitle = formatDeliveredThankYouTemplate(
    t.retention.thankYouTitle,
    templateParams
  );

  // Use Owner CMS override when configured; otherwise adapt warmly if orderSavings === 0
  const bodyTemplate = hasCustomBodyOverride
    ? t.retention.thankYouBody
    : orderSavings > 0
      ? t.retention.thankYouBody
      : lifetimeSavings > 0
        ? t.retention.thankYouBodyNoOrderSavings
        : t.retention.thankYouBodySimple;

  const formattedBody = formatDeliveredThankYouTemplate(
    bodyTemplate,
    templateParams
  );

  const showAnySavingsPill = orderSavings > 0 || lifetimeSavings > 0;

  const modalContent = (
    <div
      data-testid="delivered-thank-you-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#141A15]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivered-thank-you-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[#DCE6DF] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warm celebratory header band */}
        <div className="relative bg-gradient-to-b from-[#EDF7F1] to-[#F7FBF8] px-6 pb-5 pt-7 text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.retention.closeCta}
            className="absolute end-3 top-3 flex h-12 w-12 items-center justify-center rounded-2xl text-[#3E5C4A] transition-colors hover:bg-white/80"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-sm">
            <Heart className="h-7 w-7 fill-current/15" aria-hidden="true" />
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#BCE0CA] bg-white px-3 py-1 text-xs font-bold text-[#115532] tabular-nums">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <bdi dir="ltr">#{payload.orderNumber}</bdi>
          </div>

          <h2
            id="delivered-thank-you-title"
            className="mt-3.5 font-display text-xl font-bold leading-snug tracking-tight text-[#141A15] sm:text-2xl"
          >
            {formattedTitle}
          </h2>
        </div>

        {/* Message + Savings Highlights + Actions */}
        <div className="space-y-5 px-6 pb-6 pt-5">
          <p className="text-start text-sm leading-relaxed text-[#3B443D] sm:text-[15px]">
            {formattedBody}
          </p>

          {showAnySavingsPill && (
            <div
              className={`grid gap-3 ${
                orderSavings > 0 && lifetimeSavings > 0
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {orderSavings > 0 && (
                <div
                  data-testid="thank-you-order-savings-pill"
                  className="rounded-2xl border border-[#BCE0CA] bg-[#EFF6F2] px-4 py-3.5 text-start"
                >
                  <p className="text-[11px] font-semibold text-[#3C664D]">
                    {t.retention.savedThisOrderLabel}
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-[#115532] tabular-nums">
                    {formatIqd(orderSavings, language)}
                  </p>
                </div>
              )}

              {lifetimeSavings > 0 && (
                <div
                  data-testid="thank-you-lifetime-savings-pill"
                  className="rounded-2xl border border-[#BCE0CA] bg-[#EFF6F2] px-4 py-3.5 text-start"
                >
                  <p className="text-[11px] font-semibold text-[#3C664D]">
                    {t.retention.totalSavedSoFarLabel}
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-[#115532] tabular-nums">
                    {formatIqd(lifetimeSavings, language)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              data-testid="delivered-thank-you-continue-btn"
              onClick={onContinueShopping}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-primary)] px-5 text-sm font-bold text-[var(--brand-primary-fg)] shadow-xs transition-all hover:opacity-92 active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.retention.continueShoppingCta}</span>
            </button>

            <button
              type="button"
              data-testid="delivered-thank-you-close-btn"
              onClick={onClose}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#D4DAD2] bg-white px-5 text-sm font-semibold text-[#3F4841] transition-colors hover:bg-[#F5F7F4] active:scale-[0.99]"
            >
              {t.retention.closeCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
