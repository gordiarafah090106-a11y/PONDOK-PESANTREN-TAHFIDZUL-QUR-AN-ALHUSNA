import React, { useState, useEffect, useRef } from 'react';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  RoleType,
  Santri,
} from '../types';
import {
  GraduationCap,
  BookOpen,
  School,
  Save,
  CheckCircle2,
  Users,
  Award,
  Plus,
  Trash2,
  Edit2,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  Upload,
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  UserCheck,
  Check,
  X,
  Clock,
  HelpCircle,
} from 'lucide-react';
import {
  downloadGuruTemplateExcel,
  parseGuruExcel,
  exportGuruListToExcel,
  exportClassGradesToExcel,
} from '../utils/excelExport';

interface AsatidzViewProps {
  currentTerm: AcademicTerm;
  allAsatidz: Asatidz[];
  onUpdateAsatidz: (updated: Asatidz[]) => void;
  allKelas: Kelas[];
  allMapel: MataPelajaran[];
  allSantri: Santri[];
  allNilai: NilaiSantri[];
  onSaveNilaiBatch: (savedNilai: NilaiSantri[]) => void;
  currentRole: RoleType;
  currentActiveAsatidz: Asatidz | null;
  onSelectActiveAsatidz?: (guru: Asatidz) => void;
  onNavigateToRekap?: () => void;
  activeSubTab?: string;
  onSelectSubTab?: (tab: 'akun' | 'mengajar' | 'input_nilai') => void;
}

export const AsatidzView: React.FC<AsatidzViewProps> = ({
  currentTerm,
  allAsatidz,
  onUpdateAsatidz,
  allKelas,
  allMapel,
  allSantri,
  allNilai,
  onSaveNilaiBatch,
  currentRole,
  currentActiveAsatidz,
  onSelectActiveAsatidz,
  onNavigateToRekap,
  activeSubTab: propSubTab,
  onSelectSubTab,
}) => {
  const isAdmin = currentRole === 'admin';

  // Subtabs
  // For Admin: 'akun' (Daftar Akun Guru) | 'mengajar' (Atur Tugas Mengajar) | 'input_nilai' (Input Nilai Santri)
  // For Asatidz: 'mengajar' (Tugas Mengajar Saya) | 'input_nilai' (Input Nilai Santri)
  const [internalTab, setInternalTab] = useState<'akun' | 'mengajar' | 'input_nilai'>(
    isAdmin ? 'akun' : 'mengajar'
  );
  const activeTab = (propSubTab as 'akun' | 'mengajar' | 'input_nilai') || internalTab;
  const setActiveTab = (tab: 'akun' | 'mengajar' | 'input_nilai') => {
    setInternalTab(tab);
    if (onSelectSubTab) onSelectSubTab(tab);
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWali, setFilterWali] = useState<string>('all');

  // Password visibility map (for admin view)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const toggleShowPassword = (guruId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [guruId]: !prev[guruId],
    }));
  };

  // --- Modal: Tambah / Edit Akun Guru ---
  const [guruModalOpen, setGuruModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Asatidz | null>(null);
  const [guruForm, setGuruForm] = useState<{
    nip: string;
    nama: string;
    gender: 'L' | 'P';
    ttl: string;
    pendidikan: string;
    password: string;
    waliKelas: string;
    jtm: number;
    kontak: string;
    status: 'Aktif' | 'Cuti' | 'Non-Aktif';
    mataPelajaranIds: string[];
    kelasIds: string[];
  }>({
    nip: '',
    nama: '',
    gender: 'L',
    ttl: '',
    pendidikan: 'S1 Pendidikan Agama Islam',
    password: 'guru123',
    waliKelas: '-',
    jtm: 24,
    kontak: '',
    status: 'Aktif',
    mataPelajaranIds: [],
    kelasIds: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open modal add
  const handleOpenAddGuru = () => {
    setEditingGuru(null);
    setGuruForm({
      nip: '',
      nama: '',
      gender: 'L',
      ttl: 'Jakarta, 01 Januari 1990',
      pendidikan: 'Sarjana (S1)',
      password: 'guru123',
      waliKelas: '-',
      jtm: 24,
      kontak: '',
      status: 'Aktif',
      mataPelajaranIds: allMapel[0] ? [allMapel[0].id] : [],
      kelasIds: allKelas[0] ? [allKelas[0].id] : [],
    });
    setGuruModalOpen(true);
  };

  // Open modal edit
  const handleOpenEditGuru = (guru: Asatidz) => {
    setEditingGuru(guru);
    setGuruForm({
      nip: guru.nip || '',
      nama: guru.nama,
      gender: guru.gender || 'L',
      ttl: guru.ttl || '',
      pendidikan: guru.pendidikan || 'Sarjana (S1)',
      password: guru.password || 'guru123',
      waliKelas: guru.waliKelas || '-',
      jtm: guru.jtm || 24,
      kontak: guru.kontak || '',
      status: guru.status || 'Aktif',
      mataPelajaranIds: guru.mataPelajaranIds || [],
      kelasIds: guru.kelasIds || [],
    });
    setGuruModalOpen(true);
  };

  // Submit guru form
  const handleSaveGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guruForm.nama.trim()) return;

    if (editingGuru) {
      const updated = allAsatidz.map((g) =>
        g.id === editingGuru.id
          ? {
              ...g,
              ...guruForm,
            }
          : g
      );
      onUpdateAsatidz(updated);
    } else {
      const newGuru: Asatidz = {
        id: `ast-${Date.now()}`,
        ...guruForm,
      };
      onUpdateAsatidz([...allAsatidz, newGuru]);
    }
    setGuruModalOpen(false);
  };

  // Delete guru
  const handleDeleteGuru = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus akun guru/ustadz "${nama}"?`)) {
      onUpdateAsatidz(allAsatidz.filter((g) => g.id !== id));
    }
  };

  // Handle Excel Upload for Teachers
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parseResult = await parseGuruExcel(file);
      if (!parseResult.success || parseResult.data.length === 0) {
        window.alert(parseResult.message || 'Tidak ada data guru yang valid pada file Excel tersebut.');
        return;
      }

      // Merge with existing teachers by NIP or add new
      const merged = [...allAsatidz];
      parseResult.data.forEach((imported, index) => {
        const existingIdx = merged.findIndex(
          (m) => m.nip && imported.nip && m.nip.trim() === imported.nip.trim()
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            ...imported,
            id: merged[existingIdx].id,
          };
        } else {
          merged.push({
            ...imported,
            id: `ast-${Date.now()}-${index}`,
          });
        }
      });

      onUpdateAsatidz(merged);
      window.alert(`Alhamdulillah, berhasil mengimpor ${parseResult.data.length} akun guru!`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Format tidak sesuai';
      window.alert(`Gagal mengimpor file Excel: ${errMsg}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Grading Logic (Used for Asatidz & Admin Assignment View) ---
  const activeGuru =
    currentActiveAsatidz ||
    allAsatidz.find((g) => g.id === (isAdmin ? allAsatidz[0]?.id : '')) ||
    allAsatidz[0];

  const [selectedGuruId, setSelectedGuruId] = useState<string>(activeGuru?.id || '');
  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    activeGuru?.kelasIds?.[0] || allKelas[0]?.id || ''
  );
  const [selectedMapelId, setSelectedMapelId] = useState<string>(
    activeGuru?.mataPelajaranIds?.[0] || allMapel[0]?.id || ''
  );

  const [draftScores, setDraftScores] = useState<
    Record<string, { harian: number; lisan: number; tulis: number; catatan: string }>
  >({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Sync grading teacher
  useEffect(() => {
    if (currentActiveAsatidz) {
      setSelectedGuruId(currentActiveAsatidz.id);
      if (currentActiveAsatidz.kelasIds?.length > 0) {
        setSelectedKelasId(currentActiveAsatidz.kelasIds[0]);
      }
      if (currentActiveAsatidz.mataPelajaranIds?.length > 0) {
        setSelectedMapelId(currentActiveAsatidz.mataPelajaranIds[0]);
      }
    }
  }, [currentActiveAsatidz]);

  // Load existing grades
  useEffect(() => {
    const classSantri = allSantri.filter((s) => s.kelasId === selectedKelasId && s.status === 'Aktif');
    const existingGrades = allNilai.filter(
      (n) =>
        n.termId === currentTerm.id &&
        n.kelasId === selectedKelasId &&
        n.mapelId === selectedMapelId &&
        n.asatidzId === selectedGuruId
    );

    const initialMap: Record<string, { harian: number; lisan: number; tulis: number; catatan: string }> = {};

    classSantri.forEach((santri) => {
      const found = existingGrades.find((g) => g.santriId === santri.id);
      if (found) {
        initialMap[santri.id] = {
          harian: found.nilaiHarian,
          lisan: found.nilaiLisan,
          tulis: found.nilaiTulis,
          catatan: found.catatan || '',
        };
      } else {
        initialMap[santri.id] = {
          harian: 80,
          lisan: 80,
          tulis: 80,
          catatan: 'Baik, tingkatkan ketelitian.',
        };
      }
    });

    setDraftScores(initialMap);
    setSaveSuccessNotice(null);
  }, [selectedGuruId, selectedKelasId, selectedMapelId, currentTerm.id, allNilai]);

  const activeKelas = allKelas.find((k) => k.id === selectedKelasId);
  const activeMapel = allMapel.find((m) => m.id === selectedMapelId);
  const classSantri = allSantri.filter((s) => s.kelasId === selectedKelasId && s.status === 'Aktif');

  // Compute final score
  const calculateFinal = (harian: number, lisan: number, tulis: number) => {
    const final = harian * 0.3 + lisan * 0.3 + tulis * 0.4;
    return Math.round(final * 10) / 10;
  };

  const getPredikat = (final: number): { predikat: string; badgeColor: string } => {
    if (final >= 90) return { predikat: 'Mumtaz (A)', badgeColor: 'bg-emerald-100 text-emerald-800' };
    if (final >= 80) return { predikat: 'Jayyid Jiddan (B)', badgeColor: 'bg-teal-100 text-teal-800' };
    if (final >= 70) return { predikat: 'Jayyid (C)', badgeColor: 'bg-blue-100 text-blue-800' };
    if (final >= 60) return { predikat: 'Maqbul (D)', badgeColor: 'bg-amber-100 text-amber-800' };
    return { predikat: 'Rosib (E)', badgeColor: 'bg-rose-100 text-rose-800' };
  };

  const handleScoreChange = (
    santriId: string,
    field: 'harian' | 'lisan' | 'tulis' | 'catatan',
    val: string | number
  ) => {
    setDraftScores((prev) => {
      const current = prev[santriId] || { harian: 80, lisan: 80, tulis: 80, catatan: '' };
      return {
        ...prev,
        [santriId]: {
          ...current,
          [field]: field === 'catatan' ? val : Math.max(0, Math.min(100, Number(val) || 0)),
        },
      };
    });
  };

  const handleSaveGrades = () => {
    const newNilaiEntries: NilaiSantri[] = classSantri.map((santri) => {
      const draft = draftScores[santri.id] || { harian: 80, lisan: 80, tulis: 80, catatan: '' };
      const nilaiAkhir = calculateFinal(draft.harian, draft.lisan, draft.tulis);
      const { predikat } = getPredikat(nilaiAkhir);

      return {
        id: `nil-${currentTerm.id}-${selectedKelasId}-${selectedMapelId}-${santri.id}`,
        santriId: santri.id,
        mapelId: selectedMapelId,
        asatidzId: selectedGuruId,
        kelasId: selectedKelasId,
        termId: currentTerm.id,
        nilaiHarian: draft.harian,
        nilaiLisan: draft.lisan,
        nilaiTulis: draft.tulis,
        nilaiAkhir,
        predikat,
        catatan: draft.catatan,
        tanggalInput: new Date().toISOString().split('T')[0],
      };
    });

    onSaveNilaiBatch(newNilaiEntries);
    setSaveSuccessNotice(
      `Alhamdulillah! Nilai ujian untuk kelas ${activeKelas?.nama || ''} mata pelajaran ${
        activeMapel?.nama || ''
      } berhasil disimpan ke database cloud.`
    );
  };

  // Filtered teachers for Admin list
  const filteredGuruList = allAsatidz.filter((guru) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      guru.nama.toLowerCase().includes(q) ||
      (guru.nip && guru.nip.toLowerCase().includes(q)) ||
      (guru.pendidikan && guru.pendidikan.toLowerCase().includes(q));

    if (filterWali === 'all') return matchQuery;
    if (filterWali === 'wali') return matchQuery && guru.waliKelas && guru.waliKelas !== '-';
    if (filterWali === 'non_wali') return matchQuery && (!guru.waliKelas || guru.waliKelas === '-');
    return matchQuery;
  });

  return (
    <div className="space-y-5">
      
      {/* Active Sub-Section Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold shadow-xs">
            {activeTab === 'akun' && <Users className="w-4 h-4" />}
            {activeTab === 'mengajar' && <BookOpen className="w-4 h-4" />}
            {activeTab === 'input_nilai' && <Edit2 className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Asatidz &amp; Dewan Guru
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">
                {activeTab === 'akun' && `Daftar Akun Guru & Asatidz (${allAsatidz.length} Terdaftar)`}
                {activeTab === 'mengajar' && (isAdmin ? 'Penugasan Mengajar & Jadwal Mapel' : 'Jadwal Tugas Mengajar Saya')}
                {activeTab === 'input_nilai' && 'Input Nilai Ujian Santri'}
              </h2>
            </div>
          </div>
        </div>

        {/* Current Active User Info */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Periode:</span>
          <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
            {currentTerm.label}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. ADMIN TAB: DAFTAR AKUN GURU & ASATIDZ (MATCHING IMAGE 1) */}
      {/* ============================================================ */}
      {isAdmin && activeTab === 'akun' && (
        <div className="space-y-4">
          
          {/* Action Bar (Search, Add, Excel Import/Export) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari guru berdasarkan nama / NIK..."
                  className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-56 sm:w-64"
                />
              </div>

              <select
                value={filterWali}
                onChange={(e) => setFilterWali(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">Semua Status Wali</option>
                <option value="wali">Hanya Wali Kelas</option>
                <option value="non_wali">Bukan Wali Kelas</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Hidden Excel File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                title="Upload file Excel data guru"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={() => downloadGuruTemplateExcel()}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                title="Download template Excel akun guru"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Excel</span>
              </button>

              <button
                onClick={() => exportGuruListToExcel(allAsatidz, allKelas, allMapel)}
                className="py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition flex items-center gap-1.5"
                title="Ekspor daftar akun guru ke Excel"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" />
                <span>Ekspor Excel</span>
              </button>

              <button
                id="btn-tambah-akun-guru"
                onClick={handleOpenAddGuru}
                className="py-1.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Guru</span>
              </button>
            </div>
          </div>

          {/* Master Table (Matching Image 1: No, NIK, Nama, L/P, TTL, Pendidikan, Password, Wali Kelas, JTM, Aksi) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold">
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">NIK / NUPTK</th>
                    <th className="py-3 px-3">Nama Guru / Asatidz</th>
                    <th className="py-3 px-2 text-center">L/P</th>
                    <th className="py-3 px-3">Tempat, Tanggal Lahir</th>
                    <th className="py-3 px-3">Pendidikan</th>
                    <th className="py-3 px-3">Password Akun</th>
                    <th className="py-3 px-3">Wali Kelas</th>
                    <th className="py-3 px-2 text-center">JTM</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGuruList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Tidak ada data guru yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredGuruList.map((guru, idx) => {
                      const isShowPass = !!showPasswordMap[guru.id];
                      return (
                        <tr key={guru.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {guru.nip || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{guru.nama}</div>
                            {guru.kontak && (
                              <div className="text-[10px] text-slate-400">{guru.kontak}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                guru.gender === 'P'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {guru.gender || 'L'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {guru.ttl || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {guru.pendidikan || 'S1'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                              <span className="font-mono text-slate-800 font-semibold text-[11px]">
                                {isShowPass ? guru.password || 'guru123' : '••••••••'}
                              </span>
                              <button
                                onClick={() => toggleShowPassword(guru.id)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title={isShowPass ? 'Sembunyikan' : 'Tampilkan'}
                              >
                                {isShowPass ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            {guru.waliKelas && guru.waliKelas !== '-' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {guru.waliKelas}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                            {guru.jtm || 4} Jam
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                guru.status === 'Cuti'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {guru.status || 'Aktif'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditGuru(guru)}
                                className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                title="Edit Akun Guru"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGuru(guru.id, guru.nama)}
                                className="p-1 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus Akun Guru"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TAB: TUGAS MENGAJAR (ADMIN CONFIG / GURU VIEW) */}
      {/* ============================================================ */}
      {activeTab === 'mengajar' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>
                  {isAdmin
                    ? 'Penugasan Mengajar & Jadwal Pengampu Mapel'
                    : `Tugas Mengajar: ${activeGuru.nama}`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Atur rombongan belajar (kelas) dan mata pelajaran yang diampu oleh setiap ustadz/ustadzah.'
                  : 'Daftar kelas dan mata pelajaran yang Anda ampu pada semester ini.'}
              </p>
            </div>

            {!isAdmin && (
              <button
                onClick={() => setActiveTab('input_nilai')}
                className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Edit2 className="w-4 h-4" />
                <span>Buka Lembar Input Nilai</span>
              </button>
            )}
          </div>

          {/* Grid of Teachers / My Classes */}
          {isAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAsatidz.map((guru) => {
                const assignedMapel = allMapel.filter((m) =>
                  guru.mataPelajaranIds?.includes(m.id)
                );
                const assignedKelas = allKelas.filter((k) =>
                  guru.kelasIds?.includes(k.id)
                );

                return (
                  <div
                    key={guru.id}
                    className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          {guru.nip || 'Guru'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {guru.jtm || 4} Jam / Minggu
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{guru.nama}</h4>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        {guru.pendidikan || 'Pendidikan Islam'}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Mata Pelajaran Diampu:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignedMapel.length > 0 ? (
                              assignedMapel.map((m) => (
                                <span
                                  key={m.id}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md"
                                >
                                  {m.nama}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">Belum diatur</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Kelas Diampu:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignedKelas.length > 0 ? (
                              assignedKelas.map((k) => (
                                <span
                                  key={k.id}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold rounded-md"
                                >
                                  {k.nama}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">Belum diatur</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Wali: <strong>{guru.waliKelas || '-'}</strong>
                      </span>
                      <button
                        onClick={() => handleOpenEditGuru(guru)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Atur Tugas</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // For Asatidz: Card view matching Image 2
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allKelas.map((kelas) => {
                const santriInKelas = allSantri.filter(
                  (s) => s.kelasId === kelas.id && s.status === 'Aktif'
                );
                const teacherGrades = allNilai.filter(
                  (n) =>
                    n.termId === currentTerm.id &&
                    n.kelasId === kelas.id &&
                    n.asatidzId === activeGuru.id
                );

                return (
                  <div
                    key={kelas.id}
                    className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-900">{kelas.nama}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                          {santriInKelas.length} Santri
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mb-3">
                        Tingkat: {kelas.tingkat} • Wali Kelas: {kelas.waliKelas || '-'}
                      </p>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Nilai Terisi:</span>
                          <strong className="text-slate-900">{teacherGrades.length} Santri</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Status:</span>
                          <span
                            className={`font-bold ${
                              teacherGrades.length >= santriInKelas.length && santriInKelas.length > 0
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {teacherGrades.length >= santriInKelas.length && santriInKelas.length > 0
                              ? 'Lengkap'
                              : 'Sebagian / Belum'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedKelasId(kelas.id);
                          setActiveTab('input_nilai');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Input Nilai Kelas Ini</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TAB: INPUT NILAI UJIAN SANTRI (FOR ASATIDZ) */}
      {/* ============================================================ */}
      {activeTab === 'input_nilai' && (
        <div className="space-y-4">
          
          {/* Class & Subject Selector */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Pilih Kelas / Halaqah
                </label>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {allKelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({k.tingkat})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Pilih Mata Pelajaran
                </label>
                <select
                  value={selectedMapelId}
                  onChange={(e) => setSelectedMapelId(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {allMapel.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.kategori})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  exportClassGradesToExcel(
                    activeKelas?.nama || 'Kelas',
                    activeMapel?.nama || 'Mapel',
                    activeGuru.nama,
                    classSantri,
                    draftScores
                  )
                }
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Format Excel</span>
              </button>

              <button
                id="btn-simpan-nilai-batch"
                onClick={handleSaveGrades}
                className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Semua Nilai</span>
              </button>
            </div>
          </div>

          {/* Success Notice */}
          {saveSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* Score Input Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">NISN / NIS</th>
                    <th className="py-3 px-3">Nama Lengkap Santri</th>
                    <th className="py-3 px-3 text-center w-24">Harian (30%)</th>
                    <th className="py-3 px-3 text-center w-24">Lisan (30%)</th>
                    <th className="py-3 px-3 text-center w-24">Tulis (40%)</th>
                    <th className="py-3 px-3 text-center w-20">Nilai Akhir</th>
                    <th className="py-3 px-3 text-center">Predikat</th>
                    <th className="py-3 px-3">Catatan / Evaluasi Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classSantri.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Belum ada santri terdaftar pada kelas {activeKelas?.nama || ''}.
                      </td>
                    </tr>
                  ) : (
                    classSantri.map((santri, idx) => {
                      const draft = draftScores[santri.id] || {
                        harian: 80,
                        lisan: 80,
                        tulis: 80,
                        catatan: '',
                      };
                      const finalScore = calculateFinal(draft.harian, draft.lisan, draft.tulis);
                      const { predikat, badgeColor } = getPredikat(finalScore);

                      return (
                        <tr key={santri.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {santri.nis || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {santri.nama}
                          </td>
                          
                          {/* Harian */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={draft.harian}
                              onChange={(e) =>
                                handleScoreChange(santri.id, 'harian', e.target.value)
                              }
                              className="w-16 text-center font-bold text-xs py-1 px-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>

                          {/* Lisan */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={draft.lisan}
                              onChange={(e) =>
                                handleScoreChange(santri.id, 'lisan', e.target.value)
                              }
                              className="w-16 text-center font-bold text-xs py-1 px-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>

                          {/* Tulis */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={draft.tulis}
                              onChange={(e) =>
                                handleScoreChange(santri.id, 'tulis', e.target.value)
                              }
                              className="w-16 text-center font-bold text-xs py-1 px-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>

                          {/* Final Score */}
                          <td className="py-2.5 px-3 text-center font-extrabold text-sm text-emerald-800">
                            {finalScore}
                          </td>

                          {/* Predikat */}
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}
                            >
                              {predikat}
                            </span>
                          </td>

                          {/* Catatan */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={draft.catatan}
                              onChange={(e) =>
                                handleScoreChange(santri.id, 'catatan', e.target.value)
                              }
                              placeholder="Catatan kemajuan..."
                              className="w-full text-xs py-1 px-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT AKUN GURU (ADMIN ONLY) */}
      {/* ============================================================ */}
      {guruModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{editingGuru ? 'Edit Akun Asatidz / Guru' : 'Tambah Akun Asatidz Baru'}</span>
              </h4>
              <button
                onClick={() => setGuruModalOpen(false)}
                className="text-emerald-200 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuruSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK / NUPTK / NIP
                  </label>
                  <input
                    type="text"
                    value={guruForm.nip}
                    onChange={(e) => setGuruForm({ ...guruForm, nip: e.target.value })}
                    placeholder="Contoh: 3201123456780001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin (L/P)
                  </label>
                  <select
                    value={guruForm.gender}
                    onChange={(e) => setGuruForm({ ...guruForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="L">L (Laki-laki / Ustadz)</option>
                    <option value="P">P (Perempuan / Ustadzah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Guru / Asatidz
                </label>
                <input
                  type="text"
                  value={guruForm.nama}
                  onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
                  placeholder="Contoh: Ust. Syahrul Ramadhan, S.Pd.I."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tempat, Tanggal Lahir (TTL)
                </label>
                <input
                  type="text"
                  value={guruForm.ttl}
                  onChange={(e) => setGuruForm({ ...guruForm, ttl: e.target.value })}
                  placeholder="Contoh: RANTAU EMBACANG, 14 Agustus 1985"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pendidikan Terakhir
                  </label>
                  <input
                    type="text"
                    value={guruForm.pendidikan}
                    onChange={(e) => setGuruForm({ ...guruForm, pendidikan: e.target.value })}
                    placeholder="S1 Pendidikan Islam"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password Akun Log In
                  </label>
                  <input
                    type="text"
                    value={guruForm.password}
                    onChange={(e) => setGuruForm({ ...guruForm, password: e.target.value })}
                    placeholder="guru123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amanah Wali Kelas
                  </label>
                  <select
                    value={guruForm.waliKelas}
                    onChange={(e) => setGuruForm({ ...guruForm, waliKelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="-">- Bukan Wali Kelas -</option>
                    {allKelas.map((k) => (
                      <option key={k.id} value={k.nama}>
                        Wali Kelas {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    JTM (Jam Tatap Muka)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={guruForm.jtm}
                    onChange={(e) => setGuruForm({ ...guruForm, jtm: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Mapel Checkboxes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mata Pelajaran yang Diampu
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  {allMapel.map((mapel) => {
                    const isChecked = guruForm.mataPelajaranIds.includes(mapel.id);
                    return (
                      <label
                        key={mapel.id}
                        className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGuruForm({
                                ...guruForm,
                                mataPelajaranIds: [...guruForm.mataPelajaranIds, mapel.id],
                              });
                            } else {
                              setGuruForm({
                                ...guruForm,
                                mataPelajaranIds: guruForm.mataPelajaranIds.filter((id) => id !== mapel.id),
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <span className="truncate">{mapel.nama}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Kelas Checkboxes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kelas / Halaqah yang Diampu
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-28 overflow-y-auto">
                  {allKelas.map((kelas) => {
                    const isChecked = guruForm.kelasIds.includes(kelas.id);
                    return (
                      <label
                        key={kelas.id}
                        className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGuruForm({
                                ...guruForm,
                                kelasIds: [...guruForm.kelasIds, kelas.id],
                              });
                            } else {
                              setGuruForm({
                                ...guruForm,
                                kelasIds: guruForm.kelasIds.filter((id) => id !== kelas.id),
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <span>{kelas.nama}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuruModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Akun Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
