import React, { useState } from 'react';
import {
  AcademicTerm,
  AdminUser,
  Asatidz,
  PesantrenProfile,
  RoleType,
} from '../types';
import {
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Sparkles,
  AlertCircle,
  LogIn,
  User,
  ChevronDown,
} from 'lucide-react';

interface LoginViewProps {
  profile: PesantrenProfile;
  currentTerm: AcademicTerm;
  allTerms: AcademicTerm[];
  onSelectTerm: (term: AcademicTerm) => void;
  adminPassword: string;
  allAsatidz: Asatidz[];
  allAdminUsers?: AdminUser[];
  onLoginSuccess: (role: RoleType, asatidzAccount?: Asatidz) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  profile,
  currentTerm,
  allTerms,
  onSelectTerm,
  adminPassword,
  allAsatidz,
  allAdminUsers = [],
  onLoginSuccess,
}) => {
  // Unified Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleUnifiedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setLoginError('Silakan masukkan password.');
      return;
    }

    // 1. Check matched Admin User in registered adminUsers list (by email, name, or username)
    if (allAdminUsers && allAdminUsers.length > 0) {
      const matchedAdmin = allAdminUsers.find((adm) => {
        const email = (adm.email || '').trim().toLowerCase();
        const nama = (adm.nama || '').trim().toLowerCase();
        return (
          cleanUsername === email ||
          cleanUsername === nama ||
          (cleanUsername.length >= 3 && (email.includes(cleanUsername) || nama.includes(cleanUsername)))
        );
      });

      if (matchedAdmin) {
        if (cleanPassword === (matchedAdmin.password || '').trim() || cleanPassword === adminPassword.trim()) {
          onLoginSuccess('admin');
          return;
        } else {
          setLoginError(`Password untuk akun admin "${matchedAdmin.nama}" salah! Silakan periksa kembali.`);
          return;
        }
      }
    }

    // 2. Check if generic Admin username or direct adminPassword
    const isAdminUsername =
      cleanUsername === 'admin' ||
      cleanUsername === 'administrator' ||
      cleanUsername === '' ||
      cleanUsername === 'alhusna';

    if (isAdminUsername && cleanPassword === adminPassword.trim()) {
      onLoginSuccess('admin');
      return;
    }

    // 3. Check if Teacher / Asatidz by username (NIP, Nama, Email)
    if (cleanUsername && cleanUsername !== 'admin') {
      const matchedTeacher = allAsatidz.find((g) => {
        const nip = (g.nip || '').trim().toLowerCase();
        const nama = (g.nama || '').trim().toLowerCase();
        const email = (g.email || '').trim().toLowerCase();
        return (
          cleanUsername === nip ||
          cleanUsername === nama ||
          cleanUsername === email ||
          (cleanUsername.length >= 3 && nama.includes(cleanUsername))
        );
      });

      if (matchedTeacher) {
        const expectedTeacherPass = (matchedTeacher.password || '123456').trim();
        if (cleanPassword === expectedTeacherPass) {
          onLoginSuccess('asatidz', matchedTeacher);
          return;
        } else {
          setLoginError(`Password untuk akun guru "${matchedTeacher.nama}" salah! Silakan periksa kembali.`);
          return;
        }
      }
    }

    // 4. Fallback check: If password exactly matches admin password
    if (cleanPassword === adminPassword.trim()) {
      onLoginSuccess('admin');
      return;
    }

    // 5. Fallback check: If password matches any admin in allAdminUsers
    const adminByPass = allAdminUsers.find((adm) => (adm.password || '').trim() === cleanPassword);
    if (adminByPass) {
      onLoginSuccess('admin');
      return;
    }

    // 6. Fallback check: If password matches a teacher's password
    const teacherByPass = allAsatidz.find((g) => (g.password || '').trim() === cleanPassword);
    if (teacherByPass && (!cleanUsername || teacherByPass.nama.toLowerCase().includes(cleanUsername))) {
      onLoginSuccess('asatidz', teacherByPass);
      return;
    }

    setLoginError('Username atau Password yang Anda masukkan tidak valid. Silakan periksa kembali.');
  };

  const logoSrc = profile.logoUrl || '/logo_alhusna.jpg';

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-y-auto login-scroll">
      
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
              Silakan masukkan username dan password untuk melanjutkan
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

          {/* 2. Unified Login Form (Model Satu Bagian) */}
          <form onSubmit={handleUnifiedLogin} className="space-y-4">
            
            {/* Field 1: Masukkan Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Masukkan Username</span>
              </label>
              <div className="relative">
                <input
                  id="input-login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ketik username (admin / NIP / nama guru)..."
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Field 2: Masukkan Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Masukkan Password</span>
              </label>
              <div className="relative">
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none pr-10 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-submit-unified-login"
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Aplikasi</span>
            </button>
          </form>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 text-center text-xs text-emerald-300/70 py-2">
        &copy; {new Date().getFullYear()} PPTQ Alhusna — Muara Bungo, Jambi. All rights reserved.
      </footer>

    </div>
  );
};
