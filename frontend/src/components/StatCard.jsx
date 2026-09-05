import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

export default function StatCard({
  icon: Icon = Activity,
  label,
  value,
  unit,
  trend,
  trendVal,
  color = 'primary',
  subtitle,
  onClick,
}) {
  const colorStyles = {
    primary: {
      bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      ring: 'group-hover:ring-emerald-500/10',
    },
    danger: {
      bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
      border: 'hover:border-rose-300 dark:hover:border-rose-700',
      ring: 'group-hover:ring-rose-500/10',
    },
    warm: {
      bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      border: 'hover:border-amber-300 dark:hover:border-amber-700',
      ring: 'group-hover:ring-amber-500/10',
    },
    blue: {
      bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
      border: 'hover:border-teal-300 dark:hover:border-teal-700',
      ring: 'group-hover:ring-teal-500/10',
    },
  };

  const currentTheme = colorStyles[color] || colorStyles.primary;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'group bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all duration-200',
        onClick ? 'cursor-pointer active:scale-[0.99]' : '',
        currentTheme.border
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105', currentTheme.bg)}>
          {React.isValidElement(Icon) ? (
            Icon
          ) : typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && (Icon.$$typeof || Icon.render)) ? (
            <Icon size={20} strokeWidth={2} />
          ) : typeof Icon === 'string' ? (
            <span className="text-base font-bold">{Icon}</span>
          ) : null}
        </div>
        {trend !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md',
              trend > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40'
                : trend < 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/40'
                : 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span>{trendVal}</span>
          </div>
        )}
      </div>

      <div className="mt-3.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white metric-value tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          )}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          {label}
        </div>
        {subtitle && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
