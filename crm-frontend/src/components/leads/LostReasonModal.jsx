import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/ui';

const LOST_REASONS = [
  { value: 'PRICE', label: 'قیمت بالا' },
  { value: 'PAYMENT_TERMS', label: 'شرایط پرداخت' },
  { value: 'COMPETITOR', label: 'خرید از رقیب' },
  { value: 'MARKET_DROP', label: 'کاهش ساخت‌وساز' },
  { value: 'OTHER', label: 'سایر' },
];

export default function LostReasonModal({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [compPrice, setCompPrice] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isValid = reason && compPrice && Number(compPrice) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onSubmit({ lostReason: reason, competitorPrice: Number(compPrice), competitorName: competitorName.trim() || null });
      setReason(''); setCompPrice(''); setCompetitorName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ثبت دلیل باخت</h3>
              <p className="text-xs text-slate-500">این اطلاعات برای بهبود فرآیند فروش ثبت می‌شود</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">دلیل باخت <span className="text-red-500">*</span></label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className={cn('w-full px-3 py-2.5 rounded-lg border text-sm', !reason ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white')}>
              <option value="">انتخاب کنید...</option>
              {LOST_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">نام رقیب <span className="text-slate-400 text-xs">(در صورت اطلاع)</span></label>
            <input value={competitorName} onChange={e => setCompetitorName(e.target.value)} placeholder="مثلاً تولیدکننده یا فروشنده رقیب"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">قیمت رقیب (ریال) <span className="text-red-500">*</span></label>
            <input type="number" value={compPrice} onChange={e => setCompPrice(e.target.value)} placeholder="مثلاً ۳۰۰,۰۰۰,۰۰۰"
              className={cn('w-full px-3 py-2.5 rounded-lg border text-sm font-mono', !compPrice ? 'border-slate-200' : 'border-slate-200 bg-white')}
              dir="ltr" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">انصراف</button>
            <button type="submit" disabled={!isValid || submitting}
              className={cn('flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors',
                isValid ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>
              {submitting ? 'در حال ثبت...' : 'تایید و انتقال به ناموفق'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
