import { useState, useEffect, useCallback } from 'react';
import { Briefcase, MapPin, Ruler, Search, Plus } from 'lucide-react';
import { projectService } from '../api/api';
import { Spinner, EmptyState, ErrorState, Badge, Card, Button, SkeletonCard } from '../components/common/UI';
import { PageHeader } from '../components/common/Breadcrumbs';
import { cn } from '../utils/ui';
import AddProjectModal from '../components/projects/AddProjectModal';

const statusCfg = {
  EXCAVATION: { label: 'گودبرداری', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
  SKELETON: { label: 'اسکلت', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
  FINISHING: { label: 'نازک‌کاری', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  DONE: { label: 'اتمام', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await projectService.list({ pageSize: 50 }); setProjects(r?.data?.items || []); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  const filtered = projects.filter(p => !search || p.title?.includes(search) || p.city?.includes(search) || p.executor?.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="پروژه‌ها"
        subtitle="پروژه‌های ساختمانی مشتریان"
        icon={Briefcase}
        actions={
          <Button onClick={() => setModalOpen(true)} icon={Plus}>ثبت پروژه</Button>
        }
      />

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو نام پروژه، شهر، مجری..."
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="پروژه‌ای یافت نشد"
          description="پروژه جدید ثبت کنید"
          action={<Button onClick={() => setModalOpen(true)} icon={Plus} variant="outline" size="sm">ثبت پروژه</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => {
            const sc = statusCfg[p.status] || statusCfg.EXCAVATION;
            return (
              <Card key={p.id} className="p-4 hover:shadow-card-hover dark:hover:shadow-lg transition-shadow card-lift">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.title}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>
                        <span className="inline-flex items-center gap-1"><Ruler className="w-3 h-3" />{Number(p.area).toLocaleString('fa-IR')} متر</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{p.executor}</span>
                    <Badge color={sc.color} dot={sc.dot}>{sc.label}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); fetch(); }}
      />
    </div>
  );
}
