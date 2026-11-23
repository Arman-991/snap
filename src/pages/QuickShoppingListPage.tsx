import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Minus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { FloatingCartBar } from '../components/FloatingCartBar';
import { formatIqd, getNameByLang } from '../i18n/format';
import type { TranslationDictionary } from '../i18n/translations';
import type { Language, Product } from '../types/grocery';
import {
  ERBIL_QUICK_STAPLES,
  isQuickListItemFulfilledByCart,
  matchInStockProductsForListItem,
  normalizeSearchText,
  type QuickStaplePreset,
} from '../utils/supermarketLogic';

const QUICK_LIST_STORAGE_KEY = 'bazar_fresh_quick_list_v1';
const FALLBACK_PRODUCT_IMAGE =
  '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';

interface QuickListEntry {
  id: string;
  label: string;
  presetId?: string;
  extraTerms?: string[];
}

function loadSavedQuickList(): QuickListEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUICK_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is QuickListEntry =>
        Boolean(entry) &&
        typeof entry.id === 'string' &&
        typeof entry.label === 'string' &&
        entry.label.trim().length > 0
    );
  } catch {
    return [];
  }
}

function saveQuickList(entries: QuickListEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      QUICK_LIST_STORAGE_KEY,
      JSON.stringify(entries.slice(0, 30))
    );
  } catch {
    // ignore storage errors
  }
}

function getStapleLabel(staple: QuickStaplePreset, lang: Language): string {
  if (lang === 'ku') return staple.labelKu;
  if (lang === 'ar') return staple.labelAr;
  return staple.labelEn;
}

interface QuickListProductMiniCardProps {
  product: Product;
  quantity: number;
  language: Language;
  t: TranslationDictionary;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
}

function QuickListProductMiniCard({
  product,
  quantity,
  language,
  t,
  onIncrement,
  onDecrement,
  onOpenDetail,
}: QuickListProductMiniCardProps) {
  const [imgSrc, setImgSrc] = useState(
    product.imageUrl || FALLBACK_PRODUCT_IMAGE
  );

  useEffect(() => {
    setImgSrc(product.imageUrl || FALLBACK_PRODUCT_IMAGE);
  }, [product.imageUrl]);

  const name = getNameByLang(product, language);

  return (
    <article
      data-testid={`quicklist-product-${product.id}`}
      className={`flex w-[150px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-xl border bg-white p-2 transition-colors sm:w-[168px] ${
        quantity > 0
          ? 'border-[#16A34A] ring-1 ring-[#16A34A]/20'
          : 'border-[#E2E8F0]'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="flex flex-1 flex-col text-start"
      >
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#F8FAFC]">
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            onError={() => {
              if (imgSrc !== FALLBACK_PRODUCT_IMAGE) {
                setImgSrc(FALLBACK_PRODUCT_IMAGE);
              }
            }}
            className="h-full w-full object-cover object-center"
          />
        </div>

        <h4 className="mt-1.5 line-clamp-2 min-h-[2rem] font-display text-xs font-bold leading-snug text-[#0F172A]">
          {name}
        </h4>
        <span className="mt-0.5 text-[11px] font-medium text-[#64748B]">
          {product.size}
        </span>

        <span className="mt-1.5 font-display text-xs font-extrabold text-[#0F172A] tabular-nums sm:text-sm">
          {formatIqd(product.ourPrice, language)}
        </span>
      </button>

      <div className="mt-2">
        {quantity === 0 ? (
          <button
            type="button"
            data-testid={`quicklist-add-${product.id}`}
            onClick={() => onIncrement(product)}
            aria-label={`${t.product.add}: ${name}`}
            className="flex min-h-[40px] w-full items-center justify-center gap-1 rounded-lg bg-[#16A34A] px-2 text-xs font-bold text-white transition-transform hover:bg-[#15803D] active:scale-95"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.product.add}</span>
          </button>
        ) : (
          <div className="flex min-h-[40px] items-center justify-between rounded-lg border border-[#16A34A] bg-[#F0FDF4]">
            <button
              type="button"
              onClick={() => onDecrement(product)}
              aria-label={`${t.product.decreaseQty}: ${name}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#15803D] hover:bg-[#DCFCE7] active:scale-95"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="font-display text-xs font-extrabold text-[#0F172A] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(product)}
              aria-label={`${t.product.increaseQty}: ${name}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#15803D] hover:bg-[#DCFCE7] active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

interface QuickShoppingListPageProps {
  t: TranslationDictionary;
  language: Language;
  allProducts: Product[];
  getQuantity: (productId: string) => number;
  onBack: () => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
  onOpenCart: () => void;
}

export function QuickShoppingListPage({
  t,
  language,
  allProducts,
  getQuantity,
  onBack,
  onIncrement,
  onDecrement,
  onOpenDetail,
  onOpenCart,
}: QuickShoppingListPageProps) {
  const [entries, setEntries] = useState<QuickListEntry[]>(() =>
    loadSavedQuickList()
  );
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    saveQuickList(entries);
  }, [entries]);

  const activePresetIds = useMemo(
    () => new Set(entries.map((e) => e.presetId).filter(Boolean)),
    [entries]
  );

  const handleToggleStaple = (staple: QuickStaplePreset) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.presetId === staple.id);
      if (exists) {
        return prev.filter((e) => e.presetId !== staple.id);
      }
      return [
        {
          id: `staple_${staple.id}`,
          label: getStapleLabel(staple, language),
          presetId: staple.id,
          extraTerms: staple.searchTerms,
        },
        ...prev,
      ];
    });
  };

  const handleAddCustomItem = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = inputValue.trim();
    if (!cleaned) return;

    const normalized = normalizeSearchText(cleaned);
    setEntries((prev) => {
      const duplicate = prev.some(
        (entry) => normalizeSearchText(entry.label) === normalized
      );
      if (duplicate) return prev;
      return [
        {
          id: `custom_${Date.now().toString(36)}`,
          label: cleaned,
        },
        ...prev,
      ];
    });
    setInputValue('');
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleClearList = () => {
    setEntries([]);
  };

  // Resolve display labels for preset chips when user switches UI language
  const resolvedEntries = useMemo(() => {
    return entries.map((entry) => {
      const preset = entry.presetId
        ? ERBIL_QUICK_STAPLES.find((s) => s.id === entry.presetId)
        : undefined;
      const displayLabel = preset ? getStapleLabel(preset, language) : entry.label;
      const matches = matchInStockProductsForListItem(
        displayLabel,
        allProducts,
        preset ? preset.searchTerms : entry.extraTerms
      ).slice(0, 10);

      return {
        ...entry,
        displayLabel,
        matches,
        fulfilled: isQuickListItemFulfilledByCart(matches, getQuantity),
      };
    });
  }, [allProducts, entries, getQuantity, language]);

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-28 sm:px-6 lg:px-8">
      {/* Sticky Header Bar */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-[#E2E8F0] bg-white/96 px-4 py-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              data-testid="quicklist-back"
              onClick={onBack}
              aria-label={t.quickList.backToMarket}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#F1F5F9] active:scale-95"
            >
              <ArrowLeft
                className="h-5 w-5 rtl:rotate-180"
                aria-hidden="true"
              />
            </button>
            <h1 className="truncate font-display text-base font-extrabold text-[#0F172A] sm:text-lg">
              {t.quickList.shortTitle}
            </h1>
          </div>

          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleClearList}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#B42318]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.quickList.clearList}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Section: Daily Erbil Staple Chips + Custom Item Input */}
      <section className="mt-4 space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-4">
        <p className="text-xs leading-relaxed text-[#475569] sm:text-sm">
          {t.quickList.subtitle}
        </p>

        {/* Quick-Tap Staple Chips */}
        <div>
          <h2 className="text-xs font-bold text-[#334155]">
            {t.quickList.staplesHeading}
          </h2>
          <div
            data-testid="quicklist-staples"
            className="mt-2 flex flex-wrap gap-2"
          >
            {ERBIL_QUICK_STAPLES.map((staple) => {
              const selected = activePresetIds.has(staple.id);
              const label = getStapleLabel(staple, language);
              return (
                <button
                  key={staple.id}
                  type="button"
                  data-testid={`staple-chip-${staple.id}`}
                  aria-pressed={selected}
                  onClick={() => handleToggleStaple(staple)}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-all active:scale-95 ${
                    selected
                      ? 'border-[#16A34A] bg-[#F0FDF4] text-[#15803D]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] hover:border-[#CBD5E1] hover:bg-white'
                  }`}
                >
                  {selected ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 shrink-0 text-[#64748B]" aria-hidden="true" />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Item Input Form */}
        <form onSubmit={handleAddCustomItem} className="flex gap-2">
          <input
            type="text"
            data-testid="quicklist-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t.quickList.inputPlaceholder}
            aria-label={t.quickList.inputPlaceholder}
            className="min-h-[48px] min-w-0 flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-[#16A34A] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            data-testid="quicklist-add-btn"
            disabled={!inputValue.trim()}
            className="min-h-[48px] shrink-0 rounded-xl bg-[#16A34A] px-4 text-xs font-bold text-white transition-colors hover:bg-[#15803D] active:scale-[0.98] disabled:opacity-45 sm:px-5 sm:text-sm"
          >
            {t.quickList.addToList}
          </button>
        </form>
      </section>

      {/* Shopping List Entries & Auto-Matched In-Stock Product Rows */}
      <section className="mt-5 space-y-4">
        {resolvedEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16A34A]">
              <ClipboardList className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-base font-bold text-[#0F172A]">
              {t.quickList.emptyTitle}
            </p>
            <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
              {t.quickList.emptyHint}
            </p>
          </div>
        ) : (
          resolvedEntries.map((entry) => (
            <div
              key={entry.id}
              data-testid={`quicklist-item-${entry.id}`}
              className={`rounded-2xl border p-3.5 transition-colors ${
                entry.fulfilled
                  ? 'border-[#86EFAC] bg-[#F0FDF4]/60'
                  : 'border-[#E2E8F0] bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {entry.fulfilled ? (
                    <CheckCircle2
                      data-testid={`quicklist-check-${entry.id}`}
                      className="h-5 w-5 shrink-0 text-[#16A34A]"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-[#CBD5E1]"
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="truncate font-display text-sm font-extrabold text-[#0F172A] sm:text-base">
                    {entry.displayLabel}
                  </h3>
                  {entry.fulfilled && (
                    <span className="shrink-0 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                      {t.quickList.inCartBadge}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveEntry(entry.id)}
                  aria-label={`${t.quickList.removeItem}: ${entry.displayLabel}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {entry.matches.length === 0 ? (
                <p className="mt-2 text-xs text-[#64748B]">
                  {t.quickList.noMatches}
                </p>
              ) : (
                <div className="mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1">
                  {entry.matches.map((product) => (
                    <QuickListProductMiniCard
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
          ))
        )}
      </section>

      {/* Sticky Bottom Green Button: Total Items & Total IQD ("Go to Cart & See Your Savings") */}
      <FloatingCartBar
        t={t}
        language={language}
        ctaLabel={t.quickList.stickyCartCta}
        alwaysShow
        onOpenCart={onOpenCart}
      />
    </main>
  );
}
