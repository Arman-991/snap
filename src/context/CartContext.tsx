import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  clearCachedCartEverywhere,
  clearCartInFirestore,
  hasExplicitCachedCart,
  loadCachedCart,
  saveCachedCart,
  syncCartToUserDoc,
} from '../services/firestoreService';
import type {
  CartItem,
  LiveCartSummary,
  OrderItemSnapshot,
  OrderRecord,
  Product,
  ResolvedCartLine,
  StoreSettings,
  UserProfile,
} from '../types/grocery';
import {
  calculateLiveCartSummary,
  hasStaleCartFromOrders,
  isProductOrderable,
  reorderCartItemsFromLiveCatalog,
  resolveLiveCartLines,
  updateCartItems,
} from '../utils/supermarketLogic';

export interface CartContextValue {
  items: CartItem[];
  lines: ResolvedCartLine[];
  summary: LiveCartSummary;
  itemCount: number;
  getQuantity: (productId: string) => number;
  increment: (product: Product) => void;
  decrement: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
  clearCart: () => void;
  reorderFromItems: (
    orderItems: OrderItemSnapshot[]
  ) => { addedCount: number; skippedCount: number };
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
  productsById: Map<string, Product>;
  settings: StoreSettings;
  uid: string | null;
  profile: UserProfile | null;
  orders: OrderRecord[];
  ordersLoading: boolean;
  onCartCleared?: () => void;
}

export function CartProvider({
  children,
  productsById,
  settings,
  uid,
  profile,
  orders,
  ordersLoading,
  onCartCleared,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => loadCachedCart());
  const hydratedFromRemoteRef = useRef(false);
  const clearedLocallyRef = useRef(false);

  // Hydrate cart from Firestore profile ONLY on a brand-new device with no local cart key yet,
  // and ONLY after orders finish loading so stale items from completed orders can never be restored.
  useEffect(() => {
    if (
      !profile ||
      ordersLoading ||
      hydratedFromRemoteRef.current ||
      clearedLocallyRef.current
    ) {
      return;
    }

    hydratedFromRemoteRef.current = true;

    // Never override an explicit localStorage cart key (including "[]")
    if (hasExplicitCachedCart()) return;
    if (profile.cart.length === 0 || items.length > 0) return;

    // Never hydrate stale items that belong to an already Confirmed/Delivered order
    if (hasStaleCartFromOrders(profile.cart, orders)) {
      clearCachedCartEverywhere();
      onCartCleared?.();
      void clearCartInFirestore(uid);
      return;
    }

    setItems(profile.cart);
    saveCachedCart(profile.cart);
  }, [items.length, onCartCleared, orders, ordersLoading, profile, uid]);

  /**
   * Single atomic helper that synchronously clears the cart across all 3 stores:
   * 1. React CartContext items -> []
   * 2. localStorage cart key -> "[]" (plus removes any draft/legacy keys & profile cart mirror)
   * 3. Firestore users/{uid} -> setDoc(..., { cart: [] }, { merge: true })
   */
  const clearCart = useCallback(() => {
    hydratedFromRemoteRef.current = true;
    clearedLocallyRef.current = true;
    setItems([]);
    clearCachedCartEverywhere();
    onCartCleared?.();
    void clearCartInFirestore(uid);
  }, [onCartCleared, uid]);

  const commitCart = useCallback(
    (nextItems: CartItem[]) => {
      if (nextItems.length === 0) {
        clearCart();
        return;
      }
      hydratedFromRemoteRef.current = true;
      clearedLocallyRef.current = false;
      setItems(nextItems);
      saveCachedCart(nextItems);
      void syncCartToUserDoc(uid, nextItems, Boolean(profile));
    },
    [clearCart, profile, uid]
  );

  const lines = useMemo(
    () => resolveLiveCartLines(items, productsById),
    [items, productsById]
  );

  const summary = useMemo(
    () => calculateLiveCartSummary(lines, settings),
    [lines, settings]
  );

  // Badge count and Cart screen count derive from the exact same CartContext state
  const itemCount = items.length === 0 ? 0 : summary.itemCount;

  const getQuantity = useCallback(
    (productId: string) =>
      items.find((entry) => entry.productId === productId)?.quantity ?? 0,
    [items]
  );

  const increment = useCallback(
    (product: Product) => {
      if (!isProductOrderable(product)) return;
      const current =
        items.find((e) => e.productId === product.id)?.quantity ?? 0;
      commitCart(updateCartItems(items, product.id, current + 1));
    },
    [commitCart, items]
  );

  const decrement = useCallback(
    (product: Product) => {
      const current =
        items.find((e) => e.productId === product.id)?.quantity ?? 0;
      commitCart(updateCartItems(items, product.id, current - 1));
    },
    [commitCart, items]
  );

  const remove = useCallback(
    (productId: string) => {
      commitCart(updateCartItems(items, productId, 0));
    },
    [commitCart, items]
  );

  const reorderFromItems = useCallback(
    (
      orderItems: OrderItemSnapshot[]
    ): { addedCount: number; skippedCount: number } => {
      const { nextCart, addedCount, skippedCount } =
        reorderCartItemsFromLiveCatalog(items, orderItems, productsById);

      if (addedCount > 0) {
        commitCart(nextCart);
      }
      return { addedCount, skippedCount };
    },
    [commitCart, items, productsById]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      lines,
      summary,
      itemCount,
      getQuantity,
      increment,
      decrement,
      remove,
      clear: clearCart,
      clearCart,
      reorderFromItems,
    }),
    [
      clearCart,
      decrement,
      getQuantity,
      increment,
      itemCount,
      items,
      lines,
      remove,
      reorderFromItems,
      summary,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCartContext must be used inside a CartProvider');
  }
  return ctx;
}
