import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import LanguageSelector, { LANGUAGES } from '../components/LanguageSelector';
import { getStoredLanguage } from '../utils/translator';
import {
  LogOut,
  Globe,
  Bell,
  Home,
  ChevronRight,
  Moon,
  Sun,
  Phone,
  Shield,
  Radio,
  Sliders,
  CheckCircle2,
  Building2,
  User,
} from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();

  const [showLangSelector, setShowLangSelector] = useState(false);
  const [profile, setProfile] = useState({
    farmName: user?.farmName || 'Surabhi Dairy & Breeding Farm',
    village: user?.village || 'Anand',
    district: user?.district || 'Anand',
    herdSize: user?.herdSize || 8,
    emergencyVet: user?.emergencyVet || 'Dr. Patel (9876543211)',
  });
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    riskAlerts: true,
    milkTracking: true,
  });
  const { darkMode, toggleDark } = useThemeStore();

  const savedLangCode = getStoredLanguage() || i18n.language;
  const currentLang = LANGUAGES.find((l) => l.code === savedLangCode) || LANGUAGES[0];

  const saveProfile = () => {
    setUser({ ...user, ...profile });
    toast.success('Farm and veterinary profile updated');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out from MASTITIS AI?')) {
      logout();
      navigate('/login', { replace: true });
      toast.success('Signed out successfully');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-light">
            System Preferences
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs text-slate-500 font-medium">Farm & Device Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
          {t('settings.title') || 'Settings'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage farm profile, veterinary emergency contacts, telemetry language, and notification rules
        </p>
      </div>

      <div className="space-y-6">
        {/* User & Farm Profile Card */}
        <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-[#1e3a2f]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-700/20 shrink-0">
              {(user?.name || 'F')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Farmer Ramesh Patel'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.phone || '+91 9876543210'}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                <span className="font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {profile.farmName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {profile.herdSize} Registered Head
                </span>
              </div>
            </div>
          </div>

          <div className="pt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Farm Name
                </label>
                <input
                  type="text"
                  value={profile.farmName}
                  onChange={(e) => setProfile({ ...profile, farmName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  District / Location
                </label>
                <input
                  type="text"
                  value={profile.district}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Designated Field Veterinarian
                </label>
                <input
                  type="text"
                  value={profile.emergencyVet}
                  onChange={(e) => setProfile({ ...profile, emergencyVet: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Active Herd Size
                </label>
                <input
                  type="number"
                  value={profile.herdSize}
                  onChange={(e) => setProfile({ ...profile, herdSize: Number(e.target.value) })}
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={saveProfile} className="btn-primary text-xs py-2 px-5">
                Save Profile Updates
              </button>
            </div>
          </div>
        </div>

        {/* Localization & Appearance Card */}
        <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card space-y-4 text-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Display & Regional Language
          </h3>

          {/* Language trigger */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Globe size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="text-base">{currentLang.flag}</span>
                  <span>{currentLang.native}</span>
                  <span className="text-xs text-slate-400 font-normal">({currentLang.name})</span>
                </div>
                <div className="text-slate-400 text-[11px]">Instant Full-Website Translation • 10 Indian Languages</div>
              </div>
            </div>

            <button
              onClick={() => setShowLangSelector(true)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Change Language
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                {darkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  High-Contrast Barn Mode
                </div>
                <div className="text-slate-400 text-[11px]">
                  {darkMode ? 'Dark high-contrast enabled' : 'Clean agritech light surface active'}
                </div>
              </div>
            </div>

            <button
              onClick={toggleDark}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {darkMode ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>

        {/* Clinical Notifications Rules */}
        <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card space-y-3.5 text-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Bell size={16} className="text-primary-light" />
            <span>Clinical Notifications & SMS Broadcasts</span>
          </h3>

          {[
            {
              key: 'riskAlerts',
              title: 'Real-Time Acute Mastitis SMS Alerts',
              desc: 'Instant SMS & WhatsApp alert dispatched immediately when AI risk score exceeds 60%',
            },
            {
              key: 'dailyReminder',
              title: 'Daily Parlor Hygiene & Teat Dip Prompts',
              desc: 'Morning (05:00) and evening (17:00) reminders for pre-dip and post-dip barrier applications',
            },
            {
              key: 'milkTracking',
              title: 'Daily Milking Yield Deviation Warning',
              desc: 'Flag cow immediately if evening yield drops more than 15% below 7-day average',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0d1a15]"
            >
              <div className="pr-4">
                <div className="font-bold text-slate-800 dark:text-slate-100">{item.title}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={() =>
                  setNotifications({
                    ...notifications,
                    [item.key]: !notifications[item.key],
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* Logout Action */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleLogout}
            className="btn-danger text-xs py-2.5 px-5 shadow-sm"
          >
            <LogOut size={15} />
            <span>Sign Out from Farm Terminal</span>
          </button>
        </div>
      </div>

      {showLangSelector && <LanguageSelector onClose={() => setShowLangSelector(false)} />}
    </div>
  );
}
