import { useState } from 'react';
import { Shield, Trash2, UserPlus } from 'lucide-react';
import { formatOrderTimestamp } from '../../i18n/format';
import type { AdminRole, AdminUserRecord, Language } from '../../types/grocery';
import type { AdminDictionary } from '../i18n/adminTranslations';
import {
  deleteAdminUserRecord,
  saveAdminUserRecord,
  type AdminActor,
} from '../services/adminFirestoreService';

interface AdminUsersTabProps {
  t: AdminDictionary;
  language: Language;
  actor: AdminActor;
  admins: AdminUserRecord[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function AdminUsersTab({
  t,
  language,
  actor,
  admins,
  loading,
  onRefresh,
}: AdminUsersTabProps) {
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('staff');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    if (!uid.trim() || !email.trim()) return;

    setSaving(true);
    try {
      await saveAdminUserRecord(actor, uid.trim(), email.trim(), role);
      setUid('');
      setEmail('');
      setRole('staff');
      await onRefresh();
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (target: AdminUserRecord) => {
    if (target.uid === actor.uid) return;
    setSaving(true);
    try {
      await deleteAdminUserRecord(actor, target);
      await onRefresh();
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to remove admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#141A15]">{t.admins.title}</h2>
        <p className="mt-1 text-sm text-[#5B665D]">{t.admins.subtitle}</p>
      </div>

      {/* Add / Update Admin Form */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-xl border border-[#E4E7E2] bg-white p-5"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#141A15]">
          <UserPlus className="h-4 w-4 text-[#15663C]" />
          <span>{t.admins.addAdmin}</span>
        </div>
        <p className="text-xs text-[#5B665D]">{t.admins.uidHint}</p>

        {errorText && (
          <p className="rounded-lg border border-[#F2C3C1] bg-[#FDF1F0] px-3 py-2 text-xs text-[#B42318]">
            {errorText}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.admins.uidLabel}
            </label>
            <input
              type="text"
              dir="ltr"
              required
              placeholder="e.g. a1b2c3d4e5f6..."
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 font-mono text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.admins.emailLabel}
            </label>
            <input
              type="email"
              dir="ltr"
              required
              placeholder="staff@bazarfresh.iq"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#3C463E]">
              {t.admins.roleLabel}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="min-h-[48px] w-full rounded-lg border border-[#D4DAD2] bg-white px-3.5 text-sm text-[#141A15] focus:border-[#15663C] focus:outline-none"
            >
              <option value="staff">
                {t.staffRole} (Orders &amp; Products only)
              </option>
              <option value="owner">{t.ownerRole} (Full Access)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#15663C] px-5 text-sm font-semibold text-white hover:bg-[#115331] disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            <span>{saving ? t.common.saving : t.admins.addAdmin}</span>
          </button>
        </div>
      </form>

      {/* Current Admins List */}
      <div className="overflow-hidden rounded-xl border border-[#E4E7E2] bg-white">
        {loading && admins.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#5B665D]">
            {t.common.loading}
          </p>
        ) : admins.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#5B665D]">
            {t.common.empty}
          </p>
        ) : (
          <div className="divide-y divide-[#ECEFE9]">
            {admins.map((admin) => {
              const isSelf = admin.uid === actor.uid;
              return (
                <div
                  key={admin.uid}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Shield className="h-4 w-4 text-[#15663C]" />
                      <span className="font-semibold text-[#141A15]">
                        {admin.email}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          admin.role === 'owner'
                            ? 'bg-[#EBF7F0] text-[#15663C]'
                            : 'bg-[#F2F4F1] text-[#3C463E]'
                        }`}
                      >
                        {admin.role === 'owner' ? t.ownerRole : t.staffRole}
                      </span>
                    </div>
                    <p className="truncate font-mono text-xs text-[#6B726A]">
                      UID: {admin.uid}
                      {admin.createdAtMs
                        ? ` · ${formatOrderTimestamp(admin.createdAtMs, language)}`
                        : ''}
                    </p>
                  </div>

                  {!isSelf && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleRemove(admin)}
                      className="inline-flex min-h-[48px] items-center gap-2 self-start rounded-lg border border-[#F2C3C1] bg-white px-4 text-sm font-medium text-[#B42318] hover:bg-[#FDF1F0] sm:self-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{t.common.delete}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
