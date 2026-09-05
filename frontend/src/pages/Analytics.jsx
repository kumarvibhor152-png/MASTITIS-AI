import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Droplets,
  IndianRupee,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';
import useCattleStore from '../store/cattleStore';

const generateMilkData = (days) => {
  const data = [];
  const now = new Date();
  let baseYield = 94;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    baseYield += (Math.random() - 0.46) * 3;
    baseYield = Math.max(78, Math.min(118, baseYield));
    data.push({
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      milk: parseFloat(baseYield.toFixed(1)),
      benchmark: 90,
    });
  }
  return data;
};

const HERD_SCORE_DATA = [
  { week: 'Wk 1', score: 78, sccScore: 82 },
  { week: 'Wk 2', score: 74, sccScore: 80 },
  { week: 'Wk 3', score: 70, sccScore: 75 },
  { week: 'Wk 4', score: 81, sccScore: 86 },
  { week: 'Wk 5', score: 84, sccScore: 88 },
  { week: 'Wk 6', score: 82, sccScore: 85 },
  { week: 'Wk 7', score: 88, sccScore: 92 },
  { week: 'Wk 8', score: 91, sccScore: 94 },
];

const ECONOMIC_BREAKDOWN = [
  { category: 'Veterinary Antibiotic Savings', amount: '₹18,500', desc: 'Elimination of clinical intramammary infusions' },
  { category: 'Preserved Milk Production', amount: '₹14,200', desc: 'Zero milk discards during antibiotic withdrawal' },
  { category: 'Teat Tissue Longevity', amount: '₹8,000', desc: 'Avoided permanent quarter loss / blind teats' },
];

export default function Analytics() {
  const { t } = useTranslation();
  const { cattle } = useCattleStore();
  const [range, setRange] = useState(7);

  const milkData = generateMilkData(range);
  const totalMilk = cattle.reduce((sum, c) => sum + (c.milkYield * 30), 0).toFixed(0);
  const atRisk = cattle.filter((c) => c.riskLevel === 'HIGH').length;
  const avgYield = (cattle.reduce((s, c) => s + c.milkYield, 0) / (cattle.length || 1)).toFixed(1);
  const estimatedSaved = (atRisk * 2 * 14000 + 12000).toLocaleString('en-IN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-light">
              Herd Performance Analytics
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-medium">Yield & Economic Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {t('analytics.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive production trajectory, Somatic Cell compliance trends, and cost avoidance ledger
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex bg-slate-100 dark:bg-[#11221b] p-1 rounded-xl border border-slate-200 dark:border-[#1e3a2f] self-start sm:self-auto">
          {[
            { val: 7, label: t('analytics.days7') },
            { val: 30, label: t('analytics.days30') },
            { val: 90, label: t('analytics.days90') },
          ].map((r) => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r.val
                  ? 'bg-white dark:bg-[#1b382c] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Estimated Savings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
            ₹{estimatedSaved}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Avoided antibiotic & milk dump costs</div>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Average Daily Yield</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Droplets size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {avgYield} <span className="text-sm font-normal text-slate-400">L/cow</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            +5.2% vs district cooperative avg
          </div>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Monthly Production</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {totalMilk} <span className="text-sm font-normal text-slate-400">L</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Estimated 30-day milk collection</div>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Herd Health Index</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            91.4%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Somatic cell compliance score</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Daily Production Curve (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Herd Milk Output & Baseline Trajectory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total aggregate daily volume vs expected baseline capacity
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-600 dark:text-slate-300">Daily Milk (L)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-slate-400">Benchmark (90L)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={milkData}>
                <defs>
                  <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="milk"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#yieldGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Score Trajectory (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Weekly Herd Health Index
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">8-Week Somatic Cell Quality Metric</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HERD_SCORE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="score" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Economic Value Ledger */}
      <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Financial Protection & Veterinary Cost Avoidance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified savings achieved through 48-hour early predictive detection
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
            Total Saved: ₹40,700
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {ECONOMIC_BREAKDOWN.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-100 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15] text-xs"
            >
              <div className="text-slate-500 dark:text-slate-400 font-semibold">
                {item.category}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1.5">
                {item.amount}
              </div>
              <div className="text-slate-400 dark:text-slate-500 text-[11px] mt-1 leading-relaxed">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
