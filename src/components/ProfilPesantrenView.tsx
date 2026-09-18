import React, { useState } from 'react';
import {
  PesantrenProfile,
  Petinggi,
  PanitiaUjian,
  RolePermissions,
  RoleType,
} from '../types';
import {
  Landmark,
  Users,
  ShieldCheck,
  Edit2,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Info,
  Award,
  Phone,
  BookOpen,
  Lock,
  AlertCircle,
} from 'lucide-react';

interface ProfilPesantrenViewProps {
  profile: PesantrenProfile;
  onUpdateProfile: (updated: PesantrenProfile) => void;
  petinggiList: Petinggi[];
  onUpdatePetinggi: (updated: Petinggi[]) => void;
  panitiaList: PanitiaUjian[];
  onUpdatePanitia: (updated: PanitiaUjian[]) => void;
  permissions: { admin: RolePermissions; asatidz: RolePermissions };
  onUpdatePermissions: (updated: { admin: RolePermissions; asatidz: RolePermissions }) => void;
  currentRole: RoleType;
  adminPassword?: string;
  onUpdateAdminPassword?: (newPassword: string) => void;
}

export const ProfilPesantrenView: React.FC<ProfilPesantrenViewProps> = ({
  profile,
  onUpdateProfile,
  petinggiList,
  onUpdatePetinggi,
  panitiaList,
  onUpdatePanitia,
  permissions,
  onUpdatePermissions,
  currentRole,
  adminPassword = 'admin123',
  onUpdateAdminPassword,
}) => {
  const isAdmin = currentRole === 'admin';
  const [activeSubTab, setActiveSubTab] = useState<'petinggi' | 'panitia' | 'identitas' | 'keamanan' | 'akses'>('petinggi');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<PesantrenProfile>(profile);

  // Petinggi Modal State
  const [petinggiModalOpen, setPetinggiModalOpen] = useState(false);
  const [editingPetinggi, setEditingPetinggi] = useState<Petinggi | null>(null);
  const [petinggiForm, setPetinggiForm] = useState({
    nama: '',
    gelar: '',
    jabatan: '',
    kontak: '',
    urutan: petinggiList.length + 1,
  });

  // Panitia Modal State
  const [panitiaModalOpen, setPanitiaModalOpen] = useState(false);
  const [editingPanitia, setEditingPanitia] = useState<PanitiaUjian | null>(null);
  const [panitiaForm, setPanitiaForm] = useState({
    nama: '',
    jabatan: '',
    tugas: '',
    kontak: '',
  });

  // --- Password Management State (Admin Only) ---
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ success?: boolean; message?: string } | null>(null);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUpdateProfile({ ...profile, logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Petinggi
  const handleSavePetinggi = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPetinggi) {
      const updated = petinggiList.map((p) =>
        p.id === editingPetinggi.id ? { ...p, ...petinggiForm } : p
      );
      onUpdatePetinggi(updated);
    } else {
      const newPetinggi: Petinggi = {
        id: `pet-${Date.now()}`,
        ...petinggiForm,
      };
      onUpdatePetinggi([...petinggiList, newPetinggi]);
    }
    setPetinggiModalOpen(false);
    setEditingPetinggi(null);
  };

  const handleDeletePetinggi = (id: string) => {
    if (confirm('Yakin ingin menghapus nama petinggi ini dari daftar?')) {
      onUpdatePetinggi(petinggiList.filter((p) => p.id !== id));
    }
  };

  // Save Panitia
  const handleSavePanitia = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPanitia) {
      const updated = panitiaList.map((p) =>
        p.id === editingPanitia.id ? { ...p, ...panitiaForm } : p
      );
      onUpdatePanitia(updated);
    } else {
      const newPanitia: PanitiaUjian = {
        id: `pan-${Date.now()}`,
        ...panitiaForm,
      };
      onUpdatePanitia([...panitiaList, newPanitia]);
    }
    setPanitiaModalOpen(false);
    setEditingPanitia(null);
  };

  const handleDeletePanitia = (id: string) => {
    if (confirm('Yakin ingin menghapus nama panitia ujian ini?')) {
      onUpdatePanitia(panitiaList.filter((p) => p.id !== id));
    }
  };

  // Toggle permission for a role
  const togglePermission = (role: 'admin' | 'asatidz', key: keyof RolePermissions) => {
    if (!isAdmin) return;
    onUpdatePermissions({
      ...permissions,
      [role]: {
        ...permissions[role],
        [key]: !permissions[role][key],
      },
    });
  };

  // Password Change Handler
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (oldPasswordInput.trim() !== adminPassword.trim()) {
      setPasswordNotice({
        success: false,
        message: 'Password lama tidak sesuai dengan password saat ini!',
      });
      return;
    }

    if (newPasswordInput.trim().length < 4) {
      setPasswordNotice({
        success: false,
        message: 'Password baru minimal harus 4 karakter!',
      });
      return;
    }

    if (newPasswordInput.trim() !== confirmPasswordInput.trim()) {
      setPasswordNotice({
        success: false,
        message: 'Konfirmasi password baru tidak cocok!',
      });
      return;
    }

    if (onUpdateAdminPassword) {
      onUpdateAdminPassword(newPasswordInput.trim());
      setPasswordNotice({
        success: true,
        message: 'Alhamdulillah! Password akun Administrator berhasil diganti dan tersimpan.',
      });
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          <button
            id="tab-profil-petinggi"
            onClick={() => setActiveSubTab('petinggi')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeSubTab === 'petinggi'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Petinggi Pesantren ({petinggiList.length})</span>
          </button>

          <button
            id="tab-profil-panitia"
            onClick={() => setActiveSubTab('panitia')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeSubTab === 'panitia'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Panitia Ujian ({panitiaList.length})</span>
          </button>

          <button
            id="tab-profil-identitas"
            onClick={() => setActiveSubTab('identitas')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeSubTab === 'identitas'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Identitas Pesantren</span>
          </button>

          {/* ADMIN ONLY SUBTABS */}
          {isAdmin && (
            <>
              <button
                id="tab-profil-keamanan"
                onClick={() => setActiveSubTab('keamanan')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeSubTab === 'keamanan'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-emerald-50'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Ganti Password Admin</span>
              </button>

              <button
                id="tab-profil-akses"
                onClick={() => setActiveSubTab('akses')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeSubTab === 'akses'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-emerald-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Hak Akses Pengguna</span>
              </button>
            </>
          )}
        </div>

        {/* Role Status Tag */}
        <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {isAdmin ? 'Mode Admin: Akses Penuh' : 'Mode Asatidz: Akses Pratinjau'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: PETINGGI PESANTREN */}
      {/* ============================================================ */}
      {activeSubTab === 'petinggi' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Jajaran Petinggi &amp; Dewan Kyai Pesantren</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Daftar nama pimpinan, pengasuh, dan dewan asatidz pembina pesantren dapat dikelola oleh admin.'
                  : 'Daftar susunan pimpinan dan pembina Pondok Pesantren Tahfidzul Qur\'an Alhusna.'}
              </p>
            </div>

            {/* Admin Add Button */}
            {isAdmin && (
              <button
                id="btn-tambah-petinggi"
                onClick={() => {
                  setEditingPetinggi(null);
                  setPetinggiForm({
                    nama: '',
                    gelar: '',
                    jabatan: '',
                    kontak: '',
                    urutan: petinggiList.length + 1,
                  });
                  setPetinggiModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Petinggi Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {petinggiList
              .sort((a, b) => a.urutan - b.urutan)
              .map((petinggi) => (
                <div
                  key={petinggi.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {petinggi.jabatan}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        #{petinggi.urutan}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {petinggi.nama}
                    </h4>

                    {petinggi.gelar && (
                      <p className="text-xs text-emerald-700 font-medium">
                        {petinggi.gelar}
                      </p>
                    )}

                    {petinggi.kontak && (
                      <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{petinggi.kontak}</span>
                      </div>
                    )}
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingPetinggi(petinggi);
                          setPetinggiForm({
                            nama: petinggi.nama,
                            gelar: petinggi.gelar || '',
                            jabatan: petinggi.jabatan,
                            kontak: petinggi.kontak || '',
                            urutan: petinggi.urutan,
                          });
                          setPetinggiModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        title="Edit Data Petinggi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeletePetinggi(petinggi.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Data Petinggi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: PANITIA UJIAN (IMTIHAN) */}
      {/* ============================================================ */}
      {activeSubTab === 'panitia' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Panitia Pelaksana Ujian (Imtihan Niha&apos;i)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Struktur susunan panitia ujian semester santri dapat diedit manual oleh admin.'
                  : 'Struktur panitia pelaksana ujian semester santri.'}
              </p>
            </div>

            {isAdmin && (
              <button
                id="btn-tambah-panitia"
                onClick={() => {
                  setEditingPanitia(null);
                  setPanitiaForm({
                    nama: '',
                    jabatan: '',
                    tugas: '',
                    kontak: '',
                  });
                  setPanitiaModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Panitia Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {panitiaList.map((panitia) => (
              <div
                key={panitia.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900">
                      {panitia.jabatan}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {panitia.nama}
                  </h4>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                      Tugas Pokok &amp; Wewenang:
                    </p>
                    <p className="leading-relaxed">{panitia.tugas}</p>
                  </div>

                  {panitia.kontak && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{panitia.kontak}</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingPanitia(panitia);
                        setPanitiaForm({
                          nama: panitia.nama,
                          jabatan: panitia.jabatan,
                          tugas: panitia.tugas,
                          kontak: panitia.kontak || '',
                        });
                        setPanitiaModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Edit Panitia"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeletePanitia(panitia.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Hapus Panitia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: IDENTITAS PESANTREN */}
      {/* ============================================================ */}
      {activeSubTab === 'identitas' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <span>Identitas Resmi Pondok Pesantren</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data resmi lembaga yang tercantum di header rekapitulasi nilai dan berkas cetak.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  if (isEditingProfile) {
                    onUpdateProfile(profileForm);
                    setIsEditingProfile(false);
                  } else {
                    setIsEditingProfile(true);
                  }
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                  isEditingProfile
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isEditingProfile ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Profil</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profil Lembaga</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Pesantren Logo Display */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border border-emerald-200/60">
            <div className="relative">
              <img
                src={profile.logoUrl || '/logo_alhusna.jpg'}
                alt="Logo PPTQ Alhusna"
                className="w-28 h-28 rounded-full object-cover shadow-lg ring-4 ring-amber-400 bg-white p-1"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
                }}
              />
            </div>

            <div className="space-y-1 text-center md:text-left flex-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                Logo Resmi Terverifikasi
              </span>
              <h4 className="text-lg font-black text-emerald-950">
                {profile.nama}
              </h4>
              <p className="text-xs text-slate-600">
                NSPP: <strong>{profile.nspp}</strong> • SK Kemenag: <strong>{profile.skKemenag}</strong>
              </p>

              {isAdmin && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5 justify-center md:justify-start">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti File Logo Pesantren</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Form / Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Lembaga
              </label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.nama}
                  onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              ) : (
                <p className="p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 border border-slate-100">
                  {profile.nama}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Statistik Pesantren (NSPP)
              </label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.nspp}
                  onChange={(e) => setProfileForm({ ...profileForm, nspp: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              ) : (
                <p className="p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 border border-slate-100">
                  {profile.nspp}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap Pondok Pesantren
              </label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.alamat}
                  onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              ) : (
                <p className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-800 border border-slate-100">
                  {profile.alamat}, Desa {profile.desa}, Kec. {profile.kecamatan}, Kab. {profile.kabupaten}, {profile.provinsi}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telepon / WhatsApp Panitia
              </label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.noTelp}
                  onChange={(e) => setProfileForm({ ...profileForm, noTelp: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              ) : (
                <p className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-800 border border-slate-100">
                  {profile.noTelp}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Resmi Pesantren
              </label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              ) : (
                <p className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-800 border border-slate-100">
                  {profile.email}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Visi Pesantren
              </label>
              <div className="p-3 bg-emerald-50/50 rounded-xl text-xs text-emerald-950 font-medium border border-emerald-100">
                &ldquo;{profile.visi}&rdquo;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: GANTI PASSWORD ADMIN (ADMIN ONLY) */}
      {/* ============================================================ */}
      {isAdmin && activeSubTab === 'keamanan' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Pengaturan Password Administrator</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fitur ini hanya dapat diakses oleh Admin untuk mengganti kata sandi login admin agar akun tetap aman.
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              Khusus Akun Admin
            </div>
          </div>

          {/* Status Alert */}
          {passwordNotice && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                passwordNotice.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              {passwordNotice.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span className="font-semibold">{passwordNotice.message}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="max-w-md space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password Administrator Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  placeholder="Masukkan password saat ini..."
                  className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password Administrator Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimal 4 karakter..."
                  className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ulangi / Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Ketik ulang password baru..."
                  className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Simpan &amp; Terapkan Password Baru</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 5: HAK AKSES PENGGUNA (ROLE-BASED ACCESS CONTROL - ADMIN ONLY) */}
      {/* ============================================================ */}
      {isAdmin && activeSubTab === 'akses' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Pengaturan Hak Akses Pengguna Berdasarkan Peran</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin dapat mengatur kewenangan akses bagi setiap pengguna (Admin &amp; Asatidz).
              </p>
            </div>

            <div className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full">
              Sistem Role-Based Access Control (RBAC)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Fitur / Hak Akses</th>
                  <th className="py-3 px-4 text-center">Peran: ADMIN (Pengelola)</th>
                  <th className="py-3 px-4 text-center">Peran: ASATIDZ (Guru)</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  {
                    key: 'canInputNilai' as keyof RolePermissions,
                    title: 'Input & Simpan Nilai Ujian Santri',
                    desc: 'Mengisi lembar nilai santri untuk kelas & mapel masing-masing.',
                  },
                  {
                    key: 'canDownloadExcel' as keyof RolePermissions,
                    title: 'Unduh Berkas Excel Rekap Nilai',
                    desc: 'Mengekspor data nilai ke file .xlsx (per guru / semua kelas).',
                  },
                  {
                    key: 'canUploadSantri' as keyof RolePermissions,
                    title: 'Upload Data Kelas via Excel',
                    desc: 'Mengimpor data rombel kelas menggunakan file Excel.',
                  },
                  {
                    key: 'canUploadJadwal' as keyof RolePermissions,
                    title: 'Kelola & Upload Gambar Jadwal Ujian',
                    desc: 'Mengunggah poster gambar jadwal imtihan santri.',
                  },
                  {
                    key: 'canManageLembaga' as keyof RolePermissions,
                    title: 'Kelola Mata Pelajaran & Kelas',
                    desc: 'Menambah, mengedit, atau menghapus daftar mapel dan rombel.',
                  },
                  {
                    key: 'canEditProfil' as keyof RolePermissions,
                    title: 'Edit Identitas & Logo Pesantren',
                    desc: 'Mengubah nama pondok, alamat, NSPP, dan logo.',
                  },
                  {
                    key: 'canEditPanitia' as keyof RolePermissions,
                    title: 'Edit Petinggi & Panitia Ujian',
                    desc: 'Memperbarui nama jajaran dewan kyai dan panitia imtihan.',
                  },
                  {
                    key: 'canViewAllRekap' as keyof RolePermissions,
                    title: 'Akses Master Rekap Nilai Seluruh Pesantren',
                    desc: 'Melihat rekap nilai gabungan dari semua mata pelajaran dan kelas.',
                  },
                  {
                    key: 'canManagePermissions' as keyof RolePermissions,
                    title: 'Atur Matriks Hak Akses Pengguna',
                    desc: 'Menyetel hak izin untuk masing-masing peran.',
                  },
                ].map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {item.title}
                    </td>
                    
                    {/* Admin Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePermission('admin', item.key)}
                        disabled={!isAdmin || item.key === 'canManagePermissions'}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 ease-in-out inline-flex items-center ${
                          permissions.admin[item.key] ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </button>
                    </td>

                    {/* Asatidz Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePermission('asatidz', item.key)}
                        disabled={!isAdmin}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 ease-in-out inline-flex items-center ${
                          permissions.asatidz[item.key] ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </button>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {item.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah/Edit Petinggi */}
      {/* ============================================================ */}
      {petinggiModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                {editingPetinggi ? 'Edit Petinggi Pesantren' : 'Tambah Petinggi Pesantren'}
              </h4>
              <button
                onClick={() => setPetinggiModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePetinggi} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Petinggi / Kyai
                </label>
                <input
                  type="text"
                  value={petinggiForm.nama}
                  onChange={(e) => setPetinggiForm({ ...petinggiForm, nama: e.target.value })}
                  placeholder="Contoh: KH. Muhammad Syakir"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gelar Akademik / Keagamaan
                </label>
                <input
                  type="text"
                  value={petinggiForm.gelar}
                  onChange={(e) => setPetinggiForm({ ...petinggiForm, gelar: e.target.value })}
                  placeholder="Contoh: Al-Hafidz, Lc., M.A."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Amanah
                </label>
                <input
                  type="text"
                  value={petinggiForm.jabatan}
                  onChange={(e) => setPetinggiForm({ ...petinggiForm, jabatan: e.target.value })}
                  placeholder="Contoh: Pengasuh Pondok Pesantren"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kontak / No. Telp
                  </label>
                  <input
                    type="text"
                    value={petinggiForm.kontak}
                    onChange={(e) => setPetinggiForm({ ...petinggiForm, kontak: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={petinggiForm.urutan}
                    onChange={(e) => setPetinggiForm({ ...petinggiForm, urutan: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    min={1}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPetinggiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
                >
                  Simpan Petinggi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah/Edit Panitia */}
      {/* ============================================================ */}
      {panitiaModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                {editingPanitia ? 'Edit Panitia Ujian' : 'Tambah Panitia Ujian'}
              </h4>
              <button
                onClick={() => setPanitiaModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePanitia} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Anggota Panitia
                </label>
                <input
                  type="text"
                  value={panitiaForm.nama}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, nama: e.target.value })}
                  placeholder="Contoh: Ust. Fauzan Adhim, S.Pd.I."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan di Panitia
                </label>
                <input
                  type="text"
                  value={panitiaForm.jabatan}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, jabatan: e.target.value })}
                  placeholder="Contoh: Ketua Panitia / Sekretaris / Bendahara"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian Tugas Pokok
                </label>
                <textarea
                  value={panitiaForm.tugas}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, tugas: e.target.value })}
                  placeholder="Contoh: Bertanggung jawab atas pengelolaan naskah ujian dan rekap nilai."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kontak / WhatsApp
                </label>
                <input
                  type="text"
                  value={panitiaForm.kontak}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, kontak: e.target.value })}
                  placeholder="0821-xxxx-xxxx"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPanitiaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
                >
                  Simpan Panitia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
