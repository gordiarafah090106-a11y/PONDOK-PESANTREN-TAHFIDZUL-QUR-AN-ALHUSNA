import React, { useState } from 'react';
import { Shield, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storedPassword: string;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storedPassword,
}) => {
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validPassword = storedPassword || 'admin123';

    if (inputPassword.trim() === validPassword.trim()) {
      setInputPassword('');
      setError(null);
      onSuccess();
    } else {
      setError('Password administrator tidak sesuai! Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-emerald-200 hover:text-white font-bold p-1 rounded-lg"
          >
            ✕
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 ring-4 ring-white/20 flex items-center justify-center mb-3">
            <KeyRound className="w-7 h-7 text-amber-300" />
          </div>

          <h3 className="font-extrabold text-lg text-white">
            Autentikasi Admin
          </h3>
          <p className="text-xs text-emerald-100/90 mt-1">
            PPTQ ALHUSNA Bungo Jambi
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed text-center">
            Masukkan password administrator untuk membuka hak akses pengelolaan profil pesantren, lembaga, asatidz, dan konfigurasi nilai.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password Administrator
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Masukkan password admin..."
                autoFocus
                className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              *Password default: <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">admin123</code>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-md text-center flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>Masuk Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
