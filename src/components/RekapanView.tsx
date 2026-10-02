import React, { useState, useRef, useMemo } from 'react';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PesantrenProfile,
  RoleType,
  Santri,
  TugasMengajarItem,
} from '../types';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Eye,
  Printer,
  GraduationCap,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  exportMasterRecapToExcel,
  exportTeacherRecapToExcel,
  exportRaportClassToExcel,
  parseRaportFormatFromExcel,
  RaportConfig,
  DEFAULT_RAPORT_CONFIG,
  getPredikatBilingual,
} from '../utils/excelExport';
import { ConfirmModal } from './ConfirmModal';
import { RaportSheetCard } from './RaportSheetCard';
import { RaportConfigModal } from './RaportConfigModal';
import { RaportLayoutEditorPanel } from './RaportLayoutEditorPanel';
import {
  doesGradeMatchMapel,
  doesTugasBelongToAsatidz,
  doesTugasMatchKelas,
  getSantriForKelas,
} from '../utils/dataSyncHelpers';

interface RekapanViewProps {
  currentTerm: AcademicTerm;
  allNilai: NilaiSantri[];
  allSantri: Santri[];
  allKelas: Kelas[];
  allMapel: MataPelajaran[];
  allAsatidz: Asatidz[];
  allTugasMengajar?: TugasMengajarItem[];
  profile: PesantrenProfile;
  currentRole: RoleType;
  onSaveNilaiBatch?: (savedNilai: NilaiSantri[]) => void;
  onDeleteNilai?: (id: string) => void;
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const RekapanView: React.FC<RekapanViewProps> = ({
  currentTerm,
  allNilai,
  allSantri,
  allKelas,
  allMapel,
  allAsatidz,
  allTugasMengajar = [],
  profile,
  currentRole,
  onSaveNilaiBatch,
  onDeleteNilai,
  activeSubTab = 'rekap_guru',
  onSelectSubTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuruPreview, setSelectedGuruPreview] = useState<Asatidz | null>(null);
  const [previewTabKelasId, setPreviewTabKelasId] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedClassForPrint, setSelectedClassForPrint] = useState<string>(allKelas[0]?.id || '');
  const [showRaportConfigModal, setShowRaportConfigModal] = useState(false);
  const [autoFillPreviewGrades, setAutoFillPreviewGrades] = useState(true);
  const [isLiveEditMode, setIsLiveEditMode] = useState(false);
  const [cetakPreviewFormat, setCetakPreviewFormat] = useState<'paper' | 'excel_grid'>('paper');
  const [excelStatusMessage, setExcelStatusMessage] = useState<string | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);

  const [raportConfig, setRaportConfig] = useState<RaportConfig>(() => {
    try {
      const saved = localStorage.getItem('alhusna_raport_config_v2');
      if (saved) {
        return { ...DEFAULT_RAPORT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore parse error
    }
    return DEFAULT_RAPORT_CONFIG;
  });

  const handleUpdateRaportConfig = (newCfg: RaportConfig) => {
    setRaportConfig(newCfg);
    try {
      localStorage.setItem('alhusna_raport_config_v2', JSON.stringify(newCfg));
    } catch {
      // ignore storage error
    }
  };

  const classForPrintObj = allKelas.find((k) => k.id === selectedClassForPrint) || allKelas[0];
  const santriInClassForPrint = getSantriForKelas(classForPrintObj, allSantri);

  // Synchronize subjects for the active class from Atur Tugas Mengajar + allMapel
  const effectiveMapelForClass = useMemo(() => {
    if (!classForPrintObj) return allMapel;
    const tugasForClass = allTugasMengajar.filter((t) =>
      doesTugasMatchKelas(t, classForPrintObj, allKelas)
    );
    if (tugasForClass.length === 0) return allMapel;

    const syncedList: MataPelajaran[] = tugasForClass.map((t, idx) => {
      const foundInMaster = allMapel.find(
        (m) => m.nama.trim().toLowerCase() === t.namaMapel.trim().toLowerCase()
      );
      if (foundInMaster) {
        return { ...foundInMaster, kkm: t.kkm || foundInMaster.kkm || 75 };
      }
      return {
        id: t.namaMapel,
        kode: `MP-${idx + 1}`,
        nama: t.namaMapel,
        kategori: 'Diniyyah' as const,
        kkm: t.kkm || 75,
      };
    });
    return syncedList;
  }, [classForPrintObj, allTugasMengajar, allMapel]);

  // Filter grades for active semester term
  const termNilai = allNilai.filter((n) => n.termId === currentTerm.id);

  // Calculate class rankings for print view
  const classRankingsMap: Record<string, number> = {};
  santriInClassForPrint
    .map((s, sIdx) => {
      const sGrades = termNilai.filter((n) => n.santriId === s.id);
      const sum =
        sGrades.length > 0
          ? sGrades.reduce((acc, g) => acc + g.nilaiAkhir, 0)
          : 80 * allMapel.length - sIdx;
      return { id: s.id, sum };
    })
    .sort((a, b) => b.sum - a.sum)
    .forEach((item, idx) => {
      classRankingsMap[item.id] = idx + 1;
    });

  const handleExportRaportExcel = () => {
    if (!classForPrintObj) return;
    exportRaportClassToExcel(
      classForPrintObj,
      currentTerm,
      santriInClassForPrint,
      allNilai,
      effectiveMapelForClass,
      profile,
      raportConfig,
      autoFillPreviewGrades
    );
    setExcelStatusMessage(
      `File Excel Raport Kelas ${classForPrintObj.nama} berhasil diunduh (100% sesuai tata letak Preview)! Anda dapat mengedit nilai maupun tata letak di Excel lalu mengunggahnya kembali.`
    );
  };

  const handleUploadRaportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseRaportFormatFromExcel(
      file,
      raportConfig,
      allSantri,
      effectiveMapelForClass,
      currentTerm.id,
      classForPrintObj?.id || selectedClassForPrint
    );
    if (result.success) {
      handleUpdateRaportConfig(result.updatedConfig);
      if (result.updatedGrades.length > 0 && onSaveNilaiBatch) {
        onSaveNilaiBatch(result.updatedGrades);
      }
    }
    setExcelStatusMessage(result.message);
    if (excelFileInputRef.current) {
      excelFileInputRef.current.value = '';
    }
  };

  const handleQuickUpdateGrade = (santri: Santri, mapel: MataPelajaran, newAkhir: number) => {
    if (!onSaveNilaiBatch) return;
    const clamped = Math.max(0, Math.min(100, newAkhir));
    const existing = termNilai.find(
      (g) =>
        g.santriId === santri.id &&
        (doesGradeMatchMapel(g.mapelId, mapel.id, allMapel) ||
          doesGradeMatchMapel(g.mapelId, mapel.nama, allMapel))
    );
    const pred = getPredikatBilingual(clamped);
    const updated: NilaiSantri = existing
      ? {
          ...existing,
          nilaiAkhir: clamped,
          nilaiTulis: clamped,
          predikat: pred.indo,
        }
      : {
          id: `nil-${currentTerm.id}-${santri.kelasId}-${santri.id}-${mapel.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
          termId: currentTerm.id,
          santriId: santri.id,
          kelasId: santri.kelasId,
          mapelId: mapel.id,
          asatidzId: allAsatidz[0]?.id || 'ust-1',
          nilaiHarian: clamped,
          nilaiLisan: clamped,
          nilaiTulis: clamped,
          nilaiAkhir: clamped,
          predikat: pred.indo,
          tanggalInput: new Date().toISOString().slice(0, 10),
        };
    onSaveNilaiBatch([updated]);
  };

  // Teachers who have input grades or are assigned
  const teachersWithStats = allAsatidz.map((guru) => {
    const assignedTasks = allTugasMengajar.filter((t) =>
      doesTugasBelongToAsatidz(t, guru, allAsatidz)
    );
    const teacherGrades = termNilai.filter(
      (n) =>
        n.asatidzId === guru.id ||
        assignedTasks.some((t) => doesGradeMatchMapel(n.mapelId, t.namaMapel, allMapel))
    );
    const classesTaught = allKelas.filter(
      (k) =>
        teacherGrades.some((g) => g.kelasId === k.id) ||
        guru.kelasIds.includes(k.id) ||
        assignedTasks.some((t) => doesTugasMatchKelas(t, k, allKelas))
    );
    const classesInputted = allKelas.filter((k) =>
      teacherGrades.some((g) => g.kelasId === k.id)
    );
    const totalGraded = teacherGrades.length;
    const avgScore =
      totalGraded > 0
        ? (teacherGrades.reduce((sum, g) => sum + g.nilaiAkhir, 0) / totalGraded).toFixed(1)
        : '-';

    const mapelNamesList =
      assignedTasks.length > 0
        ? Array.from(new Set(assignedTasks.map((t) => t.namaMapel)))
        : guru.mataPelajaranIds
            .map((id) => allMapel.find((m) => m.id === id)?.nama)
            .filter(Boolean) as string[];

    return {
      guru,
      assignedTasks,
      classesTaught,
      classesInputted,
      totalGraded,
      avgScore,
      teacherGrades,
      mapelNamesList,
    };
  });

  const filteredTeachers = teachersWithStats.filter(
    (item) =>
      item.guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mapelNamesList.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Download 1 Excel file containing all classes for 1 teacher
  const handleDownloadTeacherExcel = (guru: Asatidz) => {
    exportTeacherRecapToExcel(
      guru,
      currentTerm,
      allNilai,
      allSantri,
      allKelas,
      allMapel,
      profile
    );
  };

  // Download Master Excel for all Pesantren
  const handleDownloadMasterExcel = () => {
    exportMasterRecapToExcel(
      currentTerm,
      allNilai,
      allSantri,
      allKelas,
      allMapel,
      allAsatidz,
      profile
    );
  };

  // Open Preview modal
  const handleOpenPreview = (guru: Asatidz) => {
    setSelectedGuruPreview(guru);
    const grades = termNilai.filter((n) => n.asatidzId === guru.id);
    const firstClassId = grades[0]?.kelasId || guru.kelasIds[0] || allKelas[0]?.id;
    setPreviewTabKelasId(firstClassId);
  };

  // Grade Edit / Delete state for Admin
  const [editingGrade, setEditingGrade] = useState<{
    grade: NilaiSantri;
    santriNama: string;
    mapelNama: string;
  } | null>(null);

  const [editGradeForm, setEditGradeForm] = useState({
    nilaiHarian: 80,
    nilaiLisan: 80,
    nilaiTulis: 80,
    catatan: '',
  });

  const handleOpenEditGrade = (grade: NilaiSantri, santriNama: string, mapelNama: string) => {
    setEditingGrade({ grade, santriNama, mapelNama });
    setEditGradeForm({
      nilaiHarian: grade.nilaiHarian,
      nilaiLisan: grade.nilaiLisan,
      nilaiTulis: grade.nilaiTulis,
      catatan: grade.catatan || '',
    });
  };

  const handleSaveEditedGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !onSaveNilaiBatch) return;

    const final =
      Math.round(
        (editGradeForm.nilaiHarian * 0.3 +
          editGradeForm.nilaiLisan * 0.3 +
          editGradeForm.nilaiTulis * 0.4) *
          10
      ) / 10;
    let predikat = 'Rosib (E)';
    if (final >= 90) predikat = 'Mumtaz (A)';
    else if (final >= 80) predikat = 'Jayyid Jiddan (B)';
    else if (final >= 70) predikat = 'Jayyid (C)';
    else if (final >= 60) predikat = 'Maqbul (D)';

    const updated: NilaiSantri = {
      ...editingGrade.grade,
      nilaiHarian: editGradeForm.nilaiHarian,
      nilaiLisan: editGradeForm.nilaiLisan,
      nilaiTulis: editGradeForm.nilaiTulis,
      nilaiAkhir: final,
      predikat,
      catatan: editGradeForm.catatan,
    };

    onSaveNilaiBatch([updated]);
    setEditingGrade(null);
  };

  // State for in-app deletion confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleDeleteGrade = (id: string, santriNama: string) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Entri Nilai',
      message: `Hapus entri nilai untuk santri "${santriNama}"? Tindakan ini akan menghapus nilai ujian dari rekapitulasi.`,
      onConfirm: () => {
        if (onDeleteNilai) {
          onDeleteNilai(id);
        }
      },
    });
  };

  const currentActiveSubTab = activeSubTab === 'cetak_rapor' || activeSubTab === 'cetak_lembar' ? 'cetak_rapor' : 'edit_rapor';

  return (
    <div className="space-y-6">
      
      {/* Hidden File Input for Excel Raport Format & Grade Import */}
      <input
        ref={excelFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleUploadRaportExcel}
        className="hidden"
      />

      {/* Subtab Navigation Switcher Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onSelectSubTab) onSelectSubTab('edit_rapor');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentActiveSubTab === 'edit_rapor'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EDIT RAPOR</span>
          </button>
          <button
            onClick={() => {
              if (onSelectSubTab) onSelectSubTab('cetak_rapor');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentActiveSubTab === 'cetak_rapor'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>CETAK RAPORT</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Periode: <strong className="text-emerald-800">{currentTerm.label}</strong>
        </div>
      </div>

      {excelStatusMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{excelStatusMessage}</span>
          </div>
          <button
            onClick={() => setExcelStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {currentActiveSubTab === 'cetak_rapor' ? (
        /* ================= CETAK RAPORT (Bilingual Pesantren + Excel Format Editor) ================= */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 no-print">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  CETAK RAPORT PESANTREN (KASYFUD DARAJAT / كشف الدرجات) &amp; INTEGRASI EXCEL
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide">
                  Cetak Raport Sekaligus 1 Kelas (PDF) &amp; Edit Format via Excel
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Format raport bilingual (Indonesia &amp; Arab) lengkap dengan nilai angka, huruf/terbilang (بالحروف), predikat (التقدير), kepribadian (السلوك), absensi, dan tanda tangan 3 pihak. Anda dapat <strong>mengunduh ke Excel (.xlsx)</strong> untuk mengedit bentuk/gaya raport di Excel maupun mengunggahnya kembali.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Pilih Kelas Santri
                  </label>
                  <select
                    value={selectedClassForPrint}
                    onChange={(e) => setSelectedClassForPrint(e.target.value)}
                    className="text-xs px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {allKelas.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama} ({getSantriForKelas(k, allSantri).length} Santri)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowRaportConfigModal(true)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Atur format, gaya tabel, bahasa Arab, kop surat & TTD"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Atur Format &amp; Gaya Raport</span>
                </button>

                <button
                  onClick={handleExportRaportExcel}
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Unduh Raport kelas ini dalam format Excel (.xlsx) yang bisa diedit bentuk & gayanya"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Unduh &amp; Edit di Excel (.xlsx)</span>
                </button>

                <button
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold border border-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Upload kembali file Excel yang sudah diedit format/gayanya"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-700" />
                  <span>Upload Format dari Excel</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Semua Raport (1 PDF)</span>
                </button>
              </div>
            </div>

            {/* Quick Format Controls Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600">Gaya Bahasa:</span>
                  <select
                    value={raportConfig.templateStyle}
                    onChange={(e) =>
                      handleUpdateRaportConfig({
                        ...raportConfig,
                        templateStyle: e.target.value as RaportConfig['templateStyle'],
                        showArabic: e.target.value !== 'nasional',
                      })
                    }
                    className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="bilingual">Bilingual (Indonesia - Arab / كشف الدرجات)</option>
                    <option value="arabic">Full Bahasa Arab (RTL)</option>
                    <option value="nasional">Bahasa Indonesia (Nasional)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600">Arah Tabel:</span>
                  <select
                    value={raportConfig.tableDirection}
                    onChange={(e) =>
                      handleUpdateRaportConfig({
                        ...raportConfig,
                        tableDirection: e.target.value as 'ltr' | 'rtl',
                      })
                    }
                    className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="ltr">Indonesia Kiri (LTR)</option>
                    <option value="rtl">Arab Kanan (RTL)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600">Tema Cetak:</span>
                  <select
                    value={raportConfig.colorTheme}
                    onChange={(e) =>
                      handleUpdateRaportConfig({
                        ...raportConfig,
                        colorTheme: e.target.value as RaportConfig['colorTheme'],
                      })
                    }
                    className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="classic_bw">Hitam Putih Resmi</option>
                    <option value="emerald">Hijau Pesantren</option>
                    <option value="gold_classic">Klasik Mu&apos;allimin</option>
                    <option value="royal_blue">Biru Akademik</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setCetakPreviewFormat('paper')}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition cursor-pointer ${
                      cetakPreviewFormat === 'paper'
                        ? 'bg-emerald-800 text-white'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Mode Kertas Cetak
                  </button>
                  <button
                    type="button"
                    onClick={() => setCetakPreviewFormat('excel_grid')}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition cursor-pointer ${
                      cetakPreviewFormat === 'excel_grid'
                        ? 'bg-emerald-800 text-white'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Mode Tabel Excel 1:1
                  </button>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoFillPreviewGrades}
                    onChange={(e) => setAutoFillPreviewGrades(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-700 rounded"
                  />
                  <span>Lengkapi Nilai Mapel Otomatis</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsLiveEditMode(!isLiveEditMode)}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer border ${
                    isLiveEditMode
                      ? 'bg-amber-500 text-slate-950 border-amber-600'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isLiveEditMode ? '✓ Mode Edit & Geser Tata Letak Aktif' : 'Edit & Geser Posisi di Kertas'}
                </button>
              </div>
            </div>
          </div>

          {/* Report Cards Preview Container (Printable) */}
          <div className="space-y-8 bg-slate-200/70 p-3 sm:p-8 rounded-2xl print:bg-white print:p-0 print:space-y-0">
            {santriInClassForPrint.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-medium no-print">
                Belum ada santri terdaftar pada kelas {classForPrintObj?.nama || ''}.
              </div>
            ) : (
              santriInClassForPrint.map((santri, sIdx) => {
                const santriGrades = termNilai.filter((n) => n.santriId === santri.id);
                const rank = classRankingsMap[santri.id] || sIdx + 1;

                return (
                  <RaportSheetCard
                    key={santri.id}
                    santri={santri}
                    santriIndex={sIdx}
                    totalSantriInClass={santriInClassForPrint.length}
                    rank={rank}
                    kelas={classForPrintObj}
                    currentTerm={currentTerm}
                    profile={profile}
                    allMapel={effectiveMapelForClass}
                    santriGrades={santriGrades}
                    config={raportConfig}
                    autoFillPreviewGrades={autoFillPreviewGrades}
                    isLiveEditMode={isLiveEditMode}
                    previewFormat={cetakPreviewFormat}
                    onQuickUpdateGrade={handleQuickUpdateGrade}
                    onUpdateConfig={handleUpdateRaportConfig}
                  />
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ================= EDIT RAPOR (Default View) ================= */
        <div className="space-y-6">
          {/* Interactive Raport Layout Editor & 1:1 Excel Preview Panel */}
          <RaportLayoutEditorPanel
            allKelas={allKelas}
            selectedClassId={selectedClassForPrint}
            onSelectClassId={setSelectedClassForPrint}
            classObj={classForPrintObj}
            santriInClass={santriInClassForPrint}
            currentTerm={currentTerm}
            profile={profile}
            effectiveMapelForClass={effectiveMapelForClass}
            termNilai={termNilai}
            classRankingsMap={classRankingsMap}
            raportConfig={raportConfig}
            onUpdateConfig={handleUpdateRaportConfig}
            autoFillPreviewGrades={autoFillPreviewGrades}
            onToggleAutoFill={setAutoFillPreviewGrades}
            onQuickUpdateGrade={handleQuickUpdateGrade}
            onExportExcel={handleExportRaportExcel}
            onTriggerUploadExcel={() => excelFileInputRef.current?.click()}
            onOpenFullConfigModal={() => setShowRaportConfigModal(true)}
          />
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold mb-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>EDIT RAPOR &amp; REKAPITULASI BERKAS NILAI</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">
                  EDIT RAPOR &amp; REKAP NILAI SANTRI PER GURU ({currentTerm.label})
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Atur bentuk &amp; gaya raport pesantren (Arab-Indonesia), unduh format raport ke Excel (.xlsx) untuk diedit di Microsoft Excel, atau kelola berkas nilai per guru pengampu di bawah ini.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowRaportConfigModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Atur Bentuk &amp; Gaya Raport</span>
                </button>

                <button
                  onClick={handleExportRaportExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Edit Format Raport di Excel</span>
                </button>

                {currentRole === 'admin' && (
                  <button
                    id="btn-download-master-excel"
                    onClick={handleDownloadMasterExcel}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    title="Unduh seluruh rekap nilai pesantren"
                  >
                    <Download className="w-4 h-4 text-emerald-300" />
                    <span>Unduh Master Rekap Pesantren</span>
                  </button>
                )}

                <button
                  id="btn-print-rekap"
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition"
                  title="Cetak format fisik / PDF"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Cetak Rekap Resmi</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama asatidz atau mata pelajaran..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Total Nilai Masuk di Periode Ini: <strong className="text-emerald-800">{termNilai.length} Entri</strong>
              </div>
            </div>
          </div>

      {/* Tabel 1: Rekapan Berkas Nilai Per Guru / Asatidz */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase">
              Tabel Rekapitulasi Berkas Nilai Per Guru Pengampu (Asatidz)
            </h4>
            <p className="text-[11px] text-slate-500">
              Klik nama guru atau tombol "Unduh Excel" untuk mengunduh berkas nilai seluruh kelas yang diampu guru tersebut.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
            {filteredTeachers.length} Guru Pengampu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-2.5 px-3 text-center border-r border-slate-200 w-12">No</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[200px]">Nama Guru / Asatidz</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 w-36">NIP / NIK</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[200px]">Mata Pelajaran Diampu</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[160px]">Cakupan Kelas</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200 w-28">Kelas Terisi</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200 w-24">Rata-Rata</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200 w-32">Status</th>
                <th className="py-2.5 px-3 text-center w-44">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 border-b border-slate-200">
                    Tidak ada data guru yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(({ guru, assignedTasks, classesTaught, classesInputted, totalGraded, avgScore, teacherGrades, mapelNamesList }, idx) => {
                  const displayTasks =
                    assignedTasks.length > 0
                      ? assignedTasks.map((t) => ({
                          id: t.id,
                          namaMapel: t.namaMapel,
                          tingkat: t.tingkat,
                        }))
                      : mapelNamesList.map((mName, mIdx) => ({
                          id: `mp-${mIdx}`,
                          namaMapel: mName,
                          tingkat: guru.waliKelas && guru.waliKelas !== '-' ? guru.waliKelas : 'Umum',
                        }));
                  return (
                    <tr key={guru.id} className="border-b border-slate-200 hover:bg-slate-50/80 transition align-top">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-200">
                        <button
                          onClick={() => handleDownloadTeacherExcel(guru)}
                          className="text-left font-bold text-emerald-950 hover:text-emerald-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                          title="Klik untuk mengunduh file Excel semua nilai dari guru ini"
                        >
                          <span>{guru.nama}</span>
                          <Download className="w-3 h-3 text-emerald-600 shrink-0" />
                        </button>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600 border-r border-slate-200">
                        {guru.nip || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 min-w-[280px]">
                        {displayTasks.length === 0 ? (
                          <span className="text-slate-400 italic">Belum Diatur</span>
                        ) : (
                          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <table className="w-full text-[11px] text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                  <th className="py-1 px-2 text-center border-r border-slate-200 w-7">No</th>
                                  <th className="py-1 px-2 border-r border-slate-200">Mata Pelajaran</th>
                                  <th className="py-1 px-2 w-28">Kelas</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayTasks.map((t, tIdx) => (
                                  <tr key={t.id || tIdx} className="border-b border-slate-100 last:border-b-0">
                                    <td className="py-1 px-2 text-center text-slate-500 border-r border-slate-100">
                                      {tIdx + 1}
                                    </td>
                                    <td className="py-1 px-2 font-semibold text-emerald-950 border-r border-slate-100">
                                      {t.namaMapel}
                                    </td>
                                    <td className="py-1 px-2 font-bold text-emerald-800">
                                      {t.tingkat}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-200">
                        <div className="flex flex-wrap gap-1">
                          {classesTaught.length === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            classesTaught.map((cls) => {
                              const hasGrades = teacherGrades.some((g) => g.kelasId === cls.id);
                              return (
                                <span
                                  key={cls.id}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    hasGrades
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {cls.nama} {hasGrades && '✓'}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                        {classesInputted.length} / {classesTaught.length} Kelas
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-emerald-700 border-r border-slate-200">
                        {avgScore}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-md inline-block ${
                            totalGraded > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {totalGraded > 0 ? `${totalGraded} Nilai Terisi` : 'Belum Input'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPreview(guru)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-slate-600" />
                            <span>Detail</span>
                          </button>
                          <button
                            id={`btn-download-excel-${guru.id}`}
                            onClick={() => handleDownloadTeacherExcel(guru)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                            title="Unduh 1 file Excel memuat semua kelas guru ini"
                          >
                            <Download className="w-3 h-3 text-emerald-200" />
                            <span>Excel</span>
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

      {/* Tabel 2: Leger Rekap Nilai Santri Per Kelas (Kelas 1 s/d Kelas 6) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase">
              Tabel Leger Nilai Santri Per Kelas — {classForPrintObj?.nama || 'Kelas 1'}
            </h4>
            <p className="text-[11px] text-slate-500">
              Tabel rekapitulasi nilai mata pelajaran seluruh santri di kelas ini (klik angka nilai untuk mengubah langsung).
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-bold text-slate-700">Pilih Kelas:</label>
            <select
              value={selectedClassForPrint}
              onChange={(e) => setSelectedClassForPrint(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              {allKelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({getSantriForKelas(k, allSantri).length} Santri)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExportRaportExcel}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Leger &amp; Raport (Excel)</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-2.5 px-3 text-center border-r border-slate-200 w-10">No</th>
                <th className="py-2.5 px-3 border-r border-slate-200 w-28">NIS</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[180px]">Nama Santri</th>
                {effectiveMapelForClass.map((m) => (
                  <th
                    key={m.id}
                    className="py-2.5 px-2.5 text-center border-r border-slate-200 min-w-[95px]"
                    title={`KKM: ${m.kkm || 75}`}
                  >
                    <div className="line-clamp-1">{m.nama}</div>
                    <div className="text-[10px] font-normal text-slate-500">KKM {m.kkm || 75}</div>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center border-r border-slate-200 w-20 bg-emerald-50/60">Jumlah</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200 w-20 bg-emerald-50/60">Rata-Rata</th>
                <th className="py-2.5 px-3 text-center w-24 bg-amber-50/60">Peringkat</th>
              </tr>
            </thead>
            <tbody>
              {santriInClassForPrint.length === 0 ? (
                <tr>
                  <td
                    colSpan={effectiveMapelForClass.length + 6}
                    className="py-8 text-center text-slate-400 border-b border-slate-200"
                  >
                    Belum ada santri terdaftar di kelas ini.
                  </td>
                </tr>
              ) : (
                santriInClassForPrint.map((santri, sIdx) => {
                  const sGrades = termNilai.filter((n) => n.santriId === santri.id);
                  let total = 0;
                  let count = 0;

                  return (
                    <tr key={santri.id} className="border-b border-slate-200 hover:bg-slate-50/80 transition">
                      <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-200 font-medium">
                        {sIdx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-200">
                        {santri.nis}
                      </td>
                      <td className="py-2 px-3.5 font-bold text-slate-900 border-r border-slate-200">
                        {santri.nama}
                      </td>
                      {effectiveMapelForClass.map((mapel) => {
                        const found = sGrades.find(
                          (g) =>
                            doesGradeMatchMapel(g.mapelId, mapel.id, allMapel) ||
                            doesGradeMatchMapel(g.mapelId, mapel.nama, allMapel)
                        );
                        const val = found ? found.nilaiAkhir : null;
                        if (val !== null) {
                          total += val;
                          count++;
                        }
                        return (
                          <td
                            key={mapel.id}
                            className="py-1.5 px-2 text-center border-r border-slate-200"
                          >
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={val !== null ? val : ''}
                              placeholder="-"
                              onChange={(e) => {
                                const num = parseInt(e.target.value);
                                if (!isNaN(num)) {
                                  handleQuickUpdateGrade(santri, mapel, num);
                                }
                              }}
                              className={`w-14 px-1.5 py-1 text-center rounded border text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${
                                val !== null
                                  ? val < (mapel.kkm || 75)
                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                    : 'bg-white border-slate-200 text-slate-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center font-extrabold text-slate-900 border-r border-slate-200 bg-emerald-50/30">
                        {count > 0 ? Math.round(total * 10) / 10 : '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-extrabold text-emerald-800 border-r border-slate-200 bg-emerald-50/30">
                        {count > 0 ? (total / count).toFixed(1) : '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-extrabold text-amber-900 bg-amber-50/30">
                        Ke-{classRankingsMap[santri.id] || sIdx + 1}
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
      {/* MODAL: Preview Nilai Guru (Class by Class Tabs) */}
      {/* ============================================================ */}
      {selectedGuruPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h4 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                  PRATINJAU LEMBAR NILAI: {selectedGuruPreview.nama.toUpperCase()}
                </h4>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Tahun Ajaran: {currentTerm.label} • Berkas multi-kelas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadTeacherExcel(selectedGuruPreview)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Excel File</span>
                </button>
                <button
                  onClick={() => setSelectedGuruPreview(null)}
                  className="text-emerald-200 hover:text-white font-bold text-xl p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Class Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
              {allKelas.map((cls) => {
                const countGrades = termNilai.filter(
                  (n) => n.asatidzId === selectedGuruPreview.id && n.kelasId === cls.id
                ).length;
                const isSelected = previewTabKelasId === cls.id;

                return (
                  <button
                    key={cls.id}
                    onClick={() => setPreviewTabKelasId(cls.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cls.nama}</span>
                    <span className="ml-1 text-[10px] opacity-80">({countGrades})</span>
                  </button>
                );
              })}
            </div>

            {/* Table Scores in Selected Tab */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {(() => {
                const currentCls = allKelas.find((k) => k.id === previewTabKelasId);
                const santriList = getSantriForKelas(currentCls, allSantri);
                const guruAssignedInCls = allTugasMengajar.filter(
                  (t) =>
                    doesTugasBelongToAsatidz(t, selectedGuruPreview, allAsatidz) &&
                    currentCls &&
                    doesTugasMatchKelas(t, currentCls, allKelas)
                );
                const gradesInClass = termNilai.filter(
                  (n) =>
                    (n.kelasId === previewTabKelasId ||
                      santriList.some((s) => s.id === n.santriId)) &&
                    (n.asatidzId === selectedGuruPreview.id ||
                      guruAssignedInCls.some((t) =>
                        doesGradeMatchMapel(n.mapelId, t.namaMapel, allMapel)
                      ))
                );

                if (santriList.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada santri di kelas ini.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                      <div>
                        <strong>Kelas:</strong> {currentCls?.nama} |{' '}
                        <strong>Total Santri:</strong> {santriList.length} |{' '}
                        <strong>Sudah Dinilai:</strong> {gradesInClass.length}
                      </div>
                      <div className="font-bold text-emerald-800">
                        {gradesInClass.length >= santriList.length
                          ? 'Status: Lengkap (100%)'
                          : 'Status: Sebagian'}
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">NIS</th>
                            <th className="py-2.5 px-4">Nama Santri</th>
                            <th className="py-2.5 px-3">Mata Pelajaran</th>
                            <th className="py-2.5 px-2 text-center">Harian</th>
                            <th className="py-2.5 px-2 text-center">Lisan</th>
                            <th className="py-2.5 px-2 text-center">Tulis</th>
                            <th className="py-2.5 px-2 text-center">Akhir</th>
                            <th className="py-2.5 px-3 text-center">Predikat</th>
                            <th className="py-2.5 px-3">Catatan</th>
                            {currentRole === 'admin' && (
                              <th className="py-2.5 px-3 text-right">Aksi</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {santriList.map((santri, idx) => {
                            const grade = gradesInClass.find((g) => g.santriId === santri.id);
                            const mapelObj = grade
                              ? allMapel.find(
                                  (m) =>
                                    m.id === grade.mapelId ||
                                    m.nama.toLowerCase() === grade.mapelId.toLowerCase()
                                )
                              : null;
                            const mapelDisplayName = mapelObj?.nama || grade?.mapelId || '-';

                            return (
                              <tr key={santri.id} className="hover:bg-slate-50/60">
                                <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                                  {santri.nis}
                                </td>
                                <td className="py-2 px-4 font-bold text-slate-900">
                                  {santri.nama}
                                </td>
                                <td className="py-2 px-3 text-emerald-800 font-medium">
                                  {mapelDisplayName}
                                </td>
                                <td className="py-2 px-2 text-center font-medium">
                                  {grade ? grade.nilaiHarian : '-'}
                                </td>
                                <td className="py-2 px-2 text-center font-medium">
                                  {grade ? grade.nilaiLisan : '-'}
                                </td>
                                <td className="py-2 px-2 text-center font-medium">
                                  {grade ? grade.nilaiTulis : '-'}
                                </td>
                                <td className="py-2 px-2 text-center font-extrabold text-slate-900">
                                  {grade ? grade.nilaiAkhir : '-'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {grade ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                      {grade.predikat}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Belum Ada</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[150px]">
                                  {grade?.catatan || '-'}
                                </td>
                                {currentRole === 'admin' && (
                                  <td className="py-2 px-3 text-right">
                                    {grade ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() =>
                                            handleOpenEditGrade(
                                              grade,
                                              santri.nama,
                                              mapelObj?.nama || 'Mapel'
                                            )
                                          }
                                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                          title="Edit Nilai Santri Ini"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteGrade(grade.id, santri.nama)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                          title="Hapus Nilai Santri Ini"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-300">-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Edit Nilai Santri (Admin Only) */}
      {/* ============================================================ */}
      {editingGrade && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                  EDIT NILAI SANTRI
                </h4>
                <p className="text-[11px] text-emerald-200">
                  {editingGrade.santriNama} • {editingGrade.mapelNama}
                </p>
              </div>
              <button
                onClick={() => setEditingGrade(null)}
                className="text-emerald-200 hover:text-white font-bold text-base"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditedGrade} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harian</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editGradeForm.nilaiHarian}
                    onChange={(e) =>
                      setEditGradeForm({ ...editGradeForm, nilaiHarian: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lisan</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editGradeForm.nilaiLisan}
                    onChange={(e) =>
                      setEditGradeForm({ ...editGradeForm, nilaiLisan: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tulis</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editGradeForm.nilaiTulis}
                    onChange={(e) =>
                      setEditGradeForm({ ...editGradeForm, nilaiTulis: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editGradeForm.catatan}
                  onChange={(e) =>
                    setEditGradeForm({ ...editGradeForm, catatan: e.target.value })
                  }
                  placeholder="Catatan kemajuan santri..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg font-bold text-xs shadow-xs"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Cetak Format Resmi (Kop Surat Pesantren Alhusna) */}
      {/* ============================================================ */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between print:hidden">
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Printer className="w-4 h-4" />
                <span>FORMAT CETAK BERKAS REKAP NILAI RESMI</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition"
                >
                  Cetak Sekarang
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-emerald-200 hover:text-white font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0">
              {/* Pesantren Official Letterhead (Kop Surat) */}
              <div className="text-center pb-4 border-b-2 border-emerald-900">
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-emerald-950">
                  {profile.nama}
                </h2>
                <p className="text-xs font-semibold text-emerald-800 uppercase mt-0.5">
                  {profile.subTitle}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  NSPP: {profile.nspp} • {profile.alamat}, Kab. {profile.kabupaten}, {profile.provinsi}
                </p>
                <p className="text-[10px] text-slate-500">
                  Telp: {profile.noTelp} • Email: {profile.email} • Website: {profile.website}
                </p>
              </div>

              {/* Title */}
              <div className="text-center my-6">
                <h3 className="text-sm font-bold uppercase underline text-slate-900">
                  SURAT REKAPITULASI HASIL IMTIHAN NIHA&apos;I (UJIAN AKHIR SEMESTER)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Periode: {currentTerm.label}
                </p>
              </div>

              {/* Brief Summary Table */}
              <div className="text-xs mb-6">
                <table className="w-full border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 p-2 text-left">No</th>
                      <th className="border border-slate-300 p-2 text-left">Nama Guru Pengampu</th>
                      <th className="border border-slate-300 p-2 text-left">Mata Pelajaran</th>
                      <th className="border border-slate-300 p-2 text-center">Kelas Selesai</th>
                      <th className="border border-slate-300 p-2 text-center">Santri Dinilai</th>
                      <th className="border border-slate-300 p-2 text-center">Rata-Rata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachersWithStats.map((item, idx) => (
                      <tr key={item.guru.id}>
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold">{item.guru.nama}</td>
                        <td className="border border-slate-300 p-2">
                          {item.guru.mataPelajaranIds
                            .map((id) => allMapel.find((m) => m.id === id)?.nama)
                            .join(', ')}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {item.classesInputted.length} Kelas
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {item.totalGraded} Santri
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold">
                          {item.avgScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-xs pt-8 text-center">
                <div>
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-bold text-slate-900 mt-1">Pengasuh Pondok Pesantren</p>
                  <div className="h-20" />
                  <p className="font-bold text-slate-900 underline">K.H. Ahmad Husnan Al-Hafidz</p>
                  <p className="text-[10px] text-slate-500">Pimpinan Ma&apos;had Tahfidz</p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Cianjur, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </p>
                  <p className="font-bold text-slate-900 mt-1">Ketua Panitia Ujian</p>
                  <div className="h-20" />
                  <p className="font-bold text-slate-900 underline">Ust. Fauzan Adhim, S.Pd.I.</p>
                  <p className="text-[10px] text-slate-500">Ketua Panitia Imtihan</p>
                </div>
              </div>
            </div>
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

      {/* MODAL: PENGATURAN FORMAT, GAYA & EXCEL RAPORT */}
      <RaportConfigModal
        isOpen={showRaportConfigModal}
        onClose={() => setShowRaportConfigModal(false)}
        config={raportConfig}
        onChangeConfig={handleUpdateRaportConfig}
        allMapel={allMapel}
        santriInClass={santriInClassForPrint}
        currentKelas={classForPrintObj}
        onExportExcel={handleExportRaportExcel}
        onTriggerImportExcel={() => excelFileInputRef.current?.click()}
      />

    </div>
  );
};
