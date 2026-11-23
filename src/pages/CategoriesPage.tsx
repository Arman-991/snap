import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardCheck,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { CategoryPhotoGrid } from '../components/CategoryPhotoGrid';
import { formatIqd, getNameByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Category, Language, Product } from '../types/grocery';
import { isProductInStock } from '../utils/adminLogic';
import { matchesProductSearch } from '../utils/supermarketLogic';

const FALLBACK_PRODUCT_IMAGE =
  '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';

interface CategoriesPageProps {
  t: TranslationDictionary;
  language: Language;
  categories: Category[];
  allProducts: Product[];
  selectedCategoryId: string | null;
  lowBandwidthMode?: boolean;
  getQuantity: (productId: string) => number;
  onSelectCategory: (categoryId: string | null) => void;
  onOpenQuickList: () => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
}

interface CompactCategoryProductCardProps {
  product: Product;
  quantity: number;
  language: Language;
  t: TranslationDictionary;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
}

function CompactCategoryProductCard({
  product,
  quantity,
  language,
  t,
  onIncrement,
  onDecrement,
  onOpenDetail,
}: CompactCategoryProductCardProps) {
  const [imgSrc, setImgSrc] = useState(
    product.imageUrl || FALLBACK_PRODUCT_IMAGE
  );

  useEffect(() => {
    setImgSrc(product.imageUrl || FALLBACK_PRODUCT_IMAGE);
  }, [product.imageUrl]);

  const name = getNameByLang(product, language);
  const inStock = isProductInStock(product);
  const hasDiscount = product.marketPrice > product.ourPrice;

  return (
    <article
      data-testid={`cat-product-${product.id}`}
      className={`flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white transition-colors hover:border-[#CBD5E1] ${
        !inStock ? 'opacity-75' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="flex flex-1 flex-col text-start focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#16A34A]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8FAFC]">
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            onError={() => {
              if (imgSrc !== FALLBACK_PRODUCT_IMAGE) {
                setImgSrc(FALLBACK_PRODUCT_IMAGE);
              }
            }}
            className={`h-full w-full object-cover object-center ${
              !inStock ? 'grayscale-[50%]' : ''
            }`}
          />
          {!inStock && (
            <span className="absolute start-2 top-2 rounded-md bg-[#B42318] px-2 py-0.5 text-[10px] font-bold text-white">
              {t.product.outOfStock}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-2.5 pt-2.5 pb-1.5 sm:px-3.5 sm:pt-3">
          <h3 className="line-clamp-2 font-display text-[13px] font-bold leading-snug text-[#0F172A] sm:text-sm">
            {name}
          </h3>
          <span className="mt-0.5 text-[11px] font-medium text-[#64748B]">
            {product.size}
          </span>

          <div className="mt-auto pt-2">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="font-display text-sm font-extrabold text-[#0F172A] tabular-nums sm:text-base">
                {formatIqd(product.ourPrice, language)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] font-medium text-[#94A3B8] line-through tabular-nums">
                  {formatIqd(product.marketPrice, language)}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      <div className="p-2.5 pt-1.5 sm:p-3.5 sm:pt-2">
        {!inStock ? (
          <button
            type="button"
            disabled
            className="flex min-h-[44px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] px-2 text-xs font-semibold text-[#64748B]"
          >
            {t.product.outOfStock}
          </button>
        ) : quantity === 0 ? (
          <button
            type="button"
            data-testid={`cat-add-${product.id}`}
            onClick={() => onIncrement(product)}
            aria-label={`${t.product.add}: ${name}`}
            className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-xl bg-[#16A34A] px-3 text-sm font-bold text-white transition-transform hover:bg-[#15803D] active:scale-[0.97]"
          >
            <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold sm:text-sm">{t.product.add}</span>
          </button>
        ) : (
          <div className="flex min-h-[44px] items-center justify-between rounded-xl border border-[#16A34A] bg-[#F0FDF4]">
            <button
              type="button"
              onClick={() => onDecrement(product)}
              aria-label={`${t.product.decreaseQty}: ${name}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#15803D] transition-transform hover:bg-[#DCFCE7] active:scale-95"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="font-display text-sm font-extrabold text-[#0F172A] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(product)}
              aria-label={`${t.product.increaseQty}: ${name}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#15803D] transition-transform hover:bg-[#DCFCE7] active:scale-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function CategoriesPage({
  t,
  language,
  categories,
  allProducts,
  selectedCategoryId,
  lowBandwidthMode = false,
  getQuantity,
  onSelectCategory,
  onOpenQuickList,
  onIncrement,
  onDecrement,
  onOpenDetail,
}: CategoriesPageProps) {
  const [selectedSubId, setSelectedSubId] = useState<string>('all');
  const [inCategoryQuery, setInCategoryQuery] = useState<string>('');

  const activeCategory = useMemo(
    () =>
      selectedCategoryId
        ? categories.find((cat) => cat.id === selectedCategoryId) ?? null
        : null,
    [categories, selectedCategoryId]
  );

  // Reset subcategory & local search when switching categories
  useEffect(() => {
    setSelectedSubId('all');
    setInCategoryQuery('');
  }, [selectedCategoryId]);

  const detailProducts = useMemo(() => {
    if (!activeCategory) return [];
    return allProducts.filter((product) => {
      if (!product.isActive) return false;
      if (product.categoryId !== activeCategory.id) return false;
      if (selectedSubId !== 'all' && product.subcategoryId !== selectedSubId) {
        return false;
      }
      if (
        inCategoryQuery.trim() &&
        !matchesProductSearch(product, inCategoryQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [activeCategory, allProducts, inCategoryQuery, selectedSubId]);

  // --- VIEW B: Category Detail View (Fast Browsing) ---
  if (activeCategory) {
    const categoryTitle = getNameByLang(activeCategory, language);

    return (
      <main className="w-full px-3 pb-4">
        {/* Sticky Top Bar: Mirrored Back Arrow, Category Name, Search, Subcategory Pills */}
        <div
          data-testid="category-detail-header"
          className="sticky top-14 z-20 -mx-3 border-b border-gray-200/80 bg-white/95 px-3 pt-2.5 pb-3 backdrop-blur-md"
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="category-detail-back"
                onClick={() => onSelectCategory(null)}
                aria-label={t.categoriesPage.backToCategories}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] transition-colors hover:bg-[#F1F5F9] active:scale-95"
              >
                <ArrowLeft
                  className="h-5 w-5 rtl:rotate-180"
                  aria-hidden="true"
                />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-base font-extrabold text-[#0F172A] sm:text-lg">
                  {categoryTitle}
                </h1>
              </div>

              <span className="shrink-0 rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#475569] tabular-nums">
                {detailProducts.length} {t.storefront.itemsCount}
              </span>
            </div>

            {/* Compact In-Category Search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
                aria-hidden="true"
              />
              <input
                type="search"
                data-testid="category-detail-search"
                value={inCategoryQuery}
                onChange={(e) => setInCategoryQuery(e.target.value)}
                placeholder={t.categoriesPage.searchInCategory}
                aria-label={t.categoriesPage.searchInCategory}
                className="min-h-[44px] w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] ps-9 pe-11 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-[#16A34A] focus:bg-white focus:outline-none"
              />
              {inCategoryQuery && (
                <button
                  type="button"
                  onClick={() => setInCategoryQuery('')}
                  aria-label={t.storefront.clearSearch}
                  className="absolute end-0 top-0 flex h-11 w-11 items-center justify-center rounded-xl text-[#64748B] hover:text-[#0F172A]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Subcategory Pills */}
            {activeCategory.subcategories.length > 0 && (
              <div
                role="tablist"
                aria-label={categoryTitle}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 pb-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedSubId === 'all'}
                  onClick={() => setSelectedSubId('all')}
                  className={`min-h-[40px] shrink-0 rounded-full px-4 text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedSubId === 'all'
                      ? 'bg-[#16A34A] text-white'
                      : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {t.storefront.allSubcategories}
                </button>

                {activeCategory.subcategories.map((sub) => {
                  const active = selectedSubId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      data-testid={`subcategory-pill-${sub.id}`}
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`min-h-[40px] shrink-0 rounded-full px-4 text-xs font-bold transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#16A34A] text-white'
                          : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {getNameByLang(sub, language)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Clean 2-Column Product Grid */}
        <div className="pt-4">
          {detailProducts.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-12 text-center">
              <p className="font-display text-base font-bold text-[#0F172A]">
                {t.categoriesPage.emptyCategoryTitle}
              </p>
              <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                {t.categoriesPage.emptyCategoryBody}
              </p>
              {(selectedSubId !== 'all' || inCategoryQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubId('all');
                    setInCategoryQuery('');
                  }}
                  className="mt-4 min-h-[44px] rounded-xl bg-[#16A34A] px-5 text-xs font-bold text-white hover:bg-[#15803D]"
                >
                  {t.storefront.resetFilters}
                </button>
              )}
            </div>
          ) : (
            <div
              data-testid="category-product-grid"
              className="grid grid-cols-2 gap-2.5"
            >
              {detailProducts.map((product) => (
                <CompactCategoryProductCard
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
          )}
        </div>
      </main>
    );
  }

  // --- VIEW A: Snapp Express-Style Visual 3-Column Category Grid ---
  return (
    <main className="w-full space-y-4 px-3 pt-4 pb-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-lg font-extrabold text-[#0F172A]">
          {t.categoriesPage.title}
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          {t.categoriesPage.subtitle}
        </p>
      </div>

      {/* Prominent Quick Shopping List Entry Banner */}
      <button
        type="button"
        data-testid="categories-quicklist-banner"
        onClick={onOpenQuickList}
        className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-3.5 text-start transition-all hover:border-[#86EFAC] hover:bg-[#DCFCE7]/60 active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-white shadow-xs">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xs font-extrabold leading-snug text-[#14532D] sm:text-sm">
              {t.quickList.bannerText}
            </span>
          </span>
        </span>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-[#15803D] rtl:rotate-180"
          aria-hidden="true"
        />
      </button>

      {/* Studio Visual Category Photo Grid (dir="ltr" for uniform alignment across KU/AR/EN) */}
      <CategoryPhotoGrid
        categories={categories}
        language={language}
        lowBandwidthMode={lowBandwidthMode}
        onSelectCategory={(categoryId) => onSelectCategory(categoryId)}
        testId="categories-visual-grid"
        testIdPrefix="category-tile"
      />
    </main>
  );
}
