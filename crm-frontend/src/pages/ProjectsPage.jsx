import { useState, useEffect, useCallback } from 'react';
import { Briefcase, MapPin, Ruler, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { projectService } from '../api/api';
import { showToast } from '../utils/toast';
import { Spinner, EmptyState, ErrorState, Badge, Card, Button, SkeletonCard } from '../components/common/UI';
import { PageHeader } from '../components/common/Breadcrumbs';
import { cn } from '../utils/ui';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import DeleteProjectModal from '../components/projects/DeleteProjectModal';

const statusCfg = {
  PLANNING: { label: 'برنامه‌ریزی', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
  EXCAVATION: { label: 'گودبرداری', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
  SKELETON: { label: 'اسکلت', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
  STRUCTURE: { label: 'سازه', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', dot: 'bg-purple-500' },
  FINISHING: { label: 'نازک‌کاری', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  DELIVERED: { label: 'تحویل داده شده', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', dot: 'bg-green-500' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await projectService.list({ pageSize: 50 });
      const projectsData = Array.isArray(r?.data) ? r.data : r?.data?.items || [];
      setProjects(projectsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter(p =>
    !search || p.title?.includes(search) || p.city?.includes(search) || p.executor?.includes(search)
  );

  // ===== ثبت پروژه جدید =====
  const handleCreateProject = async (payload) => {
    try {
      await projectService.create(payload);
      setModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('خطا در ثبت:', error);
      throw error;
    }
  };

  // ===== ویرایش پروژه =====
  const handleEdit = (project) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };

  // ===== حذف پروژه =====
  const handleDelete = (project) => {
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  // ===== ویرایش پروژه =====
  const handleUpdateProject = async (data) => {
    try {
      await projectService.update(selectedProject.id, data);
      await fetchProjects();
      setEditModalOpen(false);
      setSelectedProject(null);
      showToast('پروژه با موفقیت ویرایش شد');
    } catch (error) {
      console.error('خطا در ویرایش:', error);
      throw error;
    }
  };

  // ===== حذف پروژه =====
  const handleDeleteProject = async () => {
    try {
      await projectService.remove(selectedProject.id);
      await fetchProjects();
      setDeleteModalOpen(false);
      setSelectedProject(null);
      showToast('پروژه با موفقیت حذف شد');
    } catch (error) {
      console.error('خطا در حذف:', error);
      showToast('خطا در حذف پروژه', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="پروژه‌ها"
        subtitle="پروژه‌های ساختمانی مشتریان"
        icon={Briefcase}
        actions={
          <Button onClick={() => setModalOpen(true)} icon={Plus}>
            ثبت پروژه
          </Button>
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
        <ErrorState message={error} onRetry={fetchProjects} />
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
            const sc = statusCfg[p.status] || statusCfg.PLANNING;
            return (
              <Card key={p.id} className="p-4 hover:shadow-card-hover dark:hover:shadow-lg transition-shadow card-lift group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.title}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city || '—'}</span>
                        <span className="inline-flex items-center gap-1"><Ruler className="w-3 h-3" />{p.area ? `${Number(p.area).toLocaleString('fa-IR')} متر` : '—'}</span>
                        {p.budget > 0 && (
                          <span className="inline-flex items-center gap-1">💰 {Number(p.budget).toLocaleString('fa-IR')} ریال</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{p.executor}</span>
                    <Badge color={sc.color} dot={sc.dot}>{sc.label}</Badge>
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="ویرایش"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ProjectFormModal
        open={modalOpen}
        mode="add"
        onClose={() => setModalOpen(false)}
        onCreated={handleCreateProject}
      />

      <ProjectFormModal
        open={editModalOpen}
        mode="edit"
        project={selectedProject}
        onClose={() => { setEditModalOpen(false); setSelectedProject(null); }}
        onUpdated={handleUpdateProject}
      />

      <DeleteProjectModal
        open={deleteModalOpen}
        project={selectedProject}
        onClose={() => { setDeleteModalOpen(false); setSelectedProject(null); }}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}