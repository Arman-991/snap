import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import { formatIqd } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language } from '../types/grocery';

interface FloatingCartBarProps {
  t: TranslationDictionary;
  language: Language;
  ctaLabel?: string;
  alwaysShow?: boolean;
  onOpenCart: () => void;
}

export function FloatingCartBar({
  t,
  language,
  ctaLabel,
  alwaysShow = false,
  onOpenCart,
}: FloatingCartBarProps) {
  const { summary } = useCartContext();

  if (!alwaysShow && summary.itemCount <= 0) {
    return null;
  }

  const label = ctaLabel || t.categoriesPage.floatingCartView;

  return (
    <div className="pointer-events-none fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 px-3">
      <button
        type="button"
        data-testid="floating-cart-bar"
        onClick={onOpenCart}
        className="pointer-events-auto flex min-h-[50px] w-full items-center justify-between gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-white shadow-lg shadow-green-900/25 transition-transform duration-100 hover:bg-green-700 active:scale-[0.98]"
      >
        {/* Start: Count + Live IQD Total + Live Savings Badge */}
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/18">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span
              data-testid="floating-cart-count"
              className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold text-green-700 tabular-nums shadow-xs"
            >
              {summary.itemCount}
            </span>
          </span>

          <span className="flex min-w-0 flex-col items-start">
            <span className="flex flex-wrap items-center gap-1.5">
              <span
                data-testid="floating-cart-total"
                className="font-display text-sm font-extrabold leading-tight tabular-nums"
              >
                {formatIqd(summary.grandTotal, language)}
              </span>
              {summary.totalSavings > 0 && (
                <span
                  data-testid="floating-cart-savings"
                  className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums"
                >
                  {t.product.youSaveLabel}{' '}
                  {formatIqd(summary.totalSavings, language)}
                </span>
              )}
            </span>
          </span>
        </span>

        {/* End: View Cart -> */}
        <span className="flex shrink-0 items-center gap-1 text-xs font-extrabold whitespace-nowrap">
          <span className="max-w-[130px] truncate">{label}</span>
          <ArrowRight
            className="h-4 w-4 shrink-0 rtl:rotate-180"
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
  );
}
