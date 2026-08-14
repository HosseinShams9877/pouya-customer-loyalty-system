import { useEffect, useMemo, useState } from 'react';
import { Target, UsersRound, UserPlus, Repeat2, BadgeCheck, Plus, ArrowUpLeft, Activity } from 'lucide-react';
import { loyaltyAdminService } from '../api/api';
import { PageHeader } from '../components/common/Breadcrumbs';
import { Badge, Button, Card, SkeletonCard } from '../components/common/UI';
import { toFa } from '../utils/ui';

const missionIcons = { PURCHASE_COUNT: Repeat2, PURCHASE_AMOUNT: Target, REFERRAL: UserPlus, PROFILE: BadgeCheck };

export default function LoyaltyEngagementPage() {
  const [tab, setTab] = useState('missions');
  const [missions, setMissions] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([loyaltyAdminService.getMissions(), loyaltyAdminService.getSegments()]).then(([a,b]) => { setMissions(a.data || []); setSegments(b.data || []); }).finally(() => setLoading(false)); }, []);

  const participation = useMemo(() => missions.reduce((s,m) => s + Number(m._count?.participants || 0), 0), [missions]);
  return <div className="space-y-6 animate-fade-in">
    <PageHeader title="تعامل و شخصی‌سازی" subtitle="مأموریت‌های انگیزشی و بخش‌بندی هوشمند اعضا" icon={Target} actions={<Button icon={Plus}>{tab === 'missions' ? 'مأموریت جدید' : 'بخش جدید'}</Button>} />

    <div className="grid sm:grid-cols-3 gap-3">
      <QuickStat icon={Target} value={toFa(missions.length)} label="مأموریت فعال" color="violet" />
      <QuickStat icon={Activity} value={toFa(participation)} label="مشارکت ثبت‌شده" color="emerald" />
      <QuickStat icon={UsersRound} value={toFa(segments.length)} label="بخش هدف" color="sky" />
    </div>
    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800"><Tab active={tab === 'missions'} onClick={() => setTab('missions')}>مأموریت‌ها</Tab><Tab active={tab === 'segments'} onClick={() => setTab('segments')}>بخش‌های مشتری</Tab></div>

    {loading ? <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i}/>)}</div> : tab === 'missions' ? <div className="grid md:grid-cols-2 gap-4">{missions.map(m => {
      const Icon = missionIcons[m.actionType] || Target;
      const progress = Number(m.participants?.[0]?.progress || 0);
      const pct = Math.min(100, Math.round(progress / Number(m.targetValue || 1) * 100));
      return <Card key={m.id} className="p-5 card-lift">
        <div className="flex gap-3"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20"><Icon className="w-5 h-5"/></div><div className="flex-1"><div className="flex justify-between gap-2"><h3 className="font-black text-slate-900 dark:text-white">{m.title}</h3><Badge color="bg-emerald-100 text-emerald-700">فعال</Badge></div><p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-6">{m.description}</p></div></div>
        <div className="mt-5"><div className="flex justify-between text-xs mb-2"><span className="text-slate-400">نمونه پیشرفت عضو</span><b className="text-violet-600">{toFa(pct)}٪</b></div><div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }}/></div></div>
        <div className="grid grid-cols-3 gap-2 mt-4"><Fact label="هدف" value={toFa(m.targetValue)} /><Fact label="پاداش" value={`${toFa(m.rewardPoints)} امتیاز`} /><Fact label="مشارکت" value={toFa(m._count?.participants || 0)} /></div>
      </Card>;
    })}</div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{segments.map(segment => <Card key={segment.id} className="p-5 card-lift">
      <div className="flex items-center justify-between"><div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: segment.color }}><UsersRound className="w-5 h-5"/></div><Badge>{segment.isDynamic ? 'پویا' : 'دستی'}</Badge></div>
      <h3 className="font-black text-slate-900 dark:text-white mt-4">{segment.title}</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-6 min-h-12">{segment.description}</p>
      <div className="mt-4 flex items-end justify-between"><div><div className="text-3xl font-black" style={{ color: segment.color }}>{toFa(segment.memberCount || 0)}</div><div className="text-[10px] text-slate-400">عضو در این بخش</div></div><button className="text-xs font-bold text-brand-600 flex items-center gap-1">ساخت پیشنهاد <ArrowUpLeft className="w-3.5 h-3.5"/></button></div>
      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800"><div className="text-[10px] text-slate-400 mb-1">معیار عضویت</div><code className="text-[10px] text-slate-600 dark:text-slate-300 break-all" dir="ltr">{JSON.stringify(segment.criteria)}</code></div>
    </Card>)}</div>}
  </div>;
}

function Tab({ active, children, ...props }) { return <button {...props} className={`px-4 py-3 text-sm font-bold border-b-2 ${active ? 'border-brand-500 text-brand-600 dark:text-brand-300' : 'border-transparent text-slate-500'}`}>{children}</button>; }
function Fact({ label, value }) { return <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-[10px] text-slate-400">{label}</div><div className="text-xs font-black text-slate-800 dark:text-white mt-1">{value}</div></div>; }
function QuickStat({ icon: Icon, value, label, color }) { const c = { violet:'bg-violet-50 text-violet-600 dark:bg-violet-900/30', emerald:'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30', sky:'bg-sky-50 text-sky-600 dark:bg-sky-900/30' }[color]; return <Card className="p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c}`}><Icon className="w-4 h-4"/></div><div><div className="text-xl font-black text-slate-900 dark:text-white">{value}</div><div className="text-xs text-slate-400">{label}</div></div></Card>; }
