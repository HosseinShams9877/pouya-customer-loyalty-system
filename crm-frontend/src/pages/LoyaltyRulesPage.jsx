import { useEffect, useState } from 'react';
import { SlidersHorizontal, ShoppingCart, Banknote, Trophy, Percent, Plus, Layers3 } from 'lucide-react';
import { loyaltyAdminService } from '../api/api';
import { PageHeader } from '../components/common/Breadcrumbs';
import { Badge, Button, Card, SkeletonCard } from '../components/common/UI';
import { formatRial, toFa } from '../utils/ui';
import { showToast } from '../utils/toast';

const eventMeta = { PURCHASE: [ShoppingCart, 'خرید', 'sky'], INVOICE_PAID: [Banknote, 'پرداخت فاکتور', 'emerald'], TIER_CHANGED: [Trophy, 'تغییر سطح', 'amber'], REFERRAL: [Layers3, 'معرفی', 'violet'] };
const eventColors = { sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30', violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30' };

export default function LoyaltyRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loyaltyAdminService.getRules().then(r => setRules(r.data || [])).finally(() => setLoading(false)); }, []);
  const toggle = async rule => { const isActive = !rule.isActive; await loyaltyAdminService.updateRule(rule.id, { isActive }); setRules(list => list.map(r => r.id === rule.id ? { ...r, isActive } : r)); showToast(isActive ? 'قانون فعال شد' : 'قانون غیرفعال شد'); };

  return <div className="space-y-6 animate-fade-in">
    <PageHeader title="موتور قوانین وفاداری" subtitle="امتیاز و کش‌بک خودکار، قابل توضیح و قابل کنترل" icon={SlidersHorizontal} actions={<Button icon={Plus}>قانون جدید</Button>} />
    <div className="rounded-2xl p-4 border border-sky-100 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/30 flex items-start gap-3"><Percent className="w-5 h-5 text-sky-600 shrink-0 mt-0.5"/><div><h3 className="text-sm font-bold text-sky-900 dark:text-sky-200">قانون خوب باید برای عضو قابل فهم باشد</h3><p className="text-xs text-sky-700/80 dark:text-sky-300/70 mt-1 leading-6">اولویت از عدد کمتر به بیشتر اجرا می‌شود. قوانین «تجمیعی» می‌توانند هم‌زمان روی یک رویداد اعمال شوند و سقف پاداش از هزینه ناخواسته جلوگیری می‌کند.</p></div></div>
    {loading ? <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i}/>)}</div> : <div className="grid md:grid-cols-2 gap-4">{rules.map(rule => {
      const [Icon, eventLabel, color] = eventMeta[rule.eventType] || eventMeta.PURCHASE;
      return <Card key={rule.id} className={`p-5 transition-opacity ${rule.isActive ? '' : 'opacity-55'}`}>
        <div className="flex items-start gap-3"><div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${eventColors[color]}`}><Icon className="w-5 h-5"/></div><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-black text-slate-900 dark:text-white">{rule.title}</h3><Badge>{eventLabel}</Badge></div><p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-6">{rule.description}</p></div><button onClick={() => toggle(rule)} className={`w-11 h-6 rounded-full p-1 transition-colors ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} aria-label="فعال یا غیرفعال کردن"><span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.isActive ? '-translate-x-5' : ''}`}/></button></div>
        <div className="grid grid-cols-3 gap-2 mt-5"><RuleFact label="شرط" value={conditionText(rule.conditions)} /><RuleFact label="پاداش" value={actionText(rule.action)} /><RuleFact label="اولویت" value={toFa(rule.priority)} /></div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><code className="font-mono" dir="ltr">{rule.code}</code><span>{rule.stackable ? 'قابل تجمیع' : 'غیرقابل تجمیع'}</span></div>
      </Card>;
    })}</div>}
  </div>;
}

function conditionText(c = {}) { if (!Object.keys(c).length) return 'همه تراکنش‌ها'; if (c.paymentType === 'CASH' && c.tierCodes) return `نقدی + ${c.tierCodes.join('/')}`; if (c.paymentType === 'CASH') return 'پرداخت نقدی'; if (c.minAmount) return `حداقل ${formatRial(c.minAmount)} ریال`; return 'شرط ترکیبی'; }
function actionText(a = {}) { if (a.type === 'POINTS_PER_AMOUNT') return `۱ امتیاز / ${formatRial(a.rialPerPoint)} ریال`; if (a.type === 'POINTS_FIXED') return `${toFa(a.value)} امتیاز`; if (a.type === 'CASHBACK_PERCENT') return `${toFa(a.value)}٪ کش‌بک`; return 'پاداش خودکار'; }
function RuleFact({ label, value }) { return <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 min-w-0"><div className="text-[10px] text-slate-400">{label}</div><div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={value}>{value}</div></div>; }
