import React, { useState, useRef } from 'react';
import {
  AcademicTerm,
  JadwalUjianItem,
  Kelas,
  MataPelajaran,
  RoleType,
  Santri,
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
} from '../utils/excelExport';

interface LembagaViewProps {
  currentTerm: AcademicTerm;
  allMapel: MataPelajaran[];
  onUpdateMapel: (updated: MataPelajaran[]) => void;
  allKelas: Kelas[];
  onUpdateKelas: (updated: Kelas[]) => void;
  allSantri: Santri[];
  onUpdateSantri: (updated: Santri[]) => void;
  allJadwal: JadwalUjianItem[];
  onUpdateJadwal: (updated: JadwalUjianItem[]) => void;
  currentRole: RoleType;
  activeSubTab?: string;
  onSelectSubTab?: (tab: 'kelas' | 'mapel' | 'jadwal') => void;
}

export const LembagaView: React.FC<LembagaViewProps> = ({
  currentTerm,
  allMapel,
  onUpdateMapel,
  allKelas,
  onUpdateKelas,
  allSantri,
  onUpdateSantri,
  allJadwal,
  onUpdateJadwal,
  currentRole,
  activeSubTab: propSubTab,
  onSelectSubTab,
}) => {
  const [internalTab, setInternalTab] = useState<'kelas' | 'mapel' | 'jadwal'>('kelas');
  const activeTab = (propSubTab as 'kelas' | 'mapel' | 'jadwal') || internalTab;
  const setActiveTab = (tab: 'kelas' | 'mapel' | 'jadwal') => {
    setInternalTab(tab);
    if (onSelectSubTab) onSelectSubTab(tab);
  };
  const isAdmin = currentRole === 'admin';

  // --- Kelas State ---
  const [kelasModal, setKelasModal] = useState(false);
  const [kelasModalMode, setKelasModalMode] = useState<'manual' | 'excel'>('manual');
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [kelasForm, setKelasForm] = useState({
    nama: '',
    tingkat: 'Kelas 7',
    waliKelas: '',
    kapasitas: 25,
  });

  // Excel Kelas Upload State
  const [kelasExcelFile, setKelasExcelFile] = useState<File | null>(null);
  const [parsedKelasList, setParsedKelasList] = useState<Omit<Kelas, 'id'>[]>([]);
  const [parseKelasStatus, setParseKelasStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Santri Drawer per Class State
  const [viewSantriClass, setViewSantriClass] = useState<Kelas | null>(null);
  const [santriSearch, setSantriSearch] = useState('');
  const [manualSantriModal, setManualSantriModal] = useState(false);
  const [manualSantriForm, setManualSantriForm] = useState({
    nis: '',
    nama: '',
    jenisKelamin: 'L' as 'L' | 'P',
    halaqah: 'Halaqah Tahfidz',
    kamar: 'Asrama Santri',
  });

  // Santri Excel Upload inside Class Drawer
  const santriFileInputRef = useRef<HTMLInputElement>(null);
  const [santriUploadNotice, setSantriUploadNotice] = useState<{ success?: boolean; message?: string } | null>(null);

  // --- Mapel State ---
  const [mapelModal, setMapelModal] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
  const [mapelForm, setMapelForm] = useState({
    kode: '',
    nama: '',
    kategori: 'Tahfidz' as MataPelajaran['kategori'],
    kkm: 75,
  });

  // --- Jadwal Ujian State (PDF & Image Support) ---
  const [previewDocUrl, setPreviewDocUrl] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);
  const [jadwalModal, setJadwalModal] = useState(false);
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
    window.alert(`Alhamdulillah, berhasil mengimpor ${newClasses.length} kelas baru!`);
    setKelasModal(false);
    setKelasExcelFile(null);
    setParsedKelasList([]);
    setParseKelasStatus(null);
  };

  // Save manual class
  const handleSaveKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasForm.nama.trim()) return;

    if (editingKelas) {
      const updated = allKelas.map((k) =>
        k.id === editingKelas.id ? { ...k, ...kelasForm } : k
      );
      onUpdateKelas(updated);
    } else {
      const newKelas: Kelas = {
        id: `kls-${Date.now()}`,
        ...kelasForm,
      };
      onUpdateKelas([...allKelas, newKelas]);
    }
    setKelasModal(false);
  };

  // Add Santri manually to a class
  const handleSaveManualSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewSantriClass || !manualSantriForm.nama.trim()) return;

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

    onUpdateSantri([...allSantri, newSantri]);
    setManualSantriModal(false);
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

        // Merge without duplicating same NIS
        const filteredExisting = allSantri.filter(
          (s) => !newSantriList.some((n) => n.nis && s.nis && n.nis === s.nis)
        );

        onUpdateSantri([...filteredExisting, ...newSantriList]);
        setSantriUploadNotice({
          success: true,
          message: `Alhamdulillah! Berhasil menambahkan ${newSantriList.length} santri ke kelas ${viewSantriClass.nama}.`,
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

  const handleDeleteSantri = (santriId: string) => {
    if (window.confirm('Hapus santri ini dari kelas?')) {
      onUpdateSantri(allSantri.filter((s) => s.id !== santriId));
    }
  };

  // --- Mapel Handlers ---
  const handleSaveMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapelForm.nama.trim()) return;

    if (editingMapel) {
      const updated = allMapel.map((m) =>
        m.id === editingMapel.id ? { ...m, ...mapelForm } : m
      );
      onUpdateMapel(updated);
    } else {
      const newMapel: MataPelajaran = {
        id: `mp-${Date.now()}`,
        ...mapelForm,
      };
      onUpdateMapel([...allMapel, newMapel]);
    }
    setMapelModal(false);
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
      window.alert('Mohon lengkapi judul dan unggah berkas jadwal (PDF atau Gambar)!');
      return;
    }

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
    setJadwalModal(false);
  };

  const handleDeleteJadwal = (id: string) => {
    if (window.confirm('Hapus berkas jadwal ujian ini?')) {
      onUpdateJadwal(allJadwal.filter((j) => j.id !== id));
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Active Sub-Section Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold shadow-xs">
            {activeTab === 'kelas' && <School className="w-4 h-4" />}
            {activeTab === 'mapel' && <BookOpen className="w-4 h-4" />}
            {activeTab === 'jadwal' && <Calendar className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Lembaga
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">
                {activeTab === 'kelas' && `Daftar Kelas & Santri (${allKelas.length} Kelas)`}
                {activeTab === 'mapel' && `Mata Pelajaran Ujian (${allMapel.length} Pelajaran)`}
                {activeTab === 'jadwal' && `Jadwal Ujian (${allJadwal.length} Berkas)`}
              </h2>
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
          {currentTerm.label}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DATA KELAS & SANTRI */}
      {/* ============================================================ */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-600" />
                <span>Daftar Halaqah &amp; Kelas Santri</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola struktur kelas, wali kelas pembina, dan daftar santri per halaqah.
              </p>
            </div>

            {isAdmin && (
              <button
                id="btn-tambah-kelas"
                onClick={() => {
                  setEditingKelas(null);
                  setKelasForm({
                    nama: '',
                    tingkat: 'Kelas 7',
                    waliKelas: '',
                    kapasitas: 25,
                  });
                  setKelasModalMode('manual');
                  setParsedKelasList([]);
                  setKelasExcelFile(null);
                  setParseKelasStatus(null);
                  setKelasModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelas Baru</span>
              </button>
            )}
          </div>

          {/* Classes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allKelas.map((kelas) => {
              const studentCount = allSantri.filter((s) => s.kelasId === kelas.id).length;
              return (
                <div
                  key={kelas.id}
                  className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {kelas.tingkat}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {studentCount} / {kelas.kapasitas || 25} Santri
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {kelas.nama}
                    </h4>

                    <div className="mt-2.5 p-2 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Wali Kelas:
                      </span>
                      <span className="font-bold text-slate-800">
                        {kelas.waliKelas || 'Belum Ditentukan'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setViewSantriClass(kelas);
                        setSantriSearch('');
                        setSantriUploadNotice(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Lihat &amp; Kelola Santri ({studentCount})</span>
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingKelas(kelas);
                            setKelasForm({
                              nama: kelas.nama,
                              tingkat: kelas.tingkat,
                              waliKelas: kelas.waliKelas || '',
                              kapasitas: kelas.kapasitas || 25,
                            });
                            setKelasModalMode('manual');
                            setKelasModal(true);
                          }}
                          className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Edit Kelas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus kelas ${kelas.nama}? Data santri di kelas ini akan terhapus.`)) {
                              onUpdateKelas(allKelas.filter((k) => k.id !== kelas.id));
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
      {/* TAB 2: MATA PELAJARAN */}
      {/* ============================================================ */}
      {activeTab === 'mapel' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Daftar Mata Pelajaran Ujian</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kurikulum pelajaran kepesantrenan (Tahfidz, Diniyyah, Bahasa Arab, dan Umum).
              </p>
            </div>

            {isAdmin && (
              <button
                id="btn-tambah-mapel"
                onClick={() => {
                  setEditingMapel(null);
                  setMapelForm({
                    kode: `MP-0${allMapel.length + 1}`,
                    nama: '',
                    kategori: 'Tahfidz',
                    kkm: 75,
                  });
                  setMapelModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mapel Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMapel.map((mapel) => (
              <div
                key={mapel.id}
                className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {mapel.kode}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {mapel.kategori}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {mapel.nama}
                  </h4>

                  <div className="mt-3 text-xs text-slate-600 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <span>Kriteria Ketuntasan Minimal:</span>
                    <span className="font-bold text-emerald-700">KKM {mapel.kkm}</span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setEditingMapel(mapel);
                        setMapelForm({
                          kode: mapel.kode,
                          nama: mapel.nama,
                          kategori: mapel.kategori,
                          kkm: mapel.kkm,
                        });
                        setMapelModal(true);
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                      title="Edit Mapel"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Hapus mata pelajaran ${mapel.nama}?`)) {
                          onUpdateMapel(allMapel.filter((m) => m.id !== mapel.id));
                        }
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus Mapel"
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
      {/* TAB 3: JADWAL UJIAN (PDF / GAMBAR RESMI) */}
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

          {/* Jadwal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allJadwal.map((jadwal) => {
              const isPdf =
                jadwal.imageUrl?.startsWith('data:application/pdf') ||
                jadwal.imageUrl?.toLowerCase().includes('.pdf');

              return (
                <div
                  key={jadwal.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-emerald-300 transition"
                >
                  <div>
                    {/* Preview header / thumbnail */}
                    {isPdf ? (
                      <div
                        onClick={() =>
                          setPreviewDocUrl({
                            url: jadwal.imageUrl,
                            title: jadwal.judul,
                            isPdf: true,
                          })
                        }
                        className="h-44 w-full bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer flex flex-col items-center justify-center p-4 border-b border-slate-200 group-hover:bg-slate-100 transition"
                      >
                        <FileText className="w-12 h-12 text-rose-600 mb-2" />
                        <span className="text-xs font-bold text-slate-800 text-center">
                          Dokumen Resmi (PDF)
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold mt-1">
                          Klik untuk Buka Layar Penuh →
                        </span>
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
                        className="relative aspect-video w-full bg-slate-100 cursor-pointer overflow-hidden border-b border-slate-200"
                        title="Klik untuk memperbesar gambar"
                      >
                        <img
                          src={jadwal.imageUrl}
                          alt={jadwal.judul}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                          <Eye className="w-5 h-5" />
                          <span>Klik Untuk Perbesar Gambar</span>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {jadwal.tanggalUjian}
                        </span>
                        {isPdf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                            PDF Format
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {jadwal.judul}
                      </h4>

                      {jadwal.keterangan && (
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {jadwal.keterangan}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 pt-3">
                    <button
                      onClick={() =>
                        setPreviewDocUrl({
                          url: jadwal.imageUrl,
                          title: jadwal.judul,
                          isPdf: isPdf,
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Layar Penuh</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={jadwal.imageUrl}
                        download={`Jadwal_Ujian_Alhusna_${jadwal.id}.${isPdf ? 'pdf' : 'png'}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                        title="Download Berkas"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteJadwal(jadwal.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                Upload Jadwal Ujian (PDF / Gambar)
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
                  required
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
                  Simpan Jadwal
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
                    onClick={() => setManualSantriModal(true)}
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
                const filtered = allSantri
                  .filter((s) => s.kelasId === viewSantriClass.id)
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
                              <button
                                onClick={() => handleDeleteSantri(santri.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
                Total Santri Terdaftar: <strong>{allSantri.filter((s) => s.kelasId === viewSantriClass.id).length}</strong>
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
                Tambah Santri ke {viewSantriClass.nama}
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
                  Tambahkan Santri
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
                  placeholder="Contoh: Kelas 7A Tahfidz (Putra)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat
                  </label>
                  <select
                    value={kelasForm.tingkat}
                    onChange={(e) => setKelasForm({ ...kelasForm, tingkat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Kelas 7">Kelas 7</option>
                    <option value="Kelas 8">Kelas 8</option>
                    <option value="Kelas 9">Kelas 9</option>
                    <option value="Takhasus">Takhasus</option>
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
                  Wali Kelas Pembina
                </label>
                <input
                  type="text"
                  value={kelasForm.waliKelas}
                  onChange={(e) => setKelasForm({ ...kelasForm, waliKelas: e.target.value })}
                  placeholder="Nama Ustadz / Pembina"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
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

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT MAPEL */}
      {/* ============================================================ */}
      {mapelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
              </h4>
              <button
                onClick={() => setMapelModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMapel} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Mapel
                  </label>
                  <input
                    type="text"
                    value={mapelForm.kode}
                    onChange={(e) => setMapelForm({ ...mapelForm, kode: e.target.value })}
                    placeholder="Contoh: MP-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={mapelForm.kategori}
                    onChange={(e) => setMapelForm({ ...mapelForm, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Tahfidz">Tahfidz</option>
                    <option value="Diniyyah">Diniyyah</option>
                    <option value="Bahasa Arab">Bahasa Arab</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={mapelForm.nama}
                  onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })}
                  placeholder="Contoh: Tahfidzul Qur'an (Juz 1-5)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  KKM (Kriteria Ketuntasan Minimal)
                </label>
                <input
                  type="number"
                  value={mapelForm.kkm}
                  onChange={(e) => setMapelForm({ ...mapelForm, kkm: parseInt(e.target.value) || 75 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  min={50}
                  max={100}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMapelModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
