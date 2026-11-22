import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { formatIqd, getNameByLang } from '../../i18n/format';
import type { Language, OrderRecord, OrderStatus } from '../../types/grocery';
import { computeOrderReportMetrics } from '../../utils/adminLogic';
import type { AdminDictionary } from '../i18n/adminTranslations';
import { fetchOrdersInDateRangeAdmin } from '../services/adminFirestoreService';

interface ReportsTabProps {
  t: AdminDictionary;
  language: Language;
  fallbackOrders: OrderRecord[];
}

type RangePreset = 'today' | '7d' | '30d' | 'custom';

function toInputDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getBounds(
  preset: RangePreset,
  customStart: string,
  customEnd: string
): { startMs: number; endMs: number } {
  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  if (preset === 'today') {
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    return { startMs: startOfToday, endMs: endOfToday };
  }

  if (preset === '7d') {
    return {
      startMs: endOfToday - 7 * 24 * 60 * 60 * 1000 + 1,
      endMs: endOfToday,
    };
  }

  if (preset === '30d') {
    return {
      startMs: endOfToday - 30 * 24 * 60 * 60 * 1000 + 1,
      endMs: endOfToday,
    };
  }

  const parsedStart = Date.parse(`${customStart}T00:00:00`);
  const parsedEnd = Date.parse(`${customEnd}T23:59:59.999`);
  return {
    startMs: Number.isNaN(parsedStart) ? endOfToday - 7 * 86400000 : parsedStart,
    endMs: Number.isNaN(parsedEnd) ? endOfToday : parsedEnd,
  };
}

const STATUS_LIST: OrderStatus[] = [
  'New',
  'Called',
  'Confirmed',
  'Bought',
  'Delivered',
  'Cancelled',
  'Fake',
];

export function ReportsTab({ t, language, fallbackOrders }: ReportsTabProps) {
  const [preset, setPreset] = useState<RangePreset>('7d');
  const [customStart, setCustomStart] = useState(() =>
    toInputDate(Date.now() - 6 * 86400000)
  );
  const [customEnd, setCustomEnd] = useState(() => toInputDate(Date.now()));
  const [rangeOrders, setRangeOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryWarning, setQueryWarning] = useState<string | null>(null);

  const bounds = useMemo(
    () => getBounds(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const loadRange = useCallback(async () => {
    setLoading(true);
    setQueryWarning(null);
    try {
      const docs = await fetchOrdersInDateRangeAdmin(bounds.startMs, bounds.endMs);
      setRangeOrders(docs);
    } catch {
      // Fallback to client-side date filter on live queue if index is unavailable
      setRangeOrders(fallbackOrders);
      setQueryWarning('Using live order snapshot for this period.');
    } finally {
      setLoading(false);
    }
  }, [bounds.endMs, bounds.startMs, fallbackOrders]);

  useEffect(() => {
    void loadRange();
  }, [loadRange]);

  const metrics = useMemo(
    () => computeOrderReportMetrics(rangeOrders, bounds.startMs, bounds.endMs),
    [rangeOrders, bounds.startMs, bounds.endMs]
  );

  const maxDailyRevenue = Math.max(
    1,
    ...metrics.dailySeries.map((d) => d.revenue)
  );
  const maxDailyOrders = Math.max(
    1,
    ...metrics.dailySeries.map((d) => d.orderCount)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#141A15]">{t.reports.title}</h2>
          <p className="mt-1 text-sm text-[#5B665D]">{t.reports.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => void loadRange()}
          disabled={loading}
          className="inline-flex min-h-[48px] items-center gap-2 self-start rounded-lg border border-[#D4DAD2] bg-white px-4 text-sm font-medium text-[#141A15] hover:bg-[#F6F7F5]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? t.common.loading : 'Refresh'}</span>
        </button>
      </div>

      {/* Date Range Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E4E7E2] bg-white p-3">
        {(
          [
            ['today', t.reports.today],
            ['7d', t.reports.last7Days],
            ['30d', t.reports.last30Days],
            ['custom', t.reports.customRange],
          ] as Array<[RangePreset, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={`min-h-[48px] rounded-lg px-4 text-sm font-semibold transition-colors ${
              preset === key
                ? 'bg-[#15663C] text-white'
                : 'border border-[#E4E7E2] bg-[#F6F7F5] text-[#3C463E] hover:bg-[#ECEFE9]'
            }`}
          >
            {label}
          </button>
        ))}

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 ps-2">
            <Calendar className="h-4 w-4 text-[#5B665D]" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-3 text-sm tabular-nums text-[#141A15]"
            />
            <span aria-hidden="true" className="inline-block text-xs text-[#5B665D] rtl:rotate-180">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-3 text-sm tabular-nums text-[#141A15]"
            />
          </div>
        )}
      </div>

      {queryWarning && (
        <p className="text-xs text-[#6B726A]">{queryWarning}</p>
      )}

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[#E4E7E2] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5B665D]">
            <span>{t.reports.orderCount}</span>
            <ShoppingBag className="h-4 w-4 text-[#15663C]" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#141A15]">
            {metrics.totalOrders}
          </p>
          <p className="mt-1 text-xs text-[#5B665D] tabular-nums">
            {metrics.confirmedOrderCount} confirmed+
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E7E2] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5B665D]">
            <span>{t.reports.totalRevenue}</span>
            <TrendingUp className="h-4 w-4 text-[#15663C]" />
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-[#141A15]">
            {formatIqd(metrics.revenue, language)}
          </p>
          <p className="mt-1 text-xs text-[#5B665D]">
            Confirmed / Bought / Delivered
          </p>
        </div>

        <div className="rounded-xl border border-[#B9E2CB] bg-[#F3FAF6] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#15663C]">
            <span>{t.reports.savingsDelivered}</span>
            <Sparkles className="h-4 w-4 text-[#15663C]" />
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-[#15663C]">
            {formatIqd(metrics.totalSavingsDelivered, language)}
          </p>
          <p className="mt-1 text-xs text-[#15663C]/80">vs Erbil market price</p>
        </div>

        <div className="rounded-xl border border-[#E4E7E2] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5B665D]">
            <span>{t.reports.aov}</span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-[#141A15]">
            {formatIqd(metrics.aov, language)}
          </p>
          <p className="mt-1 text-xs text-[#5B665D]">per confirmed order</p>
        </div>

        <div className="rounded-xl border border-[#F2C3C1] bg-[#FFF8F8] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#B42318]">
            <span>{t.reports.fakeCancelled}</span>
            <AlertTriangle className="h-4 w-4 text-[#B42318]" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#B42318]">
            {metrics.fakeCount} / {metrics.cancelledCount}
          </p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-[#B42318]">
            Fake rate: {metrics.fakeRatePct}%
          </p>
        </div>
      </div>

      {/* Status Breakdown Bar */}
      <div className="rounded-xl border border-[#E4E7E2] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_LIST.map((st) => (
            <div
              key={st}
              className="flex items-center gap-2 rounded-lg border border-[#E4E7E2] bg-[#F6F7F5] px-3 py-2 text-xs font-medium text-[#2A332C]"
            >
              <span>{st}</span>
              <span className="font-bold tabular-nums text-[#141A15]">
                {metrics.statusBreakdown[st] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Orders & Sales Bar Chart */}
      <section className="rounded-xl border border-[#E4E7E2] bg-white p-5">
        <h3 className="text-base font-semibold text-[#141A15]">
          {t.reports.dailyChartTitle}
        </h3>
        {metrics.dailySeries.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#5B665D]">
            {t.common.empty}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div
              className="flex items-end gap-3 pb-2"
              style={{ minWidth: Math.max(320, metrics.dailySeries.length * 64) }}
            >
              {metrics.dailySeries.map((day) => {
                const revPct = Math.max(
                  6,
                  Math.round((day.revenue / maxDailyRevenue) * 100)
                );
                const ordPct = Math.max(
                  10,
                  Math.round((day.orderCount / maxDailyOrders) * 100)
                );
                return (
                  <div
                    key={day.dateKey}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <span className="text-[11px] font-semibold tabular-nums text-[#15663C]">
                      {day.orderCount}
                    </span>
                    <div className="flex h-40 w-full max-w-[44px] items-end justify-center gap-1">
                      <div
                        title={`${day.dateKey}: ${formatIqd(day.revenue, language)}`}
                        className="w-5 rounded-t bg-[#15663C] transition-all"
                        style={{ height: `${revPct}%` }}
                      />
                      <div
                        title={`${day.dateKey}: ${day.orderCount} orders`}
                        className="w-3 rounded-t bg-[#B9E2CB] transition-all"
                        style={{ height: `${ordPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums text-[#5B665D]">
                      {day.dateKey.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Top 10 Selling Products */}
      <section className="overflow-hidden rounded-xl border border-[#E4E7E2] bg-white">
        <div className="border-b border-[#E4E7E2] px-5 py-4">
          <h3 className="text-base font-semibold text-[#141A15]">
            {t.reports.topProductsTitle}
          </h3>
        </div>
        {metrics.topProducts.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#5B665D]">
            {t.common.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-[#E4E7E2] bg-[#F6F7F5] text-xs font-semibold text-[#5B665D]">
                <tr>
                  <th className="px-4 py-3 text-start">#</th>
                  <th className="px-4 py-3 text-start">Product</th>
                  <th className="px-4 py-3 text-end">{t.reports.qtySold}</th>
                  <th className="px-4 py-3 text-end">{t.reports.revenueCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9]">
                {metrics.topProducts.map((row, idx) => (
                  <tr key={row.productId} className="hover:bg-[#FAFBF9]">
                    <td className="px-4 py-3 font-semibold tabular-nums text-[#5B665D]">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#141A15]">
                      {getNameByLang(row, language)}
                    </td>
                    <td className="px-4 py-3 text-end font-semibold tabular-nums text-[#141A15]">
                      {row.quantitySold}
                    </td>
                    <td className="px-4 py-3 text-end font-semibold tabular-nums text-[#15663C]">
                      {formatIqd(row.revenue, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
