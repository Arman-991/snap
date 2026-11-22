import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { getNameByLang } from '../../i18n/format';
import { TRANSLATIONS } from '../../i18n/translations';
import type {
  Banner,
  Category,
  CmsTranslationsDoc,
  ContactLinkItem,
  ContactLinkType,
  HomeSectionConfig,
  Language,
  StoreSettings,
} from '../../types/grocery';
import { getAccessibleContrastText } from '../../utils/adminLogic';
import { compressImageFileToDataUrl } from '../../utils/imageCompress';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  deleteBannerAdmin,
  saveBannerAdmin,
  saveCmsTranslationsAdmin,
  saveStoreSettingsAdmin,
  type AdminActor,
} from '../services/adminFirestoreService';

interface HomeEditorTabProps {
  t: AdminDictionary;
  language: Language;
  actor: AdminActor;
  banners: Banner[];
  categories: Category[];
  settings: StoreSettings;
  cms: CmsTranslationsDoc;
  onRefresh: () => Promise<void>;
}

const DEFAULT_SECTIONS: HomeSectionConfig[] = [
  { id: 'deals', visible: true, sortOrder: 1 },
  { id: 'popular', visible: true, sortOrder: 2 },
  { id: 'new', visible: true, sortOrder: 3 },
  { id: 'recommended', visible: true, sortOrder: 4 },
];

const CMS_FIELDS: Array<{
  key: keyof CmsTranslationsDoc;
  label: string;
  multiline?: boolean;
}> = [
  { key: 'tagline', label: 'Store Tagline' },
  { key: 'savingsPrefix', label: 'Cart Savings Box Prefix' },
  { key: 'savingsSuffix', label: 'Cart Savings Box Suffix' },
  { key: 'confirmationNotice', label: 'Checkout Confirmation Message' },
  { key: 'storeClosedTitle', label: 'Store Closed Banner Title' },
  { key: 'storeClosedBody', label: 'Store Closed Banner Body' },
  { key: 'footerNotice', label: 'Footer Copyright / Notice' },
  {
    key: 'deliveredThankYouTitle',
    label: 'Delivered Thank-You Popup Title (placeholders: {name}, {orderNumber})',
  },
  {
    key: 'deliveredThankYouBody',
    label:
      'Delivered Thank-You Marketing Message (placeholders: {name}, {orderNumber}, {orderSavings}, {lifetimeSavings})',
    multiline: true,
  },
];

export function HomeEditorTab({
  t,
  language,
  actor,
  banners,
  categories,
  settings,
  cms,
  onRefresh,
}: HomeEditorTabProps) {
  const [sections, setSections] = useState<HomeSectionConfig[]>(
    settings.homeSections && settings.homeSections.length > 0
      ? [...settings.homeSections].sort((a, b) => a.sortOrder - b.sortOrder)
      : DEFAULT_SECTIONS
  );
  const [contactLinks, setContactLinks] = useState<ContactLinkItem[]>(
    settings.contactLinks ? [...settings.contactLinks] : []
  );
  const [primaryColor, setPrimaryColor] = useState(
    settings.primaryColor || settings.themeColor || '#15663C'
  );
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [cmsDraft, setCmsDraft] = useState<CmsTranslationsDoc>(cms);

  // Banner inline form
  const [bannerDraft, setBannerDraft] = useState<Banner | null>(null);
  const [isNewBanner, setIsNewBanner] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const contrastFg = getAccessibleContrastText(primaryColor);

  const handleSaveSettingsCms = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      await saveStoreSettingsAdmin(actor, {
        ...settings,
        primaryColor,
        themeColor: primaryColor,
        logoUrl,
        homeSections: sections.map((s, idx) => ({ ...s, sortOrder: idx + 1 })),
        contactLinks: contactLinks.map((c, idx) => ({ ...c, sortOrder: idx + 1 })),
      });
      await saveCmsTranslationsAdmin(actor, cmsDraft);
      setSavedMsg(t.common.saved);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleMoveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setSections(next);
  };

  const handleSaveBanner = async () => {
    if (!bannerDraft || !bannerDraft.titleEn.trim() || !bannerDraft.titleKu.trim()) return;
    setSaving(true);
    try {
      await saveBannerAdmin(actor, bannerDraft, isNewBanner);
      setBannerDraft(null);
      setSavedMsg(t.common.saved);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#141A15]">
            {t.home.title}
          </h1>
          <p className="text-sm text-[#566058]">{t.home.subtitle}</p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveSettingsCms()}
          className="min-h-[48px] rounded-xl bg-[#15663C] px-6 text-xs font-bold text-white hover:bg-[#105230] disabled:opacity-50"
        >
          {saving ? t.common.saving : t.common.save}
        </button>
      </div>

      {savedMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[#BCE0CA] bg-[#EFF6F2] px-4 py-3 text-xs font-semibold text-[#115532]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* 1. Banners Manager */}
      <section className="space-y-4 rounded-xl border border-[#E5E7E4] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#141A15]">
            {t.home.bannersTitle}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsNewBanner(true);
              setBannerDraft({
                id: `banner-${Date.now().toString(36)}`,
                titleKu: '',
                titleAr: '',
                titleEn: '',
                imageUrl: '',
                linkCategoryId: categories[0]?.id ?? 'produce',
                sortOrder: banners.length + 1,
                isActive: true,
              });
            }}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-4 text-xs font-semibold text-[#15663C]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.home.addBanner}</span>
          </button>
        </div>

        <div className="divide-y divide-[#ECEFEA]">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={b.imageUrl || '/src/assets/images/hero_fresh_market_1795087971030.jpg'}
                  alt={b.titleEn}
                  loading="lazy"
                  onError={(e) => {
                    const fallback = '/src/assets/images/hero_fresh_market_1795087971030.jpg';
                    if (!e.currentTarget.src.endsWith(fallback)) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="h-12 w-20 shrink-0 rounded-lg bg-[#F3F5F2] object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-[#141A15]">
                    {language === 'ku' ? b.titleKu : language === 'ar' ? b.titleAr : b.titleEn}
                  </p>
                  <p className="text-xs text-[#616B63]">
                    Link: {b.linkCategoryId || 'all'} · {b.isActive ? t.common.visible : t.common.hidden}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewBanner(false);
                    setBannerDraft({ ...b });
                  }}
                  className="min-h-[48px] rounded-xl border border-[#D4DAD2] px-3.5 text-xs font-semibold"
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteBannerAdmin(actor, b);
                    await onRefresh();
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#9A2E20] hover:bg-[#FEE2E2]"
                  aria-label={t.common.delete}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {bannerDraft && (
          <div className="space-y-3 rounded-xl border border-[#C6E4D1] bg-[#FAFBF9] p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Title Kurdish *"
                value={bannerDraft.titleKu}
                onChange={(e) => setBannerDraft({ ...bannerDraft, titleKu: e.target.value })}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3 text-xs"
              />
              <input
                type="text"
                placeholder="Title Arabic *"
                value={bannerDraft.titleAr}
                onChange={(e) => setBannerDraft({ ...bannerDraft, titleAr: e.target.value })}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3 text-xs"
              />
              <input
                type="text"
                placeholder="Title English *"
                value={bannerDraft.titleEn}
                onChange={(e) => setBannerDraft({ ...bannerDraft, titleEn: e.target.value })}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                dir="ltr"
                placeholder="Banner image URL"
                value={bannerDraft.imageUrl}
                onChange={(e) => setBannerDraft({ ...bannerDraft, imageUrl: e.target.value })}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3 text-xs"
              />
              <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#15663C] bg-white px-3 text-xs font-semibold text-[#15663C]">
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>{t.common.uploadImage}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const dataUrl = await compressImageFileToDataUrl(f, 400, 45_000);
                    setBannerDraft({ ...bannerDraft, imageUrl: dataUrl });
                  }}
                />
              </label>
              <select
                value={bannerDraft.linkCategoryId}
                onChange={(e) =>
                  setBannerDraft({ ...bannerDraft, linkCategoryId: e.target.value })
                }
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3 text-xs"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getNameByLang(c, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-h-[48px] cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={bannerDraft.isActive}
                  onChange={(e) =>
                    setBannerDraft({ ...bannerDraft, isActive: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#15663C]"
                />
                <span>{t.common.visible}</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBannerDraft(null)}
                  className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-4 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveBanner()}
                  className="min-h-[48px] rounded-xl bg-[#15663C] px-5 text-xs font-bold text-white"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Home Sections Manager & Branding */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-[#E5E7E4] bg-white p-5">
          <h2 className="font-display text-base font-bold text-[#141A15]">
            {t.home.sectionsTitle}
          </h2>
          <div className="divide-y divide-[#ECEFEA]">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <label className="flex min-h-[48px] cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#141A15]">
                  <input
                    type="checkbox"
                    checked={sec.visible}
                    onChange={(e) => {
                      const next = [...sections];
                      next[idx] = { ...sec, visible: e.target.checked };
                      setSections(next);
                    }}
                    className="h-4 w-4 accent-[#15663C]"
                  />
                  <span className="capitalize">{sec.id}</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveSection(idx, -1)}
                    aria-label={t.common.moveUp}
                    className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-[#ECEFEA] disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1}
                    onClick={() => handleMoveSection(idx, 1)}
                    aria-label={t.common.moveDown}
                    className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-[#ECEFEA] disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Branding */}
        <section className="space-y-4 rounded-xl border border-[#E5E7E4] bg-white p-5">
          <h2 className="font-display text-base font-bold text-[#141A15]">
            {t.home.brandingTitle}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#3F4841]">
              {t.home.primaryColorLabel}
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-12 w-16 cursor-pointer rounded-xl border border-[#D4DAD2]"
              />
              <input
                type="text"
                dir="ltr"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="min-h-[48px] w-32 rounded-xl border border-[#D4DAD2] px-3 font-mono text-xs"
              />
              <span
                className="inline-flex min-h-[48px] items-center rounded-xl px-4 text-xs font-bold"
                style={{ backgroundColor: primaryColor, color: contrastFg }}
              >
                {t.home.contrastPreview}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3F4841]">
              {t.home.logoLabel}
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Store Logo"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="h-12 w-12 rounded-xl border border-[#E5E7E4] object-cover"
                />
              )}
              <label className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-4 text-xs font-semibold text-[#15663C]">
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>{t.common.uploadImage}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const dataUrl = await compressImageFileToDataUrl(f, 200, 35_000);
                    setLogoUrl(dataUrl);
                  }}
                />
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="min-h-[48px] rounded-xl border border-[#D4DAD2] px-3 text-xs font-semibold text-[#9A2E20]"
                >
                  {t.common.delete}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 3. Contact & Social Links Manager */}
      <section className="space-y-4 rounded-xl border border-[#E5E7E4] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#141A15]">
            {t.home.contactLinksTitle}
          </h2>
          <button
            type="button"
            onClick={() =>
              setContactLinks([
                ...contactLinks,
                {
                  id: `link_${Date.now().toString(36)}`,
                  type: 'whatsapp',
                  labelKu: 'واتساپ',
                  labelAr: 'واتساب',
                  labelEn: 'WhatsApp',
                  url: `https://wa.me/${settings.whatsappPhone}`,
                  visible: true,
                  sortOrder: contactLinks.length + 1,
                },
              ])
            }
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#15663C] bg-[#EFF6F2] px-4 text-xs font-semibold text-[#15663C]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.home.addContactLink}</span>
          </button>
        </div>

        <div className="space-y-3">
          {contactLinks.map((link, idx) => (
            <div
              key={link.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-3 md:grid-cols-6"
            >
              <select
                value={link.type}
                onChange={(e) => {
                  const next = [...contactLinks];
                  next[idx] = { ...link, type: e.target.value as ContactLinkType };
                  setContactLinks(next);
                }}
                className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-2.5 text-xs font-semibold"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone Call</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
              <input
                type="text"
                placeholder="Label KU"
                value={link.labelKu}
                onChange={(e) => {
                  const next = [...contactLinks];
                  next[idx] = { ...link, labelKu: e.target.value };
                  setContactLinks(next);
                }}
                className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-2.5 text-xs"
              />
              <input
                type="text"
                placeholder="Label AR"
                value={link.labelAr}
                onChange={(e) => {
                  const next = [...contactLinks];
                  next[idx] = { ...link, labelAr: e.target.value };
                  setContactLinks(next);
                }}
                className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-2.5 text-xs"
              />
              <input
                type="text"
                placeholder="Label EN"
                value={link.labelEn}
                onChange={(e) => {
                  const next = [...contactLinks];
                  next[idx] = { ...link, labelEn: e.target.value };
                  setContactLinks(next);
                }}
                className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-2.5 text-xs"
              />
              <input
                type="text"
                dir="ltr"
                placeholder="https://... or tel:+964..."
                value={link.url}
                onChange={(e) => {
                  const next = [...contactLinks];
                  next[idx] = { ...link, url: e.target.value };
                  setContactLinks(next);
                }}
                className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-2.5 text-xs"
              />
              <div className="flex items-center justify-end gap-1">
                <label className="flex min-h-[48px] cursor-pointer items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={link.visible}
                    onChange={(e) => {
                      const next = [...contactLinks];
                      next[idx] = { ...link, visible: e.target.checked };
                      setContactLinks(next);
                    }}
                    className="h-4 w-4 accent-[#15663C]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setContactLinks(contactLinks.filter((_, i) => i !== idx))
                  }
                  aria-label={t.common.delete}
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-[#9A2E20] hover:bg-[#FEE2E2]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Trilingual Storefront Text Editor (cms/translations) */}
      <section className="space-y-4 rounded-xl border border-[#E5E7E4] bg-white p-5">
        <h2 className="font-display text-base font-bold text-[#141A15]">
          {t.home.cmsTextTitle}
        </h2>
        <div className="space-y-4">
          {CMS_FIELDS.map(({ key, label, multiline }) => {
            const current = cmsDraft[key] ?? {};
            return (
              <div key={key} className="space-y-1.5">
                <p className="text-xs font-bold text-[#3F4841]">{label}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(['ku', 'ar', 'en'] as const).map((lng) => {
                    const defaultPreview =
                      key === 'deliveredThankYouTitle'
                        ? TRANSLATIONS[lng].retention.thankYouTitle
                        : key === 'deliveredThankYouBody'
                          ? TRANSLATIONS[lng].retention.thankYouBody
                          : '';
                    const placeholderText = defaultPreview
                      ? `${lng.toUpperCase()} default: ${defaultPreview}`
                      : `${lng.toUpperCase()} (leave blank for default)`;
                    return multiline ? (
                      <textarea
                        key={lng}
                        rows={4}
                        placeholder={placeholderText}
                        value={current[lng] ?? ''}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            [key]: { ...current, [lng]: e.target.value },
                          })
                        }
                        className="rounded-xl border border-[#D4DAD2] px-3 py-2.5 text-xs leading-relaxed"
                      />
                    ) : (
                      <input
                        key={lng}
                        type="text"
                        placeholder={placeholderText}
                        value={current[lng] ?? ''}
                        onChange={(e) =>
                          setCmsDraft({
                            ...cmsDraft,
                            [key]: { ...current, [lng]: e.target.value },
                          })
                        }
                        className="min-h-[48px] rounded-xl border border-[#D4DAD2] px-3 text-xs"
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
