import { ChevronRight, ShoppingBag } from 'lucide-react';
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
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-20 px-3 sm:px-6 md:bottom-5">
      <div className="mx-auto flex max-w-[680px] justify-center">
        <button
          type="button"
          data-testid="floating-cart-bar"
          onClick={onOpenCart}
          className="pointer-events-auto flex min-h-[52px] w-full items-center justify-between gap-2 rounded-2xl bg-[#16A34A] px-3 py-2 text-white shadow-lg shadow-[#16A34A]/25 transition-transform active:scale-[0.985] hover:bg-[#15803D] sm:gap-3 sm:px-4"
        >
          <span className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/18">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span
                data-testid="floating-cart-count"
                className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold text-[#15803D] tabular-nums"
              >
                {summary.itemCount}
              </span>
            </span>
            <span className="line-clamp-2 text-start font-display text-[12px] font-bold leading-tight sm:text-sm">
              {label}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-1">
            <span
              data-testid="floating-cart-total"
              className="font-display text-xs font-extrabold tabular-nums sm:text-sm"
            >
              {formatIqd(summary.grandTotal, language)}
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 rtl:rotate-180"
              aria-hidden="true"
            />
          </span>
        </button>
      </div>
    </div>
  );
}
