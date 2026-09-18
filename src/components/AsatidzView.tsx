import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  ArrowRight,
  Calculator,
  RotateCcw,
  Sparkles,
  Award,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Shield,
  Search,
} from 'lucide-react';

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
  onSelectActiveAsatidz: (guru: Asatidz) => void;
  onNavigateToRekap: () => void;
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
}) => {
  const isAdmin = currentRole === 'admin';

  // For Admin: can switch between grading input and asatidz master data management
  const [adminSubTab, setAdminSubTab] = useState<'input' | 'manage'>('input');

  // Selected Teacher, Class, Subject for Grading
  const [selectedGuruId, setSelectedGuruId] = useState<string>(
    currentActiveAsatidz ? currentActiveAsatidz.id : allAsatidz[0]?.id || ''
  );
  const [selectedKelasId, setSelectedKelasId] = useState<string>(allKelas[0]?.id || '');
  const [selectedMapelId, setSelectedMapelId] = useState<string>(allMapel[0]?.id || '');

  // Local draft scores: santriId -> { harian, lisan, tulis, catatan }
  const [draftScores, setDraftScores] = useState<
    Record<string, { harian: number; lisan: number; tulis: number; catatan: string }>
  >({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // --- Admin Asatidz Management State ---
  const [asatidzModal, setAsatidzModal] = useState(false);
  const [editingAsatidz, setEditingAsatidz] = useState<Asatidz | null>(null);
  const [asatidzSearch, setAsatidzSearch] = useState('');
  const [asatidzForm, setAsatidzForm] = useState<{
    nip: string;
    nama: string;
    gelar: string;
    kontak: string;
    mataPelajaranIds: string[];
    kelasIds: string[];
    status: 'Aktif' | 'Cuti';
  }>({
    nip: '',
    nama: '',
    gelar: '',
    kontak: '',
    mataPelajaranIds: [],
    kelasIds: [],
    status: 'Aktif',
  });

  // Sync selected guru when currentActiveAsatidz changes
  useEffect(() => {
    if (currentActiveAsatidz && currentActiveAsatidz.id !== selectedGuruId) {
      setSelectedGuruId(currentActiveAsatidz.id);
    }
  }, [currentActiveAsatidz]);

  const activeGuru = allAsatidz.find((g) => g.id === selectedGuruId) || allAsatidz[0];

  // If guru has specific classes or mapel, align defaults
  useEffect(() => {
    if (activeGuru) {
      if (activeGuru.kelasIds.length > 0 && !activeGuru.kelasIds.includes(selectedKelasId)) {
        setSelectedKelasId(activeGuru.kelasIds[0]);
      }
      if (activeGuru.mataPelajaranIds.length > 0 && !activeGuru.mataPelajaranIds.includes(selectedMapelId)) {
        setSelectedMapelId(activeGuru.mataPelajaranIds[0]);
      }
    }
  }, [selectedGuruId]);

  // Load existing grades into draftScores when selectedGuruId, selectedKelasId, or selectedMapelId changes
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
  }, [selectedGuruId, selectedKelasId, selectedMapelId, currentTerm.id]);

  const activeKelas = allKelas.find((k) => k.id === selectedKelasId);
  const activeMapel = allMapel.find((m) => m.id === selectedMapelId);
  const classSantri = allSantri.filter((s) => s.kelasId === selectedKelasId && s.status === 'Aktif');

  // Calculate final score: 30% Harian + 30% Lisan + 40% Tulis
  const calculateFinal = (harian: number, lisan: number, tulis: number): number => {
    return Math.round(harian * 0.3 + lisan * 0.3 + tulis * 0.4);
  };

  const calculatePredikat = (finalScore: number): string => {
    if (finalScore >= 90) return 'Mumtaz (A)';
    if (finalScore >= 80) return 'Jayyid Jiddan (B+)';
    if (finalScore >= 70) return 'Jayyid (B)';
    if (finalScore >= 60) return 'Maqbul (C)';
    return 'Rasib (D)';
  };

  const handleScoreChange = (
    santriId: string,
    field: 'harian' | 'lisan' | 'tulis',
    value: string
  ) => {
    const num = Math.min(100, Math.max(0, parseInt(value) || 0));
    setDraftScores((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        [field]: num,
      },
    }));
  };

  const handleCatatanChange = (santriId: string, text: string) => {
    setDraftScores((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        catatan: text,
      },
    }));
  };

  const handleQuickFillAll = (val: number) => {
    const updated: Record<string, { harian: number; lisan: number; tulis: number; catatan: string }> = {};
    classSantri.forEach((s) => {
      updated[s.id] = {
        harian: val,
        lisan: val,
        tulis: val,
        catatan: draftScores[s.id]?.catatan || '',
      };
    });
    setDraftScores(updated);
  };

  const handleSaveAllScores = () => {
    const results: NilaiSantri[] = classSantri.map((santri) => {
      const scores = draftScores[santri.id] || { harian: 75, lisan: 75, tulis: 75, catatan: '' };
      const nilaiAkhir = calculateFinal(scores.harian, scores.lisan, scores.tulis);
      const predikat = calculatePredikat(nilaiAkhir);

      return {
        id: `nil-${currentTerm.id}-${santri.id}-${selectedMapelId}`,
        termId: currentTerm.id,
        santriId: santri.id,
        kelasId: selectedKelasId,
        mapelId: selectedMapelId,
        asatidzId: selectedGuruId,
        nilaiHarian: scores.harian,
        nilaiLisan: scores.lisan,
        nilaiTulis: scores.tulis,
        nilaiAkhir,
        predikat,
        catatan: scores.catatan,
        tanggalInput: new Date().toISOString().split('T')[0],
      };
    });

    onSaveNilaiBatch(results);
    setSaveSuccessNotice(
      `Alhamdulillah! Nilai ujian untuk ${classSantri.length} santri di ${activeKelas?.nama} (${activeMapel?.nama}) berhasil disimpan dan otomatis masuk ke Rekapitulasi.`
    );
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  // --- Asatidz Add / Edit Handlers (Admin Only) ---
  const handleOpenAddAsatidz = () => {
    setEditingAsatidz(null);
    setAsatidzForm({
      nip: `G-${allAsatidz.length + 101}`,
      nama: '',
      gelar: '',
      kontak: '08',
      mataPelajaranIds: allMapel.slice(0, 2).map((m) => m.id),
      kelasIds: allKelas.slice(0, 2).map((k) => k.id),
      status: 'Aktif',
    });
    setAsatidzModal(true);
  };

  const handleOpenEditAsatidz = (guru: Asatidz) => {
    setEditingAsatidz(guru);
    setAsatidzForm({
      nip: guru.nip || '',
      nama: guru.nama,
      gelar: guru.gelar || '',
      kontak: guru.kontak || guru.noHp || '',
      mataPelajaranIds: guru.mataPelajaranIds || [],
      kelasIds: guru.kelasIds || [],
      status: guru.status === 'Cuti' ? 'Cuti' : 'Aktif',
    });
    setAsatidzModal(true);
  };

  const handleSaveAsatidzForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsatidz) {
      const updated = allAsatidz.map((g) =>
        g.id === editingAsatidz.id
          ? {
              ...g,
              ...asatidzForm,
            }
          : g
      );
      onUpdateAsatidz(updated);
    } else {
      const newGuru: Asatidz = {
        id: `ast-${Date.now()}`,
        ...asatidzForm,
      };
      onUpdateAsatidz([...allAsatidz, newGuru]);
    }
    setAsatidzModal(false);
  };

  const handleDeleteAsatidz = (id: string) => {
    if (confirm('Hapus data asatidz ini dari sistem?')) {
      onUpdateAsatidz(allAsatidz.filter((g) => g.id !== id));
    }
  };

  const toggleMapelSelection = (id: string) => {
    setAsatidzForm((prev) => {
      const exists = prev.mataPelajaranIds.includes(id);
      return {
        ...prev,
        mataPelajaranIds: exists
          ? prev.mataPelajaranIds.filter((item) => item !== id)
          : [...prev.mataPelajaranIds, id],
      };
    });
  };

  const toggleKelasSelection = (id: string) => {
    setAsatidzForm((prev) => {
      const exists = prev.kelasIds.includes(id);
      return {
        ...prev,
        kelasIds: exists
          ? prev.kelasIds.filter((item) => item !== id)
          : [...prev.kelasIds, id],
      };
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Tabs: If Admin, can switch between Input Nilai and Kelola Asatidz */}
      {isAdmin && (
        <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex gap-2">
            <button
              id="admin-tab-input-nilai"
              onClick={() => setAdminSubTab('input')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                adminSubTab === 'input'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Input Nilai Ujian Santri</span>
            </button>

            <button
              id="admin-tab-manage-asatidz"
              onClick={() => setAdminSubTab('manage')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                adminSubTab === 'manage'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Kelola Data Asatidz ({allAsatidz.length})</span>
            </button>
          </div>

          <button
            id="btn-tambah-asatidz"
            onClick={handleOpenAddAsatidz}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Asatidz Baru</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 1: MANAGE ASATIDZ DATA (ADMIN ONLY) */}
      {/* ============================================================ */}
      {isAdmin && adminSubTab === 'manage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>Daftar Guru &amp; Asatidz Pengampu Imtihan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin dapat menambah guru baru, mengatur mapel yang diampu, dan menentukan hak input nilai per kelas.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={asatidzSearch}
                onChange={(e) => setAsatidzSearch(e.target.value)}
                placeholder="Cari nama atau NIP guru..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Asatidz Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAsatidz
              .filter(
                (g) =>
                  g.nama.toLowerCase().includes(asatidzSearch.toLowerCase()) ||
                  (g.nip && g.nip.toLowerCase().includes(asatidzSearch.toLowerCase()))
              )
              .map((guru) => {
                const taughtMapels = allMapel.filter((m) => guru.mataPelajaranIds.includes(m.id));
                const taughtClasses = allKelas.filter((k) => guru.kelasIds.includes(k.id));

                return (
                  <div
                    key={guru.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {guru.nip}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            guru.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {guru.status}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {guru.nama} {guru.gelar || ''}
                      </h4>

                      {guru.kontak && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{guru.kontak}</span>
                        </p>
                      )}

                      {/* Taught Subjects */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Mapel yang Diampu:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {taughtMapels.length > 0 ? (
                              taughtMapels.map((m) => (
                                <span
                                  key={m.id}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                                >
                                  {m.nama}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum dipilih</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Kelas yang Diajar:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {taughtClasses.length > 0 ? (
                              taughtClasses.map((k) => (
                                <span
                                  key={k.id}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                                >
                                  {k.nama}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Semua Kelas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedGuruId(guru.id);
                          onSelectActiveAsatidz(guru);
                          setAdminSubTab('input');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                      >
                        <span>Input Nilai Guru Ini</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditAsatidz(guru)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Edit Asatidz"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAsatidz(guru.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Asatidz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: GRADING INPUT FORM (Visible to Asatidz, or Admin when on 'input' subtab) */}
      {/* ============================================================ */}
      {(!isAdmin || adminSubTab === 'input') && (
        <>
          {/* 1. Asatidz & Class Selection Portal Header */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold mb-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>Lembar Penginputan Nilai Ujian Santri</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Formulir Nilai Imtihan Niha&apos;i — {currentTerm.label}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Pilih nama guru pengampu, tentukan kelas, dan pilih mata pelajaran. Nilai yang Anda simpan akan langsung tercatat dan dapat diunduh per guru dalam format Excel.
              </p>
            </div>

            {/* Success Alert */}
            {saveSuccessNotice && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">{saveSuccessNotice}</span>
                </div>
                <button
                  onClick={onNavigateToRekap}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs whitespace-nowrap shadow-xs ml-3"
                >
                  <span>Buka Halaman Rekap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 3 Step Selectors: Guru -> Kelas -> Mata Pelajaran */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              
              {/* 1. Pilih Nama Guru (Asatidz) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>1. Nama Asatidz / Guru Pengampu</span>
                </label>
                <select
                  id="select-guru"
                  value={selectedGuruId}
                  onChange={(e) => {
                    setSelectedGuruId(e.target.value);
                    const g = allAsatidz.find((item) => item.id === e.target.value);
                    if (g) onSelectActiveAsatidz(g);
                  }}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                >
                  {allAsatidz.map((guru) => (
                    <option key={guru.id} value={guru.id}>
                      {guru.nama} {guru.gelar || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Pilih Kelas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>2. Pilih Kelas yang Diisi</span>
                </label>
                <select
                  id="select-kelas"
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                >
                  {allKelas.map((kelas) => (
                    <option key={kelas.id} value={kelas.id}>
                      {kelas.nama} ({allSantri.filter((s) => s.kelasId === kelas.id).length} Santri)
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Pilih Mata Pelajaran */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>3. Pilih Mata Pelajaran</span>
                </label>
                <select
                  id="select-mapel"
                  value={selectedMapelId}
                  onChange={(e) => setSelectedMapelId(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                >
                  {allMapel.map((mapel) => (
                    <option key={mapel.id} value={mapel.id}>
                      [{mapel.kode}] {mapel.nama} (KKM: {mapel.kkm})
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* 2. Table of Santri to Grade */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            {/* Header Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {classSantri.length}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Daftar Santri: {activeKelas?.nama || 'Kelas'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Mata Pelajaran: <strong>{activeMapel?.nama}</strong> • Bobot: 30% Harian + 30% Lisan + 40% Tulis
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center flex-wrap gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Isi Cepat:</span>
                <button
                  onClick={() => handleQuickFillAll(85)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 text-xs font-semibold shadow-2xs transition"
                >
                  Set 85 (Baik)
                </button>
                <button
                  onClick={() => handleQuickFillAll(90)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 text-xs font-semibold shadow-2xs transition"
                >
                  Set 90 (Mumtaz)
                </button>
                <button
                  onClick={() => handleQuickFillAll(75)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 text-xs font-semibold shadow-2xs transition"
                >
                  Set 75 (KKM)
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 uppercase font-extrabold tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3 w-28">NIS</th>
                    <th className="py-3 px-4 min-w-[180px]">Nama Santri</th>
                    <th className="py-3 px-3 w-24 text-center">Harian (30%)</th>
                    <th className="py-3 px-3 w-24 text-center">Lisan (30%)</th>
                    <th className="py-3 px-3 w-24 text-center">Tulis (40%)</th>
                    <th className="py-3 px-3 w-20 text-center">Nilai Akhir</th>
                    <th className="py-3 px-3 w-28 text-center">Predikat</th>
                    <th className="py-3 px-4 min-w-[200px]">Catatan Asatidz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classSantri.length > 0 ? (
                    classSantri.map((santri, idx) => {
                      const scores = draftScores[santri.id] || { harian: 75, lisan: 75, tulis: 75, catatan: '' };
                      const finalScore = calculateFinal(scores.harian, scores.lisan, scores.tulis);
                      const predikat = calculatePredikat(finalScore);
                      const isPassing = finalScore >= (activeMapel?.kkm || 75);

                      return (
                        <tr key={santri.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {santri.nis}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">
                            {santri.nama}
                            <span className="block text-[10px] font-normal text-slate-400">
                              Halaqah: {santri.halaqah || '-'}
                            </span>
                          </td>

                          {/* Nilai Harian */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={scores.harian}
                              onChange={(e) => handleScoreChange(santri.id, 'harian', e.target.value)}
                              className="w-16 text-center py-1.5 px-1 font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs"
                            />
                          </td>

                          {/* Nilai Lisan */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={scores.lisan}
                              onChange={(e) => handleScoreChange(santri.id, 'lisan', e.target.value)}
                              className="w-16 text-center py-1.5 px-1 font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs"
                            />
                          </td>

                          {/* Nilai Tulis */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={scores.tulis}
                              onChange={(e) => handleScoreChange(santri.id, 'tulis', e.target.value)}
                              className="w-16 text-center py-1.5 px-1 font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs"
                            />
                          </td>

                          {/* Nilai Akhir (Auto Calculated) */}
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block font-extrabold text-xs px-2.5 py-1 rounded-lg ${
                                isPassing
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-900 border border-rose-200'
                              }`}
                            >
                              {finalScore}
                            </span>
                          </td>

                          {/* Predikat */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] font-bold text-slate-700">
                              {predikat}
                            </span>
                          </td>

                          {/* Catatan Asatidz */}
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={scores.catatan}
                              onChange={(e) => handleCatatanChange(santri.id, e.target.value)}
                              placeholder="Catatan bimbingan..."
                              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                        Tidak ada santri aktif di kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                <span>Guru: <strong>{activeGuru?.nama}</strong></span> • 
                <span className="ml-2">Kelas: <strong>{activeKelas?.nama}</strong></span> • 
                <span className="ml-2">Mapel: <strong>{activeMapel?.nama}</strong></span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onNavigateToRekap}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition text-center"
                >
                  Ke Rekap Excel
                </button>

                <button
                  id="btn-simpan-nilai-asatidz"
                  onClick={handleSaveAllScores}
                  disabled={classSantri.length === 0}
                  className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Nilai Ujian Santri</span>
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT ASATIDZ (ADMIN ONLY) */}
      {/* ============================================================ */}
      {asatidzModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                {editingAsatidz ? 'Edit Data Asatidz' : 'Tambah Asatidz Baru'}
              </h4>
              <button
                onClick={() => setAsatidzModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAsatidzForm} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / Kode Guru
                  </label>
                  <input
                    type="text"
                    value={asatidzForm.nip}
                    onChange={(e) => setAsatidzForm({ ...asatidzForm, nip: e.target.value })}
                    placeholder="Contoh: G-105"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={asatidzForm.status}
                    onChange={(e) => setAsatidzForm({ ...asatidzForm, status: e.target.value as 'Aktif' | 'Cuti' })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Asatidz / Ustadz
                </label>
                <input
                  type="text"
                  value={asatidzForm.nama}
                  onChange={(e) => setAsatidzForm({ ...asatidzForm, nama: e.target.value })}
                  placeholder="Contoh: Ust. Ahmad Fauzi"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gelar Akademik / Kepesantrenan
                  </label>
                  <input
                    type="text"
                    value={asatidzForm.gelar}
                    onChange={(e) => setAsatidzForm({ ...asatidzForm, gelar: e.target.value })}
                    placeholder="Contoh: Lc., Al-Hafidz"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / Kontak
                  </label>
                  <input
                    type="text"
                    value={asatidzForm.kontak}
                    onChange={(e) => setAsatidzForm({ ...asatidzForm, kontak: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Mapel Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran yang Diampu:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                  {allMapel.map((m) => {
                    const isChecked = asatidzForm.mataPelajaranIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMapelSelection(m.id)}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="truncate">{m.nama}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Kelas Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kelas yang Diajar:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                  {allKelas.map((k) => {
                    const isChecked = asatidzForm.kelasIds.includes(k.id);
                    return (
                      <label
                        key={k.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleKelasSelection(k.id)}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="truncate">{k.nama}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAsatidzModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
                >
                  Simpan Data Asatidz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
