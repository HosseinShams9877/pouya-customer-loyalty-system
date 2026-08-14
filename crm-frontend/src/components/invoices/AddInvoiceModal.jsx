import { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, CalendarDays } from 'lucide-react';
import { cn } from '../../utils/ui';
import { customerService, invoiceService } from '../../api/api';

export default function AddInvoiceModal({ open, onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: '',
    invoiceNumber: '',
    amount: '',
    paymentType: 'CASH',
    paymentStatus: 'PAID',
    paymentDate: '',
    delayDays: 0,
    source: 'MANUAL',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      customerService.list({ pageSize: 100 }).then(res => setCustomers(res?.data?.items || [])).catch(() => {});
      // prefill today's date as ISO date string
      const today = new Date().toISOString().split('T')[0];
      setForm(prev => ({ ...prev, paymentDate: today }));
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const totalPoints =
    Math.floor(Number(form.amount || 0) / 1000000) +
    (form.paymentType === 'CASH' ? 50 : 0) +
    (form.paymentStatus === 'PAID' && Number(form.delayDays || 0) === 0 ? 20 : 0);

  const isValid = form.customerId && form.amount && Number(form.amount) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const payload = { ...form, source: 'MANUAL' };
      if (form.paymentStatus !== 'PAID') delete payload.paymentDate;
      const res = await invoiceService.create(payload);
      setResult(res?.data?.loyalty || { totalPoints });
      if (onCreated) onCreated(res);
    } catch (err) {
      console.error(err);
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
              <FileText className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ثبت فاکتور دستی</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">MANUAL</span>
                <span className="text-xs text-slate-400">منبع: ورود دستی</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Success State */}
        {result ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-1">فاکتور با موفقیت ثبت شد</h4>
            <p className="text-sm text-emerald-600 mb-4">
              {result.totalPoints?.toLocaleString('fa-IR') || totalPoints.toLocaleString('fa-IR')} امتیاز به مشتری اضافه شد
            </p>
            <div className="bg-emerald-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">امتیاز خرید (هر ۱M ریال = ۱ امتیاز)</span>
                <span className="font-bold text-slate-900">{Math.floor(Number(form.amount) / 1000000).toLocaleString('fa-IR')}</span>
              </div>
              {form.paymentType === 'CASH' && (
                <div className="flex justify-between">
                  <span className="text-slate-600">بن نقدی</span>
                  <span className="font-bold text-emerald-700">+۵۰</span>
                </div>
              )}
              {form.paymentStatus === 'PAID' && Number(form.delayDays) === 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">خوش‌حسابی</span>
                  <span className="font-bold text-emerald-700">+۲۰</span>
                </div>
              )}
              <div className="flex justify-between border-t border-emerald-200 pt-2">
                <span className="font-bold text-slate-900">مجموع امتیاز</span>
                <span className="font-bold text-emerald-700 text-base">
                  {result.totalPoints?.toLocaleString('fa-IR') || totalPoints.toLocaleString('fa-IR')}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setResult(null); onClose(); }}
              className="mt-6 px-6 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
            >بستن</button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Customer */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                انتخاب مشتری <span className="text-red-500">*</span>
              </label>
              <select
                value={form.customerId}
                onChange={e => handleChange('customerId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="">انتخاب مشتری از لیست...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                شماره فاکتور
              </label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={e => handleChange('invoiceNumber', e.target.value)}
                placeholder="INV-1404-XXX"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* 3. Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                مبلغ فاکتور (ریال) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
                placeholder="مثلاً ۴۵۰,۰۰۰,۰۰۰"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* 4. Payment Type — Radio Buttons */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">نوع پرداخت</label>
              <div className="flex gap-3">
                {[
                  { value: 'CASH', label: 'نقدی', desc: 'پرداخت در لحظه' },
                  { value: 'CREDIT', label: 'اعتباری', desc: 'پرداخت شرایطی' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex-1 cursor-pointer rounded-xl border-2 p-3 transition-all text-center',
                      form.paymentType === opt.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={opt.value}
                      checked={form.paymentType === opt.value}
                      onChange={e => handleChange('paymentType', e.target.value)}
                      className="sr-only"
                    />
                    <div className={cn(
                      'text-sm font-bold',
                      form.paymentType === opt.value ? 'text-brand-700' : 'text-slate-700'
                    )}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Payment Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                وضعیت تسویه
              </label>
              <select
                value={form.paymentStatus}
                onChange={e => handleChange('paymentStatus', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="PAID">تسویه شده</option>
                <option value="PENDING">در انتظار</option>
                <option value="OVERDUE">سررسید گذشته</option>
              </select>
            </div>

            {/* 6. Payment Date (if PAID) */}
            {form.paymentStatus === 'PAID' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> تاریخ پرداخت
                  </span>
                </label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={e => handleChange('paymentDate', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  dir="ltr"
                />
              </div>
            )}

            {/* Delay Days (if OVERDUE) */}
            {form.paymentStatus === 'OVERDUE' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">روزهای تأخیر</label>
                <input
                  type="number"
                  value={form.delayDays}
                  onChange={e => handleChange('delayDays', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                  dir="ltr"
                />
              </div>
            )}

            {/* Points Preview */}
            {Number(form.amount) > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 mb-2">پیش‌نمایش امتیاز وفاداری</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">امتیاز خرید</span>
                    <span className="font-medium">{Math.floor(Number(form.amount) / 1000000).toLocaleString('fa-IR')}</span>
                  </div>
                  {form.paymentType === 'CASH' && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">بن نقدی</span>
                      <span className="text-emerald-600 font-medium">+۵۰</span>
                    </div>
                  )}
                  {form.paymentStatus === 'PAID' && Number(form.delayDays) === 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">خوش‌حسابی</span>
                      <span className="text-emerald-600 font-medium">+۲۰</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <span>مجموع</span>
                    <span className="text-brand-700">{totalPoints.toLocaleString('fa-IR')} امتیاز</span>
                  </div>
                </div>
              </div>
            )}

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
              >{submitting ? 'در حال ثبت...' : 'ثبت فاکتور'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
