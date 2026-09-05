import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Trash2,
  Stethoscope,
  Droplets,
  Calendar,
  Activity,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useCattleStore from '../store/cattleStore';
import RiskBadge from '../components/RiskBadge';
import { useCowName } from '../utils/cowNames';

const MOCK_RISK_TREND = [
  { day: 'Mon', risk: 18, milk: 14.5, scc: 160 },
  { day: 'Tue', risk: 22, milk: 14.2, scc: 180 },
  { day: 'Wed', risk: 35, milk: 13.6, scc: 240 },
  { day: 'Thu', risk: 58, milk: 11.2, scc: 390 },
  { day: 'Fri', risk: 74, milk: 9.8, scc: 520 },
  { day: 'Sat', risk: 86, milk: 8.4, scc: 680 },
  { day: 'Sun', risk: 89, milk: 8.0, scc: 720 },
];

const MOCK_HISTORY = [
  {
    date: '2026-09-02',
    risk: 'HIGH',
    confidence: 89,
    milk: 8.0,
    temp: 40.1,
    scc: 720000,
    diagnosis: 'Acute subclinical mastitis identified in Right Hind quarter. Udder hardness noted.',
  },
  {
    date: '2026-08-30',
    risk: 'MEDIUM',
    confidence: 62,
    milk: 11.5,
    temp: 39.4,
    scc: 390000,
    diagnosis: 'Mild yield drop observed post-evening milking. Post-dip application advised.',
  },
  {
    date: '2026-08-25',
    risk: 'LOW',
    confidence: 15,
    milk: 14.2,
    temp: 38.8,
    scc: 180000,
    diagnosis: 'Routine health screening passed within normal clinical parameters.',
  },
];

export default function CattleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cattle, removeCattle } = useCattleStore();
  const getCowName = useCowName();

  const cow = cattle.find((c) => c.id === id);

  if (!cow) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-16 pb-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Cattle Record Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested cattle identifier does not exist in your registered herd database.
        </p>
        <button
          onClick={() => navigate('/cattle')}
          className="mt-5 btn-primary text-xs py-2 px-4 inline-flex"
        >
          ← Return to Herd Directory
        </button>
      </div>
    );
  }

  const isHigh = cow.riskLevel === 'HIGH';
  const isMed = cow.riskLevel === 'MEDIUM';

  const handleDelete = () => {
    if (window.confirm(`Remove ${getCowName(cow.name)} (${cow.tag}) from herd registry?`)) {
      removeCattle(cow.id);
      toast.success(`${getCowName(cow.name)} record deleted`);
      navigate('/cattle');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Herd List</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/predict')}
            className="btn-primary text-xs py-2 px-3.5 shadow-sm"
          >
            <Stethoscope size={14} />
            <span>Run AI Screening</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1e3a2f] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Cattle Record"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Clinical Profile Banner */}
      <div
        className={`rounded-2xl p-5 sm:p-6 mb-6 border shadow-sm ${
          isHigh
            ? 'bg-gradient-to-r from-rose-900 to-[#1f0d11] text-white border-rose-800'
            : isMed
            ? 'bg-gradient-to-r from-amber-900 to-[#1f160a] text-white border-amber-800'
            : 'bg-gradient-to-r from-[#064e3b] to-[#022c22] text-white border-emerald-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl text-white shadow-inner">
              {isHigh ? <AlertTriangle size={32} /> : <ShieldCheck size={32} />}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  {getCowName(cow.name)}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-white/20 font-bold tracking-wider">
                  {cow.tag}
                </span>
                <RiskBadge level={cow.riskLevel} size="lg" showPing={isHigh} />
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80 mt-1.5 flex-wrap">
                <span className="font-semibold">{cow.breed}</span>
                <span>•</span>
                <span>Age: {cow.age} yrs</span>
                <span>•</span>
                <span>Lactation: Cycle {cow.lactation || 1}</span>
                <span>•</span>
                <span>Days in Milk: {cow.daysInMilk}d</span>
              </div>
            </div>
          </div>

          <div className="sm:text-right shrink-0 bg-white/10 rounded-xl p-3 border border-white/15">
            <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">
              Current Milking Status
            </div>
            <div className="text-2xl font-mono font-bold mt-0.5">
              {cow.milkYield} <span className="text-xs font-normal">L/day</span>
            </div>
            <div className="text-[10px] text-white/60 mt-0.5">Last Checked: {cow.lastChecked}</div>
          </div>
        </div>
      </div>

      {/* Vitals & Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Thermometer size={16} className="text-rose-500" />
            <span>Body Temperature</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isHigh ? '40.1' : '38.6'}
            </span>
            <span className="text-xs text-slate-400 font-mono">°C</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isHigh ? 'Elevated (Clinical Fever)' : 'Normal physiological range'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Droplets size={16} className="text-teal-500" />
            <span>Somatic Cell Count</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isHigh ? '720,000' : '180,000'}
            </span>
            <span className="text-xs text-slate-400 font-mono">cells/mL</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isHigh ? 'High pathogen inflammation' : 'Healthy udder baseline'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Activity size={16} className="text-amber-500" />
            <span>Electrical Conductivity</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isHigh ? '6.8' : '4.8'}
            </span>
            <span className="text-xs text-slate-400 font-mono">mS/cm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isHigh ? 'Ion leak in RH quarter' : 'Balanced milk osmolarity'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Calendar size={16} className="text-emerald-500" />
            <span>Lactation Stage</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {cow.daysInMilk}
            </span>
            <span className="text-xs text-slate-400 font-mono">Days in Milk</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Mid-lactation production window</div>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              7-Day Milk Yield & Mastitis Risk Trajectory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlation between Somatic Cell Count spikes and daily milk production loss
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Daily Milk (L)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">Risk Index (%)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_RISK_TREND}>
              <defs>
                <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
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
                fill="url(#milkGrad)"
              />
              <Area
                type="monotone"
                dataKey="risk"
                stroke="#e11d48"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#riskGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinical Screening History Table */}
      <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={16} className="text-primary-light" />
            <span>Historical Clinical Records & Diagnoses</span>
          </h2>
          <span className="text-xs text-slate-400">Authenticated Records</span>
        </div>

        <div className="space-y-3">
          {MOCK_HISTORY.map((h, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-100 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15] text-xs hover:bg-white dark:hover:bg-[#152a21] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {h.date}
                  </span>
                  <RiskBadge level={h.risk} size="sm" />
                  <span className="text-slate-400">AI Confidence: {h.confidence}%</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-slate-500">
                  <span>Milk: {h.milk}L</span>
                  <span>Temp: {h.temp}°C</span>
                  <span>SCC: {h.scc.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{h.diagnosis}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
