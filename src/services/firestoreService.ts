import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  DEFAULT_STORE_SETTINGS,
  SEED_BANNERS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
} from '../data/erbilSeedData';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import type {
  AdminUserRecord,
  Banner,
  CartItem,
  Category,
  CmsTranslationsDoc,
  Language,
  OrderItemSnapshot,
  OrderRecord,
  Product,
  ResolvedCartLine,
  StoreSettings,
  UserProfile,
} from '../types/grocery';
import {
  buildGoogleMapsUrl,
  calculateLiveCartSummary,
  checkHourlyOrderRateLimit,
  generateShortOrderNumber,
  normalizeIraqiPhone,
} from '../utils/supermarketLogic';

export const CART_STORAGE_KEY = 'bazar_fresh_cart_v2';

const STORAGE_KEYS = {
  profile: 'bazar_fresh_profile_v2',
  cart: CART_STORAGE_KEY,
  language: 'bazar_fresh_lang_v2',
} as const;

const LEGACY_CART_STORAGE_KEYS = [
  'bazar_fresh_cart_v1',
  'bazar_fresh_local_orders_v2',
  'cart',
  'cartItems',
  'cart_draft',
] as const;

export class OrderGuardError extends Error {
  code:
    | 'PHONE_BLOCKED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'STORE_CLOSED'
    | 'BELOW_MINIMUM'
    | 'OFFLINE'
    | 'AUTH_REQUIRED';

  constructor(code: OrderGuardError['code'], message?: string) {
    super(message || code);
    this.code = code;
  }
}

function timestampToMs(val: unknown): number {
  if (!val) return Date.now();
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  if (typeof val === 'object' && 'seconds' in (val as Record<string, unknown>)) {
    return Number((val as { seconds: number }).seconds) * 1000;
  }
  return Date.now();
}

// --- Local Storage Cache Helpers ---

export function loadCachedLanguage(): Language {
  if (typeof window === 'undefined') return 'ku';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.language);
    if (raw === 'ku' || raw === 'ar' || raw === 'en') return raw;
    if (raw === 'ckb') return 'ku';
  } catch {
    // ignore storage access issues
  }
  return 'ku';
}

export function saveCachedLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.language, lang);
  } catch {
    // ignore
  }
}

export function loadCachedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.profile);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed && typeof parsed.fullName === 'string' && typeof parsed.phoneNormalized === 'string') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveCachedProfile(profile: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!profile) {
      window.localStorage.removeItem(STORAGE_KEYS.profile);
    } else {
      // Never duplicate cart items inside the profile cache; CART_STORAGE_KEY is the single localStorage cart key
      const profileWithoutCart: UserProfile = { ...profile, cart: [] };
      window.localStorage.setItem(
        STORAGE_KEYS.profile,
        JSON.stringify(profileWithoutCart)
      );
    }
  } catch {
    // ignore
  }
}

export function hasExplicitCachedCart(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.cart) !== null;
  } catch {
    return false;
  }
}

export function loadCachedCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.cart);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CartItem =>
        Boolean(entry) &&
        typeof entry.productId === 'string' &&
        typeof entry.quantity === 'number' &&
        entry.quantity > 0
    );
  } catch {
    return [];
  }
}

export function saveCachedCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function clearCachedCartEverywhere(): void {
  if (typeof window === 'undefined') return;
  try {
    // Explicitly persist "[]" so cold-load hydration knows the cart was intentionally emptied
    window.localStorage.setItem(STORAGE_KEYS.cart, '[]');
    for (const legacyKey of LEGACY_CART_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
    const rawProfile = window.localStorage.getItem(STORAGE_KEYS.profile);
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile) as UserProfile;
      if (parsed && typeof parsed === 'object') {
        parsed.cart = [];
        window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}

// --- Authentication ---

export interface SilentAuthResult {
  user: User | null;
  anonymousDisabled: boolean;
}

export async function ensureAnonymousCustomerAuth(): Promise<SilentAuthResult> {
  if (auth.currentUser) {
    return { user: auth.currentUser, anonymousDisabled: false };
  }
  try {
    const cred = await signInAnonymously(auth);
    return { user: cred.user, anonymousDisabled: false };
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    if (
      code === 'auth/admin-restricted-operation' ||
      code === 'auth/operation-not-allowed'
    ) {
      return { user: null, anonymousDisabled: true };
    }
    return { user: null, anonymousDisabled: false };
  }
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInAdminWithEmailPassword(
  email: string,
  password: string
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

export async function fetchAdminRecord(user: User | null): Promise<AdminUserRecord | null> {
  if (!user || user.isAnonymous) return null;

  if (
    user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
    user.emailVerified
  ) {
    return {
      uid: user.uid,
      email: user.email,
      role: 'owner',
    };
  }

  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: user.uid,
      email: String(data.email || user.email || ''),
      role: data.role === 'owner' ? 'owner' : 'staff',
    };
  } catch {
    return null;
  }
}

// --- Storefront Live Reads ---

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const path = 'settings/store';
  try {
    const snap = await getDoc(doc(db, 'settings', 'store'));
    if (!snap.exists()) {
      return DEFAULT_STORE_SETTINGS;
    }
    const d = snap.data();
    const rawWhatsapp =
      typeof d.whatsappPhone === 'string' && d.whatsappPhone.trim()
        ? d.whatsappPhone.trim()
        : DEFAULT_STORE_SETTINGS.whatsappPhone;
    const resolvedWhatsapp =
      rawWhatsapp === '9647501234567'
        ? DEFAULT_STORE_SETTINGS.whatsappPhone
        : rawWhatsapp;
    const rawContacts = Array.isArray(d.contactLinks)
      ? d.contactLinks
      : DEFAULT_STORE_SETTINGS.contactLinks ?? [];
    const resolvedContacts = rawContacts.map((link) =>
      link && typeof link.url === 'string' && link.url.includes('9647501234567')
        ? { ...link, url: link.url.replaceAll('9647501234567', '9647507442404') }
        : link
    );
    return {
      storeName: typeof d.storeName === 'string' ? d.storeName : DEFAULT_STORE_SETTINGS.storeName,
      whatsappPhone: resolvedWhatsapp,
      deliveryFee:
        typeof d.deliveryFee === 'number' ? d.deliveryFee : DEFAULT_STORE_SETTINGS.deliveryFee,
      minimumOrder:
        typeof d.minimumOrder === 'number' ? d.minimumOrder : DEFAULT_STORE_SETTINGS.minimumOrder,
      isStoreOpen:
        typeof d.isStoreOpen === 'boolean' ? d.isStoreOpen : DEFAULT_STORE_SETTINGS.isStoreOpen,
      deliveryHoursText: {
        ku: d.deliveryHoursText?.ku || DEFAULT_STORE_SETTINGS.deliveryHoursText.ku,
        ar: d.deliveryHoursText?.ar || DEFAULT_STORE_SETTINGS.deliveryHoursText.ar,
        en: d.deliveryHoursText?.en || DEFAULT_STORE_SETTINGS.deliveryHoursText.en,
      },
      maxOrdersPerHour:
        typeof d.maxOrdersPerHour === 'number' &&
        Number.isFinite(d.maxOrdersPerHour) &&
        d.maxOrdersPerHour >= 0
          ? d.maxOrdersPerHour
          : DEFAULT_STORE_SETTINGS.maxOrdersPerHour,
      themeColor:
        typeof d.themeColor === 'string' ? d.themeColor : DEFAULT_STORE_SETTINGS.themeColor,
      primaryColor:
        typeof d.primaryColor === 'string' && d.primaryColor.trim()
          ? d.primaryColor
          : typeof d.themeColor === 'string' && d.themeColor.trim()
            ? d.themeColor
            : DEFAULT_STORE_SETTINGS.primaryColor,
      logoUrl: typeof d.logoUrl === 'string' ? d.logoUrl : DEFAULT_STORE_SETTINGS.logoUrl,
      homeSections:
        Array.isArray(d.homeSections) && d.homeSections.length > 0
          ? d.homeSections
          : DEFAULT_STORE_SETTINGS.homeSections,
      contactLinks: resolvedContacts,
      lowBandwidthCategorySvgOnly: Boolean(d.lowBandwidthCategorySvgOnly),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchCmsTranslations(): Promise<CmsTranslationsDoc> {
  try {
    const snap = await getDoc(doc(db, 'cms', 'translations'));
    if (!snap.exists()) return {};
    const d = snap.data();
    return {
      tagline: d.tagline ?? {},
      savingsPrefix: d.savingsPrefix ?? {},
      savingsSuffix: d.savingsSuffix ?? {},
      confirmationNotice: d.confirmationNotice ?? {},
      storeClosedTitle: d.storeClosedTitle ?? {},
      storeClosedBody: d.storeClosedBody ?? {},
      footerNotice: d.footerNotice ?? {},
      deliveredThankYouTitle: d.deliveredThankYouTitle ?? {},
      deliveredThankYouBody: d.deliveredThankYouBody ?? {},
    };
  } catch {
    return {};
  }
}

export async function fetchActiveBanners(): Promise<Banner[]> {
  const path = 'banners';
  try {
    const q = query(
      collection(db, 'banners'),
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        titleKu: String(d.titleKu || ''),
        titleAr: String(d.titleAr || ''),
        titleEn: String(d.titleEn || ''),
        imageUrl: String(d.imageUrl || ''),
        linkCategoryId: String(d.linkCategoryId || ''),
        sortOrder: Number(d.sortOrder || 0),
        isActive: Boolean(d.isActive),
      };
    });
  } catch (error) {
    // Fallback without orderBy in case composite index is still building
    try {
      const snap = await getDocs(collection(db, 'banners'));
      return snap.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            titleKu: String(d.titleKu || ''),
            titleAr: String(d.titleAr || ''),
            titleEn: String(d.titleEn || ''),
            imageUrl: String(d.imageUrl || ''),
            linkCategoryId: String(d.linkCategoryId || ''),
            sortOrder: Number(d.sortOrder || 0),
            isActive: Boolean(d.isActive),
          };
        })
        .filter((b) => b.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    } catch {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
}

export async function fetchAllCategoriesForStorefront(): Promise<Category[]> {
  const path = 'categories';
  try {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          nameKu: String(d.nameKu || ''),
          nameAr: String(d.nameAr || ''),
          nameEn: String(d.nameEn || ''),
          icon: String(d.icon || 'Package'),
          imageUrl: typeof d.imageUrl === 'string' ? d.imageUrl : '',
          subcategories: Array.isArray(d.subcategories) ? d.subcategories : [],
          sortOrder: Number(d.sortOrder || 0),
          isActive: Boolean(d.isActive),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const all = await fetchAllCategoriesForStorefront();
  return all.filter((cat) => cat.isActive);
}

function mapProductDoc(docSnap: QueryDocumentSnapshot<DocumentData>): Product {
  const d = docSnap.data();
  const section =
    d.section === 'deals' ||
    d.section === 'popular' ||
    d.section === 'new' ||
    d.section === 'recommended'
      ? d.section
      : 'popular';
  return {
    id: docSnap.id,
    categoryId: String(d.categoryId || ''),
    subcategoryId: String(d.subcategoryId || ''),
    nameKu: String(d.nameKu || ''),
    nameAr: String(d.nameAr || ''),
    nameEn: String(d.nameEn || ''),
    size: String(d.size || ''),
    ourPrice: Number(d.ourPrice || 0),
    marketPrice: Number(d.marketPrice || 0),
    marketPriceNote: typeof d.marketPriceNote === 'string' ? d.marketPriceNote : '',
    marketPriceUpdatedAt:
      typeof d.marketPriceUpdatedAt === 'string' ? d.marketPriceUpdatedAt : null,
    imageUrl: String(d.imageUrl || ''),
    section,
    inStock: d.inStock !== false,
    showInDeals: typeof d.showInDeals === 'boolean' ? d.showInDeals : section === 'deals',
    showInPopular:
      typeof d.showInPopular === 'boolean' ? d.showInPopular : section === 'popular',
    isNew: typeof d.isNew === 'boolean' ? d.isNew : section === 'new',
    isActive: Boolean(d.isActive),
    createdAt: d.createdAt ? timestampToMs(d.createdAt) : null,
    updatedAt: d.updatedAt ? timestampToMs(d.updatedAt) : null,
  };
}

export interface ProductPageResult {
  products: Product[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function fetchActiveProductsPage(options: {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  categoryId?: string | null;
}): Promise<ProductPageResult> {
  const pageSize = options.pageSize ?? 16;
  const path = 'products';

  const constraints: QueryConstraint[] = [where('isActive', '==', true)];
  if (options.categoryId && options.categoryId !== 'all') {
    constraints.push(where('categoryId', '==', options.categoryId));
  }
  constraints.push(orderBy('id', 'asc'));
  if (options.lastDoc) {
    constraints.push(startAfter(options.lastDoc));
  }
  constraints.push(limit(pageSize));

  try {
    const snap = await getDocs(query(collection(db, 'products'), ...constraints));
    const items = snap.docs.map(mapProductDoc);
    return {
      products: items,
      lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === pageSize,
    };
  } catch (error) {
    // Fallback query without composite index while index builds
    try {
      const fallbackConstraints: QueryConstraint[] = [where('isActive', '==', true)];
      if (options.lastDoc) {
        fallbackConstraints.push(startAfter(options.lastDoc));
      }
      fallbackConstraints.push(limit(pageSize));
      const snap = await getDocs(query(collection(db, 'products'), ...fallbackConstraints));
      let items = snap.docs.map(mapProductDoc);
      if (options.categoryId && options.categoryId !== 'all') {
        items = items.filter((p) => p.categoryId === options.categoryId);
      }
      return {
        products: items,
        lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore: snap.docs.length === pageSize,
      };
    } catch {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
}

export async function fetchAllActiveProducts(): Promise<Product[]> {
  const path = 'products';
  try {
    const snap = await getDocs(
      query(collection(db, 'products'), where('isActive', '==', true))
    );
    return snap.docs
      .map(mapProductDoc)
      .sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// --- First-Run / Dev Seed Utility ---

export async function seedSampleCatalogToFirestore(): Promise<{
  seeded: boolean;
  categoriesCount: number;
  productsCount: number;
}> {
  const existingCats = await getDocs(query(collection(db, 'categories'), limit(1)));
  if (!existingCats.empty) {
    return { seeded: false, categoriesCount: 0, productsCount: 0 };
  }

  try {
    const batch = writeBatch(db);

    batch.set(doc(db, 'settings', 'store'), {
      ...DEFAULT_STORE_SETTINGS,
    });

    for (const category of SEED_CATEGORIES) {
      batch.set(doc(db, 'categories', category.id), category);
    }

    for (const banner of SEED_BANNERS) {
      batch.set(doc(db, 'banners', banner.id), banner);
    }

    for (const product of SEED_PRODUCTS) {
      batch.set(doc(db, 'products', product.id), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (auth.currentUser) {
      batch.set(doc(db, 'auditLogs', `seed_${Date.now()}`), {
        actorUid: auth.currentUser.uid,
        action: 'SEED_SAMPLE_CATALOG',
        targetId: 'catalog',
        details: `Seeded ${SEED_CATEGORIES.length} categories, ${SEED_PRODUCTS.length} products, ${SEED_BANNERS.length} banners.`,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();

    return {
      seeded: true,
      categoriesCount: SEED_CATEGORIES.length,
      productsCount: SEED_PRODUCTS.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products/seed');
  }
}

// --- Customer Profile & Cart Sync ---

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    const profile: UserProfile = {
      uid: String(d.uid || uid),
      fullName: String(d.fullName || ''),
      phoneDisplay: String(d.phoneDisplay || ''),
      phoneNormalized: String(d.phoneNormalized || ''),
      addressText: String(d.addressText || ''),
      buildingNotes: String(d.buildingNotes || ''),
      gps:
        d.gps && typeof d.gps.lat === 'number' && typeof d.gps.lng === 'number'
          ? { lat: d.gps.lat, lng: d.gps.lng }
          : null,
      language:
        d.language === 'ku' || d.language === 'ar' || d.language === 'en'
          ? d.language
          : 'ku',
      // Respect an explicitly cleared local cart ("[]") so remote fetch never restores stale items
      cart:
        hasExplicitCachedCart() && loadCachedCart().length === 0
          ? []
          : Array.isArray(d.cart)
            ? d.cart
            : [],
      createdAt: d.createdAt ? timestampToMs(d.createdAt) : null,
      updatedAt: d.updatedAt ? timestampToMs(d.updatedAt) : null,
    };
    saveCachedProfile(profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertUserProfile(
  uid: string | null,
  profile: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<UserProfile> {
  const normalizedPhone = normalizeIraqiPhone(
    profile.phoneNormalized || profile.phoneDisplay
  );
  const canonicalNormalized = normalizedPhone.valid
    ? normalizedPhone.phoneNormalized
    : profile.phoneNormalized.trim();
  const canonicalDisplay = normalizedPhone.valid
    ? normalizedPhone.phoneDisplay
    : profile.phoneDisplay.trim();

  const cleanProfile: UserProfile = {
    uid: uid || 'local-device',
    fullName: profile.fullName.trim().slice(0, 100),
    phoneDisplay: canonicalDisplay.slice(0, 24),
    phoneNormalized: canonicalNormalized,
    addressText: profile.addressText.trim().slice(0, 240),
    buildingNotes: profile.buildingNotes.trim().slice(0, 200),
    gps: profile.gps
      ? { lat: Number(profile.gps.lat), lng: Number(profile.gps.lng) }
      : null,
    language: profile.language,
    cart: profile.cart.slice(0, 60).map((c) => ({
      productId: c.productId.slice(0, 80),
      quantity: Math.max(1, Math.min(50, Math.floor(c.quantity))),
    })),
  };

  saveCachedProfile(cleanProfile);
  saveCachedLanguage(cleanProfile.language);
  saveCachedCart(cleanProfile.cart);

  if (!uid || !auth.currentUser) {
    return cleanProfile;
  }

  const ref = doc(db, 'users', uid);
  const path = `users/${uid}`;
  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        fullName: cleanProfile.fullName,
        phoneDisplay: cleanProfile.phoneDisplay,
        phoneNormalized: cleanProfile.phoneNormalized,
        addressText: cleanProfile.addressText,
        buildingNotes: cleanProfile.buildingNotes,
        gps: cleanProfile.gps,
        language: cleanProfile.language,
        cart: cleanProfile.cart,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid,
        fullName: cleanProfile.fullName,
        phoneDisplay: cleanProfile.phoneDisplay,
        phoneNormalized: cleanProfile.phoneNormalized,
        addressText: cleanProfile.addressText,
        buildingNotes: cleanProfile.buildingNotes,
        gps: cleanProfile.gps,
        language: cleanProfile.language,
        cart: cleanProfile.cart,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return cleanProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCartToUserDoc(
  uid: string | null,
  cart: CartItem[],
  hasProfile: boolean
): Promise<void> {
  saveCachedCart(cart);
  if (!uid || !auth.currentUser || !hasProfile) return;

  try {
    const cleanCart = cart.slice(0, 60).map((c) => ({
      productId: c.productId.slice(0, 80),
      quantity: Math.max(1, Math.min(50, Math.floor(c.quantity))),
    }));
    await updateDoc(doc(db, 'users', uid), {
      cart: cleanCart,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Non-fatal during offline periods, log structured error for diagnostics
    console.warn('Cart sync deferred:', error instanceof Error ? error.message : error);
  }
}

export async function clearCartInFirestore(uid: string | null): Promise<void> {
  clearCachedCartEverywhere();
  const targetUid = uid || auth.currentUser?.uid || null;
  if (!targetUid || !auth.currentUser) return;

  try {
    await setDoc(
      doc(db, 'users', targetUid),
      {
        cart: [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore cart clear deferred:', error instanceof Error ? error.message : error);
  }
}

// --- Order Placement (Blocked Phone + Hourly Rate Limit + Snapshot) ---

export async function placeCashOnDeliveryOrder(params: {
  uid: string | null;
  profile: UserProfile;
  lines: ResolvedCartLine[];
  settings: StoreSettings;
}): Promise<OrderRecord> {
  const { uid, profile, lines, settings } = params;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new OrderGuardError('OFFLINE');
  }
  if (!settings.isStoreOpen) {
    throw new OrderGuardError('STORE_CLOSED');
  }

  const summary = calculateLiveCartSummary(lines, settings);
  if (!summary.meetsMinimumOrder || summary.itemCount === 0) {
    throw new OrderGuardError('BELOW_MINIMUM');
  }

  if (!uid || !auth.currentUser) {
    throw new OrderGuardError('AUTH_REQUIRED');
  }

  // Normalize phone canonically so blockedPhones, rate limits, and order doc always match
  const normalizedPhone = normalizeIraqiPhone(
    profile.phoneNormalized || profile.phoneDisplay
  );
  const canonicalPhone = normalizedPhone.valid
    ? normalizedPhone.phoneNormalized
    : profile.phoneNormalized.trim();
  const canonicalDisplay = normalizedPhone.valid
    ? normalizedPhone.phoneDisplay
    : profile.phoneDisplay.trim();

  // 1. Check blockedPhones/{phoneNormalized}
  const blockedRef = doc(db, 'blockedPhones', canonicalPhone);
  try {
    const blockedSnap = await getDoc(blockedRef);
    if (blockedSnap.exists()) {
      throw new OrderGuardError('PHONE_BLOCKED');
    }
  } catch (error) {
    if (error instanceof OrderGuardError) throw error;
    // If rule denies read, orders create rule will still enforce !exists(blockedPhones)
  }

  // 2. Fetch latest settings/store live so Admin maxOrdersPerHour updates apply immediately
  //    (and setting maxOrdersPerHour to 0 disables rate limiting completely without clearing orderRateLimits)
  let liveMaxOrdersPerHour =
    typeof settings.maxOrdersPerHour === 'number' &&
    Number.isFinite(settings.maxOrdersPerHour)
      ? Math.max(0, Math.floor(settings.maxOrdersPerHour))
      : DEFAULT_STORE_SETTINGS.maxOrdersPerHour;

  try {
    const liveSettingsSnap = await getDoc(doc(db, 'settings', 'store'));
    if (liveSettingsSnap.exists()) {
      const liveData = liveSettingsSnap.data();
      if (liveData.isStoreOpen === false) {
        throw new OrderGuardError('STORE_CLOSED');
      }
      if (
        typeof liveData.maxOrdersPerHour === 'number' &&
        Number.isFinite(liveData.maxOrdersPerHour) &&
        liveData.maxOrdersPerHour >= 0
      ) {
        liveMaxOrdersPerHour = Math.floor(liveData.maxOrdersPerHour);
      }
    }
  } catch (error) {
    if (error instanceof OrderGuardError) throw error;
  }

  const nowMs = Date.now();
  const rateRef = doc(db, 'orderRateLimits', canonicalPhone);
  let activeTimestampsMs: number[] = [];

  if (liveMaxOrdersPerHour > 0) {
    try {
      const rateSnap = await getDoc(rateRef);
      const existingList = rateSnap.exists()
        ? (rateSnap.data().recentOrderTimestamps as unknown[])
        : [];
      const msList = Array.isArray(existingList)
        ? existingList.map(timestampToMs)
        : [];
      const rateCheck = checkHourlyOrderRateLimit(
        msList,
        nowMs,
        liveMaxOrdersPerHour
      );
      if (!rateCheck.allowed) {
        throw new OrderGuardError('RATE_LIMIT_EXCEEDED');
      }
      activeTimestampsMs = rateCheck.activeTimestampsMs;
    } catch (error) {
      if (error instanceof OrderGuardError) throw error;
    }
  }

  // 3. Build snapshotted order document
  const orderNumber = generateShortOrderNumber();
  const orderId = `${orderNumber.toLowerCase()}_${Date.now()}`;
  const googleMapsUrl = buildGoogleMapsUrl(profile.gps);

  const itemsSnapshot: OrderItemSnapshot[] = lines.map((line) => ({
    productId: line.product.id,
    nameKu: line.product.nameKu,
    nameAr: line.product.nameAr,
    nameEn: line.product.nameEn,
    size: line.product.size,
    quantity: line.quantity,
    ourPrice: line.product.ourPrice,
    marketPrice: line.product.marketPrice,
    lineTotal: line.lineTotal,
  }));

  const orderPath = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), {
      orderNumber,
      userId: uid,
      customerName: profile.fullName.trim().slice(0, 100),
      phoneDisplay: canonicalDisplay.slice(0, 24),
      phoneNormalized: canonicalPhone,
      addressText: profile.addressText.trim().slice(0, 240),
      buildingNotes: profile.buildingNotes.trim().slice(0, 200),
      gps: profile.gps,
      googleMapsUrl,
      items: itemsSnapshot,
      subtotal: summary.subtotal,
      totalSavings: summary.totalSavings,
      deliveryFee: summary.deliveryFee,
      grandTotal: summary.grandTotal,
      status: 'New',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      // Could be blocked phone or store closed enforced server-side
      handleFirestoreError(error, OperationType.CREATE, orderPath);
    }
    handleFirestoreError(error, OperationType.CREATE, orderPath);
  }

  // 4. Update orderRateLimits/{phoneNormalized} only when hourly rate limiting is enabled
  if (liveMaxOrdersPerHour > 0) {
    try {
      const nextTimestamps = [
        ...activeTimestampsMs.map((ms) => Timestamp.fromMillis(ms)),
        Timestamp.now(),
      ].slice(-20);
      await setDoc(rateRef, {
        recentOrderTimestamps: nextTimestamps,
      });
    } catch (err) {
      console.warn('Rate limit record update skipped:', err);
    }
  }

  // 5. Clear cart in users/{uid} and localStorage immediately after order creation
  await clearCartInFirestore(uid);

  return {
    id: orderId,
    orderNumber,
    userId: uid,
    customerName: profile.fullName,
    phoneDisplay: canonicalDisplay,
    phoneNormalized: canonicalPhone,
    addressText: profile.addressText,
    buildingNotes: profile.buildingNotes,
    gps: profile.gps,
    googleMapsUrl,
    items: itemsSnapshot,
    subtotal: summary.subtotal,
    totalSavings: summary.totalSavings,
    deliveryFee: summary.deliveryFee,
    grandTotal: summary.grandTotal,
    status: 'New',
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  };
}

// --- Real-Time Customer Orders Subscription ---

function mapOrderDoc(docSnap: QueryDocumentSnapshot<DocumentData>): OrderRecord {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    orderNumber: String(d.orderNumber || docSnap.id),
    userId: String(d.userId || ''),
    customerName: String(d.customerName || ''),
    phoneDisplay: String(d.phoneDisplay || ''),
    phoneNormalized: String(d.phoneNormalized || ''),
    addressText: String(d.addressText || ''),
    buildingNotes: String(d.buildingNotes || ''),
    gps:
      d.gps && typeof d.gps.lat === 'number' && typeof d.gps.lng === 'number'
        ? { lat: d.gps.lat, lng: d.gps.lng }
        : null,
    googleMapsUrl: String(d.googleMapsUrl || ''),
    items: Array.isArray(d.items) ? d.items : [],
    subtotal: Number(d.subtotal || 0),
    totalSavings: Number(d.totalSavings || 0),
    deliveryFee: Number(d.deliveryFee || 0),
    grandTotal: Number(d.grandTotal || 0),
    status: d.status || 'New',
    createdAtMs: timestampToMs(d.createdAt),
    updatedAtMs: timestampToMs(d.updatedAt),
  };
}

export function subscribeToCustomerOrders(
  userId: string,
  onOrders: (orders: OrderRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'orders';
  const orderedQuery = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  let fallbackUnsub: Unsubscribe | null = null;

  const primaryUnsub = onSnapshot(
    orderedQuery,
    (snapshot) => {
      onOrders(snapshot.docs.map(mapOrderDoc));
    },
    (error) => {
      // If composite index (userId + createdAt) is missing/building, gracefully fall back to client-sorted where('userId')
      if (error.message.includes('index')) {
        const simpleQuery = query(
          collection(db, 'orders'),
          where('userId', '==', userId)
        );
        fallbackUnsub = onSnapshot(
          simpleQuery,
          (snap) => {
            const list = snap.docs
              .map(mapOrderDoc)
              .sort((a, b) => b.createdAtMs - a.createdAtMs);
            onOrders(list);
          },
          (fallbackErr) => {
            try {
              handleFirestoreError(fallbackErr, OperationType.LIST, path);
            } catch (wrapped) {
              onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
            }
          }
        );
        return;
      }

      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    primaryUnsub();
    if (fallbackUnsub) fallbackUnsub();
  };
}
