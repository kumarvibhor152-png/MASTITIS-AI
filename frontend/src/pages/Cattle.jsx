import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Layers, X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import useCattleStore from '../store/cattleStore';
import CattleCard from '../components/CattleCard';
import { useCowName } from '../utils/cowNames';

const FILTERS = [
  { key: 'ALL', labelKey: 'cattle.allRisk' },
  { key: 'LOW', labelKey: 'cattle.low' },
  { key: 'MEDIUM', labelKey: 'cattle.medium' },
  { key: 'HIGH', labelKey: 'cattle.high' },
];

const POPULAR_BREEDS = ['Gir', 'Sahiwal', 'Murrah', 'HF Cross', 'Jersey', 'Rathi', 'Tharparkar', 'Kankrej'];

export default function Cattle() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cattle, addCattle } = useCattleStore();
  const getCowName = useCowName();

  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tag: '',
    breed: 'Gir',
    age: '',
    milkYield: '',
    village: 'Anand',
    lactation: 1,
  });

  const filtered = cattle.filter((c) => {
    const matchFilter = filter === 'ALL' || c.riskLevel === filter;
    const localizedName = getCowName(c.name);
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(s) ||
      localizedName.toLowerCase().includes(s) ||
      c.tag.toLowerCase().includes(s) ||
      c.breed.toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.tag) {
      toast.error('Cattle name and RFID tag are required');
      return;
    }
    addCattle({
      ...form,
      age: Number(form.age) || 4,
      milkYield: Number(form.milkYield) || 12,
      lactation: Number(form.lactation) || 1,
      riskLevel: 'LOW',
      daysInMilk: 15,
      lastChecked: new Date().toISOString().split('T')[0],
    });
    setShowAddModal(false);
    setForm({ name: '', tag: '', breed: 'Gir', age: '', milkYield: '', village: 'Anand', lactation: 1 });
    toast.success(`${form.name} registered into herd registry`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-light">
              Herd Registry
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-medium">RFID Telemetry Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {t('cattle.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {cattle.length} cattle registered under active veterinary monitoring
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs py-2.5 px-4 shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>{t('cattle.addNew')}</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by cow name, tag (e.g. GJ-001), or breed..."
            className="input-field pl-10 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {FILTERS.map((f) => {
            const count =
              f.key === 'ALL'
                ? cattle.length
                : cattle.filter((c) => c.riskLevel === f.key).length;
            const isSelected = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-[#11221b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1e3a2f] hover:bg-slate-50 dark:hover:bg-[#183327]'
                }`}
              >
                <span>{t(f.labelKey)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cattle Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No cattle found matching criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or selected risk filter to view herd members.
          </p>
          <button
            onClick={() => {
              setFilter('ALL');
              setSearch('');
            }}
            className="mt-4 btn-secondary text-xs py-2 px-4 inline-flex"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cow) => (
            <CattleCard key={cow.id} cow={cow} />
          ))}
        </div>
      )}

      {/* Add Cattle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#11221b] w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-[#1e3a2f] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1e3a2f] mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Register New Cattle
                </h3>
                <p className="text-xs text-slate-500">
                  Add animal RFID tag & baseline lactation parameters
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Cow Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Kamla, Nandini"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Ear Tag / RFID *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    placeholder="e.g. GJ-009"
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Breed
                  </label>
                  <select
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    className="input-field"
                  >
                    {POPULAR_BREEDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="e.g. 4"
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Avg. Daily Milk (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.milkYield}
                    onChange={(e) => setForm({ ...form, milkYield: e.target.value })}
                    placeholder="e.g. 14.5"
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Lactation Cycle (Parity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.lactation}
                    onChange={(e) => setForm({ ...form, lactation: e.target.value })}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
