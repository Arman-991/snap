import { ShoppingBasket } from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import type { TranslationDictionary } from '../i18n/translations';
import { BOTTOM_FLOATING_BASKET_ID } from '../utils/flyToBasket';

interface FloatingCartBarProps {
  t: TranslationDictionary;
  onOpenCart: () => void;
}

export function FloatingCartBar({ t, onOpenCart }: FloatingCartBarProps) {
  const { itemCount } = useCartContext();

  if (itemCount <= 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 justify-end px-4">
      <button
        id={BOTTOM_FLOATING_BASKET_ID}
        type="button"
        data-testid="floating-cart-fab"
        aria-label={`${t.nav.cart} (${itemCount})`}
        onClick={onOpenCart}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-[0_8px_24px_rgba(22,163,74,0.38)] transition-transform duration-150 hover:bg-green-700 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
      >
        <ShoppingBasket className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span
          data-testid="floating-cart-count"
          className="absolute -end-1.5 -top-1.5 flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-green-600 bg-white px-1.5 text-xs font-extrabold text-green-700 shadow-sm tabular-nums"
        >
          {itemCount}
        </span>
      </button>
    </div>
  );
}
