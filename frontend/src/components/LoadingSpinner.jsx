import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = true, text }) {
  const { t } = useTranslation();

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-[3px] border-emerald-100 dark:border-emerald-950 border-t-emerald-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Activity size={22} className="animate-pulse" />
        </div>
      </div>
      <p className="text-slate-700 dark:text-slate-300 font-semibold text-xs tracking-wide">
        {text || t('common.loading')}
      </p>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white dark:bg-[#11221b] p-6 rounded-2xl shadow-xl border border-slate-200/80 dark:border-[#1e3a2f]">
        {content}
      </div>
    </div>
  );
}
