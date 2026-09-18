import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  downloadKelasTemplateExcel,
  parseKelasExcel,
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
}) => {
  // Tabs: only kelas, mapel, jadwal (the old upload santri per kelas tab has been removed per user request)
  const [activeTab, setActiveTab] = useState<'kelas' | 'mapel' | 'jadwal'>('kelas');
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

  // Santri List Drawer / Modal per Class
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

  // --- Mapel State ---
  const [mapelModal, setMapelModal] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
  const [mapelForm, setMapelForm] = useState({
    kode: '',
    nama: '',
    kategori: 'Tahfidz' as MataPelajaran['kategori'],
    kkm: 75,
  });

  // --- Jadwal Ujian State ---
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [jadwalModal, setJadwalModal] = useState(false);
  const [jadwalForm, setJadwalForm] = useState({
    judul: '',
    tanggalUjian: '',
    keterangan: '',
    imageUrl: '',
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
    alert(`Berhasil mengimpor ${newClasses.length} kelas baru ke sistem!`);
    setKelasModal(false);
    setKelasExcelFile(null);
    setParsedKelasList([]);
    setParseKelasStatus(null);
  };

  // Add Santri manually to a class
  const handleSaveManualSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewSantriClass) return;

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

  const handleDeleteSantri = (id: string) => {
    if (confirm('Hapus santri ini dari daftar kelas?')) {
      onUpdateSantri(allSantri.filter((s) => s.id !== id));
    }
  };

  // Jadwal Ujian Upload (converts image file to data URL)
  const handleJadwalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setJadwalForm((prev) => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalForm.imageUrl) {
      alert('Silakan pilih file gambar jadwal ujian terlebih dahulu.');
      return;
    }
    const newJadwal: JadwalUjianItem = {
      id: `jdw-${Date.now()}`,
      termId: currentTerm.id,
      judul: jadwalForm.judul,
      tanggalUjian: jadwalForm.tanggalUjian,
      imageUrl: jadwalForm.imageUrl,
      keterangan: jadwalForm.keterangan,
    };
    onUpdateJadwal([newJadwal, ...allJadwal]);
    setJadwalModal(false);
    setJadwalForm({ judul: '', tanggalUjian: '', keterangan: '', imageUrl: '' });
  };

  const handleDeleteJadwal = (id: string) => {
    if (confirm('Hapus gambar jadwal ujian ini?')) {
      onUpdateJadwal(allJadwal.filter((j) => j.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          
          <button
            id="tab-lembaga-kelas"
            onClick={() => setActiveTab('kelas')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'kelas'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Daftar Kelas ({allKelas.length})</span>
          </button>

          <button
            id="tab-lembaga-mapel"
            onClick={() => setActiveTab('mapel')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'mapel'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mata Pelajaran ({allMapel.length})</span>
          </button>

          <button
            id="tab-lembaga-jadwal"
            onClick={() => setActiveTab('jadwal')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'jadwal'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal Ujian (Poster Gambar)</span>
          </button>

        </div>

        <div className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
          Lembaga Akademik PPTQ Alhusna
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DAFTAR KELAS (With Excel Upload inside Tambah Kelas Baru) */}
      {/* ============================================================ */}
      {activeTab === 'kelas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-5 h-5 text-emerald-600" />
                  <span>Daftar Halaqah &amp; Kelas Santri</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola struktur kelas, wali kelas pembina, dan kuota santri per halaqah.
                </p>
              </div>

              {/* Only Admin can add classes */}
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kelas Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* Classes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allKelas.map((kelas) => {
              const studentCount = allSantri.filter((s) => s.kelasId === kelas.id).length;
              return (
                <div
                  key={kelas.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition group"
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

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
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
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Lihat Santri ({studentCount})</span>
                    </button>

                    {/* Only Admin can edit or delete class */}
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
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus kelas ${kelas.nama}? Data santri di kelas ini akan terpengaruh.`)) {
                              onUpdateKelas(allKelas.filter((k) => k.id !== kelas.id));
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Daftar Mata Pelajaran Ujian</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar kurikulum pelajaran kepesantrenan (Tahfidz, Diniyyah, Bahasa Arab, dan Umum).
                </p>
              </div>

              {/* Only Admin can add mapel */}
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Mapel Baru</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMapel.map((mapel) => (
              <div
                key={mapel.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition"
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

                {/* Admin controls for mapel */}
                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus mata pelajaran ${mapel.nama}?`)) {
                          onUpdateMapel(allMapel.filter((m) => m.id !== mapel.id));
                        }
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus Mapel"
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
      {/* TAB 3: JADWAL UJIAN (DALAM BENTUK GAMBAR) */}
      {/* ============================================================ */}
      {activeTab === 'jadwal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>Jadwal Ujian Santri (Format Gambar)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jadwal resmi imtihan santri dalam bentuk gambar, dikelola oleh admin dan dapat dilihat oleh seluruh asatidz.
                </p>
              </div>

              {/* Only Admin can upload schedule poster */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setJadwalForm({
                      judul: `Jadwal Imtihan Niha'i ${currentTerm.label}`,
                      tanggalUjian: '15 - 21 Desember',
                      keterangan: 'Jadwal resmi ujian semester santri.',
                      imageUrl: '',
                    });
                    setJadwalModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Poster Jadwal Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* Jadwal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allJadwal.map((jadwal) => (
              <div
                key={jadwal.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-emerald-300 transition"
              >
                <div>
                  {/* Image Display */}
                  <div
                    onClick={() => setPreviewImage(jadwal.imageUrl)}
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

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {jadwal.tanggalUjian}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {jadwal.judul}
                    </h4>

                    {jadwal.keterangan && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {jadwal.keterangan}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-3 pt-3">
                  <button
                    onClick={() => setPreviewImage(jadwal.imageUrl)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Ukuran Penuh</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={jadwal.imageUrl}
                      download={`Jadwal_Ujian_Alhusna_${jadwal.id}.png`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                      title="Download Gambar"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {/* Admin delete button */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteJadwal(jadwal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Poster Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Fullscreen Image Preview */}
      {/* ============================================================ */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold text-xl"
            >
              ✕ Tutup
            </button>
            <img
              src={previewImage}
              alt="Jadwal Ujian Penuh"
              className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl bg-white"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Upload Poster Jadwal Ujian (Admin) */}
      {/* ============================================================ */}
      {jadwalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                Upload Poster Jadwal Ujian
              </h4>
              <button
                onClick={() => setJadwalModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Jadwal Ujian
                </label>
                <input
                  type="text"
                  value={jadwalForm.judul}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, judul: e.target.value })}
                  placeholder="Contoh: Jadwal Ujian Akhir Semester Ganjil"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rentang Tanggal Pelaksanaan
                </label>
                <input
                  type="text"
                  value={jadwalForm.tanggalUjian}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, tanggalUjian: e.target.value })}
                  placeholder="Contoh: 15 - 22 Desember 2025"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  File Gambar Jadwal (PNG / JPG / JPEG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleJadwalImageUpload}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  required
                />
                {jadwalForm.imageUrl && (
                  <div className="mt-2 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={jadwalForm.imageUrl}
                      alt="Pratinjau"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  value={jadwalForm.keterangan}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, keterangan: e.target.value })}
                  placeholder="Contoh: Seluruh santri wajib hadir tepat waktu..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJadwalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
                >
                  Simpan Gambar Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH KELAS BARU (WITH EXCEL UPLOAD OPTION) */}
      {/* ============================================================ */}
      {kelasModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                {editingKelas ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h4>
              <button
                onClick={() => setKelasModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher (Manual vs Upload Excel) - Only for New Classes */}
            {!editingKelas && (
              <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKelasModalMode('manual')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    kelasModalMode === 'manual'
                      ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Input Manual 1 Kelas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKelasModalMode('excel')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    kelasModalMode === 'excel'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload File Excel (.xlsx)</span>
                </button>
              </div>
            )}

            {/* Sub-view 1: Manual Form */}
            {kelasModalMode === 'manual' || editingKelas ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingKelas) {
                    onUpdateKelas(
                      allKelas.map((k) => (k.id === editingKelas.id ? { ...k, ...kelasForm } : k))
                    );
                  } else {
                    onUpdateKelas([
                      ...allKelas,
                      {
                        id: `kls-${Date.now()}`,
                        ...kelasForm,
                      },
                    ]);
                  }
                  setKelasModal(false);
                }}
                className="p-5 space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kelas
                  </label>
                  <input
                    type="text"
                    value={kelasForm.nama}
                    onChange={(e) => setKelasForm({ ...kelasForm, nama: e.target.value })}
                    placeholder="Contoh: Kelas 7C Tahfidz (Putri)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tingkat / Jenjang
                    </label>
                    <input
                      type="text"
                      value={kelasForm.tingkat}
                      onChange={(e) => setKelasForm({ ...kelasForm, tingkat: e.target.value })}
                      placeholder="Contoh: Kelas 7"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kapasitas Santri
                    </label>
                    <input
                      type="number"
                      value={kelasForm.kapasitas}
                      onChange={(e) => setKelasForm({ ...kelasForm, kapasitas: parseInt(e.target.value) || 25 })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wali Kelas / Ustadz Pembina
                  </label>
                  <input
                    type="text"
                    value={kelasForm.waliKelas}
                    onChange={(e) => setKelasForm({ ...kelasForm, waliKelas: e.target.value })}
                    placeholder="Contoh: Ust. Syihabuddin Al-Bantani"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setKelasModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
                  >
                    Simpan Data Kelas
                  </button>
                </div>
              </form>
            ) : (
              /* Sub-view 2: Upload Excel File for Classes */
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Format Berkas Excel Kelas
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Kolom: No, Nama Kelas, Tingkat, Kapasitas, Wali Kelas
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadKelasTemplateExcel()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                </div>

                {/* Upload File Input */}
                <div className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-slate-50 hover:border-emerald-500 transition text-center">
                  <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Pilih Berkas Excel Daftar Kelas (.xlsx, .xls, .csv)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 mb-3">
                    Sistem otomatis membaca baris data kelas di berkas
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{kelasExcelFile ? kelasExcelFile.name : 'Pilih File Excel'}</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleKelasExcelFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Status Notice */}
                {parseKelasStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      parseKelasStatus.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                  >
                    {parseKelasStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span>{parseKelasStatus.message}</span>
                  </div>
                )}

                {/* Preview of Parsed Classes */}
                {parsedKelasList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      Pratinjau Data Kelas ({parsedKelasList.length} Kelas Terdeteksi):
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                      {parsedKelasList.map((k, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{k.nama}</span>
                            <span className="text-[11px] text-slate-500 ml-2">({k.tingkat})</span>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            {k.waliKelas || 'Wali belum diisi'} • Kap: {k.kapasitas}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setKelasModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={parsedKelasList.length === 0}
                    onClick={handleCommitKelasExcel}
                    className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition shadow-xs flex items-center gap-1.5 ${
                      parsedKelasList.length > 0
                        ? 'bg-emerald-700 hover:bg-emerald-800 cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Impor {parsedKelasList.length} Kelas ke Sistem</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Tambah/Edit Mapel (Admin) */}
      {/* ============================================================ */}
      {mapelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">
                {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h4>
              <button
                onClick={() => setMapelModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingMapel) {
                  onUpdateMapel(
                    allMapel.map((m) => (m.id === editingMapel.id ? { ...m, ...mapelForm } : m))
                  );
                } else {
                  onUpdateMapel([
                    ...allMapel,
                    {
                      id: `mapel-${Date.now()}`,
                      ...mapelForm,
                    },
                  ]);
                }
                setMapelModal(false);
              }}
              className="p-5 space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Mapel
                  </label>
                  <input
                    type="text"
                    value={mapelForm.kode}
                    onChange={(e) => setMapelForm({ ...mapelForm, kode: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={mapelForm.kategori}
                    onChange={(e) => setMapelForm({ ...mapelForm, kategori: e.target.value as MataPelajaran['kategori'] })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Tahfidz">Tahfidz</option>
                    <option value="Diniyyah">Diniyyah</option>
                    <option value="Bahasa">Bahasa</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={mapelForm.nama}
                  onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })}
                  placeholder="Contoh: Fiqih Ibadah"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nilai KKM (Kriteria Ketuntasan Minimal)
                </label>
                <input
                  type="number"
                  value={mapelForm.kkm}
                  onChange={(e) => setMapelForm({ ...mapelForm, kkm: parseInt(e.target.value) || 75 })}
                  min={0}
                  max={100}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMapelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL / DRAWER: Lihat Data Santri Per Kelas */}
      {/* ============================================================ */}
      {viewSantriClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between flex-shrink-0">
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
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 flex-shrink-0">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={santriSearch}
                  onChange={(e) => setSantriSearch(e.target.value)}
                  placeholder="Cari nama atau NIS santri..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Admin can add santri manually */}
              {isAdmin && (
                <button
                  onClick={() => setManualSantriModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Santri</span>
                </button>
              )}
            </div>

            {/* Santri Table List */}
            <div className="flex-1 overflow-y-auto p-4">
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
                    <div className="py-12 text-center text-slate-400 text-xs">
                      {santriSearch
                        ? 'Tidak ada santri yang cocok dengan pencarian.'
                        : 'Belum ada santri terdaftar di kelas ini.'}
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">NIS</th>
                        <th className="py-2 px-3">Nama Santri</th>
                        <th className="py-2 px-3">L/P</th>
                        <th className="py-2 px-3">Halaqah</th>
                        <th className="py-2 px-3">Kamar</th>
                        {isAdmin && <th className="py-2 px-3 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((santri, idx) => (
                        <tr key={santri.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{santri.nis}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{santri.nama}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-600">{santri.jenisKelamin}</td>
                          <td className="py-2.5 px-3 text-emerald-800">{santri.halaqah || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{santri.kamar || '-'}</td>
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-right">
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
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
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

            <form onSubmit={handleSaveManualSantri} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIS (Nomor Induk Santri)
                </label>
                <input
                  type="text"
                  value={manualSantriForm.nis}
                  onChange={(e) => setManualSantriForm({ ...manualSantriForm, nis: e.target.value })}
                  placeholder="Contoh: 202507012"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Santri
                </label>
                <input
                  type="text"
                  value={manualSantriForm.nama}
                  onChange={(e) => setManualSantriForm({ ...manualSantriForm, nama: e.target.value })}
                  placeholder="Nama santri..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={manualSantriForm.jenisKelamin}
                    onChange={(e) => setManualSantriForm({ ...manualSantriForm, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Asrama / Kamar
                  </label>
                  <input
                    type="text"
                    value={manualSantriForm.kamar}
                    onChange={(e) => setManualSantriForm({ ...manualSantriForm, kamar: e.target.value })}
                    placeholder="Asrama Abu Bakar..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Halaqah Tahfidz
                </label>
                <input
                  type="text"
                  value={manualSantriForm.halaqah}
                  onChange={(e) => setManualSantriForm({ ...manualSantriForm, halaqah: e.target.value })}
                  placeholder="Contoh: Halaqah Imam Ashim"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualSantriModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
                >
                  Tambahkan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
