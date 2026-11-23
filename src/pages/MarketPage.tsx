import { useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { CatalogToolbar } from '../components/CatalogToolbar';
import { HeroBanner } from '../components/HeroBanner';
import { ProductCard } from '../components/ProductCard';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  AsyncStatus,
  Banner,
  Category,
  Language,
  Product,
  ProductSection,
  StoreSettings,
} from '../types/grocery';

interface MarketPageProps {
  t: TranslationDictionary;
  language: Language;
  settings: StoreSettings;
  banners: Banner[];
  categories: Category[];
  selectedCategory: Category | null;
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedSection: 'all' | ProductSection;
  searchQuery: string;
  visibleProducts: Product[];
  status: AsyncStatus;
  hasMore: boolean;
  loadingMore: boolean;
  isOnline: boolean;
  getQuantity: (productId: string) => number;
  onSearchChange: (value: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (subcategoryId: string) => void;
  onSelectSection: (section: 'all' | ProductSection) => void;
  onResetFilters: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
  onOpenCategoriesGrid: () => void;
  onOpenQuickList: () => void;
}

export function MarketPage({
  t,
  language,
  settings,
  banners,
  categories,
  selectedCategory,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSection,
  searchQuery,
  visibleProducts,
  status,
  hasMore,
  loadingMore,
  isOnline,
  getQuantity,
  onSearchChange,
  onSelectCategory,
  onSelectSubcategory,
  onSelectSection,
  onResetFilters,
  onLoadMore,
  onRetry,
  onIncrement,
  onDecrement,
  onOpenDetail,
  onOpenCategoriesGrid,
  onOpenQuickList,
}: MarketPageProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '260px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <main className="w-full space-y-4 px-3 pt-3">
      {/* Offline Banner */}
      {!isOnline && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-[#F2DEC0] bg-[#FEF9EE] px-4 py-3 text-xs font-semibold text-[#8C5B12] sm:text-sm"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.storefront.offlineBanner}</span>
        </div>
      )}

      {/* Store Closed Banner */}
      {!settings.isStoreOpen && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F0C9C4] bg-[#FDF2F0] p-4 text-start"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#9A2E20]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.storefront.storeClosedTitle}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#7F291E] sm:text-sm">
            {t.storefront.storeClosedBody}
          </p>
        </div>
      )}

      {/* Hero Banners */}
      <HeroBanner
        t={t}
        language={language}
        banners={banners}
        settings={settings}
        onSelectCategory={onSelectCategory}
      />

      {/* Search, Quick List, Sections, Categories & Subcategories */}
      <CatalogToolbar
        t={t}
        language={language}
        categories={categories}
        homeSections={settings.homeSections}
        lowBandwidthMode={Boolean(settings.lowBandwidthCategorySvgOnly)}
        selectedCategory={selectedCategory}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedSection={selectedSection}
        searchQuery={searchQuery}
        visibleCount={visibleProducts.length}
        onSearchChange={onSearchChange}
        onSelectCategory={onSelectCategory}
        onSelectSubcategory={onSelectSubcategory}
        onSelectSection={onSelectSection}
        onOpenCategoriesGrid={onOpenCategoriesGrid}
        onOpenQuickList={onOpenQuickList}
      />

      {/* Product Feed States */}
      {status === 'loading' ? (
        <div aria-busy="true" className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-2.5"
            >
              <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-[#ECEFEA]" />
              <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-[#ECEFEA]" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[#ECEFEA]" />
              <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-[#ECEFEA]" />
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="rounded-2xl border border-[#E5E7E4] bg-white px-6 py-12 text-center">
          <h2 className="font-display text-lg font-bold text-[#141A15]">
            {t.storefront.loadErrorTitle}
          </h2>
          <p className="mt-1.5 text-sm text-[#566058]">
            {t.storefront.loadErrorBody}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#15663C] px-5 text-sm font-semibold text-white hover:bg-[#105230]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>{t.storefront.retry}</span>
          </button>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7E4] bg-white px-6 py-12 text-center">
          <h2 className="font-display text-lg font-bold text-[#141A15]">
            {t.storefront.emptyTitle}
          </h2>
          <p className="mt-1.5 text-sm text-[#566058]">
            {t.storefront.emptyBody}
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 min-h-[48px] rounded-xl bg-[#15663C] px-5 text-sm font-semibold text-white hover:bg-[#105230]"
          >
            {t.storefront.resetFilters}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getQuantity(product.id)}
                language={language}
                t={t}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>

          {/* Endless Scroll Sentinel + Load More Button */}
          <div ref={sentinelRef} className="flex flex-col items-center pt-4">
            {hasMore ? (
              <button
                type="button"
                disabled={loadingMore}
                onClick={onLoadMore}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-6 text-sm font-semibold text-[#141A15] transition-colors hover:border-[#15663C] hover:text-[#15663C] disabled:opacity-60"
              >
                {loadingMore ? t.storefront.loadingMore : t.storefront.loadMore}
              </button>
            ) : (
              <p className="text-xs font-medium text-[#78827A]">
                {t.storefront.endOfCatalog}
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
