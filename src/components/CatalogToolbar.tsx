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
  onChangeLanguage: (lang: Language) => void;
  categories: Category[];
  homeSections?: HomeSectionConfig[];
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

const LANGUAGES: Language[] = ['ku', 'ar', 'en'];
const DEFAULT_SECTIONS: ProductSection[] = [
  'deals',
  'popular',
  'new',
  'recommended',
];

export function CatalogToolbar({
  t,
  language,
  onChangeLanguage,
  categories,
  homeSections,
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
      className="space-y-3 border-b border-[#E5E7E4] pb-5"
    >
      {/* Row 1: Search Input + Language Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B756D]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.storefront.searchPlaceholder}
            aria-label={t.storefront.searchPlaceholder}
            className="min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white ps-10 pe-12 text-sm text-[#141A15] placeholder:text-[#78827A] focus:border-[#15663C] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t.storefront.clearSearch}
              className="absolute end-0 top-0 flex h-12 w-12 items-center justify-center rounded-xl text-[#566058] hover:text-[#141A15]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label={t.profile.languageSection}
          className="inline-flex shrink-0 items-center rounded-xl border border-[#E5E7E4] bg-white p-1"
        >
          {LANGUAGES.map((code) => {
            const active = language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLanguage(code)}
                aria-pressed={active}
                className={`min-h-[48px] flex-1 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap sm:flex-none sm:text-sm ${
                  active
                    ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)]'
                    : 'text-[#4E5750] hover:bg-[#F3F5F2] hover:text-[#141A15]'
                }`}
              >
                {t.languageNames[code]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 1b: Compact Quick Shopping List Entry under Search Bar */}
      {onOpenQuickList && (
        <button
          type="button"
          data-testid="home-quicklist-btn"
          onClick={onOpenQuickList}
          className="flex min-h-[46px] w-full items-center justify-between gap-2.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-2 text-start transition-colors hover:border-[#86EFAC] hover:bg-[#DCFCE7]/70 active:scale-[0.99]"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <ClipboardCheck
              className="h-4 w-4 shrink-0 text-[#16A34A]"
              aria-hidden="true"
            />
            <span className="line-clamp-2 font-display text-xs font-bold leading-snug text-[#14532D] sm:text-sm">
              {t.quickList.bannerText}
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[#15803D] rtl:rotate-180"
            aria-hidden="true"
          />
        </button>
      )}

      {/* Row 2: Section Filter Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {orderedSections.map((sec) => {
            const active = selectedSection === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => onSelectSection(sec)}
                aria-pressed={active}
                className={`min-h-[48px] shrink-0 rounded-xl px-4 text-xs font-semibold transition-colors whitespace-nowrap sm:text-sm ${
                  active
                    ? 'bg-[#141A15] text-white'
                    : 'border border-[#E5E7E4] bg-white text-[#4E5750] hover:border-[#C5CEC3] hover:text-[#141A15]'
                }`}
              >
                {t.storefront.sections[sec]}
              </button>
            );
          })}
        </div>

        <span className="hidden shrink-0 text-xs font-medium text-[#616B63] tabular-nums md:inline">
          {visibleCount} {t.storefront.itemsCount}
        </span>
      </div>

      {/* Row 3: Shop by Categories Visual Studio Photo Grid */}
      {categories.length > 0 && (
        <div
          data-testid="home-shop-by-categories"
          className="space-y-3 pt-1"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-extrabold text-[#141A15] sm:text-lg">
                {t.categoriesPage.shopByCategoriesTitle}
              </h2>

              {selectedCategoryId !== 'all' && (
                <button
                  type="button"
                  data-testid="home-show-all-items-btn"
                  onClick={() => onSelectCategory('all')}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#EFF6F2] px-2.5 text-xs font-bold text-[#15663C] ring-1 ring-inset ring-[#15663C]/30 transition-colors hover:bg-[#DCFCE7] active:scale-95"
                >
                  <span>{t.categoriesPage.showAllItems}</span>
                  <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </button>
              )}
            </div>

            {onOpenCategoriesGrid && (
              <button
                type="button"
                data-testid="home-all-categories-shortcut"
                onClick={onOpenCategoriesGrid}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl border border-green-600 bg-white px-3.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-50 active:scale-95 whitespace-nowrap sm:text-sm"
              >
                <span>{t.categoriesPage.allCategoriesShortcut}</span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 rtl:rotate-180"
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

      {/* Row 4: Subcategory Chips (visible when a category with subcategories is active) */}
      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <button
            type="button"
            onClick={() => onSelectSubcategory('all')}
            aria-pressed={selectedSubcategoryId === 'all'}
            className={`min-h-[48px] shrink-0 rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedSubcategoryId === 'all'
                ? 'bg-[#EFF6F2] text-[#15663C] ring-1 ring-inset ring-[#15663C]'
                : 'bg-[#F4F6F3] text-[#4E5750] hover:bg-[#E8ECE7]'
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
                className={`min-h-[48px] shrink-0 rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#EFF6F2] text-[#15663C] ring-1 ring-inset ring-[#15663C]'
                    : 'bg-[#F4F6F3] text-[#4E5750] hover:bg-[#E8ECE7]'
                }`}
              >
                {getNameByLang(sub, language)}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
