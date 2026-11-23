import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Power, Save, Zap } from 'lucide-react';
import type { StoreSettings } from '../../types/grocery';
import { normalizeIraqiPhone } from '../../utils/supermarketLogic';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  saveStoreSettingsAdmin,
  type AdminActor,
} from '../services/adminFirestoreService';

interface SettingsTabProps {
  t: AdminDictionary;
  actor: AdminActor;
  settings: StoreSettings;
  onRefresh: () => Promise<void>;
}

export function SettingsTab({ t, actor, settings, onRefresh }: SettingsTabProps) {
  const [draft, setDraft] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = async (override?: StoreSettings) => {
    const target = override ?? draft;
    setErrorText(null);
    setSavedNotice(false);

    const normalizedPhone = normalizeIraqiPhone(target.whatsappPhone);
    if (!normalizedPhone.valid) {
      setErrorText(t.settings.invalidPhoneError);
      return;
    }

    setSaving(true);
    try {
      await saveStoreSettingsAdmin(actor, {
        ...target,
        whatsappPhone: normalizedPhone.phoneNormalized,
        deliveryFee: Math.max(0, Math.round(Number(target.deliveryFee) || 0)),
        minimumOrder: Math.max(0, Math.round(Number(target.minimumOrder) || 0)),
        maxOrdersPerHour: (() => {
          const parsed = Number(target.maxOrdersPerHour);
          return Number.isFinite(parsed)
            ? Math.max(0, Math.min(50, Math.round(parsed)))
            : 3;
        })(),
      });
      await onRefresh();
      setSavedNotice(true);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOpen = async () => {
    const next = { ...draft, isStoreOpen: !draft.isStoreOpen };
    setDraft(next);
    await handleSave(next);
  };

  const handleToggleLowBandwidth = async () => {
    const next = {
      ...draft,
      lowBandwidthCategorySvgOnly: !draft.lowBandwidthCategorySvgOnly,
    };
    setDraft(next);
    await handleSave(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#141A15]">{t.settings.title}</h2>
        <p className="mt-1 text-sm text-[#5B665D]">{t.settings.subtitle}</p>
      </div>

      {/* Prominent Store Open / Closed Toggle */}
      <section className="rounded-xl border border-[#E4E7E2] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                draft.isStoreOpen
                  ? 'border-[#B9E2CB] bg-[#EBF7F0] text-[#15663C]'
                  : 'border-[#F2C3C1] bg-[#FDF1F0] text-[#B42318]'
              }`}
            >
              <Power className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#141A15]">
                {t.settings.storeStatusTitle}
              </h3>
              <p
                className={`mt-0.5 text-sm font-medium ${
                  draft.isStoreOpen ? 'text-[#15663C]' : 'text-[#B42318]'
                }`}
              >
                {draft.isStoreOpen ? t.settings.storeOpen : t.settings.storeClosed}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleToggleOpen()}
            role="switch"
            aria-checked={draft.isStoreOpen}
            className={`inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              draft.isStoreOpen
                ? 'bg-[#15663C] text-white hover:bg-[#115331]'
                : 'bg-[#B42318] text-white hover:bg-[#911C13]'
            }`}
          >
            <span
              className={`inline-flex h-6 w-11 items-center rounded-full bg-white/25 p-0.5 transition-all ${
                draft.isStoreOpen ? 'justify-end' : 'justify-start'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </span>
            <span>
              {draft.isStoreOpen ? t.settings.storeOpen : t.settings.storeClosed}
            </span>
          </button>
        </div>
      </section>

      {/* Low-Bandwidth Mode Toggle (Instant 0ms SVGs Only for Categories) */}
      <section className="rounded-xl border border-[#E4E7E2] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                draft.lowBandwidthCategorySvgOnly
                  ? 'border-[#B9E2CB] bg-[#EBF7F0] text-[#15663C]'
                  : 'border-[#E4E7E2] bg-[#F8FAF8] text-[#5B665D]'
              }`}
            >
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#141A15]">
                {t.settings.lowBandwidthTitle}
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#5B665D] sm:text-sm">
                {t.settings.lowBandwidthDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="low-bandwidth-toggle"
            disabled={saving}
            onClick={() => void handleToggleLowBandwidth()}
            role="switch"
            aria-checked={Boolean(draft.lowBandwidthCategorySvgOnly)}
            className={`inline-flex min-h-[48px] shrink-0 items-center justify-center gap-3 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              draft.lowBandwidthCategorySvgOnly
                ? 'bg-[#15663C] text-white hover:bg-[#115331]'
                : 'border border-[#D4DAD2] bg-[#F8FAF8] text-[#3C463E] hover:bg-[#EEF2EE]'
            }`}
          >
            <span
              className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-all ${
                draft.lowBandwidthCategorySvgOnly
                  ? 'justify-end bg-white/25'
                  : 'justify-start bg-[#CBD5E1]'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </span>
            <span>
              {draft.lowBandwidthCategorySvgOnly
                ? t.settings.lowBandwidthOn
                : t.settings.lowBandwidthOff}
            </span>
          </button>
        </div>
      </section>

      {/* Main Operational Settings Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="space-y-5 rounded-xl border border-[#E4E7E2] bg-white p-5"
      >
        {errorText && (
          <div className="flex items-start gap-2.5 rounded-lg border border-[#F2C3C1] bg-[#FDF1F0] p-3 text-sm text-[#B42318]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}
        {savedNotice && (
          <div className="flex items-center gap-2 rounded-lg border border-[#B9E2CB] bg-[#EBF7F0] p-3 text-sm font-medium text-[#15663C]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t.common.saved}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.settings.storeName}
            </label>
            <input
              type="text"
              required
              value={draft.storeName}
              onChange={(e) => setDraft({ ...draft, storeName: e.target.value })}
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.settings.whatsappPhone}
            </label>
            <input
              type="tel"
              dir="ltr"
              required
              placeholder="9647507442404"
              value={draft.whatsappPhone}
              onChange={(e) =>
                setDraft({ ...draft, whatsappPhone: e.target.value })
              }
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-start font-mono text-sm tabular-nums text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.settings.deliveryFee}
            </label>
            <input
              type="number"
              min={0}
              step={250}
              required
              value={draft.deliveryFee}
              onChange={(e) =>
                setDraft({ ...draft, deliveryFee: Number(e.target.value) })
              }
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm tabular-nums text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.settings.minimumOrder}
            </label>
            <input
              type="number"
              min={0}
              step={250}
              required
              value={draft.minimumOrder}
              onChange={(e) =>
                setDraft({ ...draft, minimumOrder: Number(e.target.value) })
              }
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm tabular-nums text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.settings.maxOrdersPerHour}
            </label>
            <input
              type="number"
              min={0}
              max={50}
              required
              value={draft.maxOrdersPerHour}
              onChange={(e) => {
                const raw = e.target.value;
                setDraft({
                  ...draft,
                  maxOrdersPerHour: raw === '' ? 0 : Number(raw),
                });
              }}
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm tabular-nums text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[#5B665D]">
              {t.settings.maxOrdersPerHourHint}
            </p>
          </div>
        </div>

        <div className="border-t border-[#ECEFE9] pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
                {t.settings.deliveryHoursKu}
              </label>
              <input
                type="text"
                dir="rtl"
                required
                value={draft.deliveryHoursText.ku}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deliveryHoursText: {
                      ...draft.deliveryHoursText,
                      ku: e.target.value,
                    },
                  })
                }
                className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
                {t.settings.deliveryHoursAr}
              </label>
              <input
                type="text"
                dir="rtl"
                required
                value={draft.deliveryHoursText.ar}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deliveryHoursText: {
                      ...draft.deliveryHoursText,
                      ar: e.target.value,
                    },
                  })
                }
                className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
                {t.settings.deliveryHoursEn}
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={draft.deliveryHoursText.en}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deliveryHoursText: {
                      ...draft.deliveryHoursText,
                      en: e.target.value,
                    },
                  })
                }
                className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#15663C] px-6 text-sm font-semibold text-white hover:bg-[#115331] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? t.common.saving : t.common.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
