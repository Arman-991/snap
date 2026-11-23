import { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';

const FALLBACK_CART_IMAGE = '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';
import { useCartContext } from '../context/CartContext';
import type { OrderSubmitErrorCode } from '../hooks/useOrders';
import { formatIqd, getNameByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  Language,
  OrderRecord,
  StoreSettings,
  UserProfile,
} from '../types/grocery';
import { buildWhatsAppUrl } from '../utils/supermarketLogic';
import { OrderStatusBanner, type ActiveOrderAlert } from './OrderStatusBanner';

interface CartDrawerProps {
  isOpen: boolean;
  t: TranslationDictionary;
  language: Language;
  settings: StoreSettings;
  profile: UserProfile | null;
  isOnline: boolean;
  isSubmitting: boolean;
  submitErrorCode: OrderSubmitErrorCode | null;
  confirmedOrder: OrderRecord | null;
  orderAlert?: ActiveOrderAlert | null;
  onDismissOrderAlert?: () => void;
  onClose: () => void;
  onEditProfile: () => void;
  onPlaceOrder: () => Promise<void>;
  onViewOrders: () => void;
  onResetConfirmation: () => void;
}

export function CartDrawer({
  isOpen,
  t,
  language,
  settings,
  profile,
  isOnline,
  isSubmitting,
  submitErrorCode,
  confirmedOrder,
  orderAlert = null,
  onDismissOrderAlert,
  onClose,
  onEditProfile,
  onPlaceOrder,
  onViewOrders,
  onResetConfirmation,
}: CartDrawerProps) {
  const {
    items,
    lines,
    summary,
    itemCount,
    increment: onIncrement,
    decrement: onDecrement,
    remove: onRemove,
    clearCart: onClearCart,
  } = useCartContext();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getErrorMessage = (code: OrderSubmitErrorCode): string => {
    switch (code) {
      case 'PHONE_BLOCKED':
        return t.cart.errors.blockedPhone;
      case 'RATE_LIMIT_EXCEEDED':
        return t.cart.errors.rateLimit;
      case 'STORE_CLOSED':
        return t.cart.errors.storeClosed;
      case 'BELOW_MINIMUM':
        return t.cart.errors.belowMinimum;
      case 'PROFILE_REQUIRED':
        return t.cart.errors.profileRequired;
      case 'OFFLINE':
        return t.cart.errors.offlineOrder;
      default:
        return t.cart.errors.genericOrderError;
    }
  };

  const isCartEmpty = items.length === 0 || lines.length === 0;

  const canBuy =
    !isCartEmpty &&
    settings.isStoreOpen &&
    summary.meetsMinimumOrder &&
    Boolean(profile) &&
    isOnline &&
    !isSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={t.cart.title}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7E4] px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-[#141A15]">
              {confirmedOrder ? t.confirmation.title : t.cart.title}
            </h2>
            {!confirmedOrder && itemCount > 0 && (
              <span className="text-xs font-semibold text-[#616B63] tabular-nums">
                ({itemCount})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!confirmedOrder && !isCartEmpty && (
              <button
                type="button"
                onClick={onClearCart}
                className="min-h-[48px] rounded-xl px-3 text-xs font-semibold text-[#616B63] hover:bg-[#F3F5F2] hover:text-[#141A15]"
              >
                {t.cart.clear}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.cart.close}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#F3F5F2]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Non-blocking Order Accepted / Delivered Banner inside Cart */}
        {orderAlert && onDismissOrderAlert && (
          <div className="border-b border-[#E5E7E4] bg-white px-4 py-3 sm:px-5">
            <OrderStatusBanner
              alert={orderAlert}
              t={t}
              onDismiss={onDismissOrderAlert}
              compact
            />
          </div>
        )}

        {/* ORDER CONFIRMATION SCREEN */}
        {confirmedOrder ? (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="rounded-2xl border border-[#C6E4D1] bg-[#EFF6F2] p-5 text-start">
              <div className="flex items-center gap-2.5 text-[#15663C]">
                <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold">
                  {t.confirmation.title}
                </h3>
              </div>

              <p className="mt-2.5 text-sm leading-relaxed text-[#253C2E]">
                {t.confirmation.callNotice}
              </p>

              <dl className="mt-4 space-y-2 border-t border-[#CBE4D4] pt-3.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#4B6354]">
                    {t.confirmation.orderNumberLabel}
                  </dt>
                  <dd className="font-display font-bold text-[#141A15] tabular-nums">
                    {confirmedOrder.orderNumber}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#4B6354]">{t.confirmation.totalLabel}</dt>
                  <dd className="font-display font-bold text-[#15663C] tabular-nums">
                    {formatIqd(confirmedOrder.grandTotal, language)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#4B6354]">{t.cart.codLabel}</dt>
                  <dd className="font-semibold text-[#141A15]">
                    {t.confirmation.paymentMethodValue}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Direct Green WhatsApp Link (No window.open) */}
            <a
              href={buildWhatsAppUrl(
                settings.whatsappPhone,
                confirmedOrder,
                language
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#1FA855] px-5 text-sm font-bold text-white transition-colors hover:bg-[#189148]"
            >
              <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t.confirmation.whatsappCta}</span>
            </a>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  onResetConfirmation();
                  onViewOrders();
                }}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-4 text-sm font-semibold text-[#141A15] hover:bg-[#F5F7F4]"
              >
                {t.confirmation.viewOrdersCta}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetConfirmation();
                  onClose();
                }}
                className="min-h-[48px] rounded-xl bg-[#141A15] px-4 text-sm font-semibold text-white hover:bg-[#273129]"
              >
                {t.confirmation.continueCta}
              </button>
            </div>
          </div>
        ) : isCartEmpty ? (
          /* EMPTY CART — strictly renders ONLY empty state (never leftover items, subtotal, or savings box) */
          <div
            data-testid="empty-cart-view"
            className="flex flex-1 flex-col items-center justify-center p-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F5F2] text-[#616B63]">
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-[#141A15]">
              {t.cart.emptyTitle}
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-[#566058]">
              {t.cart.emptyBody}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 min-h-[48px] rounded-xl bg-[#15663C] px-6 text-sm font-semibold text-white hover:bg-[#105230]"
            >
              {t.cart.browseCta}
            </button>
          </div>
        ) : (
          /* ACTIVE CART LINES + LIVE SAVINGS + BUY CTA */
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* Green Savings Box — shown ONLY when totalSavings > 0 */}
              {summary.totalSavings > 0 && (
                <div
                  data-testid="cart-savings-banner"
                  className="mb-4 rounded-xl border border-[#BCE0CA] bg-[#EFF6F2] p-3.5 text-sm font-semibold text-[#115532]"
                >
                  {t.cart.savingsPrefix}{' '}
                  <span className="font-bold tabular-nums">
                    {formatIqd(summary.totalSavings, language)}
                  </span>{' '}
                  {t.cart.savingsSuffix}
                </div>
              )}

              {/* Store Closed Alert */}
              {!settings.isStoreOpen && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] p-3.5 text-xs font-medium text-[#9A2E20]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.cart.storeClosedNotice}</span>
                </div>
              )}

              {/* Minimum Order Notice */}
              {!summary.meetsMinimumOrder && (
                <div
                  data-testid="minimum-order-notice"
                  className="mb-4 rounded-xl border border-[#F2DEC0] bg-[#FEF9EE] p-3.5 text-xs font-medium text-[#8C5B12]"
                >
                  {t.cart.minimumOrderNoticePrefix}{' '}
                  <span className="font-bold tabular-nums">
                    {formatIqd(summary.minimumOrder, language)}
                  </span>{' '}
                  —{' '}
                  <span className="font-bold tabular-nums">
                    {formatIqd(summary.remainingForMinimum, language)}
                  </span>{' '}
                  {t.cart.minimumOrderNoticeSuffix}
                </div>
              )}

              {/* Cart Items List */}
              <ul className="divide-y divide-[#ECEFEA]">
                {lines.map(({ product, quantity, lineTotal }) => {
                  const name = getNameByLang(product, language);
                  return (
                    <li key={product.id} className="flex gap-3 py-3.5">
                      <img
                        src={product.imageUrl || FALLBACK_CART_IMAGE}
                        alt={name}
                        loading="lazy"
                        onError={(e) => {
                          if (!e.currentTarget.src.endsWith(FALLBACK_CART_IMAGE)) {
                            e.currentTarget.src = FALLBACK_CART_IMAGE;
                          }
                        }}
                        className="h-16 w-16 shrink-0 rounded-xl bg-[#F3F5F2] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-bold text-[#141A15]">
                              {name}
                            </p>
                            <p className="text-xs text-[#616B63]">
                              <bdi dir="ltr">{product.size}</bdi> ·{' '}
                              <bdi className="tabular-nums">
                                {formatIqd(product.ourPrice, language)}
                              </bdi>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(product.id)}
                            aria-label={`${t.cart.remove} ${name}`}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[#7A847C] hover:bg-[#F3F5F2] hover:text-[#B42318]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="inline-flex min-h-[48px] items-center rounded-xl border border-[#DCE1DB] bg-[#FAFBF9]">
                            <button
                              type="button"
                              onClick={() => onDecrement(product)}
                              aria-label={`${t.product.decreaseQty} ${name}`}
                              className="flex h-12 w-12 items-center justify-center rounded-xl text-[#141A15] transition-all hover:bg-[#ECEFEA] active:scale-95"
                            >
                              <Minus className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <span className="min-w-[28px] text-center text-sm font-bold text-[#141A15] tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onIncrement(product)}
                              aria-label={`${t.product.increaseQty} ${name}`}
                              className="flex h-12 w-12 items-center justify-center rounded-xl text-[#141A15] transition-all hover:bg-[#ECEFEA] active:scale-95"
                            >
                              <Plus className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>

                          <span className="font-display text-sm font-bold text-[#141A15] tabular-nums">
                            {formatIqd(lineTotal, language)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Saved Customer Delivery Preview */}
              {profile && (
                <div className="mt-4 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#566058]">
                      <MapPin className="h-3.5 w-3.5 text-[#15663C]" aria-hidden="true" />
                      {t.cart.deliverToLabel}
                    </span>
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="min-h-[48px] rounded-lg px-2.5 text-xs font-semibold text-[#15663C] hover:bg-[#EFF6F2]"
                    >
                      {t.cart.editProfile}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#141A15]">
                    {profile.fullName} ·{' '}
                    <span dir="ltr" className="tabular-nums font-medium">
                      {profile.phoneDisplay}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#566058]">
                    {profile.addressText}
                    {profile.buildingNotes ? ` (${profile.buildingNotes})` : ''}
                  </p>
                </div>
              )}

              {/* Submit Error Notice */}
              {submitErrorCode && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] p-3.5 text-xs font-medium text-[#9A2E20]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{getErrorMessage(submitErrorCode)}</span>
                </div>
              )}
            </div>

            {/* Sticky Bottom Totals & Buy CTA */}
            <div className="border-t border-[#E5E7E4] bg-[#FAFBF9] p-4 sm:p-5">
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-[#4E5750]">
                  <dt>{t.cart.subtotal}</dt>
                  <dd className="font-semibold text-[#141A15] tabular-nums">
                    {formatIqd(summary.subtotal, language)}
                  </dd>
                </div>
                <div className="flex items-center justify-between text-[#4E5750]">
                  <dt>{t.cart.deliveryFee}</dt>
                  <dd className="font-semibold text-[#141A15] tabular-nums">
                    {summary.deliveryFee === 0
                      ? t.cart.free
                      : formatIqd(summary.deliveryFee, language)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-[#E2E6E1] pt-2 font-display text-base font-bold text-[#141A15]">
                  <dt>{t.cart.grandTotal}</dt>
                  <dd className="text-[var(--brand-primary)] tabular-nums">
                    {formatIqd(summary.grandTotal, language)}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={!canBuy}
                aria-busy={isSubmitting}
                onClick={() => void onPlaceOrder()}
                className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-bold text-[var(--brand-primary-fg)] transition-all hover:opacity-92 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                )}
                <span>{isSubmitting ? t.cart.placingOrder : t.cart.buyButton}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
