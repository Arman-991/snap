import { useState } from 'react';
import { AlertCircle, CheckCircle2, LocateFixed, MapPin } from 'lucide-react';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  GpsCoordinates,
  Language,
  ProfileFormInput,
  ProfileValidationErrors,
} from '../types/grocery';
import {
  normalizeDigits,
  normalizeIraqiPhone,
  validateProfileForm,
} from '../utils/supermarketLogic';

interface OnboardingScreenProps {
  t: TranslationDictionary;
  language: Language;
  anonymousDisabled: boolean;
  onChangeLanguage: (lang: Language) => void;
  onComplete: (input: ProfileFormInput) => Promise<void>;
}

const LANGUAGES: Language[] = ['ku', 'ar', 'en'];

export function OnboardingScreen({
  t,
  language,
  anonymousDisabled,
  onChangeLanguage,
  onComplete,
}: OnboardingScreenProps) {
  const [fullName, setFullName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [addressText, setAddressText] = useState('');
  const [buildingNotes, setBuildingNotes] = useState('');
  const [gps, setGps] = useState<GpsCoordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'captured' | 'denied' | 'unsupported'>('idle');
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const normalizedPreview = normalizeIraqiPhone(phoneInput);

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('unsupported');
      return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setGpsStatus('captured');
      },
      () => {
        setGpsStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formInput: ProfileFormInput = {
      fullName,
      phoneInput,
      addressText,
      buildingNotes,
      gps,
      language,
    };

    const validation = validateProfileForm(formInput);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setSaveError(false);
    setSaving(true);
    try {
      await onComplete(formInput);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const nameErrorText =
    errors.fullName === 'required'
      ? t.onboarding.errors.nameRequired
      : errors.fullName === 'too_short'
        ? t.onboarding.errors.nameTooShort
        : null;

  const phoneErrorText =
    errors.phoneInput === 'required'
      ? t.onboarding.errors.phoneRequired
      : errors.phoneInput === 'invalid_iraqi'
        ? t.onboarding.errors.phoneInvalid
        : null;

  const addressErrorText =
    errors.addressText === 'required'
      ? t.onboarding.errors.addressRequired
      : errors.addressText === 'too_short'
        ? t.onboarding.errors.addressTooShort
        : null;

  return (
    <div className="min-h-dvh bg-[#F6F7F5] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        {/* Top language switcher */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold tracking-tight text-[#141A15]">
            {t.brandName}
          </span>
          <div
            role="group"
            aria-label="Language"
            className="inline-flex items-center rounded-xl border border-[#E5E7E4] bg-[#EAEEE8] p-1"
          >
            {LANGUAGES.map((code) => {
              const active = language === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChangeLanguage(code)}
                  aria-pressed={active}
                  className={`min-h-[48px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#141A15] shadow-xs'
                      : 'text-[#566058] hover:text-[#141A15]'
                  }`}
                >
                  {t.languageNames[code]}
                </button>
              );
            })}
          </div>
        </div>

        <main className="rounded-2xl border border-[#E5E7E4] bg-white p-5 sm:p-8">
          <p className="text-xs font-medium text-[#566058]">
            {t.onboarding.kicker}
          </p>
          <h1
            className="font-display mt-2 text-2xl font-bold leading-snug text-[#141A15] sm:text-3xl"
            style={{ textWrap: 'balance' }}
          >
            {t.onboarding.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#566058]">
            {t.onboarding.subtitle}
          </p>

          {anonymousDisabled && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#F2D5B8] bg-[#FFF8F1] p-3.5 text-xs leading-relaxed text-[#8C4507]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.onboarding.anonAuthHint}</span>
            </div>
          )}

          {saveError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#F3C4C4] bg-[#FEF2F2] p-3.5 text-sm text-[#991B1B]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.onboarding.errors.saveFailed}</span>
            </div>
          )}

          <form
            onSubmit={(e) => void handleSubmit(e)}
            noValidate
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="onboarding-name"
                className="block text-xs font-semibold text-[#2E3630]"
              >
                {t.onboarding.fullNameLabel}
              </label>
              <input
                id="onboarding-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder={t.onboarding.fullNamePlaceholder}
                aria-invalid={Boolean(nameErrorText)}
                className={`mt-1.5 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-[#141A15] placeholder:text-[#7D877F] focus:outline-none focus:ring-2 ${
                  nameErrorText
                    ? 'border-[#C53030] focus:ring-[#C53030]/20'
                    : 'border-[#D4DAD2] focus:border-[#15663C] focus:ring-[#15663C]/20'
                }`}
              />
              {nameErrorText && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                  {nameErrorText}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="onboarding-phone"
                className="block text-xs font-semibold text-[#2E3630]"
              >
                {t.onboarding.phoneLabel}
              </label>
              <input
                id="onboarding-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(normalizeDigits(e.target.value));
                  if (errors.phoneInput) setErrors((prev) => ({ ...prev, phoneInput: undefined }));
                }}
                placeholder={t.onboarding.phonePlaceholder}
                aria-invalid={Boolean(phoneErrorText)}
                className={`mt-1.5 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-start text-[#141A15] tabular-nums placeholder:text-[#7D877F] focus:outline-none focus:ring-2 ${
                  phoneErrorText
                    ? 'border-[#C53030] focus:ring-[#C53030]/20'
                    : 'border-[#D4DAD2] focus:border-[#15663C] focus:ring-[#15663C]/20'
                }`}
              />
              {phoneErrorText ? (
                <p role="alert" className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                  {phoneErrorText}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-[#616C63]">
                  {normalizedPreview.valid
                    ? `${normalizedPreview.phoneDisplay} · +${normalizedPreview.phoneNormalized}`
                    : t.onboarding.phoneHint}
                </p>
              )}
            </div>

            {/* Large GPS Location Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleRequestGps}
                disabled={gpsStatus === 'locating'}
                className={`min-h-[52px] w-full inline-flex items-center justify-center gap-2.5 rounded-xl border px-4 text-sm font-semibold transition-colors active:scale-[0.98] ${
                  gps
                    ? 'border-[#15663C] bg-[#EFF6F2] text-[#15663C]'
                    : 'border-[#D4DAD2] bg-[#F8F9F7] text-[#141A15] hover:border-[#15663C] hover:bg-[#EFF6F2]'
                }`}
              >
                {gps ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                ) : (
                  <LocateFixed className="h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {gpsStatus === 'locating'
                    ? t.onboarding.gpsLocating
                    : gps
                      ? `${t.onboarding.gpsCaptured} (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})`
                      : t.onboarding.gpsButton}
                </span>
              </button>

              {gpsStatus === 'denied' && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-[#8C4507]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.onboarding.gpsDeniedFallback}</span>
                </p>
              )}
              {gpsStatus === 'unsupported' && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-[#616C63]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.onboarding.gpsUnsupportedFallback}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="onboarding-address"
                className="block text-xs font-semibold text-[#2E3630]"
              >
                {t.onboarding.addressLabel}
              </label>
              <input
                id="onboarding-address"
                type="text"
                value={addressText}
                onChange={(e) => {
                  setAddressText(e.target.value);
                  if (errors.addressText) setErrors((prev) => ({ ...prev, addressText: undefined }));
                }}
                placeholder={t.onboarding.addressPlaceholder}
                aria-invalid={Boolean(addressErrorText)}
                className={`mt-1.5 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-[#141A15] placeholder:text-[#7D877F] focus:outline-none focus:ring-2 ${
                  addressErrorText
                    ? 'border-[#C53030] focus:ring-[#C53030]/20'
                    : 'border-[#D4DAD2] focus:border-[#15663C] focus:ring-[#15663C]/20'
                }`}
              />
              {addressErrorText && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                  {addressErrorText}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="onboarding-notes"
                className="block text-xs font-semibold text-[#2E3630]"
              >
                {t.onboarding.buildingNotesLabel}
              </label>
              <input
                id="onboarding-notes"
                type="text"
                value={buildingNotes}
                onChange={(e) => setBuildingNotes(e.target.value)}
                placeholder={t.onboarding.buildingNotesPlaceholder}
                className="mt-1.5 h-12 w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] placeholder:text-[#7D877F] focus:border-[#15663C] focus:outline-none focus:ring-2 focus:ring-[#15663C]/20"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 min-h-[52px] w-full rounded-xl bg-[#15663C] px-6 text-sm font-semibold text-white transition-transform duration-150 hover:bg-[#105230] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15663C] focus-visible:ring-offset-2"
            >
              {saving ? t.onboarding.saving : t.onboarding.submitCta}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
