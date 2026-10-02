import React, { useState, useMemo } from 'react';
import {
  AcademicTerm,
  PesantrenProfile,
  Petinggi,
  PanitiaUjian,
  RolePermissions,
  RoleType,
  AdminUser,
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
  Copy,
  Printer,
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User as UserIcon,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

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
  allAdminUsers?: AdminUser[];
  onUpdateAdminUsers?: (updated: AdminUser[]) => void;
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
  allAdminUsers = [],
  onUpdateAdminUsers,
  activeSubTab: propSubTab,
  onSelectSubTab,
}) => {
  const isAdmin = currentRole === 'admin';
  const [internalSubTab, setInternalSubTab] = useState<'petinggi' | 'panitia' | 'semester' | 'identitas' | 'keamanan' | 'akses'>('petinggi');
  const validSubTabs = isAdmin
    ? ['petinggi', 'panitia', 'semester', 'identitas', 'keamanan', 'akses']
    : ['petinggi', 'panitia'];
  const activeSubTab = (
    propSubTab && validSubTabs.includes(propSubTab)
      ? propSubTab
      : validSubTabs.includes(internalSubTab)
      ? internalSubTab
      : 'petinggi'
  ) as 'petinggi' | 'panitia' | 'semester' | 'identitas' | 'keamanan' | 'akses';
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
  const [editingSemester, setEditingSemester] = useState<AcademicTerm | null>(null);
  const [semesterForm, setSemesterForm] = useState({
    year: '2025/2026',
    semester: 'ganjil' as 'ganjil' | 'genap',
    label: 'Semester Ganjil 2025/2026',
    isActive: false,
  });

  // --- ADMIN APLIKASI (Data Admin RDM) State ---
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPageSize, setAdminPageSize] = useState<number>(10);
  const [adminCurrentPage, setAdminCurrentPage] = useState<number>(1);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const [adminForm, setAdminForm] = useState<Omit<AdminUser, 'id'>>({
    email: '',
    nama: '',
    gender: 'L',
    ttl: '',
    pendidikan: 'Staf Madrasah',
    password: '',
    foto: '',
  });

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

  // State for in-app deletion confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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
        id: `petinggi-${Date.now()}`,
        ...petinggiForm,
      };
      onUpdatePetinggi([...petinggiList, newPetinggi]);
    }
    setPetinggiModalOpen(false);
    setEditingPetinggi(null);
  };

  const handleDeletePetinggi = (id: string, nama: string) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Data Pimpinan',
      message: `Apakah Anda yakin ingin menghapus "${nama}" dari daftar Pimpinan Pesantren?`,
      onConfirm: () => {
        const updated = petinggiList.filter((p) => p.id !== id);
        onUpdatePetinggi(updated);
      },
    });
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
        id: `panitia-${Date.now()}`,
        ...panitiaForm,
      };
      onUpdatePanitia([...panitiaList, newPanitia]);
    }
    setPanitiaModalOpen(false);
    setEditingPanitia(null);
  };

  const handleDeletePanitia = (id: string, nama: string) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Anggota Panitia',
      message: `Apakah Anda yakin ingin menghapus "${nama}" dari susunan Panitia Ujian?`,
      onConfirm: () => {
        const updated = panitiaList.filter((p) => p.id !== id);
        onUpdatePanitia(updated);
      },
    });
  };

  // Save Semester
  const handleSaveSemester = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSemester) {
      const updatedTerms = allTerms.map((t) => {
        if (t.id === editingSemester.id) {
          return {
            ...t,
            year: semesterForm.year,
            semester: semesterForm.semester,
            label: semesterForm.label,
            isActive: semesterForm.isActive,
          };
        }
        return semesterForm.isActive ? { ...t, isActive: false } : t;
      });
      onUpdateTerms(updatedTerms);
      if (semesterForm.isActive) {
        const updatedSelf = updatedTerms.find((t) => t.id === editingSemester.id);
        if (updatedSelf) onSelectTerm(updatedSelf);
      }
    } else {
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
    }
    setSemesterModalOpen(false);
    setEditingSemester(null);
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

  const handleDeleteSemester = (termId: string, label?: string) => {
    if (allTerms.length <= 1) {
      setConfirmDelete({
        isOpen: true,
        title: 'Tidak Dapat Menghapus',
        message: 'Minimal harus tersisa 1 periode semester aktif di dalam sistem.',
        onConfirm: () => {},
      });
      return;
    }
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Periode Semester',
      message: `Hapus periode semester ${label ? `"${label}"` : ''}? Data rekap dan nilai terkait mungkin tidak dapat diakses pada periode ini.`,
      onConfirm: () => {
        const updated = allTerms.filter((t) => t.id !== termId);
        onUpdateTerms(updated);
      },
    });
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

  // --- ADMIN APLIKASI HANDLERS ---
  const filteredAdminList = useMemo(() => {
    return allAdminUsers.filter((adm) => {
      const q = adminSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        (adm.nama || '').toLowerCase().includes(q) ||
        (adm.email || '').toLowerCase().includes(q) ||
        (adm.ttl || '').toLowerCase().includes(q) ||
        (adm.pendidikan || '').toLowerCase().includes(q)
      );
    });
  }, [allAdminUsers, adminSearch]);

  const totalAdminPages = Math.max(1, Math.ceil(filteredAdminList.length / adminPageSize));
  const paginatedAdminList = useMemo(() => {
    const start = (adminCurrentPage - 1) * adminPageSize;
    return filteredAdminList.slice(start, start + adminPageSize);
  }, [filteredAdminList, adminCurrentPage, adminPageSize]);

  const handleOpenAddAdmin = () => {
    setEditingAdmin(null);
    setAdminForm({
      email: '',
      nama: '',
      gender: 'L',
      ttl: '',
      pendidikan: 'Staf Madrasah',
      password: '',
      foto: '',
    });
    setAdminModalOpen(true);
  };

  const handleOpenEditAdmin = (adm: AdminUser) => {
    setEditingAdmin(adm);
    setAdminForm({
      email: adm.email,
      nama: adm.nama,
      gender: adm.gender,
      ttl: adm.ttl,
      pendidikan: adm.pendidikan,
      password: adm.password,
      foto: adm.foto || '',
    });
    setAdminModalOpen(true);
  };

  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.nama.trim() || !adminForm.email.trim() || !adminForm.password.trim()) {
      return;
    }

    if (editingAdmin) {
      const updated = allAdminUsers.map((a) =>
        a.id === editingAdmin.id ? { ...a, ...adminForm } : a
      );
      if (onUpdateAdminUsers) onUpdateAdminUsers(updated);
      // If editing active password
      if (onUpdateAdminPassword && editingAdmin.id === 'adm-1') {
        onUpdateAdminPassword(adminForm.password);
      }
    } else {
      const newAdmin: AdminUser = {
        id: `adm-${Date.now()}`,
        ...adminForm,
      };
      const updated = [...allAdminUsers, newAdmin];
      if (onUpdateAdminUsers) onUpdateAdminUsers(updated);
    }
    setAdminModalOpen(false);
    setEditingAdmin(null);
  };

  const handleDeleteAdmin = (adm: AdminUser) => {
    if (allAdminUsers.length <= 1) {
      setConfirmDelete({
        isOpen: true,
        title: 'Tidak Dapat Menghapus',
        message: 'Minimal harus tersisa 1 akun Administrator aplikasi untuk mengelola sistem.',
        onConfirm: () => {},
      });
      return;
    }

    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Admin Aplikasi',
      message: `Apakah Anda yakin ingin menghapus admin "${adm.nama}" (${adm.email}) dari sistem?`,
      onConfirm: () => {
        const updated = allAdminUsers.filter((a) => a.id !== adm.id);
        if (onUpdateAdminUsers) onUpdateAdminUsers(updated);
      },
    });
  };

  const handleCopyAdminData = () => {
    const header = ['No', 'Email', 'Nama', 'L/P', 'TTL', 'Pendidikan', 'Password'].join('\t');
    const rows = filteredAdminList.map((a, idx) =>
      [idx + 1, a.email, a.nama, a.gender, a.ttl, a.pendidikan, a.password].join('\t')
    );
    const fullText = [header, ...rows].join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    });
  };

  const handlePrintAdminData = () => {
    window.print();
  };

  const handleExportAdminExcel = () => {
    const headers = ['No', 'Email', 'Nama', 'L/P', 'TTL', 'Pendidikan', 'Password'];
    const rows = filteredAdminList.map((a, idx) => [
      idx + 1,
      `"${a.email.replace(/"/g, '""')}"`,
      `"${a.nama.replace(/"/g, '""')}"`,
      `"${a.gender}"`,
      `"${a.ttl.replace(/"/g, '""')}"`,
      `"${a.pendidikan.replace(/"/g, '""')}"`,
      `"${a.password.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Admin_RDM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Context Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500 font-semibold">
                Profil Pesantren
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                {activeSubTab === 'petinggi' && `PIMPINAN PESANTREN (${petinggiList.length} TERDAFTAR)`}
                {activeSubTab === 'panitia' && `PANITIA UJIAN (${panitiaList.length} ANGGOTA)`}
                {activeSubTab === 'semester' && `PENGATURAN SEMESTER & TAHUN AJARAN (${allTerms.length} PERIODE)`}
                {activeSubTab === 'identitas' && 'IDENTITAS & INFORMASI PESANTREN'}
                {activeSubTab === 'keamanan' && 'ADMIN APLIKASI (DATA ADMIN RDM)'}
                {activeSubTab === 'akses' && 'PENGATURAN HAK AKSES PENGGUNA'}
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

      {/* Sub-Menu Navigation Bar inside Profil Pesantren */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
        {[
          { id: 'petinggi' as const, label: `Pimpinan Pesantren (${petinggiList.length})` },
          { id: 'panitia' as const, label: `Panitia Ujian (${panitiaList.length})` },
          ...(isAdmin
            ? [
                { id: 'semester' as const, label: `Pengaturan Semester (${allTerms.length})` },
                { id: 'identitas' as const, label: 'Identitas Pesantren' },
                { id: 'keamanan' as const, label: 'Admin Aplikasi' },
                { id: 'akses' as const, label: 'Hak Akses Pengguna' },
              ]
            : []),
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setActiveSubTab(tabItem.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === tabItem.id
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
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

          {/* Larger Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {petinggiList
              .sort((a, b) => a.urutan - b.urutan)
              .map((petinggi) => (
                <div
                  key={petinggi.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition text-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 truncate">
                        {petinggi.jabatan}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1 flex-shrink-0">
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Edit Data Pimpinan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePetinggi(petinggi.id, petinggi.nama)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Pimpinan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                      {petinggi.nama}
                    </h4>

                    {petinggi.kontak && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{petinggi.kontak}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: PANITIA UJIAN (COMPACT) */}
      {/* ============================================================ */}
      {activeSubTab === 'panitia' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Susunan Panitia Ujian Pesantren</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur panitia pelaksana Imtihan Niha&apos;i / Ujian Akhir Semester Santri.
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Panitia</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panitiaList.map((panitia) => (
              <div
                key={panitia.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition text-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 truncate">
                      {panitia.jabatan}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Edit Data Panitia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePanitia(panitia.id, panitia.nama)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Panitia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                    {panitia.nama}
                  </h4>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {panitia.tugas}
                  </p>

                  {panitia.kontak && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span>{panitia.kontak}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: PENGATURAN SEMESTER (COMPACT) */}
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
                Kelola periode semester aktif untuk seluruh rekap nilai, rapor, dan jadwal ujian.
              </p>
            </div>

            {isAdmin && (
              <button
                id="btn-tambah-semester"
                onClick={() => {
                  setEditingSemester(null);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTerms.map((term) => (
              <div
                key={term.id}
                className={`bg-white rounded-xl p-3.5 border transition relative ${
                  term.isActive
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      term.semester === 'ganjil'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    Semester {term.semester}
                  </span>

                  {term.isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Aktif
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-slate-900 text-sm">{term.label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tahun Ajaran: {term.year}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!term.isActive && (
                    <button
                      onClick={() => handleSetActiveSemester(term.id)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      Jadikan Aktif
                    </button>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => {
                          setEditingSemester(term);
                          setSemesterForm({
                            year: term.year,
                            semester: term.semester,
                            label: term.label,
                            isActive: term.isActive,
                          });
                          setSemesterModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Edit Semester"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSemester(term.id, term.label)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Semester"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: IDENTITAS PESANTREN */}
      {/* ============================================================ */}
      {activeSubTab === 'identitas' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>Identitas &amp; Profil Lengkap Pesantren</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Data resmi lembaga yang dicantumkan pada kop surat rapor santri dan dokumen ujian.
              </p>
            </div>

            {isAdmin && !isEditingProfile && (
              <button
                onClick={() => {
                  setProfileForm(profile);
                  setIsEditingProfile(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Identitas Lembaga</span>
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateProfile(profileForm);
                setIsEditingProfile(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sub Judul / Keterangan</label>
                  <input
                    type="text"
                    value={profileForm.subTitle}
                    onChange={(e) => setProfileForm({ ...profileForm, subTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Statistik Pesantren (NSPP)</label>
                  <input
                    type="text"
                    value={profileForm.nspp}
                    onChange={(e) => setProfileForm({ ...profileForm, nspp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={profileForm.noTelp}
                    onChange={(e) => setProfileForm({ ...profileForm, noTelp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={profileForm.alamat}
                    onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={profileForm.kecamatan}
                    onChange={(e) => setProfileForm({ ...profileForm, kecamatan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    value={profileForm.kabupaten}
                    onChange={(e) => setProfileForm({ ...profileForm, kabupaten: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={profileForm.provinsi}
                    onChange={(e) => setProfileForm({ ...profileForm, provinsi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                <img
                  src={profile.logoUrl || '/logo_alhusna.jpg'}
                  alt="Logo Lembaga"
                  className="w-24 h-24 rounded-full object-cover shadow-sm bg-white p-1 border border-emerald-300 mb-3"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
                  }}
                />
                <h4 className="font-bold text-slate-800 text-sm">{profile.nama}</h4>
                <p className="text-[11px] text-slate-500">{profile.subTitle}</p>

                {isAdmin && (
                  <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 rounded-lg cursor-pointer text-[11px] font-semibold transition">
                    <Upload className="w-3 h-3 text-emerald-600" />
                    <span>Ubah Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">NSPP</span>
                    <span className="font-bold text-slate-800">{profile.nspp || '-'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Telepon / WA</span>
                    <span className="font-bold text-slate-800">{profile.noTelp || '-'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Alamat</span>
                    <span className="font-medium text-slate-800">
                      {profile.alamat}, Kec. {profile.kecamatan}, Kab. {profile.kabupaten}, {profile.provinsi}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
                    <span className="font-bold text-slate-800">{profile.email || '-'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Website</span>
                    <span className="font-bold text-slate-800">{profile.website || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 5: ADMIN APLIKASI (DATA ADMIN RDM) - EXACT AS IMAGE 2 */}
      {/* ============================================================ */}
      {activeSubTab === 'keamanan' && isAdmin && (
        <div className="space-y-4">
          
          {/* Main Card Container */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            
            {/* Header Title Bar with + Tambah button */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 bg-white">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Data Admin RDM
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Master Data
                </p>
              </div>

              <button
                id="btn-tambah-admin-rdm"
                onClick={handleOpenAddAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah</span>
              </button>
            </div>

            {/* Datatable Controls Toolbar */}
            <div className="p-3.5 sm:p-4 bg-slate-50/50 border-b border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              
              {/* Left Buttons: Copy, Print, Excel & Show entries */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAdminData}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  title="Salin data tabel ke clipboard"
                >
                  <Copy className="w-3 h-3 text-slate-600" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintAdminData}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  title="Cetak daftar admin"
                >
                  <Printer className="w-3 h-3 text-slate-600" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAdminExcel}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  title="Unduh Excel / Spreadsheet"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>Excel</span>
                </button>

                {copyFeedback && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded animate-fade-in">
                    Disalin!
                  </span>
                )}

                <div className="flex items-center gap-1 text-slate-600 ml-1">
                  <span>Show</span>
                  <select
                    value={adminPageSize}
                    onChange={(e) => {
                      setAdminPageSize(Number(e.target.value));
                      setAdminCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>

              {/* Right Search Input */}
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-slate-600 font-medium">Search:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => {
                      setAdminSearch(e.target.value);
                      setAdminCurrentPage(1);
                    }}
                    placeholder=""
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-36 sm:w-48 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Datatable Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300 select-none">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">
                      No
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200">
                      Email
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200">
                      Nama
                    </th>
                    <th className="py-2.5 px-3 w-14 text-center border-r border-slate-200">
                      L/P
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200">
                      TTL
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200">
                      Pendidikan
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200">
                      Password
                    </th>
                    <th className="py-2.5 px-3 w-28 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedAdminList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data admin yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedAdminList.map((adminItem, index) => {
                      const rowNumber = (adminCurrentPage - 1) * adminPageSize + index + 1;
                      return (
                        <tr key={adminItem.id} className="hover:bg-emerald-50/40 transition">
                          <td className="py-2.5 px-3 text-center text-slate-600 font-medium border-r border-slate-200">
                            {rowNumber}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 font-normal border-r border-slate-200">
                            {adminItem.email}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200 uppercase">
                            {adminItem.nama}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                            {adminItem.gender || 'L'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 border-r border-slate-200">
                            {adminItem.ttl || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 border-r border-slate-200">
                            {adminItem.pendidikan || 'Staf Madrasah'}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-800 border-r border-slate-200">
                            {adminItem.password}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAdmin(adminItem)}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                title="Edit Admin"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdmin(adminItem)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                title="Hapus Admin"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Del</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Datatable Footer (Showing X of Y & Pagination) */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing {filteredAdminList.length > 0 ? (adminCurrentPage - 1) * adminPageSize + 1 : 0} to{' '}
                {Math.min(adminCurrentPage * adminPageSize, filteredAdminList.length)} of {filteredAdminList.length} entries
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={adminCurrentPage === 1}
                  onClick={() => setAdminCurrentPage(1)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-medium"
                >
                  First
                </button>
                <button
                  type="button"
                  disabled={adminCurrentPage === 1}
                  onClick={() => setAdminCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-medium"
                >
                  Previous
                </button>

                {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setAdminCurrentPage(pg)}
                    className={`px-3 py-1 rounded font-bold transition ${
                      adminCurrentPage === pg
                        ? 'bg-emerald-700 text-white'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={adminCurrentPage === totalAdminPages}
                  onClick={() => setAdminCurrentPage((p) => Math.min(totalAdminPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-medium"
                >
                  Next
                </button>
                <button
                  type="button"
                  disabled={adminCurrentPage === totalAdminPages}
                  onClick={() => setAdminCurrentPage(totalAdminPages)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-medium"
                >
                  Last
                </button>
              </div>
            </div>

          </div>
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
              Atur hak akses Administrator dan Asatidz untuk pengeditan data santri, input nilai, dan manajemen kelas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Fitur &amp; Wewenang</th>
                  <th className="py-2.5 px-3 text-center">Administrator</th>
                  <th className="py-2.5 px-3 text-center">Asatidz / Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    Input &amp; Edit Nilai Santri
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('admin', 'canInputNilai')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.admin.canInputNilai ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('asatidz', 'canInputNilai')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.asatidz.canInputNilai ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    Manajemen Lembaga &amp; Struktur Kelas
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('admin', 'canManageLembaga')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.admin.canManageLembaga ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('asatidz', 'canManageLembaga')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.asatidz.canManageLembaga ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    Upload &amp; Kelola Data Santri
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('admin', 'canUploadSantri')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.admin.canUploadSantri ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('asatidz', 'canUploadSantri')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.asatidz.canUploadSantri ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    Unduh Rekap &amp; Ekspor Excel
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('admin', 'canDownloadExcel')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.admin.canDownloadExcel ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => togglePermission('asatidz', 'canDownloadExcel')}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold text-white transition ${
                        permissions.asatidz.canDownloadExcel ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah / Edit Admin RDM (Image 2) */}
      {/* ============================================================ */}
      {adminModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingAdmin ? 'Edit Data Admin RDM' : 'Tambah Admin Aplikasi RDM'}
              </h4>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="text-white/80 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="p-4 sm:p-5 space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Admin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminForm.nama}
                  onChange={(e) => setAdminForm({ ...adminForm, nama: e.target.value })}
                  placeholder="Contoh: GORDI ARAFAH"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="gordiarafah090106@gmail.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin (L/P)
                  </label>
                  <select
                    value={adminForm.gender}
                    onChange={(e) => setAdminForm({ ...adminForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tempat, Tanggal Lahir (TTL)
                </label>
                <input
                  type="text"
                  value={adminForm.ttl}
                  onChange={(e) => setAdminForm({ ...adminForm, ttl: e.target.value })}
                  placeholder="DHARMASRAYA, 09 Januari 2006"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pendidikan / Jabatan
                </label>
                <input
                  type="text"
                  value={adminForm.pendidikan}
                  onChange={(e) => setAdminForm({ ...adminForm, pendidikan: e.target.value })}
                  placeholder="Staf Madrasah / Sarjana Komputer / dll"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password Login Admin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Arafah@2006"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Password ini dapat digunakan untuk login ke portal sistem sebagai Administrator.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer transition"
                >
                  {editingAdmin ? 'Perbarui Data Admin' : 'Simpan Data Admin'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah Pimpinan */}
      {/* ============================================================ */}
      {petinggiModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingPetinggi ? 'Edit Data Pimpinan' : 'Tambah Pimpinan Pesantren'}
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
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  value={petinggiForm.nama}
                  onChange={(e) => setPetinggiForm({ ...petinggiForm, nama: e.target.value })}
                  placeholder="K.H. ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  value={petinggiForm.jabatan}
                  onChange={(e) => setPetinggiForm({ ...petinggiForm, jabatan: e.target.value })}
                  placeholder="Pengasuh / Mudir Pesantren"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kontak / WhatsApp
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
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    value={petinggiForm.urutan}
                    onChange={(e) => setPetinggiForm({ ...petinggiForm, urutan: Number(e.target.value) })}
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
      {/* MODAL: Tambah Panitia */}
      {/* ============================================================ */}
      {panitiaModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingPanitia ? 'Edit Anggota Panitia' : 'Tambah Panitia Ujian'}
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
                  Nama Lengkap Anggota
                </label>
                <input
                  type="text"
                  value={panitiaForm.nama}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, nama: e.target.value })}
                  placeholder="Ust. ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan Kepanitiaan
                </label>
                <input
                  type="text"
                  value={panitiaForm.jabatan}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, jabatan: e.target.value })}
                  placeholder="Ketua Panitia / Sekretaris / Anggota"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tugas &amp; Tanggung Jawab
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
                {editingSemester ? 'Edit Periode Semester' : 'Tambah Periode Semester Baru'}
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
                  {editingSemester ? 'Perbarui Semester' : 'Simpan Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app deletion confirmation modal */}
      <ConfirmModal
        isOpen={!!confirmDelete?.isOpen}
        title={confirmDelete?.title}
        message={confirmDelete?.message || ''}
        onConfirm={() => {
          if (confirmDelete?.onConfirm) {
            confirmDelete.onConfirm();
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

    </div>
  );
};
