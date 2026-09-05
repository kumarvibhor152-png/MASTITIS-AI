import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Bell,
  Settings,
  Plus,
  Stethoscope,
  AlertTriangle,
  PhoneCall,
  Activity,
  Droplets,
  Layers,
  Thermometer,
  ShieldCheck,
  Radio,
  Wind,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCattleStore from '../store/cattleStore';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { useCowName } from '../utils/cowNames';

const RECENT_CLINICAL_EVENTS = [
  { id: 1, cow: 'Lakshmi', tag: 'GJ-002', action: 'Elevated SCC & Temp (40.1°C)', time: '1h ago', level: 'HIGH', icon: AlertTriangle },
  { id: 2, cow: 'Parvati', tag: 'GJ-006', action: 'Right Hind Quarter EC > 6.4 mS/cm', time: '3h ago', level: 'HIGH', icon: AlertTriangle },
  { id: 3, cow: 'Kamdhenu', tag: 'GJ-003', action: 'Subclinical Watchlist Flagged', time: '5h ago', level: 'MEDIUM', icon: Activity },
  { id: 4, cow: 'Ganga', tag: 'GJ-001', action: 'Milking session verified healthy (14.5L)', time: '8h ago', level: 'LOW', icon: CheckCircle2 },
  { id: 5, cow: 'Meera', tag: 'GJ-007', action: 'Yield recorded: 20.0 L/day (Peak)', time: '1d ago', level: 'LOW', icon: Droplets },
];

// 4-Quarter Udder Sample Readings for Parlor Preview
const QUARTER_TELEMETRY = [
  { id: 'LF', name: 'Left Front', ec: '4.8', status: 'Optimal', normal: true },
  { id: 'RF', name: 'Right Front', ec: '5.1', status: 'Optimal', normal: true },
  { id: 'LH', name: 'Left Hind', ec: '5.4', status: 'Watchlist', normal: false, warning: true },
  { id: 'RH', name: 'Right Hind', ec: '6.8', status: 'High EC Spike', normal: false, danger: true },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cattle } = useCattleStore();
  const getCowName = useCowName();

  const [greeting, setGreeting] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('dashboard.goodMorning'));
    else if (hour < 17) setGreeting(t('dashboard.goodAfternoon'));
    else setGreeting(t('dashboard.goodEvening'));
  }, [t]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const totalCattle = cattle.length;
  const atRisk = cattle.filter((c) => c.riskLevel === 'HIGH').length;
  const watchful = cattle.filter((c) => c.riskLevel === 'MEDIUM').length;
  const safe = cattle.filter((c) => c.riskLevel === 'LOW').length;
  const totalMilk = cattle.reduce((sum, c) => sum + (c.milkYield || 0), 0).toFixed(1);

  const pieData = [
    { name: t('dashboard.safe'), value: safe, color: '#059669' },
    { name: t('dashboard.watchful'), value: watchful, color: '#d97706' },
    { name: t('dashboard.danger'), value: atRisk, color: '#e11d48' },
  ].filter((d) => d.value > 0);

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-light">
              {user?.farmName || 'Surabhi Dairy Farm'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-medium">Anand, Gujarat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {t('dashboard.greeting')}, {user?.name?.split(' ')[0] || 'Farmer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {greeting} — Real-time herd health & milking telemetry overview
          </p>
        </div>

        {/* Quick Action Top Right */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/predict')}
            className="btn-primary text-xs py-2.5 px-4 shadow-sm"
          >
            <Stethoscope size={15} />
            <span>AI Risk Screening</span>
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="relative p-2.5 rounded-xl bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:border-primary-light transition-all shadow-sm"
            title="Clinical Alerts"
          >
            <Bell size={18} />
            {atRisk > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#11221b]">
                {atRisk}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barn Climate & Telemetry Alert Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#043e2f] to-[#022c22] rounded-2xl p-4 sm:p-5 mb-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
              <Thermometer size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-emerald-200">
                  Barn Microclimate Sensor #01
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  THI Index: 76 (Mild Heat Stress)
                </span>
              </div>
              <div className="text-sm sm:text-base font-semibold text-white/95 mt-0.5">
                28.5°C • 62% Humidity • Optimal Milking Window: 05:00 - 08:30
              </div>
              <div className="text-xs text-white/75 mt-0.5">
                Maintain cooling mist & clean drinking troughs to prevent summer somatic cell elevation.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div className="text-right">
              <div className="text-xs text-white/70 font-medium">{dateStr}</div>
              <div className="text-xl font-mono font-bold">{timeStr}</div>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-emerald-200 font-semibold">
              <Radio size={13} className="text-emerald-400 animate-pulse" />
              <span>Telemetry Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={Layers}
          label={t('dashboard.totalCattle')}
          value={totalCattle}
          unit="Head"
          color="primary"
          trend={1}
          trendVal="+2 this mo"
          onClick={() => navigate('/cattle')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Clinical High Risk"
          value={atRisk}
          unit="Urgent"
          color="danger"
          subtitle="Requires immediate isolation"
          onClick={() => navigate('/alerts')}
        />
        <StatCard
          icon={Activity}
          label="Subclinical Watchlist"
          value={watchful}
          unit="48h Risk"
          color="warm"
          subtitle="CMT check recommended"
          onClick={() => navigate('/cattle')}
        />
        <StatCard
          icon={Droplets}
          label={t('dashboard.milkYield')}
          value={totalMilk}
          unit="L/day"
          color="blue"
          trend={1}
          trendVal="+4.2% wk"
          onClick={() => navigate('/analytics')}
        />
      </div>

      {/* Main Operational Sections: 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left Column (7 cols): Quick Actions + 4-Quarter Diagnostics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Action Matrix */}
          <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-primary-light" />
                <span>Diagnostic & Care Actions</span>
              </h2>
              <span className="text-xs text-slate-400">Quick Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: Plus,
                  label: t('dashboard.addCow'),
                  sub: 'Register tag',
                  color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40',
                  action: () => navigate('/cattle'),
                },
                {
                  icon: Stethoscope,
                  label: t('dashboard.checkRisk'),
                  sub: 'Run AI diagnostic',
                  color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/40',
                  action: () => navigate('/predict'),
                },
                {
                  icon: AlertTriangle,
                  label: t('dashboard.viewAlerts'),
                  sub: `${atRisk} urgent alerts`,
                  color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/40',
                  action: () => navigate('/alerts'),
                },
                {
                  icon: PhoneCall,
                  label: t('dashboard.callVet'),
                  sub: '1962 Toll Free',
                  color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40',
                  action: () => window.open('tel:1962'),
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={item.action}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15] hover:bg-white dark:hover:bg-[#152a21] hover:shadow-sm text-left transition-all duration-150 active:scale-95 group"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${item.color}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {item.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DeLaval-Inspired 4-Quarter Udder Diagnostic Map */}
          <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-teal-600" />
                  <span>4-Quarter Udder Conductivity Matrix</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Milking Parlor In-Line Conductivity (mS/cm) & Subclinical Detection
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Cow: Lakshmi (GJ-002)
              </span>
            </div>

            {/* 4 Quarters Anatomical Grid */}
            <div className="grid grid-cols-2 gap-3.5 max-w-lg mx-auto p-4 bg-slate-50 dark:bg-[#0d1a15] rounded-xl border border-slate-200/60 dark:border-[#1e3a2f]">
              {QUARTER_TELEMETRY.map((q) => (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    q.danger
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
                      : q.warning
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-[#11221b] border-slate-200 dark:border-[#1e3a2f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      {q.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        q.danger
                          ? 'bg-rose-200/80 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                          : q.warning
                          ? 'bg-amber-200/80 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{q.name}</div>
                  <div className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {q.ec} <span className="text-xs font-normal text-slate-400">mS/cm</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-[#1e3a2f]">
              <span className="text-[11px]">Healthy baseline: &lt; 5.5 mS/cm | Mastitis threshold: &gt; 6.2 mS/cm</span>
              <button
                onClick={() => navigate('/predict')}
                className="text-primary-light font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full Udder Scan</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Herd Health Distribution + Recent Triage */}
        <div className="lg:col-span-5 space-y-6">
          {/* Health Tier Donut Breakdown */}
          <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Herd Health Distribution
              </h2>
              <span className="text-xs font-bold font-mono text-slate-500">
                {totalCattle} Cows
              </span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with exact numbers */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#059669]" />
                  <span className="text-slate-600 dark:text-slate-300">Healthy (Low Risk):</span>
                  <strong className="font-mono text-slate-900 dark:text-white ml-auto">
                    {safe}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#d97706]" />
                  <span className="text-slate-600 dark:text-slate-300">Subclinical (Watchlist):</span>
                  <strong className="font-mono text-slate-900 dark:text-white ml-auto">
                    {watchful}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#e11d48]" />
                  <span className="text-slate-600 dark:text-slate-300">Clinical (High Risk):</span>
                  <strong className="font-mono text-slate-900 dark:text-white ml-auto">
                    {atRisk}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Activity Stream */}
          <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Clinical Stream
              </h2>
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs text-primary-light font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {RECENT_CLINICAL_EVENTS.map((event) => {
                const Icon = event.icon;
                return (
                  <div
                    key={event.id}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15] text-xs hover:bg-white dark:hover:bg-[#152a21] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          event.level === 'HIGH'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : event.level === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {event.cow}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {event.tag}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 truncate">
                          {event.action}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {event.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
