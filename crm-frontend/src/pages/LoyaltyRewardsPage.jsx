import { useEffect, useMemo, useState } from 'react';
import { Gift, Truck, Wallet, Package, Headphones, Zap, Gem, Plus, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { loyaltyAdminService } from '../api/api';
import { PageHeader } from '../components/common/Breadcrumbs';
import { Badge, Button, Card, SkeletonCard } from '../components/common/UI';
import { formatRial, formatDateTime, toFa } from '../utils/ui';
import { showToast } from '../utils/toast';

const icons = { truck: Truck, wallet: Wallet, package: Package, headphones: Headphones, zap: Zap, gem: Gem };
const states = { REQUESTED: ['در انتظار بررسی', 'bg-amber-100 text-amber-700'], APPROVED: ['تأییدشده', 'bg-sky-100 text-sky-700'], FULFILLED: ['تحویل‌شده', 'bg-emerald-100 text-emerald-700'], CANCELLED: ['لغوشده', 'bg-red-100 text-red-700'] };

export default function LoyaltyRewardsPage() {
  const [tab, setTab] = useState('catalog');
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Promise.all([loyaltyAdminService.getRewards(), loyaltyAdminService.getRedemptions()]).then(([a,b]) => { setRewards(a.data || []); setRedemptions(b.data || []); }).finally(() => setLoading(false)); }, []);

  const pending = useMemo(() => redemptions.filter(r => ['REQUESTED', 'APPROVED'].includes(r.status)).length, [redemptions]);
  const updateStatus = async (id, status) => {
    await loyaltyAdminService.updateRedemption(id, { status });
    setRedemptions(list => list.map(item => item.id === id ? { ...item, status } : item));
    showToast(status === 'FULFILLED' ? 'پاداش تحویل‌شده ثبت شد' : 'وضعیت درخواست به‌روزرسانی شد');
  };

  return <div className="space-y-6 animate-fade-in">
    <PageHeader title="پاداش و مصرف امتیاز" subtitle="کاتالوگ مزایا و صف رسیدگی به درخواست‌های اعضا" icon={Gift} actions={<Button icon={Plus}>پاداش جدید</Button>} />
    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
      <Tab active={tab === 'catalog'} onClick={() => setTab('catalog')}>کاتالوگ پاداش‌ها <Badge className="mr-1">{toFa(rewards.length)}</Badge></Tab>
      <Tab active={tab === 'requests'} onClick={() => setTab('requests')}>درخواست‌های دریافت {pending > 0 && <span className="mr-1 min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px]">{toFa(pending)}</span>}</Tab>
    </div>

    {loading ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}</div> : tab === 'catalog' ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rewards.map(reward => {
        const Icon = icons[reward.imageIcon] || Gift;
        return <Card key={reward.id} className="p-5 card-lift relative overflow-hidden">
          {reward.isFeatured && <span className="absolute top-3 left-3 text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full">پیشنهاد ویژه</span>}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-violet-500/20"><Icon className="w-5 h-5" /></div>
          <h3 className="font-black text-slate-900 dark:text-white mt-4">{reward.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-6 mt-2 min-h-12">{reward.description}</p>
          <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div><div className="text-xl font-black text-violet-600 dark:text-violet-300">{toFa(reward.costPoints)}</div><div className="text-[10px] text-slate-400">امتیاز موردنیاز</div></div>
            <div className="text-left"><div className="text-xs font-bold text-slate-700 dark:text-slate-200">{reward.cashValue ? `${formatRial(reward.cashValue)} ریال` : `${toFa(reward.stock ?? '∞')} موجودی`}</div><div className="text-[10px] text-slate-400 mt-1">{toFa(reward.redeemedCount)} بار دریافت</div></div>
          </div>
          {reward.eligibleTier && <div className="mt-3 text-[11px] px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">ویژه اعضای {reward.eligibleTier.title}</div>}
        </Card>;
      })}
    </div> : <Card className="overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[900px]"><thead><tr className="bg-slate-50 dark:bg-slate-800/60">{['کد پیگیری','عضو','پاداش','هزینه','زمان درخواست','وضعیت','اقدام'].map(h => <th key={h} className="text-right p-4 text-xs text-slate-500">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{redemptions.map(r => { const st = states[r.status] || states.REQUESTED; return <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <td className="p-4 font-mono text-xs" dir="ltr">{r.trackingCode}</td><td className="p-4"><b className="text-slate-900 dark:text-white">{r.customer?.fullName}</b><div className="text-xs text-slate-400">{r.customer?.company}</div></td><td className="p-4">{r.reward?.title}</td><td className="p-4 font-black">{toFa(r.pointsCost)} امتیاز</td><td className="p-4 text-xs text-slate-500">{formatDateTime(r.requestedAt)}</td><td className="p-4"><Badge color={st[1]}>{st[0]}</Badge></td>
        <td className="p-4"><div className="flex gap-1">{r.status === 'REQUESTED' && <button onClick={() => updateStatus(r.id, 'APPROVED')} title="تأیید" className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"><CheckCircle2 className="w-4 h-4" /></button>}{r.status === 'APPROVED' && <button onClick={() => updateStatus(r.id, 'FULFILLED')} title="ثبت تحویل" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><Gift className="w-4 h-4" /></button>}{!['FULFILLED','CANCELLED'].includes(r.status) && <button onClick={() => updateStatus(r.id, 'CANCELLED')} title="لغو و برگشت امتیاز" className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><XCircle className="w-4 h-4" /></button>}{r.status === 'FULFILLED' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}{r.status === 'CANCELLED' && <Clock3 className="w-5 h-5 text-slate-400" />}</div></td>
      </tr>; })}</tbody></table></div>
    </Card>}
  </div>;
}

function Tab({ active, children, ...props }) { return <button {...props} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${active ? 'border-brand-500 text-brand-600 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>{children}</button>; }
