import React, { useState } from 'react';
import { Kelas, MataPelajaran, Santri } from '../types';
import {
  RaportConfig,
  RaportSectionId,
  RaportSignatureRole,
  DEFAULT_RAPORT_CONFIG,
  getMapelArabicName,
  getDefaultSantriExtra,
} from '../utils/excelExport';
import {
  Edit2,
  RotateCcw,
  Check,
  BookOpen,
  Users,
  Palette,
  FileSpreadsheet,
  Layout,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
} from 'lucide-react';

interface RaportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RaportConfig;
  onChangeConfig: (newConfig: RaportConfig) => void;
  allMapel: MataPelajaran[];
  santriInClass: Santri[];
  currentKelas?: Kelas;
  onExportExcel: () => void;
  onTriggerImportExcel: () => void;
}

const SECTION_LABELS: Record<RaportSectionId, { title: string; desc: string }> = {
  bismillah: {
    title: 'Kalimat Bismillah (بِسْمِ اللَّهِ...)',
    desc: 'Kalimat pembuka di bagian paling atas lembar raport',
  },
  kop: {
    title: 'Kop Surat Pesantren & Logo',
    desc: 'Nama Yayasan, Nama Pondok Pesantren (Arab & Indonesia), dan Alamat',
  },
  judul: {
    title: 'Judul Dokumen Raport (Kasyfud Darajat)',
    desc: 'Judul كشف الدرجات / Laporan Hasil Belajar Santri',
  },
  identitas: {
    title: 'Blok Identitas Santri',
    desc: 'Nama Santri, NIS, Kelas, Semester, Tahun Pelajaran, dan Halaqah',
  },
  nilai: {
    title: 'Tabel Nilai Ujian Akademik & Rata-Rata',
    desc: 'Daftar mata pelajaran, KKM, nilai angka, huruf/terbilang, predikat & ranking',
  },
  kepribadian: {
    title: 'Tabel Nilai Kepribadian Santri (6 Aspek)',
    desc: 'Akhlaq, Kebersihan, Ibadah, Kesungguhan, Disiplin Diri & Ketaatan',
  },
  ttd: {
    title: 'Tanggal Cetak & Tanda Tangan 3 Pihak',
    desc: 'Kolom tanda tangan Orang Tua/Wali, Wali Kelas, dan Pimpinan Pesantren',
  },
};

const SIG_LABELS: Record<RaportSignatureRole, string> = {
  orang_tua: 'Orang Tua / Wali Santri',
  wali_kelas: 'Wali Kelas (المشرف)',
  pimpinan: "Pimpinan / Mudir Ma'had",
};

export const RaportConfigModal: React.FC<RaportConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  allMapel,
  santriInClass,
  currentKelas,
  onExportExcel,
  onTriggerImportExcel,
}) => {
  const [activeTab, setActiveTab] = useState<
    'tata_letak' | 'gaya' | 'kop_ttd' | 'mapel_arab' | 'sikap_absensi'
  >('tata_letak');
  const [selectedSantriId, setSelectedSantriId] = useState<string>(santriInClass[0]?.id || '');

  if (!isOpen) return null;

  const activeSantriId = selectedSantriId || santriInClass[0]?.id || '';
  const activeSantriObj = santriInClass.find((s) => s.id === activeSantriId);
  const currentExtra = getDefaultSantriExtra(activeSantriObj || activeSantriId, config.santriExtra);

  const sectionOrder: RaportSectionId[] =
    Array.isArray(config.sectionOrder) && config.sectionOrder.length > 0
      ? config.sectionOrder
      : ['bismillah', 'kop', 'judul', 'identitas', 'nilai', 'kepribadian', 'ttd'];

  const signatureOrder: [RaportSignatureRole, RaportSignatureRole, RaportSignatureRole] =
    Array.isArray(config.signatureOrder) && config.signatureOrder.length === 3
      ? (config.signatureOrder as [RaportSignatureRole, RaportSignatureRole, RaportSignatureRole])
      : ['orang_tua', 'wali_kelas', 'pimpinan'];

  const handleMoveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    onChangeConfig({ ...config, sectionOrder: next });
  };

  const handleSwapSig = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= 3) return;
    const next = [...signatureOrder] as [
      RaportSignatureRole,
      RaportSignatureRole,
      RaportSignatureRole,
    ];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    onChangeConfig({ ...config, signatureOrder: next });
  };

  const handleUpdateExtra = (field: keyof typeof currentExtra, val: string) => {
    if (!activeSantriId) return;
    onChangeConfig({
      ...config,
      santriExtra: {
        ...config.santriExtra,
        [activeSantriId]: {
          ...currentExtra,
          [field]: val,
        },
      },
    });
  };

  const handleUpdateMapelArab = (mapelId: string, arabText: string) => {
    onChangeConfig({
      ...config,
      customMapelArab: {
        ...config.customMapelArab,
        [mapelId]: arabText,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base flex items-center gap-2 uppercase tracking-wide">
              <Edit2 className="w-4 h-4 text-amber-300" />
              <span>Atur Tata Letak, Posisi &amp; Format Raport (Sinkron Excel 1:1)</span>
            </h4>
            <p className="text-[11px] text-emerald-200 mt-0.5">
              Semua pengaturan urutan posisi &amp; tata letak di sini otomatis diterapkan sama persis pada Preview Cetak dan Hasil Export Excel (.xlsx).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white text-xl font-bold px-2 py-0.5 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Excel Quick Sync Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-semibold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Hasil Excel 100% sama persis dengan Preview (urutan blok, jumlah kolom, merge cell &amp; posisi TTD):</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
            >
              1. Unduh Raport Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={onTriggerImportExcel}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-[11px] transition cursor-pointer"
            >
              2. Upload Hasil Edit Excel
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('tata_letak')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tata_letak'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Posisi &amp; Tata Letak</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gaya')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'gaya'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Gaya &amp; Kolom Tabel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kop_ttd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'kop_ttd'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Kop Surat &amp; Tanda Tangan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mapel_arab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'mapel_arab'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bahasa Arab Mapel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sikap_absensi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'sikap_absensi'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nilai Kepribadian</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'tata_letak' && (
            <div className="space-y-5">
              {/* 1. Urutan Bagian / Blok Raport */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-extrabold text-slate-900 uppercase tracking-wider">
                      1. Atur Urutan Posisi Bagian Raport (Atas ke Bawah)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Gunakan tombol <strong>Geser Atas / Bawah</strong> untuk memindahkan posisi bagian di Preview dan di Excel:
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  {sectionOrder.map((secId, idx) => {
                    const info = SECTION_LABELS[secId];
                    if (!info) return null;
                    return (
                      <div
                        key={secId}
                        className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-extrabold flex items-center justify-center text-[11px]">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{info.title}</div>
                            <div className="text-[10px] text-slate-500">{info.desc}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(idx, -1)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-35 border border-slate-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>Atas</span>
                          </button>
                          <button
                            type="button"
                            disabled={idx === sectionOrder.length - 1}
                            onClick={() => handleMoveSection(idx, 1)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-35 border border-slate-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>Bawah</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Pengaturan Tata Letak Komponen (Identitas, Kepribadian, Kop, Spasi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Posisi Perataan Teks Kop Surat
                  </label>
                  <select
                    value={config.kopAlign || 'center'}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        kopAlign: e.target.value as RaportConfig['kopAlign'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="center">Rata Tengah (Standar Pesantren)</option>
                    <option value="left">Rata Kiri</option>
                    <option value="right">Rata Kanan (Gaya Timur Tengah)</option>
                  </select>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Tata Letak Blok Identitas Santri
                  </label>
                  <select
                    value={config.identitasLayout || '2col'}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        identitasLayout: e.target.value as RaportConfig['identitasLayout'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="2col">2 Kolom Kiri &amp; Kanan (Hemat Ruang Vertikal)</option>
                    <option value="1col">1 Kolom Memanjang ke Bawah</option>
                  </select>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Tata Letak Tabel Nilai Kepribadian (6 Aspek)
                  </label>
                  <select
                    value={config.kepribadianLayout || '2col'}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        kepribadianLayout: e.target.value as RaportConfig['kepribadianLayout'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="2col">2 Kolom Berdampingan (1-3 Kiri, 4-6 Kanan)</option>
                    <option value="1col">1 Kolom Vertikal (Urut 1 sampai 6 ke Bawah)</option>
                    <option value="horizontal">Horizontal Menyamping (6 Kolom Sejajar)</option>
                  </select>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Jarak Spasi Antar Bagian &amp; Posisi Tanggal TTD
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={config.sectionGap || 'normal'}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          sectionGap: e.target.value as RaportConfig['sectionGap'],
                        })
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                    >
                      <option value="compact">Spasi Rapat</option>
                      <option value="normal">Spasi Normal</option>
                      <option value="relaxed">Spasi Longgar</option>
                    </select>
                    <select
                      value={config.signatureAlign || 'right'}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          signatureAlign: e.target.value as RaportConfig['signatureAlign'],
                        })
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                    >
                      <option value="right">Tanggal di Kanan</option>
                      <option value="center">Tanggal di Tengah</option>
                      <option value="left">Tanggal di Kiri</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Posisi Urutan Tanda Tangan (Kiri, Tengah, Kanan) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h5 className="font-extrabold text-slate-900 uppercase tracking-wider">
                      3. Posisi Kolom Tanda Tangan (Kiri — Tengah — Kanan)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Atur siapa yang berada di sebelah Kiri, Tengah, dan Kanan pada lembar raport &amp; Excel:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeConfig({
                        ...config,
                        signatureOrder: [
                          signatureOrder[2],
                          signatureOrder[1],
                          signatureOrder[0],
                        ],
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold flex items-center gap-1.5 border border-amber-300 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Tukar Posisi Kiri ↔ Kanan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {signatureOrder.map((role, idx) => (
                    <div
                      key={role}
                      className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-2"
                    >
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                        {idx === 0 ? 'Posisi Kiri' : idx === 1 ? 'Posisi Tengah' : 'Posisi Kanan'}
                      </div>
                      <div className="font-bold text-slate-900">{SIG_LABELS[role]}</div>
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleSwapSig(idx, -1)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-35 text-[10px] font-bold border border-slate-300 cursor-pointer"
                        >
                          ← Geser Kiri
                        </button>
                        <button
                          type="button"
                          disabled={idx === 2}
                          onClick={() => handleSwapSig(idx, 1)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-35 text-[10px] font-bold border border-slate-300 cursor-pointer"
                        >
                          Geser Kanan →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gaya' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model Format Raport</label>
                  <select
                    value={config.templateStyle}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        templateStyle: e.target.value as RaportConfig['templateStyle'],
                        showArabic: e.target.value !== 'nasional',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="bilingual">Pesantren Bilingual (Indonesia &amp; Arab / كشف الدرجات)</option>
                    <option value="arabic">Pesantren Timur Tengah (Full Bahasa Arab RTL)</option>
                    <option value="nasional">Madrasah / Kemenag (Bahasa Indonesia Resmi)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arah Orientasi Tabel</label>
                  <select
                    value={config.tableDirection}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        tableDirection: e.target.value as 'ltr' | 'rtl',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ltr">Kiri ke Kanan (Nomor di Kiri — Standar Indonesia)</option>
                    <option value="rtl">Kanan ke Kiri (الرقم di Kanan — Standar Arab RTL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gaya Huruf / Font Raport</label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        fontFamily: e.target.value as RaportConfig['fontFamily'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="font-serif">Klasik Formal (Times / Serif Resmi)</option>
                    <option value="font-amiri">Kaligrafi Kitab / Amiri (Tradisional Pesantren)</option>
                    <option value="font-sans">Modern Clean (Plus Jakarta Sans)</option>
                    <option value="font-mono">Monospace (Ketikan Mesin / Courier)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skema Warna Tabel &amp; Garis</label>
                  <select
                    value={config.colorTheme}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        colorTheme: e.target.value as RaportConfig['colorTheme'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="classic_bw">Hitam Putih Klasik (Tegas &amp; Hemat Tinta Cetak)</option>
                    <option value="emerald">Hijau Pesantren Al-Husna (Emerald Formal)</option>
                    <option value="gold_classic">Klasik Emas &amp; Hijau Tua (Mu&apos;allimin)</option>
                    <option value="royal_blue">Biru Akademik (Madrasah Modern)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                  Pengaturan Komponen &amp; Kolom Raport
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'showArabic', label: 'Tampilkan Teks & Istilah Bahasa Arab' },
                    { key: 'showBismillah', label: 'Tampilkan Kalimat Bismillah di Atas Kop' },
                    { key: 'showLogo', label: 'Tampilkan Logo Pondok di Kop Surat' },
                    { key: 'showBorderFrame', label: 'Tampilkan Bingkai Ganda (Frame Raport)' },
                    { key: 'showAllMapel', label: 'Tampilkan Semua Mata Pelajaran Kurikulum' },
                    { key: 'showKKM', label: 'Tampilkan Kolom KKM (الحد الأدنى)' },
                    { key: 'showDetailNilai', label: 'Tampilkan Kolom Harian, Lisan & Tulis' },
                    { key: 'showTerbilang', label: 'Tampilkan Nilai Huruf / Terbilang (بالحروف)' },
                    { key: 'showPredikat', label: 'Tampilkan Kolom Predikat / Taqdir (التقدير)' },
                    { key: 'showSikapAbsensi', label: 'Tampilkan Tabel Nilai Kepribadian Santri' },
                    { key: 'showRanking', label: 'Tampilkan Peringkat / Ranking Kelas (الترتيب)' },
                  ].map((item) => {
                    const k = item.key as keyof RaportConfig;
                    const checked = Boolean(config[k]);
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-emerald-400 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            onChangeConfig({
                              ...config,
                              [k]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kop_ttd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Yayasan (Indonesia)</label>
                  <input
                    type="text"
                    value={config.yayasanName}
                    onChange={(e) => onChangeConfig({ ...config, yayasanName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Yayasan (Arab)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={config.yayasanNameArab}
                    onChange={(e) => onChangeConfig({ ...config, yayasanNameArab: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-amiri text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Pesantren / Ma&apos;had (Arab)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={config.pesantrenNameArab}
                    onChange={(e) => onChangeConfig({ ...config, pesantrenNameArab: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-amiri text-base font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Dokumen Raport (Indonesia)</label>
                  <input
                    type="text"
                    value={config.headerTitle}
                    onChange={(e) => onChangeConfig({ ...config, headerTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Dokumen Raport (Arab)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={config.headerTitleArab}
                    onChange={(e) => onChangeConfig({ ...config, headerTitleArab: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-amiri text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran Hijriyah</label>
                  <input
                    type="text"
                    value={config.tahunHijriyah}
                    onChange={(e) => onChangeConfig({ ...config, tahunHijriyah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Wali Kelas (Kosongkan = Otomatis Kelas)</label>
                  <input
                    type="text"
                    placeholder={currentKelas?.waliKelas || 'Otomatis sesuai kelas'}
                    value={config.waliKelasCustom}
                    onChange={(e) => onChangeConfig({ ...config, waliKelasCustom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pimpinan / Mudir TTD (Indonesia)</label>
                  <input
                    type="text"
                    value={config.pejabatName}
                    onChange={(e) => onChangeConfig({ ...config, pejabatName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pimpinan / Mudir TTD (Arab)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={config.pejabatNameArab}
                    onChange={(e) => onChangeConfig({ ...config, pejabatNameArab: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-amiri text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan Pimpinan (Indonesia)</label>
                  <input
                    type="text"
                    value={config.pejabatJabatan}
                    onChange={(e) => onChangeConfig({ ...config, pejabatJabatan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan Pimpinan (Arab)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={config.pejabatJabatanArab}
                    onChange={(e) => onChangeConfig({ ...config, pejabatJabatanArab: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-amiri text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kota Cetak (Indonesia &amp; Arab)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={config.lokasiCetak}
                      onChange={(e) => onChangeConfig({ ...config, lokasiCetak: e.target.value })}
                      placeholder="Bungo"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      value={config.lokasiCetakArab}
                      onChange={(e) => onChangeConfig({ ...config, lokasiCetakArab: e.target.value })}
                      placeholder="بونغو"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-amiri"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Cetak (Masehi &amp; Hijriyah)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={config.tanggalCetak}
                      onChange={(e) => onChangeConfig({ ...config, tanggalCetak: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      value={config.tanggalCetakArab}
                      onChange={(e) => onChangeConfig({ ...config, tanggalCetakArab: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-amiri"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mapel_arab' && (
            <div className="space-y-3">
              <p className="text-slate-600">
                Sesuaikan penulisan nama Bahasa Arab (المواد الدراسية) untuk setiap mata pelajaran yang tampil di lembar raport:
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-3 text-left">Kode</th>
                      <th className="py-2 px-3 text-left">Mata Pelajaran (Indonesia)</th>
                      <th className="py-2 px-3 text-right">Nama Mata Pelajaran (Arab / بالعربية)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {allMapel.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2 px-3 font-mono text-slate-500">{m.kode}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{m.nama}</td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            dir="rtl"
                            value={getMapelArabicName(m, config.customMapelArab)}
                            onChange={(e) => handleUpdateMapelArab(m.id, e.target.value)}
                            className="w-full px-2.5 py-1 border border-slate-300 rounded-lg font-amiri text-sm font-bold text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sikap_absensi' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Santri untuk Edit Nilai Kepribadian</label>
                <select
                  value={activeSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-950"
                >
                  {santriInClass.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} (NIS: {s.nis})
                    </option>
                  ))}
                </select>
              </div>

              {activeSantriId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">1. AKHLAQ (الأخلاق)</label>
                    <input
                      type="text"
                      value={currentExtra.akhlaq}
                      onChange={(e) => handleUpdateExtra('akhlaq', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">2. KEBERSIHAN (النظافة)</label>
                    <input
                      type="text"
                      value={currentExtra.kebersihan}
                      onChange={(e) => handleUpdateExtra('kebersihan', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">3. IBADAH (العبادة)</label>
                    <input
                      type="text"
                      value={currentExtra.ibadah}
                      onChange={(e) => handleUpdateExtra('ibadah', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">4. KESUNGGUHAN (الجد والاجتهاد)</label>
                    <input
                      type="text"
                      value={currentExtra.kesungguhan}
                      onChange={(e) => handleUpdateExtra('kesungguhan', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">5. DISIPLIN DIRI (الانضباط الذاتي)</label>
                    <input
                      type="text"
                      value={currentExtra.disiplinDiri}
                      onChange={(e) => handleUpdateExtra('disiplinDiri', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">6. KETAATAN (الطاعة والامتثال)</label>
                    <input
                      type="text"
                      value={currentExtra.ketaatan}
                      onChange={(e) => handleUpdateExtra('ketaatan', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onChangeConfig(DEFAULT_RAPORT_CONFIG)}
            className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default Pesantren</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan &amp; Terapkan Format</span>
          </button>
        </div>
      </div>
    </div>
  );
};
