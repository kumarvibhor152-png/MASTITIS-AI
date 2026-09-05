import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RiskBadge from './RiskBadge';
import { Droplets, Calendar, AlertCircle, ChevronRight, Activity, ShieldCheck } from 'lucide-react';
import { useCowName } from '../utils/cowNames';

// Breed badge colors and styling
const breedBadges = {
  Gir: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
  Sahiwal: 'bg-teal-100/70 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40',
  Murrah: 'bg-indigo-100/70 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
  'HF Cross': 'bg-sky-100/70 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
  Jersey: 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
};

export default function CattleCard({ cow }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const getCowName = useCowName();

  const isHighRisk = cow.riskLevel === 'HIGH';
  const isMedRisk = cow.riskLevel === 'MEDIUM';

  return (
    <div
      onClick={() => navigate(`/cattle/${cow.id}`)}
      className={`group bg-white dark:bg-[#11221b] rounded-xl border p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer ${
        isHighRisk
          ? 'border-rose-300/80 dark:border-rose-800/60 bg-gradient-to-r from-rose-50/30 to-white dark:from-rose-950/20 dark:to-[#11221b]'
          : isMedRisk
          ? 'border-amber-300/70 dark:border-amber-800/50'
          : 'border-slate-200/80 dark:border-[#1e3a2f]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Livestock Profile Emblem */}
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 font-bold text-sm shadow-sm transition-transform group-hover:scale-105 ${
              isHighRisk
                ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
                : isMedRisk
                ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
            }`}
          >
            {isHighRisk ? (
              <AlertCircle size={22} className="text-rose-600 dark:text-rose-400" />
            ) : isMedRisk ? (
              <Activity size={22} className="text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-400" />
            )}
          </div>

          {/* Cattle Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate group-hover:text-primary-light transition-colors">
                {getCowName(cow.name)}
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700">
                {cow.tag}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  breedBadges[cow.breed] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {cow.breed}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {cow.age} yrs • Lact {cow.lactation || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Badge & Navigation Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <RiskBadge level={cow.riskLevel} showPing={isHighRisk} />
          <ChevronRight
            size={18}
            className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </div>

      {/* Metric Chips */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-[#1e3a2f] text-xs">
        <div className="bg-slate-50 dark:bg-[#0d1a15] rounded-lg p-2 border border-slate-100 dark:border-[#1e3a2f]/60">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">
            <Droplets size={11} className="text-teal-500" />
            <span>Daily Yield</span>
          </div>
          <div className="mt-1 font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">
            {cow.milkYield} <span className="text-[11px] font-normal text-slate-400">L/d</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#0d1a15] rounded-lg p-2 border border-slate-100 dark:border-[#1e3a2f]/60">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">
            <Calendar size={11} className="text-emerald-500" />
            <span>Lactation</span>
          </div>
          <div className="mt-1 font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">
            {cow.daysInMilk} <span className="text-[11px] font-normal text-slate-400">DIM</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#0d1a15] rounded-lg p-2 border border-slate-100 dark:border-[#1e3a2f]/60">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">
            <Activity size={11} className="text-sky-500" />
            <span>Status</span>
          </div>
          <div className="mt-1 font-bold text-slate-800 dark:text-slate-100 font-mono text-xs truncate">
            {isHighRisk ? 'Immediate Check' : isMedRisk ? 'Watchlist' : 'Optimal'}
          </div>
        </div>
      </div>

      {/* Clinical Warning Bar if High Risk */}
      {isHighRisk && (
        <div className="mt-3 bg-rose-100/80 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="text-xs text-rose-800 dark:text-rose-200 font-semibold truncate">
              Acute Mastitis Risk Detected — Immediate Isolation & Vet Exam
            </span>
          </div>
          <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold underline shrink-0">
            View Protocol
          </span>
        </div>
      )}
    </div>
  );
}
