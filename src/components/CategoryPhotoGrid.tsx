import { useEffect, useRef, useState } from 'react';
import { getNameByLang } from '../i18n/format';
import type { Category, Language } from '../types/grocery';
import { resolveCategoryPhotoSrc } from '../utils/supermarketLogic';
import { CategorySvgArt } from './CategorySvgArt';

interface CategoryPhotoCardProps {
  category: Category;
  language: Language;
  isSelected: boolean;
  lowBandwidthMode: boolean;
  onSelect: () => void;
  testId: string;
}

function CategoryPhotoCard({
  category,
  language,
  isSelected,
  lowBandwidthMode,
  onSelect,
  testId,
}: CategoryPhotoCardProps) {
  const photoSrc = resolveCategoryPhotoSrc(category);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    const el = imgRef.current;
    if (!lowBandwidthMode && el && el.complete && el.naturalWidth > 0) {
      setImgLoaded(true);
    } else {
      setImgLoaded(false);
    }
  }, [photoSrc, lowBandwidthMode]);

  const title = getNameByLang(category, language);

  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={isSelected}
      onClick={onSelect}
      className="group flex w-full flex-col items-center text-center focus-visible:outline-none"
    >
      {/* TOP: Big Full-Bleed Square Photo Box (0ms SVG Base + Smooth Fade-In Photo) */}
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 shadow-sm transition-all duration-200 group-hover:shadow-md group-active:scale-[0.97] group-focus-visible:ring-2 group-focus-visible:ring-green-600 group-focus-visible:ring-offset-2 ${
          isSelected ? 'ring-[3px] ring-green-600 ring-offset-2 shadow-md' : ''
        }`}
      >
        {/* Base Layer (0ms instant inline SVG — never blank on slow 3G/offline) */}
        <CategorySvgArt
          category={category}
          className="absolute inset-0 h-full w-full"
        />

        {/* Photo Layer (fades in smoothly over SVG; skipped completely in Low-Bandwidth Mode) */}
        {!lowBandwidthMode && !imgFailed && (
          <img
            ref={imgRef}
            src={photoSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-300 group-hover:scale-[1.04] ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* BOTTOM: Crisp Localized Category Label Cleanly Outside & Under the Photo */}
      <span
        dir="auto"
        className={`mt-2 line-clamp-2 w-full text-center font-display text-sm font-bold leading-tight sm:text-base ${
          isSelected ? 'text-green-700' : 'text-gray-800'
        }`}
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
  lowBandwidthMode?: boolean;
  onSelectCategory: (categoryId: string) => void;
  testId?: string;
  testIdPrefix?: string;
}

export function CategoryPhotoGrid({
  categories,
  language,
  selectedCategoryId = null,
  lowBandwidthMode = false,
  onSelectCategory,
  testId = 'category-photo-grid',
  testIdPrefix = 'category-tile',
}: CategoryPhotoGridProps) {
  if (categories.length === 0) return null;

  return (
    <div
      dir="ltr"
      data-testid={testId}
      className="grid grid-cols-3 gap-3"
    >
      {categories.map((category) => (
        <CategoryPhotoCard
          key={category.id}
          category={category}
          language={language}
          isSelected={Boolean(
            selectedCategoryId && selectedCategoryId === category.id
          )}
          lowBandwidthMode={lowBandwidthMode}
          onSelect={() => onSelectCategory(category.id)}
          testId={`${testIdPrefix}-${category.id}`}
        />
      ))}
    </div>
  );
}
