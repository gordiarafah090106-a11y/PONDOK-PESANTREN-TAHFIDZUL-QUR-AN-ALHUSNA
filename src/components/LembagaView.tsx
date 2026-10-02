import React, { useState, useRef } from 'react';
import {
  AcademicTerm,
  Asatidz,
  JadwalUjianItem,
  Kelas,
  MataPelajaran,
  RoleType,
  Santri,
  SantriKepribadianData,
} from '../types';
import {
  School,
  Calendar,
  BookOpen,
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Check,
  FileText,
  X,
} from 'lucide-react';
import {
  downloadKelasTemplateExcel,
  parseKelasExcel,
  downloadSantriTemplateExcel,
  parseSantriExcel,
  downloadKepribadianTemplateExcel,
  parseKepribadianSantriExcel,
  getDefaultSantriExtra,
} from '../utils/excelExport';
import { ConfirmModal } from './ConfirmModal';
import {
  doesSantriBelongToKelas,
  getAllActiveSantriInExistingKelas,
  getSantriForKelas,
  isDummyInitialSantri,
} from '../utils/dataSyncHelpers';

interface LembagaViewProps {
  currentTerm: AcademicTerm;
  allMapel?: MataPelajaran[];
  onUpdateMapel?: (updated: MataPelajaran[]) => void;
  allKelas: Kelas[];
  onUpdateKelas: (updated: Kelas[]) => void;
  allSantri: Santri[];
  onUpdateSantri: (updated: Santri[]) => void;
  allJadwal: JadwalUjianItem[];
  onUpdateJadwal: (updated: JadwalUjianItem[]) => void;
  allAsatidz?: Asatidz[];
  currentRole: RoleType;
  activeSubTab?: string;
  onSelectSubTab?: (tab: 'kelas' | 'kepribadian' | 'jadwal') => void;
}

const TINGKAT_OPTIONS = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
const PREDIKAT_SIKAP_OPTIONS = [
  'A',
  'B+',
  'B',
  'C',
  'D',
  'Sangat Baik',
  'Baik',
  'Cukup',
];

export const LembagaView: React.FC<LembagaViewProps> = ({
  currentTerm,
  allKelas,
  onUpdateKelas,
  allSantri,
  onUpdateSantri,
  allJadwal,
  onUpdateJadwal,
  allAsatidz = [],
  currentRole,
  activeSubTab: propSubTab,
  onSelectSubTab,
}) => {
  const [internalTab, setInternalTab] = useState<'kelas' | 'kepribadian' | 'jadwal'>('kelas');
  const rawActiveTab = (propSubTab as 'kelas' | 'kepribadian' | 'jadwal') || internalTab;
  const activeTab = ! (currentRole === 'admin') && rawActiveTab === 'kepribadian' ? 'kelas' : rawActiveTab;
  const setActiveTab = (tab: 'kelas' | 'kepribadian' | 'jadwal') => {
    setInternalTab(tab);
    if (onSelectSubTab) onSelectSubTab(tab);
  };
  const isAdmin = currentRole === 'admin';

  // --- Kepribadian Santri State (Admin Only) ---
  const [selectedKepribadianKelasId, setSelectedKepribadianKelasId] = useState<string>('Semua');
  const [kepribadianSearch, setKepribadianSearch] = useState<string>('');
  const [kepribadianNotice, setKepribadianNotice] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const kepribadianFileInputRef = useRef<HTMLInputElement>(null);

  // --- Kelas State ---
  const [kelasModal, setKelasModal] = useState(false);
  const [kelasModalMode, setKelasModalMode] = useState<'manual' | 'excel'>('manual');
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [kelasForm, setKelasForm] = useState({
    nama: '',
    tingkat: 'Kelas 1',
    waliKelas: '',
    kapasitas: 25,
  });
  const [selectedTingkatFilter, setSelectedTingkatFilter] = useState<string>('Semua');

  // Excel Kelas Upload State
  const [kelasExcelFile, setKelasExcelFile] = useState<File | null>(null);
  const [parsedKelasList, setParsedKelasList] = useState<Omit<Kelas, 'id'>[]>([]);
  const [parseKelasStatus, setParseKelasStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Santri Drawer per Class State
  const [viewSantriClass, setViewSantriClass] = useState<Kelas | null>(null);
  const [santriSearch, setSantriSearch] = useState('');
  const [manualSantriModal, setManualSantriModal] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [manualSantriForm, setManualSantriForm] = useState({
    nis: '',
    nama: '',
    jenisKelamin: 'L' as 'L' | 'P',
    halaqah: 'Halaqah Tahfidz',
    kamar: 'Asrama Santri',
  });

  // Santri Excel Upload inside Modal Tambah/Edit Kelas (Gambar 2)
  const modalSantriFileInputRef = useRef<HTMLInputElement>(null);
  const [modalSantriFile, setModalSantriFile] = useState<File | null>(null);
  const [modalParsedSantri, setModalParsedSantri] = useState<Omit<Santri, 'id'>[]>([]);
  const [modalSantriNotice, setModalSantriNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [isParsingSantri, setIsParsingSantri] = useState(false);

  // State for in-app deletion confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Santri Excel Upload inside Class Drawer
  const santriFileInputRef = useRef<HTMLInputElement>(null);
  const [santriUploadNotice, setSantriUploadNotice] = useState<{ success?: boolean; message?: string } | null>(null);

  // --- Jadwal Ujian State (PDF & Image Support) ---
  const [previewDocUrl, setPreviewDocUrl] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);
  const [jadwalModal, setJadwalModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalUjianItem | null>(null);
  const [jadwalForm, setJadwalForm] = useState({
    judul: '',
    tanggalUjian: '',
    keterangan: '',
    fileUrl: '',
    fileType: 'image' as 'image' | 'pdf',
  });

  // Handle Excel File for Kelas
  const handleKelasExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKelasExcelFile(file);
    setParseKelasStatus(null);

    const result = await parseKelasExcel(file);
    if (result.success) {
      setParsedKelasList(result.data);
      setParseKelasStatus({ success: true, message: result.message });
    } else {
      setParsedKelasList([]);
      setParseKelasStatus({ success: false, message: result.message });
    }
  };

  const handleCommitKelasExcel = () => {
    if (parsedKelasList.length === 0) return;

    const newClasses: Kelas[] = parsedKelasList.map((item) => ({
      ...item,
      id: `kls-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    }));

    onUpdateKelas([...allKelas, ...newClasses]);
    setKelasModal(false);
    setKelasExcelFile(null);
    setParsedKelasList([]);
    setParseKelasStatus(null);
  };

  // Handle Excel upload in Modal Tambah / Edit Kelas (Gambar 2: Upload Santri)
  const handleModalSantriUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalSantriFile(file);
    setIsParsingSantri(true);
    setModalSantriNotice(null);

    try {
      const result = await parseSantriExcel(file, editingKelas ? editingKelas.id : 'temp-target');
      if (result.success && result.data.length > 0) {
        setModalParsedSantri(result.data);
        setModalSantriNotice({
          success: true,
          message: `Alhamdulillah! ${result.data.length} nama santri berhasil dibaca dari file Excel.`,
        });
        // Auto-update capacity if parsed count is larger
        if (result.data.length > kelasForm.kapasitas) {
          setKelasForm((prev) => ({
            ...prev,
            kapasitas: Math.max(result.data.length, prev.kapasitas),
          }));
        }
      } else {
        setModalParsedSantri([]);
        setModalSantriNotice({
          success: false,
          message: result.message || 'File Excel kosong atau format kolom tidak sesuai template.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses file Excel.';
      setModalParsedSantri([]);
      setModalSantriNotice({ success: false, message: msg });
    } finally {
      setIsParsingSantri(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleClearModalSantri = () => {
    setModalSantriFile(null);
    setModalParsedSantri([]);
    setModalSantriNotice(null);
  };

  // Save manual class
  const handleSaveKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasForm.nama.trim()) return;

    let targetKelasId = '';
    const effectiveKapasitas =
      modalParsedSantri.length > 0 ? modalParsedSantri.length : kelasForm.kapasitas;

    if (editingKelas) {
      targetKelasId = editingKelas.id;
      const updated = allKelas.map((k) =>
        k.id === editingKelas.id
          ? { ...k, ...kelasForm, kapasitas: effectiveKapasitas }
          : k
      );
      onUpdateKelas(updated);
    } else {
      targetKelasId = `kls-${Date.now()}`;
      const newKelas: Kelas = {
        id: targetKelasId,
        ...kelasForm,
        kapasitas: effectiveKapasitas,
      };
      onUpdateKelas([...allKelas, newKelas]);
    }

    // Save attached santri from Excel upload if available
    if (modalParsedSantri.length > 0) {
      const newSantriList: Santri[] = modalParsedSantri.map((item, idx) => ({
        ...item,
        id: `santri-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        kelasId: targetKelasId,
        halaqah: item.halaqah || kelasForm.nama,
      }));

      // Replace existing santri in THIS target class and strip any leftover demo santri (snt-01..snt-21)
      const filteredOtherClasses = allSantri.filter(
        (s) =>
          s.kelasId !== targetKelasId &&
          (s.kelasId || '').trim().toLowerCase() !== kelasForm.nama.trim().toLowerCase() &&
          !isDummyInitialSantri(s.id)
      );
      onUpdateSantri([...filteredOtherClasses, ...newSantriList]);
    }

    setKelasModal(false);
    setModalSantriFile(null);
    setModalParsedSantri([]);
    setModalSantriNotice(null);
  };

  // Add or Edit Santri manually in a class
  const handleSaveManualSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewSantriClass || !manualSantriForm.nama.trim()) return;

    if (editingSantri) {
      const updated = allSantri.map((s) =>
        s.id === editingSantri.id
          ? {
              ...s,
              nis: manualSantriForm.nis,
              nama: manualSantriForm.nama,
              jenisKelamin: manualSantriForm.jenisKelamin,
              halaqah: manualSantriForm.halaqah,
              kamar: manualSantriForm.kamar,
            }
          : s
      );
      onUpdateSantri(updated);
    } else {
      const newSantri: Santri = {
        id: `snt-${Date.now()}`,
        nis: manualSantriForm.nis || `2025${Math.floor(1000 + Math.random() * 9000)}`,
        nama: manualSantriForm.nama,
        jenisKelamin: manualSantriForm.jenisKelamin,
        kelasId: viewSantriClass.id,
        halaqah: manualSantriForm.halaqah,
        kamar: manualSantriForm.kamar,
        status: 'Aktif',
      };
      const cleanedExisting = allSantri.filter((s) => !isDummyInitialSantri(s.id));
      onUpdateSantri([...cleanedExisting, newSantri]);
    }

    setManualSantriModal(false);
    setEditingSantri(null);
    setManualSantriForm({
      nis: '',
      nama: '',
      jenisKelamin: 'L',
      halaqah: 'Halaqah Tahfidz',
      kamar: 'Asrama Santri',
    });
  };

  // Handle Excel Upload for Student Names in this Class
  const handleSantriExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewSantriClass) return;

    setSantriUploadNotice(null);
    try {
      const result = await parseSantriExcel(file, viewSantriClass.id);
      if (result.success && result.data.length > 0) {
        const newSantriList: Santri[] = result.data.map((item, idx) => ({
          ...item,
          id: `snt-${Date.now()}-${idx}`,
          kelasId: viewSantriClass.id,
        }));

        // Replace santri of THIS class with the Excel file data & strip any leftover demo santri
        const filteredOtherClasses = allSantri.filter(
          (s) =>
            !doesSantriBelongToKelas(s, viewSantriClass) &&
            !isDummyInitialSantri(s.id)
        );

        onUpdateSantri([...filteredOtherClasses, ...newSantriList]);
        onUpdateKelas(
          allKelas.map((k) =>
            k.id === viewSantriClass.id
              ? { ...k, kapasitas: newSantriList.length }
              : k
          )
        );
        setSantriUploadNotice({
          success: true,
          message: `Alhamdulillah! Berhasil mengimpor dan menyinkronkan ${newSantriList.length} santri untuk ${viewSantriClass.nama}.`,
        });
      } else {
        setSantriUploadNotice({
          success: false,
          message: result.message || 'Gagal membaca format data santri pada file Excel.',
        });
      }
    } catch (err: any) {
      setSantriUploadNotice({
        success: false,
        message: `Terjadi kesalahan saat memproses file: ${err?.message || 'Format tidak valid'}`,
      });
    } finally {
      if (santriFileInputRef.current) santriFileInputRef.current.value = '';
    }
  };

  const handleDeleteSantri = (santriId: string, santriNama?: string) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Data Santri',
      message: `Yakin ingin menghapus santri ${santriNama ? `"${santriNama}"` : 'ini'} dari kelas?`,
      onConfirm: () => {
        onUpdateSantri(allSantri.filter((s) => s.id !== santriId));
      },
    });
  };

  // --- Jadwal Ujian (PDF / Image) Handlers ---
  const handleJadwalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setJadwalForm({
          ...jadwalForm,
          fileUrl: result,
          fileType: isPdf ? 'pdf' : 'image',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalForm.judul.trim() || !jadwalForm.fileUrl) {
      return;
    }

    if (editingJadwal) {
      const updated = allJadwal.map((j) =>
        j.id === editingJadwal.id
          ? {
              ...j,
              judul: jadwalForm.judul,
              tanggalUjian: jadwalForm.tanggalUjian,
              keterangan: jadwalForm.keterangan,
              imageUrl: jadwalForm.fileUrl,
            }
          : j
      );
      onUpdateJadwal(updated);
    } else {
      const newJadwal: JadwalUjianItem = {
        id: `jdw-${Date.now()}`,
        judul: jadwalForm.judul,
        tanggalUjian: jadwalForm.tanggalUjian,
        keterangan: jadwalForm.keterangan,
        imageUrl: jadwalForm.fileUrl,
        termId: currentTerm.id,
        uploadedAt: new Date().toISOString(),
      };
      onUpdateJadwal([newJadwal, ...allJadwal]);
    }

    setJadwalModal(false);
    setEditingJadwal(null);
  };

  const handleDeleteJadwal = (id: string, judul?: string) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Berkas Jadwal',
      message: `Yakin ingin menghapus berkas jadwal ujian ${judul ? `"${judul}"` : 'ini'}?`,
      onConfirm: () => {
        onUpdateJadwal(allJadwal.filter((j) => j.id !== id));
      },
    });
  };

  // --- Kepribadian Santri Helpers (Synced with Data Santri & Raport) ---
  const activeSantriInExistingKelas = getAllActiveSantriInExistingKelas(allSantri, allKelas);
  const filteredKepribadianSantri = activeSantriInExistingKelas.filter((s) => {
    if (selectedKepribadianKelasId !== 'Semua') {
      const targetKls = allKelas.find((k) => k.id === selectedKepribadianKelasId);
      if (targetKls && !doesSantriBelongToKelas(s, targetKls)) return false;
    }
    if (kepribadianSearch.trim()) {
      const q = kepribadianSearch.toLowerCase();
      return (
        s.nama.toLowerCase().includes(q) ||
        (s.nis || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const syncKepribadianToRaportLocalStorage = (
    updatedSantriMap: Record<string, SantriKepribadianData>
  ) => {
    try {
      const savedRaw = localStorage.getItem('alhusna_raport_config_v2');
      const parsed = savedRaw ? JSON.parse(savedRaw) : {};
      const nextExtra = { ...(parsed.santriExtra || {}), ...updatedSantriMap };
      localStorage.setItem(
        'alhusna_raport_config_v2',
        JSON.stringify({ ...parsed, santriExtra: nextExtra })
      );
    } catch {
      // ignore localStorage errors
    }
  };

  const handleUpdateSingleSantriKepribadian = (
    santri: Santri,
    field: keyof SantriKepribadianData,
    value: string
  ) => {
    const currentExtra = getDefaultSantriExtra(santri);
    const nextKepribadian: SantriKepribadianData = {
      ...currentExtra,
      ...(santri.kepribadian || {}),
      [field]: value,
    };
    const updatedList = allSantri.map((s) =>
      s.id === santri.id ? { ...s, kepribadian: nextKepribadian } : s
    );
    onUpdateSantri(updatedList);
    syncKepribadianToRaportLocalStorage({ [santri.id]: nextKepribadian });
  };

  const handleDownloadKepribadianExcel = () => {
    const targetList =
      filteredKepribadianSantri.length > 0
        ? filteredKepribadianSantri
        : activeSantriInExistingKelas;
    const selectedKlsObj = allKelas.find((k) => k.id === selectedKepribadianKelasId);
    const label = selectedKlsObj ? selectedKlsObj.nama : 'Semua_Kelas';
    downloadKepribadianTemplateExcel(targetList, allKelas, label);
    setKepribadianNotice({
      success: true,
      message: `Template Excel Kepribadian (${targetList.length} santri dari Data Santri) berhasil diunduh. Silakan isi di Excel lalu klik "Upload Excel Kepribadian".`,
    });
  };

  const handleUploadKepribadianExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKepribadianNotice(null);

    const res = await parseKepribadianSantriExcel(file, allSantri);
    if (res.success && res.matchedCount > 0) {
      const updatedList = allSantri.map((s) =>
        res.updatedMap[s.id]
          ? { ...s, kepribadian: res.updatedMap[s.id] }
          : s
      );
      onUpdateSantri(updatedList);
      syncKepribadianToRaportLocalStorage(res.updatedMap);
      setKepribadianNotice({
        success: true,
        message: `${res.message} Data otomatis tersinkronisasi ke Data Santri & Raport.`,
      });
    } else {
      setKepribadianNotice({
        success: false,
        message: res.message,
      });
    }
    if (kepribadianFileInputRef.current) {
      kepribadianFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Active Sub-Section Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold shadow-xs">
            {activeTab === 'kelas' && <School className="w-4 h-4" />}
            {activeTab === 'kepribadian' && <FileSpreadsheet className="w-4 h-4" />}
            {activeTab === 'jadwal' && <Calendar className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Lembaga
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                {activeTab === 'kelas' && `DATA SANTRI (${allKelas.length} KELAS)`}
                {activeTab === 'kepribadian' && `INPUT DATA KEPRIBADIAN SANTRI (${activeSantriInExistingKelas.length} SANTRI)`}
                {activeTab === 'jadwal' && `JADWAL UJIAN (${allJadwal.length} BERKAS)`}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('kelas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'kelas'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Santri
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('kepribadian')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'kepribadian'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kepribadian Santri
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('jadwal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'jadwal'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jadwal Ujian
            </button>
          </div>

          <div className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
            {currentTerm.label}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DATA SANTRI */}
      {/* ============================================================ */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>DATA SANTRI &amp; KELAS (TINGKAT KELAS 1 - KELAS 6)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total Santri Aktif Terdaftar:{' '}
                  <strong className="text-emerald-800">
                    {getAllActiveSantriInExistingKelas(allSantri, allKelas).length} Santri
                  </strong>{' '}
                  dalam <strong>{allKelas.length} Kelas</strong> (6 Tingkat)
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    id="btn-tambah-kelas"
                    onClick={() => {
                      setEditingKelas(null);
                      setKelasForm({
                        nama: '',
                        tingkat: 'Kelas 1',
                        waliKelas: '',
                        kapasitas: 25,
                      });
                      setKelasModalMode('manual');
                      setParsedKelasList([]);
                      setKelasExcelFile(null);
                      setParseKelasStatus(null);
                      setModalSantriFile(null);
                      setModalParsedSantri([]);
                      setModalSantriNotice(null);
                      setKelasModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Kelas Baru</span>
                  </button>
                </div>
              )}
            </div>

            {/* Filter Tingkat Kelas 1 s/d Kelas 6 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Filter Tingkat:</span>
              {['Semua', ...TINGKAT_OPTIONS].map((t) => {
                const countInTingkat =
                  t === 'Semua'
                    ? allKelas.length
                    : allKelas.filter((k) => k.tingkat === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTingkatFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedTingkatFilter === t
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t} ({countInTingkat})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Classes Cards Grid (Slim & Compact) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allKelas
              .filter((k) => selectedTingkatFilter === 'Semua' || k.tingkat === selectedTingkatFilter)
              .map((kelas) => {
              const studentCount = getSantriForKelas(kelas, allSantri).length;
              return (
                <div
                  key={kelas.id}
                  className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2.5 hover:border-emerald-300 transition group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {kelas.tingkat}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {studentCount} / {kelas.kapasitas || 25} Santri
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              onClick={() => {
                                setEditingKelas(kelas);
                                setKelasForm({
                                  nama: kelas.nama,
                                  tingkat: TINGKAT_OPTIONS.includes(kelas.tingkat) ? kelas.tingkat : 'Kelas 1',
                                  waliKelas: kelas.waliKelas || '',
                                  kapasitas: kelas.kapasitas || 25,
                                });
                                setKelasModalMode('manual');
                                setModalSantriFile(null);
                                setModalParsedSantri([]);
                                setModalSantriNotice(null);
                                setKelasModal(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="Edit Kelas"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDelete({
                                  isOpen: true,
                                  title: 'Hapus Kelas',
                                  message: `Yakin ingin menghapus kelas "${kelas.nama}"? Seluruh data santri (${studentCount} orang) pada kelas ini juga akan terhapus.`,
                                  onConfirm: () => {
                                    onUpdateKelas(allKelas.filter((k) => k.id !== kelas.id));
                                    onUpdateSantri(allSantri.filter((s) => !doesSantriBelongToKelas(s, kelas)));
                                  },
                                });
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                      {kelas.nama}
                    </h4>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Wali: <span className="font-semibold text-slate-700">{kelas.waliKelas || 'Belum Ditentukan'}</span>
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setViewSantriClass(kelas);
                        setSantriSearch('');
                        setSantriUploadNotice(null);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'Kelola Santri' : 'Lihat Santri'} ({studentCount})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1B: INPUT DATA KEPRIBADIAN SANTRI (ADMIN ONLY - VIA EXCEL TEMPLATE & TABEL) */}
      {/* ============================================================ */}
      {activeTab === 'kepribadian' && isAdmin && (
        <div className="space-y-4">
          {/* Header & Excel Template / Upload Toolbar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 uppercase">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Input Nilai Kepribadian Santri (Sistem Template Excel)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Daftar santri di bawah ini diambil <strong>otomatis dari Data Santri</strong> yang sudah diinput. Silakan klik <strong>Unduh Template Excel</strong> (kolom: <em>NO, NAMA SANTRI, AKHLAQ, KEBERSIHAN, IBADAH, KESUNGGUHAN, DISIPLIN DIRI, KETAATAN</em>), isi nilai kepribadian di Excel, lalu klik <strong>Upload Excel Kepribadian</strong>. Data akan langsung tersinkronisasi ke hasil cetak Rapor Santri.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="file"
                  ref={kepribadianFileInputRef}
                  onChange={handleUploadKepribadianExcel}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleDownloadKepribadianExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 transition cursor-pointer shadow-2xs"
                  title="Unduh Template Excel yang sudah berisi daftar nama & NIS santri dari Data Santri"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>1. Unduh Template Excel (Dari Data Santri)</span>
                </button>

                <button
                  type="button"
                  onClick={() => kepribadianFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  title="Upload file Excel Template Kepribadian Santri yang sudah diisi"
                >
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>2. Upload Excel Kepribadian</span>
                </button>
              </div>
            </div>

            {kepribadianNotice && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
                  kepribadianNotice.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {kepribadianNotice.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{kepribadianNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setKepribadianNotice(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold px-1.5"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Filter Kelas & Pencarian Santri */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Pilih Kelas:</label>
                <select
                  value={selectedKepribadianKelasId}
                  onChange={(e) => setSelectedKepribadianKelasId(e.target.value)}
                  className="px-3 py-1.5 bg-emerald-50/70 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Semua">
                    Semua Kelas ({activeSantriInExistingKelas.length} Santri)
                  </option>
                  {allKelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({getSantriForKelas(k, allSantri).length} Santri)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={kepribadianSearch}
                    onChange={(e) => setKepribadianSearch(e.target.value)}
                    placeholder="Cari nama atau NIS santri..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setKepribadianNotice({
                      success: true,
                      message: `Seluruh data kepribadian & kehadiran (${filteredKepribadianSantri.length} santri) telah tersimpan dan tersinkronisasi dengan Rapor.`,
                    })
                  }
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Data Kepribadian Santri */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase">
                  Tabel Nilai Kepribadian Santri
                </h4>
                <p className="text-[11px] text-slate-500">
                  Format sesuai Template Excel &amp; Cetak Raport: NO, NAMA SANTRI, AKHLAQ, KEBERSIHAN, IBADAH, KESUNGGUHAN, DISIPLIN DIRI, KETAATAN.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800">
                Menampilkan {filteredKepribadianSantri.length} Santri
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-800 font-extrabold border-b border-slate-300 uppercase">
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 w-12">NO</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[200px]">NAMA SANTRI</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[130px]">KELAS</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 min-w-[120px]">AKHLAQ</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 min-w-[120px]">KEBERSIHAN</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 min-w-[120px]">IBADAH</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 min-w-[130px]">KESUNGGUHAN</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 min-w-[130px]">DISIPLIN DIRI</th>
                    <th className="py-2.5 px-2.5 text-center min-w-[120px]">KETAATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKepribadianSantri.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 border-b border-slate-200">
                        Belum ada data santri pada kelas/filter ini. Silakan tambahkan santri terlebih dahulu di menu Data Santri.
                      </td>
                    </tr>
                  ) : (
                    filteredKepribadianSantri.map((santri, idx) => {
                      const klsObj = allKelas.find((k) => doesSantriBelongToKelas(santri, k));
                      const extra = getDefaultSantriExtra(santri);
                      return (
                        <tr
                          key={santri.id}
                          className="border-b border-slate-200 hover:bg-emerald-50/30 transition"
                        >
                          <td className="py-2 px-2.5 text-center text-slate-600 font-bold border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                            <div>{santri.nama}</div>
                            {santri.nis && (
                              <div className="text-[10px] font-mono text-slate-400">NIS: {santri.nis}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-emerald-800 border-r border-slate-200">
                            {klsObj ? klsObj.nama : santri.kelasId}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-200">
                            <input
                              type="text"
                              list="predikat-sikap-options"
                              value={extra.akhlaq}
                              onChange={(e) =>
                                handleUpdateSingleSantriKepribadian(santri, 'akhlaq', e.target.value)
                              }
                              className="w-full px-2 py-1 text-center bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-200">
                            <input
                              type="text"
                              list="predikat-sikap-options"
                              value={extra.kebersihan}
                              onChange={(e) =>
                                handleUpdateSingleSantriKepribadian(santri, 'kebersihan', e.target.value)
                              }
                              className="w-full px-2 py-1 text-center bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-200">
                            <input
                              type="text"
                              list="predikat-sikap-options"
                              value={extra.ibadah}
                              onChange={(e) =>
                                handleUpdateSingleSantriKepribadian(santri, 'ibadah', e.target.value)
                              }
                              className="w-full px-2 py-1 text-center bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-200">
                            <input
                              type="text"
                              list="predikat-sikap-options"
                              value={extra.kesungguhan}
                              onChange={(e) =>
                                handleUpdateSingleSantriKepribadian(santri, 'kesungguhan', e.target.value)
                              }
                              className="w-full px-2 py-1 text-center bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-200">
                            <input
                              type="text"
                              list="predikat-sikap-options"
                              value={extra.disiplinDiri}
                              onChange={(e) =>
                                handleUpdateSingleSantriKepribadian(santri, 'disiplinDiri', e.target.value)
                              }
                              className="w-full px-2 py-1 text-center bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              list="predikat-sikap-options"
                              value={extra.ketaatan}
                              onChange={(e) =>
                                handleUpdateSingleSantriKepribadian(santri, 'ketaatan', e.target.value)
                              }
                              className="w-full px-2 py-1 text-center bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <datalist id="predikat-sikap-options">
                {PREDIKAT_SIKAP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: JADWAL UJIAN (PDF / GAMBAR RESMI) */}
      {/* ============================================================ */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Jadwal Ujian Santri (PDF &amp; Dokumen Resmi)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Jadwal resmi imtihan santri dalam bentuk dokumen PDF / gambar, dapat dilihat dan diunduh oleh seluruh Asatidz.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setJadwalForm({
                    judul: `Jadwal Imtihan Niha'i ${currentTerm.label}`,
                    tanggalUjian: '15 - 21 Desember',
                    keterangan: 'Jadwal resmi ujian semester santri.',
                    fileUrl: '',
                    fileType: 'pdf',
                  });
                  setJadwalModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Dokumen / PDF Jadwal</span>
              </button>
            )}
          </div>

          {/* Jadwal Display: Full-Width across the page */}
          {allJadwal.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Belum Ada Dokumen Jadwal Ujian</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Upload berkas PDF atau gambar jadwal imtihan santri agar dapat langsung dilihat secara penuh oleh seluruh dewan asatidz.
              </p>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingJadwal(null);
                    setJadwalForm({
                      judul: `Jadwal Imtihan Niha'i ${currentTerm.label}`,
                      tanggalUjian: '15 - 21 Desember',
                      keterangan: 'Jadwal resmi ujian semester santri.',
                      fileUrl: '',
                      fileType: 'image',
                    });
                    setJadwalModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Jadwal Ujian</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {allJadwal.map((jadwal) => {
                const isPdf =
                  jadwal.imageUrl?.startsWith('data:application/pdf') ||
                  jadwal.imageUrl?.toLowerCase().includes('.pdf');

                return (
                  <div
                    key={jadwal.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                  >
                    {/* Header Bar */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {jadwal.tanggalUjian}
                          </span>
                          {isPdf ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Dokumen PDF</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Gambar Jadwal</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                          {jadwal.judul}
                        </h4>

                        {jadwal.keterangan && (
                          <p className="text-xs text-slate-500 mt-1">{jadwal.keterangan}</p>
                        )}
                      </div>

                      {/* Action Toolbar */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            setPreviewDocUrl({
                              url: jadwal.imageUrl,
                              title: jadwal.judul,
                              isPdf: isPdf,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Buka tampilan layar penuh"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Layar Penuh</span>
                        </button>

                        <a
                          href={jadwal.imageUrl}
                          download={`Jadwal_Ujian_${jadwal.id}.${isPdf ? 'pdf' : 'png'}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Download file jadwal"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh File</span>
                        </a>

                        {isAdmin && (
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                            <button
                              onClick={() => {
                                setEditingJadwal(jadwal);
                                setJadwalForm({
                                  judul: jadwal.judul,
                                  tanggalUjian: jadwal.tanggalUjian,
                                  keterangan: jadwal.keterangan || '',
                                  fileUrl: jadwal.imageUrl,
                                  fileType: isPdf ? 'pdf' : 'image',
                                });
                                setJadwalModal(true);
                              }}
                              className="p-1.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition"
                              title="Edit Data Jadwal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJadwal(jadwal.id, jadwal.judul)}
                              className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full-Width Document Viewport */}
                    <div className="p-3 sm:p-5 bg-slate-100/70 flex items-center justify-center">
                      {isPdf ? (
                        <div className="w-full bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200">
                          <iframe
                            src={jadwal.imageUrl}
                            title={jadwal.judul}
                            className="w-full h-[600px] sm:h-[800px] border-0"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            setPreviewDocUrl({
                              url: jadwal.imageUrl,
                              title: jadwal.judul,
                              isPdf: false,
                            })
                          }
                          className="w-full bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200 p-2 sm:p-4 flex items-center justify-center cursor-zoom-in group relative"
                          title="Klik untuk melihat layar penuh"
                        >
                          <img
                            src={jadwal.imageUrl}
                            alt={jadwal.judul}
                            className="w-full h-auto object-contain rounded-lg transition group-hover:opacity-95"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition shadow-lg">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Klik untuk Layar Penuh</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Fullscreen Document (PDF / Image) Preview */}
      {/* ============================================================ */}
      {previewDocUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl w-full h-[90vh] bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-200" />
                <h4 className="font-bold text-sm truncate max-w-md">
                  {previewDocUrl.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDocUrl.url}
                  download={`Jadwal_Ujian_${previewDocUrl.isPdf ? 'Dokumen.pdf' : 'Poster.png'}`}
                  className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="text-white hover:text-emerald-200 font-bold px-2 py-1"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-auto p-2">
              {previewDocUrl.isPdf ? (
                <iframe
                  src={previewDocUrl.url}
                  title={previewDocUrl.title}
                  className="w-full h-full rounded border-0 bg-white"
                />
              ) : (
                <img
                  src={previewDocUrl.url}
                  alt={previewDocUrl.title}
                  className="max-h-full max-w-full object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Upload Poster / PDF Jadwal Ujian (Admin) */}
      {/* ============================================================ */}
      {jadwalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                {editingJadwal ? 'Edit Dokumen Jadwal Ujian' : 'Upload Jadwal Ujian (PDF / Gambar)'}
              </h4>
              <button
                onClick={() => setJadwalModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Dokumen Jadwal
                </label>
                <input
                  type="text"
                  value={jadwalForm.judul}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, judul: e.target.value })}
                  placeholder="Contoh: Jadwal Imtihan Niha'i Semester Ganjil"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rentang Tanggal Pelaksanaan
                </label>
                <input
                  type="text"
                  value={jadwalForm.tanggalUjian}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, tanggalUjian: e.target.value })}
                  placeholder="Contoh: 15 - 22 Desember 2025"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih File Berkas (Format PDF atau Gambar PNG/JPG)
                </label>
                <input
                  type="file"
                  accept="image/*, application/pdf"
                  onChange={handleJadwalFileUpload}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  required={!editingJadwal && !jadwalForm.fileUrl}
                />
                {jadwalForm.fileUrl && (
                  <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Berkas siap disimpan ({jadwalForm.fileType.toUpperCase()})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  value={jadwalForm.keterangan}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, keterangan: e.target.value })}
                  placeholder="Instruksi tambahan untuk asatidz dan santri..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJadwalModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  {editingJadwal ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL / DRAWER: Lihat & Upload Santri Per Kelas (Excel) */}
      {/* ============================================================ */}
      {viewSantriClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-200" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base">
                    Daftar Santri: {viewSantriClass.nama}
                  </h4>
                  <p className="text-[11px] text-emerald-200">
                    Wali Kelas: {viewSantriClass.waliKelas || 'Belum ada'} • Tingkat: {viewSantriClass.tingkat}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewSantriClass(null)}
                className="text-emerald-200 hover:text-white font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50 flex-shrink-0">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={santriSearch}
                  onChange={(e) => setSantriSearch(e.target.value)}
                  placeholder="Cari nama / NIS santri..."
                  className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Excel Upload & Manual Add Buttons (Admin) */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  {/* Hidden Santri Excel File Input */}
                  <input
                    type="file"
                    ref={santriFileInputRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleSantriExcelUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => santriFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
                    title="Upload file Excel nama santri khusus kelas ini"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Excel Santri</span>
                  </button>

                  <button
                    onClick={() => downloadSantriTemplateExcel(viewSantriClass.nama)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition"
                    title="Download template Excel santri untuk kelas ini"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Template</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingSantri(null);
                      setManualSantriForm({
                        nis: '',
                        nama: '',
                        jenisKelamin: 'L',
                        halaqah: 'Halaqah Tahfidz',
                        kamar: 'Asrama Santri',
                      });
                      setManualSantriModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manual</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upload Notification Alert */}
            {santriUploadNotice && (
              <div
                className={`p-2.5 text-xs flex items-center gap-2 ${
                  santriUploadNotice.success
                    ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-b border-rose-200'
                }`}
              >
                {santriUploadNotice.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{santriUploadNotice.message}</span>
              </div>
            )}

            {/* Santri Table List */}
            <div className="flex-1 overflow-y-auto p-3">
              {(() => {
                const filtered = getSantriForKelas(viewSantriClass, allSantri)
                  .filter(
                    (s) =>
                      s.nama.toLowerCase().includes(santriSearch.toLowerCase()) ||
                      s.nis.includes(santriSearch)
                  );

                if (filtered.length === 0) {
                  return (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      {santriSearch
                        ? 'Tidak ada santri yang cocok dengan pencarian.'
                        : 'Belum ada santri di kelas ini. Klik "Upload Excel Santri" untuk mengisi nama-nama santri sekaligus.'}
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50">
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">NIS</th>
                        <th className="py-2 px-3">Nama Santri</th>
                        <th className="py-2 px-2 text-center">L/P</th>
                        <th className="py-2 px-3">Halaqah</th>
                        <th className="py-2 px-3">Kamar</th>
                        {isAdmin && <th className="py-2 px-3 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((santri, idx) => (
                        <tr key={santri.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-700">{santri.nis}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{santri.nama}</td>
                          <td className="py-2 px-2 text-center font-semibold text-slate-600">{santri.jenisKelamin}</td>
                          <td className="py-2 px-3 text-emerald-800">{santri.halaqah || '-'}</td>
                          <td className="py-2 px-3 text-slate-600">{santri.kamar || '-'}</td>
                          {isAdmin && (
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSantri(santri);
                                    setManualSantriForm({
                                      nis: santri.nis,
                                      nama: santri.nama,
                                      jenisKelamin: santri.jenisKelamin,
                                      halaqah: santri.halaqah || '',
                                      kamar: santri.kamar || '',
                                    });
                                    setManualSantriModal(true);
                                  }}
                                  className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded transition"
                                  title="Edit Data Santri"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSantri(santri.id, santri.nama)}
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition"
                                  title="Hapus Santri"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total Santri Terdaftar: <strong>{getSantriForKelas(viewSantriClass, allSantri).length}</strong>
              </span>
              <button
                onClick={() => setViewSantriClass(null)}
                className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah Santri Manual ke Kelas (Admin) */}
      {/* ============================================================ */}
      {manualSantriModal && viewSantriClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                {editingSantri ? 'Edit Data Santri' : `Tambah Santri ke ${viewSantriClass.nama}`}
              </h4>
              <button
                onClick={() => setManualSantriModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualSantri} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NIS (Nomor Induk Santri)
                </label>
                <input
                  type="text"
                  value={manualSantriForm.nis}
                  onChange={(e) => setManualSantriForm({ ...manualSantriForm, nis: e.target.value })}
                  placeholder="Contoh: 202507012"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Santri
                </label>
                <input
                  type="text"
                  value={manualSantriForm.nama}
                  onChange={(e) => setManualSantriForm({ ...manualSantriForm, nama: e.target.value })}
                  placeholder="Nama santri..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={manualSantriForm.jenisKelamin}
                    onChange={(e) => setManualSantriForm({ ...manualSantriForm, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Asrama / Kamar
                  </label>
                  <input
                    type="text"
                    value={manualSantriForm.kamar}
                    onChange={(e) => setManualSantriForm({ ...manualSantriForm, kamar: e.target.value })}
                    placeholder="Asrama Abu Bakar..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Halaqah Tahfidz
                </label>
                <input
                  type="text"
                  value={manualSantriForm.halaqah}
                  onChange={(e) => setManualSantriForm({ ...manualSantriForm, halaqah: e.target.value })}
                  placeholder="Contoh: Halaqah Imam Ashim"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualSantriModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  {editingSantri ? 'Perbarui Santri' : 'Tambahkan Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH KELAS BARU */}
      {/* ============================================================ */}
      {kelasModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingKelas ? 'Edit Data Kelas' : 'Tambah Kelas / Halaqah Baru'}
              </h4>
              <button
                onClick={() => setKelasModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKelas} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={kelasForm.nama}
                  onChange={(e) => setKelasForm({ ...kelasForm, nama: e.target.value })}
                  placeholder="Contoh: Kelas 1A Tahfidz (Putra)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat (Kelas 1 - 6)
                  </label>
                  <select
                    value={kelasForm.tingkat}
                    onChange={(e) => setKelasForm({ ...kelasForm, tingkat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {TINGKAT_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kapasitas Santri
                  </label>
                  <input
                    type="number"
                    value={kelasForm.kapasitas}
                    onChange={(e) => setKelasForm({ ...kelasForm, kapasitas: parseInt(e.target.value) || 25 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Wali Kelas Pembina (Sinkron Akun Guru)
                </label>
                <input
                  type="text"
                  list="wali-kelas-list"
                  value={kelasForm.waliKelas}
                  onChange={(e) => setKelasForm({ ...kelasForm, waliKelas: e.target.value })}
                  placeholder="Pilih atau ketik nama Ustadz / Pembina"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <datalist id="wali-kelas-list">
                  {allAsatidz.map((g) => (
                    <option key={g.id} value={g.nama}>
                      {g.nip ? `NIP: ${g.nip}` : 'Asatidz'}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* FITUR: Upload Santri (File Excel) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Upload Santri</span>
                    <span className="text-[10px] font-normal text-slate-400">(File Excel)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => downloadSantriTemplateExcel(kelasForm.nama || 'Kelas_Santri')}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                    title="Download template Excel (.xlsx) untuk mengisi nama santri"
                  >
                    <Download className="w-3 h-3" />
                    <span>Template Excel</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={modalSantriFileInputRef}
                  onChange={handleModalSantriUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                {!modalSantriFile ? (
                  <div
                    onClick={() => modalSantriFileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl p-3 text-center cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-emerald-700 transition">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span>Upload Santri</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isParsingSantri
                        ? 'Sedang membaca file Excel...'
                        : 'Klik untuk memilih file Excel (.xlsx, .xls) nama-nama santri'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {modalSantriFile.name}
                          </p>
                          <p className="text-[10px] text-emerald-800 font-semibold">
                            {modalParsedSantri.length} nama santri terbaca siap disimpan
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => modalSantriFileInputRef.current?.click()}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 bg-white border border-emerald-200 rounded-md shadow-2xs"
                        >
                          Ganti
                        </button>
                        <button
                          type="button"
                          onClick={handleClearModalSantri}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                          title="Batal upload file ini"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {modalParsedSantri.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-emerald-200/60 text-[10px] text-slate-600">
                        <p className="font-semibold text-emerald-900 mb-0.5">Pratinjau Nama Santri:</p>
                        <div className="max-h-16 overflow-y-auto space-y-0.5 font-mono text-[10px] bg-white/70 p-1.5 rounded border border-emerald-100">
                          {modalParsedSantri.slice(0, 5).map((s, idx) => (
                            <div key={idx} className="truncate">
                              {idx + 1}. {s.nama} {s.nis ? `(${s.nis})` : ''} - {s.jenisKelamin}
                            </div>
                          ))}
                          {modalParsedSantri.length > 5 && (
                            <div className="text-emerald-700 italic font-sans font-medium pt-0.5">
                              ...dan {modalParsedSantri.length - 5} santri lainnya
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {modalSantriNotice && !modalSantriNotice.success && (
                  <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>{modalSantriNotice.message}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setKelasModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable in-app deletion confirmation modal */}
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
