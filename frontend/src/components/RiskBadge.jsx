import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const configs = {
  LOW: {
    label: 'cattle.low',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
  },
  MEDIUM: {
    label: 'cattle.medium',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
  },
  HIGH: {
    label: 'cattle.high',
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    dot: 'bg-rose-500',
    ping: 'bg-rose-400',
  },
};

export default function RiskBadge({ level = 'LOW', size = 'sm', showPing = false }) {
  const { t } = useTranslation();
  const cfg = configs[level] || configs.LOW;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md border font-semibold tracking-wide uppercase',
        cfg.bg,
        size === 'lg'
          ? 'px-3.5 py-1 text-xs tracking-wider'
          : 'px-2 py-0.5 text-[10px]'
      )}
    >
      <span className="relative flex h-2 w-2">
        {showPing && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              cfg.ping
            )}
          />
        )}
        <span className={clsx('relative inline-flex rounded-full h-2 w-2', cfg.dot)} />
      </span>
      {t(cfg.label)}
    </span>
  );
}
