import React, { useState } from 'react';
import {
  AcademicTerm,
  Asatidz,
  PesantrenProfile,
  RoleType,
} from '../types';
import {
  Shield,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  User,
  School,
  ChevronDown,
} from 'lucide-react';

interface LoginViewProps {
  profile: PesantrenProfile;
  currentTerm: AcademicTerm;
  allTerms: AcademicTerm[];
  onSelectTerm: (term: AcademicTerm) => void;
  adminPassword: string;
  allAsatidz: Asatidz[];
  onLoginSuccess: (role: RoleType, asatidzAccount?: Asatidz) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  profile,
  currentTerm,
  allTerms,
  onSelectTerm,
  adminPassword,
  allAsatidz,
  onLoginSuccess,
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<'admin' | 'asatidz'>('admin');

  // Admin Form State
  const [adminInputPassword, setAdminInputPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Asatidz Form State
  const [selectedGuruId, setSelectedGuruId] = useState<string>(allAsatidz[0]?.id || '');
  const [guruIdentifier, setGuruIdentifier] = useState<string>('');
  const [guruPassword, setGuruPassword] = useState<string>('');
  const [showGuruPass, setShowGuruPass] = useState(false);
  const [guruError, setGuruError] = useState<string | null>(null);

  // Quick Demo account helper drawer
  const [showDemoList, setShowDemoList] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (adminInputPassword.trim() === adminPassword.trim()) {
      onLoginSuccess('admin');
    } else {
      setAdminError('Password Administrator salah! Silakan periksa kembali kata sandi Anda.');
    }
  };

  const handleAsatidzLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setGuruError(null);

    // Find teacher by selected dropdown OR by typed NIK/NUPTK/Nama
    let targetTeacher: Asatidz | undefined;

    if (selectedGuruId) {
      targetTeacher = allAsatidz.find((g) => g.id === selectedGuruId);
    }

    if (!targetTeacher && guruIdentifier.trim()) {
      const q = guruIdentifier.trim().toLowerCase();
      targetTeacher = allAsatidz.find(
        (g) =>
          g.nip?.toLowerCase() === q ||
          g.nama.toLowerCase().includes(q) ||
          g.email?.toLowerCase() === q
      );
    }

    if (!targetTeacher) {
      setGuruError('Akun guru tidak ditemukan. Pilih nama guru dari daftar atau masukkan NIK/NUPTK yang valid.');
      return;
    }

    const expectedPass = targetTeacher.password || '123456';
    if (guruPassword.trim() === expectedPass.trim()) {
      onLoginSuccess('asatidz', targetTeacher);
    } else {
      setGuruError(`Password untuk ${targetTeacher.nama} salah! Silakan hubungi Admin untuk konfirmasi password akun.`);
    }
  };

  const logoSrc = profile.logoUrl || '/logo_alhusna.jpg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Decorative Islamic Geometric subtle background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Identity */}
      <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-emerald-800/40">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt="Logo Alhusna"
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full object-cover shadow-lg ring-2 ring-amber-400 bg-white p-0.5"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
            }}
          />
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-wide leading-tight">
              PPTQ ALHUSNA
            </h1>
            <p className="text-[11px] text-amber-300 font-medium">
              Pondok Pesantren Tahfidzul Qur&apos;an
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/40 text-xs text-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sistem Informasi Nilai &amp; Akademik</span>
        </div>
      </header>

      {/* Main Login Box */}
      <main className="relative z-10 max-w-md w-full mx-auto my-6 sm:my-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-emerald-500/30">
          
          {/* Header Title inside Card */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Masuk ke Aplikasi
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Silakan pilih peran dan tentukan semester yang ingin diakses
            </p>
          </div>

          {/* 1. Academic Term Selection (Semester Chooser on Login) */}
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <label className="block text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Pilih Periode Semester Aktif</span>
            </label>
            <div className="relative">
              <select
                id="login-select-semester"
                value={currentTerm.id}
                onChange={(e) => {
                  const found = allTerms.find((t) => t.id === e.target.value);
                  if (found) onSelectTerm(found);
                }}
                className="w-full text-xs font-bold px-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none pr-8 shadow-xs cursor-pointer"
              >
                {allTerms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} {t.isActive ? '(Default Aktif)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1">
              Data nilai dan rekapitulasi akan disesuaikan dengan semester ini.
            </p>
          </div>

          {/* 2. Role Selector Tabs: Admin vs Asatidz */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              id="tab-login-admin"
              type="button"
              onClick={() => {
                setSelectedRoleTab('admin');
                setAdminError(null);
                setGuruError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
                selectedRoleTab === 'admin'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-300" />
              <span>ADMIN</span>
            </button>

            <button
              id="tab-login-asatidz"
              type="button"
              onClick={() => {
                setSelectedRoleTab('asatidz');
                setAdminError(null);
                setGuruError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
                selectedRoleTab === 'asatidz'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>ASATIDZ</span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: ADMIN LOGIN FORM */}
          {/* ============================================================ */}
          {selectedRoleTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password Administrator
                </label>
                <div className="relative">
                  <input
                    id="input-login-admin-password"
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminInputPassword}
                    onChange={(e) => setAdminInputPassword(e.target.value)}
                    placeholder="Masukkan password admin..."
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none pr-10 transition"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {adminError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                id="btn-submit-login-admin"
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sebagai Administrator</span>
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: ASATIDZ LOGIN FORM */}
          {/* ============================================================ */}
          {selectedRoleTab === 'asatidz' && (
            <form onSubmit={handleAsatidzLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Akun Guru (Asatidz)
                </label>
                <div className="relative">
                  <select
                    id="select-login-asatidz-account"
                    value={selectedGuruId}
                    onChange={(e) => {
                      setSelectedGuruId(e.target.value);
                      const g = allAsatidz.find((item) => item.id === e.target.value);
                      if (g) setGuruIdentifier(g.nip || g.nama);
                    }}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none appearance-none pr-8 cursor-pointer"
                  >
                    {allAsatidz.map((guru) => (
                      <option key={guru.id} value={guru.id}>
                        {guru.nama} {guru.nip ? `(${guru.nip})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Password Guru</span>
                  {selectedGuruId && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      Sesuai data admin
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="input-login-asatidz-password"
                    type={showGuruPass ? 'text' : 'password'}
                    value={guruPassword}
                    onChange={(e) => setGuruPassword(e.target.value)}
                    placeholder="Masukkan password akun guru..."
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none pr-10 transition"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowGuruPass(!showGuruPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showGuruPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {guruError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{guruError}</span>
                </div>
              )}

              <button
                id="btn-submit-login-asatidz"
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Portal Asatidz</span>
              </button>
            </form>
          )}

          {/* Quick Demo Helper Section */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowDemoList(!showDemoList)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1.5"
            >
              <span>{showDemoList ? '▲ Sembunyikan' : '▼ Lihat Daftar Akun & Password Guru'}</span>
            </button>

            {showDemoList && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-h-48 overflow-y-auto">
                <div className="font-bold text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>Akun Admin:</span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {adminPassword}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-slate-600 pt-1">
                  Akun Asatidz / Guru:
                </div>
                {allAsatidz.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedRoleTab('asatidz');
                      setSelectedGuruId(g.id);
                      setGuruPassword(g.password || 'MP2471FV');
                    }}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 cursor-pointer flex items-center justify-between border border-transparent hover:border-emerald-200 transition"
                  >
                    <span className="font-medium text-slate-800">{g.nama}</span>
                    <span className="font-mono text-emerald-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {g.password || 'MP2471FV'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 text-center text-xs text-emerald-300/70 py-2">
        &copy; {new Date().getFullYear()} PPTQ Alhusna — Muara Bungo, Jambi. All rights reserved.
      </footer>

    </div>
  );
};
