import { Sparkles } from 'lucide-react';
import type { TranslationDictionary } from '../i18n/translations';
import { formatLifetimeSavingsSummary } from '../utils/supermarketLogic';

interface LifetimeSavingsCardProps {
  lifetimeSavings: number;
  deliveredOrderCount: number;
  t: TranslationDictionary;
}

export function LifetimeSavingsCard({
  lifetimeSavings,
  deliveredOrderCount,
  t,
}: LifetimeSavingsCardProps) {
  if (lifetimeSavings <= 0) return null;

  const summaryLine = formatLifetimeSavingsSummary(
    t.retention.lifetimeSavingsLine,
    lifetimeSavings,
    deliveredOrderCount
  );

  return (
    <section
      data-testid="lifetime-savings-card"
      className="flex items-start gap-3.5 rounded-2xl border border-[#BCE0CA] bg-[#EFF6F2] p-4 sm:p-5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-fg)]">
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 text-start">
        <h2 className="font-display text-sm font-bold text-[#115532] sm:text-base">
          {t.retention.lifetimeSavingsTitle}
        </h2>
        <p className="mt-0.5 text-sm font-semibold leading-relaxed text-[#143D27] tabular-nums">
          {summaryLine}
        </p>
      </div>
    </section>
  );
}
