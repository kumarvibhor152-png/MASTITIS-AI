import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Layers, Stethoscope, Bell, LineChart } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.home' },
  { to: '/cattle', icon: Layers, labelKey: 'nav.cattle' },
  { to: '/predict', icon: Stethoscope, labelKey: 'nav.predict' },
  { to: '/alerts', icon: Bell, labelKey: 'nav.alerts' },
  { to: '/analytics', icon: LineChart, labelKey: 'nav.analytics' },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden shadow-bottom-nav">
      <div className="max-w-md mx-auto bg-white/95 dark:bg-[#11221b]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-[#1e3a2f]">
        <div className="flex items-stretch justify-around px-2">
          {navItems.map(({ to, icon: Icon, labelKey }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <NavLink
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center justify-center py-2 min-h-[60px] relative group active:scale-95 transition-all"
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-light rounded-full" />
                )}
                <div
                  className={`p-1.5 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-primary-light'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                </div>
                <span
                  className={`text-[10px] font-semibold truncate transition-colors duration-150 mt-0.5 ${
                    isActive
                      ? 'text-primary-light font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </NavLink>
            );
          })}
        </div>
        <div
          className="h-safe-area-inset-bottom bg-transparent"
          style={{ height: 'env(safe-area-inset-bottom)' }}
        />
      </div>
    </nav>
  );
}
