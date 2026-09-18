import React, { useState } from 'react';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PesantrenProfile,
  RoleType,
  Santri,
} from '../types';
import {
  FileSpreadsheet,
  Download,
  Eye,
  Printer,
  GraduationCap,
  Users,
  Search,
  BookOpen,
  School,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  exportMasterRecapToExcel,
  exportTeacherRecapToExcel,
} from '../utils/excelExport';

interface RekapanViewProps {
  currentTerm: AcademicTerm;
  allNilai: NilaiSantri[];
  allSantri: Santri[];
  allKelas: Kelas[];
  allMapel: MataPelajaran[];
  allAsatidz: Asatidz[];
  profile: PesantrenProfile;
  currentRole: RoleType;
}

export const RekapanView: React.FC<RekapanViewProps> = ({
  currentTerm,
  allNilai,
  allSantri,
  allKelas,
  allMapel,
  allAsatidz,
  profile,
  currentRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuruPreview, setSelectedGuruPreview] = useState<Asatidz | null>(null);
  const [previewTabKelasId, setPreviewTabKelasId] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter grades for active semester term
  const termNilai = allNilai.filter((n) => n.termId === currentTerm.id);

  // Teachers who have input grades or are assigned
  const teachersWithStats = allAsatidz.map((guru) => {
    const teacherGrades = termNilai.filter((n) => n.asatidzId === guru.id);
    const classesTaught = allKelas.filter((k) =>
      teacherGrades.some((g) => g.kelasId === k.id) || guru.kelasIds.includes(k.id)
    );
    const classesInputted = allKelas.filter((k) =>
      teacherGrades.some((g) => g.kelasId === k.id)
    );
    const totalGraded = teacherGrades.length;
    const avgScore =
      totalGraded > 0
        ? (teacherGrades.reduce((sum, g) => sum + g.nilaiAkhir, 0) / totalGraded).toFixed(1)
        : '-';

    return {
      guru,
      classesTaught,
      classesInputted,
      totalGraded,
      avgScore,
      teacherGrades,
    };
  });

  const filteredTeachers = teachersWithStats.filter(
    (item) =>
      item.guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guru.mataPelajaranIds.some((mid) =>
        allMapel.find((m) => m.id === mid)?.nama.toLowerCase().includes(searchQuery.toLowerCase())
      )
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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold mb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ekspor & Rekapitulasi Berkas Nilai</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Hasil Rekapan Nilai Santri per Guru ({currentTerm.label})
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Setiap nama ustadz/guru tertera di bawah. Mengklik nama guru atau tombol Excel akan menghasilkan <strong>satu berkas Excel utuh (.xlsx)</strong> yang memuat semua nilai dari seluruh kelas yang diinput oleh guru tersebut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Master Excel Button (Admin Only) */}
            {currentRole === 'admin' && (
              <button
                id="btn-download-master-excel"
                onClick={handleDownloadMasterExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition"
                title="Unduh seluruh rekap nilai pesantren"
              >
                <Download className="w-4 h-4 text-emerald-300" />
                <span>Unduh Master Rekap Pesantren</span>
              </button>
            )}

            {/* Print Official Letterhead Button */}
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

      {/* Teachers Rekap Cards List (Per-Guru Organization as specifically requested) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTeachers.map(({ guru, classesTaught, classesInputted, totalGraded, avgScore, teacherGrades }) => {
          const mapelNames = guru.mataPelajaranIds
            .map((id) => allMapel.find((m) => m.id === id)?.nama)
            .filter(Boolean)
            .join(', ');

          const isComplete =
            classesInputted.length >= classesTaught.length && classesTaught.length > 0;

          return (
            <div
              key={guru.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between group"
            >
              <div>
                {/* Header: Teacher Name & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-base border border-emerald-200 flex-shrink-0 group-hover:bg-emerald-100 transition">
                      <GraduationCap className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      {/* Clickable Teacher Name triggers Excel download as requested: "ketika kita klik nama nya maka keluar lah satu file exel yang memuat semua nilai dari guru tadi" */}
                      <button
                        onClick={() => handleDownloadTeacherExcel(guru)}
                        className="text-left font-bold text-sm sm:text-base text-emerald-950 hover:text-emerald-700 hover:underline leading-snug flex items-center gap-1.5"
                        title="Klik nama guru untuk unduh file Excel semua kelas"
                      >
                        <span>{guru.nama}</span>
                        <Download className="w-3.5 h-3.5 text-emerald-600 opacity-60 group-hover:opacity-100" />
                      </button>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {guru.gelar || guru.nip || 'Asatidz Pengampu'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      totalGraded > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {totalGraded > 0 ? `${totalGraded} Santri Terisi` : 'Belum Input'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Mata Pelajaran Diampu
                    </div>
                    <div className="font-bold text-emerald-900 mt-0.5">
                      {mapelNames || 'Semua Mata Pelajaran'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Kelas Diinput
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {classesInputted.length} dari {classesTaught.length} Kelas
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Rata-Rata Nilai
                      </div>
                      <div className="font-bold text-emerald-700 mt-0.5">
                        {avgScore}
                      </div>
                    </div>
                  </div>

                  {/* List of classes taught */}
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Cakupan Kelas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {classesTaught.map((cls) => {
                        const hasGrades = teacherGrades.some((g) => g.kelasId === cls.id);
                        return (
                          <span
                            key={cls.id}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              hasGrades
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {cls.nama} {hasGrades && '✓'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenPreview(guru)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lihat Nilai</span>
                </button>

                {/* Primary Excel Download Button for Teacher (All classes in 1 file) */}
                <button
                  id={`btn-download-excel-${guru.id}`}
                  onClick={() => handleDownloadTeacherExcel(guru)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                  title="Unduh 1 file Excel memuat semua kelas guru ini"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Unduh Excel Guru Ini</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* MODAL: Preview Nilai Guru (Class by Class Tabs) */}
      {/* ============================================================ */}
      {selectedGuruPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h4 className="text-base sm:text-lg font-bold">
                  Pratinjau Lembar Nilai: {selectedGuruPreview.nama}
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
                const santriList = allSantri.filter(
                  (s) => s.kelasId === previewTabKelasId && s.status === 'Aktif'
                );
                const gradesInClass = termNilai.filter(
                  (n) =>
                    n.asatidzId === selectedGuruPreview.id && n.kelasId === previewTabKelasId
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {santriList.map((santri, idx) => {
                            const grade = gradesInClass.find((g) => g.santriId === santri.id);
                            const mapelObj = grade ? allMapel.find((m) => m.id === grade.mapelId) : null;

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
                                  {mapelObj?.nama || '-'}
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
      {/* MODAL: Cetak Format Resmi (Kop Surat Pesantren Alhusna) */}
      {/* ============================================================ */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between print:hidden">
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Printer className="w-4 h-4" />
                <span>Format Cetak Berkas Rekap Nilai Resmi</span>
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

    </div>
  );
};
