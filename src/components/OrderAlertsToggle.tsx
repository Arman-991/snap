import { Bell, BellOff, BellRing, Smartphone } from 'lucide-react';
import type { TranslationDictionary } from '../i18n/translations';
import type { BrowserAlertStatus } from '../hooks/useBrowserOrderAlerts';

interface OrderAlertsToggleProps {
  status: BrowserAlertStatus;
  t: TranslationDictionary;
  onToggle: () => Promise<void>;
}

export function OrderAlertsToggle({
  status,
  t,
  onToggle,
}: OrderAlertsToggleProps) {
  if (status === 'unsupported') return null;

  if (status === 'ios-install-required') {
    return (
      <div
        data-testid="ios-order-alerts-tip"
        className="flex max-w-sm items-start gap-2 rounded-xl border border-[#DCE6DF] bg-[#F7FAF8] px-3.5 py-2.5 text-start text-xs leading-relaxed text-[#3F4841]"
      >
        <Smartphone
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]"
          aria-hidden="true"
        />
        <span>{t.retention.alertsIosInstallHint}</span>
      </div>
    );
  }

  const isEnabled = status === 'enabled';
  const isDenied = status === 'denied';

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        data-testid="enable-order-alerts-toggle"
        disabled={isDenied}
        aria-pressed={isEnabled}
        onClick={() => void onToggle()}
        className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isEnabled
            ? 'border-[#BCE0CA] bg-[#EFF6F2] text-[#115532] hover:bg-[#E1F0E7]'
            : 'border-[#D4DAD2] bg-white text-[#3F4841] hover:bg-[#F5F7F4]'
        }`}
      >
        {isEnabled ? (
          <BellRing
            className="h-4 w-4 shrink-0 text-[var(--brand-primary)]"
            aria-hidden="true"
          />
        ) : isDenied ? (
          <BellOff
            className="h-4 w-4 shrink-0 text-[#7A847C]"
            aria-hidden="true"
          />
        ) : (
          <Bell
            className="h-4 w-4 shrink-0 text-[#566058]"
            aria-hidden="true"
          />
        )}
        <span>
          {isEnabled
            ? t.retention.alertsEnabledLabel
            : t.retention.enableAlertsLabel}
        </span>
      </button>
      {isDenied && (
        <p className="text-[11px] text-[#7A847C]">
          {t.retention.alertsBlockedHint}
        </p>
      )}
    </div>
  );
}
