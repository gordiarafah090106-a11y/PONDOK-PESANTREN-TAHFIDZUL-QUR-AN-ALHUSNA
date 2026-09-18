import React from 'react';
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
  Users,
  GraduationCap,
  School,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
  Award,
} from 'lucide-react';
import { TabKey } from './Navbar';

interface DashboardViewProps {
  profile: PesantrenProfile;
  currentTerm: AcademicTerm;
  allTerms: AcademicTerm[];
  onSelectTerm: (term: AcademicTerm) => void;
  allSantri: Santri[];
  allKelas: Kelas[];
  allMapel: MataPelajaran[];
  allAsatidz: Asatidz[];
  allNilai: NilaiSantri[];
  currentRole: RoleType;
  onNavigate: (tab: TabKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  currentTerm,
  allTerms,
  onSelectTerm,
  allSantri,
  allKelas,
  allMapel,
  allAsatidz,
  allNilai,
  currentRole,
  onNavigate,
}) => {
  // Filter nilai for the active academic term
  const termNilai = allNilai.filter((n) => n.termId === currentTerm.id);
  const activeSantri = allSantri.filter((s) => s.status === 'Aktif');

  // Calculate stats
  const totalSantri = activeSantri.length;
  const totalGuru = allAsatidz.length;
  const totalKelas = allKelas.length;
  const totalMapel = allMapel.length;
  const totalNilaiMasuk = termNilai.length;

  // Expected total grades if all active santri had grades for all mapels
  // Or simply based on class santri count
  const expectedTotalGrades = totalSantri * Math.min(totalMapel, 4);
  const completionPercentage =
    expectedTotalGrades > 0
      ? Math.min(100, Math.round((totalNilaiMasuk / expectedTotalGrades) * 100))
      : 0;

  // Calculate average score for current term
  const averageScore =
    termNilai.length > 0
      ? (termNilai.reduce((sum, n) => sum + n.nilaiAkhir, 0) / termNilai.length).toFixed(1)
      : '0.0';

  // Count Mumtaz (A), Jayyid Jiddan (B+), Jayyid (B), Maqbul (C), Rasib (D)
  const mumtazCount = termNilai.filter((n) => n.predikat.includes('Mumtaz')).length;
  const jayyidCount = termNilai.filter((n) => n.predikat.includes('Jayyid')).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hero Card with Semester Switcher Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-md p-6 sm:p-8">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <BookOpen className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sistem Penilaian Semester Terintegrasi</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              Selamat Datang di Portal Nilai {profile.nama}
            </h2>

            <p className="text-emerald-100/90 text-sm leading-relaxed mb-4">
              Aplikasi memproses penginputan nilai ujian santri, jadwal imtihan, serta otomatisasi kompilasi rekapitulasi nilai per guru dalam satu berkas Excel multi-kelas.
            </p>

            {/* Prominent Academic Term Indicator */}
            <div className="inline-flex flex-wrap items-center gap-3 bg-emerald-950/40 backdrop-blur-xs border border-emerald-500/30 p-2.5 sm:p-3 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-200 text-xs sm:text-sm font-medium">
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span>Periode Aktif:</span>
                <span className="font-bold text-white bg-emerald-600/80 px-2.5 py-0.5 rounded-md border border-emerald-400/40">
                  {currentTerm.label}
                </span>
              </div>
              
              <div className="text-xs text-emerald-200/80">
                (Data nilai terisolasi per semester)
              </div>
            </div>
          </div>

          {/* Pesantren Official Crest Badge in Hero */}
          <div className="hidden sm:flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 self-center lg:self-auto">
            <img
              src={profile.logoUrl || '/logo_alhusna.jpg'}
              alt="Logo Alhusna"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-lg ring-4 ring-amber-400/80 bg-white p-1"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
              }}
            />
          </div>
        </div>
      </div>

      {/* Primary Key Stats Cards: Guru, Siswa, Kelas as specifically required */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Stat: Jumlah Guru (Asatidz) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Guru (Asatidz)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalGuru} <span className="text-sm font-normal text-slate-500">Ustadz/ah</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Semua asatidz terdaftar</span>
          </div>
        </div>

        {/* Stat: Jumlah Siswa (Santri) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Siswa (Santri)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalSantri} <span className="text-sm font-normal text-slate-500">Santri</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Status Aktif & Mengikuti Ujian</span>
          </div>
        </div>

        {/* Stat: Jumlah Kelas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Kelas
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalKelas} <span className="text-sm font-normal text-slate-500">Halaqah/Kelas</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <School className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Tingkat Wustho & Takhasus</span>
          </div>
        </div>

        {/* Stat: Nilai Terinput di Semester Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nilai Terinput ({currentTerm.semester.toUpperCase()})
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                {totalNilaiMasuk} <span className="text-sm font-normal text-slate-500">Entri</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
            <span>Rata-rata: <strong className="text-slate-900">{averageScore}</strong></span>
            <span className="text-emerald-700 font-semibold">{mumtazCount} Mumtaz (A)</span>
          </div>
        </div>

      </div>

      {/* Academic Term Switcher Card (Explicit Requirement Demonstration) */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Pengaturan Semester & Tahun Ajaran Aktif</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Mengubah tahun ajaran ini akan mengubah seluruh data nilai ujian yang ditampilkan di aplikasi.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full self-start sm:self-auto">
            Mode Semester Terisolasi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
          {allTerms.map((term) => {
            const isSelected = currentTerm.id === term.id;
            const termGradesCount = allNilai.filter((n) => n.termId === term.id).length;
            return (
              <div
                key={term.id}
                onClick={() => onSelectTerm(term)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-900">
                    {term.semester}
                  </span>
                  {isSelected ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-full">
                      Sedang Aktif
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium hover:text-emerald-700">
                      Klik untuk beralih
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900">{term.label}</div>
                <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                  <span>Nilai Tercatat:</span>
                  <span className="font-bold text-slate-800">{termGradesCount} santri</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress per Kelas & Status Penginputan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress List per Kelas */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Status Kelengkapan Nilai Per Kelas ({currentTerm.label})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau progres guru yang telah menginputkan nilai santri
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {allKelas.map((kelas) => {
              const santriInKelas = allSantri.filter(
                (s) => s.kelasId === kelas.id && s.status === 'Aktif'
              );
              const gradesInKelas = termNilai.filter((n) => n.kelasId === kelas.id);
              
              // Total expected grades in this class: students count * subjects
              const totalStudents = santriInKelas.length;
              // Unique students with at least 1 grade
              const gradedStudentsCount = new Set(gradesInKelas.map((g) => g.santriId)).size;
              const percent =
                totalStudents > 0
                  ? Math.min(100, Math.round((gradedStudentsCount / totalStudents) * 100))
                  : 0;

              return (
                <div
                  key={kelas.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{kelas.nama}</span>
                      <span className="text-[11px] text-slate-500">
                        ({totalStudents} Santri)
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800">
                      {gradedStudentsCount} / {totalStudents} Santri Dinilai ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent === 100
                          ? 'bg-emerald-600'
                          : percent > 50
                          ? 'bg-emerald-500'
                          : percent > 0
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Wali Kelas: {kelas.waliKelas || '-'}</span>
                    <button
                      onClick={() => onNavigate('asatidz')}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                    >
                      Buka Lembar Nilai →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Highlights / Asatidz Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Daftar Asatidz Penguji</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Guru pengampu mata pelajaran yang bertugas mengisi nilai semester ini:
            </p>

            <div className="space-y-3">
              {allAsatidz.map((guru) => {
                const teacherGrades = termNilai.filter((n) => n.asatidzId === guru.id);
                const teacherClasses = allKelas.filter((k) =>
                  teacherGrades.some((g) => g.kelasId === k.id)
                );

                return (
                  <div
                    key={guru.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{guru.nama}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {guru.mataPelajaranIds
                          .map((id) => allMapel.find((m) => m.id === id)?.nama)
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {teacherGrades.length} Nilai
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {teacherClasses.length} kelas diinput
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('rekapan')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Download Berkas Excel Per Guru</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
