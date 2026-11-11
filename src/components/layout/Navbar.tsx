import React, { useState } from 'react';
import {
  LayoutDashboard,
  Warehouse,
  ClipboardList,
  GitBranch,
  ChefHat,
  CalendarDays,
  Scale,
  TrendingUp,
  PlusCircle,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Trash2,
  Database,
  HardDrive,
  Download,
  Users,
  UtensilsCrossed,
  ShieldCheck,
  CookingPot,
  Camera,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  Copy,
  Check,
  Link2,
  Building2,
  Receipt,
  LogOut,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatEthiopianDate, getTodayDateString } from '../../utils/ethiopianDate';
import { createStorekeeperShareableUrl } from '../../utils/shareableStorekeeperLink';

export type ActiveTab =
  | 'branchDailyInput'
  | 'dashboard'
  | 'centralStore'
  | 'storekeeperPortal'
  | 'binCard'
  | 'recipes'
  | 'fullReconciliation'
  | 'autoReconciliation'
  | 'cutOver'
  | 'reconciliation'
  | 'fbReport'
  | 'standardForms'
  | 'dataVault'
  | 'expenses'
  | 'hotelsAdmin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenStockIn: () => void;
  onOpenTransfer: () => void;
  onOpenDesktopInstall: () => void;
  onOpenAiScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenStockIn,
  onOpenTransfer,
  onOpenDesktopInstall,
  onOpenAiScanner,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { clearAllDataCompletely, exportFullBackup, restoreOriginalBaselineData, items, centralBinCards, hotels, currentHotelId, setCurrentHotelId, currentHotel } = useApp();
  const { currentUser, logout, isSuperAdmin } = useAuth();
  const todayStr = getTodayDateString();
  const ethDate = formatEthiopianDate(todayStr, language);

  const [copiedStorekeeperLink, setCopiedStorekeeperLink] = useState(false);

  const handleCopyStorekeeperLink = () => {
    // 1. Force push current items to server catalog
    fetch('/api/store/sync-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }).catch(() => {});

    // 2. Also encode into shareable URL hash for fallback
    const fullUrl = createStorekeeperShareableUrl(items);
    navigator.clipboard.writeText(fullUrl);
    setCopiedStorekeeperLink(true);
    setTimeout(() => setCopiedStorekeeperLink(false), 3000);
  };

  const navItems = [
    {
      id: 'branchDailyInput',
      label: language === 'am' ? '📋 ዕለታዊ የብራንች ቁጥጥር' : '📋 Branch Daily Control',
      icon: ClipboardList,
      highlight: true,
    },
    { id: 'expenses', label: language === 'am' ? '💸 ወጪዎች (Expenses)' : '💸 Expenses', icon: Receipt, highlight: false },
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'centralStore', label: language === 'am' ? '🏪 ሴንትራል ስቶር (GRN/SIV)' : '🏪 Central Store', icon: Warehouse },
    {
      id: 'storekeeperPortal',
      label: language === 'am' ? '👷‍♂️ የስቶር ኪፐር ቦክስ' : '👷‍♂️ Storekeeper Box',
      icon: Warehouse,
      isGold: true,
    },
    { id: 'binCard', label: t.nav.binCard, icon: ClipboardList },
    { id: 'recipes', label: language === 'am' ? '🍽️ ሜኑና ሬሲፒ' : '🍽️ Menu & Recipes', icon: ChefHat },
    { id: 'fullReconciliation', label: language === 'am' ? '📊 የልዩነት እና ኦዲት ሪፖርት' : '📊 Variance & Audit', icon: Scale },
    { id: 'cutOver', label: language === 'am' ? '🔄 ፍሬሽ ስታርት' : '🔄 Fresh Start', icon: ArrowRightLeft, isGold: true },
    { id: 'fbReport', label: t.nav.fbReport, icon: ShieldCheck },
    { id: 'hotelsAdmin', label: language === 'am' ? '🏨 ሆቴሎችና ተጠቃሚዎች' : '🏨 Hotels & Users', icon: Building2, isGold: true },
    { id: 'dataVault', label: t.nav.dataVault, icon: Database, isGold: true },
  ];

  const handleWipeData = () => {
    if (window.confirm(language === 'am' ? 'ሙሉ ዳታዎችን አጽድተህ እንደ አዲስ ባዶ ማድረግ ትፈልጋለህ?' : 'Do you want to clear all data completely to a fresh blank start?')) {
      clearAllDataCompletely();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-amber-500/20 shadow-2xl">
      {/* Top Luxury Banner with Ethiopian Date Ticker & Golden Accents */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-sm shadow-amber-400"></span>
            </span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-wide text-xs sm:text-sm drop-shadow-sm">
              {currentHotel ? (language === 'am' ? currentHotel.nameAm : currentHotel.nameEn) : 'BELLO FAM RESTAURANT GROUP • ቤሎ ፋም'}
            </span>
          </div>

          {/* Hotel Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/30 rounded-xl px-2.5 py-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={currentHotelId}
              onChange={(e) => setCurrentHotelId(e.target.value)}
              className="bg-transparent text-amber-200 font-bold text-xs focus:outline-none cursor-pointer"
              title={language === 'am' ? 'ሆቴል / ድርጅት ይቀይሩ' : 'Switch Hotel / Business'}
            >
              {hotels
                .filter((h) => !h.isArchived)
                .map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                    {language === 'am' ? h.nameAm : h.nameEn} ({h.category})
                  </option>
                ))}
            </select>
          </div>

          <span className="hidden lg:inline text-amber-500/30">|</span>

          {/* Ethiopian Calendar Badge with Gold Trim */}
          <div className="flex items-center gap-2 bg-gradient-r from-slate-900 via-amber-950/30 to-slate-900 px-3 py-1 rounded-xl border border-amber-500/30 shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold tracking-tight">🇪🇹 {ethDate}</span>
            <span className="text-slate-400 text-[11px] font-mono">({todayStr})</span>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Storekeeper Direct Link Button */}
          <button
            onClick={handleCopyStorekeeperLink}
            title={language === 'am' ? 'ለስቶር ኪፐር የሚላከውን ቀጥተኛ ሊንክ ቅዳ (እቃ ማስተላለፊያ እና ዋጋ መሙያ ብቻ)' : 'Copy direct link for storekeeper (Stock In with price & SIV only)'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-amber-300 bg-amber-950/40 border border-amber-500/50 hover:bg-amber-900/50 hover:border-amber-400 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {copiedStorekeeperLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5 text-amber-400" />}
            <span className="font-extrabold">
              {copiedStorekeeperLink
                ? (language === 'am' ? 'ሊንኩ ተቀድቷል! ✅' : 'Link Copied! ✅')
                : (language === 'am' ? '🔗 የስቶር ኪፐር ሊንክ' : '🔗 Storekeeper Link')}
            </span>
          </button>

          {/* Luxury Stock In Button */}
          <button
            onClick={onOpenStockIn}
            className="relative group overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 shadow-md shadow-emerald-950/50 hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ring-1 ring-emerald-400/40 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t.dashboard.stockInBtn}</span>
          </button>

          {/* Luxury Transfer Button */}
          <button
            onClick={onOpenTransfer}
            className="relative group overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 shadow-md shadow-blue-950/50 hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ring-1 ring-blue-400/40 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{t.dashboard.transferBtn}</span>
          </button>

          {/* AI Voucher & Document Scanner Button */}
          {onOpenAiScanner && (
            <button
              onClick={onOpenAiScanner}
              title={language === 'am' ? 'የሰነዶችና የቫውቸሮች ፎቶ አንባቢ በ AI' : 'Scan Voucher / Slip Photo with AI'}
              className="relative group overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-amber-200 bg-gradient-to-r from-purple-900/70 via-slate-900 to-amber-950/70 border border-purple-500/50 hover:border-amber-400 shadow-md shadow-purple-950/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ring-1 ring-purple-400/40 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-extrabold">{language === 'am' ? '📷 AI ሰነድ አንባቢ' : '📷 AI Scan'}</span>
            </button>
          )}

          {/* Dedicated Desktop & Mobile App Install Button */}
          <button
            onClick={onOpenDesktopInstall}
            title={language === 'am' ? 'መተግበሪያውን በኮምፒውተርዎ ወይም በስልክዎ ላይ በቀላሉ አውርደው እንደ ሶፍትዌር ይጠቀሙ' : 'Download and run app on PC / Mobile'}
            className="relative group overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 hover:from-amber-200 hover:to-yellow-300 border border-amber-300 shadow-md shadow-amber-950/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer ring-1 ring-amber-400/50"
          >
            <HardDrive className="w-3.5 h-3.5 text-slate-950" />
            <span className="font-black">{language === 'am' ? '💻 መተግበሪያውን አውርድ / ጫን' : '💻 Download / Install App'}</span>
          </button>

          {/* Bilingual Switcher with luxury tactile feel */}
          <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-amber-500/20 shadow-inner">
            <button
              onClick={() => setLanguage('am')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'am'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              አማርኛ 🇪🇹
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English 🌐
            </button>
          </div>

          {/* User Account Pill & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[100px] sm:max-w-[130px]">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <span className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5">
                    {isSuperAdmin ? (
                      <>
                        <Shield className="w-2.5 h-2.5 text-amber-400 inline" />
                        <span>Super Admin</span>
                      </>
                    ) : (
                      currentUser.role || 'User'
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title={language === 'am' ? 'ከአካውንት ውጣ (Logout)' : 'Logout'}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Clean Slate Wipe Button */}
          <button
            onClick={handleWipeData}
            title={language === 'am' ? 'ሙሉ ዳታ አጽዳ (Reset / Blank)' : 'Clear All Data (Clean Slate)'}
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Luxury Navigation Bar */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-13 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? item.highlight || item.isGold
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black ring-1 ring-amber-300/60'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 font-bold ring-1 ring-emerald-400/40'
                      : item.highlight || item.isGold
                      ? 'text-amber-400 hover:bg-amber-950/30 hover:text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
