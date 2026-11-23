import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { LifetimeSavingsCard } from '../components/LifetimeSavingsCard';
import { OrderAlertsToggle } from '../components/OrderAlertsToggle';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { BrowserAlertStatus } from '../hooks/useBrowserOrderAlerts';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  ContactLinkItem,
  GpsCoordinates,
  Language,
  ProfileFormInput,
  ProfileValidationErrors,
  UserProfile,
} from '../types/grocery';
import { normalizeDigits, validateProfileForm } from '../utils/supermarketLogic';

interface ProfilePageProps {
  t: TranslationDictionary;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  profile: UserProfile | null;
  uid: string | null;
  anonymousDisabled: boolean;
  contactLinks: ContactLinkItem[];
  lifetimeSavings: number;
  deliveredOrderCount: number;
  browserAlertStatus: BrowserAlertStatus;
  onToggleBrowserAlerts: () => Promise<void>;
  onSaveProfile: (input: ProfileFormInput) => Promise<void>;
  onLogoutReset: () => Promise<void>;
}

const LANGUAGES: Language[] = ['ku', 'ar', 'en'];

function getContactLabel(link: ContactLinkItem, lang: Language): string {
  if (lang === 'ku') return link.labelKu || link.labelEn;
  if (lang === 'ar') return link.labelAr || link.labelEn;
  return link.labelEn || link.labelKu;
}

export function ProfilePage({
  t,
  language,
  onChangeLanguage,
  profile,
  uid,
  anonymousDisabled,
  contactLinks,
  lifetimeSavings,
  deliveredOrderCount,
  browserAlertStatus,
  onToggleBrowserAlerts,
  onSaveProfile,
  onLogoutReset,
}: ProfilePageProps) {
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [phoneInput, setPhoneInput] = useState(profile?.phoneDisplay ?? '');
  const [addressText, setAddressText] = useState(profile?.addressText ?? '');
  const [buildingNotes, setBuildingNotes] = useState(
    profile?.buildingNotes ?? ''
  );
  const [gps, setGps] = useState<GpsCoordinates | null>(profile?.gps ?? null);
  const [gpsStatus, setGpsStatus] = useState<
    'idle' | 'locating' | 'captured' | 'denied' | 'unsupported'
  >(profile?.gps ? 'captured' : 'idle');
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhoneInput(profile.phoneDisplay);
    setAddressText(profile.addressText);
    setBuildingNotes(profile.buildingNotes);
    setGps(profile.gps);
    setGpsStatus(profile.gps ? 'captured' : 'idle');
  }, [profile]);

  const handleLocateGps = () => {
    if (!('geolocation' in navigator)) {
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
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavedNotice(false);
    const input: ProfileFormInput = {
      fullName,
      phoneInput,
      addressText,
      buildingNotes,
      gps,
      language,
    };
    const validation = validateProfileForm(input);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      await onSaveProfile(input);
      setSavedNotice(true);
    } finally {
      setSaving(false);
    }
  };

  const visibleContacts = [...contactLinks]
    .filter((link) => link.visible && link.url.trim().length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main className="w-full space-y-4 px-3 pt-4">
      <div className="flex flex-col gap-2.5">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-[#141A15]">
            {t.profile.title}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{t.profile.subtitle}</p>
        </div>
        <OrderAlertsToggle
          status={browserAlertStatus}
          t={t}
          onToggle={onToggleBrowserAlerts}
        />
      </div>

      <LifetimeSavingsCard
        lifetimeSavings={lifetimeSavings}
        deliveredOrderCount={deliveredOrderCount}
        t={t}
      />

      {/* Language Selection Card */}
      <section className="rounded-2xl border border-[#E5E7E4] bg-white p-5">
        <h2 className="font-display text-sm font-bold text-[#141A15]">
          {t.profile.languageSection}
        </h2>
        <div
          role="group"
          aria-label={t.profile.languageSection}
          className="mt-3 grid grid-cols-3 gap-2"
        >
          {LANGUAGES.map((code) => {
            const active = language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLanguage(code)}
                aria-pressed={active}
                className={`min-h-[48px] rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)]'
                    : 'border border-[#E5E7E4] bg-[#FAFBF9] text-[#4E5750] hover:bg-[#ECEFEA]'
                }`}
              >
                {t.languageNames[code]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Customer Profile Edit Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-2xl border border-[#E5E7E4] bg-white p-5 sm:p-6"
      >
        {anonymousDisabled && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#F2DEC0] bg-[#FEF9EE] p-3.5 text-xs leading-relaxed text-[#8C5B12]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.onboarding.anonAuthHint}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="profile-fullname"
            className="block text-xs font-semibold text-[#3F4841]"
          >
            {t.onboarding.fullNameLabel} *
          </label>
          <input
            id="profile-fullname"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setErrors((prev) => ({ ...prev, fullName: undefined }));
              setSavedNotice(false);
            }}
            placeholder={t.onboarding.fullNamePlaceholder}
            className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[var(--brand-primary)] focus:outline-none"
          />
          {errors.fullName && (
            <p className="mt-1 text-xs font-medium text-[#B42318]">
              {errors.fullName === 'required'
                ? t.onboarding.errors.nameRequired
                : t.onboarding.errors.nameTooShort}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="block text-xs font-semibold text-[#3F4841]"
          >
            {t.onboarding.phoneLabel} *
          </label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(normalizeDigits(e.target.value));
              setErrors((prev) => ({ ...prev, phoneInput: undefined }));
              setSavedNotice(false);
            }}
            placeholder={t.onboarding.phonePlaceholder}
            className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-start text-sm text-[#141A15] focus:border-[var(--brand-primary)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[#6B756D]">{t.onboarding.phoneHint}</p>
          {errors.phoneInput && (
            <p className="mt-1 text-xs font-medium text-[#B42318]">
              {errors.phoneInput === 'required'
                ? t.onboarding.errors.phoneRequired
                : t.onboarding.errors.phoneInvalid}
            </p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={handleLocateGps}
            disabled={gpsStatus === 'locating'}
            className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
              gps
                ? 'border-[var(--brand-primary)] bg-[#EFF6F2] text-[var(--brand-primary)]'
                : 'border-[var(--brand-primary)] bg-white text-[var(--brand-primary)] hover:bg-[#EFF6F2]'
            }`}
          >
            {gpsStatus === 'locating' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : gps ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <MapPin className="h-4 w-4" aria-hidden="true" />
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
            <p className="mt-2 rounded-lg bg-[#FDF5E6] px-3 py-2 text-xs text-[#8A5A0F]">
              {t.onboarding.gpsDeniedFallback}
            </p>
          )}
          {gpsStatus === 'unsupported' && (
            <p className="mt-2 rounded-lg bg-[#F4F6F3] px-3 py-2 text-xs text-[#566058]">
              {t.onboarding.gpsUnsupportedFallback}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="profile-address"
            className="block text-xs font-semibold text-[#3F4841]"
          >
            {t.onboarding.addressLabel} *
          </label>
          <input
            id="profile-address"
            type="text"
            value={addressText}
            onChange={(e) => {
              setAddressText(e.target.value);
              setErrors((prev) => ({ ...prev, addressText: undefined }));
              setSavedNotice(false);
            }}
            placeholder={t.onboarding.addressPlaceholder}
            className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[var(--brand-primary)] focus:outline-none"
          />
          {errors.addressText && (
            <p className="mt-1 text-xs font-medium text-[#B42318]">
              {errors.addressText === 'required'
                ? t.onboarding.errors.addressRequired
                : t.onboarding.errors.addressTooShort}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="profile-notes"
            className="block text-xs font-semibold text-[#3F4841]"
          >
            {t.onboarding.buildingNotesLabel}
          </label>
          <input
            id="profile-notes"
            type="text"
            value={buildingNotes}
            onChange={(e) => {
              setBuildingNotes(e.target.value);
              setSavedNotice(false);
            }}
            placeholder={t.onboarding.buildingNotesPlaceholder}
            className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[var(--brand-primary)] focus:outline-none"
          />
        </div>

        {savedNotice && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-[#BCE0CA] bg-[#EFF6F2] px-3.5 py-2.5 text-xs font-semibold text-[#115532]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.profile.savedToast}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-semibold text-[var(--brand-primary-fg)] transition-all hover:opacity-92 active:scale-[0.98] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
            <span>{saving ? t.onboarding.saving : t.profile.saveChanges}</span>
          </button>

          <button
            type="button"
            onClick={() => void onLogoutReset()}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] px-4 text-sm font-semibold text-[#9A2E20] hover:bg-[#FCE6E2]"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.profile.logoutReset}</span>
          </button>
        </div>

        <p className="text-xs text-[#78827A]">{t.profile.logoutConfirmHint}</p>
      </form>

      {/* Contact & Social Buttons (CMS managed by Store Owner) */}
      {visibleContacts.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-[#E5E7E4] bg-white p-5">
          <h2 className="font-display text-sm font-bold text-[#141A15]">
            {t.profile.contactHelpTitle}
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {visibleContacts.map((link) => {
              const isExternal = !link.url.startsWith('tel:');
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="flex min-h-[48px] items-center justify-between gap-2 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] px-4 text-sm font-semibold text-[#141A15] transition-colors hover:border-[var(--brand-primary)] hover:bg-[#EFF6F2]"
                >
                  <span className="flex items-center gap-2.5">
                    {link.type === 'whatsapp' ? (
                      <MessageCircle
                        className="h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                        aria-hidden="true"
                      />
                    ) : link.type === 'phone' ? (
                      <Phone
                        className="h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                        aria-hidden="true"
                      />
                    ) : (
                      <Globe
                        className="h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                        aria-hidden="true"
                      />
                    )}
                    <span>{getContactLabel(link, language)}</span>
                  </span>
                  {isExternal && (
                    <ExternalLink
                      className="h-3.5 w-3.5 shrink-0 text-[#6B756D]"
                      aria-hidden="true"
                    />
                  )}
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* PWA Install Card */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E7E4] bg-white p-5">
        <div>
          <h2 className="font-display text-sm font-bold text-[#141A15]">
            {t.profile.pwaSectionTitle}
          </h2>
          {uid && (
            <p className="mt-0.5 text-xs text-[#78827A]">
              {t.profile.anonStatusNote}:{' '}
              <span className="font-mono">{uid.slice(0, 10)}…</span>
            </p>
          )}
        </div>
        <PWAInstallButton t={t} />
      </section>
    </main>
  );
}
