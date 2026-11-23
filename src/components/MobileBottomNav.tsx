import { ClipboardList, LayoutGrid, ShoppingBag, Store, User } from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import type { TranslationDictionary } from '../i18n/translations';
import type { AppView } from '../types/grocery';

interface MobileBottomNavProps {
  t: TranslationDictionary;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenCart: () => void;
}

export function MobileBottomNav({
  t,
  activeView,
  onSelectView,
  onOpenCart,
}: MobileBottomNavProps) {
  const { itemCount: cartCount } = useCartContext();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 h-14 border-t border-[#E5E7E4] bg-white/95 backdrop-blur-sm md:hidden"
    >
      <div className="grid h-full grid-cols-5">
        <button
          type="button"
          data-testid="bottom-nav-market"
          onClick={() => onSelectView('market')}
          className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'market' ? 'text-[var(--brand-primary)]' : 'text-[#566058]'
          }`}
        >
          <Store className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="w-full truncate text-center">{t.nav.market}</span>
        </button>

        <button
          type="button"
          data-testid="bottom-nav-categories"
          onClick={() => onSelectView('categories')}
          className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'categories' || activeView === 'quicklist'
              ? 'text-[var(--brand-primary)]'
              : 'text-[#566058]'
          }`}
        >
          <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="w-full truncate text-center">{t.nav.categories}</span>
        </button>

        <button
          type="button"
          data-testid="bottom-nav-orders"
          onClick={() => onSelectView('orders')}
          className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'orders' ? 'text-[var(--brand-primary)]' : 'text-[#566058]'
          }`}
        >
          <ClipboardList className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="w-full truncate text-center">{t.nav.orders}</span>
        </button>

        <button
          type="button"
          data-testid="bottom-nav-profile"
          onClick={() => onSelectView('profile')}
          className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'profile' ? 'text-[var(--brand-primary)]' : 'text-[#566058]'
          }`}
        >
          <User className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="w-full truncate text-center">{t.nav.profile}</span>
        </button>

        <button
          type="button"
          data-testid="bottom-nav-cart"
          onClick={onOpenCart}
          className="flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold text-[var(--brand-primary)] transition-all active:scale-95"
        >
          <span className="relative inline-flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
            {cartCount > 0 && (
              <span
                data-testid="bottom-nav-cart-badge"
                className="absolute -end-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand-primary)] px-1 text-[10px] font-bold text-[var(--brand-primary-fg)] tabular-nums"
              >
                {cartCount}
              </span>
            )}
          </span>
          <span className="w-full truncate text-center">{t.nav.cart}</span>
        </button>
      </div>
    </nav>
  );
}
