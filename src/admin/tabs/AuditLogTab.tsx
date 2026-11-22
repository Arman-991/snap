import { useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { formatOrderTimestamp } from '../../i18n/format';
import type { AuditLogEntry, Language } from '../../types/grocery';
import type { AdminDictionary } from '../i18n/adminTranslations';

interface AuditLogTabProps {
  t: AdminDictionary;
  language: Language;
  logs: AuditLogEntry[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function AuditLogTab({
  t,
  language,
  logs,
  loading,
  onRefresh,
}: AuditLogTabProps) {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const actions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((entry) => {
      if (actionFilter !== 'ALL' && entry.action !== actionFilter) return false;
      if (!q) return true;
      return (
        entry.actorEmail.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.targetId.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q)
      );
    });
  }, [logs, actionFilter, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#141A15]">{t.audit.title}</h2>
          <p className="mt-1 text-sm text-[#5B665D]">{t.audit.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={loading}
          className="inline-flex min-h-[48px] items-center gap-2 self-start rounded-lg border border-[#D4DAD2] bg-white px-4 text-sm font-medium text-[#141A15] hover:bg-[#F6F7F5]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? t.common.loading : 'Refresh'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E4E7E2] bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B726A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white ps-10 pe-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
          />
        </div>

        <select
          aria-label={t.audit.filterAction}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="min-h-[48px] rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
        >
          <option value="ALL">{t.audit.allActions}</option>
          {actions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="overflow-hidden rounded-xl border border-[#E4E7E2] bg-white">
        {loading && logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#5B665D]">
            {t.common.loading}
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#5B665D]">
            {t.common.empty}
          </p>
        ) : (
          <div className="divide-y divide-[#ECEFE9]">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-[#EBF7F0] px-2 py-0.5 font-mono text-xs font-semibold text-[#15663C]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {entry.action}
                    </span>
                    <span className="text-xs font-semibold text-[#141A15]">
                      {entry.actorEmail || entry.actorUid}
                    </span>
                    <span className="rounded border border-[#E4E7E2] bg-[#F6F7F5] px-1.5 py-0.5 text-[11px] font-medium uppercase text-[#5B665D]">
                      {entry.actorRole}
                    </span>
                  </div>
                  <p className="text-sm text-[#2A332C]">{entry.details}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B726A]">
                    <span className="font-mono">
                      {entry.targetCollection || 'collection'}/{entry.targetId}
                    </span>
                    {entry.changes && (
                      <span className="max-w-full truncate font-mono text-[11px] text-[#5B665D]">
                        {entry.changes}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-xs tabular-nums text-[#6B726A]">
                  {formatOrderTimestamp(entry.createdAtMs, language)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
