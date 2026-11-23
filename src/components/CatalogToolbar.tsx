import { ChevronRight, ClipboardCheck, Search, X } from 'lucide-react';
import { getNameByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  Category,
  HomeSectionConfig,
  Language,
  ProductSection,
} from '../types/grocery';
import { CategoryPhotoGrid } from './CategoryPhotoGrid';

interface CatalogToolbarProps {
  t: TranslationDictionary;
  language: Language;
  categories: Category[];
  homeSections?: HomeSectionConfig[];
  lowBandwidthMode?: boolean;
  selectedCategory: Category | null;
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedSection: 'all' | ProductSection;
  searchQuery: string;
  visibleCount: number;
  onSearchChange: (value: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (subcategoryId: string) => void;
  onSelectSection: (section: 'all' | ProductSection) => void;
  onOpenCategoriesGrid?: () => void;
  onOpenQuickList?: () => void;
}

const DEFAULT_SECTIONS: ProductSection[] = [
  'deals',
  'popular',
  'new',
  'recommended',
];

export function CatalogToolbar({
  t,
  language,
  categories,
  homeSections,
  lowBandwidthMode = false,
  selectedCategory,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSection,
  searchQuery,
  visibleCount,
  onSearchChange,
  onSelectCategory,
  onSelectSubcategory,
  onSelectSection,
  onOpenCategoriesGrid,
  onOpenQuickList,
}: CatalogToolbarProps) {
  const orderedSections: Array<'all' | ProductSection> = [
    'all',
    ...(homeSections && homeSections.length > 0
      ? [...homeSections]
          .filter((s) => s.visible)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((s) => s.id)
      : DEFAULT_SECTIONS),
  ];

  return (
    <section
      aria-label="Catalog search and filters"
      className="space-y-3 border-b border-gray-200/80 pb-4"
    >
      {/* Row 1: 100% Full-Width Search Input (Language moved cleanly to sticky Header) */}
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          data-testid="home-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.storefront.searchPlaceholder}
          aria-label={t.storefront.searchPlaceholder}
          className="h-11 w-full rounded-2xl border border-gray-200 bg-white ps-10 pe-11 text-sm text-[#141A15] shadow-2xs placeholder:text-gray-400 focus:border-green-600 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label={t.storefront.clearSearch}
            className="absolute end-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl text-gray-500 hover:text-gray-900 active:scale-95"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Row 2: Compact Quick Shopping List Entry */}
      {onOpenQuickList && (
        <button
          type="button"
          data-testid="home-quicklist-btn"
          onClick={onOpenQuickList}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-2xl border border-green-200 bg-green-50/80 px-3.5 py-2 text-start transition-transform duration-100 hover:bg-green-100/70 active:scale-[0.98]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <ClipboardCheck
              className="h-4 w-4 shrink-0 text-green-600"
              aria-hidden="true"
            />
            <span className="line-clamp-2 font-display text-xs font-bold leading-snug text-green-900">
              {t.quickList.bannerText}
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-green-700 rtl:rotate-180"
            aria-hidden="true"
          />
        </button>
      )}

      {/* Row 3: Smooth Horizontal Scrollable Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {orderedSections.map((sec) => {
          const active = selectedSection === sec;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => onSelectSection(sec)}
              aria-pressed={active}
              className={`min-h-[38px] shrink-0 rounded-full px-3.5 text-xs font-bold transition-transform duration-100 active:scale-95 whitespace-nowrap ${
                active
                  ? 'bg-[#141A15] text-white shadow-2xs'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {t.storefront.sections[sec]}
            </button>
          );
        })}
      </div>

      {/* Row 4: Shop by Categories Visual Full-Photo Grid */}
      {categories.length > 0 && (
        <div
          data-testid="home-shop-by-categories"
          className="space-y-2.5 pt-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="truncate font-display text-base font-extrabold text-[#141A15]">
                {t.categoriesPage.shopByCategoriesTitle}
              </h2>

              {selectedCategoryId !== 'all' && (
                <button
                  type="button"
                  data-testid="home-show-all-items-btn"
                  onClick={() => onSelectCategory('all')}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-full bg-green-50 px-2.5 text-[11px] font-bold text-green-700 ring-1 ring-inset ring-green-600/30 transition-transform duration-100 hover:bg-green-100 active:scale-95"
                >
                  <span>{t.categoriesPage.showAllItems}</span>
                  <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                </button>
              )}
            </div>

            {onOpenCategoriesGrid && (
              <button
                type="button"
                data-testid="home-all-categories-shortcut"
                onClick={onOpenCategoriesGrid}
                className="inline-flex min-h-[34px] shrink-0 items-center gap-0.5 rounded-full border border-green-600 bg-white px-3 text-xs font-bold text-green-700 transition-transform duration-100 hover:bg-green-50 active:scale-95 whitespace-nowrap"
              >
                <span>{t.categoriesPage.allCategoriesShortcut}</span>
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 rtl:rotate-180"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <CategoryPhotoGrid
            categories={categories}
            language={language}
            selectedCategoryId={
              selectedCategoryId !== 'all' ? selectedCategoryId : null
            }
            lowBandwidthMode={lowBandwidthMode}
            onSelectCategory={(categoryId) =>
              onSelectCategory(
                selectedCategoryId === categoryId ? 'all' : categoryId
              )
            }
            testId="home-category-photo-grid"
            testIdPrefix="home-category-card"
          />
        </div>
      )}

      {/* Row 5: Subcategory Chips (visible when active category has subcategories) */}
      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => onSelectSubcategory('all')}
            aria-pressed={selectedSubcategoryId === 'all'}
            className={`min-h-[36px] shrink-0 rounded-full px-3.5 text-xs font-bold transition-transform duration-100 active:scale-95 whitespace-nowrap ${
              selectedSubcategoryId === 'all'
                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.storefront.allSubcategories}
          </button>

          {selectedCategory.subcategories.map((sub) => {
            const active = selectedSubcategoryId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubcategory(sub.id)}
                aria-pressed={active}
                className={`min-h-[36px] shrink-0 rounded-full px-3.5 text-xs font-bold transition-transform duration-100 active:scale-95 whitespace-nowrap ${
                  active
                    ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getNameByLang(sub, language)}
              </button>
            );
          })}
        </div>
      )}

      {/* Quiet item count line */}
      <div className="flex items-center justify-between pt-0.5 text-[11px] font-medium text-gray-500 tabular-nums">
        <span>
          {visibleCount} {t.storefront.itemsCount}
        </span>
      </div>
    </section>
  );
}
