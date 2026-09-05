import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import {
  LayoutDashboard,
  Layers,
  Stethoscope,
  Bell,
  LineChart,
  BookOpen,
  Settings,
  ShieldCheck,
  Radio,
  Sun,
  Moon,
  LogOut,
  Globe,
  PhoneCall,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useCattleStore from '../store/cattleStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.home', badge: null },
  { to: '/cattle', icon: Layers, labelKey: 'nav.cattle', badge: null },
  { to: '/predict', icon: Stethoscope, labelKey: 'nav.predict', badge: 'AI' },
  { to: '/alerts', icon: Bell, labelKey: 'nav.alerts', badge: 'alerts' },
  { to: '/analytics', icon: LineChart, labelKey: 'nav.analytics', badge: null },
  { to: '/knowledge', icon: BookOpen, labelKey: 'nav.knowledge', badge: null },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings', badge: null },
];

export default function DesktopNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDark } = useThemeStore();
  const { cattle } = useCattleStore();

  const atRisk = cattle.filter((c) => c.riskLevel === 'HIGH').length;
  const [showLangSelector, setShowLangSelector] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white dark:bg-[#0c1913] border-r border-slate-200 dark:border-[#1e3a2f] h-screen sticky top-0 shrink-0 select-none z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-[#1e3a2f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 text-2xl select-none">
            𓃔
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                MASTITIS
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Precision Dairy Platform
            </p>
          </div>
        </div>

        {/* IoT Milking Parlor Stream Pulse */}
        <div className="mt-3.5 flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#11221b] border border-emerald-100 dark:border-emerald-900/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              Parlor Stream: Active
            </span>
          </div>
          <Radio size={13} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          Operations
        </div>
        {navItems.map(({ to, icon: Icon, labelKey, badge }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary-light text-white shadow-sm shadow-emerald-700/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#152a21] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{t(labelKey)}</span>
              </div>
              {badge === 'AI' && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  v2.4
                </span>
              )}
              {badge === 'alerts' && atRisk > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                  }`}
                >
                  {atRisk}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Emergency Vet Call Line */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1e3a2f]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
            Emergency
          </div>
          <a
            href="tel:1962"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <PhoneCall size={16} />
              <span>Kisan Vet Helpline</span>
            </div>
            <span className="font-mono text-xs font-bold">1962</span>
          </a>
        </div>
      </div>

      {/* User Footer Profile & Theme Toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1c15]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
              {(user?.name || 'F')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Farmer'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {user?.farmName || 'Dairy Farm'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowLangSelector(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all"
              title="Change Language"
            >
              <Globe size={16} />
            </button>
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {showLangSelector && (
        <LanguageSelector onClose={() => setShowLangSelector(false)} />
      )}
    </aside>
  );
}
