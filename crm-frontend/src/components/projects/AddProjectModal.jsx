import { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import { cn } from '../../utils/ui';
import { projectService } from '../../api/api';
import { showToast } from '../../utils/toast';

export default function AddProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    city: '',
    area: '',
    executor: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isValid = form.title.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const payload = { title: form.title.trim() };
      if (form.city.trim()) payload.city = form.city.trim();
      if (form.area) payload.area = Number(form.area);
      if (form.executor.trim()) payload.executor = form.executor.trim();
      await projectService.create(payload);
      showToast('پروژه جدید با موفقیت ثبت شد');
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      showToast(err?.message || 'خطا در ثبت پروژه', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">ثبت پروژه جدید</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              نام پروژه <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="مثلاً برج آفتاب"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">شهر</label>
            <input
              type="text"
              value={form.city}
              onChange={e => handleChange('city', e.target.value)}
              placeholder="مثلاً تهران (اختیاری)"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">متراژ (متر مربع)</label>
            <input
              type="number"
              value={form.area}
              onChange={e => handleChange('area', e.target.value)}
              placeholder="مثلاً ۲۵۰۰ (اختیاری)"
              dir="ltr"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Executor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">مجری</label>
            <input
              type="text"
              value={form.executor}
              onChange={e => handleChange('executor', e.target.value)}
              placeholder="نام مجری (اختیاری)"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >انصراف</button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors',
                isValid ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >{submitting ? 'در حال ثبت...' : 'ثبت پروژه'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
