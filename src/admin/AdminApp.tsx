import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  BarChart3,
  ClipboardList,
  FolderTree,
  Globe,
  LayoutTemplate,
  Lock,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { DEFAULT_STORE_SETTINGS } from '../data/erbilSeedData';
import { auth } from '../lib/firebase';
import {
  fetchAdminRecord,
  fetchCmsTranslations,
  fetchStoreSettings,
  loadCachedLanguage,
  saveCachedLanguage,
  seedSampleCatalogToFirestore,
  signInAdminWithEmailPassword,
  signInAdminWithGoogle,
  signOutCurrentUser,
} from '../services/firestoreService';
import type {
  AdminTabId,
  AdminUserRecord,
  AuditLogEntry,
  Banner,
  BlockedPhoneRecord,
  Category,
  CmsTranslationsDoc,
  Language,
  OrderRecord,
  Product,
  StoreSettings,
  UserProfile,
} from '../types/grocery';
import { getVisibleAdminTabs } from '../utils/adminLogic';
import { ADMIN_TRANSLATIONS } from './i18n/adminTranslations';
import {
  fetchAdminUsersList,
  fetchAllBannersAdmin,
  fetchAllCategoriesAdmin,
  fetchAllProductsAdmin,
  fetchAllUsersAdmin,
  fetchAuditLogsAdmin,
  fetchBlockedPhonesAdmin,
  subscribeToAllOrdersAdmin,
  type AdminActor,
} from './services/adminFirestoreService';
import { AdminUsersTab } from './tabs/AdminUsersTab';
import { AuditLogTab } from './tabs/AuditLogTab';
import { CategoriesTab } from './tabs/CategoriesTab';
import { CustomersTab } from './tabs/CustomersTab';
import { HomeEditorTab } from './tabs/HomeEditorTab';
import { OrdersTab } from './tabs/OrdersTab';
import { ProductsTab } from './tabs/ProductsTab';
import { ReportsTab } from './tabs/ReportsTab';
import { SettingsTab } from './tabs/SettingsTab';

type AuthGateState = 'checking' | 'login' | 'denied' | 'authorized';

const LANG_OPTIONS: Array<{ code: Language; label: string }> = [
  { code: 'ku', label: 'کوردی' },
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'EN' },
];

const TAB_ICONS: Record<AdminTabId, typeof ClipboardList> = {
  orders: ClipboardList,
  products: Package,
  categories: FolderTree,
  customers: Users,
  home: LayoutTemplate,
  settings: Settings,
  reports: BarChart3,
  audit: ShieldCheck,
  admins: Lock,
};

export default function AdminApp() {
  const [language, setLanguage] = useState<Language>(() => loadCachedLanguage());
  const [authState, setAuthState] = useState<AuthGateState>('checking');
  const [adminUser, setAdminUser] = useState<AdminUserRecord | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTabId>('orders');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin workspace data state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [cms, setCms] = useState<CmsTranslationsDoc>({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [blockedPhones, setBlockedPhones] = useState<BlockedPhoneRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const t = ADMIN_TRANSLATIONS[language];
  const dir = language === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language === 'ku' ? 'ckb' : language;
    saveCachedLanguage(language);
  }, [dir, language]);

  // Auth listener with strict admins/{uid} verification + immediate sign-out for non-admins
  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setAdminUser(null);
        setAuthState((prev) => (prev === 'denied' ? 'denied' : 'login'));
        return;
      }

      setAuthState('checking');
      const record = await fetchAdminRecord(user);
      if (!active) return;

      if (!record) {
        // Non-admin or anonymous customer on /admin -> immediately sign out & show Access Denied
        await signOutCurrentUser().catch(() => undefined);
        if (!active) return;
        setAdminUser(null);
        setAuthState('denied');
        return;
      }

      setAdminUser(record);
      setAuthState('authorized');
      const allowed = getVisibleAdminTabs(record.role);
      setActiveTab((prev) => (allowed.includes(prev) ? prev : 'orders'));
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const visibleTabs = useMemo(
    () => (adminUser ? getVisibleAdminTabs(adminUser.role) : []),
    [adminUser]
  );

  const actor: AdminActor | null = useMemo(() => {
    if (!adminUser) return null;
    return {
      uid: adminUser.uid,
      email: adminUser.email,
      role: adminUser.role,
    };
  }, [adminUser]);

  const loadCatalogAndSettings = useCallback(async () => {
    if (!adminUser) return;
    setDataLoading(true);
    try {
      const [prods, cats, liveCms] = await Promise.all([
        fetchAllProductsAdmin(),
        fetchAllCategoriesAdmin(),
        fetchCmsTranslations(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCms(liveCms);

      if (adminUser.role === 'owner') {
        const [
          liveSettings,
          liveBanners,
          liveUsers,
          liveBlocked,
          liveLogs,
          liveAdmins,
        ] = await Promise.all([
          fetchStoreSettings(),
          fetchAllBannersAdmin(),
          fetchAllUsersAdmin(),
          fetchBlockedPhonesAdmin(),
          fetchAuditLogsAdmin(150),
          fetchAdminUsersList(),
        ]);
        setSettings(liveSettings);
        setBanners(liveBanners);
        setUsers(liveUsers);
        setBlockedPhones(liveBlocked);
        setAuditLogs(liveLogs);
        setAdminUsers(liveAdmins);
      }
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setDataLoading(false);
    }
  }, [adminUser]);

  // Real-time orders subscription + initial tab data load when authorized
  useEffect(() => {
    if (authState !== 'authorized' || !adminUser) return;

    setOrdersLoading(true);
    const unsubOrders = subscribeToAllOrdersAdmin(
      (list) => {
        setOrders(list);
        setOrdersLoading(false);
      },
      () => {
        setOrdersLoading(false);
      }
    );

    void loadCatalogAndSettings();

    return () => {
      unsubOrders();
    };
  }, [authState, adminUser, loadCatalogAndSettings]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginBusy(true);
    try {
      await signInAdminWithEmailPassword(emailInput, passwordInput);
    } catch {
      setLoginError(t.login.invalidCreds);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setLoginBusy(true);
    try {
      await signInAdminWithGoogle();
    } catch {
      setLoginError(t.login.invalidCreds);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOutCurrentUser();
    setAdminUser(null);
    setAuthState('login');
  };

  const handleSeedCatalog = async () => {
    if (!adminUser || adminUser.role !== 'owner') return;
    setSeeding(true);
    try {
      await seedSampleCatalogToFirestore();
      await loadCatalogAndSettings();
    } finally {
      setSeeding(false);
    }
  };

  const newOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'New').length,
    [orders]
  );

  // Language switcher bar reusable across login / denied / workspace
  const renderLanguageSwitcher = () => (
    <div
      className="inline-flex items-center rounded-lg border border-[#D4DAD2] bg-white p-0.5"
      role="group"
      aria-label="Admin language"
    >
      {LANG_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLanguage(opt.code)}
          className={`min-h-[44px] rounded-md px-2.5 text-xs font-semibold transition-colors ${
            language === opt.code
              ? 'bg-[#15663C] text-white'
              : 'text-[#3C463E] hover:bg-[#F3F5F2]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  // 1. Checking auth state
  if (authState === 'checking') {
    return (
      <div
        dir={dir}
        className="flex min-h-screen items-center justify-center bg-[#F6F7F5] p-6"
      >
        <div className="w-full max-w-sm rounded-xl border border-[#E4E7E2] bg-white p-8 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#E4E7E2] border-t-[#15663C]" />
          <p className="text-sm font-medium text-[#3C463E]">
            {t.login.signingIn}
          </p>
        </div>
      </div>
    );
  }

  // 2. Access Denied state (non-admin signed out immediately)
  if (authState === 'denied') {
    return (
      <div
        dir={dir}
        className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F5] p-5"
      >
        <div className="mb-4">{renderLanguageSwitcher()}</div>
        <div className="w-full max-w-md rounded-xl border border-[#F2C3C1] bg-white p-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FDF1F0] text-[#B42318]">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-[#141A15]">
            {t.accessDenied.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5B665D]">
            {t.accessDenied.body}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setLoginError(null);
                setAuthState('login');
              }}
              className="min-h-[48px] flex-1 rounded-lg bg-[#15663C] px-4 text-sm font-semibold text-white hover:bg-[#115331]"
            >
              {t.accessDenied.backToLogin}
            </button>
            <a
              href="/"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-lg border border-[#D4DAD2] bg-white px-4 text-sm font-semibold text-[#141A15] hover:bg-[#F6F7F5]"
            >
              {t.accessDenied.goToStore}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Separate Admin Login screen
  if (authState === 'login' || !adminUser || !actor) {
    return (
      <div
        dir={dir}
        className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F5] p-5"
      >
        <div className="mb-5 flex w-full max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#15663C] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-[#141A15]">
              {t.panelTitle}
            </span>
          </div>
          {renderLanguageSwitcher()}
        </div>

        <div className="w-full max-w-md rounded-xl border border-[#E4E7E2] bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[#141A15]">{t.login.title}</h1>
          <p className="mt-1.5 text-sm text-[#5B665D]">{t.login.subtitle}</p>

          {loginError && (
            <div className="mt-4 rounded-lg border border-[#F2C3C1] bg-[#FDF1F0] p-3 text-sm text-[#B42318]">
              {loginError}
            </div>
          )}

          <form
            onSubmit={(e) => void handleEmailLogin(e)}
            className="mt-5 space-y-4"
          >
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-semibold text-[#3C463E]"
              >
                {t.login.emailLabel}
              </label>
              <input
                id="admin-email"
                type="email"
                dir="ltr"
                required
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="owner@bazarfresh.iq"
                className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold text-[#3C463E]"
              >
                {t.login.passwordLabel}
              </label>
              <input
                id="admin-password"
                type="password"
                dir="ltr"
                required
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginBusy}
              className="min-h-[48px] w-full rounded-lg bg-[#15663C] px-4 text-sm font-semibold text-white hover:bg-[#115331] disabled:opacity-60"
            >
              {loginBusy ? t.login.signingIn : t.login.signInEmail}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E4E7E2]" />
            <span className="text-xs font-medium text-[#6B726A]">
              {language === 'ku' ? 'یان' : language === 'ar' ? 'أو' : 'OR'}
            </span>
            <div className="h-px flex-1 bg-[#E4E7E2]" />
          </div>

          <button
            type="button"
            disabled={loginBusy}
            onClick={() => void handleGoogleLogin()}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-[#D4DAD2] bg-white px-4 text-sm font-semibold text-[#141A15] hover:bg-[#F6F7F5] disabled:opacity-60"
          >
            <Globe className="h-4 w-4 text-[#15663C]" />
            <span>{t.login.signInGoogle}</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Authenticated Admin Workspace (Desktop Sidebar + Mobile Drawer)
  const renderNavItems = (onPick?: () => void) => (
    <nav className="flex-1 space-y-1 p-3" aria-label="Admin sections">
      {visibleTabs.map((tabId) => {
        const Icon = TAB_ICONS[tabId];
        const isActive = activeTab === tabId;
        return (
          <button
            key={tabId}
            type="button"
            onClick={() => {
              setActiveTab(tabId);
              onPick?.();
            }}
            className={`flex min-h-[48px] w-full items-center justify-between rounded-lg px-3.5 text-start text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#EBF7F0] text-[#15663C]'
                : 'text-[#3C463E] hover:bg-[#F3F5F2]'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t.tabs[tabId]}</span>
            </span>
            {tabId === 'orders' && newOrdersCount > 0 && (
              <span className="rounded bg-[#B42318] px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                {newOrdersCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div dir={dir} className="flex min-h-screen bg-[#F6F7F5] text-[#141A15]">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-[#E4E7E2] bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-[#E4E7E2] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#15663C] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#141A15]">
              {t.panelTitle}
            </p>
            <p className="truncate text-xs text-[#5B665D]">{adminUser.email}</p>
          </div>
        </div>

        {renderNavItems()}

        <div className="border-t border-[#E4E7E2] p-3">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3.5 text-sm font-semibold text-[#B42318] hover:bg-[#FDF1F0]"
          >
            <LogOut className="h-4 w-4" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Collapsible Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[#E4E7E2] px-4">
              <span className="truncate text-sm font-bold text-[#141A15]">
                {t.panelTitle}
              </span>
              <button
                type="button"
                aria-label={t.closeMenu}
                onClick={() => setMobileDrawerOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-lg text-[#3C463E] hover:bg-[#F3F5F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavItems(() => setMobileDrawerOpen(false))}
            <div className="border-t border-[#E4E7E2] p-3">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3.5 text-sm font-semibold text-[#B42318] hover:bg-[#FDF1F0]"
              >
                <LogOut className="h-4 w-4" />
                <span>{t.signOut}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-[#E4E7E2] bg-white px-4 py-2 lg:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t.openMenu}
              onClick={() => setMobileDrawerOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#E4E7E2] text-[#141A15] hover:bg-[#F6F7F5] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold text-[#141A15] sm:text-lg">
              {t.tabs[activeTab]}
            </h1>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                adminUser.role === 'owner'
                  ? 'bg-[#EBF7F0] text-[#15663C]'
                  : 'bg-[#F2F4F1] text-[#3C463E]'
              }`}
            >
              {adminUser.role === 'owner' ? t.ownerRole : t.staffRole}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {renderLanguageSwitcher()}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">
          {activeTab === 'orders' && (
            <OrdersTab
              t={t}
              language={language}
              actor={actor}
              orders={orders}
              loading={ordersLoading}
              cms={cms}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab
              t={t}
              language={language}
              actor={actor}
              products={products}
              categories={categories}
              loading={dataLoading}
              onRefresh={loadCatalogAndSettings}
              onSeedCatalog={
                adminUser.role === 'owner' ? handleSeedCatalog : undefined
              }
              seeding={seeding}
            />
          )}

          {activeTab === 'categories' && adminUser.role === 'owner' && (
            <CategoriesTab
              t={t}
              language={language}
              actor={actor}
              categories={categories}
              loading={dataLoading}
              onRefresh={loadCatalogAndSettings}
            />
          )}

          {activeTab === 'customers' && adminUser.role === 'owner' && (
            <CustomersTab
              t={t}
              language={language}
              actor={actor}
              users={users}
              orders={orders}
              blockedPhones={blockedPhones}
              loading={dataLoading}
              onRefresh={loadCatalogAndSettings}
            />
          )}

          {activeTab === 'home' && adminUser.role === 'owner' && (
            <HomeEditorTab
              t={t}
              language={language}
              actor={actor}
              banners={banners}
              categories={categories}
              settings={settings}
              cms={cms}
              onRefresh={loadCatalogAndSettings}
            />
          )}

          {activeTab === 'settings' && adminUser.role === 'owner' && (
            <SettingsTab
              t={t}
              language={language}
              actor={actor}
              settings={settings}
              users={users}
              onRefresh={loadCatalogAndSettings}
            />
          )}

          {activeTab === 'reports' && adminUser.role === 'owner' && (
            <ReportsTab
              t={t}
              language={language}
              fallbackOrders={orders}
            />
          )}

          {activeTab === 'audit' && adminUser.role === 'owner' && (
            <AuditLogTab
              t={t}
              language={language}
              logs={auditLogs}
              loading={dataLoading}
              onRefresh={loadCatalogAndSettings}
            />
          )}

          {activeTab === 'admins' && adminUser.role === 'owner' && (
            <AdminUsersTab
              t={t}
              language={language}
              actor={actor}
              admins={adminUsers}
              loading={dataLoading}
              onRefresh={loadCatalogAndSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
