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
  LogOut,
  KeyRound,
  Menu,
  X,
  Plus,
} from 'lucide-react';

export type TabKey = 'dashboard' | 'profil' | 'lembaga' | 'asatidz' | 'rekapan';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
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
}) => {
  const [showTermModal, setShowTermModal] = useState(false);
  const [showAsatidzPicker, setShowAsatidzPicker] = useState(false);
  const [newYear, setNewYear] = useState('2026/2027');
  const [newSemester, setNewSemester] = useState<'ganjil' | 'genap'>('ganjil');

  const navItems: {
    key: TabKey;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
  }[] = [
    {
      key: 'dashboard',
      label: 'DASBOARD',
      sublabel: 'Statistik & Ringkasan',
      icon: LayoutDashboard,
    },
    {
      key: 'profil',
      label: 'PROFIL PESANTREN',
      sublabel: currentRole === 'admin' ? 'Petinggi, Panitia & Sandi' : 'Informasi Pesantren',
      icon: Landmark,
    },
    {
      key: 'lembaga',
      label: 'LEMBAGA',
      sublabel: 'Daftar Kelas, Mapel & Jadwal',
      icon: Building2,
    },
    {
      key: 'asatidz',
      label: 'ASATIDZ',
      sublabel: currentRole === 'admin' ? 'Kelola Guru & Nilai Ujian' : 'Input Nilai Ujian',
      icon: GraduationCap,
      badge: currentRole === 'asatidz' ? 'Input Nilai' : undefined,
    },
    {
      key: 'rekapan',
      label: 'HASIL REKAPAN',
      sublabel: 'Cetak & Rekap Excel',
      icon: FileSpreadsheet,
      badge: 'Excel',
    },
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

        {/* 2. Academic Semester Switcher Pill inside Sidebar */}
        <div className="px-3 pt-3 pb-2 border-b border-emerald-800/40">
          <div className="bg-emerald-900/70 rounded-xl p-2.5 border border-emerald-700/50">
            <div className="flex items-center justify-between text-[11px] text-emerald-300 mb-1.5 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>SEMESTER AKTIF</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-700/80 text-white font-bold">
                {currentTerm.semester.toUpperCase()}
              </span>
            </div>

            <button
              id="sidebar-btn-ganti-semester"
              onClick={() => setShowTermModal(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-950 text-white text-xs font-bold transition border border-emerald-600/40 text-left group"
            >
              <span className="truncate">{currentTerm.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0 ml-1" />
            </button>
          </div>
        </div>

        {/* 3. Navigation Links List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 no-scrollbar">
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                id={`sidebar-nav-${item.key}`}
                onClick={() => {
                  onSelectTab(item.key);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all text-left group ${
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
              </button>
            );
          })}
        </div>

        {/* 4. Bottom User Role & Authentication Area */}
        <div className="p-3 border-t border-emerald-800/60 bg-emerald-950/80">
          {currentRole === 'admin' ? (
            <div className="bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-700/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">Administrator</p>
                  <p className="text-[10px] text-emerald-300 font-medium">Akses Penuh Pengelolaan</p>
                </div>
              </div>

              <button
                id="sidebar-btn-switch-to-asatidz"
                onClick={onSwitchToAsatidz}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-[11px] font-semibold text-emerald-100 transition border border-emerald-600/40"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Beralih ke Portal Asatidz</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-950/40 rounded-xl p-2.5 border border-amber-800/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-200 truncate">
                    {currentAsatidz ? currentAsatidz.nama : 'Akun Guru'}
                  </p>
                  <p className="text-[10px] text-amber-400/80 font-medium">Portal Penginput Nilai</p>
                </div>
              </div>

              {/* Asatidz Account Picker */}
              <div className="relative mb-2">
                <button
                  onClick={() => setShowAsatidzPicker(!showAsatidzPicker)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded bg-black/20 text-[11px] text-amber-200 hover:bg-black/30 border border-amber-700/40"
                >
                  <span className="truncate">Ganti Akun Asatidz</span>
                  <ChevronDown className="w-3 h-3 text-amber-300 ml-1 flex-shrink-0" />
                </button>

                {showAsatidzPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-emerald-700 rounded-xl shadow-2xl py-1 z-50 max-h-48 overflow-y-auto">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-amber-400 uppercase border-b border-slate-800">
                      Pilih Nama Ustadz / Ustadzah
                    </div>
                    {allAsatidz.map((guru) => (
                      <button
                        key={guru.id}
                        onClick={() => {
                          onSelectAsatidz(guru);
                          setShowAsatidzPicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs hover:bg-emerald-900/60 transition ${
                          currentAsatidz?.id === guru.id ? 'font-bold text-amber-300 bg-emerald-950' : 'text-slate-200'
                        }`}
                      >
                        {guru.nama}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Login Admin Button requiring Password */}
              <button
                id="sidebar-btn-login-admin"
                onClick={onSwitchToAdmin}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-[11px] font-bold text-white transition shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Masuk Akun Admin</span>
              </button>
            </div>
          )}
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
