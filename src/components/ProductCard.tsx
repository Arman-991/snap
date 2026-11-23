import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatIqd, getNameByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language, Product } from '../types/grocery';
import {
  isProductInStock,
  matchesProductSectionFlag,
} from '../utils/adminLogic';

interface ProductCardProps {
  product: Product;
  quantity: number;
  language: Language;
  t: TranslationDictionary;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
}

const FALLBACK_IMAGE =
  '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';

export function ProductCard({
  product,
  quantity,
  language,
  t,
  onIncrement,
  onDecrement,
  onOpenDetail,
}: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(product.imageUrl || FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(product.imageUrl || FALLBACK_IMAGE);
  }, [product.imageUrl]);

  const name = getNameByLang(product, language);
  const hasDiscount = product.marketPrice > product.ourPrice;
  const inStock = isProductInStock(product);
  const isDeal = matchesProductSectionFlag(product, 'deals');

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className={`flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xs transition-colors hover:border-gray-300 ${
        !inStock ? 'opacity-80' : ''
      }`}
    >
      {/* Cohesive interactive top area */}
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="group flex flex-1 flex-col text-start focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-green-600"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={() => {
              if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
            }}
            className={`h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03] ${
              !inStock ? 'grayscale-[45%]' : ''
            }`}
          />
          {!inStock ? (
            <span className="absolute start-2 top-2 rounded-md bg-red-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {t.product.outOfStock}
            </span>
          ) : (
            isDeal && (
              <span className="absolute start-2 top-2 rounded-md bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {t.storefront.sections.deals}
              </span>
            )
          )}
        </div>

        <div className="flex flex-1 flex-col px-2.5 pt-2.5 pb-1.5">
          <span className="text-[11px] font-medium text-gray-500">
            {product.size}
          </span>

          <h3 className="mt-0.5 line-clamp-2 font-display text-[13px] font-bold leading-snug text-[#141A15]">
            {name}
          </h3>

          <div className="mt-auto pt-2">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="font-display text-sm font-extrabold text-[#141A15] tabular-nums">
                {formatIqd(product.ourPrice, language)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] font-medium text-gray-400 line-through tabular-nums">
                  {formatIqd(product.marketPrice, language)}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Bottom 44px Add / Quantity Stepper */}
      <div className="p-2.5 pt-1.5">
        {!inStock ? (
          <button
            type="button"
            disabled
            className="flex min-h-[42px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-2 text-xs font-semibold text-gray-500"
          >
            {t.product.outOfStock}
          </button>
        ) : quantity === 0 ? (
          <button
            type="button"
            data-testid={`product-add-${product.id}`}
            onClick={() => onIncrement(product)}
            className="flex min-h-[42px] w-full items-center justify-center gap-1 rounded-xl bg-green-600 px-3 text-xs font-bold text-white transition-transform duration-100 hover:bg-green-700 active:scale-95"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.product.add}</span>
          </button>
        ) : (
          <div className="flex min-h-[42px] items-center justify-between rounded-xl border border-green-600 bg-green-50">
            <button
              type="button"
              onClick={() => onDecrement(product)}
              aria-label={`${t.product.decreaseQty}: ${name}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-green-700 transition-transform duration-100 hover:bg-green-100 active:scale-95"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="font-display text-sm font-extrabold text-[#141A15] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(product)}
              aria-label={`${t.product.increaseQty}: ${name}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-green-700 transition-transform duration-100 hover:bg-green-100 active:scale-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
