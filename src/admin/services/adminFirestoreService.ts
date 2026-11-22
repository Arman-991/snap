import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  handleFirestoreError,
} from '../../lib/firebase';
import type {
  AdminRole,
  AdminUserRecord,
  AuditLogEntry,
  Banner,
  BlockedPhoneRecord,
  Category,
  CmsTranslationsDoc,
  OrderAdminNote,
  OrderRecord,
  OrderStatus,
  Product,
  StoreSettings,
  UserProfile,
} from '../../types/grocery';
import {
  cartOverlapsOrder,
  normalizeIraqiPhone,
} from '../../utils/supermarketLogic';

function tsToMs(val: unknown): number {
  if (!val) return Date.now();
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const p = Date.parse(val);
    return Number.isNaN(p) ? Date.now() : p;
  }
  if (typeof val === 'object' && 'seconds' in (val as Record<string, unknown>)) {
    return Number((val as { seconds: number }).seconds) * 1000;
  }
  return Date.now();
}

export interface AdminActor {
  uid: string;
  email: string;
  role: AdminRole;
}

/**
 * Central append-only audit logger invoked on EVERY admin mutation.
 */
export async function logAdminAction(
  actor: AdminActor,
  action: string,
  targetCollection: string,
  targetId: string,
  summary: string,
  changes?: Record<string, unknown>
): Promise<void> {
  if (!auth.currentUser) return;
  const logId = `${action.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const changesStr = changes ? JSON.stringify(changes).slice(0, 1180) : '';
  try {
    await setDoc(doc(db, 'auditLogs', logId), {
      actorUid: auth.currentUser.uid,
      actorEmail: (actor.email || auth.currentUser.email || 'admin').slice(0, 160),
      actorRole: actor.role,
      action: action.slice(0, 80),
      targetCollection: targetCollection.slice(0, 64),
      targetId: targetId.slice(0, 128),
      details: summary.slice(0, 500),
      changes: changesStr,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write warning:', err);
  }
}

// --- Mapping Helpers ---

function mapOrder(snap: QueryDocumentSnapshot<DocumentData>): OrderRecord {
  const d = snap.data();
  return {
    id: snap.id,
    orderNumber: String(d.orderNumber || snap.id),
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
    status: (d.status as OrderStatus) || 'New',
    createdAtMs: tsToMs(d.createdAt),
    updatedAtMs: tsToMs(d.updatedAt),
  };
}

function mapProduct(snap: QueryDocumentSnapshot<DocumentData>): Product {
  const d = snap.data();
  const section =
    d.section === 'deals' ||
    d.section === 'popular' ||
    d.section === 'new' ||
    d.section === 'recommended'
      ? d.section
      : 'popular';
  return {
    id: snap.id,
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
    createdAt: d.createdAt ? tsToMs(d.createdAt) : null,
    updatedAt: d.updatedAt ? tsToMs(d.updatedAt) : null,
  };
}

// --- Orders & Admin Notes ---

export function subscribeToAllOrdersAdmin(
  onOrders: (orders: OrderRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(300));
  return onSnapshot(
    q,
    (snap) => onOrders(snap.docs.map(mapOrder)),
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateOrderStatusAdmin(
  actor: AdminActor,
  order: OrderRecord,
  nextStatus: OrderStatus
): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await updateDoc(doc(db, 'orders', order.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    // Clear the customer's saved Firestore cart when confirming or delivering an order
    if (
      (nextStatus === 'Confirmed' || nextStatus === 'Delivered') &&
      order.userId
    ) {
      await clearCustomerCartOnOrderProgress(actor, order);
    }

    await logAdminAction(
      actor,
      'UPDATE_ORDER_STATUS',
      'orders',
      order.id,
      `Changed order ${order.orderNumber} from ${order.status} to ${nextStatus}`,
      { orderNumber: order.orderNumber, from: order.status, to: nextStatus }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

async function clearCustomerCartOnOrderProgress(
  actor: AdminActor,
  order: OrderRecord
): Promise<void> {
  const userRef = doc(db, 'users', order.userId);
  try {
    if (actor.role === 'owner') {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const existingCart = Array.isArray(userSnap.data().cart)
        ? userSnap.data().cart
        : [];
      if (existingCart.length === 0) return;
      if (!cartOverlapsOrder(existingCart, order.items)) return;
    }

    // Both owner and staff are permitted by firestore.rules to reset users/{uid}.cart = []
    await setDoc(
      userRef,
      {
        cart: [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Non-fatal if user doc was deleted/reset; never block order status progression
    console.warn('Customer cart clear skipped:', err instanceof Error ? err.message : err);
  }
}

export function subscribeToOrderAdminNotes(
  orderId: string,
  onNotes: (notes: OrderAdminNote[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders', orderId, 'adminNotes'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onNotes(
        snap.docs.map((s) => {
          const d = s.data();
          return {
            id: s.id,
            authorUid: String(d.authorUid || ''),
            authorEmail: String(d.authorEmail || ''),
            note: String(d.note || ''),
            createdAtMs: tsToMs(d.createdAt),
          };
        })
      );
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, `orders/${orderId}/adminNotes`);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function addOrderAdminNote(
  actor: AdminActor,
  orderId: string,
  orderNumber: string,
  noteText: string
): Promise<void> {
  const cleanNote = noteText.trim().slice(0, 600);
  if (!cleanNote || !auth.currentUser) return;
  const noteId = `note_${Date.now()}`;
  const path = `orders/${orderId}/adminNotes/${noteId}`;
  try {
    await setDoc(doc(db, 'orders', orderId, 'adminNotes', noteId), {
      authorUid: auth.currentUser.uid,
      authorEmail: (actor.email || auth.currentUser.email || 'admin').slice(0, 160),
      note: cleanNote,
      createdAt: serverTimestamp(),
    });
    await logAdminAction(
      actor,
      'ADD_ORDER_NOTE',
      'orders/adminNotes',
      orderId,
      `Added internal note on ${orderNumber}`,
      { notePreview: cleanNote.slice(0, 120) }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// --- Products CRUD, Bulk Editor & Chunked CSV Batch ---

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map(mapProduct).sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

function buildProductWritePayload(product: Product, includeCreatedAt: boolean) {
  const section = product.showInDeals
    ? 'deals'
    : product.isNew
      ? 'new'
      : product.showInPopular
        ? 'popular'
        : product.section || 'recommended';

  const base: Record<string, unknown> = {
    id: product.id.trim().slice(0, 80),
    categoryId: product.categoryId.trim().slice(0, 64),
    subcategoryId: (product.subcategoryId || 'general').trim().slice(0, 64),
    nameKu: product.nameKu.trim().slice(0, 120),
    nameAr: product.nameAr.trim().slice(0, 120),
    nameEn: product.nameEn.trim().slice(0, 120),
    size: product.size.trim().slice(0, 40),
    ourPrice: Math.max(1, Math.round(product.ourPrice)),
    marketPrice: Math.max(0, Math.round(product.marketPrice)),
    marketPriceNote: (product.marketPriceNote || '').trim().slice(0, 200),
    marketPriceUpdatedAt: product.marketPriceUpdatedAt || new Date().toISOString().slice(0, 10),
    imageUrl: (product.imageUrl || '').slice(0, 90000),
    section,
    inStock: product.inStock !== false,
    showInDeals: Boolean(product.showInDeals),
    showInPopular: Boolean(product.showInPopular),
    isNew: Boolean(product.isNew),
    isActive: Boolean(product.isActive),
    updatedAt: serverTimestamp(),
  };
  if (includeCreatedAt) {
    base.createdAt = serverTimestamp();
  }
  return base;
}

export async function saveProductAdmin(
  actor: AdminActor,
  product: Product,
  isNewRecord: boolean
): Promise<void> {
  const ref = doc(db, 'products', product.id);
  const path = `products/${product.id}`;
  try {
    if (isNewRecord) {
      await setDoc(ref, buildProductWritePayload(product, true));
    } else {
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        await updateDoc(ref, buildProductWritePayload(product, false));
      } else {
        await setDoc(ref, buildProductWritePayload(product, true));
      }
    }
    await logAdminAction(
      actor,
      isNewRecord ? 'CREATE_PRODUCT' : 'UPDATE_PRODUCT',
      'products',
      product.id,
      `${isNewRecord ? 'Added' : 'Updated'} product ${product.nameEn} (${product.ourPrice} IQD)`,
      {
        ourPrice: product.ourPrice,
        marketPrice: product.marketPrice,
        inStock: product.inStock !== false,
        isActive: product.isActive,
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductAdmin(
  actor: AdminActor,
  product: Product
): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await deleteDoc(doc(db, 'products', product.id));
    await logAdminAction(
      actor,
      'DELETE_PRODUCT',
      'products',
      product.id,
      `Deleted product ${product.nameEn}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Commits bulk price updates or CSV imports in chunked Firestore writeBatches (max 400 ops/batch).
 */
export async function bulkCommitProductsAdmin(
  actor: AdminActor,
  items: Array<{ product: Product; isNew: boolean }>,
  auditAction: 'BULK_PRICE_UPDATE' | 'CSV_IMPORT_PRODUCTS'
): Promise<number> {
  const CHUNK_SIZE = 400;
  let committed = 0;

  try {
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const slice = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const entry of slice) {
        const ref = doc(db, 'products', entry.product.id);
        if (entry.isNew) {
          batch.set(ref, buildProductWritePayload(entry.product, true));
        } else {
          batch.update(ref, buildProductWritePayload(entry.product, false));
        }
      }
      await batch.commit();
      committed += slice.length;
    }

    await logAdminAction(
      actor,
      auditAction,
      'products',
      `batch_${committed}`,
      `${auditAction === 'CSV_IMPORT_PRODUCTS' ? 'Imported' : 'Bulk updated'} ${committed} products`,
      { count: committed }
    );
    return committed;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products/batch');
  }
}

// --- Categories (Owner only) ---

export async function fetchAllCategoriesAdmin(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs
      .map((s) => {
        const d = s.data();
        return {
          id: s.id,
          nameKu: String(d.nameKu || ''),
          nameAr: String(d.nameAr || ''),
          nameEn: String(d.nameEn || ''),
          icon: String(d.icon || '🛒'),
          subcategories: Array.isArray(d.subcategories) ? d.subcategories : [],
          sortOrder: Number(d.sortOrder || 0),
          isActive: Boolean(d.isActive),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'categories');
  }
}

export async function saveCategoryAdmin(
  actor: AdminActor,
  category: Category,
  isNew: boolean
): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    await setDoc(doc(db, 'categories', category.id), {
      id: category.id.trim().slice(0, 64),
      nameKu: category.nameKu.trim().slice(0, 80),
      nameAr: category.nameAr.trim().slice(0, 80),
      nameEn: category.nameEn.trim().slice(0, 80),
      icon: (category.icon || '🛒').slice(0, 90000),
      subcategories: category.subcategories.slice(0, 20),
      sortOrder: Math.max(0, Math.min(1000, Math.round(category.sortOrder))),
      isActive: Boolean(category.isActive),
    });
    await logAdminAction(
      actor,
      isNew ? 'CREATE_CATEGORY' : 'UPDATE_CATEGORY',
      'categories',
      category.id,
      `${isNew ? 'Created' : 'Updated'} category ${category.nameEn}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryAdmin(
  actor: AdminActor,
  category: Category
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', category.id));
    await logAdminAction(
      actor,
      'DELETE_CATEGORY',
      'categories',
      category.id,
      `Deleted category ${category.nameEn}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${category.id}`);
  }
}

export async function reorderCategoriesAdmin(
  actor: AdminActor,
  ordered: Category[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    ordered.forEach((cat, idx) => {
      batch.set(doc(db, 'categories', cat.id), {
        ...cat,
        sortOrder: idx + 1,
      });
    });
    await batch.commit();
    await logAdminAction(
      actor,
      'REORDER_CATEGORIES',
      'categories',
      'order',
      `Reordered ${ordered.length} categories`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories');
  }
}

// --- Banners (Owner only) ---

export async function fetchAllBannersAdmin(): Promise<Banner[]> {
  try {
    const snap = await getDocs(collection(db, 'banners'));
    return snap.docs
      .map((s) => {
        const d = s.data();
        return {
          id: s.id,
          titleKu: String(d.titleKu || ''),
          titleAr: String(d.titleAr || ''),
          titleEn: String(d.titleEn || ''),
          imageUrl: String(d.imageUrl || ''),
          linkCategoryId: String(d.linkCategoryId || ''),
          sortOrder: Number(d.sortOrder || 0),
          isActive: Boolean(d.isActive),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'banners');
  }
}

export async function saveBannerAdmin(
  actor: AdminActor,
  banner: Banner,
  isNew: boolean
): Promise<void> {
  try {
    await setDoc(doc(db, 'banners', banner.id), {
      id: banner.id.trim().slice(0, 64),
      titleKu: banner.titleKu.trim().slice(0, 140),
      titleAr: banner.titleAr.trim().slice(0, 140),
      titleEn: banner.titleEn.trim().slice(0, 140),
      imageUrl: (banner.imageUrl || '').slice(0, 90000),
      linkCategoryId: (banner.linkCategoryId || '').slice(0, 64),
      sortOrder: Math.max(0, Math.min(100, Math.round(banner.sortOrder))),
      isActive: Boolean(banner.isActive),
    });
    await logAdminAction(
      actor,
      isNew ? 'CREATE_BANNER' : 'UPDATE_BANNER',
      'banners',
      banner.id,
      `${isNew ? 'Created' : 'Updated'} banner ${banner.titleEn}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `banners/${banner.id}`);
  }
}

export async function deleteBannerAdmin(
  actor: AdminActor,
  banner: Banner
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'banners', banner.id));
    await logAdminAction(
      actor,
      'DELETE_BANNER',
      'banners',
      banner.id,
      `Deleted banner ${banner.titleEn}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `banners/${banner.id}`);
  }
}

// --- Store Settings & CMS Translations (Owner only) ---

export async function saveStoreSettingsAdmin(
  actor: AdminActor,
  settings: StoreSettings
): Promise<void> {
  try {
    const color = settings.primaryColor || settings.themeColor || '#15663C';
    const payload: Record<string, unknown> = {
      storeName: settings.storeName.trim().slice(0, 80),
      whatsappPhone: settings.whatsappPhone.trim(),
      deliveryFee: Math.max(0, Math.round(settings.deliveryFee)),
      minimumOrder: Math.max(0, Math.round(settings.minimumOrder)),
      isStoreOpen: Boolean(settings.isStoreOpen),
      deliveryHoursText: {
        ku: settings.deliveryHoursText.ku.trim().slice(0, 160),
        ar: settings.deliveryHoursText.ar.trim().slice(0, 160),
        en: settings.deliveryHoursText.en.trim().slice(0, 160),
      },
      maxOrdersPerHour: Math.max(
        0,
        Math.min(
          50,
          Math.round(
            Number.isFinite(settings.maxOrdersPerHour)
              ? settings.maxOrdersPerHour
              : 3
          )
        )
      ),
      themeColor: color.slice(0, 20),
      primaryColor: color.slice(0, 20),
      logoUrl: (settings.logoUrl || '').slice(0, 90000),
      homeSections: (settings.homeSections || []).slice(0, 10),
      contactLinks: (settings.contactLinks || []).slice(0, 15),
    };
    await setDoc(doc(db, 'settings', 'store'), payload);
    await logAdminAction(
      actor,
      'UPDATE_STORE_SETTINGS',
      'settings',
      'store',
      `Updated store settings (open=${settings.isStoreOpen}, fee=${settings.deliveryFee}, min=${settings.minimumOrder}, maxPerHour=${payload.maxOrdersPerHour})`,
      {
        isStoreOpen: settings.isStoreOpen,
        deliveryFee: settings.deliveryFee,
        minimumOrder: settings.minimumOrder,
        maxOrdersPerHour: payload.maxOrdersPerHour,
        primaryColor: color,
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/store');
  }
}

export async function saveCmsTranslationsAdmin(
  actor: AdminActor,
  cms: CmsTranslationsDoc
): Promise<void> {
  try {
    await setDoc(doc(db, 'cms', 'translations'), {
      tagline: cms.tagline || {},
      savingsPrefix: cms.savingsPrefix || {},
      savingsSuffix: cms.savingsSuffix || {},
      confirmationNotice: cms.confirmationNotice || {},
      storeClosedTitle: cms.storeClosedTitle || {},
      storeClosedBody: cms.storeClosedBody || {},
      footerNotice: cms.footerNotice || {},
      deliveredThankYouTitle: cms.deliveredThankYouTitle || {},
      deliveredThankYouBody: cms.deliveredThankYouBody || {},
      updatedAt: serverTimestamp(),
    });
    await logAdminAction(
      actor,
      'UPDATE_CMS_TRANSLATIONS',
      'cms',
      'translations',
      'Updated trilingual storefront copy overrides'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'cms/translations');
  }
}

// --- Customers & Blocklist ---

export async function fetchAllUsersAdmin(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((s) => {
      const d = s.data();
      return {
        uid: String(d.uid || s.id),
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
        cart: Array.isArray(d.cart) ? d.cart : [],
        createdAt: d.createdAt ? tsToMs(d.createdAt) : null,
        updatedAt: d.updatedAt ? tsToMs(d.updatedAt) : null,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function fetchBlockedPhonesAdmin(): Promise<BlockedPhoneRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'blockedPhones'));
    return snap.docs.map((s) => {
      const d = s.data();
      return {
        phoneNormalized: String(d.phoneNormalized || s.id),
        reason: String(d.reason || ''),
        blockedAtMs: tsToMs(d.blockedAt),
        blockedBy: String(d.blockedBy || ''),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'blockedPhones');
  }
}

export async function blockPhoneAdmin(
  actor: AdminActor,
  phoneRaw: string,
  reason: string
): Promise<void> {
  const normalized = normalizeIraqiPhone(phoneRaw);
  const phoneNormalized = normalized.valid ? normalized.phoneNormalized : phoneRaw.trim();
  if (!/^9647\d{9}$/.test(phoneNormalized)) {
    throw new Error('Invalid Iraqi mobile number');
  }
  const cleanReason = reason.trim().slice(0, 240);
  if (!cleanReason) throw new Error('Block reason is required');
  try {
    await setDoc(doc(db, 'blockedPhones', phoneNormalized), {
      phoneNormalized,
      reason: cleanReason,
      blockedAt: serverTimestamp(),
      blockedBy: actor.uid,
    });
    await logAdminAction(
      actor,
      'BLOCK_PHONE',
      'blockedPhones',
      phoneNormalized,
      `Blocked phone ${phoneNormalized}: ${cleanReason}`,
      { reason: cleanReason }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `blockedPhones/${phoneNormalized}`);
  }
}

export async function unblockPhoneAdmin(
  actor: AdminActor,
  phoneRaw: string
): Promise<void> {
  const normalized = normalizeIraqiPhone(phoneRaw);
  const phoneNormalized = normalized.valid ? normalized.phoneNormalized : phoneRaw.trim();
  try {
    await deleteDoc(doc(db, 'blockedPhones', phoneNormalized));
    await logAdminAction(
      actor,
      'UNBLOCK_PHONE',
      'blockedPhones',
      phoneNormalized,
      `Unblocked phone ${phoneNormalized}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `blockedPhones/${phoneNormalized}`);
  }
}

// --- Date-Bounded Orders Query for Reports (Owner only) ---

export async function fetchOrdersInDateRangeAdmin(
  startMs: number,
  endMs: number
): Promise<OrderRecord[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromMillis(startMs)),
      where('createdAt', '<=', Timestamp.fromMillis(endMs)),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(mapOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
  }
}

// --- Audit Logs & Admin Users (Owner only) ---

export async function fetchAuditLogsAdmin(maxRows = 150): Promise<AuditLogEntry[]> {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(maxRows)
    );
    const snap = await getDocs(q);
    return snap.docs.map((s) => {
      const d = s.data();
      return {
        id: s.id,
        actorUid: String(d.actorUid || ''),
        actorEmail: String(d.actorEmail || ''),
        actorRole: d.actorRole === 'staff' ? 'staff' : 'owner',
        action: String(d.action || ''),
        targetCollection: String(d.targetCollection || ''),
        targetId: String(d.targetId || ''),
        details: String(d.details || ''),
        changes: String(d.changes || ''),
        createdAtMs: tsToMs(d.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'auditLogs');
  }
}

export async function fetchAdminUsersList(): Promise<AdminUserRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((s) => {
      const d = s.data();
      return {
        uid: s.id,
        email: String(d.email || ''),
        role: d.role === 'owner' ? 'owner' : 'staff',
        createdAtMs: tsToMs(d.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admins');
  }
}

export async function saveAdminUserRecord(
  actor: AdminActor,
  uid: string,
  email: string,
  role: AdminRole
): Promise<void> {
  const cleanUid = uid.trim();
  const cleanEmail = email.trim().slice(0, 160);
  try {
    await setDoc(doc(db, 'admins', cleanUid), {
      email: cleanEmail,
      role,
      createdAt: serverTimestamp(),
    });
    await logAdminAction(
      actor,
      'UPSERT_ADMIN_USER',
      'admins',
      cleanUid,
      `Set admin role ${role} for ${cleanEmail}`,
      { email: cleanEmail, role }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admins/${cleanUid}`);
  }
}

export async function deleteAdminUserRecord(
  actor: AdminActor,
  target: AdminUserRecord
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'admins', target.uid));
    await logAdminAction(
      actor,
      'DELETE_ADMIN_USER',
      'admins',
      target.uid,
      `Removed admin access for ${target.email}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admins/${target.uid}`);
  }
}
