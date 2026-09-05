import { useTranslation } from 'react-i18next';
import RiskBadge from './RiskBadge';
import { Clock, CheckCircle2, AlertTriangle, Activity, ShieldCheck, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useCowName } from '../utils/cowNames';

export default function AlertItem({ alert, onAction }) {
  const { t } = useTranslation();
  const getCowName = useCowName();

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const isHigh = alert.riskLevel === 'HIGH';
  const isMed = alert.riskLevel === 'MEDIUM';

  return (
    <div
      className={`bg-white dark:bg-[#11221b] rounded-xl shadow-card p-4 sm:p-5 border transition-all duration-200 ${
        isHigh
          ? 'border-l-4 border-l-rose-500 border-slate-200/80 dark:border-[#1e3a2f]'
          : isMed
          ? 'border-l-4 border-l-amber-500 border-slate-200/80 dark:border-[#1e3a2f]'
          : 'border-l-4 border-l-emerald-500 border-slate-200/80 dark:border-[#1e3a2f]'
      } ${alert.resolved ? 'opacity-65' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
              isHigh
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40'
                : isMed
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/40'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40'
            }`}
          >
            {isHigh ? (
              <AlertTriangle size={20} />
            ) : isMed ? (
              <Activity size={20} />
            ) : (
              <ShieldCheck size={20} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-start">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {getCowName(alert.cowName)}
              </span>
              <RiskBadge level={alert.riskLevel} size="sm" showPing={isHigh && !alert.resolved} />
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              {alert.message}
            </p>

            <div className="flex items-center gap-1.5 mt-2.5 text-slate-400 dark:text-slate-500 text-xs">
              <Clock size={12} />
              <span>{timeAgo(alert.createdAt)}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Category: {alert.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!alert.resolved && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex gap-2">
          <button
            onClick={() => onAction && onAction(alert)}
            className="flex-1 bg-primary hover:bg-primary-light text-white text-xs font-semibold py-2.5 px-4 rounded-xl active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ClipboardCheck size={15} />
            <span>{t('alerts.action')}</span>
          </button>
        </div>
      )}

      {alert.resolved && (
        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-[#1e3a2f]">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={15} />
            <span>{t('alerts.takenAction')}</span>
          </div>
          <button
            type="button"
            onClick={() => onAction && onAction(alert)}
            className="text-xs text-primary-light hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View Action Plan</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
