import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Search, Filter, Plus, Phone, MessageSquare, Calendar,
  User, Building2, MapPin, DollarSign, Send, ChevronLeft, X,
  LayoutGrid, List, Pencil, Trash2, Loader2,
} from 'lucide-react';
import { cn, leadStageConfig, leadSourceConfig, formatDateTime, formatDate, formatRelative, toFa } from '../utils/ui';
import { leadService, interactionService } from '../api/api';
import { Spinner, EmptyState, ErrorState, Badge, Card, Button, SkeletonCard } from '../components/common/UI';
import { PageHeader } from '../components/common/Breadcrumbs';
import LostReasonModal from '../components/leads/LostReasonModal';
import LeadFormModal from '../components/leads/LeadFormModal';
import DeleteLeadModal from '../components/leads/DeleteLeadModal';
import SimplePersianDatePicker from '../components/common/SimplePersianDatePicker';

const STAGES = ['INQUIRY', 'CONSULTING', 'PROFORMA', 'WON', 'LOST'];
const INTERACTION_TYPES = [
  { value: 'CALL', label: 'تماس تلفنی', icon: Phone },
  { value: 'MEETING', label: 'جلسه حضوری', icon: User },
  { value: 'MESSAGE', label: 'پیام', icon: MessageSquare },
];

export default function LeadsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (id) return <LeadDetail leadId={id} onBack={() => navigate('/leads')} />;
  return <LeadList onSelect={(l) => navigate(`/leads/${l.id}`)} />;
}

// ============================================================
// LIST VIEW — با Kanban و List toggle
// ============================================================
function LeadList({ onSelect }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState('list');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: 1, pageSize: 50 };
      if (stageFilter) params.stage = stageFilter;
      const res = await leadService.list(params);
      setLeads(res?.data?.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = leads.filter(
    (l) =>
      !search ||
      l.fullName?.includes(search) ||
      l.mobile?.includes(search) ||
      l.company?.includes(search)
  );

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.stage === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="سرنخ‌ها"
        subtitle="قیف فروش و مدیریت فرصت‌ها"
        icon={User}
        actions={
          <Button onClick={() => setModalOpen(true)} icon={Plus}>
            ثبت سرنخ
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو نام، موبایل، شرکت..."
              className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                view === 'list'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <List className="w-3.5 h-3.5" />
              لیست
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                view === 'kanban'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              کانبان
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mt-3">
          <button
            onClick={() => setStageFilter('')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
              stageFilter === ''
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            همه
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold',
                stageFilter === '' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
              )}
            >
              {toFa(leads.length)}
            </span>
          </button>
          {STAGES.map((s) => {
            const cfg = leadStageConfig[s];
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                  stageFilter === s
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                {cfg.label}
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold',
                    stageFilter === s ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  {toFa(stageCounts[s] || 0)}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLeads} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="سرنخی یافت نشد"
          description="فیلترها را تغییر دهید یا سرنخ جدید ثبت کنید"
          action={
            <Button
              onClick={() => setModalOpen(true)}
              icon={Plus}
              variant="outline"
              size="sm"
            >
              ثبت سرنخ جدید
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <KanbanView leads={filtered} onSelect={onSelect} />
      ) : (
        <ListView leads={filtered} onSelect={onSelect} />
      )}

      <LeadFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchLeads();
        }}
      />
    </div>
  );
}

// ============================================================
// LIST VIEW
// ============================================================
function ListView({ leads, onSelect }) {
  return (
    <div className="grid gap-3">
      {leads.map((lead) => {
        const sc = leadStageConfig[lead.stage] || leadStageConfig.INQUIRY;
        const source = leadSourceConfig[lead.source] || { label: 'نامشخص', icon: '❓' };
        return (
          <button
            key={lead.id}
            onClick={() => onSelect(lead)}
            className="group w-full text-right bg-white dark:bg-surface-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-card-hover dark:hover:shadow-lg transition-all duration-200 card-lift"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                    {lead.fullName}
                    <span className="text-xs">{source.icon}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                    {lead.company || lead.mobile}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {lead.estimatedValue > 0 && (
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-mono text-slate-700 dark:text-slate-200">
                      {Number(lead.estimatedValue).toLocaleString('fa-IR')}
                    </div>
                    <div className="text-[10px] text-slate-400">ریال</div>
                  </div>
                )}
                <Badge color={sc.color} dot={sc.dot}>
                  {sc.label}
                </Badge>
                <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// KANBAN VIEW
// ============================================================
function KanbanView({ leads, onSelect }) {
  const columns = STAGES.map((stage) => ({
    stage,
    cfg: leadStageConfig[stage],
    items: leads.filter((l) => l.stage === stage),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {columns.map((col) => (
        <div
          key={col.stage}
          className="bg-slate-50/50 dark:bg-surface-850 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col min-h-[300px]"
        >
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', col.cfg.dot)} />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {col.cfg.label}
                </h3>
              </div>
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                {toFa(col.items.length)}
              </span>
            </div>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
            {col.items.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-300 dark:text-slate-600">
                خالی
              </div>
            ) : (
              col.items.map((lead) => {
                const source = leadSourceConfig[lead.source] || { label: '', icon: '' };
                return (
                  <button
                    key={lead.id}
                    onClick={() => onSelect(lead)}
                    className="w-full text-right bg-white dark:bg-surface-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing"
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      {lead.fullName}
                      <span className="text-xs">{source.icon}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" dir="ltr">
                      {lead.company || lead.mobile}
                    </div>
                    {lead.estimatedValue > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {formatRelative(lead.createdAt)}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
                          {Number(lead.estimatedValue).toLocaleString('fa-IR')} ریال
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// DETAIL VIEW — با دکمه‌های Edit و Delete و DeleteModal
// ============================================================
function LeadDetail({ leadId, onBack }) {
  const [lead, setLead] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageLoading, setStageLoading] = useState(false);
  const [lostModal, setLostModal] = useState(false);
  const [pendingStage, setPendingStage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [intType, setIntType] = useState('CALL');
  const [intDesc, setIntDesc] = useState('');
  const [intDate, setIntDate] = useState(null);
  const [intLoading, setIntLoading] = useState(false);

  // State برای Edit و Delete
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lRes = await leadService.getById(leadId);
      const leadData = lRes?.data || lRes;
      setLead(leadData);
      // دریافت تعاملات از خود lead
      setInteractions(leadData?.interactions || []);
    } catch (e) {
      console.error('Error fetching lead:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStageChange = async (newStage) => {
    if (newStage === 'LOST') {
      setPendingStage(newStage);
      setLostModal(true);
      return;
    }
    setStageLoading(true);
    try {
      await leadService.updateStage(leadId, { stage: newStage });
      fetchLead();
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setStageLoading(false);
    }
  };

  const handleLostSubmit = async (data) => {
    setLostModal(false);
    setStageLoading(true);
    try {
      await leadService.updateStage(leadId, { stage: 'LOST', ...data });
      fetchLead();
    } catch (err) {
      console.error('Error submitting lost reason:', err);
    } finally {
      setStageLoading(false);
    }
  };

  const handleAddInteraction = async (e) => {
    e.preventDefault();
    if (!intDesc.trim()) return;
    setIntLoading(true);
    try {
      await interactionService.create(leadId, {
        type: intType,
        description: intDesc,
        nextFollowUpDate: intDate ? intDate.toISOString() : null,
      });
      setIntDesc('');
      setIntDate(null);
      setShowForm(false);
      fetchLead(); // ریفرش برای دریافت تعاملات جدید
    } catch (err) {
      console.error('Error adding interaction:', err);
    } finally {
      setIntLoading(false);
    }
  };

  // ===== حذف سرنخ با DeleteModal =====
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await leadService.remove(leadId);
      setDeleteModalOpen(false);
      onBack();
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert(error.message || 'خطا در حذف سرنخ');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner className="py-20" />;
  if (error) return <ErrorState message={error} onRetry={fetchLead} />;
  if (!lead) return <EmptyState title="سرنخ یافت نشد" />;

  const sc = leadStageConfig[lead.stage] || leadStageConfig.INQUIRY;
  const currentIdx = STAGES.indexOf(lead.stage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Title + Edit/Delete Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {lead.fullName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400" dir="ltr">
            {lead.company || lead.mobile}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Edit Button */}
          <button
            onClick={() => setEditModalOpen(true)}
            className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors disabled:opacity-50"
            title="ویرایش سرنخ"
            disabled={deleting}
          >
            <Pencil className="w-4 h-4" />
          </button>
          {/* Delete Button */}
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            title="حذف سرنخ"
            disabled={deleting}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <Card padded>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoItem icon={Phone} label="موبایل" value={lead.mobile} />
          <InfoItem icon={Building2} label="شرکت" value={lead.company || '—'} />
          <InfoItem icon={MapPin} label="پروژه" value={lead.project?.title || lead.projectName || '—'} />
          <InfoItem
            icon={DollarSign}
            label="ارزش تخمینی"
            value={
              lead.estimatedValue
                ? `${Number(lead.estimatedValue).toLocaleString('fa-IR')} ریال`
                : '—'
            }
          />
        </div>
        {lead.description && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {lead.description}
            </p>
          </div>
        )}
      </Card>

      {/* Stage Changer */}
      <Card padded>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
          تغییر مرحله قیف فروش
        </h3>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage, idx) => {
            const cfg = leadStageConfig[stage];
            const isCurrent = stage === lead.stage;
            const isPast = idx < currentIdx;
            const isDisabled =
              isCurrent ||
              lead.stage === 'WON' ||
              (lead.stage === 'LOST' && stage !== 'PROFORMA') ||
              isPast ||
              stageLoading ||
              deleting;
            return (
              <button
                key={stage}
                disabled={isDisabled}
                onClick={() => handleStageChange(stage)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  isCurrent
                    ? cn('ring-2 ring-brand-500', cfg.color)
                    : isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-slate-400'
                    : 'bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                {cfg.label}
                {isPast && <span className="text-emerald-500">✓</span>}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Lost info */}
      {lead.stage === 'LOST' && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-bold text-red-700 dark:text-red-300">
              این سرنخ باخته شده
            </span>
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            <div>
              دلیل:{' '}
              {lead.lostReason === 'PRICE'
                ? 'قیمت بالا'
                : lead.lostReason === 'COMPETITOR'
                ? 'خرید از رقیب'
                : lead.lostReason === 'PAYMENT_TERMS'
                ? 'شرایط پرداخت'
                : lead.lostReason === 'MARKET_DROP'
                ? 'کاهش ساخت‌وساز'
                : 'سایر'}
            </div>
            {lead.competitorPrice && (
              <div className="mt-1">
                قیمت رقیب: {Number(lead.competitorPrice).toLocaleString('fa-IR')}{' '}
                ریال
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactions Timeline */}
      <Card padded>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            تاریخچه تعاملات
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
          >
            {showForm ? 'انصراف' : '+ ثبت تعامل جدید'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddInteraction}
            className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {INTERACTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setIntType(t.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    intType === t.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              value={intDesc}
              onChange={(e) => setIntDesc(e.target.value)}
              placeholder="نتیجه تماس یا توضیحات..."
              rows={3}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-sm resize-none focus:ring-2 focus:ring-brand-500/30 outline-none mb-3 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  تاریخ پیگیری بعدی
                </label>
                <SimplePersianDatePicker
                  value={intDate}
                  onChange={setIntDate}
                  placeholder="انتخاب تاریخ پیگیری"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={intLoading || !intDesc.trim() || deleting}
                  className={cn(
                    'px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors',
                    intDesc.trim() && !deleting
                      ? 'bg-brand-600 hover:bg-brand-700'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4 inline ml-1" />
                  {intLoading ? 'در حال ثبت...' : 'ثبت'}
                </button>
              </div>
            </div>
          </form>
        )}

        {interactions.length === 0 ? (
          <EmptyState
            title="تعاملی ثبت نشد"
            description="اولین تعامل خود را ثبت کنید"
          />
        ) : (
          <div className="relative pr-6 space-y-4">
            <div className="absolute right-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
            {interactions.map((int, idx) => {
              const typeIcon =
                int.type === 'CALL' ? Phone : int.type === 'MEETING' ? User : MessageSquare;
              const TypeIcon = typeIcon;
              return (
                <div key={int.id || idx} className="relative animate-fade-in">
                  <div className="absolute -right-[1.35rem] top-1 w-7 h-7 rounded-full bg-white dark:bg-surface-800 border-2 border-brand-300 dark:border-brand-700 flex items-center justify-center">
                    <TypeIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="bg-white dark:bg-surface-800 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        color={
                          int.type === 'CALL'
                            ? 'bg-blue-100 text-blue-700'
                            : int.type === 'MEETING'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {int.type === 'CALL'
                          ? 'تماس'
                          : int.type === 'MEETING'
                          ? 'جلسه'
                          : 'پیام'}
                      </Badge>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDateTime(int.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {int.description}
                    </p>
                    {int.nextFollowUpDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        پیگیری بعدی: {formatDate(int.nextFollowUpDate)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <LostReasonModal
        open={lostModal}
        onClose={() => setLostModal(false)}
        onSubmit={handleLostSubmit}
      />

      <LeadFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
        }}
        onSuccess={() => {
          setEditModalOpen(false);
          fetchLead();
        }}
        lead={lead}
      />

      <DeleteLeadModal
        open={deleteModalOpen}
        lead={lead}
        onClose={() => {
          setDeleteModalOpen(false);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

// ============================================================
// INFO ITEM
// ============================================================
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-sm font-medium text-slate-900 dark:text-white" dir="ltr">
          {value}
        </div>
      </div>
    </div>
  );
}