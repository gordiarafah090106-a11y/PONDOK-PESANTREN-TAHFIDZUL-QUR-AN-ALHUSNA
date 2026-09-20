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
  Pengumuman,
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
  INITIAL_PENGUMUMAN,
} from './data/initialData';
import {
  seedInitialDataIfEmpty,
  subscribePesantrenProfile,
  subscribeAppSettings,
  subscribeAcademicTerms,
  subscribePetinggi,
  subscribePanitiaUjian,
  subscribeMataPelajaran,
  subscribeKelas,
  subscribeSantri,
  subscribeAsatidz,
  subscribeNilaiSantri,
  subscribeJadwalUjian,
  subscribePengumuman,
  savePesantrenProfileToCloud,
  saveAppSettingsToCloud,
  saveAcademicTermsToCloud,
  savePetinggiListToCloud,
  savePanitiaListToCloud,
  saveMapelListToCloud,
  saveKelasListToCloud,
  saveSantriListToCloud,
  saveAsatidzListToCloud,
  saveNilaiBatchToCloud,
  saveJadwalListToCloud,
  savePengumumanListToCloud,
} from './services/firestoreService';
import { Sidebar, TabKey } from './components/Sidebar';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { DashboardView } from './components/DashboardView';
import { ProfilPesantrenView } from './components/ProfilPesantrenView';
import { LembagaView } from './components/LembagaView';
import { AsatidzView } from './components/AsatidzView';
import { RekapanView } from './components/RekapanView';
import { LoginView } from './components/LoginView';
import { Menu, Shield, GraduationCap, Lock, Cloud, CloudCheck, RefreshCw, LogOut } from 'lucide-react';

export default function App() {
  // --- Cloud Sync Status ---
  const [isCloudReady, setIsCloudReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // --- Authentication State ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('alhusna_logged_in');
    return saved === 'true';
  });

  // --- States (Initialized from cache / initial data, synced via Firestore Real-Time) ---
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

  const [allPengumuman, setAllPengumuman] = useState<Pengumuman[]>(() => {
    const saved = localStorage.getItem('alhusna_pengumuman');
    return saved ? JSON.parse(saved) : INITIAL_PENGUMUMAN;
  });

  // Current active navigation tab & sub-tab
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('petinggi');

  const handleSelectTab = (tab: TabKey, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) {
      setActiveSubTab(subTab);
    } else {
      if (tab === 'dashboard') setActiveSubTab('ringkasan');
      else if (tab === 'profil') setActiveSubTab('petinggi');
      else if (tab === 'lembaga') setActiveSubTab('kelas');
      else if (tab === 'asatidz') setActiveSubTab(currentRole === 'admin' ? 'akun' : 'mengajar');
      else if (tab === 'rekapan') setActiveSubTab('rekap_guru');
    }
  };

  // --- Real-time Firestore Cloud Synchronization ---
  useEffect(() => {
    let isMounted = true;

    async function initCloud() {
      try {
        setIsSyncing(true);
        await seedInitialDataIfEmpty();
        if (isMounted) {
          setIsCloudReady(true);
          setIsSyncing(false);
        }
      } catch (err) {
        console.warn('Firebase init/seed info:', err);
        if (isMounted) {
          setIsCloudReady(true);
          setIsSyncing(false);
        }
      }
    }

    initCloud();

    // 1. Profile listener
    const unsubProfile = subscribePesantrenProfile((data) => {
      if (data && data.nama) {
        setProfile(data);
        localStorage.setItem('alhusna_profile', JSON.stringify(data));
      }
    });

    // 2. Settings & Security listener
    const unsubSettings = subscribeAppSettings((data) => {
      if (data?.adminPassword) {
        setAdminPassword(data.adminPassword);
        localStorage.setItem('alhusna_admin_password', data.adminPassword);
      }
      if (data?.permissions) {
        setPermissions(data.permissions);
        localStorage.setItem('alhusna_permissions', JSON.stringify(data.permissions));
      }
    });

    // 3. Academic Terms listener
    const unsubTerms = subscribeAcademicTerms((data) => {
      if (data && data.length > 0) {
        setAllTerms(data);
        localStorage.setItem('alhusna_terms', JSON.stringify(data));
        const active = data.find((t) => t.isActive);
        if (active) {
          setCurrentTerm(active);
          localStorage.setItem('alhusna_current_term', JSON.stringify(active));
        }
      }
    });

    // 4. Petinggi listener
    const unsubPetinggi = subscribePetinggi((data) => {
      if (data) {
        setPetinggiList(data);
        localStorage.setItem('alhusna_petinggi', JSON.stringify(data));
      }
    });

    // 5. Panitia listener
    const unsubPanitia = subscribePanitiaUjian((data) => {
      if (data) {
        setPanitiaList(data);
        localStorage.setItem('alhusna_panitia', JSON.stringify(data));
      }
    });

    // 6. Mata Pelajaran listener
    const unsubMapel = subscribeMataPelajaran((data) => {
      if (data) {
        setAllMapel(data);
        localStorage.setItem('alhusna_mapel', JSON.stringify(data));
      }
    });

    // 7. Kelas listener
    const unsubKelas = subscribeKelas((data) => {
      if (data) {
        setAllKelas(data);
        localStorage.setItem('alhusna_kelas', JSON.stringify(data));
      }
    });

    // 8. Santri listener
    const unsubSantri = subscribeSantri((data) => {
      if (data) {
        setAllSantri(data);
        localStorage.setItem('alhusna_santri', JSON.stringify(data));
      }
    });

    // 9. Asatidz listener
    const unsubAsatidz = subscribeAsatidz((data) => {
      if (data) {
        setAllAsatidz(data);
        localStorage.setItem('alhusna_asatidz', JSON.stringify(data));
        setCurrentActiveAsatidz((prev) => {
          if (!prev) return data[0] || null;
          return data.find((a) => a.id === prev.id) || data[0] || null;
        });
      }
    });

    // 10. Nilai Santri listener
    const unsubNilai = subscribeNilaiSantri((data) => {
      if (data) {
        setAllNilai(data);
        localStorage.setItem('alhusna_nilai', JSON.stringify(data));
      }
    });

    // 11. Jadwal Ujian listener
    const unsubJadwal = subscribeJadwalUjian((data) => {
      if (data) {
        setAllJadwal(data);
        localStorage.setItem('alhusna_jadwal', JSON.stringify(data));
      }
    });

    // 12. Pengumuman listener
    const unsubPengumuman = subscribePengumuman((data) => {
      if (data) {
        setAllPengumuman(data);
        localStorage.setItem('alhusna_pengumuman', JSON.stringify(data));
      }
    });

    return () => {
      isMounted = false;
      unsubProfile();
      unsubSettings();
      unsubTerms();
      unsubPetinggi();
      unsubPanitia();
      unsubMapel();
      unsubKelas();
      unsubSantri();
      unsubAsatidz();
      unsubNilai();
      unsubJadwal();
      unsubPengumuman();
    };
  }, []);

  // --- Synchronized Cloud Mutation Handlers ---
  const handleUpdateProfile = (newProfile: PesantrenProfile) => {
    setProfile(newProfile);
    savePesantrenProfileToCloud(newProfile).catch(console.error);
  };

  const handleUpdatePetinggi = (list: Petinggi[]) => {
    setPetinggiList(list);
    savePetinggiListToCloud(list).catch(console.error);
  };

  const handleUpdatePanitia = (list: PanitiaUjian[]) => {
    setPanitiaList(list);
    savePanitiaListToCloud(list).catch(console.error);
  };

  const handleUpdatePermissions = (perms: { admin: RolePermissions; asatidz: RolePermissions }) => {
    setPermissions(perms);
    saveAppSettingsToCloud({ permissions: perms }).catch(console.error);
  };

  const handleUpdateAdminPassword = (newPassword: string) => {
    setAdminPassword(newPassword);
    saveAppSettingsToCloud({ adminPassword: newPassword }).catch(console.error);
  };

  const handleUpdateMapel = (list: MataPelajaran[]) => {
    setAllMapel(list);
    saveMapelListToCloud(list).catch(console.error);
  };

  const handleUpdateKelas = (list: Kelas[]) => {
    setAllKelas(list);
    saveKelasListToCloud(list).catch(console.error);
  };

  const handleUpdateSantri = (list: Santri[]) => {
    setAllSantri(list);
    saveSantriListToCloud(list).catch(console.error);
  };

  const handleUpdateAsatidz = (list: Asatidz[]) => {
    setAllAsatidz(list);
    saveAsatidzListToCloud(list).catch(console.error);
  };

  const handleUpdateJadwal = (list: JadwalUjianItem[]) => {
    setAllJadwal(list);
    saveJadwalListToCloud(list).catch(console.error);
  };

  const handleSavePengumuman = (list: Pengumuman[]) => {
    setAllPengumuman(list);
    savePengumumanListToCloud(list).catch(console.error);
  };

  const handleUpdateTerms = (list: AcademicTerm[]) => {
    setAllTerms(list);
    saveAcademicTermsToCloud(list).catch(console.error);
  };

  // Handle switching academic term
  const handleSelectTerm = (selectedTerm: AcademicTerm) => {
    const updated = allTerms.map((t) => ({
      ...t,
      isActive: t.id === selectedTerm.id,
    }));
    setAllTerms(updated);
    setCurrentTerm({ ...selectedTerm, isActive: true });
    saveAcademicTermsToCloud(updated).catch(console.error);
  };

  const handleAddTerm = (newTerm: AcademicTerm) => {
    const updated = [...allTerms, newTerm];
    setAllTerms(updated);
    saveAcademicTermsToCloud(updated).catch(console.error);
  };

  // Batch save or update grades from Asatidz form
  const handleSaveNilaiBatch = (savedBatch: NilaiSantri[]) => {
    setAllNilai((prev) => {
      const filtered = prev.filter(
        (p) => !savedBatch.some((s) => s.termId === p.termId && s.santriId === p.santriId && s.mapelId === p.mapelId)
      );
      return [...filtered, ...savedBatch];
    });
    saveNilaiBatchToCloud(savedBatch).catch(console.error);
  };

  // Switch Role logic
  const handleRequestSwitchToAdmin = () => {
    if (currentRole === 'admin') return;
    setIsAdminModalOpen(true);
  };

  const handleSuccessAdminAuth = () => {
    setCurrentRole('admin');
    localStorage.setItem('alhusna_current_role', 'admin');
    setIsAdminModalOpen(false);
  };

  const handleSwitchToAsatidz = () => {
    setCurrentRole('asatidz');
    localStorage.setItem('alhusna_current_role', 'asatidz');
  };

  const handleLoginSuccess = (role: RoleType, asatidzAccount?: Asatidz) => {
    setCurrentRole(role);
    localStorage.setItem('alhusna_current_role', role);
    if (role === 'asatidz' && asatidzAccount) {
      setCurrentActiveAsatidz(asatidzAccount);
      localStorage.setItem('alhusna_active_asatidz', JSON.stringify(asatidzAccount));
    }
    setIsLoggedIn(true);
    localStorage.setItem('alhusna_logged_in', 'true');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('alhusna_logged_in');
  };

  // If user is not authenticated yet, render the Login Screen first
  if (!isLoggedIn) {
    return (
      <LoginView
        profile={profile}
        currentTerm={currentTerm}
        allTerms={allTerms}
        onSelectTerm={handleSelectTerm}
        adminPassword={adminPassword}
        allAsatidz={allAsatidz}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-slate-100/70 text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* 1. LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onSelectTab={handleSelectTab}
        onSelectSubTab={setActiveSubTab}
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
        onLogout={handleLogout}
        petinggiCount={petinggiList.length}
        panitiaCount={panitiaList.length}
        kelasCount={allKelas.length}
        mapelCount={allMapel.length}
        jadwalCount={allJadwal.length}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto main-content-scroll h-screen">
        
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Real-Time Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                isCloudReady
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title="Status koneksi database Firebase Cloud realtime"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                  <span className="hidden md:inline">Sinkronisasi Cloud...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden md:inline">Cloud Real-Time</span>
                  <span className="md:hidden">Cloud</span>
                </>
              )}
            </div>

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

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold border border-slate-200 transition"
              title="Keluar / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Views Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              currentTerm={currentTerm}
              allSantri={allSantri}
              allKelas={allKelas}
              allMapel={allMapel}
              allAsatidz={allAsatidz}
              allNilai={allNilai}
              allPengumuman={allPengumuman}
              onSavePengumuman={handleSavePengumuman}
              currentRole={currentRole}
              currentTeacherAccount={currentActiveAsatidz}
              onNavigate={(tab) => handleSelectTab(tab)}
            />
          )}

          {activeTab === 'profil' && (
            <ProfilPesantrenView
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              petinggiList={petinggiList}
              onUpdatePetinggi={handleUpdatePetinggi}
              panitiaList={panitiaList}
              onUpdatePanitia={handleUpdatePanitia}
              permissions={permissions}
              onUpdatePermissions={handleUpdatePermissions}
              currentRole={currentRole}
              adminPassword={adminPassword}
              onUpdateAdminPassword={handleUpdateAdminPassword}
              allTerms={allTerms}
              currentTerm={currentTerm}
              onSelectTerm={handleSelectTerm}
              onUpdateTerms={handleUpdateTerms}
              activeSubTab={activeSubTab}
              onSelectSubTab={(sub) => setActiveSubTab(sub)}
            />
          )}

          {activeTab === 'lembaga' && (
            <LembagaView
              currentTerm={currentTerm}
              allMapel={allMapel}
              onUpdateMapel={handleUpdateMapel}
              allKelas={allKelas}
              onUpdateKelas={handleUpdateKelas}
              allSantri={allSantri}
              onUpdateSantri={handleUpdateSantri}
              allJadwal={allJadwal}
              onUpdateJadwal={handleUpdateJadwal}
              currentRole={currentRole}
              activeSubTab={activeSubTab}
              onSelectSubTab={(sub) => setActiveSubTab(sub)}
            />
          )}

          {activeTab === 'asatidz' && (
            <AsatidzView
              currentTerm={currentTerm}
              allAsatidz={allAsatidz}
              onUpdateAsatidz={handleUpdateAsatidz}
              allKelas={allKelas}
              allMapel={allMapel}
              allSantri={allSantri}
              allNilai={allNilai}
              onSaveNilaiBatch={handleSaveNilaiBatch}
              currentRole={currentRole}
              currentActiveAsatidz={currentActiveAsatidz}
              onSelectActiveAsatidz={setCurrentActiveAsatidz}
              onNavigateToRekap={() => handleSelectTab('rekapan')}
              activeSubTab={activeSubTab}
              onSelectSubTab={(sub) => setActiveSubTab(sub)}
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
              activeSubTab={activeSubTab}
              onSelectSubTab={(sub) => setActiveSubTab(sub)}
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
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Firebase Real-Time DB
              </span>
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

