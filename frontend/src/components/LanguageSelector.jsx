import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Globe2, Loader2, Sparkles } from 'lucide-react';
import { LANGUAGES, applyLanguage, getStoredLanguage } from '../utils/translator';

export { LANGUAGES };

export default function LanguageSelector({ onClose, onSelect }) {
  const { i18n, t } = useTranslation();
  const currentSavedLang = getStoredLanguage();
  const [applyingCode, setApplyingCode] = useState(null);

  const handleSelect = (code) => {
    setApplyingCode(code);
    if (onSelect) onSelect(code);

    // Apply translation across the entire site without hardcoding any word
    applyLanguage(code, { reload: true });

    // Fallback close if reload takes longer
    setTimeout(() => {
      if (onClose) onClose();
    }, 400);
  };

  const activeLang = LANGUAGES.find((l) => l.code === (applyingCode || currentSavedLang || i18n.language)) || LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#11221b] w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 sm:p-6 pb-8 sm:pb-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
              <Globe2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t('login.langTitle') || 'Select Language'}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Sparkles size={10} />
                  <span>Auto-Translate</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Translates every word, table, card, & metric on the platform instantly
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#152a21] transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Applying Banner */}
        {applyingCode && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs animate-pulse">
            <Loader2 size={16} className="animate-spin text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Translating entire website into {activeLang.native} ({activeLang.name})...</span>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Applying neural translation across all pages.</div>
            </div>
          </div>
        )}

        {/* Language Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {LANGUAGES.map((lang) => {
            const isActive = (currentSavedLang || i18n.language) === lang.code;
            const isTarget = applyingCode === lang.code;

            return (
              <button
                key={lang.code}
                disabled={Boolean(applyingCode)}
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 active:scale-95 group ${
                  isActive || isTarget
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15] hover:bg-white dark:hover:bg-[#152a21] hover:border-slate-300 dark:hover:border-emerald-800/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl sm:text-2xl shrink-0">{lang.flag}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm leading-tight truncate">
                      {lang.native}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {lang.name}
                    </div>
                  </div>
                </div>

                {isTarget ? (
                  <Loader2 size={15} className="animate-spin text-emerald-600 shrink-0 ml-2" />
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-sm">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Footer info notice */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#1e3a2f] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Supported: 10 Official Regional Languages</span>
          {/* <span className="font-medium text-emerald-700 dark:text-emerald-400"></span> */}
        </div>
      </div>
    </div>
  );
}

