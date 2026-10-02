import React, { useState } from 'react';
import {
  AcademicTerm,
  Asatidz,
  PesantrenProfile,
  RoleType,
} from '../types';
import {
  LayoutDashboard,
  Landmark,
  Building2,
  GraduationCap,
  FileSpreadsheet,
  Calendar,
  Shield,
  UserCheck,
  ChevronDown,
  Menu,
  X,
  Plus,
  ClipboardEdit,
} from 'lucide-react';

export type TabKey = 'dashboard' | 'profil' | 'lembaga' | 'asatidz' | 'rekapan' | 'input_nilai';

export interface SubMenuItem {
  id: string;
  label: string;
  badge?: string | number;
  adminOnly?: boolean;
}

interface SidebarProps {
  activeTab: TabKey;
  activeSubTab?: string;
  onSelectTab: (tab: TabKey, subTab?: string) => void;
  onSelectSubTab?: (subTab: string) => void;
  currentRole: RoleType;
  onSwitchToAdmin: () => void;
  onSwitchToAsatidz: () => void;
  profile: PesantrenProfile;
  currentTerm: AcademicTerm;
  allTerms: AcademicTerm[];
  onSelectTerm: (term: AcademicTerm) => void;
  onAddTerm: (newTerm: AcademicTerm) => void;
  currentAsatidz: Asatidz | null;
  allAsatidz: Asatidz[];
  onSelectAsatidz: (guru: Asatidz) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout?: () => void;
  petinggiCount?: number;
  panitiaCount?: number;
  kelasCount?: number;
  mapelCount?: number;
  jadwalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activeSubTab,
  onSelectTab,
  onSelectSubTab,
  currentRole,
  onSwitchToAdmin,
  onSwitchToAsatidz,
  profile,
  currentTerm,
  allTerms,
  onSelectTerm,
  onAddTerm,
  currentAsatidz,
  allAsatidz,
  onSelectAsatidz,
  isMobileOpen,
  setIsMobileOpen,
  onLogout,
  petinggiCount = 0,
  panitiaCount = 0,
  kelasCount = 0,
  mapelCount = 0,
  jadwalCount = 0,
}) => {
  const [showTermModal, setShowTermModal] = useState(false);
  const [newYear, setNewYear] = useState('2026/2027');
  const [newSemester, setNewSemester] = useState<'ganjil' | 'genap'>('ganjil');

  // Track expanded accordion menus
  const [expandedTabs, setExpandedTabs] = useState<Record<TabKey, boolean>>({
    dashboard: true,
    profil: true,
    lembaga: true,
    asatidz: true,
    rekapan: true,
    input_nilai: true,
  });

  const toggleExpandTab = (key: TabKey) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const navItems: {
    key: TabKey;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
    subItems: SubMenuItem[];
  }[] = [
    {
      key: 'dashboard',
      label: 'DASBOARD',
      sublabel: 'Statistik & Ringkasan',
      icon: LayoutDashboard,
      subItems: [],
    },
    {
      key: 'profil',
      label: 'PROFIL PESANTREN',
      sublabel: currentRole === 'admin' ? 'Petinggi, Panitia & Sandi' : 'Pimpinan & Panitia Ujian',
      icon: Landmark,
      subItems:
        currentRole === 'admin'
          ? [
              { id: 'petinggi', label: 'PIMPINAN PESANTREN', badge: petinggiCount > 0 ? petinggiCount : undefined },
              { id: 'panitia', label: 'PANITIA UJIAN', badge: panitiaCount > 0 ? panitiaCount : undefined },
              { id: 'semester', label: 'PENGATURAN SEMESTER', badge: allTerms.length > 0 ? allTerms.length : undefined },
              { id: 'identitas', label: 'IDENTITAS PESANTREN' },
              { id: 'keamanan', label: 'ADMIN APLIKASI', adminOnly: true },
              { id: 'akses', label: 'HAK AKSES PENGGUNA', adminOnly: true },
            ]
          : [
              { id: 'petinggi', label: 'PIMPINAN PESANTREN', badge: petinggiCount > 0 ? petinggiCount : undefined },
              { id: 'panitia', label: 'PANITIA UJIAN', badge: panitiaCount > 0 ? panitiaCount : undefined },
            ],
    },
    {
      key: 'lembaga',
      label: 'LEMBAGA',
      sublabel: currentRole === 'admin' ? 'Santri, Kepribadian & Jadwal' : 'Data Santri & Jadwal Ujian',
      icon: Building2,
      subItems:
        currentRole === 'admin'
          ? [
              { id: 'kelas', label: 'DATA SANTRI', badge: kelasCount > 0 ? kelasCount : undefined },
              { id: 'kepribadian', label: 'KEPRIBADIAN SANTRI', adminOnly: true },
              { id: 'jadwal', label: 'JADWAL UJIAN', badge: jadwalCount > 0 ? jadwalCount : undefined },
            ]
          : [
              { id: 'kelas', label: 'DATA SANTRI', badge: kelasCount > 0 ? kelasCount : undefined },
              { id: 'jadwal', label: 'JADWAL UJIAN', badge: jadwalCount > 0 ? jadwalCount : undefined },
            ],
    },
    ...(currentRole === 'admin'
      ? [
          {
            key: 'asatidz' as TabKey,
            label: 'ASATIDZ',
            sublabel: 'Kelola Guru & Rekapan',
            icon: GraduationCap,
            subItems: [
              { id: 'akun', label: 'DAFTAR AKUN GURU', badge: allAsatidz.length > 0 ? allAsatidz.length : undefined },
              { id: 'mengajar', label: 'ATUR TUGAS MENGAJAR' },
              { id: 'rekapan', label: 'REKAPAN' },
            ],
          },
          {
            key: 'rekapan' as TabKey,
            label: 'RAPORT',
            sublabel: 'Edit Rapor & Cetak PDF',
            icon: FileSpreadsheet,
            badge: 'PDF',
            subItems: [
              { id: 'rekap_guru', label: 'EDIT RAPOR' },
              { id: 'cetak_rapor', label: 'CETAK RAPORT' },
            ],
          },
        ]
      : [
          {
            key: 'input_nilai' as TabKey,
            label: 'INPUT NILAI',
            sublabel: 'Input Nilai Mapel Santri',
            icon: ClipboardEdit,
            badge: 'GURU',
            subItems: [],
          },
        ]),
  ];

  const handleAddNewTerm = (e: React.FormEvent) => {
    e.preventDefault();
    const label = `Semester ${newSemester === 'ganjil' ? 'Ganjil' : 'Genap'} ${newYear}`;
    const id = `term-${newYear.replace('/', '-')}-${newSemester}`;
    const termObj: AcademicTerm = {
      id,
      year: newYear,
      semester: newSemester,
      label,
      isActive: false,
    };
    onAddTerm(termObj);
    onSelectTerm(termObj);
    setShowTermModal(false);
  };

  const logoSrc = profile.logoUrl || '/logo_alhusna.jpg';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-950 text-white flex flex-col border-r border-emerald-800/40 shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 1. Sidebar Header with Pesantren Logo & Identity */}
        <div className="p-4 border-b border-emerald-800/50 bg-emerald-950/60 relative">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={logoSrc}
                alt="Logo PPTQ Alhusna"
                className="w-13 h-13 rounded-full object-cover shadow-md ring-2 ring-amber-400/80 bg-white p-0.5"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // fallback to public logo
                  (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-emerald-950 rounded-full" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-extrabold text-white tracking-wide leading-tight truncate">
                PPTQ ALHUSNA
              </h1>
              <p className="text-[10px] text-amber-300/90 font-medium truncate mt-0.5">
                Tahfidzul Qur&apos;an &amp; Syariah
              </p>
              <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-800/80 text-[9px] text-emerald-200 font-semibold tracking-wider">
                <span>BUNGO — JAMBI</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Academic Semester Switcher Pill inside Sidebar (Compact) */}
        <div className="px-3 py-2 border-b border-emerald-800/40">
          {currentRole === 'admin' ? (
            <button
              id="sidebar-btn-ganti-semester"
              onClick={() => setShowTermModal(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-900 text-white text-[11px] font-bold transition border border-emerald-700/50 text-left group cursor-pointer"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{currentTerm.label}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0 ml-1" />
            </button>
          ) : (
            <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-900/50 text-emerald-100 text-[11px] font-semibold border border-emerald-800/60">
              <span className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{currentTerm.label}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-800 text-emerald-200 font-bold shrink-0">
                AKTIF
              </span>
            </div>
          )}
        </div>

        {/* 3. Navigation Links List */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 space-y-1.5">
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            const isExpanded = expandedTabs[item.key] ?? true;

            return (
              <div key={item.key} className="space-y-0.5">
                {/* Main Menu Button */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    id={`sidebar-nav-${item.key}`}
                    onClick={() => {
                      const defaultSubId = item.subItems[0]?.id;
                      if (!isActive) {
                        onSelectTab(item.key, defaultSubId);
                        if (onSelectSubTab && defaultSubId) {
                          onSelectSubTab(defaultSubId);
                        }
                        setExpandedTabs((prev) => ({ ...prev, [item.key]: true }));
                        if (item.subItems.length === 0) {
                          setIsMobileOpen(false);
                        }
                      } else {
                        if (!isExpanded) {
                          setExpandedTabs((prev) => ({ ...prev, [item.key]: true }));
                          if (defaultSubId && (!activeSubTab || !item.subItems.some((s) => s.id === activeSubTab))) {
                            onSelectTab(item.key, defaultSubId);
                            if (onSelectSubTab) onSelectSubTab(defaultSubId);
                          }
                        } else {
                          toggleExpandTab(item.key);
                        }
                      }
                    }}
                    className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all text-left group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-1 ring-amber-400/40'
                        : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-900/60 text-emerald-300 group-hover:bg-emerald-800 group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-amber-400 text-emerald-950'
                                : 'bg-emerald-800/80 text-emerald-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] font-normal text-emerald-200/70 truncate">
                        {item.sublabel}
                      </span>
                    </div>

                    {/* Expand/Collapse Chevron Indicator */}
                    {item.subItems.length > 0 && (
                      <ChevronDown
                        className={`w-4 h-4 text-emerald-300 transition-transform duration-200 flex-shrink-0 ${
                          isExpanded ? 'rotate-0 text-amber-300' : '-rotate-90 text-emerald-400/60'
                        }`}
                      />
                    )}
                  </button>
                </div>

                {/* Sub-menu Items (Indented directly under main feature, as in Image 3) */}
                {isExpanded && item.subItems.length > 0 && (
                  <div className="ml-5 pl-3 border-l-2 border-emerald-700/50 my-1 space-y-0.5 py-0.5">
                    {item.subItems.map((subItem) => {
                      const isSubActive =
                        isActive &&
                        (activeSubTab === subItem.id ||
                          (!activeSubTab && item.subItems[0]?.id === subItem.id));

                      return (
                        <button
                          key={subItem.id}
                          id={`sidebar-subnav-${item.key}-${subItem.id}`}
                          onClick={() => {
                            onSelectTab(item.key, subItem.id);
                            if (onSelectSubTab) onSelectSubTab(subItem.id);
                            setIsMobileOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left group ${
                            isSubActive
                              ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                              : 'text-emerald-200/80 hover:text-white hover:bg-emerald-800/60 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                                isSubActive
                                  ? 'bg-emerald-950'
                                  : 'bg-emerald-500/60 group-hover:bg-amber-300'
                              }`}
                            />
                            <span className="truncate uppercase tracking-wider font-semibold">{subItem.label}</span>
                          </div>

                          {subItem.badge !== undefined && subItem.badge !== '' && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-1 flex-shrink-0 ${
                                isSubActive
                                  ? 'bg-emerald-900 text-amber-300'
                                  : 'bg-emerald-800/70 text-emerald-300'
                              }`}
                            >
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MODAL: Switch / Add Academic Term */}
      {/* ============================================================ */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-200" />
                <h4 className="font-bold text-sm sm:text-base">
                  Pilih Semester &amp; Tahun Ajaran
                </h4>
              </div>
              <button
                onClick={() => setShowTermModal(false)}
                className="text-emerald-200 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengubah semester akan langsung menyaring seluruh tampilan nilai ujian santri di aplikasi.
              </p>

              <div className="space-y-2">
                {allTerms.map((term) => {
                  const isSelected = currentTerm.id === term.id;
                  return (
                    <div
                      key={term.id}
                      onClick={() => {
                        onSelectTerm(term);
                        setShowTermModal(false);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isSelected ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-xs sm:text-sm">{term.label}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Form to Add New Term (Admin Only) */}
              {currentRole === 'admin' && (
                <form
                  onSubmit={handleAddNewTerm}
                  className="pt-3 border-t border-slate-100 space-y-3"
                >
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tambah Semester / Tahun Baru</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        Tahun Ajaran
                      </label>
                      <input
                        type="text"
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        placeholder="Contoh: 2026/2027"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        Semester
                      </label>
                      <select
                        value={newSemester}
                        onChange={(e) => setNewSemester(e.target.value as 'ganjil' | 'genap')}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="ganjil">Ganjil</option>
                        <option value="genap">Genap</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Tambah &amp; Aktifkan Semester
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
