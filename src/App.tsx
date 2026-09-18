import { useState, useEffect } from 'react';
import {
  AcademicTerm,
  Asatidz,
  JadwalUjianItem,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PanitiaUjian,
  PesantrenProfile,
  Petinggi,
  RolePermissions,
  RoleType,
  Santri,
} from './types';
import {
  INITIAL_TERMS,
  INITIAL_PROFILE,
  INITIAL_PETINGGI,
  INITIAL_PANITIA,
  INITIAL_MAPEL,
  INITIAL_KELAS,
  INITIAL_ASATIDZ,
  INITIAL_SANTRI,
  INITIAL_NILAI,
  INITIAL_JADWAL,
  INITIAL_PERMISSIONS,
} from './data/initialData';
import { Sidebar, TabKey } from './components/Sidebar';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { DashboardView } from './components/DashboardView';
import { ProfilPesantrenView } from './components/ProfilPesantrenView';
import { LembagaView } from './components/LembagaView';
import { AsatidzView } from './components/AsatidzView';
import { RekapanView } from './components/RekapanView';
import { Menu, Shield, GraduationCap, Calendar, Lock } from 'lucide-react';

export default function App() {
  // --- Persistent States (with localStorage) ---
  const [allTerms, setAllTerms] = useState<AcademicTerm[]>(() => {
    const saved = localStorage.getItem('alhusna_terms');
    return saved ? JSON.parse(saved) : INITIAL_TERMS;
  });

  const [currentTerm, setCurrentTerm] = useState<AcademicTerm>(() => {
    const saved = localStorage.getItem('alhusna_current_term');
    if (saved) return JSON.parse(saved);
    return allTerms.find((t) => t.isActive) || allTerms[0];
  });

  const [currentRole, setCurrentRole] = useState<RoleType>(() => {
    const saved = localStorage.getItem('alhusna_current_role');
    return (saved as RoleType) || 'admin';
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('alhusna_admin_password') || 'admin123';
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [allAsatidz, setAllAsatidz] = useState<Asatidz[]>(() => {
    const saved = localStorage.getItem('alhusna_asatidz');
    return saved ? JSON.parse(saved) : INITIAL_ASATIDZ;
  });

  const [currentActiveAsatidz, setCurrentActiveAsatidz] = useState<Asatidz | null>(() => {
    const saved = localStorage.getItem('alhusna_active_asatidz');
    return saved ? JSON.parse(saved) : allAsatidz[0] || null;
  });

  const [profile, setProfile] = useState<PesantrenProfile>(() => {
    const saved = localStorage.getItem('alhusna_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [petinggiList, setPetinggiList] = useState<Petinggi[]>(() => {
    const saved = localStorage.getItem('alhusna_petinggi');
    return saved ? JSON.parse(saved) : INITIAL_PETINGGI;
  });

  const [panitiaList, setPanitiaList] = useState<PanitiaUjian[]>(() => {
    const saved = localStorage.getItem('alhusna_panitia');
    return saved ? JSON.parse(saved) : INITIAL_PANITIA;
  });

  const [permissions, setPermissions] = useState<{ admin: RolePermissions; asatidz: RolePermissions }>(() => {
    const saved = localStorage.getItem('alhusna_permissions');
    return saved ? JSON.parse(saved) : INITIAL_PERMISSIONS;
  });

  const [allMapel, setAllMapel] = useState<MataPelajaran[]>(() => {
    const saved = localStorage.getItem('alhusna_mapel');
    return saved ? JSON.parse(saved) : INITIAL_MAPEL;
  });

  const [allKelas, setAllKelas] = useState<Kelas[]>(() => {
    const saved = localStorage.getItem('alhusna_kelas');
    return saved ? JSON.parse(saved) : INITIAL_KELAS;
  });

  const [allSantri, setAllSantri] = useState<Santri[]>(() => {
    const saved = localStorage.getItem('alhusna_santri');
    return saved ? JSON.parse(saved) : INITIAL_SANTRI;
  });

  const [allNilai, setAllNilai] = useState<NilaiSantri[]>(() => {
    const saved = localStorage.getItem('alhusna_nilai');
    return saved ? JSON.parse(saved) : INITIAL_NILAI;
  });

  const [allJadwal, setAllJadwal] = useState<JadwalUjianItem[]>(() => {
    const saved = localStorage.getItem('alhusna_jadwal');
    return saved ? JSON.parse(saved) : INITIAL_JADWAL;
  });

  // Current active navigation tab (all moved to left sidebar)
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // --- Save to LocalStorage effects ---
  useEffect(() => {
    localStorage.setItem('alhusna_terms', JSON.stringify(allTerms));
  }, [allTerms]);

  useEffect(() => {
    localStorage.setItem('alhusna_current_term', JSON.stringify(currentTerm));
  }, [currentTerm]);

  useEffect(() => {
    localStorage.setItem('alhusna_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('alhusna_admin_password', adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    localStorage.setItem('alhusna_asatidz', JSON.stringify(allAsatidz));
  }, [allAsatidz]);

  useEffect(() => {
    localStorage.setItem('alhusna_active_asatidz', JSON.stringify(currentActiveAsatidz));
  }, [currentActiveAsatidz]);

  useEffect(() => {
    localStorage.setItem('alhusna_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('alhusna_petinggi', JSON.stringify(petinggiList));
  }, [petinggiList]);

  useEffect(() => {
    localStorage.setItem('alhusna_panitia', JSON.stringify(panitiaList));
  }, [panitiaList]);

  useEffect(() => {
    localStorage.setItem('alhusna_permissions', JSON.stringify(permissions));
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem('alhusna_mapel', JSON.stringify(allMapel));
  }, [allMapel]);

  useEffect(() => {
    localStorage.setItem('alhusna_kelas', JSON.stringify(allKelas));
  }, [allKelas]);

  useEffect(() => {
    localStorage.setItem('alhusna_santri', JSON.stringify(allSantri));
  }, [allSantri]);

  useEffect(() => {
    localStorage.setItem('alhusna_nilai', JSON.stringify(allNilai));
  }, [allNilai]);

  useEffect(() => {
    localStorage.setItem('alhusna_jadwal', JSON.stringify(allJadwal));
  }, [allJadwal]);

  // Handle switching academic term
  const handleSelectTerm = (selectedTerm: AcademicTerm) => {
    const updated = allTerms.map((t) => ({
      ...t,
      isActive: t.id === selectedTerm.id,
    }));
    setAllTerms(updated);
    setCurrentTerm({ ...selectedTerm, isActive: true });
  };

  const handleAddTerm = (newTerm: AcademicTerm) => {
    setAllTerms((prev) => [...prev, newTerm]);
  };

  // Batch save or update grades from Asatidz form
  const handleSaveNilaiBatch = (savedBatch: NilaiSantri[]) => {
    setAllNilai((prev) => {
      const filtered = prev.filter(
        (p) => !savedBatch.some((s) => s.termId === p.termId && s.santriId === p.santriId && s.mapelId === p.mapelId)
      );
      return [...filtered, ...savedBatch];
    });
  };

  // Switch Role logic
  const handleRequestSwitchToAdmin = () => {
    if (currentRole === 'admin') return;
    setIsAdminModalOpen(true);
  };

  const handleSuccessAdminAuth = () => {
    setCurrentRole('admin');
    setIsAdminModalOpen(false);
  };

  const handleSwitchToAsatidz = () => {
    setCurrentRole('asatidz');
  };

  return (
    <div className="min-h-screen flex bg-slate-100/70 text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* 1. LEFT SIDEBAR (All features moved to left side of app) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentRole={currentRole}
        onSwitchToAdmin={handleRequestSwitchToAdmin}
        onSwitchToAsatidz={handleSwitchToAsatidz}
        profile={profile}
        currentTerm={currentTerm}
        allTerms={allTerms}
        onSelectTerm={handleSelectTerm}
        onAddTerm={handleAddTerm}
        currentAsatidz={currentActiveAsatidz}
        allAsatidz={allAsatidz}
        onSelectAsatidz={setCurrentActiveAsatidz}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top bar on main area for mobile hamburger & current status */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              title="Buka Menu Samping"
            >
              <Menu className="w-5 h-5 text-emerald-800" />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                <span>{activeTab.toUpperCase()}</span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="hidden sm:inline-block text-xs font-semibold text-emerald-800">
                  {currentTerm.label}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Role Pill */}
            {currentRole === 'admin' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold shadow-xs">
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Administrator</span>
                <span className="sm:hidden">Admin</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-900 text-xs font-bold shadow-xs">
                <GraduationCap className="w-3.5 h-3.5 text-slate-900" />
                <span className="hidden sm:inline">
                  {currentActiveAsatidz ? currentActiveAsatidz.nama : 'Asatidz'}
                </span>
                <span className="sm:hidden">Guru</span>
              </div>
            )}

            {/* Quick Switch to Admin button if in teacher mode */}
            {currentRole === 'asatidz' && (
              <button
                onClick={handleRequestSwitchToAdmin}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 transition"
                title="Masuk sebagai Administrator"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden md:inline">Masuk Admin</span>
              </button>
            )}
          </div>
        </header>

        {/* Views Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              currentTerm={currentTerm}
              allTerms={allTerms}
              onSelectTerm={handleSelectTerm}
              allSantri={allSantri}
              allKelas={allKelas}
              allMapel={allMapel}
              allAsatidz={allAsatidz}
              allNilai={allNilai}
              currentRole={currentRole}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'profil' && (
            <ProfilPesantrenView
              profile={profile}
              onUpdateProfile={setProfile}
              petinggiList={petinggiList}
              onUpdatePetinggi={setPetinggiList}
              panitiaList={panitiaList}
              onUpdatePanitia={setPanitiaList}
              permissions={permissions}
              onUpdatePermissions={setPermissions}
              currentRole={currentRole}
              adminPassword={adminPassword}
              onUpdateAdminPassword={setAdminPassword}
            />
          )}

          {activeTab === 'lembaga' && (
            <LembagaView
              currentTerm={currentTerm}
              allMapel={allMapel}
              onUpdateMapel={setAllMapel}
              allKelas={allKelas}
              onUpdateKelas={setAllKelas}
              allSantri={allSantri}
              onUpdateSantri={setAllSantri}
              allJadwal={allJadwal}
              onUpdateJadwal={setAllJadwal}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'asatidz' && (
            <AsatidzView
              currentTerm={currentTerm}
              allAsatidz={allAsatidz}
              onUpdateAsatidz={setAllAsatidz}
              allKelas={allKelas}
              allMapel={allMapel}
              allSantri={allSantri}
              allNilai={allNilai}
              onSaveNilaiBatch={handleSaveNilaiBatch}
              currentRole={currentRole}
              currentActiveAsatidz={currentActiveAsatidz}
              onSelectActiveAsatidz={setCurrentActiveAsatidz}
              onNavigateToRekap={() => setActiveTab('rekapan')}
            />
          )}

          {activeTab === 'rekapan' && (
            <RekapanView
              currentTerm={currentTerm}
              allNilai={allNilai}
              allSantri={allSantri}
              allKelas={allKelas}
              allMapel={allMapel}
              allAsatidz={allAsatidz}
              profile={profile}
              currentRole={currentRole}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-slate-500 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{profile.nama}</span>
              <span>•</span>
              <span>{profile.kabupaten}, {profile.provinsi}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Sistem Penilaian Imtihan Niha&apos;i — Semester {currentTerm.label}
            </div>
          </div>
        </footer>
      </div>

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleSuccessAdminAuth}
        storedPassword={adminPassword}
      />
    </div>
  );
}
