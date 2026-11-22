import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatIqd, getNameByLang } from '../../i18n/format';
import type { Category, Language, Product } from '../../types/grocery';
import {
  applyBulkPricePercent,
  generateProductsCsv,
  generateProductsCsvTemplate,
  isProductInStock,
  matchesProductSectionFlag,
  parseProductsCsv,
  type BulkEditRowDraft,
  type CsvImportPreview,
} from '../../utils/adminLogic';
import { compressImageFileToDataUrl } from '../../utils/imageCompress';
import { matchesProductSearch } from '../../utils/supermarketLogic';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  bulkCommitProductsAdmin,
  deleteProductAdmin,
  saveProductAdmin,
  type AdminActor,
} from '../services/adminFirestoreService';

interface ProductsTabProps {
  t: AdminDictionary;
  language: Language;
  actor: AdminActor;
  products: Product[];
  categories: Category[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSeedCatalog?: () => Promise<void>;
  seeding?: boolean;
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function createEmptyProduct(categories: Category[]): Product {
  const firstCat = categories[0];
  return {
    id: `p-${Date.now().toString(36)}`,
    categoryId: firstCat?.id ?? 'produce',
    subcategoryId: firstCat?.subcategories[0]?.id ?? 'general',
    nameKu: '',
    nameAr: '',
    nameEn: '',
    size: '1 kg',
    ourPrice: 1000,
    marketPrice: 1500,
    marketPriceNote: '',
    marketPriceUpdatedAt: new Date().toISOString().slice(0, 10),
    imageUrl: '',
    section: 'popular',
    inStock: true,
    showInDeals: false,
    showInPopular: true,
    isNew: false,
    isActive: true,
  };
}

export function ProductsTab({
  t,
  language,
  actor,
  products,
  categories,
  loading,
  onRefresh,
  onSeedCatalog,
  seeding,
}: ProductsTabProps) {
  const [mode, setMode] = useState<'table' | 'bulk'>('table');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');

  // Add/Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [compressingImg, setCompressingImg] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Price Editor state
  const [bulkDrafts, setBulkDrafts] = useState<Record<string, BulkEditRowDraft>>({});
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
  const [percentInput, setPercentInput] = useState('5');
  const [percentTarget, setPercentTarget] = useState<'ourPrice' | 'marketPrice'>('ourPrice');
  const [savingBulk, setSavingBulk] = useState(false);

  // CSV Import Preview Modal
  const csvFileRef = useRef<HTMLInputElement | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvImportPreview | null>(null);
  const [committingCsv, setCommittingCsv] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false;
      if (stockFilter === 'in' && !isProductInStock(p)) return false;
      if (stockFilter === 'out' && isProductInStock(p)) return false;
      if (search.trim() && !matchesProductSearch(p, search)) return false;
      return true;
    });
  }, [categoryFilter, products, search, stockFilter]);

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.id === editingProduct?.categoryId) ?? null,
    [categories, editingProduct?.categoryId]
  );

  const handleImageFileChange = async (file: File | null) => {
    if (!file || !editingProduct) return;
    setCompressingImg(true);
    setFormError(null);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 400, 45_000);
      setEditingProduct({ ...editingProduct, imageUrl: dataUrl });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Image compression failed');
    } finally {
      setCompressingImg(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (
      !editingProduct.nameKu.trim() ||
      !editingProduct.nameAr.trim() ||
      !editingProduct.nameEn.trim() ||
      !editingProduct.size.trim() ||
      editingProduct.ourPrice <= 0
    ) {
      setFormError('Fill Kurdish, Arabic, English names, pack size, and valid price > 0.');
      return;
    }

    setSavingForm(true);
    setFormError(null);
    try {
      await saveProductAdmin(actor, editingProduct, isCreating);
      setEditingProduct(null);
      setStatusNotice(t.common.saved);
      await onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingForm(false);
    }
  };

  const handleToggleVisible = async (product: Product) => {
    await saveProductAdmin(actor, { ...product, isActive: !product.isActive }, false);
    await onRefresh();
  };

  const handleDeleteProduct = async (product: Product) => {
    await deleteProductAdmin(actor, product);
    await onRefresh();
  };

  const handleApplyPercent = () => {
    const pct = Number(percentInput);
    if (!Number.isFinite(pct) || selectedBulkIds.size === 0) return;
    setBulkDrafts((prev) =>
      applyBulkPricePercent(products, selectedBulkIds, percentTarget, pct, prev)
    );
  };

  const handleSaveBulkChanges = async () => {
    const entries = Object.entries(bulkDrafts);
    if (entries.length === 0) return;
    setSavingBulk(true);
    try {
      const payload: Array<{ product: Product; isNew: boolean }> = [];
      for (const [id, draft] of entries) {
        const base = products.find((p) => p.id === id);
        if (!base) continue;
        payload.push({
          product: {
            ...base,
            ourPrice: Math.max(250, Math.round(draft.ourPrice)),
            marketPrice: Math.max(0, Math.round(draft.marketPrice)),
            inStock: draft.inStock,
            marketPriceUpdatedAt: new Date().toISOString().slice(0, 10),
          },
          isNew: false,
        });
      }

      const count = await bulkCommitProductsAdmin(actor, payload, 'BULK_PRICE_UPDATE');
      setBulkDrafts({});
      setSelectedBulkIds(new Set());
      setStatusNotice(`${t.common.saved} (${count})`);
      await onRefresh();
    } finally {
      setSavingBulk(false);
    }
  };

  const handlePickCsvFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const preview = parseProductsCsv(text, categories, products);
    setCsvPreview(preview);
    if (csvFileRef.current) csvFileRef.current.value = '';
  };

  const handleCommitCsv = async () => {
    if (!csvPreview) return;
    const valid = csvPreview.rows
      .filter((r) => r.status !== 'invalid' && r.product !== null)
      .map((r) => ({
        product: r.product!,
        isNew: r.status === 'new',
      }));
    if (valid.length === 0) return;

    setCommittingCsv(true);
    try {
      const count = await bulkCommitProductsAdmin(actor, valid, 'CSV_IMPORT_PRODUCTS');
      setCsvPreview(null);
      setStatusNotice(`${t.common.saved} (${count} CSV rows)`);
      await onRefresh();
    } finally {
      setCommittingCsv(false);
    }
  };

  const dirtyBulkCount = Object.keys(bulkDrafts).length;

  return (
    <div className="space-y-5">
      {/* Header & Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#141A15]">
            {t.products.title}
          </h1>
          <p className="text-sm text-[#566058]">{t.products.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actor.role === 'owner' && products.length === 0 && onSeedCatalog && (
            <button
              type="button"
              disabled={seeding}
              onClick={() => void onSeedCatalog()}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-4 text-xs font-semibold text-[#15663C] hover:bg-[#DFEDE5]"
            >
              <Database className="h-4 w-4" aria-hidden="true" />
              <span>{seeding ? t.common.seedingCatalog : t.common.seedCatalog}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsCreating(true);
              setFormError(null);
              setEditingProduct(createEmptyProduct(categories));
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#15663C] px-4 text-xs font-semibold text-white hover:bg-[#105230]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.products.addProduct}</span>
          </button>
        </div>
      </div>

      {statusNotice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-[#BCE0CA] bg-[#EFF6F2] px-4 py-2.5 text-xs font-semibold text-[#115532]"
        >
          <span>{statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            aria-label={t.common.close}
            className="flex h-10 w-10 items-center justify-center rounded-lg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Mode Switch + CSV Tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7E4] bg-white p-3.5">
        <div className="inline-flex rounded-xl bg-[#F3F5F2] p-1">
          <button
            type="button"
            onClick={() => setMode('table')}
            className={`min-h-[48px] rounded-lg px-4 text-xs font-semibold ${
              mode === 'table'
                ? 'bg-white text-[#141A15] shadow-xs'
                : 'text-[#566058]'
            }`}
          >
            {t.products.tableMode} ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`min-h-[48px] rounded-lg px-4 text-xs font-semibold ${
              mode === 'bulk'
                ? 'bg-white text-[#141A15] shadow-xs'
                : 'text-[#566058]'
            }`}
          >
            {t.products.bulkMode}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadTextFile('bazar-fresh-template.csv', generateProductsCsvTemplate())
            }
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-xs font-semibold text-[#141A15] hover:bg-[#F5F7F4]"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>{t.products.downloadTemplate}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `bazar-fresh-products-${new Date().toISOString().slice(0, 10)}.csv`,
                generateProductsCsv(products)
              )
            }
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-xs font-semibold text-[#141A15] hover:bg-[#F5F7F4]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t.products.exportCsv}</span>
          </button>
          <button
            type="button"
            onClick={() => csvFileRef.current?.click()}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-3.5 text-xs font-semibold text-[#15663C] hover:bg-[#DFEDE5]"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{t.products.importCsv}</span>
          </button>
          <input
            ref={csvFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void handlePickCsvFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B756D]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white ps-10 pe-4 text-sm text-[#141A15]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {getNameByLang(c, language)}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as 'all' | 'in' | 'out')}
          className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15]"
        >
          <option value="all">All Stock States</option>
          <option value="in">{t.common.available}</option>
          <option value="out">{t.common.outOfStock}</option>
        </select>
      </div>

      {/* Bulk Price Adjustment Toolbar */}
      {mode === 'bulk' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C6E4D1] bg-[#EFF6F2] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#115532]">
              {t.products.bulkPercentLabel} ({selectedBulkIds.size})
            </span>
            <select
              value={percentTarget}
              onChange={(e) =>
                setPercentTarget(e.target.value as 'ourPrice' | 'marketPrice')
              }
              className="min-h-[48px] rounded-xl border border-[#BCE0CA] bg-white px-3 text-xs font-semibold text-[#141A15]"
            >
              <option value="ourPrice">{t.products.ourPrice}</option>
              <option value="marketPrice">{t.products.marketPrice}</option>
            </select>
            <input
              type="number"
              value={percentInput}
              onChange={(e) => setPercentInput(e.target.value)}
              className="min-h-[48px] w-24 rounded-xl border border-[#BCE0CA] bg-white px-3 text-xs font-semibold tabular-nums"
              placeholder="+5 or -10"
            />
            <button
              type="button"
              disabled={selectedBulkIds.size === 0}
              onClick={handleApplyPercent}
              className="min-h-[48px] rounded-xl bg-[#141A15] px-4 text-xs font-semibold text-white disabled:opacity-40"
            >
              {t.products.applyPercent}
            </button>
          </div>

          <button
            type="button"
            disabled={dirtyBulkCount === 0 || savingBulk}
            onClick={() => void handleSaveBulkChanges()}
            className="min-h-[48px] rounded-xl bg-[#15663C] px-5 text-xs font-bold text-white hover:bg-[#105230] disabled:opacity-40"
          >
            {savingBulk
              ? t.common.saving
              : `${t.products.saveAllChanges} (${dirtyBulkCount})`}
          </button>
        </div>
      )}

      {/* Table / Bulk Spreadsheet */}
      <div className="overflow-x-auto rounded-xl border border-[#E5E7E4] bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.loading}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.empty}
          </div>
        ) : mode === 'table' ? (
          <table className="w-full min-w-[780px] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[#E5E7E4] bg-[#FAFBF9] text-xs font-semibold text-[#566058]">
                <th className="px-4 py-3 text-start">Product</th>
                <th className="px-4 py-3 text-start">Size</th>
                <th className="px-4 py-3 text-end">{t.products.ourPrice}</th>
                <th className="px-4 py-3 text-end">{t.products.marketPrice}</th>
                <th className="px-4 py-3 text-start">Stock</th>
                <th className="px-4 py-3 text-start">Flags</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEFEA]">
              {filteredProducts.map((p) => {
                const stock = isProductInStock(p);
                const overMarket = p.marketPrice > 0 && p.ourPrice > p.marketPrice;
                return (
                  <tr key={p.id} className="hover:bg-[#FAFBF9]">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl || '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg'}
                          alt={getNameByLang(p, language)}
                          loading="lazy"
                          onError={(e) => {
                            const fallback = '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';
                            if (!e.currentTarget.src.endsWith(fallback)) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                          className="h-10 w-10 shrink-0 rounded-lg bg-[#F3F5F2] object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#141A15]">
                            {getNameByLang(p, language)}
                          </p>
                          <p className="truncate text-xs text-[#6B756D]">
                            {p.nameEn} · <span className="font-mono">{p.id}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#4E5750]">
                      <bdi dir="ltr">{p.size}</bdi>
                    </td>
                    <td
                      className={`px-4 py-2.5 text-end font-semibold tabular-nums ${
                        overMarket ? 'text-[#B42318]' : 'text-[#141A15]'
                      }`}
                    >
                      {formatIqd(p.ourPrice, language)}
                    </td>
                    <td className="px-4 py-2.5 text-end text-xs text-[#616B63] tabular-nums">
                      {formatIqd(p.marketPrice, language)}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold">
                      <span
                        className={stock ? 'text-[#15663C]' : 'text-[#B42318]'}
                      >
                        {stock ? t.common.available : t.common.outOfStock}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#566058]">
                      {[
                        matchesProductSectionFlag(p, 'deals') && 'Deals',
                        matchesProductSectionFlag(p, 'popular') && 'Popular',
                        matchesProductSectionFlag(p, 'new') && 'New',
                        !p.isActive && 'Hidden',
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreating(false);
                            setFormError(null);
                            setEditingProduct({
                              ...p,
                              inStock: isProductInStock(p),
                              showInDeals: matchesProductSectionFlag(p, 'deals'),
                              showInPopular: matchesProductSectionFlag(p, 'popular'),
                              isNew: matchesProductSectionFlag(p, 'new'),
                            });
                          }}
                          aria-label={`${t.common.edit} ${p.nameEn}`}
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#ECEFEA]"
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleVisible(p)}
                          aria-label={p.isActive ? t.common.hidden : t.common.visible}
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#ECEFEA]"
                        >
                          {p.isActive ? (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-[#B42318]" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProduct(p)}
                          aria-label={`${t.common.delete} ${p.nameEn}`}
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-[#7A847C] hover:bg-[#FEE2E2] hover:text-[#B42318]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Bulk Spreadsheet View */
          <table className="w-full min-w-[740px] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[#E5E7E4] bg-[#FAFBF9] text-xs font-semibold text-[#566058]">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all visible products"
                    checked={
                      filteredProducts.length > 0 &&
                      filteredProducts.every((p) => selectedBulkIds.has(p.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBulkIds(new Set(filteredProducts.map((p) => p.id)));
                      } else {
                        setSelectedBulkIds(new Set());
                      }
                    }}
                    className="h-4 w-4 accent-[#15663C]"
                  />
                </th>
                <th className="px-4 py-3 text-start">Product</th>
                <th className="px-4 py-3 text-start">{t.products.ourPrice}</th>
                <th className="px-4 py-3 text-start">{t.products.marketPrice}</th>
                <th className="px-4 py-3 text-start">Savings</th>
                <th className="px-4 py-3 text-start">{t.products.inStock}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEFEA]">
              {filteredProducts.map((p) => {
                const draft = bulkDrafts[p.id] ?? {
                  ourPrice: p.ourPrice,
                  marketPrice: p.marketPrice,
                  inStock: isProductInStock(p),
                };
                const isDirty = Boolean(bulkDrafts[p.id]);
                const diff = draft.marketPrice - draft.ourPrice;
                return (
                  <tr
                    key={p.id}
                    className={isDirty ? 'bg-[#F3FAF5]' : 'hover:bg-[#FAFBF9]'}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedBulkIds.has(p.id)}
                        onChange={(e) => {
                          setSelectedBulkIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(p.id);
                            else next.delete(p.id);
                            return next;
                          });
                        }}
                        className="h-4 w-4 accent-[#15663C]"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-semibold text-[#141A15]">
                        {getNameByLang(p, language)}
                      </p>
                      <p className="text-xs text-[#6B756D]">{p.size}</p>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={250}
                        step={250}
                        value={draft.ourPrice}
                        onChange={(e) =>
                          setBulkDrafts((prev) => ({
                            ...prev,
                            [p.id]: { ...draft, ourPrice: Number(e.target.value) },
                          }))
                        }
                        className="min-h-[48px] w-32 rounded-lg border border-[#D4DAD2] bg-white px-3 text-sm font-semibold tabular-nums"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        step={250}
                        value={draft.marketPrice}
                        onChange={(e) =>
                          setBulkDrafts((prev) => ({
                            ...prev,
                            [p.id]: { ...draft, marketPrice: Number(e.target.value) },
                          }))
                        }
                        className="min-h-[48px] w-32 rounded-lg border border-[#D4DAD2] bg-white px-3 text-sm tabular-nums"
                      />
                    </td>
                    <td
                      className={`px-4 py-2 text-xs font-semibold tabular-nums ${
                        diff < 0 ? 'text-[#B42318]' : 'text-[#15663C]'
                      }`}
                    >
                      {formatIqd(diff, language)}
                    </td>
                    <td className="px-4 py-2">
                      <label className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={draft.inStock}
                          onChange={(e) =>
                            setBulkDrafts((prev) => ({
                              ...prev,
                              [p.id]: { ...draft, inStock: e.target.checked },
                            }))
                          }
                          className="h-4 w-4 accent-[#15663C]"
                        />
                        <span>
                          {draft.inStock ? t.common.available : t.common.outOfStock}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E5E7E4] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#E5E7E4] pb-3">
              <h2 className="font-display text-lg font-bold text-[#141A15]">
                {isCreating ? t.products.addProduct : t.products.editProduct}
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                aria-label={t.common.close}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#F3F5F2]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] px-4 py-3 text-xs font-semibold text-[#9A2E20]">
                {formError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  Name (Kurdish Sorani) *
                </label>
                <input
                  type="text"
                  value={editingProduct.nameKu}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, nameKu: e.target.value })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  Name (Arabic) *
                </label>
                <input
                  type="text"
                  value={editingProduct.nameAr}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, nameAr: e.target.value })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  Name (English) *
                </label>
                <input
                  type="text"
                  value={editingProduct.nameEn}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, nameEn: e.target.value })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  Unit / Size (e.g. 1 kg, 500 ml) *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingProduct.size}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, size: e.target.value })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  Category *
                </label>
                <select
                  value={editingProduct.categoryId}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
                    setEditingProduct({
                      ...editingProduct,
                      categoryId: e.target.value,
                      subcategoryId: cat?.subcategories[0]?.id ?? 'general',
                    });
                  }}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getNameByLang(c, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  Subcategory
                </label>
                <select
                  value={editingProduct.subcategoryId}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      subcategoryId: e.target.value,
                    })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm"
                >
                  <option value="general">General</option>
                  {activeCategoryObj?.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {getNameByLang(sub, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  {t.products.ourPrice} *
                </label>
                <input
                  type="number"
                  min={250}
                  step={250}
                  value={editingProduct.ourPrice}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      ourPrice: Number(e.target.value),
                    })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm font-semibold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  {t.products.marketPrice}
                </label>
                <input
                  type="number"
                  min={0}
                  step={250}
                  value={editingProduct.marketPrice}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      marketPrice: Number(e.target.value),
                    })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm tabular-nums"
                />
              </div>

              {/* Live Savings Preview / Warning */}
              <div className="sm:col-span-2">
                {editingProduct.marketPrice > 0 &&
                editingProduct.ourPrice > editingProduct.marketPrice ? (
                  <div className="flex items-center gap-2 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] px-3.5 py-2.5 text-xs font-semibold text-[#9A2E20]">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.products.priceWarning}</span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#BCE0CA] bg-[#EFF6F2] px-3.5 py-2.5 text-xs font-semibold text-[#115532] tabular-nums">
                    {t.products.savingsPreview}:{' '}
                    {formatIqd(
                      Math.max(0, editingProduct.marketPrice - editingProduct.ourPrice),
                      language
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  {t.products.marketPriceNote}
                </label>
                <input
                  type="text"
                  value={editingProduct.marketPriceNote ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      marketPriceNote: e.target.value,
                    })
                  }
                  placeholder="e.g. Majidi Mall / Erbil Central Market"
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  {t.products.marketPriceUpdated}
                </label>
                <input
                  type="date"
                  value={editingProduct.marketPriceUpdatedAt ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      marketPriceUpdatedAt: e.target.value,
                    })
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3.5 text-sm"
                />
              </div>

              {/* Image URL + Client-Side Canvas Compressor */}
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-semibold text-[#3F4841]">
                  Product Image (URL or local compressed upload &lt;45 KB)
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    dir="ltr"
                    value={editingProduct.imageUrl}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        imageUrl: e.target.value,
                      })
                    }
                    placeholder={t.common.imageUrlPlaceholder}
                    className="min-h-[48px] flex-1 rounded-xl border border-[#D4DAD2] px-3.5 text-xs"
                  />
                  <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-4 text-xs font-semibold text-[#15663C] hover:bg-[#DFEDE5]">
                    <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{compressingImg ? t.common.loading : t.common.uploadImage}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        void handleImageFileChange(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
                {editingProduct.imageUrl && (
                  <img
                    src={editingProduct.imageUrl}
                    alt="Preview"
                    loading="lazy"
                    onError={(e) => {
                      const fallback = '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';
                      if (!e.currentTarget.src.endsWith(fallback)) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="h-24 w-24 rounded-xl border border-[#E5E7E4] object-cover"
                  />
                )}
              </div>

              {/* Stock & Visibility Flags */}
              <div className="space-y-2 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-4 sm:col-span-2">
                <p className="text-xs font-bold text-[#3F4841]">
                  {t.products.flagsTitle}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      ['inStock', t.products.inStock],
                      ['isActive', t.products.isActive],
                      ['showInDeals', t.products.showInDeals],
                      ['showInPopular', t.products.showInPopular],
                      ['isNew', t.products.isNew],
                    ] as const
                  ).map(([field, label]) => (
                    <label
                      key={field}
                      className="flex min-h-[48px] cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#141A15]"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct[field])}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            [field]: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-[#15663C]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-5 text-xs font-semibold text-[#141A15]"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={savingForm || compressingImg}
                onClick={() => void handleSaveProduct()}
                className="min-h-[48px] rounded-xl bg-[#15663C] px-6 text-xs font-bold text-white hover:bg-[#105230] disabled:opacity-50"
              >
                {savingForm ? t.common.saving : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Preview Modal */}
      {csvPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E5E7E4] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#E5E7E4] pb-3">
              <h2 className="font-display text-lg font-bold text-[#141A15]">
                {t.products.csvPreviewTitle}
              </h2>
              <button
                type="button"
                onClick={() => setCsvPreview(null)}
                aria-label={t.common.close}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold tabular-nums">
              <span className="rounded-lg bg-[#DCFCE7] px-3 py-1.5 text-[#166534]">
                {t.products.newRows}: {csvPreview.newCount}
              </span>
              <span className="rounded-lg bg-[#DBEAFE] px-3 py-1.5 text-[#1E40AF]">
                {t.products.updateRows}: {csvPreview.updateCount}
              </span>
              <span className="rounded-lg bg-[#FEE2E2] px-3 py-1.5 text-[#991B1B]">
                {t.products.invalidRows}: {csvPreview.invalidCount}
              </span>
            </div>

            <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-[#E5E7E4]">
              <table className="w-full border-collapse text-start text-xs">
                <thead className="bg-[#FAFBF9] font-semibold text-[#566058]">
                  <tr>
                    <th className="px-3 py-2 text-start">Row</th>
                    <th className="px-3 py-2 text-start">ID</th>
                    <th className="px-3 py-2 text-start">Product</th>
                    <th className="px-3 py-2 text-start">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFEA]">
                  {csvPreview.rows.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={r.status === 'invalid' ? 'bg-[#FEF2F2]' : ''}
                    >
                      <td className="px-3 py-2 tabular-nums">#{r.rowNumber}</td>
                      <td className="px-3 py-2 font-mono">{r.rawId || '—'}</td>
                      <td className="px-3 py-2">{r.rawNameEn || '—'}</td>
                      <td className="px-3 py-2 font-semibold">
                        {r.status === 'invalid'
                          ? r.errors.join('; ')
                          : r.status.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCsvPreview(null)}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] px-4 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={
                  committingCsv ||
                  csvPreview.newCount + csvPreview.updateCount === 0
                }
                onClick={() => void handleCommitCsv()}
                className="min-h-[48px] rounded-xl bg-[#15663C] px-5 text-xs font-bold text-white disabled:opacity-40"
              >
                {committingCsv ? t.common.saving : t.products.commitImport}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
