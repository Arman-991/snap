import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { FALLBACK_CATEGORY_PHOTO } from '../../data/defaultCategories';
import { getNameByLang } from '../../i18n/format';
import type { Category, Language, Subcategory } from '../../types/grocery';
import { compressImageFileToDataUrl } from '../../utils/imageCompress';
import { resolveCategoryPhotoSrc } from '../../utils/supermarketLogic';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  deleteCategoryAdmin,
  reorderCategoriesAdmin,
  saveCategoryAdmin,
  seedMissingDefaultCategoriesAdmin,
  type AdminActor,
} from '../services/adminFirestoreService';

interface CategoriesTabProps {
  t: AdminDictionary;
  language: Language;
  actor: AdminActor;
  categories: Category[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function CategoriesTab({
  t,
  language,
  actor,
  categories,
  loading,
  onRefresh,
}: CategoriesTabProps) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const handleLoadDefaultCategories = async () => {
    if (seedingDefaults) return;
    setSeedingDefaults(true);
    setSeedNotice(null);
    try {
      const addedCount = await seedMissingDefaultCategoriesAdmin(
        actor,
        categories
      );
      if (addedCount > 0) {
        await onRefresh();
        setSeedNotice(
          t.categories.defaultsAddedMsg.replace('{count}', String(addedCount))
        );
      } else {
        setSeedNotice(t.categories.defaultsAlreadyPresentMsg);
      }
    } finally {
      setSeedingDefaults(false);
    }
  };

  const handleMove = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    await reorderCategoriesAdmin(actor, next);
    await onRefresh();
  };

  const handleToggleVisible = async (cat: Category) => {
    await saveCategoryAdmin(actor, { ...cat, isActive: !cat.isActive }, false);
    await onRefresh();
  };

  const handleSave = async () => {
    if (!editing || !editing.nameKu.trim() || !editing.nameAr.trim() || !editing.nameEn.trim()) {
      return;
    }
    setSaving(true);
    try {
      await saveCategoryAdmin(actor, editing, isCreating);
      setEditing(null);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryImageUpload = async (file: File | null) => {
    if (!file || !editing) return;
    const dataUrl = await compressImageFileToDataUrl(file, 400, 45_000);
    setEditing({ ...editing, imageUrl: dataUrl });
  };

  const addSubcategoryRow = () => {
    if (!editing) return;
    const nextSub: Subcategory = {
      id: `sub_${Date.now().toString(36)}`,
      nameKu: '',
      nameAr: '',
      nameEn: '',
    };
    setEditing({ ...editing, subcategories: [...editing.subcategories, nextSub] });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#141A15]">
            {t.categories.title}
          </h1>
          <p className="text-sm text-[#566058]">{t.categories.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="load-default-categories-btn"
            disabled={seedingDefaults || loading}
            onClick={() => void handleLoadDefaultCategories()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#15663C] bg-[#F0FDF4] px-4 text-xs font-bold text-[#15663C] transition-colors hover:bg-[#DCFCE7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {seedingDefaults ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {seedingDefaults
                ? t.categories.loadingDefaults
                : t.categories.loadDefaultsButton}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreating(true);
              setEditing({
                id: `cat-${Date.now().toString(36)}`,
                nameKu: '',
                nameAr: '',
                nameEn: '',
                icon: FALLBACK_CATEGORY_PHOTO,
                imageUrl: '',
                subcategories: [],
                sortOrder: categories.length + 1,
                isActive: true,
              });
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#15663C] px-4 text-xs font-semibold text-white hover:bg-[#105230]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.categories.addCategory}</span>
          </button>
        </div>
      </div>

      {seedNotice && (
        <div
          role="status"
          data-testid="seed-defaults-notice"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-xs font-semibold text-[#14532D] sm:text-sm"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden="true" />
            <span>{seedNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setSeedNotice(null)}
            aria-label={t.common.close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#15803D] hover:bg-[#DCFCE7]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="divide-y divide-[#ECEFEA] rounded-xl border border-[#E5E7E4] bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.loading}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.empty}
          </div>
        ) : (
          categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E7E4] bg-white p-1">
                  <img
                    src={resolveCategoryPhotoSrc(cat)}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith(FALLBACK_CATEGORY_PHOTO)) {
                        e.currentTarget.src = FALLBACK_CATEGORY_PHOTO;
                      }
                    }}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-[#141A15]">
                    {getNameByLang(cat, language)}{' '}
                    {!cat.isActive && (
                      <span className="text-xs font-semibold text-[#B42318]">
                        ({t.common.hidden})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#616B63]">
                    {cat.nameKu} · {cat.nameAr} · {cat.nameEn} ({cat.subcategories.length}{' '}
                    {t.categories.subcategories})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => void handleMove(idx, -1)}
                  aria-label={t.common.moveUp}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#ECEFEA] disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={idx === categories.length - 1}
                  onClick={() => void handleMove(idx, 1)}
                  aria-label={t.common.moveDown}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#ECEFEA] disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleVisible(cat)}
                  aria-label={cat.isActive ? t.common.hidden : t.common.visible}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#ECEFEA]"
                >
                  {cat.isActive ? (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-[#B42318]" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditing({ ...cat, subcategories: [...cat.subcategories] });
                  }}
                  aria-label={t.common.edit}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#ECEFEA]"
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteCategoryAdmin(actor, cat);
                    await onRefresh();
                  }}
                  aria-label={t.common.delete}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#7A847C] hover:bg-[#FEE2E2] hover:text-[#B42318]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Category Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E5E7E4] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#E5E7E4] pb-3">
              <h2 className="font-display text-lg font-bold text-[#141A15]">
                {isCreating ? t.categories.addCategory : t.categories.editCategory}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label={t.common.close}
                className="flex h-12 w-12 items-center justify-center rounded-xl"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3F4841]">
                    Kurdish *
                  </label>
                  <input
                    type="text"
                    value={editing.nameKu}
                    onChange={(e) => setEditing({ ...editing, nameKu: e.target.value })}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3F4841]">
                    Arabic *
                  </label>
                  <input
                    type="text"
                    value={editing.nameAr}
                    onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3F4841]">
                    English *
                  </label>
                  <input
                    type="text"
                    value={editing.nameEn}
                    onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3 text-sm"
                  />
                </div>
              </div>

              {/* Category Tile Image (400x400 auto-compressed, Spark-plan friendly) */}
              <div className="space-y-2 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-3.5">
                <label className="block text-xs font-semibold text-[#3F4841]">
                  {t.categories.imageLabel}
                </label>
                <p className="text-[11px] leading-relaxed text-[#616B63]">
                  {t.categories.imageHint}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4DAD2] bg-white p-1">
                    <img
                      src={resolveCategoryPhotoSrc(editing)}
                      alt=""
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith(FALLBACK_CATEGORY_PHOTO)) {
                          e.currentTarget.src = FALLBACK_CATEGORY_PHOTO;
                        }
                      }}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-3.5 text-xs font-semibold text-[#15663C] hover:bg-[#DFEDE5]">
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        <span>{t.common.uploadImage}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            void handleCategoryImageUpload(e.target.files?.[0] ?? null)
                          }
                        />
                      </label>

                      {editing.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, imageUrl: '' })}
                          className="min-h-[44px] rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] px-3 text-xs font-semibold text-[#9A2E20]"
                        >
                          {t.categories.removeImage}
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={editing.imageUrl || ''}
                      placeholder={t.common.imageUrlPlaceholder}
                      onChange={(e) =>
                        setEditing({ ...editing, imageUrl: e.target.value })
                      }
                      className="min-h-[44px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Fallback Emoji / Icon */}
              <div>
                <label className="block text-xs font-semibold text-[#3F4841]">
                  {t.categories.iconLabel}
                </label>
                <input
                  type="text"
                  value={editing.icon}
                  onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                  placeholder="🍅 / 🥛 / 🛒"
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] px-3 text-sm"
                />
              </div>

              {/* Subcategories */}
              <div className="space-y-2 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#3F4841]">
                    {t.categories.subcategories}
                  </p>
                  <button
                    type="button"
                    onClick={addSubcategoryRow}
                    className="min-h-[48px] rounded-xl border border-[#15663C] bg-white px-3 text-xs font-semibold text-[#15663C]"
                  >
                    + {t.categories.addSubcategory}
                  </button>
                </div>

                {editing.subcategories.map((sub, sIdx) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-[#E5E7E4] bg-white p-2.5 sm:grid-cols-4"
                  >
                    <input
                      type="text"
                      placeholder="Kurdish"
                      value={sub.nameKu}
                      onChange={(e) => {
                        const list = [...editing.subcategories];
                        list[sIdx] = { ...sub, nameKu: e.target.value };
                        setEditing({ ...editing, subcategories: list });
                      }}
                      className="min-h-[48px] rounded-lg border border-[#D4DAD2] px-2.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Arabic"
                      value={sub.nameAr}
                      onChange={(e) => {
                        const list = [...editing.subcategories];
                        list[sIdx] = { ...sub, nameAr: e.target.value };
                        setEditing({ ...editing, subcategories: list });
                      }}
                      className="min-h-[48px] rounded-lg border border-[#D4DAD2] px-2.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="English"
                      value={sub.nameEn}
                      onChange={(e) => {
                        const list = [...editing.subcategories];
                        list[sIdx] = { ...sub, nameEn: e.target.value };
                        setEditing({ ...editing, subcategories: list });
                      }}
                      className="min-h-[48px] rounded-lg border border-[#D4DAD2] px-2.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditing({
                          ...editing,
                          subcategories: editing.subcategories.filter((_, i) => i !== sIdx),
                        });
                      }}
                      className="min-h-[48px] rounded-lg bg-[#FDF2F0] text-xs font-semibold text-[#9A2E20]"
                    >
                      {t.common.delete}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] px-4 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="min-h-[48px] rounded-xl bg-[#15663C] px-5 text-xs font-bold text-white"
              >
                {saving ? t.common.saving : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
