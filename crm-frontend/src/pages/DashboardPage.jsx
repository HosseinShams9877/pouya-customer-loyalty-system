import { useNavigate } from 'react-router-dom';
import {
  Calendar, UserPlus, AlertTriangle, RefreshCw, Plus, FileText,
  TrendingUp, Clock, Target, Flame, ChevronLeft,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import ActionColumn from '../components/dashboard/ActionColumn';
import FollowUpCard from '../components/dashboard/FollowUpCard';
import NewLeadCard from '../components/dashboard/NewLeadCard';
import ChurnAlertCard from '../components/dashboard/ChurnAlertCard';
import SalesFunnel from '../components/dashboard/SalesFunnel';
import { PageHeader } from '../components/common/Breadcrumbs';
import { Spinner, EmptyState, ErrorState, StatCard } from '../components/common/UI';
import { cn, toFa } from '../utils/ui';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { followUps, newLeads, churnAlerts, loading, error, refresh } = useDashboardData();
  const handleLeadClick = (item) => navigate(`/leads/${item.lead?.id || item.id}`);
  const handleCustomerClick = (c) => navigate(`/customers/${c.id}`);

  // ساخت داده قیف فروش از سرنخ‌های موجود
  const funnelData = newLeads.reduce((acc, lead) => {
    const stage = lead.stage || 'INQUIRY';
    const item = acc.find(a => a.stage === stage);
    if (item) item.count++;
    else acc.push({ stage, count: 1 });
    return acc;
  }, []);

  const quickActions = [
    { label: 'سرنخ جدید', icon: UserPlus, color: 'from-brand-500 to-brand-600', onClick: () => navigate('/leads') },
    { label: 'ثبت فاکتور', icon: FileText, color: 'from-emerald-500 to-emerald-600', onClick: () => navigate('/invoices') },
    { label: 'تماس امروز', icon: Calendar, color: 'from-amber-500 to-amber-600', onClick: () => navigate('/leads') },
    { label: 'گزارش', icon: TrendingUp, color: 'from-violet-500 to-violet-600', onClick: () => navigate('/admin-dashboard') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="داشبورد کارشناس فروش"
        subtitle="اقدامات فوری خود را در یک نگاه ببینید"
        icon={Target}
        actions={
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            بروزرسانی
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      )}

      {/* KPIs — Top row */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="پیگیری‌های امروز"
            value={toFa(followUps.length)}
            sub="اقدام فوری"
            icon={Calendar}
            color="amber"
            trend={null}
          />
          <StatCard
            title="سرنخ‌های جدید"
            value={toFa(newLeads.length)}
            sub="در انتظار تماس"
            icon={UserPlus}
            color="brand"
            trend={null}
          />
          <StatCard
            title="مشتریان پرخطر"
            value={toFa(churnAlerts.length)}
            sub="نیاز به رسیدگی"
            icon={AlertTriangle}
            color="red"
            trend={null}
          />
          <StatCard
            title="نرخ پاسخگویی"
            value="۹۸٪"
            sub="این ماه"
            icon={Flame}
            color="emerald"
            trend={12}
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={i}
              onClick={a.onClick}
              className="group relative overflow-hidden bg-white dark:bg-surface-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] text-right"
            >
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-md', a.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{a.label}</div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">شروع کنید</span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Action columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActionColumn title="پیگیری‌های امروز" icon={Calendar} color="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" count={followUps.length} loading={loading}>
          {loading ? <Spinner className="py-8" /> : followUps.length === 0 ? <EmptyState icon={Calendar} title="پیگیری‌ای برای امروز ندارید" description="وقت آزاد دارید!" /> : followUps.map(i => <FollowUpCard key={i.id} interaction={i} onClick={handleLeadClick} />)}
        </ActionColumn>
        <ActionColumn title="سرنخ‌های جدید" icon={UserPlus} color="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" count={newLeads.length} loading={loading}>
          {loading ? <Spinner className="py-8" /> : newLeads.length === 0 ? <EmptyState icon={UserPlus} title="سرنخ جدیدی وجود ندارد" /> : newLeads.map(l => <NewLeadCard key={l.id} lead={l} onClick={handleLeadClick} />)}
        </ActionColumn>
        <ActionColumn title="هشدارهای ریزش" icon={AlertTriangle} color="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" count={churnAlerts.length} loading={loading}>
          {loading ? <Spinner className="py-8" /> : churnAlerts.length === 0 ? <EmptyState icon={AlertTriangle} title="هشدار ریزشی وجود ندارد" description="همه مشتریان سالم هستند." /> : churnAlerts.map(c => <ChurnAlertCard key={c.id} customer={c} onClick={handleCustomerClick} />)}
        </ActionColumn>
      </div>

      {/* Sales funnel */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <Target className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">قیف فروش شما</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">توزیع سرنخ‌ها در مراحل</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/leads')}
            className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1"
          >
            مشاهده همه
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        <SalesFunnel data={funnelData} loading={loading} />
      </div>
    </div>
  );
}
