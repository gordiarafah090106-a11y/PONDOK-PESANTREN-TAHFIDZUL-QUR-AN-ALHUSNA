import React, { useState } from 'react';
import {
  AcademicTerm,
  PesantrenProfile,
  RoleType,
  Asatidz,
} from '../types';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  GraduationCap,
  Shield,
  UserCheck,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  profile: PesantrenProfile;
  currentTerm: AcademicTerm;
  allTerms: AcademicTerm[];
  onSelectTerm: (term: AcademicTerm) => void;
  onAddTerm: (newTerm: AcademicTerm) => void;
  currentRole: RoleType;
  onSwitchRole: (role: RoleType) => void;
  currentAsatidz: Asatidz | null;
  allAsatidz: Asatidz[];
  onSelectAsatidz: (guru: Asatidz) => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentTerm,
  allTerms,
  onSelectTerm,
  onAddTerm,
  currentRole,
  onSwitchRole,
  currentAsatidz,
  allAsatidz,
  onSelectAsatidz,
}) => {
  const [showTermModal, setShowTermModal] = useState(false);
  const [showAsatidzPicker, setShowAsatidzPicker] = useState(false);
  const [newYear, setNewYear] = useState('2026/2027');
  const [newSemester, setNewSemester] = useState<'ganjil' | 'genap'>('ganjil');

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

  return (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-xs">
      {/* Top Islamic Pattern Accent Bar */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Pesantren Identity */}
          <div className="flex items-center space-x-3.5">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Logo Pesantren"
                className="w-12 h-12 rounded-xl object-contain shadow-xs border border-emerald-200 bg-white p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white shadow-sm border border-emerald-600/30 flex-shrink-0">
                <BookOpen className="w-6 h-6 text-emerald-100" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-emerald-950 leading-tight">
                  {profile.nama}
                </h1>
              </div>
              <p className="text-xs text-emerald-700 font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
                <span>SIM Penilaian Imtihan Santri</span>
                <span className="inline-block w-1 h-1 rounded-full bg-emerald-400" />
                <span className="text-slate-500">NSPP: {profile.nspp}</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Academic Term Switcher & Role Selector */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            
            {/* Global Academic Year / Semester Button */}
            <div className="relative">
              <button
                id="btn-semester-selector"
                onClick={() => setShowTermModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold transition-all duration-150 shadow-2xs group"
                title="Klik untuk mengubah Tahun Ajaran & Semester"
              >
                <Calendar className="w-4 h-4 text-emerald-700 group-hover:scale-105 transition-transform" />
                <div className="text-left leading-tight">
                  <span className="block text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
                    Tahun Ajaran
                  </span>
                  <span>{currentTerm.label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-600 ml-1" />
              </button>
            </div>

            {/* Asatidz Switcher (When in Asatidz Mode) */}
            {currentRole === 'asatidz' && (
              <div className="relative">
                <button
                  id="btn-switch-asatidz-profile"
                  onClick={() => setShowAsatidzPicker(!showAsatidzPicker)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium transition shadow-2xs"
                >
                  <GraduationCap className="w-4 h-4 text-amber-700" />
                  <span className="truncate max-w-[130px] font-semibold">
                    {currentAsatidz ? currentAsatidz.nama : 'Pilih Akun Guru'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                </button>

                {showAsatidzPicker && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Pilih Akun Asatidz
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {allAsatidz.map((guru) => (
                        <button
                          key={guru.id}
                          onClick={() => {
                            onSelectAsatidz(guru);
                            setShowAsatidzPicker(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition ${
                            currentAsatidz?.id === guru.id
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{guru.nama}</div>
                            <div className="text-[10px] text-slate-500">{guru.gelar || guru.nip}</div>
                          </div>
                          {currentAsatidz?.id === guru.id && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Role Switcher: Admin vs Asatidz */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                id="role-tab-admin"
                onClick={() => onSwitchRole('admin')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  currentRole === 'admin'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                id="role-tab-asatidz"
                onClick={() => onSwitchRole('asatidz')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  currentRole === 'asatidz'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Asatidz</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Modal: Ganti Tahun Ajaran / Semester */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden">
            <div className="bg-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base sm:text-lg">
                  Pilih / Tambah Semester Ujian
                </h3>
              </div>
              <button
                onClick={() => setShowTermModal(false)}
                className="text-emerald-200 hover:text-white text-xl font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <strong className="text-emerald-900 font-semibold">Catatan Sistem: </strong>
                Memilih semester yang berbeda akan memuat basis data nilai ujian yang sesuai untuk semester tersebut. Jika beralih ke semester genap yang baru, halaman nilai akan bersih dan siap untuk periode baru.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Daftar Periode Tersedia
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {allTerms.map((term) => (
                    <div
                      key={term.id}
                      onClick={() => {
                        onSelectTerm(term);
                        setShowTermModal(false);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        currentTerm.id === term.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            currentTerm.id === term.id ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-slate-300'
                          }`}
                        />
                        <div>
                          <div className="text-sm">{term.label}</div>
                          <div className="text-[11px] text-slate-500 capitalize">
                            Tahun {term.year} • {term.semester}
                          </div>
                        </div>
                      </div>
                      {currentTerm.id === term.id && (
                        <span className="text-[11px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Tambah Semester Baru */}
              <form onSubmit={handleAddNewTerm} className="pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Buka Semester Baru</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Tahun Ajaran</label>
                    <input
                      type="text"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      placeholder="e.g. 2026/2027"
                      className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Semester</label>
                    <select
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value as 'ganjil' | 'genap')}
                      className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                      <option value="ganjil">Ganjil</option>
                      <option value="genap">Genap</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buka & Aktifkan Periode Baru</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
