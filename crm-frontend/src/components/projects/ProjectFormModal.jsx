import { useState, useEffect } from 'react';
import { X, Plus, Edit } from 'lucide-react';
import { cn } from '../../utils/ui';
import { showToast } from '../../utils/toast';

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'برنامه‌ریزی' },
  { value: 'EXCAVATION', label: 'گودبرداری' },
  { value: 'SKELETON', label: 'اسکلت' },
  { value: 'STRUCTURE', label: 'سازه' },
  { value: 'FINISHING', label: 'نازک‌کاری' },
  { value: 'DELIVERED', label: 'تحویل داده شده' },
];

export default function ProjectFormModal({
  open,
  mode = 'add', // 'add' | 'edit'
  project = null,
  onClose,
  onCreated,
  onUpdated,
}) {
  const [form, setForm] = useState({
    title: '',
    city: '',
    area: '',
    status: 'PLANNING',
    executor: '',
    budget: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setForm({
        title: project.title || '',
        city: project.city || '',
        area: project.area || '',
        status: project.status || 'PLANNING',
        executor: project.executor || '',
        budget: project.budget || '',
      });
    } else {
      setForm({
        title: '',
        city: '',
        area: '',
        status: 'PLANNING',
        executor: '',
        budget: '',
      });
    }
  }, [mode, project, open]);

  if (!open) return null;

  const isValid = form.title.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        city: form.city || undefined,
        area: Number(form.area) || undefined,
        status: form.status,
        executor: form.executor || undefined,
        budget: Number(form.budget) || 0,
      };

      if (mode === 'edit') {
        await onUpdated(payload);
        showToast('پروژه با موفقیت ویرایش شد');
      } else {
        await onCreated(payload);
        showToast('پروژه جدید با موفقیت ثبت شد');
      }
      onClose();
    } catch (error) {
      const msg = mode === 'edit' ? 'خطا در ویرایش پروژه' : 'خطا در ثبت پروژه';
      showToast(error?.message || msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = mode === 'edit';
  const Icon = isEdit ? Edit : Plus;
  const title = isEdit ? 'ویرایش پروژه' : 'ثبت پروژه جدید';
  const buttonText = isEdit ? 'ذخیره تغییرات' : 'ثبت پروژه';
  const buttonColor = isEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-600 hover:bg-brand-700';
  const iconBg = isEdit ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-brand-50 dark:bg-brand-900/30';
  const iconColor = isEdit ? 'text-blue-600 dark:text-blue-400' : 'text-brand-600 dark:text-brand-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان پروژه <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: برج آفتاب"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">شهر</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="مثال: تهران"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">متراژ</label>
              <input
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="متر"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">بودجه (ریال)</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="مثلاً 2000000000"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">وضعیت پروژه</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Executor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">مجری</label>
            <input
              type="text"
              value={form.executor}
              onChange={(e) => setForm({ ...form, executor: e.target.value })}
              placeholder="نام مجری پروژه"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors',
                isValid ? buttonColor : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              )}
            >
              {submitting ? (isEdit ? 'در حال ویرایش...' : 'در حال ثبت...') : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}