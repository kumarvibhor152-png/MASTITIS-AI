import { useTranslation } from 'react-i18next';
import { X, Phone, CheckCircle2, ShieldAlert, HeartPulse, Stethoscope, Droplets, Info, Sparkles, AlertTriangle } from 'lucide-react';
import RiskBadge from './RiskBadge';
import { useCowName } from '../utils/cowNames';

const ACTION_POINTS = {
  HIGH: [
    {
      icon: ShieldAlert,
      color: 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50',
      title: '1. Immediate Quarantine & Isolation',
      desc: 'Separate the animal into a clean, dry, sanitized stall away from the main milking herd to prevent pathogen transmission through flies and shared bedding.',
    },
    {
      icon: Droplets,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50',
      title: '2. Milk Last & Discard Contaminated Milk',
      desc: 'Always milk infected quarters last by hand or dedicated cluster. Never mix this milk with healthy supply and do not feed raw milk to calves. Dispose of it safely.',
    },
    {
      icon: Phone,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-800',
      title: '3. Contact Veterinary Doctor Immediately',
      desc: 'Call your local veterinarian or Dial 1962 (Toll-Free National Helpline) for professional antibiotic sensitivity testing and intramammary infusion.',
    },
    {
      icon: HeartPulse,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50',
      title: '4. Cold Compress & Frequent Stripping',
      desc: 'Apply clean cold packs in acute inflamed udder stages. Strip infected quarters completely 3–4 times daily into a disinfectant mug to purge bacterial endotoxins.',
    },
    {
      icon: Stethoscope,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
      title: '5. Post-Milking Teat Disinfection',
      desc: 'Dip all 4 teats with 0.5%–1% iodine or chlorhexidine teat dip immediately. Keep the cow standing for at least 30 minutes with fresh feed while the teat sphincter closes.',
    },
    {
      icon: Info,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50',
      title: '6. Sanitize Milking Equipment & Stall',
      desc: 'Thoroughly sterilize cluster units, rubber liners, and towels in boiling water and food-grade disinfectant before milking any other cattle.',
    },
  ],
  MEDIUM: [
    {
      icon: Stethoscope,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50',
      title: '1. Perform California Mastitis Test (CMT)',
      desc: 'Conduct a rapid paddle CMT check on all 4 individual quarters to isolate early subclinical somatic cell elevation before visual clots form.',
    },
    {
      icon: HeartPulse,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50',
      title: '2. Monitor Yield & Rectal Temperature Daily',
      desc: 'Record morning and evening milk outputs. Measure rectal body temperature twice daily (healthy baseline: 38.5°C–39.2°C).',
    },
    {
      icon: Droplets,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
      title: '3. Strict Teat Hygiene & Dry Wipes',
      desc: 'Wash udder with warm water containing antiseptic and wipe dry using separate paper towels for each quarter. Ensure thorough post-milking teat dipping.',
    },
    {
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
      title: '4. Dietary & Udder Immunity Boost',
      desc: 'Supplement animal diet with Vitamin E, Selenium, zinc, and high-quality mineral mixtures to naturally strengthen mammary defense mechanisms.',
    },
    {
      icon: Info,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50',
      title: '5. 48-Hour Intensive Surveillance',
      desc: 'Check milk closely for flakes, stringiness, or discoloration during pre-stripping. If symptoms deteriorate, escalate immediately to a vet.',
    },
  ],
  LOW: [
    {
      icon: Stethoscope,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
      title: '1. Regular Herd Screening Protocol',
      desc: 'Maintain weekly CMT screenings for all high-yielding cattle to catch subclinical shifts early.',
    },
    {
      icon: Droplets,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50',
      title: '2. Milking Hygiene & Parlor Cleanliness',
      desc: 'Ensure hands are sanitized, teat cups are clean, and cows have dry, lime-treated bedding to rest on.',
    },
    {
      icon: Info,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50',
      title: '3. Prevent Teat Trauma & Over-Milking',
      desc: 'Check machine vacuum levels and avoid over-milking or excessive cluster stripping.',
    },
  ],
};

export default function ActionModal({ alert, onClose, onResolve }) {
  const { t } = useTranslation();
  const getCowName = useCowName();

  if (!alert) return null;

  const points = ACTION_POINTS[alert.riskLevel] || ACTION_POINTS.MEDIUM;

  const handleResolveClick = () => {
    if (onResolve) {
      onResolve(alert.id);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up border border-gray-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📋</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  Action Protocol: {getCowName(alert.cowName)}
                </h3>
                <RiskBadge level={alert.riskLevel} size="sm" />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Recommended clinical procedure for {getCowName(alert.cowName)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alert Summary Box */}
        <div className="px-5 pt-4 shrink-0">
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            alert.riskLevel === 'HIGH'
              ? 'bg-red-50/70 border-red-200 text-red-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-current" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold">Detected Risk: </strong>
              <span>{alert.message}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Action Steps */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
            What You Should Do:
          </div>

          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-3 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
              >
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${pt.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">
                    {pt.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <a
            href="tel:1962"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0"
          >
            <Phone size={14} />
            <span>Call Vet (1962)</span>
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            >
              Close
            </button>

            {!alert.resolved ? (
              <button
                onClick={handleResolveClick}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary-light text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <CheckCircle2 size={14} />
                <span>Mark Action Taken</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold px-3 py-2 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle2 size={14} />
                <span>Resolved</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
