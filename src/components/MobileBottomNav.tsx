import { ClipboardList, LayoutGrid, Store, Tag, User } from 'lucide-react';
import type { TranslationDictionary } from '../i18n/translations';
import type { AppView } from '../types/grocery';

export type BottomNavTab = 'market' | 'categories' | 'deals' | 'orders' | 'profile';

interface MobileBottomNavProps {
  t: TranslationDictionary;
  activeView: AppView;
  isDealsActive: boolean;
  hasActiveOrder: boolean;
  onSelectTab: (tab: BottomNavTab) => void;
}

export function MobileBottomNav({
  t,
  activeView,
  isDealsActive,
  hasActiveOrder,
  onSelectTab,
}: MobileBottomNavProps) {
  const currentTab: BottomNavTab =
    activeView === 'categories' || activeView === 'quicklist'
      ? 'categories'
      : activeView === 'orders'
        ? 'orders'
        : activeView === 'profile'
          ? 'profile'
          : isDealsActive
            ? 'deals'
            : 'market';

  const tabs: Array<{
    id: BottomNavTab;
    label: string;
    icon: typeof Store;
    showActiveDot?: boolean;
  }> = [
    { id: 'market', label: t.nav.market, icon: Store },
    { id: 'categories', label: t.nav.categories, icon: LayoutGrid },
    { id: 'deals', label: t.nav.deals, icon: Tag },
    {
      id: 'orders',
      label: t.nav.orders,
      icon: ClipboardList,
      showActiveDot: hasActiveOrder,
    },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      data-testid="mobile-bottom-nav"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-gray-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md"
    >
      <div className="grid h-16 grid-cols-5">
        {tabs.map(({ id, label, icon: Icon, showActiveDot }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`bottom-nav-${id}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(id)}
              className="group flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 transition-transform duration-100 active:scale-95 focus-visible:outline-none"
            >
              <span
                className={`relative inline-flex items-center justify-center rounded-full px-3 py-1 transition-all duration-150 ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-500 group-hover:text-gray-800'
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.9}
                  aria-hidden="true"
                />
                {showActiveDot && (
                  <span
                    data-testid="orders-active-status-dot"
                    className="absolute end-1.5 top-0.5 h-2 w-2 rounded-full bg-green-600 ring-2 ring-white"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={`w-full truncate text-center text-[10px] leading-tight transition-colors duration-150 ${
                  isActive
                    ? 'font-bold text-green-700'
                    : 'font-medium text-gray-500 group-hover:text-gray-800'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
