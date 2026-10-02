import React, { useState } from 'react';
import {
  AcademicTerm,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PesantrenProfile,
  Santri,
} from '../types';
import {
  RaportConfig,
  RaportSectionId,
  RaportSignatureRole,
  DEFAULT_RAPORT_CONFIG,
} from '../utils/excelExport';
import { RaportSheetCard } from './RaportSheetCard';
import {
  Layout,
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  RotateCcw,
  Eye,
  Edit2,
  Sliders,
  CheckSquare,
} from 'lucide-react';

interface RaportLayoutEditorPanelProps {
  allKelas: Kelas[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  classObj?: Kelas;
  santriInClass: Santri[];
  currentTerm: AcademicTerm;
  profile: PesantrenProfile;
  effectiveMapelForClass: MataPelajaran[];
  termNilai: NilaiSantri[];
  classRankingsMap: Record<string, number>;
  raportConfig: RaportConfig;
  onUpdateConfig: (newConfig: RaportConfig) => void;
  autoFillPreviewGrades: boolean;
  onToggleAutoFill: (val: boolean) => void;
  onQuickUpdateGrade: (santri: Santri, mapel: MataPelajaran, newAkhir: number) => void;
  onExportExcel: () => void;
  onTriggerUploadExcel: () => void;
  onOpenFullConfigModal: () => void;
}

const SECTION_META: Record<
  RaportSectionId,
  { label: string; toggleKey?: keyof RaportConfig }
> = {
  bismillah: { label: 'Kalimat Bismillah', toggleKey: 'showBismillah' },
  kop: { label: 'Kop Surat Pesantren' },
  judul: { label: 'Judul Raport (Kasyfud Darajat)' },
  identitas: { label: 'Identitas Santri' },
  nilai: { label: 'Tabel Nilai Ujian Akademik' },
  kepribadian: { label: 'Tabel Nilai Kepribadian (6 Aspek)', toggleKey: 'showSikapAbsensi' },
  ttd: { label: 'Tanggal & Tanda Tangan 3 Pihak' },
};

const SIG_ROLE_SHORT: Record<RaportSignatureRole, string> = {
  orang_tua: 'Orang Tua / Wali',
  wali_kelas: 'Wali Kelas',
  pimpinan: 'Pimpinan / Mudir',
};

export const RaportLayoutEditorPanel: React.FC<RaportLayoutEditorPanelProps> = ({
  allKelas,
  selectedClassId,
  onSelectClassId,
  classObj,
  santriInClass,
  currentTerm,
  profile,
  effectiveMapelForClass,
  termNilai,
  classRankingsMap,
  raportConfig,
  onUpdateConfig,
  autoFillPreviewGrades,
  onToggleAutoFill,
  onQuickUpdateGrade,
  onExportExcel,
  onTriggerUploadExcel,
  onOpenFullConfigModal,
}) => {
  const [previewFormat, setPreviewFormat] = useState<'paper' | 'excel_grid'>('paper');
  const [selectedSantriIndex, setSelectedSantriIndex] = useState<number>(0);
  const [isInteractiveEdit, setIsInteractiveEdit] = useState<boolean>(true);

  const safeIndex =
    santriInClass.length > 0
      ? Math.min(selectedSantriIndex, santriInClass.length - 1)
      : 0;
  const currentSantri = santriInClass[safeIndex];

  const sectionOrder: RaportSectionId[] =
    Array.isArray(raportConfig.sectionOrder) && raportConfig.sectionOrder.length > 0
      ? raportConfig.sectionOrder
      : ['bismillah', 'kop', 'judul', 'identitas', 'nilai', 'kepribadian', 'ttd'];

  const signatureOrder: [RaportSignatureRole, RaportSignatureRole, RaportSignatureRole] =
    Array.isArray(raportConfig.signatureOrder) && raportConfig.signatureOrder.length === 3
      ? (raportConfig.signatureOrder as [
          RaportSignatureRole,
          RaportSignatureRole,
          RaportSignatureRole,
        ])
      : ['orang_tua', 'wali_kelas', 'pimpinan'];

  const handleMoveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    onUpdateConfig({ ...raportConfig, sectionOrder: next });
  };

  const handleSwapSignature = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= 3) return;
    const next = [...signatureOrder] as [
      RaportSignatureRole,
      RaportSignatureRole,
      RaportSignatureRole,
    ];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    onUpdateConfig({ ...raportConfig, signatureOrder: next });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden no-print">
      {/* Top Action Header */}
      <div className="bg-emerald-900 text-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-[11px] font-bold mb-1 border border-emerald-700">
            <Layout className="w-3.5 h-3.5" />
            <span>EDITOR TATA LETAK RAPORT &amp; SINKRONISASI EXCEL 1:1</span>
          </div>
          <h4 className="text-base sm:text-lg font-extrabold uppercase tracking-wide">
            Atur Posisi Tata Letak Raport &amp; Preview Hasil Excel (.xlsx)
          </h4>
          <p className="text-xs text-emerald-100 mt-0.5 max-w-2xl">
            Atur urutan bagian atas-bawah, jumlah kolom, posisi tanda tangan, serta edit nilai langsung. Saat Anda klik <strong>Unduh Raport Excel</strong>, susunan baris, kolom, dan merge cell di Excel <strong>100% sama persis dengan yang tampil di Preview</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Raport Excel (Sesuai Preview)</span>
          </button>

          <button
            type="button"
            onClick={onTriggerUploadExcel}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-600 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-amber-300" />
            <span>Upload Hasil Edit Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenFullConfigModal}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pengaturan Lengkap</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Sidebar Controls + Right Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
        {/* LEFT COLUMN: Layout & Position Controls (4 cols on XL) */}
        <div className="xl:col-span-4 p-4 sm:p-5 bg-slate-50/70 space-y-5 text-xs max-h-[880px] overflow-y-auto">
          {/* Class & Santri Selector */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Pilih Kelas &amp; Santri Preview</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {santriInClass.length} Santri
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Kelas Raport:
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    onSelectClassId(e.target.value);
                    setSelectedSantriIndex(0);
                  }}
                  className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-lg font-bold text-emerald-950 outline-none"
                >
                  {allKelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} — Wali: {k.waliKelas || '-'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Santri yang Ditampilkan di Preview:
                </label>
                <select
                  value={safeIndex}
                  onChange={(e) => setSelectedSantriIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none"
                >
                  {santriInClass.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {idx + 1}. {s.nama} (NIS: {s.nis})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 1. Urutan Posisi Bagian Raport */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider">
                1. Urutan Posisi Tata Letak (Atas → Bawah)
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...raportConfig,
                    sectionOrder: DEFAULT_RAPORT_CONFIG.sectionOrder,
                  })
                }
                className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Reset Urutan
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Klik panah <strong>↑ / ↓</strong> untuk mengatur posisi bagian. Urutan di bawah ini langsung mengubah posisi di Preview dan di lembar Excel:
            </p>

            <div className="space-y-1.5">
              {sectionOrder.map((secId, idx) => {
                const meta = SECTION_META[secId];
                if (!meta) return null;
                const isVisible = meta.toggleKey ? Boolean(raportConfig[meta.toggleKey]) : true;

                return (
                  <div
                    key={secId}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border transition ${
                      isVisible
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-100/60 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-emerald-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {meta.toggleKey && (
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={(e) =>
                            onUpdateConfig({
                              ...raportConfig,
                              [meta.toggleKey!]: e.target.checked,
                            })
                          }
                          className="w-3.5 h-3.5 accent-emerald-700 rounded cursor-pointer shrink-0"
                          title="Tampilkan / sembunyikan bagian ini"
                        />
                      )}
                      <span className="font-bold truncate text-[11px]">{meta.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSection(idx, -1)}
                        className="p-1 rounded bg-white hover:bg-emerald-50 disabled:opacity-30 border border-slate-300 text-slate-700 cursor-pointer"
                        title="Geser ke atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === sectionOrder.length - 1}
                        onClick={() => handleMoveSection(idx, 1)}
                        className="p-1 rounded bg-white hover:bg-emerald-50 disabled:opacity-30 border border-slate-300 text-slate-700 cursor-pointer"
                        title="Geser ke bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Posisi & Bentuk Tabel (Kop, Identitas, Kepribadian, Spasi) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="font-extrabold text-slate-900 uppercase tracking-wider">
              2. Pengaturan Posisi &amp; Bentuk Komponen
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Perataan Teks Kop Pesantren:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'left', label: 'Rata Kiri' },
                      { id: 'center', label: 'Rata Tengah' },
                      { id: 'right', label: 'Rata Kanan' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({ ...raportConfig, kopAlign: opt.id })
                      }
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                        (raportConfig.kopAlign || 'center') === opt.id
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tata Letak Identitas Santri:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: '2col', label: '2 Kolom (Kiri & Kanan)' },
                      { id: '1col', label: '1 Kolom Memanjang' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({ ...raportConfig, identitasLayout: opt.id })
                      }
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                        (raportConfig.identitasLayout || '2col') === opt.id
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bentuk Tabel Nilai Kepribadian (6 Aspek):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: '2col', label: '2 Kolom' },
                      { id: '1col', label: '1 Kolom' },
                      { id: 'horizontal', label: 'Horizontal' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({ ...raportConfig, kepribadianLayout: opt.id })
                      }
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                        (raportConfig.kepribadianLayout || '2col') === opt.id
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kolom Tabel Nilai Ujian yang Ditampilkan:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'showKKM', label: 'Kolom KKM' },
                    { key: 'showDetailNilai', label: 'Harian/Lisan/Tulis' },
                    { key: 'showTerbilang', label: 'Huruf / Terbilang' },
                    { key: 'showPredikat', label: 'Kolom Predikat' },
                    { key: 'showRanking', label: 'Baris Peringkat' },
                    { key: 'showArabic', label: 'Teks Bahasa Arab' },
                  ].map((col) => {
                    const k = col.key as keyof RaportConfig;
                    return (
                      <label
                        key={col.key}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:border-emerald-400"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(raportConfig[k])}
                          onChange={(e) =>
                            onUpdateConfig({
                              ...raportConfig,
                              [k]: e.target.checked,
                            })
                          }
                          className="w-3.5 h-3.5 accent-emerald-700 rounded"
                        />
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {col.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Posisi Kolom Tanda Tangan */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider">
                3. Posisi Tanda Tangan (Kiri - Tengah - Kanan)
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...raportConfig,
                    signatureOrder: [
                      signatureOrder[2],
                      signatureOrder[1],
                      signatureOrder[0],
                    ],
                  })
                }
                className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] border border-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Balik Kiri↔Kanan</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {signatureOrder.map((role, idx) => (
                <div
                  key={role}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-[10px]">
                      {idx === 0 ? 'Kiri' : idx === 1 ? 'Tengah' : 'Kanan'}
                    </span>
                    <span className="font-bold text-slate-900">{SIG_ROLE_SHORT[role]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleSwapSignature(idx, -1)}
                      className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={idx === 2}
                      onClick={() => handleSwapSignature(idx, 1)}
                      className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Posisi Tanggal &amp; Kota Cetak:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'left', label: 'Di Kiri' },
                    { id: 'center', label: 'Di Tengah' },
                    { id: 'right', label: 'Di Kanan' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onUpdateConfig({ ...raportConfig, signatureAlign: opt.id })
                    }
                    className={`py-1 px-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                      (raportConfig.signatureAlign || 'right') === opt.id
                        ? 'bg-emerald-800 text-white border-emerald-900'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Synchronized Preview (8 cols on XL) */}
        <div className="xl:col-span-8 p-4 sm:p-6 bg-slate-200/75 flex flex-col gap-4">
          {/* Preview Mode Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewFormat('paper')}
                className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewFormat === 'paper'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Lembar Cetak</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewFormat('excel_grid')}
                className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewFormat === 'excel_grid'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Preview Tabel Excel (.xlsx 1:1)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {previewFormat === 'paper' && (
                <button
                  type="button"
                  onClick={() => setIsInteractiveEdit(!isInteractiveEdit)}
                  className={`px-3 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                    isInteractiveEdit
                      ? 'bg-amber-100 text-amber-950 border-amber-400'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>
                    {isInteractiveEdit
                      ? '✓ Tombol Geser & Edit Langsung Aktif'
                      : 'Tampilkan Tombol Geser di Kertas'}
                  </span>
                </button>
              )}

              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFillPreviewGrades}
                  onChange={(e) => onToggleAutoFill(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-700 rounded"
                />
                <span>Isi Nilai Contoh Otomatis</span>
              </label>
            </div>
          </div>

          {/* Preview Sheet Canvas */}
          <div className="overflow-x-auto py-1">
            {!currentSantri ? (
              <div className="bg-white rounded-xl p-12 text-center text-slate-500 font-medium">
                Belum ada data santri di kelas ini.
              </div>
            ) : (
              <RaportSheetCard
                santri={currentSantri}
                santriIndex={safeIndex}
                totalSantriInClass={santriInClass.length}
                rank={classRankingsMap[currentSantri.id] || safeIndex + 1}
                kelas={classObj}
                currentTerm={currentTerm}
                profile={profile}
                allMapel={effectiveMapelForClass}
                santriGrades={termNilai.filter((n) => n.santriId === currentSantri.id)}
                config={raportConfig}
                autoFillPreviewGrades={autoFillPreviewGrades}
                isLiveEditMode={isInteractiveEdit}
                previewFormat={previewFormat}
                onQuickUpdateGrade={onQuickUpdateGrade}
                onUpdateConfig={onUpdateConfig}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
