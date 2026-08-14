import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { cn } from '../../utils/ui';
import { leadService } from '../../api/api';
import { showToast } from '../../utils/toast';

const SOURCE_OPTIONS = [
  { value: 'project',   label: 'پروژه ساختمانی' },
  { value: 'representative', label: 'شبکه نمایندگان' },
  { value: 'direct_call', label: 'تماس مستقیم' },
  { value: 'walk_in',   label: 'حضوری' },
  { value: 'website',   label: 'وب‌سایت' },
  { value: 'call',      label: 'تماس' },
  { value: 'instagram', label: 'اینستاگرام' },
  { value: 'referral',  label: 'معرفی' },
];

export default function AddLeadModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    company: '',
    source: 'project',
    customerType: 'CONTRACTOR',
    province: '',
    estimatedValue: '',
    expectedDecisionAt: '',
    productType: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isValid = form.fullName.trim() && form.mobile.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.company) delete payload.company;
      if (!payload.productType) delete payload.productType;
      if (!payload.description) delete payload.description;
      if (!payload.province) delete payload.province;
      if (!payload.expectedDecisionAt) delete payload.expectedDecisionAt;
      if (!payload.estimatedValue) delete payload.estimatedValue;
      await leadService.create(payload);
      showToast('سرنخ جدید با موفقیت ثبت شد');
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      showToast(err?.message || 'خطا در ثبت سرنخ', 'error');
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
              <UserPlus className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">ثبت سرنخ جدید</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => handleChange('fullName', e.target.value)}
              placeholder="نام مشتری"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              موبایل <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => handleChange('mobile', e.target.value)}
              placeholder="09121234567"
              dir="ltr"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">شرکت</label>
            <input
              type="text"
              value={form.company}
              onChange={e => handleChange('company', e.target.value)}
              placeholder="نام شرکت (اختیاری)"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Source */}
          <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">منبع سرنخ</label>
            <select
              value={form.source}
              onChange={e => handleChange('source', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              {SOURCE_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع مشتری</label>
            <select value={form.customerType} onChange={e => handleChange('customerType', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="CONTRACTOR">پیمانکار</option><option value="REPRESENTATIVE">نماینده</option><option value="MASS_BUILDER">انبوه‌ساز</option><option value="MATERIAL_STORE">مصالح‌فروش</option><option value="DIRECT">مشتری مستقیم</option>
            </select>
          </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">استان</label><input value={form.province} onChange={e => handleChange('province', e.target.value)} placeholder="مثلاً کرمان" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">ارزش برآوردی (ریال)</label><input type="number" min="0" value={form.estimatedValue} onChange={e => handleChange('estimatedValue', e.target.value)} placeholder="مثلاً ۸۰۰۰۰۰۰۰۰" dir="ltr" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"/></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">تاریخ تصمیم احتمالی مشتری</label>
            <input type="date" value={form.expectedDecisionAt} onChange={e => handleChange('expectedDecisionAt', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"/>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع محصول</label>
            <input
              type="text"
              value={form.productType}
              onChange={e => handleChange('productType', e.target.value)}
              placeholder="مثلاً یونولیت سقفی (اختیاری)"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">توضیحات</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="توضیحات تکمیلی (اختیاری)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:ring-2 focus:ring-brand-500 outline-none"
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
            >{submitting ? 'در حال ثبت...' : 'ثبت سرنخ'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
