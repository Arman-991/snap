import { useMemo, useRef, useState } from 'react';
import { Ban, CheckCircle2, Search, X } from 'lucide-react';
import { formatIqd, formatOrderTimestamp } from '../../i18n/format';
import type {
  BlockedPhoneRecord,
  Language,
  OrderRecord,
  UserProfile,
} from '../../types/grocery';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  blockPhoneAdmin,
  unblockPhoneAdmin,
  type AdminActor,
} from '../services/adminFirestoreService';

interface CustomersTabProps {
  t: AdminDictionary;
  language: Language;
  actor: AdminActor;
  users: UserProfile[];
  orders: OrderRecord[];
  blockedPhones: BlockedPhoneRecord[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function CustomersTab({
  t,
  language,
  actor,
  users,
  orders,
  blockedPhones,
  loading,
  onRefresh,
}: CustomersTabProps) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const blockedMap = useMemo(
    () => new Map(blockedPhones.map((b) => [b.phoneNormalized, b])),
    [blockedPhones]
  );

  const statsByPhone = useMemo(() => {
    const map = new Map<
      string,
      { totalOrders: number; totalSpent: number; fakeCancelled: number; list: OrderRecord[] }
    >();
    for (const order of orders) {
      const key = order.phoneNormalized;
      const prev = map.get(key) ?? {
        totalOrders: 0,
        totalSpent: 0,
        fakeCancelled: 0,
        list: [],
      };
      prev.totalOrders += 1;
      if (order.status === 'Fake' || order.status === 'Cancelled') {
        prev.fakeCancelled += 1;
      } else {
        prev.totalSpent += order.grandTotal;
      }
      prev.list.push(order);
      map.set(key, prev);
    }
    return map;
  }, [orders]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.fullName} ${u.phoneDisplay} ${u.phoneNormalized} ${u.addressText}`
        .toLowerCase()
        .includes(q)
    );
  }, [search, users]);

  const selectedBlock = selectedUser
    ? blockedMap.get(selectedUser.phoneNormalized) ?? null
    : null;
  const selectedStats = selectedUser
    ? statsByPhone.get(selectedUser.phoneNormalized) ?? {
        totalOrders: 0,
        totalSpent: 0,
        fakeCancelled: 0,
        list: [],
      }
    : null;

  const handleBlock = async () => {
    if (!selectedUser || !blockReason.trim() || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await blockPhoneAdmin(actor, selectedUser.phoneNormalized, blockReason.trim());
      setBlockReason('');
      await onRefresh();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleUnblock = async () => {
    if (!selectedUser || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await unblockPhoneAdmin(actor, selectedUser.phoneNormalized);
      await onRefresh();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#141A15]">
          {t.customers.title}
        </h1>
        <p className="text-sm text-[#566058]">{t.customers.subtitle}</p>
      </div>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B756D]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.customers.searchPlaceholder}
          className="min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white ps-10 pe-4 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E5E7E4] bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.loading}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.empty}
          </div>
        ) : (
          <table className="w-full min-w-[680px] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[#E5E7E4] bg-[#FAFBF9] text-xs font-semibold text-[#566058]">
                <th className="px-4 py-3 text-start">Customer</th>
                <th className="px-4 py-3 text-start">Address</th>
                <th className="px-4 py-3 text-end">{t.customers.totalOrders}</th>
                <th className="px-4 py-3 text-end">{t.customers.totalSpent}</th>
                <th className="px-4 py-3 text-end">{t.customers.fakeCancelled}</th>
                <th className="px-4 py-3 text-start">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEFEA]">
              {filteredUsers.map((u) => {
                const st = statsByPhone.get(u.phoneNormalized);
                const isBlocked = blockedMap.has(u.phoneNormalized);
                return (
                  <tr
                    key={u.uid}
                    onClick={() => setSelectedUser(u)}
                    className="cursor-pointer hover:bg-[#F7FAF8]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#141A15]">{u.fullName}</p>
                      <p dir="ltr" className="text-xs text-[#616B63] tabular-nums text-start">
                        {u.phoneDisplay}
                      </p>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[#4E5750]">
                      {u.addressText}
                    </td>
                    <td className="px-4 py-3 text-end font-semibold tabular-nums">
                      {st?.totalOrders ?? 0}
                    </td>
                    <td className="px-4 py-3 text-end font-semibold tabular-nums">
                      {formatIqd(st?.totalSpent ?? 0, language)}
                    </td>
                    <td className="px-4 py-3 text-end text-xs font-semibold text-[#9A2E20] tabular-nums">
                      {st?.fakeCancelled ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {isBlocked ? (
                        <span className="rounded-lg bg-[#FEE2E2] px-2.5 py-1 text-[#991B1B]">
                          {t.customers.blockedBadge}
                        </span>
                      ) : (
                        <span className="text-[#15663C]">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Detail Drawer */}
      {selectedUser && selectedStats && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7E4] px-5 py-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#141A15]">
                  {selectedUser.fullName}
                </h2>
                <p dir="ltr" className="text-xs text-[#616B63] tabular-nums text-start">
                  {selectedUser.phoneDisplay} ({selectedUser.phoneNormalized})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label={t.common.close}
                className="flex h-12 w-12 items-center justify-center rounded-xl"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Summary Strip */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-3">
                  <p className="text-[11px] text-[#616B63]">{t.customers.totalOrders}</p>
                  <p className="mt-1 font-display text-lg font-bold tabular-nums">
                    {selectedStats.totalOrders}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-3">
                  <p className="text-[11px] text-[#616B63]">{t.customers.totalSpent}</p>
                  <p className="mt-1 font-display text-sm font-bold text-[#15663C] tabular-nums">
                    {formatIqd(selectedStats.totalSpent, language)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-3">
                  <p className="text-[11px] text-[#616B63]">{t.customers.fakeCancelled}</p>
                  <p className="mt-1 font-display text-lg font-bold text-[#9A2E20] tabular-nums">
                    {selectedStats.fakeCancelled}
                  </p>
                </div>
              </div>

              {/* Block / Unblock Control */}
              {selectedBlock ? (
                <div className="space-y-3 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] p-4">
                  <p className="text-xs font-bold text-[#9A2E20]">
                    {t.customers.blockedBadge}: {selectedBlock.reason}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleUnblock()}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#15663C] px-4 text-xs font-bold text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>{t.customers.unblockNumber}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-4">
                  <label className="block text-xs font-semibold text-[#3F4841]">
                    {t.customers.blockReasonLabel} *
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="e.g. Repeated fake orders"
                    className="min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={busy || !blockReason.trim()}
                    onClick={() => void handleBlock()}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#B42318] px-4 text-xs font-bold text-white disabled:opacity-40"
                  >
                    <Ban className="h-4 w-4" aria-hidden="true" />
                    <span>{t.customers.blockNumber}</span>
                  </button>
                </div>
              )}

              {/* Order History */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#3F4841]">
                  {t.customers.orderHistory} ({selectedStats.list.length})
                </h3>
                {selectedStats.list.length === 0 ? (
                  <p className="text-xs text-[#78827A]">{t.common.empty}</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedStats.list.map((order) => (
                      <li
                        key={order.id}
                        className="flex items-center justify-between rounded-xl border border-[#E5E7E4] p-3 text-xs"
                      >
                        <div>
                          <p className="font-mono font-bold text-[#141A15]">
                            {order.orderNumber} · {order.status}
                          </p>
                          <p className="text-[#616B63]">
                            {formatOrderTimestamp(order.createdAtMs, language)}
                          </p>
                        </div>
                        <span className="font-bold text-[#15663C] tabular-nums">
                          {formatIqd(order.grandTotal, language)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
