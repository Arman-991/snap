export type Language = 'ku' | 'ar' | 'en';

export type TextDirection = 'ltr' | 'rtl';

export type AppView = 'market' | 'orders' | 'profile';

export type ProductSection = 'deals' | 'popular' | 'new' | 'recommended';

export type OrderStatus =
  | 'New'
  | 'Called'
  | 'Confirmed'
  | 'Bought'
  | 'Delivered'
  | 'Cancelled'
  | 'Fake';

export type AsyncStatus = 'loading' | 'ready' | 'error';

export type AdminRole = 'owner' | 'staff';

export type AdminTabId =
  | 'orders'
  | 'products'
  | 'categories'
  | 'customers'
  | 'home'
  | 'settings'
  | 'reports'
  | 'audit'
  | 'admins';

export interface DeliveryHoursText {
  ku: string;
  ar: string;
  en: string;
}

export interface HomeSectionConfig {
  id: ProductSection;
  visible: boolean;
  sortOrder: number;
}

export type ContactLinkType = 'whatsapp' | 'phone' | 'instagram' | 'facebook';

export interface ContactLinkItem {
  id: string;
  type: ContactLinkType;
  labelKu: string;
  labelAr: string;
  labelEn: string;
  url: string;
  visible: boolean;
  sortOrder: number;
}

export interface StoreSettings {
  storeName: string;
  whatsappPhone: string;
  deliveryFee: number;
  minimumOrder: number;
  isStoreOpen: boolean;
  deliveryHoursText: DeliveryHoursText;
  maxOrdersPerHour: number;
  themeColor: string;
  primaryColor?: string;
  logoUrl?: string;
  homeSections?: HomeSectionConfig[];
  contactLinks?: ContactLinkItem[];
}

export type TrilingualPartial = Partial<Record<Language, string>>;

export interface CmsTranslationsDoc {
  tagline?: TrilingualPartial;
  savingsPrefix?: TrilingualPartial;
  savingsSuffix?: TrilingualPartial;
  confirmationNotice?: TrilingualPartial;
  storeClosedTitle?: TrilingualPartial;
  storeClosedBody?: TrilingualPartial;
  footerNotice?: TrilingualPartial;
  deliveredThankYouTitle?: TrilingualPartial;
  deliveredThankYouBody?: TrilingualPartial;
}

export interface CustomerNotificationItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  orderSavings: number;
  lifetimeSavings: number;
  deliveredOrderCount: number;
  createdAtMs: number;
  read: boolean;
}

export interface Subcategory {
  id: string;
  nameKu: string;
  nameAr: string;
  nameEn: string;
}

export interface Category {
  id: string;
  nameKu: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  subcategories: Subcategory[];
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  subcategoryId: string;
  nameKu: string;
  nameAr: string;
  nameEn: string;
  size: string;
  ourPrice: number;
  marketPrice: number;
  marketPriceNote?: string;
  marketPriceUpdatedAt?: string | null;
  imageUrl: string;
  section: ProductSection;
  inStock?: boolean;
  showInDeals?: boolean;
  showInPopular?: boolean;
  isNew?: boolean;
  isActive: boolean;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

export interface Banner {
  id: string;
  titleKu: string;
  titleAr: string;
  titleEn: string;
  imageUrl: string;
  linkCategoryId: string;
  sortOrder: number;
  isActive: boolean;
}

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  phoneDisplay: string;
  phoneNormalized: string;
  addressText: string;
  buildingNotes: string;
  gps: GpsCoordinates | null;
  language: Language;
  cart: CartItem[];
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

export interface ProfileFormInput {
  fullName: string;
  phoneInput: string;
  addressText: string;
  buildingNotes: string;
  gps: GpsCoordinates | null;
  language: Language;
}

export interface ProfileValidationErrors {
  fullName?: 'required' | 'too_short';
  phoneInput?: 'required' | 'invalid_iraqi';
  addressText?: 'required' | 'too_short';
}

export interface ResolvedCartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
  lineSavings: number;
}

export interface LiveCartSummary {
  itemCount: number;
  subtotal: number;
  totalSavings: number;
  deliveryFee: number;
  grandTotal: number;
  minimumOrder: number;
  meetsMinimumOrder: boolean;
  remainingForMinimum: number;
}

export interface OrderItemSnapshot {
  productId: string;
  nameKu: string;
  nameAr: string;
  nameEn: string;
  size: string;
  quantity: number;
  ourPrice: number;
  marketPrice: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  phoneDisplay: string;
  phoneNormalized: string;
  addressText: string;
  buildingNotes: string;
  gps: GpsCoordinates | null;
  googleMapsUrl: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  totalSavings: number;
  deliveryFee: number;
  grandTotal: number;
  status: OrderStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface OrderAdminNote {
  id: string;
  authorUid: string;
  authorEmail: string;
  note: string;
  createdAtMs: number;
}

export interface BlockedPhoneRecord {
  phoneNormalized: string;
  reason: string;
  blockedAtMs: number;
  blockedBy: string;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  role: AdminRole;
  createdAtMs?: number;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  targetCollection: string;
  targetId: string;
  details: string;
  changes: string;
  createdAtMs: number;
}
