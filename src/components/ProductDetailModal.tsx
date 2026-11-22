import { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatIqd, getNameByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language, Product } from '../types/grocery';
import { isProductInStock } from '../utils/adminLogic';

interface ProductDetailModalProps {
  product: Product | null;
  quantity: number;
  language: Language;
  t: TranslationDictionary;
  onClose: () => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
}

const FALLBACK_IMAGE = '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';

export function ProductDetailModal({
  product,
  quantity,
  language,
  t,
  onClose,
  onIncrement,
  onDecrement,
}: ProductDetailModalProps) {
  const [imgSrc, setImgSrc] = useState(product?.imageUrl || FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(product?.imageUrl || FALLBACK_IMAGE);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const name = getNameByLang(product, language);
  const unitSavings = Math.max(0, product.marketPrice - product.ourPrice);
  const inStock = isProductInStock(product);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/10] w-full bg-[#F3F5F2]">
          <img
            src={imgSrc}
            alt={name}
            onError={() => {
              if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
            }}
            className="h-full w-full object-cover object-center"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t.product.closeDetails}
            className="absolute end-3 top-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 text-[#141A15] shadow-sm hover:bg-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#566058]">
            <span>
              {t.product.sizeLabel}: {product.size}
            </span>
            <span>{t.storefront.sections[product.section]}</span>
          </div>

          <h2
            id="product-modal-title"
            className="mt-1.5 font-display text-xl font-bold text-[#141A15] rtl:leading-snug sm:text-2xl"
          >
            {name}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-3.5">
            <div>
              <p className="text-xs font-medium text-[#616B63]">
                {t.product.ourPriceLabel}
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-[#15663C] tabular-nums">
                {formatIqd(product.ourPrice, language)}
              </p>
            </div>

            {unitSavings > 0 ? (
              <div>
                <p className="text-xs font-medium text-[#616B63]">
                  {t.product.marketPriceLabel}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[#879189] line-through tabular-nums">
                  {formatIqd(product.marketPrice, language)}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#15663C] tabular-nums">
                  {t.product.youSaveLabel}: {formatIqd(unitSavings, language)}
                </p>
              </div>
            ) : (
              <div className="flex items-center text-xs font-medium text-[#566058]">
                {t.product.codNote}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs font-medium text-[#616B63]">
            {t.product.codNote}
          </p>

          <div className="mt-5">
            {!inStock ? (
              <button
                type="button"
                disabled
                className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-[#E5E7E4] bg-[#F3F5F2] px-5 text-sm font-semibold text-[#6B756D]"
              >
                {t.product.outOfStock}
              </button>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={() => onIncrement(product)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-semibold text-[var(--brand-primary-fg)] transition-opacity hover:opacity-92"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.product.add}</span>
              </button>
            ) : (
              <div className="flex min-h-[48px] items-center justify-between rounded-xl border border-[var(--brand-primary)] bg-[#EFF6F2]">
                <button
                  type="button"
                  onClick={() => onDecrement(product)}
                  aria-label={t.product.decreaseQty}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--brand-primary)] hover:bg-[#DFEDE5]"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="font-display text-base font-bold text-[#141A15] tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrement(product)}
                  aria-label={t.product.increaseQty}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--brand-primary)] hover:bg-[#DFEDE5]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
