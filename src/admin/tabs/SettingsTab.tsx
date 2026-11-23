import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Power,
  Save,
  Send,
  Zap,
} from 'lucide-react';
import type {
  Language,
  OneSignalPushConfig,
  StoreSettings,
  UserProfile,
} from '../../types/grocery';
import { normalizeIraqiPhone } from '../../utils/supermarketLogic';
import { resolveTargetUidFromInput } from '../../utils/oneSignalPushLogic';
import {
  DEFAULT_ONESIGNAL_CONFIG,
  fetchOneSignalConfigAdmin,
  saveOneSignalConfigAdmin,
  sendTestPushAdmin,
} from '../../services/oneSignalPushService';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  saveStoreSettingsAdmin,
  type AdminActor,
} from '../services/adminFirestoreService';

interface SettingsTabProps {
  t: AdminDictionary;
  language: Language;
  actor: AdminActor;
  settings: StoreSettings;
  users: UserProfile[];
  onRefresh: () => Promise<void>;
}

export function SettingsTab({
  t,
  language,
  actor,
  settings,
  users,
  onRefresh,
}: SettingsTabProps) {
  const [draft, setDraft] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Mobile Push (OneSignal) state
  const [pushConfig, setPushConfig] = useState<OneSignalPushConfig>(
    DEFAULT_ONESIGNAL_CONFIG
  );
  const [pushLoading, setPushLoading] = useState(true);
  const [pushSaving, setPushSaving] = useState(false);
  const [pushSavedNotice, setPushSavedNotice] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Test Push Notification state
  const [testTarget, setTestTarget] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    let active = true;
    setPushLoading(true);
    fetchOneSignalConfigAdmin()
      .then((cfg) => {
        if (active) setPushConfig(cfg);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setPushLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  const handleSavePushConfig = async (override?: OneSignalPushConfig) => {
    const target = override ?? pushConfig;
    setPushError(null);
    setPushSavedNotice(false);
    setPushSaving(true);
    try {
      await saveOneSignalConfigAdmin(actor, target);
      setPushSavedNotice(true);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Failed to save OneSignal settings');
    } finally {
      setPushSaving(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestError(null);
    setTestSuccess(null);

    if (!pushConfig.appId.trim() || !pushConfig.restApiKey.trim()) {
      setTestError(t.settings.oneSignalNotConfiguredError);
      return;
    }

    const resolved = resolveTargetUidFromInput(testTarget, users);
    if (!resolved.uid) {
      setTestError(t.settings.oneSignalTestTargetError);
      return;
    }

    setTestSending(true);
    try {
      const targetLang = resolved.matchedUser?.language ?? language;
      const result = await sendTestPushAdmin({
        config: pushConfig,
        externalUserId: resolved.uid,
        language: targetLang,
      });
      if (result.ok) {
        setTestSuccess(t.settings.oneSignalTestSent);
      } else {
        setTestError(result.message || 'OneSignal push failed');
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Test push failed');
    } finally {
      setTestSending(false);
    }
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

      {/* Mobile Push (OneSignal · Median APK) Settings Card */}
      <section
        data-testid="onesignal-settings-card"
        className="space-y-5 rounded-xl border border-[#E4E7E2] bg-white p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                pushConfig.enabled
                  ? 'border-[#B9E2CB] bg-[#EBF7F0] text-[#15663C]'
                  : 'border-[#E4E7E2] bg-[#F8FAF8] text-[#5B665D]'
              }`}
            >
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#141A15]">
                {t.settings.mobilePushTitle}
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#5B665D] sm:text-sm">
                {t.settings.mobilePushSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="onesignal-auto-push-toggle"
            disabled={pushSaving || pushLoading}
            onClick={() => {
              const next = { ...pushConfig, enabled: !pushConfig.enabled };
              setPushConfig(next);
              void handleSavePushConfig(next);
            }}
            role="switch"
            aria-checked={pushConfig.enabled}
            className={`inline-flex min-h-[48px] shrink-0 items-center justify-center gap-3 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              pushConfig.enabled
                ? 'bg-[#15663C] text-white hover:bg-[#115331]'
                : 'border border-[#D4DAD2] bg-[#F8FAF8] text-[#3C463E] hover:bg-[#EEF2EE]'
            }`}
          >
            <span
              className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-all ${
                pushConfig.enabled
                  ? 'justify-end bg-white/25'
                  : 'justify-start bg-[#CBD5E1]'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </span>
            <span>
              {pushConfig.enabled
                ? t.settings.oneSignalAutoPushOn
                : t.settings.oneSignalAutoPushOff}
            </span>
          </button>
        </div>

        {pushError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-[#F2C3C1] bg-[#FDF1F0] p-3 text-sm text-[#B42318]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{pushError}</span>
          </div>
        )}
        {pushSavedNotice && (
          <div className="flex items-center gap-2 rounded-lg border border-[#B9E2CB] bg-[#EBF7F0] p-3 text-sm font-medium text-[#15663C]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t.settings.oneSignalSavedToast}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSavePushConfig();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="onesignal-app-id"
                className="mb-1.5 block text-xs font-semibold text-[#3C463E]"
              >
                {t.settings.oneSignalAppIdLabel}
              </label>
              <input
                id="onesignal-app-id"
                type="text"
                dir="ltr"
                disabled={pushLoading}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={pushConfig.appId}
                onChange={(e) => {
                  setPushConfig({ ...pushConfig, appId: e.target.value });
                  setPushSavedNotice(false);
                }}
                className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 font-mono text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="onesignal-rest-key"
                className="mb-1.5 block text-xs font-semibold text-[#3C463E]"
              >
                {t.settings.oneSignalApiKeyLabel}
              </label>
              <div className="relative">
                <input
                  id="onesignal-rest-key"
                  type={showApiKey ? 'text' : 'password'}
                  dir="ltr"
                  disabled={pushLoading}
                  autoComplete="off"
                  placeholder="os_v2_app_…"
                  value={pushConfig.restApiKey}
                  onChange={(e) => {
                    setPushConfig({ ...pushConfig, restApiKey: e.target.value });
                    setPushSavedNotice(false);
                  }}
                  className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white ps-3.5 pe-12 font-mono text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  aria-label={showApiKey ? t.settings.hideKey : t.settings.showKey}
                  className="absolute end-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#5B665D] hover:bg-[#F3F5F2]"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[#5B665D]">
              {t.settings.oneSignalAutoPushLabel}
            </span>
            <button
              type="submit"
              disabled={pushSaving || pushLoading}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#15663C] px-5 text-sm font-semibold text-white hover:bg-[#115331] disabled:opacity-60"
            >
              {pushSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{pushSaving ? t.common.saving : t.settings.oneSignalSaveBtn}</span>
            </button>
          </div>
        </form>

        {/* Send Test Notification */}
        <div className="space-y-3 border-t border-[#ECEFE9] pt-4">
          <div>
            <h4 className="text-sm font-semibold text-[#141A15]">
              {t.settings.oneSignalTestTitle}
            </h4>
            <p className="mt-0.5 text-xs text-[#5B665D]">
              {t.settings.oneSignalTestHint}
            </p>
          </div>

          {testError && (
            <div className="flex items-start gap-2 rounded-lg border border-[#F2C3C1] bg-[#FDF1F0] p-3 text-xs font-medium text-[#B42318]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{testError}</span>
            </div>
          )}
          {testSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-[#B9E2CB] bg-[#EBF7F0] p-3 text-xs font-semibold text-[#15663C]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{testSuccess}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              dir="ltr"
              list="onesignal-customer-targets"
              value={testTarget}
              onChange={(e) => {
                setTestTarget(e.target.value);
                setTestError(null);
                setTestSuccess(null);
              }}
              placeholder={t.settings.oneSignalTestPlaceholder}
              className="min-h-[48px] flex-1 rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-start font-mono text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
            <datalist id="onesignal-customer-targets">
              {users.slice(0, 50).map((u) => (
                <option
                  key={u.uid}
                  value={u.phoneDisplay || u.uid}
                  label={`${u.fullName} · ${u.uid.slice(0, 10)}`}
                />
              ))}
            </datalist>
            <button
              type="button"
              data-testid="onesignal-send-test-btn"
              disabled={testSending || !testTarget.trim()}
              onClick={() => void handleSendTestPush()}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#15663C] bg-[#EFF6F2] px-5 text-sm font-semibold text-[#15663C] hover:bg-[#DCF0E4] disabled:opacity-50"
            >
              {testSending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {testSending
                  ? t.settings.oneSignalTestSending
                  : t.settings.oneSignalTestBtn}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
