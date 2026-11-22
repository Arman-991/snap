import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { formatIqd, formatOrderTimestamp, getNameByLang } from '../../i18n/format';
import { TRANSLATIONS } from '../../i18n/translations';
import type {
  CmsTranslationsDoc,
  Language,
  OrderAdminNote,
  OrderRecord,
  OrderStatus,
} from '../../types/grocery';
import {
  buildCustomerConfirmationWhatsAppUrl,
  buildDeliveredThankYouWhatsAppUrl,
  computeCustomerLifetimeSavingsFromOrders,
} from '../../utils/adminLogic';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  addOrderAdminNote,
  blockPhoneAdmin,
  subscribeToOrderAdminNotes,
  updateOrderStatusAdmin,
  type AdminActor,
} from '../services/adminFirestoreService';

interface OrdersTabProps {
  t: AdminDictionary;
  language: Language;
  actor: AdminActor;
  orders: OrderRecord[];
  loading: boolean;
  cms?: CmsTranslationsDoc;
}

const ALL_STATUSES: OrderStatus[] = [
  'New',
  'Called',
  'Confirmed',
  'Bought',
  'Delivered',
  'Cancelled',
  'Fake',
];

function playSubtleNewOrderTone(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Browser autoplay policy may block audio until first click
  }
}

export function OrdersTab({
  t,
  language,
  actor,
  orders,
  loading,
  cms,
}: OrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | 'custom'>('all');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);

  // Admin notes for selected order
  const [notes, setNotes] = useState<OrderAdminNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Status & Fake confirmation modal
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const updatingStatusRef = useRef(false);
  const [fakeModalOpen, setFakeModalOpen] = useState(false);
  const [blockWithFake, setBlockWithFake] = useState(false);
  const [blockReason, setBlockReason] = useState('Fake order');
  const [actionError, setActionError] = useState<string | null>(null);

  const prevNewIdsRef = useRef<Set<string> | null>(null);

  // Detect newly arriving 'New' orders in real time
  useEffect(() => {
    const currentNewIds = new Set(
      orders.filter((o) => o.status === 'New').map((o) => o.id)
    );
    if (prevNewIdsRef.current !== null) {
      for (const id of currentNewIds) {
        if (!prevNewIdsRef.current.has(id)) {
          const arriving = orders.find((o) => o.id === id);
          setNewOrderToast(arriving ? `${t.orders.newOrderAlert}: ${arriving.orderNumber}` : t.orders.newOrderAlert);
          playSubtleNewOrderTone();
          break;
        }
      }
    }
    prevNewIdsRef.current = currentNewIds;
  }, [orders, t.orders.newOrderAlert]);

  useEffect(() => {
    if (!newOrderToast) return;
    const timer = window.setTimeout(() => setNewOrderToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [newOrderToast]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const selectedCustomerSavings = useMemo(() => {
    if (!selectedOrder) {
      return { lifetimeSavings: 0, deliveredOrderCount: 0 };
    }
    return computeCustomerLifetimeSavingsFromOrders(orders, selectedOrder);
  }, [orders, selectedOrder]);

  // Subscribe to admin-only notes subcollection when an order drawer is open
  useEffect(() => {
    if (!selectedOrderId) {
      setNotes([]);
      return;
    }
    const unsub = subscribeToOrderAdminNotes(
      selectedOrderId,
      (liveNotes) => setNotes(liveNotes),
      () => setNotes([])
    );
    return () => unsub();
  }, [selectedOrderId]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;

      if (dateFilter === 'today' && order.createdAtMs < startOfToday) return false;
      if (dateFilter === '7d' && order.createdAtMs < sevenDaysAgo) return false;
      if (dateFilter === 'custom' && customDate) {
        const orderDate = new Date(order.createdAtMs).toISOString().slice(0, 10);
        if (orderDate !== customDate) return false;
      }

      if (q) {
        const hay = `${order.orderNumber} ${order.phoneDisplay} ${order.phoneNormalized} ${order.customerName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customDate, dateFilter, orders, search, statusFilter]);

  const newOrderCount = useMemo(
    () => orders.filter((o) => o.status === 'New').length,
    [orders]
  );

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    if (!selectedOrder || updatingStatusRef.current) return;
    if (nextStatus === 'Fake') {
      setFakeModalOpen(true);
      setBlockWithFake(false);
      setBlockReason('Fake order');
      return;
    }
    updatingStatusRef.current = true;
    setUpdatingStatus(true);
    setPendingStatus(nextStatus);
    setActionError(null);
    try {
      await updateOrderStatusAdmin(actor, selectedOrder, nextStatus);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      updatingStatusRef.current = false;
      setUpdatingStatus(false);
      setPendingStatus(null);
    }
  };

  const handleConfirmFake = async () => {
    if (!selectedOrder || updatingStatusRef.current) return;
    updatingStatusRef.current = true;
    setUpdatingStatus(true);
    setPendingStatus('Fake');
    setActionError(null);
    try {
      await updateOrderStatusAdmin(actor, selectedOrder, 'Fake');
      if (actor.role === 'owner' && blockWithFake && blockReason.trim()) {
        await blockPhoneAdmin(actor, selectedOrder.phoneNormalized, blockReason.trim());
      }
      setFakeModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      updatingStatusRef.current = false;
      setUpdatingStatus(false);
      setPendingStatus(null);
    }
  };

  const handleAddNote = async () => {
    if (!selectedOrder || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      await addOrderAdminNote(actor, selectedOrder.id, selectedOrder.orderNumber, noteInput);
      setNoteInput('');
    } finally {
      setSavingNote(false);
    }
  };

  const statusLabel = (s: OrderStatus) => {
    if (s === 'Fake') return 'Fake';
    return TRANSLATIONS[language].orders.statuses[s];
  };

  const statusTone = (s: OrderStatus) => {
    if (s === 'New') return 'bg-[#FEF3C7] text-[#92400E]';
    if (s === 'Delivered') return 'bg-[#DCFCE7] text-[#166534]';
    if (s === 'Fake' || s === 'Cancelled') return 'bg-[#FEE2E2] text-[#991B1B]';
    return 'bg-[#EFF6F2] text-[#15663C]';
  };

  const mapsLink = selectedOrder
    ? selectedOrder.googleMapsUrl ||
      (selectedOrder.gps
        ? `https://maps.google.com/?q=${selectedOrder.gps.lat},${selectedOrder.gps.lng}`
        : '')
    : '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#141A15]">
            {t.orders.title}
          </h1>
          <p className="text-sm text-[#566058]">{t.orders.subtitle}</p>
        </div>

        {newOrderCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#F5D08A] bg-[#FEF9EE] px-4 py-2 text-xs font-bold text-[#92400E] tabular-nums">
            <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {newOrderCount} {statusLabel('New')}
            </span>
          </div>
        )}
      </div>

      {/* Live New Order Toast */}
      {newOrderToast && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#BCE0CA] bg-[#15663C] px-4 py-3 text-sm font-semibold text-white"
        >
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{newOrderToast}</span>
          </span>
          <button
            type="button"
            onClick={() => setNewOrderToast(null)}
            aria-label={t.common.close}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Search & Date Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7E4] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B756D]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.orders.searchPlaceholder}
            className="min-h-[48px] w-full rounded-xl border border-[#D4DAD2] bg-white ps-10 pe-4 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'today', '7d', 'custom'] as const).map((df) => (
            <button
              key={df}
              type="button"
              onClick={() => setDateFilter(df)}
              className={`min-h-[48px] rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                dateFilter === df
                  ? 'bg-[#141A15] text-white'
                  : 'border border-[#E5E7E4] bg-[#FAFBF9] text-[#4E5750] hover:bg-[#ECEFEA]'
              }`}
            >
              {df === 'all'
                ? t.orders.allDates
                : df === 'today'
                  ? t.orders.today
                  : df === '7d'
                    ? t.orders.last7Days
                    : t.orders.customDate}
            </button>
          ))}
          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-3 text-xs font-semibold text-[#141A15]"
            />
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`min-h-[48px] shrink-0 rounded-xl px-4 text-xs font-semibold whitespace-nowrap ${
            statusFilter === 'All'
              ? 'bg-[#15663C] text-white'
              : 'border border-[#E5E7E4] bg-white text-[#4E5750] hover:bg-[#F3F5F2]'
          }`}
        >
          {t.orders.allStatuses} ({orders.length})
        </button>
        {ALL_STATUSES.map((st) => {
          const count = orders.filter((o) => o.status === st).length;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`min-h-[48px] shrink-0 rounded-xl px-4 text-xs font-semibold whitespace-nowrap tabular-nums ${
                statusFilter === st
                  ? 'bg-[#15663C] text-white'
                  : 'border border-[#E5E7E4] bg-white text-[#4E5750] hover:bg-[#F3F5F2]'
              }`}
            >
              {statusLabel(st)} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E5E7E4] bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.loading}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#616B63]">
            {t.common.empty}
          </div>
        ) : (
          <table className="w-full min-w-[680px] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[#E5E7E4] bg-[#FAFBF9] text-xs font-semibold text-[#566058]">
                <th className="px-4 py-3 text-start">ID</th>
                <th className="px-4 py-3 text-start">Customer</th>
                <th className="px-4 py-3 text-start">Neighborhood</th>
                <th className="px-4 py-3 text-end">Total</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-end">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEFEA]">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`cursor-pointer transition-colors hover:bg-[#F7FAF8] ${
                    order.status === 'New' ? 'bg-[#FFFDF5]' : ''
                  }`}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setActionError(null);
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#141A15] tabular-nums">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#141A15]">
                      {order.customerName}
                    </p>
                    <p dir="ltr" className="text-xs text-[#616B63] tabular-nums text-start">
                      {order.phoneDisplay}
                    </p>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-xs text-[#4E5750]">
                    {order.addressText}
                  </td>
                  <td className="px-4 py-3 text-end font-semibold text-[#141A15] tabular-nums">
                    {formatIqd(order.grandTotal, language)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${statusTone(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end text-xs text-[#616B63] tabular-nums">
                    {formatOrderTimestamp(order.createdAtMs, language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Slide-over Drawer */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={selectedOrder.orderNumber}
          onClick={() => setSelectedOrderId(null)}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7E4] px-5 py-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#141A15] tabular-nums">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-[#616B63]">
                  {formatOrderTimestamp(selectedOrder.createdAtMs, language)} ·{' '}
                  {statusLabel(selectedOrder.status)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                aria-label={t.common.close}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-[#4E5750] hover:bg-[#F3F5F2]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Customer Info & One-Tap Actions */}
              <section className="space-y-3 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-4">
                <div>
                  <p className="font-display text-base font-bold text-[#141A15]">
                    {selectedOrder.customerName}
                  </p>
                  <p dir="ltr" className="text-sm font-medium text-[#4E5750] tabular-nums text-start">
                    {selectedOrder.phoneDisplay} (+{selectedOrder.phoneNormalized})
                  </p>
                  <p className="mt-1 text-xs text-[#566058]">
                    {selectedOrder.addressText}
                    {selectedOrder.buildingNotes
                      ? ` · ${selectedOrder.buildingNotes}`
                      : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:+${selectedOrder.phoneNormalized}`}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#141A15] px-4 text-xs font-semibold text-white hover:bg-[#2A332D] whitespace-nowrap"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.orders.callCustomer}</span>
                  </a>
                  <a
                    href={buildCustomerConfirmationWhatsAppUrl(selectedOrder, language)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#1FA855] px-4 text-xs font-semibold text-white hover:bg-[#178F47] whitespace-nowrap"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.orders.whatsappCustomer}</span>
                  </a>
                  {selectedOrder.status === 'Delivered' && (
                    <a
                      href={buildDeliveredThankYouWhatsAppUrl({
                        order: selectedOrder,
                        lifetimeSavings: selectedCustomerSavings.lifetimeSavings,
                        deliveredOrderCount:
                          selectedCustomerSavings.deliveredOrderCount,
                        lang: language,
                        customBodyTemplate:
                          cms?.deliveredThankYouBody?.[language],
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="admin-whatsapp-thank-you-btn"
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#15663C] px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#105230]"
                    >
                      <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{t.orders.whatsappThankYou}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#15663C] bg-white px-4 text-xs font-semibold text-[#15663C] hover:bg-[#EFF6F2]"
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{t.orders.openMaps}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </section>

              {/* Green Customer Savings Highlight (Order + Lifetime) */}
              {(selectedOrder.totalSavings > 0 ||
                selectedCustomerSavings.lifetimeSavings > 0) && (
                <div className="space-y-1.5 rounded-xl border border-[#BCE0CA] bg-[#EFF6F2] px-4 py-3 text-sm font-semibold text-[#115532] tabular-nums">
                  {selectedOrder.totalSavings > 0 && (
                    <p>
                      {t.orders.customerSavings}:{' '}
                      <span className="font-bold">
                        {formatIqd(selectedOrder.totalSavings, language)}
                      </span>
                    </p>
                  )}
                  {selectedCustomerSavings.lifetimeSavings > 0 && (
                    <p className="text-xs text-[#15663C]">
                      {t.orders.customerLifetimeSavings}:{' '}
                      <span className="font-bold">
                        {formatIqd(
                          selectedCustomerSavings.lifetimeSavings,
                          language
                        )}
                      </span>{' '}
                      ({selectedCustomerSavings.deliveredOrderCount})
                    </p>
                  )}
                </div>
              )}

              {/* One-Tap Status Workflow */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#3F4841]">
                  {t.orders.statusActions}
                </h3>
                {actionError && (
                  <p className="rounded-lg bg-[#FEE2E2] px-3 py-2 text-xs font-medium text-[#991B1B]">
                    {actionError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((st) => {
                    const active = selectedOrder.status === st;
                    const isPending = updatingStatus && pendingStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingStatus || active}
                        aria-busy={isPending}
                        onClick={() => void handleStatusChange(st)}
                        className={`inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
                          active
                            ? 'bg-[#15663C] text-white'
                            : st === 'Fake' || st === 'Cancelled'
                              ? 'border border-[#F0C9C4] bg-[#FDF2F0] text-[#9A2E20] hover:bg-[#FCE6E2] disabled:opacity-55'
                              : 'border border-[#D4DAD2] bg-white text-[#141A15] hover:bg-[#F3F5F2] disabled:opacity-55'
                        }`}
                      >
                        {isPending && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
                        )}
                        <span>{statusLabel(st)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Itemized List */}
              <section className="rounded-xl border border-[#E5E7E4] bg-white p-4">
                <ul className="divide-y divide-[#ECEFEA] text-sm">
                  {selectedOrder.items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#141A15]">
                          {item.quantity} × {getNameByLang(item, language)}
                        </p>
                        <p className="text-xs text-[#616B63]">
                          <bdi dir="ltr">{item.size}</bdi> ·{' '}
                          <bdi className="tabular-nums">
                            {formatIqd(item.ourPrice, language)}
                          </bdi>
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold text-[#141A15] tabular-nums">
                        {formatIqd(item.lineTotal, language)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-3 space-y-1.5 border-t border-[#E5E7E4] pt-3 text-xs">
                  <div className="flex justify-between text-[#566058]">
                    <dt>{TRANSLATIONS[language].cart.subtotal}</dt>
                    <dd className="font-semibold text-[#141A15] tabular-nums">
                      {formatIqd(selectedOrder.subtotal, language)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-[#566058]">
                    <dt>{TRANSLATIONS[language].cart.deliveryFee}</dt>
                    <dd className="font-semibold text-[#141A15] tabular-nums">
                      {formatIqd(selectedOrder.deliveryFee, language)}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-1 font-display text-sm font-bold text-[#141A15]">
                    <dt>{TRANSLATIONS[language].cart.grandTotal}</dt>
                    <dd className="text-[#15663C] tabular-nums">
                      {formatIqd(selectedOrder.grandTotal, language)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Internal Staff Notes (Admin-Only Subcollection) */}
              <section className="space-y-3 rounded-xl border border-[#E5E7E4] bg-[#FAFBF9] p-4">
                <h3 className="text-xs font-bold text-[#3F4841]">
                  {t.orders.internalNotes}
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={t.orders.notePlaceholder}
                    className="min-h-[48px] flex-1 rounded-xl border border-[#D4DAD2] bg-white px-3.5 text-xs text-[#141A15] focus:border-[#15663C] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={savingNote || !noteInput.trim()}
                    onClick={() => void handleAddNote()}
                    className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-[#15663C] px-4 text-xs font-semibold text-white hover:bg-[#105230] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.orders.addNote}</span>
                  </button>
                </div>

                {notes.length === 0 ? (
                  <p className="text-xs text-[#78827A]">{t.orders.noNotes}</p>
                ) : (
                  <ul className="space-y-2">
                    {notes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg border border-[#E5E7E4] bg-white p-3 text-xs"
                      >
                        <p className="text-[#141A15]">{n.note}</p>
                        <p className="mt-1 text-[11px] text-[#78827A]">
                          {n.authorEmail} ·{' '}
                          {formatOrderTimestamp(n.createdAtMs, language)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Fake Modal */}
      {fakeModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#E5E7E4] bg-white p-6">
            <div className="flex items-center gap-2 text-[#991B1B]">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h3 className="font-display text-base font-bold">
                {t.orders.confirmFakeTitle}
              </h3>
            </div>
            <p className="text-sm text-[#4E5750]">{t.orders.confirmFakeBody}</p>

            {actor.role === 'owner' && (
              <div className="space-y-2.5 rounded-xl border border-[#F0C9C4] bg-[#FDF2F0] p-3.5">
                <label className="flex min-h-[48px] cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#7F291E]">
                  <input
                    type="checkbox"
                    checked={blockWithFake}
                    onChange={(e) => setBlockWithFake(e.target.checked)}
                    className="h-4 w-4 accent-[#9A2E20]"
                  />
                  <span>
                    {t.orders.alsoBlockPhone} ({selectedOrder.phoneDisplay})
                  </span>
                </label>
                {blockWithFake && (
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder={t.orders.blockReasonPlaceholder}
                    className="min-h-[48px] w-full rounded-xl border border-[#E5C2BC] bg-white px-3 text-xs text-[#141A15]"
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFakeModalOpen(false)}
                className="min-h-[48px] rounded-xl border border-[#D4DAD2] bg-white px-4 text-xs font-semibold text-[#141A15]"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={updatingStatus || (blockWithFake && !blockReason.trim())}
                onClick={() => void handleConfirmFake()}
                className="min-h-[48px] rounded-xl bg-[#B42318] px-4 text-xs font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
