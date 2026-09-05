import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Globe,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  Activity,
  Lock,
  WifiOff,
  Radio,
  FileCheck2,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import LanguageSelector, { LANGUAGES } from '../components/LanguageSelector';
import { getStoredLanguage } from '../utils/translator';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuth } = useAuthStore();

  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showLangSelector, setShowLangSelector] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (isAuth) navigate('/dashboard', { replace: true });
  }, [isAuth, navigate]);

  const savedLangCode = getStoredLanguage() || i18n.language;
  const currentLang = LANGUAGES.find((l) => l.code === savedLangCode) || LANGUAGES[0];

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast.error(t('login.phoneRequired'));
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep('otp');
    toast.success(`${t('login.otpSent')} +91 ${phone}`);
    setTimeout(() => otpRefs.current[0]?.focus(), 300);
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error(t('login.invalidOtp'));
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    // Demo user profile
    const mockUser = {
      id: '1',
      name: 'Ramesh Patel',
      phone: `+91 ${phone}`,
      farmName: 'Surabhi Dairy & Breeding Farm',
      village: 'Anand',
      district: 'Anand',
      herdSize: 8,
    };
    login(mockUser, 'mock-jwt-token-123');
    setLoading(false);
    toast.success(`${t('login.welcome')}, ${mockUser.name}`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#091310] flex flex-col lg:flex-row overflow-x-hidden font-sans">
      {/* ================= DESKTOP HERO COLUMN (LEFT) ================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 min-h-screen bg-gradient-to-br from-[#042118] via-[#064e3b] to-[#021b14] text-white p-10 xl:p-16 flex-col justify-between relative overflow-hidden select-none">
        {/* Ambient Subtle Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />

        {/* Top Header / Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-lg text-3xl select-none">
              𓃔
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  MASTITIS AI
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Precision Dairy
                </span>
              </div>
              <div className="text-xs text-white/70 font-medium tracking-wide">
                Bovine Mastitis Early Forecasting & Telemetry Platform
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg text-xs text-emerald-200 font-semibold">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span>AI Model v2.4 Active</span>
          </div>
        </div>

        {/* Hero Central Value Proposition */}
        <div className="relative z-10 my-auto py-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200 mb-6">
            <Sparkles size={14} className="text-emerald-300" />
            Empowering 10,000+ Progressive Dairy Farmers
          </div>

          <h1 className="text-4xl xl:text-5xl font-black leading-[1.18] tracking-tight text-white mb-5">
            Early Detection.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-teal-100">
              Protected Yield. Healthier Herd.
            </span>
          </h1>

          <p className="text-base xl:text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
            Detect subclinical mastitis up to 48 hours prior to visible clinical inflammation. Reduce
            antibiotic dependence, prevent milk discards, and protect your dairy farm revenue.
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 mb-8">
            {[
              { val: '94.2%', label: 'Clinical Accuracy', sub: 'CMT-calibrated XGBoost' },
              { val: '< 2 min', label: 'Detection Speed', sub: 'Mobile telemetry check' },
              { val: '₹15,000+', label: 'Avg Saved / Cow', sub: 'Per lactation cycle' },
              { val: '10 Languages', label: 'Vernacular Audio', sub: 'Regional dial-in support' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 transition-all duration-200 hover:bg-white/15 hover:border-white/30"
              >
                <div className="text-2xl font-black text-white tracking-tight metric-value">
                  {stat.val}
                </div>
                <div className="text-xs font-semibold text-white/90 mt-1">{stat.label}</div>
                <div className="text-[10px] text-white/60 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Herd Guardian Telemetry Box */}
          <div className="bg-emerald-950/60 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Continuous Herd Health Guard
                </div>
                <div className="text-xs text-white/80 mt-0.5">
                  Automated Somatic Cell Count, 4-Quarter Electrical Conductivity & Real-time Alerts
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold px-2.5 py-1 bg-emerald-500/20 rounded-md border border-emerald-500/30">
              <CheckCircle2 size={13} />
              <span>Operational</span>
            </div>
          </div>
        </div>

        {/* Bottom Standards Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <FileCheck2 size={14} className="text-emerald-300" />
              ICAR-NDRI Clinical Protocols Aligned
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock size={13} />
              Enterprise SSL Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <WifiOff size={13} />
              Offline PWA Cache Enabled
            </span>
          </div>
          <div className="text-[11px] text-white/50">Smart India Hackathon • SIH-109</div>
        </div>
      </div>

      {/* ================= RIGHT COLUMN (LOGIN FORM) ================= */}
      <div className="w-full lg:w-1/2 xl:w-5/12 min-h-screen flex flex-col justify-between p-5 sm:p-8 lg:p-12 xl:p-14 relative">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-0">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md text-2xl select-none">
              𓃔
            </div>
            <div>
              <div className="text-slate-900 dark:text-white font-bold text-base leading-tight">
                MASTITIS AI
              </div>
              <div className="text-xs text-slate-400">Precision Dairy Platform</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Enterprise Portal</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-primary-light font-semibold">Farmer Authentication</span>
          </div>

          {/* Language Switcher Trigger */}
          <button
            onClick={() => setShowLangSelector(true)}
            className="flex items-center gap-2 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] hover:border-primary-light/50 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all"
            title="Change Language"
          >
            <Globe size={15} className="text-primary-light" />
            <span>{currentLang.native}</span>
            <span className="text-slate-400 text-[11px]">({currentLang.name})</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="bg-white dark:bg-[#11221b] rounded-2xl shadow-card border border-slate-200/80 dark:border-[#1e3a2f] p-6 sm:p-9 transition-all">
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shadow-sm">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                      {t('login.welcome')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Sign in to your farm health dashboard
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    {t('login.phone')}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0d1a15] border border-slate-200 dark:border-[#1e3a2f] rounded-xl px-3 py-2.5 shrink-0 select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      autoFocus
                      className="flex-1 border border-slate-200 dark:border-[#1e3a2f] rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-light/40 focus:border-primary-light bg-slate-50 dark:bg-[#0d1a15] font-mono tracking-widest font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:tracking-normal"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl text-sm shadow-sm active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Requesting OTP...</span>
                    </>
                  ) : (
                    <span>{t('login.sendOtp')}</span>
                  )}
                </button>

                <div className="mt-5 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-semibold">Quick Demo Access:</strong> Enter any 10-digit
                    mobile number (e.g.{' '}
                    <span className="font-mono font-bold">9876543210</span>) and press Send OTP.
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify}>
                <div className="flex items-center gap-2 mb-5">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-primary-light text-xs font-semibold flex items-center gap-1 hover:underline active:scale-95 transition-all"
                  >
                    <ArrowLeft size={14} />
                    <span>{t('common.back')}</span>
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {t('login.enterOtp')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Verification code sent to{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      +91 {phone}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2 sm:gap-2.5 justify-center mb-6">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold border rounded-xl focus:outline-none transition-all font-mono ${
                        digit
                          ? 'border-primary-light bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-[#1e3a2f] bg-slate-50 dark:bg-[#0d1a15] text-slate-900 dark:text-white'
                      } focus:border-primary-light`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl text-sm shadow-sm active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{t('login.verify')}</span>
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Didn't receive SMS?</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-primary-light font-semibold hover:underline active:scale-95 transition-all"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              Verified Farmer Auth
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock size={13} />
              256-Bit SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <WifiOff size={13} />
              Offline Resilient
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#1e3a2f] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <PhoneCall size={13} className="text-emerald-600" />
            <span>
              National Kisan Call Center:{' '}
              <strong className="text-slate-700 dark:text-slate-300 font-mono">1800-180-1551</strong>{' '}
              (Toll Free)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">MASTITIS AI • Version 2.4</div>
        </div>
      </div>

      {showLangSelector && <LanguageSelector onClose={() => setShowLangSelector(false)} />}
    </div>
  );
}
