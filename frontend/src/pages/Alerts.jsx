import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  PhoneCall,
} from 'lucide-react';
import AlertItem from '../components/AlertItem';
import ActionModal from '../components/ActionModal';

const MOCK_ALERTS = [
  {
    id: '1',
    cowName: 'Lakshmi',
    riskLevel: 'HIGH',
    message:
      'High mastitis risk detected. Rectal temperature 40.2°C, daily milk yield dropped 45%. Somatic Cell Count estimated > 720,000 cells/mL. Immediate veterinary triage required.',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    resolved: false,
    category: 'today',
  },
  {
    id: '2',
    cowName: 'Parvati',
    riskLevel: 'HIGH',
    message:
      'Significant udder swelling and right hind quarter conductivity spike (6.8 mS/cm). Clinical mastitis symptoms visible during morning milking session.',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    resolved: false,
    category: 'today',
  },
  {
    id: '3',
    cowName: 'Kamdhenu',
    riskLevel: 'MEDIUM',
    message:
      'Moderate subclinical risk indicators flagged. Somatic cell count elevated (~390,000 cells/mL). Inspect teats twice daily and apply ICAR herbal phytotherapy formulation.',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    resolved: false,
    category: 'today',
  },
  {
    id: '4',
    cowName: 'Radha',
    riskLevel: 'MEDIUM',
    message:
      'Milk yield dropped 20% compared to 7-day average. Temperature slightly elevated at 39.4°C. Monitored and teat-dipped.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolved: true,
    category: 'week',
  },
  {
    id: '5',
    cowName: 'Durga',
    riskLevel: 'LOW',
    message:
      'Routine California Mastitis Test (CMT) completed. All four quarters tested negative. Next scheduled screening in 7 days.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolved: true,
    category: 'week',
  },
  {
    id: '6',
    cowName: 'Saraswati',
    riskLevel: 'HIGH',
    message:
      'Previous mastitis episode resolved after veterinary antibiotic course. Lactation recovering smoothly.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    resolved: true,
    category: 'all',
  },
];

const FILTERS = ['today', 'week', 'all', 'high'];

export default function Alerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState('today');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const filterLabels = {
    today: t('alerts.today'),
    week: t('alerts.thisWeek'),
    all: t('alerts.allTime'),
    high: t('alerts.highOnly'),
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'today') return a.category === 'today';
    if (filter === 'week') return a.category === 'today' || a.category === 'week';
    if (filter === 'high') return a.riskLevel === 'HIGH';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.resolved && a.riskLevel === 'HIGH').length;

  const handleAction = (alert) => {
    setSelectedAlert(alert);
  };

  const handleResolve = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
    setSelectedAlert((prev) => (prev && prev.id === id ? { ...prev, resolved: true } : prev));
    toast.success('Clinical protocol action recorded & alert resolved');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Clinical Triage Center
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-medium">Bovine Health Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {t('alerts.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time automated alerts for acute mastitis risk, somatic cell spikes, and parlor conductivity anomalies
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold self-start sm:self-auto">
            <AlertTriangle size={15} className="text-rose-600" />
            <span>{unreadCount} Critical Actions Pending</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {FILTERS.map((f) => {
          const isSelected = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-[#11221b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1e3a2f] hover:bg-slate-50 dark:hover:bg-[#183327]'
              }`}
            >
              {filterLabels[f]}
            </button>
          );
        })}
      </div>

      {/* Alert Items List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('alerts.noAlerts')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            All registered cattle indicators are currently within safe baseline parameters. Continue routine morning and evening parlor hygiene.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Unresolved / High Priority First */}
          {filtered
            .filter((a) => !a.resolved)
            .map((alert) => (
              <AlertItem key={alert.id} alert={alert} onAction={handleAction} />
            ))}

          {/* Resolved Items */}
          {filtered.filter((a) => a.resolved).length > 0 && (
            <div className="pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
                Resolved Action History
              </div>
              <div className="space-y-3.5">
                {filtered
                  .filter((a) => a.resolved)
                  .map((alert) => (
                    <AlertItem key={alert.id} alert={alert} onAction={handleAction} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Plan Modal */}
      {selectedAlert && (
        <ActionModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}
