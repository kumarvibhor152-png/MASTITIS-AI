import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Droplets,
  HeartPulse,
  Sparkles,
  Building2,
  Clock,
  FileText,
  Activity,
  ChevronRight,
} from 'lucide-react';

const ARTICLES = {
  prevention: [
    {
      icon: Droplets,
      title: 'Post-Milking Barrier Teat Dipping Guidelines',
      summary:
        'Post-milking teat dipping using 0.5%–1% iodine or chlorhexidine reduces new intramammary bacterial infections by up to 50%. Teat canal remains open for 30–45 minutes post-milking; keep animals standing with fresh fodder.',
      readTime: '3 min read',
      source: 'ICAR-NDRI Karnal',
    },
    {
      icon: ShieldCheck,
      title: 'Milking Shed Bedding Sanitation & Drainage',
      summary:
        'Damp, organic bedding is the primary reservoir for coliform environmental mastitis (E. coli, Klebsiella). Disinfect stalls daily using slaked lime or dry sand to inhibit bacterial colonization.',
      readTime: '4 min read',
      source: 'NDDB Guidelines',
    },
    {
      icon: Activity,
      title: 'Early Detection with California Mastitis Test (CMT)',
      summary:
        'The California Mastitis Test is a rapid, non-invasive barnside test that reacts with somatic cell DNA. Weekly 4-quarter CMT screening identifies subclinical mastitis before visible clots appear.',
      readTime: '5 min read',
      source: 'Veterinary Manual',
    },
    {
      icon: HeartPulse,
      title: 'Cluster Sanitization & Liner Replacement Cycles',
      summary:
        'Milking machine teat liners degrade after 2,500 individual milkings. Cracked rubber liners harbor Staphylococcus aureus bio-films; sanitize clusters with 80°C hot water between cows.',
      readTime: '4 min read',
      source: 'DeLaval Protocols',
    },
  ],
  treatment: [
    {
      icon: Sparkles,
      title: 'ICAR Herbal Phytotherapy Formulation (Ethnoveterinary)',
      summary:
        'Clinically validated phytotherapy paste: Blend 250g Aloe vera, 50g fresh turmeric rhizome (Curcuma longa), and 15g calcium hydroxide (chuna). Apply topically over affected quarter 3 times daily for 5 days.',
      readTime: '6 min read',
      source: 'ICAR-IVRI Bareilly',
    },
    {
      icon: FileText,
      title: 'Antibiotic Stewardship & Withholding Periods',
      summary:
        'Administer intramammary or systemic antibiotics strictly under licensed veterinary guidance. Observe strict milk withholding periods (4–7 days) to prevent antibiotic residues entering human supply chains.',
      readTime: '5 min read',
      source: 'FSSAI Standards',
    },
    {
      icon: HeartPulse,
      title: 'Somatic Cell Score & Quarter Segregation',
      summary:
        'When quarter SCC exceeds 400,000 cells/mL, isolate quarter milk completely into a discard pail. Never feed unpasteurized mastitic milk to calves due to pathogen transmission.',
      readTime: '3 min read',
      source: 'Dairy Health Board',
    },
  ],
  nutrition: [
    {
      icon: ShieldCheck,
      title: 'Vitamin E & Selenium Mineral Supplementation',
      summary:
        'Dietary deficiency in Vitamin E and organic selenium increases mastitis risk threefold. Supplement 1,000–2,000 IU Vitamin E per cow/day during dry period and transition to strengthen udder immune response.',
      readTime: '5 min read',
      source: 'Animal Nutrition Council',
    },
    {
      icon: Droplets,
      title: 'Hydration Dynamics & Summer Somatic Cell Control',
      summary:
        'High-yielding crossbred cows consume 120–180 liters of clean drinking water daily. Inadequate water intake spikes somatic cell concentrations and triggers acute subclinical mastitis.',
      readTime: '3 min read',
      source: 'Livestock Extension',
    },
  ],
  schemes: [
    {
      icon: Building2,
      title: 'Pashu Kisan Credit Card (PKCC)',
      summary:
        'Provides dairy farmers with collateral-free working capital loans up to ₹1.6 lakh for animal feed, veterinary treatment, and dairy infrastructure at a subsidized 4% effective interest rate.',
      link: 'https://www.nabard.org',
      source: 'NABARD / Ministry of Fisheries, Animal Husbandry',
    },
    {
      icon: Building2,
      title: 'Rashtriya Gokul Mission (RGM)',
      summary:
        'Flagship government scheme for genetic upgradation and breed development of indigenous cattle (Gir, Sahiwal, Rathi, Murrah). Subsidized sex-sorted semen and IVF calf transfer.',
      link: 'https://dahd.nic.in',
      source: 'DAHD Govt. of India',
    },
    {
      icon: Building2,
      title: 'National Livestock Mission (NLM)',
      summary:
        'Financial assistance and 50% capital subsidies for fodder processing equipment, silage bunkers, livestock insurance, and farmer training institutes.',
      link: 'https://nlm.udyamimitra.in',
      source: 'DAHD Govt. of India',
    },
  ],
};

const CATEGORIES = [
  { key: 'prevention', label: 'Udder Hygiene & Prevention' },
  { key: 'treatment', label: 'Treatment & Phytotherapy' },
  { key: 'nutrition', label: 'Nutrition & Mineral Balance' },
  { key: 'schemes', label: 'Government Subsidies' },
];

export default function Knowledge() {
  const { t } = useTranslation();
  const [cat, setCat] = useState('prevention');
  const [search, setSearch] = useState('');

  const articles = (ARTICLES[cat] || []).filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-light">
              Pashu Gyaan Repository
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-medium">
              ICAR-NDRI Clinical Best Practices
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {t('knowledge.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Evidence-based veterinary protocols, ethnoveterinary phytotherapy formulas, and dairy development schemes
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search veterinary guidelines, teat dipping, herbal formulas, government schemes..."
          className="input-field pl-10"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {CATEGORIES.map((c) => {
          const isSelected = cat === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-[#11221b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1e3a2f] hover:bg-slate-50 dark:hover:bg-[#183327]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] p-12 text-center max-w-lg mx-auto shadow-sm">
          <BookOpen size={28} className="text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No guidelines found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or switch to another knowledge category above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                        <Icon size={16} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {item.source}
                      </span>
                    </div>

                    {item.readTime && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={12} />
                        <span>{item.readTime}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex items-center justify-between">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary-light hover:underline inline-flex items-center gap-1"
                    >
                      <span>Official Portal Link</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Standard Clinical Practice
                    </span>
                  )}
                  <span className="text-xs text-primary-light font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer">
                    Read Full Article
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
