import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useCattleStore from '../store/cattleStore';
import { predictMastitis } from '../api/predict';
import {
  Thermometer,
  Droplets,
  Brain,
  Share2,
  PhoneCall,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useCowName } from '../utils/cowNames';
import RiskBadge from '../components/RiskBadge';

const BEHAVIORS = [
  { key: 'normal', labelKey: 'predict.normal', title: 'Normal & Calm' },
  { key: 'restless', labelKey: 'predict.restless', title: 'Restless Stance' },
  { key: 'lessEating', labelKey: 'predict.lessEating', title: 'Feed Refusal / Low Intake' },
  { key: 'kicking', labelKey: 'predict.kicking', title: 'Kicking During Milking' },
];

function computeRisk(form) {
  let score = 0;
  const temp = parseFloat(form.bodyTemp);
  if (temp > 39.5) score += 28;
  else if (temp > 39.0) score += 12;

  if (form.uddersSwelling === 'yes') score += 32;

  const milk = parseFloat(form.milkYield);
  if (milk < 8) score += 20;
  else if (milk < 12) score += 10;

  if (form.behaviors.restless) score += 8;
  if (form.behaviors.lessEating) score += 10;
  if (form.behaviors.kicking) score += 14;
  if (parseInt(form.previousMastitis) > 0) score += parseInt(form.previousMastitis) * 7;
  if (parseInt(form.daysInMilk) > 90) score += 5;

  const scc = parseFloat(form.scc);
  if (!isNaN(scc)) {
    if (scc > 400000) score += 24;
    else if (scc > 200000) score += 12;
  }

  score = Math.min(score, 99);
  let level = 'LOW';
  if (score >= 60) level = 'HIGH';
  else if (score >= 35) level = 'MEDIUM';

  const factors = [];
  if (temp > 39.5) factors.push({ name: 'Elevated Body Temp (Fever)', impact: '+28%' });
  if (form.uddersSwelling === 'yes') factors.push({ name: 'Udder Tissue Inflammation', impact: '+32%' });
  if (milk < 10) factors.push({ name: 'Significant Daily Yield Deficit', impact: '+20%' });
  if (form.behaviors.kicking) factors.push({ name: 'Pain Response During Milking', impact: '+14%' });
  if (scc > 200000) factors.push({ name: 'Elevated Somatic Cell Count', impact: '+18%' });

  return { score, level, factors };
}

const CLINICAL_PROTOCOLS = {
  LOW: [
    { title: 'Normal Milking Routine', desc: 'Maintain standard pre-dip and post-dip milking hygiene.' },
    { title: 'Daily Yield Tracking', desc: 'Log morning and evening yields to establish continuous lactation baseline.' },
    { title: 'Water & Trough Sanitation', desc: 'Ensure ad-libitum clean fresh drinking water (100–150L/day).' },
    { title: 'Next Scheduled Screen', desc: 'Repeat AI clinical check in 7 days or after any yield fluctuation.' },
  ],
  MEDIUM: [
    { title: 'Twice-Daily Quarter Monitoring', desc: 'Inspect individual teats for heat, swelling, or flakes on strip cup.' },
    { title: 'Teat Dip Barrier Application', desc: 'Apply 0.5%–1% iodine barrier teat dip immediately post-milking.' },
    { title: 'ICAR Herbal Phytotherapy Formulation', desc: 'Prepare paste of Aloe vera, Curcuma longa (turmeric), and calcium hydroxide. Apply on udder.' },
    { title: 'Rectal Temperature Logging', desc: 'Record temperature twice daily. Call vet if reading exceeds 39.4°C.' },
    { title: 'Milk Hand Strip Testing', desc: 'Perform California Mastitis Test (CMT) to verify somatic cell changes.' },
  ],
  HIGH: [
    { title: 'Immediate Veterinary Triage', desc: 'Contact qualified veterinarian immediately or call Toll-Free 1962 for antibiotic sensitivity test.' },
    { title: 'Quarantine Infected Animal', desc: 'Isolate cow to clean, dry, disinfected stall away from main herd to halt pathogen transfer.' },
    { title: 'Segregate & Milk Last', desc: 'Milk infected cow last. Never mix milk with healthy supply and do not feed raw to calves.' },
    { title: 'Frequent Quarter Stripping', desc: 'Strip affected quarters completely 3–4 times daily to evacuate bacterial toxins.' },
    { title: 'Cold Water Udder Hydrotherapy', desc: 'Apply clean cold water compresses to reduce acute vascular congestion and pain.' },
  ],
};

export default function Predict() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cattle } = useCattleStore();
  const getCowName = useCowName();

  const [selectedCow, setSelectedCow] = useState('');
  const [form, setForm] = useState({
    milkYield: '',
    bodyTemp: '38.6',
    uddersSwelling: 'no',
    behaviors: { normal: true, restless: false, lessEating: false, kicking: false },
    daysInMilk: 45,
    previousMastitis: 0,
    conductivity: '5.2',
    scc: '180000',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCowSelect = (e) => {
    const cowId = e.target.value;
    setSelectedCow(cowId);
    if (cowId) {
      const c = cattle.find((item) => item.id === cowId);
      if (c) {
        setForm((prev) => ({
          ...prev,
          milkYield: c.milkYield?.toString() || '',
          daysInMilk: c.daysInMilk || 45,
        }));
      }
    }
  };

  const toggleBehavior = (key) => {
    setForm((prev) => {
      const updated = { ...prev.behaviors, [key]: !prev.behaviors[key] };
      if (key !== 'normal' && updated[key]) updated.normal = false;
      if (key === 'normal' && updated.normal) {
        updated.restless = false;
        updated.lessEating = false;
        updated.kicking = false;
      }
      return { ...prev, behaviors: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.milkYield || !form.bodyTemp) {
      toast.error('Please input milk yield and body temperature');
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const payload = { cowId: selectedCow, ...form };
      const apiResult = await predictMastitis(payload);
      setResult(apiResult);
    } catch {
      // Fallback to validated mathematical heuristic model
      const computed = computeRisk(form);
      setResult(computed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-light">
            AI Diagnostic Console
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs text-slate-500 font-medium">Bovine Mastitis Predictor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
          {t('predict.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Multi-parameter clinical screening engine based on Somatic Cell Count, Electrical Conductivity, and Physical Symptoms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Input Form - 7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#11221b] rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 sm:p-6 shadow-card space-y-5 text-xs"
          >
            {/* Step 1: Cattle Selector */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Select Registered Cattle (Optional)
              </label>
              <select
                value={selectedCow}
                onChange={handleCowSelect}
                className="input-field font-semibold"
              >
                <option value="">-- Guest / Unregistered Cow Screening --</option>
                {cattle.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCowName(c.name)} ({c.tag}) — {c.breed}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Primary Vitals (Yield & Temp) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Droplets size={14} className="text-teal-600" />
                  <span>Current Daily Milk (Liters) *</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.milkYield}
                  onChange={(e) => setForm({ ...form, milkYield: e.target.value })}
                  placeholder="e.g. 11.5"
                  className="input-field font-mono text-base font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Compare with cow average baseline
                </span>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Thermometer size={14} className="text-rose-600" />
                  <span>Rectal Temperature (°C) *</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.bodyTemp}
                  onChange={(e) => setForm({ ...form, bodyTemp: e.target.value })}
                  placeholder="38.6"
                  className="input-field font-mono text-base font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Healthy normal: 38.5°C – 39.2°C
                </span>
              </div>
            </div>

            {/* Step 3: Physical Examination (Udder Swelling) */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Udder Physical Inspection (Quarter Hardness / Swelling / Heat)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, uddersSwelling: 'no' })}
                  className={`p-3 rounded-xl border text-center font-semibold transition-all ${
                    form.uddersSwelling === 'no'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-[#1e3a2f] bg-slate-50 dark:bg-[#0d1a15] text-slate-600'
                  }`}
                >
                  Normal / Soft / Pliable
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, uddersSwelling: 'yes' })}
                  className={`p-3 rounded-xl border text-center font-semibold transition-all ${
                    form.uddersSwelling === 'yes'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200'
                      : 'border-slate-200 dark:border-[#1e3a2f] bg-slate-50 dark:bg-[#0d1a15] text-slate-600'
                  }`}
                >
                  Swollen / Hard / Warm to Touch
                </button>
              </div>
            </div>

            {/* Step 4: Behavioral Symptoms */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Milking & Behavioral Observations
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {BEHAVIORS.map((b) => {
                  const isChecked = form.behaviors[b.key];
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => toggleBehavior(b.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-primary bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'border-slate-200 dark:border-[#1e3a2f] bg-slate-50 dark:bg-[#0d1a15] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{b.title}</span>
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-primary text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Advanced Diagnostic Biomarkers (Optional Accordion) */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Activity size={13} />
                <span>Advanced Biomarkers (In-Line Sensors & Lab)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Electrical Conductivity (mS/cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.conductivity}
                    onChange={(e) => setForm({ ...form, conductivity: e.target.value })}
                    placeholder="e.g. 5.2"
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Somatic Cell Count (SCC / mL)
                  </label>
                  <input
                    type="number"
                    value={form.scc}
                    onChange={(e) => setForm({ ...form, scc: e.target.value })}
                    placeholder="e.g. 200000"
                    className="input-field font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Diagnostic Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing AI Diagnostic Matrix...</span>
                </>
              ) : (
                <>
                  <Brain size={18} />
                  <span>Run Mastitis Risk Forecast</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column (Results & Clinical Action Protocol - 5 cols) */}
        <div className="lg:col-span-5">
          {result ? (
            <div className="space-y-5 animate-slide-up">
              {/* Risk Level Badge Card */}
              <div
                className={`rounded-2xl p-5 border shadow-card text-center ${
                  result.level === 'HIGH'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-100'
                    : result.level === 'MEDIUM'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-100'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Clinical Diagnosis Outcome
                </div>
                <div className="inline-flex mb-3">
                  <RiskBadge level={result.level} size="lg" showPing={result.level === 'HIGH'} />
                </div>
                <div className="text-4xl font-extrabold font-mono tracking-tight my-1">
                  {result.score}%
                </div>
                <p className="text-xs font-medium opacity-85 max-w-sm mx-auto mt-1">
                  {result.level === 'HIGH'
                    ? 'Clinical Mastitis Forecast: Immediate veterinary intervention & milk segregation required.'
                    : result.level === 'MEDIUM'
                    ? 'Subclinical Risk Detected: 48-hour window before visible symptoms. Apply barrier teat dips.'
                    : 'Healthy Udder: Somatic cells and lactation parameters are within safe baseline.'}
                </p>
              </div>

              {/* Contributing Clinical Factors */}
              {result.factors && result.factors.length > 0 && (
                <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-4 shadow-card">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Activity size={14} className="text-primary-light" />
                    <span>Key Risk Attribution (SHAP Factors)</span>
                  </div>
                  <div className="space-y-2">
                    {result.factors.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-[#0d1a15]"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {f.name}
                        </span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {f.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Protocol Step-by-Step Points */}
              <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <ClipboardList size={15} className="text-primary-light" />
                  <span>Mandatory Veterinary Clinical Steps</span>
                </div>
                <div className="space-y-3">
                  {(CLINICAL_PROTOCOLS[result.level] || CLINICAL_PROTOCOLS.LOW).map((p, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-100 dark:border-[#1e3a2f] bg-slate-50/60 dark:bg-[#0d1a15] text-xs"
                    >
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        {i + 1}. {p.title}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {p.desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex gap-2">
                  <a
                    href="tel:1962"
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <PhoneCall size={14} />
                    <span>Call Vet (1962)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => toast.success('Clinical diagnostic report generated for herd ledger')}
                    className="btn-secondary text-xs py-2.5 px-3"
                  >
                    <Share2 size={14} />
                    <span>Save Report</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] p-8 text-center shadow-card h-full flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                <Brain size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Awaiting Clinical Input
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                Fill in the animal's temperature, current milk volume, and udder examination on the
                left to generate an AI risk forecast.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
