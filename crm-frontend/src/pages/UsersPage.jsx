import { useState, useEffect, useCallback } from 'react';
import { Search, UserCog } from 'lucide-react';
import { userService } from '../api/api';
import { Spinner, EmptyState, ErrorState, Badge, Card, SkeletonTable } from '../components/common/UI';
import { PageHeader } from '../components/common/Breadcrumbs';
import { cn, formatDate, toFa } from '../utils/ui';
import { showToast } from '../utils/toast';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ROLE_BADGES = {
  ADMIN:     { label: 'مدیر',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', dot: 'bg-purple-500' },
  SALES_REP: { label: 'فروش', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
};

const STATUS_BADGES = {
  ACTIVE:   { label: 'فعال',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  INACTIVE: { label: 'غیرفعال', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500' },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { pageSize: 50 };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const r = await userService.list(params);
      setUsers(r?.data?.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = users.filter(u =>
    !search ||
    u.firstName?.includes(search) ||
    u.lastName?.includes(search) ||
    u.email?.includes(search) ||
    `${u.firstName} ${u.lastName}`.includes(search)
  );

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await userService.updateStatus(user.id, newStatus);
      showToast(newStatus === 'ACTIVE' ? `${user.firstName} ${user.lastName} فعال شد` : `${user.firstName} ${user.lastName} غیرفعال شد`);
      fetch();
    } catch (e) {
      showToast('خطا در تغییر وضعیت کاربر', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مدیریت کاربران"
        subtitle="لیست کاربران و مدیریت دسترسی‌ها"
        icon={UserCog}
      />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو نام یا ایمیل..."
              className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/30 outline-none"
            >
              <option value="">همه نقش‌ها</option>
              <option value="ADMIN">مدیر</option>
              <option value="SALES_REP">فروش</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/30 outline-none"
            >
              <option value="">همه وضعیت</option>
              <option value="ACTIVE">فعال</option>
              <option value="INACTIVE">غیرفعال</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetch} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="کاربری یافت نشد" />
      ) : (
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">نام</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">ایمیل</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">موبایل</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">نقش</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">وضعیت</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">تاریخ ایجاد</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(u => {
                  const rc = ROLE_BADGES[u.role] || ROLE_BADGES.SALES_REP;
                  const sc = STATUS_BADGES[u.status] || STATUS_BADGES.ACTIVE;
                  const isActive = u.status === 'ACTIVE';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300" dir="ltr">{u.email}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300" dir="ltr">{u.mobile}</td>
                      <td className="px-4 py-3"><Badge color={rc.color} dot={rc.dot}>{rc.label}</Badge></td>
                      <td className="px-4 py-3"><Badge color={sc.color} dot={sc.dot}>{sc.label}</Badge></td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmTarget(u)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                          )}
                        >
                          {isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.status === 'ACTIVE' ? 'غیرفعال‌سازی کاربر' : 'فعال‌سازی کاربر'}
        message={confirmTarget?.status === 'ACTIVE'
          ? `آیا از غیرفعال‌سازی ${confirmTarget?.firstName} ${confirmTarget?.lastName} مطمئن هستید؟ این کاربر دیگر نمی‌تواند وارد سیستم شود.`
          : `آیا از فعال‌سازی ${confirmTarget?.firstName} ${confirmTarget?.lastName} مطمئن هستید؟`}
        confirmText={confirmTarget?.status === 'ACTIVE' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
        variant={confirmTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        onConfirm={() => { handleToggleStatus(confirmTarget); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
