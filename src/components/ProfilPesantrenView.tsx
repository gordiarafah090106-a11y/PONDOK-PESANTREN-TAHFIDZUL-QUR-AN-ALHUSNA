import React, { useState } from 'react';
import {
  AcademicTerm,
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
  Calendar,
  Sparkles,
  AlertCircle,
  Check,
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
  allTerms: AcademicTerm[];
  currentTerm: AcademicTerm;
  onSelectTerm: (term: AcademicTerm) => void;
  onUpdateTerms: (terms: AcademicTerm[]) => void;
  currentRole: RoleType;
  adminPassword?: string;
  onUpdateAdminPassword?: (newPassword: string) => void;
  activeSubTab?: string;
  onSelectSubTab?: (sub: 'petinggi' | 'panitia' | 'semester' | 'identitas' | 'keamanan' | 'akses') => void;
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
  allTerms,
  currentTerm,
  onSelectTerm,
  onUpdateTerms,
  currentRole,
  adminPassword = 'admin123',
  onUpdateAdminPassword,
  activeSubTab: propSubTab,
  onSelectSubTab,
}) => {
  const isAdmin = currentRole === 'admin';
  const [internalSubTab, setInternalSubTab] = useState<'petinggi' | 'panitia' | 'semester' | 'identitas' | 'keamanan' | 'akses'>('petinggi');
  const activeSubTab = (propSubTab as 'petinggi' | 'panitia' | 'semester' | 'identitas' | 'keamanan' | 'akses') || internalSubTab;
  const setActiveSubTab = (tab: 'petinggi' | 'panitia' | 'semester' | 'identitas' | 'keamanan' | 'akses') => {
    setInternalSubTab(tab);
    if (onSelectSubTab) onSelectSubTab(tab);
  };

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<PesantrenProfile>(profile);

  // Pimpinan Pesantren Modal State
  const [petinggiModalOpen, setPetinggiModalOpen] = useState(false);
  const [editingPetinggi, setEditingPetinggi] = useState<Petinggi | null>(null);
  const [petinggiForm, setPetinggiForm] = useState({
    nama: '',
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

  // Semester Modal State
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [semesterForm, setSemesterForm] = useState({
    year: '2025/2026',
    semester: 'ganjil' as 'ganjil' | 'genap',
    label: 'Semester Ganjil 2025/2026',
    isActive: false,
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

  // Save Pimpinan
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
    if (window.confirm('Yakin ingin menghapus data Pimpinan Pesantren ini?')) {
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
    if (window.confirm('Yakin ingin menghapus nama panitia ujian ini?')) {
      onUpdatePanitia(panitiaList.filter((p) => p.id !== id));
    }
  };

  // Save Semester
  const handleSaveSemester = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = `term-${semesterForm.year.replace('/', '-')}-${semesterForm.semester}`;
    const newTerm: AcademicTerm = {
      id: cleanId,
      year: semesterForm.year,
      semester: semesterForm.semester,
      label: semesterForm.label,
      isActive: semesterForm.isActive,
    };

    let updatedTerms = [...allTerms];
    if (newTerm.isActive) {
      updatedTerms = updatedTerms.map((t) => ({ ...t, isActive: false }));
    }
    updatedTerms.push(newTerm);
    onUpdateTerms(updatedTerms);
    if (newTerm.isActive) {
      onSelectTerm(newTerm);
    }
    setSemesterModalOpen(false);
  };

  const handleSetActiveSemester = (termId: string) => {
    const updated = allTerms.map((t) => ({
      ...t,
      isActive: t.id === termId,
    }));
    onUpdateTerms(updated);
    const selected = updated.find((t) => t.id === termId);
    if (selected) onSelectTerm(selected);
  };

  const handleDeleteSemester = (termId: string) => {
    if (allTerms.length <= 1) {
      window.alert('Minimal harus tersisa 1 periode semester di sistem.');
      return;
    }
    if (window.confirm('Hapus periode semester ini?')) {
      const updated = allTerms.filter((t) => t.id !== termId);
      onUpdateTerms(updated);
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
    <div className="space-y-5">
      
      {/* Active Sub-Section Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold shadow-xs">
            {activeSubTab === 'petinggi' && <Users className="w-4 h-4" />}
            {activeSubTab === 'panitia' && <Award className="w-4 h-4" />}
            {activeSubTab === 'semester' && <Calendar className="w-4 h-4" />}
            {activeSubTab === 'identitas' && <Landmark className="w-4 h-4" />}
            {activeSubTab === 'keamanan' && <KeyRound className="w-4 h-4" />}
            {activeSubTab === 'akses' && <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Profil Pesantren
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">
                {activeSubTab === 'petinggi' && `Pimpinan Pesantren (${petinggiList.length} Terdaftar)`}
                {activeSubTab === 'panitia' && `Panitia Ujian (${panitiaList.length} Anggota)`}
                {activeSubTab === 'semester' && `Pengaturan Semester & Tahun Ajaran (${allTerms.length} Periode)`}
                {activeSubTab === 'identitas' && 'Identitas & Informasi Pesantren'}
                {activeSubTab === 'keamanan' && 'Ganti Password Administrator'}
                {activeSubTab === 'akses' && 'Pengaturan Hak Akses Pengguna'}
              </h2>
            </div>
          </div>
        </div>

        {/* Role Status Tag */}
        <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
          <Info className="w-3 h-3 text-emerald-600" />
          <span>
            {isAdmin ? 'Mode Admin' : 'Mode Asatidz'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: PIMPINAN PESANTREN (COMPACT) */}
      {/* ============================================================ */}
      {activeSubTab === 'petinggi' && (
        <div className="space-y-3.5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Pimpinan Pesantren</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Daftar nama Pimpinan dan Pengasuh Pondok Pesantren Tahfidzul Qur\'an Alhusna.'
                  : 'Daftar susunan Pimpinan Pondok Pesantren Tahfidzul Qur\'an Alhusna.'}
              </p>
            </div>

            {/* Admin Add Button */}
            {isAdmin && (
              <button
                id="btn-tambah-pimpinan"
                onClick={() => {
                  setEditingPetinggi(null);
                  setPetinggiForm({
                    nama: '',
                    jabatan: '',
                    kontak: '',
                    urutan: petinggiList.length + 1,
                  });
                  setPetinggiModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pimpinan</span>
              </button>
            )}
          </div>

          {/* Compact Cards Grid - Reduced box sizes to save space */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {petinggiList
              .sort((a, b) => a.urutan - b.urutan)
              .map((petinggi) => (
                <div
                  key={petinggi.id}
                  className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {petinggi.jabatan}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{petinggi.urutan}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                      {petinggi.nama}
                    </h4>

                    {petinggi.kontak && (
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{petinggi.kontak}</span>
                      </div>
                    )}
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingPetinggi(petinggi);
                          setPetinggiForm({
                            nama: petinggi.nama,
                            jabatan: petinggi.jabatan,
                            kontak: petinggi.kontak || '',
                            urutan: petinggi.urutan,
                          });
                          setPetinggiModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        title="Edit Data Pimpinan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePetinggi(petinggi.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Data Pimpinan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: PANITIA UJIAN (COMPACT) */}
      {/* ============================================================ */}
      {activeSubTab === 'panitia' && (
        <div className="space-y-3.5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Panitia Pelaksana Ujian (Imtihan Niha&apos;i)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Struktur susunan panitia ujian semester santri.
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Panitia</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {panitiaList.map((panitia) => (
              <div
                key={panitia.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition text-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                      {panitia.jabatan}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {panitia.nama}
                  </h4>

                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {panitia.tugas}
                  </p>

                  {panitia.kontak && (
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{panitia.kontak}</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
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
                      className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Edit Panitia"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeletePanitia(panitia.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Hapus Panitia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: PENGATURAN SEMESTER (ACADEMIC TERMS) */}
      {/* ============================================================ */}
      {activeSubTab === 'semester' && (
        <div className="space-y-3.5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Semester &amp; Tahun Ajaran</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kelola daftar semester dan tentukan semester yang aktif untuk penginputan nilai dan rekapitulasi.
              </p>
            </div>

            {isAdmin && (
              <button
                id="btn-tambah-semester"
                onClick={() => {
                  setSemesterForm({
                    year: '2025/2026',
                    semester: 'ganjil',
                    label: 'Semester Ganjil 2025/2026',
                    isActive: false,
                  });
                  setSemesterModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Semester Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTerms.map((term) => {
              const isCurrent = currentTerm.id === term.id;
              return (
                <div
                  key={term.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between text-xs ${
                    isCurrent
                      ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {term.semester}
                      </span>
                      {term.isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Default Aktif</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Arsip</span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {term.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tahun Ajaran: {term.year}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectTerm(term)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                        isCurrent
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800'
                      }`}
                    >
                      {isCurrent ? 'Sedang Diakses' : 'Beralih ke Semester Ini'}
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        {!term.isActive && (
                          <button
                            onClick={() => handleSetActiveSemester(term.id)}
                            className="text-[10px] font-bold px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg"
                            title="Jadikan default aktif"
                          >
                            Set Default
                          </button>
                        )}
                        {allTerms.length > 1 && (
                          <button
                            onClick={() => handleDeleteSemester(term.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus semester"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: IDENTITAS PESANTREN */}
      {/* ============================================================ */}
      {activeSubTab === 'identitas' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>Identitas Resmi Pondok Pesantren</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Data profil ini dicantumkan pada kop raport, jadwal ujian, dan lembar rekapitulasi.
              </p>
            </div>

            {isAdmin && !isEditingProfile && (
              <button
                onClick={() => {
                  setProfileForm(profile);
                  setIsEditingProfile(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Identitas</span>
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <img
                  src={profile.logoUrl || '/logo_alhusna.jpg'}
                  alt="Logo Alhusna"
                  className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-amber-400/80 bg-white p-1 mb-2"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
                  }}
                />
                <span className="text-[11px] font-bold text-slate-700">Logo Pesantren</span>
              </div>

              <div className="md:col-span-2 space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Pesantren</label>
                  <p className="font-bold text-slate-900 text-sm">{profile.nama}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">NSPP</label>
                    <p className="font-semibold text-slate-800">{profile.nspp || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tahun Berdiri</label>
                    <p className="font-semibold text-slate-800">{profile.tahunBerdiri || '-'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Alamat Lengkap</label>
                  <p className="text-slate-700">{profile.alamat}</p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateProfile(profileForm);
                setIsEditingProfile(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pesantren</label>
                <input
                  type="text"
                  value={profileForm.nama}
                  onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NSPP</label>
                  <input
                    type="text"
                    value={profileForm.nspp}
                    onChange={(e) => setProfileForm({ ...profileForm, nspp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Berdiri</label>
                  <input
                    type="text"
                    value={profileForm.tahunBerdiri}
                    onChange={(e) => setProfileForm({ ...profileForm, tahunBerdiri: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={profileForm.alamat}
                  onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Upload File Logo Baru (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Identitas</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 5: GANTI PASSWORD ADMIN (ADMIN ONLY) */}
      {/* ============================================================ */}
      {activeSubTab === 'keamanan' && isAdmin && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs max-w-lg space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Ganti Password Administrator</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Perbarui password akun Administrator untuk menjaga keamanan portal aplikasi.
            </p>
          </div>

          {passwordNotice && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordNotice.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {passwordNotice.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{passwordNotice.message}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Password Saat Ini (Lama)</label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  placeholder="Masukkan password admin lama..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password Baru</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimal 4 karakter..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Ulangi password baru..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition"
              >
                Simpan &amp; Perbarui Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 6: HAK AKSES PENGGUNA (ADMIN ONLY) */}
      {/* ============================================================ */}
      {activeSubTab === 'akses' && isAdmin && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Matriks Hak Akses Pengguna</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Atur izin tindakan untuk masing-masing peran (Admin vs Asatidz).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="py-2.5 px-3 font-bold">Fitur / Hak Izin</th>
                  <th className="py-2.5 px-3 text-center font-bold">Admin</th>
                  <th className="py-2.5 px-3 text-center font-bold">Asatidz</th>
                  <th className="py-2.5 px-3 font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  {
                    key: 'canInputNilai' as keyof RolePermissions,
                    title: 'Input & Edit Nilai Ujian Santri',
                    desc: 'Mengisi nilai harian, lisan, dan tulis untuk santri.',
                  },
                  {
                    key: 'canUploadJadwal' as keyof RolePermissions,
                    title: 'Upload Dokumen / Jadwal Ujian',
                    desc: 'Mengunggah jadwal ujian formal.',
                  },
                  {
                    key: 'canManageLembaga' as keyof RolePermissions,
                    title: 'Kelola Mapel & Kelas Santri',
                    desc: 'Menambah dan mengorganisir data kelas dan mata pelajaran.',
                  },
                  {
                    key: 'canEditProfil' as keyof RolePermissions,
                    title: 'Edit Identitas Pesantren & Pimpinan',
                    desc: 'Memperbarui profil pondok dan data pimpinan.',
                  },
                  {
                    key: 'canViewAllRekap' as keyof RolePermissions,
                    title: 'Download Rekapan Excel Multi-Kelas',
                    desc: 'Mengekspor berkas rekapitulasi nilai per guru.',
                  },
                ].map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{item.title}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => togglePermission('admin', item.key)}
                        disabled={!isAdmin}
                        className={`w-8 h-4.5 rounded-full p-0.5 inline-flex items-center ${
                          permissions.admin[item.key] ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => togglePermission('asatidz', item.key)}
                        disabled={!isAdmin}
                        className={`w-8 h-4.5 rounded-full p-0.5 inline-flex items-center ${
                          permissions.asatidz[item.key] ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah/Edit Pimpinan Pesantren (NO GELAR FIELD) */}
      {/* ============================================================ */}
      {petinggiModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingPetinggi ? 'Edit Pimpinan Pesantren' : 'Tambah Pimpinan Pesantren'}
              </h4>
              <button
                onClick={() => setPetinggiModalOpen(false)}
                className="text-emerald-200 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePetinggi} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Pimpinan / Kyai
                </label>
                <input
                  type="text"
                  value={petinggiForm.nama}
                  onChange={(e) => setPetinggiForm({ ...petinggiForm, nama: e.target.value })}
                  placeholder="Contoh: KH. Muhammad Syakir, Lc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan / Amanah
                </label>
                <input
                  type="text"
                  value={petinggiForm.jabatan}
                  onChange={(e) => setPetinggiForm({ ...petinggiForm, jabatan: e.target.value })}
                  placeholder="Contoh: Pengasuh Pondok Pesantren"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kontak / No. Telp
                  </label>
                  <input
                    type="text"
                    value={petinggiForm.kontak}
                    onChange={(e) => setPetinggiForm({ ...petinggiForm, kontak: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={petinggiForm.urutan}
                    onChange={(e) => setPetinggiForm({ ...petinggiForm, urutan: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    min={1}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPetinggiModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Pimpinan
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
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingPanitia ? 'Edit Panitia Ujian' : 'Tambah Panitia Ujian'}
              </h4>
              <button
                onClick={() => setPanitiaModalOpen(false)}
                className="text-emerald-200 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePanitia} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Anggota Panitia
                </label>
                <input
                  type="text"
                  value={panitiaForm.nama}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, nama: e.target.value })}
                  placeholder="Contoh: Ust. Fauzan Adhim, S.Pd.I."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan di Panitia
                </label>
                <input
                  type="text"
                  value={panitiaForm.jabatan}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, jabatan: e.target.value })}
                  placeholder="Contoh: Ketua Panitia / Sekretaris"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Uraian Tugas Pokok
                </label>
                <textarea
                  value={panitiaForm.tugas}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, tugas: e.target.value })}
                  placeholder="Tugas utama dalam pelaksanaan ujian..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kontak / WhatsApp
                </label>
                <input
                  type="text"
                  value={panitiaForm.kontak}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, kontak: e.target.value })}
                  placeholder="0821-xxxx-xxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPanitiaModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Panitia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah Semester Baru */}
      {/* ============================================================ */}
      {semesterModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                Tambah Periode Semester Baru
              </h4>
              <button
                onClick={() => setSemesterModalOpen(false)}
                className="text-emerald-200 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSemester} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={semesterForm.year}
                    onChange={(e) => {
                      const yr = e.target.value;
                      setSemesterForm({
                        ...semesterForm,
                        year: yr,
                        label: `Semester ${semesterForm.semester === 'ganjil' ? 'Ganjil' : 'Genap'} ${yr}`,
                      });
                    }}
                    placeholder="2025/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={semesterForm.semester}
                    onChange={(e) => {
                      const sem = e.target.value as 'ganjil' | 'genap';
                      setSemesterForm({
                        ...semesterForm,
                        semester: sem,
                        label: `Semester ${sem === 'ganjil' ? 'Ganjil' : 'Genap'} ${semesterForm.year}`,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Label Periode
                </label>
                <input
                  type="text"
                  value={semesterForm.label}
                  onChange={(e) => setSemesterForm({ ...semesterForm, label: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-active-term"
                  checked={semesterForm.isActive}
                  onChange={(e) => setSemesterForm({ ...semesterForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="chk-active-term" className="text-slate-700 font-medium cursor-pointer">
                  Jadikan semester aktif saat ini
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSemesterModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
