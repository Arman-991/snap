import { useEffect, useState } from 'react';
import { FALLBACK_CATEGORY_PHOTO } from '../data/defaultCategories';
import { getNameByLang } from '../i18n/format';
import type { Category, Language } from '../types/grocery';
import { resolveCategoryPhotoSrc } from '../utils/supermarketLogic';

interface CategoryPhotoCardProps {
  category: Category;
  language: Language;
  isSelected: boolean;
  onSelect: () => void;
  testId: string;
}

function CategoryPhotoCard({
  category,
  language,
  isSelected,
  onSelect,
  testId,
}: CategoryPhotoCardProps) {
  const resolvedSrc = resolveCategoryPhotoSrc(category);
  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  useEffect(() => {
    setImgSrc(resolvedSrc);
  }, [resolvedSrc]);

  const title = getNameByLang(category, language);

  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`group flex h-full w-full flex-col items-center rounded-2xl border bg-white p-2 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:p-2.5 ${
        isSelected
          ? 'border-green-600 bg-green-50/40 ring-2 ring-green-600 shadow-sm'
          : 'border-[#ECEFF2] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#D5DDE3]'
      }`}
    >
      <div className="relative flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden rounded-xl bg-white p-0.5">
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (imgSrc !== FALLBACK_CATEGORY_PHOTO) {
              setImgSrc(FALLBACK_CATEGORY_PHOTO);
            }
          }}
          className="h-full w-full rounded-lg object-contain object-center drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.04]"
        />
      </div>

      <span
        dir="auto"
        className="mt-2 line-clamp-2 min-h-[2.25rem] w-full text-center font-display text-xs font-semibold leading-snug text-gray-800 sm:text-sm"
      >
        {title}
      </span>
    </button>
  );
}

interface CategoryPhotoGridProps {
  categories: Category[];
  language: Language;
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string) => void;
  testId?: string;
  testIdPrefix?: string;
}

export function CategoryPhotoGrid({
  categories,
  language,
  selectedCategoryId = null,
  onSelectCategory,
  testId = 'category-photo-grid',
  testIdPrefix = 'category-tile',
}: CategoryPhotoGridProps) {
  if (categories.length === 0) return null;

  const desktopColsClass =
    categories.length === 16 ? 'lg:grid-cols-8' : 'lg:grid-cols-5';

  return (
    <div
      dir="ltr"
      data-testid={testId}
      className={`grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3.5 ${desktopColsClass}`}
    >
      {categories.map((category) => (
        <CategoryPhotoCard
          key={category.id}
          category={category}
          language={language}
          isSelected={Boolean(
            selectedCategoryId && selectedCategoryId === category.id
          )}
          onSelect={() => onSelectCategory(category.id)}
          testId={`${testIdPrefix}-${category.id}`}
        />
      ))}
    </div>
  );
}
