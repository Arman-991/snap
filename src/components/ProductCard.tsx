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

const FALLBACK_IMAGE = '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';

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
      className={`flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E7E4] bg-white transition-colors hover:border-[#C5D1C8] ${
        !inStock ? 'opacity-80' : ''
      }`}
    >
      {/* Cohesive interactive top area (>= 48px touch target) */}
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="group flex flex-1 flex-col text-start focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand-primary)]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F5F2]">
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            onError={() => {
              if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
            }}
            className={`h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03] ${
              !inStock ? 'grayscale-[45%]' : ''
            }`}
          />
          {!inStock ? (
            <span className="absolute start-2.5 top-2.5 rounded-md bg-[#B42318] px-2 py-0.5 text-[11px] font-semibold text-white">
              {t.product.outOfStock}
            </span>
          ) : (
            isDeal && (
              <span className="absolute start-2.5 top-2.5 rounded-md bg-[var(--brand-primary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-primary-fg)]">
                {t.storefront.sections.deals}
              </span>
            )
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5 pb-2">
          <span className="text-xs font-medium text-[#616B63]">
            {product.size}
          </span>

          <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug text-[#141A15] sm:text-base">
            {name}
          </h3>

          <div className="mt-auto pt-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-display text-base font-bold text-[#141A15] tabular-nums">
                {formatIqd(product.ourPrice, language)}
              </span>
              {hasDiscount && (
                <span className="text-xs font-medium text-[#879189] line-through tabular-nums">
                  {formatIqd(product.marketPrice, language)}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Bottom 48px Add / Quantity Stepper / Out of Stock */}
      <div className="p-3.5 pt-2">
        {!inStock ? (
          <button
            type="button"
            disabled
            className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-[#E5E7E4] bg-[#F3F5F2] px-4 text-sm font-semibold text-[#6B756D]"
          >
            {t.product.outOfStock}
          </button>
        ) : quantity === 0 ? (
          <button
            type="button"
            onClick={() => onIncrement(product)}
            className="flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--brand-primary-fg)] transition-opacity hover:opacity-92 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.product.add}</span>
          </button>
        ) : (
          <div className="flex min-h-[48px] items-center justify-between rounded-xl border border-[var(--brand-primary)] bg-[#EFF6F2]">
            <button
              type="button"
              onClick={() => onDecrement(product)}
              aria-label={`${t.product.decreaseQty}: ${name}`}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--brand-primary)] transition-all hover:bg-[#DFEDE5] active:scale-95"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="font-display text-sm font-bold text-[#141A15] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(product)}
              aria-label={`${t.product.increaseQty}: ${name}`}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--brand-primary)] transition-all hover:bg-[#DFEDE5] active:scale-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
