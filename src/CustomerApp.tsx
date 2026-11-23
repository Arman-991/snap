import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import {
  DeliveredThankYouModal,
  type DeliveredThankYouPayload,
} from './components/DeliveredThankYouModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import {
  MobileBottomNav,
  type BottomNavTab,
} from './components/MobileBottomNav';
import { OnboardingScreen } from './components/OnboardingScreen';
import {
  OrderStatusBanner,
  type ActiveOrderAlert,
} from './components/OrderStatusBanner';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartProvider, useCartContext } from './context/CartContext';
import { useAuthProfile } from './hooks/useAuthProfile';
import { useBrowserOrderAlerts } from './hooks/useBrowserOrderAlerts';
import { useCatalog } from './hooks/useCatalog';
import { useLanguage } from './hooks/useLanguage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useOrders } from './hooks/useOrders';
import { CategoriesPage } from './pages/CategoriesPage';
import { MarketPage } from './pages/MarketPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { QuickShoppingListPage } from './pages/QuickShoppingListPage';
import type {
  AppView,
  CustomerNotificationItem,
  Language,
  OrderRecord,
  OrderStatus,
  Product,
  ProfileFormInput,
} from './types/grocery';
import type { TranslationDictionary } from './i18n/translations';
import {
  getAccessibleContrastText,
  mergeCmsTranslations,
} from './utils/adminLogic';
import {
  computeLifetimeSavings,
  evaluateOrdersForCartClear,
  findUnseenDeliveredOrder,
  formatDeliveredThankYouTemplate,
} from './utils/supermarketLogic';

const ACK_ALERTS_STORAGE_KEY = 'bazar_fresh_ack_order_alerts_v1';
const CLEARED_ORDERS_STORAGE_KEY = 'bazar_fresh_cleared_order_ids_v1';
const SEEN_DELIVERED_POPUP_KEY = 'seenDeliveredPopupIds';
const LEGACY_SEEN_DELIVERED_KEY = 'seenDeliveredThankYouIds';
const NOTIFICATIONS_STORAGE_KEY = 'bazar_fresh_notifications_v1';

function loadNotificationsFromStorage(): CustomerNotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomerNotificationItem =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.orderId === 'string' &&
        typeof item.orderNumber === 'string'
    );
  } catch {
    return [];
  }
}

function saveNotificationsToStorage(items: CustomerNotificationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(items.slice(0, 30))
    );
  } catch {
    // ignore storage errors
  }
}

function loadStringSetFromStorage(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((v): v is string => typeof v === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

function persistStringsToStorage(key: string, additions: string[]): void {
  if (typeof window === 'undefined' || additions.length === 0) return;
  try {
    const existing = loadStringSetFromStorage(key);
    for (const entry of additions) {
      existing.add(entry);
    }
    window.localStorage.setItem(
      key,
      JSON.stringify(Array.from(existing).slice(-100))
    );
  } catch {
    // ignore storage errors
  }
}

export function CustomerApp() {
  const { language, t: defaultT, setLanguage } = useLanguage();
  const isOnline = useOnlineStatus();
  const authProfile = useAuthProfile(language, setLanguage);
  const catalog = useCatalog();
  const ordersHook = useOrders(
    authProfile.user?.uid ?? null,
    authProfile.authReady
  );

  const t = useMemo(
    () => mergeCmsTranslations(defaultT, catalog.cms, language),
    [defaultT, catalog.cms, language]
  );

  // Apply live brand primary color & WCAG-safe text color via CSS custom properties
  useEffect(() => {
    const primary =
      catalog.settings.primaryColor || catalog.settings.themeColor || '#15663C';
    const fg = getAccessibleContrastText(primary);
    document.documentElement.style.setProperty('--brand-primary', primary);
    document.documentElement.style.setProperty('--brand-primary-fg', fg);
  }, [catalog.settings.primaryColor, catalog.settings.themeColor]);

  return (
    <CartProvider
      productsById={catalog.productsById}
      settings={catalog.settings}
      uid={authProfile.user?.uid ?? null}
      profile={authProfile.profile}
      orders={ordersHook.orders}
      ordersLoading={ordersHook.loading}
      onCartCleared={authProfile.clearProfileCartLocal}
    >
      <CustomerAppShell
        language={language}
        setLanguage={setLanguage}
        t={t}
        isOnline={isOnline}
        authProfile={authProfile}
        catalog={catalog}
        ordersHook={ordersHook}
      />
    </CartProvider>
  );
}

interface CustomerAppShellProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  isOnline: boolean;
  authProfile: ReturnType<typeof useAuthProfile>;
  catalog: ReturnType<typeof useCatalog>;
  ordersHook: ReturnType<typeof useOrders>;
}

function CustomerAppShell({
  language,
  setLanguage,
  t,
  isOnline,
  authProfile,
  catalog,
  ordersHook,
}: CustomerAppShellProps) {
  const cart = useCartContext();
  const browserAlerts = useBrowserOrderAlerts();

  const [activeView, setActiveView] = useState<AppView>('market');
  const [selectedVisualCategoryId, setSelectedVisualCategoryId] = useState<
    string | null
  >(null);
  const [quickListReturnView, setQuickListReturnView] = useState<
    'market' | 'categories'
  >('categories');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [orderAlert, setOrderAlert] = useState<ActiveOrderAlert | null>(null);
  const [thankYouModal, setThankYouModal] =
    useState<DeliveredThankYouPayload | null>(null);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>(
    () => loadNotificationsFromStorage()
  );

  const prevOrderStatusesRef = useRef<Map<string, OrderStatus> | null>(null);
  const clearedOrderIdsRef = useRef<Set<string>>(
    loadStringSetFromStorage(CLEARED_ORDERS_STORAGE_KEY)
  );
  const seenPopupIdsRef = useRef<Set<string>>(
    new Set([
      ...loadStringSetFromStorage(SEEN_DELIVERED_POPUP_KEY),
      ...loadStringSetFromStorage(LEGACY_SEEN_DELIVERED_KEY),
    ])
  );
  const notifiedDeliveredIdsRef = useRef<Set<string>>(new Set());
  const reorderedOrderIdsRef = useRef<Set<string>>(new Set());
  const latestCartItemsRef = useRef(cart.items);
  latestCartItemsRef.current = cart.items;
  const latestOrdersRef = useRef(ordersHook.orders);
  latestOrdersRef.current = ordersHook.orders;
  const latestOrdersLoadingRef = useRef(ordersHook.loading);
  latestOrdersLoadingRef.current = ordersHook.loading;
  const latestProfileNameRef = useRef(authProfile.profile?.fullName ?? '');
  latestProfileNameRef.current = authProfile.profile?.fullName ?? '';
  const latestTranslationsRef = useRef(t);
  latestTranslationsRef.current = t;

  const { lifetimeSavings, deliveredOrderCount } = useMemo(
    () => computeLifetimeSavings(ordersHook.orders),
    [ordersHook.orders]
  );

  const hasActiveOrder = useMemo(
    () =>
      ordersHook.orders.some(
        (order) =>
          order.status === 'New' ||
          order.status === 'Called' ||
          order.status === 'Confirmed' ||
          order.status === 'Bought'
      ),
    [ordersHook.orders]
  );

  const hasCustomThankYouBody = Boolean(
    catalog.cms.deliveredThankYouBody?.[language]?.trim()
  );

  const bypassOnboarding =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView, selectedVisualCategoryId, Boolean(authProfile.profile)]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Customer-side real-time orders listener watcher:
  // 1) Clears cart directly from customer session once per order ID when order is New, Confirmed, or Delivered
  //    (never wiping a brand-new cart the customer builds afterward)
  // 2) Shows dismissible green notification banners when an order moves to Confirmed or Delivered
  // 3) Clears any leftover confirmedOrder screen when that order progresses to Confirmed/Delivered
  useEffect(() => {
    if (ordersHook.loading) return;

    const prevMap = prevOrderStatusesRef.current;
    const decision = evaluateOrdersForCartClear({
      orders: ordersHook.orders,
      currentCartItems: latestCartItemsRef.current,
      clearedOrderIds: clearedOrderIdsRef.current,
      reorderedOrderIds: reorderedOrderIdsRef.current,
      prevOrderStatuses: prevMap,
    });

    if (decision.newlyClearedOrderIds.length > 0) {
      for (const orderId of decision.newlyClearedOrderIds) {
        clearedOrderIdsRef.current.add(orderId);
      }
      persistStringsToStorage(
        CLEARED_ORDERS_STORAGE_KEY,
        decision.newlyClearedOrderIds
      );
    }

    if (decision.shouldClearCart) {
      cart.clearCart();
    }

    const acked = loadStringSetFromStorage(ACK_ALERTS_STORAGE_KEY);
    let nextAlert: ActiveOrderAlert | null = null;
    const progressedOrderIds = new Set<string>();

    if (prevMap !== null) {
      // Live transition while the customer app is open
      for (const order of ordersHook.orders) {
        const prevStatus = prevMap.get(order.id);
        if (prevStatus === order.status) continue;

        if (order.status === 'Delivered' || order.status === 'Confirmed') {
          progressedOrderIds.add(order.id);
          const key = `${order.id}:${order.status}`;
          if (!acked.has(key) && !nextAlert) {
            nextAlert = {
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
            };
          }
        }
      }
    } else {
      // Initial snapshot after returning from WhatsApp or reloading the PWA:
      // Surface an unacknowledged recent Confirmed/Delivered alert (last 24h)
      const recentCutoff = Date.now() - 24 * 60 * 60 * 1000;
      for (const order of ordersHook.orders) {
        if (order.updatedAtMs < recentCutoff) continue;
        if (order.status === 'Confirmed' || order.status === 'Delivered') {
          const key = `${order.id}:${order.status}`;
          if (!acked.has(key)) {
            nextAlert = {
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
            };
            break;
          }
        }
      }
    }

    if (progressedOrderIds.size > 0) {
      setConfirmedOrder((current) =>
        current && progressedOrderIds.has(current.id) ? null : current
      );
    }

    if (nextAlert) {
      setOrderAlert(nextAlert);
    }

    prevOrderStatusesRef.current = new Map(
      ordersHook.orders.map((o) => [o.id, o.status])
    );
  }, [cart.clearCart, ordersHook.loading, ordersHook.orders]);

  const markDeliveredPopupSeen = useCallback((orderId: string) => {
    if (!orderId) return;
    seenPopupIdsRef.current.add(orderId);
    persistStringsToStorage(SEEN_DELIVERED_POPUP_KEY, [orderId]);
  }, []);

  // State-based check for unseen Delivered orders (mobile-reliable even when background tabs pause)
  const checkUnseenDeliveredOrders = useCallback(
    (currentOrders: OrderRecord[]) => {
      if (latestOrdersLoadingRef.current || currentOrders.length === 0) return;

      // Refresh seen IDs from localStorage in case another tab already marked an order
      const storedSeen = loadStringSetFromStorage(SEEN_DELIVERED_POPUP_KEY);
      for (const id of storedSeen) {
        seenPopupIdsRef.current.add(id);
      }

      const {
        mostRecentUnseen,
        allUnseenDelivered,
        lifetimeSavings: computedLifetime,
        deliveredOrderCount: computedDeliveredCount,
      } = findUnseenDeliveredOrder(currentOrders, seenPopupIdsRef.current);

      if (!mostRecentUnseen) return;

      const resolvedCustomerName =
        mostRecentUnseen.customerName?.trim() || latestProfileNameRef.current;

      const payload: DeliveredThankYouPayload = {
        orderId: mostRecentUnseen.id,
        orderNumber: mostRecentUnseen.orderNumber,
        customerName: resolvedCustomerName,
        orderSavings: Math.max(0, Math.round(mostRecentUnseen.totalSavings || 0)),
        lifetimeSavings: computedLifetime,
        deliveredOrderCount: computedDeliveredCount,
      };

      // Open the warm Thank-You Popup modal immediately (do not overwrite if already showing this order)
      setThankYouModal((current) =>
        current && current.orderId === payload.orderId ? current : payload
      );

      // Add bell entries for unseen delivered orders if not already recorded
      setNotifications((prev) => {
        const existingOrderIds = new Set(prev.map((n) => n.orderId));
        const additions: CustomerNotificationItem[] = allUnseenDelivered
          .filter((o) => !existingOrderIds.has(o.id))
          .map((o) => ({
            id: `delivered_${o.id}`,
            orderId: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName?.trim() || latestProfileNameRef.current,
            orderSavings: Math.max(0, Math.round(o.totalSavings || 0)),
            lifetimeSavings: computedLifetime,
            deliveredOrderCount: computedDeliveredCount,
            createdAtMs: o.updatedAtMs || Date.now(),
            read: false,
          }));
        if (additions.length === 0) return prev;
        const merged = [...additions, ...prev].slice(0, 30);
        saveNotificationsToStorage(merged);
        return merged;
      });

      // Fire cross-platform mobile notification safely in the background (once per delivered order)
      if (!notifiedDeliveredIdsRef.current.has(payload.orderId)) {
        notifiedDeliveredIdsRef.current.add(payload.orderId);
        try {
          const dict = latestTranslationsRef.current;
          const templateParams = {
            name: payload.customerName,
            orderNumber: payload.orderNumber,
            orderSavings: payload.orderSavings,
            lifetimeSavings: computedLifetime,
          };
          const notifTitle = formatDeliveredThankYouTemplate(
            dict.retention.mobileNotifTitle,
            templateParams
          );
          const notifBodyTemplate =
            payload.orderSavings > 0
              ? dict.retention.mobileNotifBody
              : computedLifetime > 0
                ? dict.retention.mobileNotifBodyNoOrderSavings
                : dict.retention.mobileNotifBodySimple;
          const notifBody = formatDeliveredThankYouTemplate(
            notifBodyTemplate,
            templateParams
          );
          browserAlerts.sendBrowserNotification(
            notifTitle,
            notifBody,
            `delivered-${payload.orderId}`
          );
        } catch {
          // Never allow notification errors to disrupt the in-app popup
        }
      }
    },
    [browserAlerts.sendBrowserNotification]
  );

  // Trigger check (1) immediately when orders load & (2) whenever Firestore onSnapshot updates
  useEffect(() => {
    if (ordersHook.loading) return;
    checkUnseenDeliveredOrders(ordersHook.orders);
  }, [checkUnseenDeliveredOrders, ordersHook.loading, ordersHook.orders]);

  // Trigger check (3) whenever user returns to the app tab on mobile/desktop
  useEffect(() => {
    const handleReturnToApp = () => {
      if (document.visibilityState === 'hidden') return;
      checkUnseenDeliveredOrders(latestOrdersRef.current);
    };
    document.addEventListener('visibilitychange', handleReturnToApp);
    window.addEventListener('focus', handleReturnToApp);
    return () => {
      document.removeEventListener('visibilitychange', handleReturnToApp);
      window.removeEventListener('focus', handleReturnToApp);
    };
  }, [checkUnseenDeliveredOrders]);

  // Mark order.id in seenDeliveredPopupIds ONLY when the popup is actually displayed
  useEffect(() => {
    if (!thankYouModal) return;
    markDeliveredPopupSeen(thankYouModal.orderId);
  }, [markDeliveredPopupSeen, thankYouModal]);

  const handleSelectNotification = useCallback(
    (item: CustomerNotificationItem) => {
      setNotifications((prev) => {
        const next = prev.map((entry) =>
          entry.id === item.id ? { ...entry, read: true } : entry
        );
        saveNotificationsToStorage(next);
        return next;
      });
      setThankYouModal({
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        customerName: item.customerName || authProfile.profile?.fullName || '',
        orderSavings: item.orderSavings,
        lifetimeSavings: Math.max(item.lifetimeSavings, lifetimeSavings),
        deliveredOrderCount: Math.max(
          item.deliveredOrderCount,
          deliveredOrderCount
        ),
      });
    },
    [authProfile.profile?.fullName, deliveredOrderCount, lifetimeSavings]
  );

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((entry) => ({ ...entry, read: true }));
      saveNotificationsToStorage(next);
      return next;
    });
  }, []);

  const handleDismissOrderAlert = useCallback(() => {
    setOrderAlert((current) => {
      if (current) {
        persistStringsToStorage(ACK_ALERTS_STORAGE_KEY, [
          `${current.orderId}:${current.status}`,
        ]);
      }
      return null;
    });
  }, []);

  const handleOpenCart = useCallback(() => {
    ordersHook.clearSubmitError();
    // Never show an old completed order confirmation when opening Cart manually
    setConfirmedOrder(null);
    setIsCartOpen(true);
  }, [ordersHook]);

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
    setConfirmedOrder(null);
  }, []);

  const handleCompleteOnboarding = useCallback(
    async (input: ProfileFormInput) => {
      await authProfile.saveProfile(input, cart.items);
      setActiveView('market');
    },
    [authProfile, cart.items]
  );

  const handleSaveProfile = useCallback(
    async (input: ProfileFormInput) => {
      await authProfile.saveProfile(input, cart.items);
    },
    [authProfile, cart.items]
  );

  const handlePlaceOrder = useCallback(async () => {
    ordersHook.clearSubmitError();
    const created = await ordersHook.placeOrder({
      profile: authProfile.profile,
      lines: cart.lines,
      settings: catalog.settings,
    });
    if (created) {
      clearedOrderIdsRef.current.add(created.id);
      persistStringsToStorage(CLEARED_ORDERS_STORAGE_KEY, [created.id]);
      cart.clearCart();
      setConfirmedOrder(created);
    }
  }, [authProfile.profile, cart, catalog.settings, ordersHook]);

  const handleOrderAgain = useCallback(
    (order: OrderRecord) => {
      reorderedOrderIdsRef.current.add(order.id);
      clearedOrderIdsRef.current.add(order.id);
      persistStringsToStorage(CLEARED_ORDERS_STORAGE_KEY, [order.id]);

      const { addedCount, skippedCount } = cart.reorderFromItems(order.items);
      if (skippedCount > 0) {
        setToastMessage(t.orders.unavailableNotice);
      } else if (addedCount > 0) {
        setToastMessage(t.orders.addedBackNotice);
      }
      setConfirmedOrder(null);
      setIsCartOpen(true);
    },
    [cart, t.orders.addedBackNotice, t.orders.unavailableNotice]
  );

  const handleSelectMarket = useCallback(() => {
    if (activeView === 'market' && catalog.selectedSection === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    catalog.setSelectedSection('all');
    setActiveView('market');
  }, [activeView, catalog]);

  const handleSelectCategories = useCallback(() => {
    if (activeView === 'categories' && selectedVisualCategoryId === null) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedVisualCategoryId(null);
    setActiveView('categories');
  }, [activeView, selectedVisualCategoryId]);

  const handleOpenQuickList = useCallback((from: 'market' | 'categories') => {
    setQuickListReturnView(from);
    setActiveView('quicklist');
  }, []);

  const handleSelectDeals = useCallback(() => {
    if (activeView === 'market' && catalog.selectedSection === 'deals') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    catalog.setSelectedSection('deals');
    setActiveView('market');
  }, [activeView, catalog]);

  const handleBottomNavTab = useCallback(
    (tab: BottomNavTab) => {
      if (tab === 'market') {
        handleSelectMarket();
        return;
      }
      if (tab === 'categories') {
        handleSelectCategories();
        return;
      }
      if (tab === 'deals') {
        handleSelectDeals();
        return;
      }
      if (tab === 'orders') {
        if (activeView === 'orders') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setActiveView('orders');
        return;
      }
      if (tab === 'profile') {
        if (activeView === 'profile') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setActiveView('profile');
      }
    },
    [activeView, handleSelectCategories, handleSelectDeals, handleSelectMarket]
  );

  if (authProfile.profileLoading && !authProfile.profile && !bypassOnboarding) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#EEF2F0]">
        <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] items-center justify-center bg-[#F8FAFC] px-4 shadow-[0_0_40px_rgba(0,0,0,0.08)]">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)] font-display text-lg font-extrabold text-[var(--brand-primary-fg)]">
              S
            </div>
            <p className="mt-3 font-display text-base font-bold text-[#141A15]">
              {t.brandName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authProfile.profile && !bypassOnboarding) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#EEF2F0]">
        <div className="relative mx-auto min-h-[100dvh] w-full max-w-[480px] bg-[#F8FAFC] shadow-[0_0_40px_rgba(0,0,0,0.08)]">
          <OnboardingScreen
            t={t}
            language={language}
            anonymousDisabled={authProfile.anonymousDisabled}
            onChangeLanguage={setLanguage}
            onComplete={handleCompleteOnboarding}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#EEF2F0]">
      <div
        data-testid="customer-app-shell"
        className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-[#F8FAFC] pb-[calc(5rem+env(safe-area-inset-bottom))] text-[#141A15] shadow-[0_0_40px_rgba(0,0,0,0.08)]"
      >
        <Header
          t={t}
          language={language}
          storeName={catalog.settings.storeName}
          logoUrl={catalog.settings.logoUrl}
          notifications={notifications}
          onChangeLanguage={setLanguage}
          onSelectNotification={handleSelectNotification}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onSelectMarket={handleSelectMarket}
          onOpenCart={handleOpenCart}
        />

        {orderAlert && activeView !== 'orders' && (
          <div className="w-full px-3 pt-3">
            <OrderStatusBanner
              alert={orderAlert}
              t={t}
              onDismiss={handleDismissOrderAlert}
            />
          </div>
        )}

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100vw-24px)] max-w-[456px] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-[#BCE0CA] bg-[#141A15] px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-[#86D9A6]"
              aria-hidden="true"
            />
            <span>{toastMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label={t.cart.close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 hover:text-white active:scale-95"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex-1">
        {activeView === 'market' && (
          <MarketPage
            t={t}
            language={language}
            settings={catalog.settings}
            banners={catalog.banners}
            categories={catalog.categories}
            selectedCategory={catalog.selectedCategory}
            selectedCategoryId={catalog.selectedCategoryId}
            selectedSubcategoryId={catalog.selectedSubcategoryId}
            selectedSection={catalog.selectedSection}
            searchQuery={catalog.searchQuery}
            visibleProducts={catalog.visibleProducts}
            status={catalog.status}
            hasMore={catalog.hasMore}
            loadingMore={catalog.loadingMore}
            isOnline={isOnline}
            getQuantity={cart.getQuantity}
            onSearchChange={catalog.setSearchQuery}
            onSelectCategory={catalog.selectCategory}
            onSelectSubcategory={catalog.setSelectedSubcategoryId}
            onSelectSection={catalog.setSelectedSection}
            onResetFilters={catalog.resetFilters}
            onLoadMore={() => void catalog.loadMoreProducts()}
            onRetry={catalog.retryLoad}
            onIncrement={cart.increment}
            onDecrement={cart.decrement}
            onOpenDetail={setSelectedProduct}
            onOpenCategoriesGrid={handleSelectCategories}
            onOpenQuickList={() => handleOpenQuickList('market')}
          />
        )}

        {activeView === 'categories' && (
          <CategoriesPage
            t={t}
            language={language}
            categories={catalog.categories}
            allProducts={catalog.allActiveProducts}
            selectedCategoryId={selectedVisualCategoryId}
            lowBandwidthMode={Boolean(catalog.settings.lowBandwidthCategorySvgOnly)}
            getQuantity={cart.getQuantity}
            onSelectCategory={setSelectedVisualCategoryId}
            onOpenQuickList={() => handleOpenQuickList('categories')}
            onIncrement={cart.increment}
            onDecrement={cart.decrement}
            onOpenDetail={setSelectedProduct}
          />
        )}

        {activeView === 'quicklist' && (
          <QuickShoppingListPage
            t={t}
            language={language}
            allProducts={catalog.allActiveProducts}
            getQuantity={cart.getQuantity}
            onBack={() => setActiveView(quickListReturnView)}
            onIncrement={cart.increment}
            onDecrement={cart.decrement}
            onOpenDetail={setSelectedProduct}
          />
        )}

        {activeView === 'orders' && (
          <OrdersPage
            t={t}
            language={language}
            orders={ordersHook.orders}
            loading={ordersHook.loading}
            lifetimeSavings={lifetimeSavings}
            deliveredOrderCount={deliveredOrderCount}
            browserAlertStatus={browserAlerts.status}
            onToggleBrowserAlerts={browserAlerts.toggleAlerts}
            orderAlert={orderAlert}
            onDismissOrderAlert={handleDismissOrderAlert}
            onOrderAgain={handleOrderAgain}
            onStartShopping={handleSelectMarket}
          />
        )}

        {activeView === 'profile' && (
          <ProfilePage
            t={t}
            language={language}
            onChangeLanguage={setLanguage}
            profile={authProfile.profile}
            uid={authProfile.user?.uid ?? null}
            anonymousDisabled={authProfile.anonymousDisabled}
            contactLinks={catalog.settings.contactLinks ?? []}
            lifetimeSavings={lifetimeSavings}
            deliveredOrderCount={deliveredOrderCount}
            browserAlertStatus={browserAlerts.status}
            onToggleBrowserAlerts={browserAlerts.toggleAlerts}
            onSaveProfile={handleSaveProfile}
            onLogoutReset={async () => {
              cart.clearCart();
              await authProfile.logoutAndReset();
              setConfirmedOrder(null);
              setIsCartOpen(false);
              setActiveView('market');
            }}
          />
        )}
      </div>

      <Footer
        t={t}
        language={language}
        settings={catalog.settings}
      />

      {!isCartOpen && (
        <FloatingCartBar t={t} onOpenCart={handleOpenCart} />
      )}

      <MobileBottomNav
        t={t}
        activeView={activeView}
        isDealsActive={catalog.selectedSection === 'deals'}
        hasActiveOrder={hasActiveOrder}
        onSelectTab={handleBottomNavTab}
      />

      <CartDrawer
        isOpen={isCartOpen}
        t={t}
        language={language}
        settings={catalog.settings}
        profile={authProfile.profile}
        isOnline={isOnline}
        isSubmitting={ordersHook.isSubmitting}
        submitErrorCode={ordersHook.submitErrorCode}
        confirmedOrder={confirmedOrder}
        orderAlert={orderAlert}
        onDismissOrderAlert={handleDismissOrderAlert}
        onClose={handleCloseCart}
        onEditProfile={() => {
          handleCloseCart();
          setActiveView('profile');
        }}
        onPlaceOrder={handlePlaceOrder}
        onViewOrders={() => {
          handleCloseCart();
          setActiveView('orders');
        }}
        onResetConfirmation={() => setConfirmedOrder(null)}
      />

      <DeliveredThankYouModal
        payload={thankYouModal}
        hasCustomBodyOverride={hasCustomThankYouBody}
        t={t}
        language={language}
        onContinueShopping={() => {
          if (thankYouModal) {
            markDeliveredPopupSeen(thankYouModal.orderId);
          }
          setThankYouModal(null);
          handleSelectDeals();
        }}
        onClose={() => {
          if (thankYouModal) {
            markDeliveredPopupSeen(thankYouModal.orderId);
          }
          setThankYouModal(null);
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        quantity={selectedProduct ? cart.getQuantity(selectedProduct.id) : 0}
        language={language}
        t={t}
        onClose={() => setSelectedProduct(null)}
        onIncrement={cart.increment}
        onDecrement={cart.decrement}
      />
      </div>
    </div>
  );
}
