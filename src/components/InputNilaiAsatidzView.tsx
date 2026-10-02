import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  Santri,
  TugasMengajarItem,
} from '../types';
import {
  ClipboardEdit,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  Download,
  Upload,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  doesGradeMatchMapel,
  doesTugasBelongToAsatidz,
  doesTugasMatchKelas,
  getSantriForKelas,
} from '../utils/dataSyncHelpers';

interface InputNilaiAsatidzViewProps {
  currentTerm: AcademicTerm;
  activeGuru?: Asatidz;
  allAsatidz: Asatidz[];
  allKelas: Kelas[];
  allSantri: Santri[];
  allMapel: MataPelajaran[];
  allTugasMengajar: TugasMengajarItem[];
  allNilai: NilaiSantri[];
  onSaveNilaiBatch: (newEntries: NilaiSantri[]) => void;
}

export const InputNilaiAsatidzView: React.FC<InputNilaiAsatidzViewProps> = ({
  currentTerm,
  activeGuru,
  allAsatidz,
  allKelas,
  allSantri,
  allMapel,
  allTugasMengajar,
  allNilai,
  onSaveNilaiBatch,
}) => {
  const currentTeacher = activeGuru || allAsatidz[0];

  // Get all teaching assignments assigned to this teacher by Admin
  const teacherAssignments = useMemo(() => {
    if (!currentTeacher) return [];
    const assigned = allTugasMengajar.filter((t) =>
      doesTugasBelongToAsatidz(t, currentTeacher, allAsatidz)
    );

    if (assigned.length > 0) {
      const expanded: TugasMengajarItem[] = [];
      assigned.forEach((t) => {
        const matchedClasses = allKelas.filter((k) => doesTugasMatchKelas(t, k, allKelas));
        if (matchedClasses.length > 0) {
          matchedClasses.forEach((kls) => {
            expanded.push({
              ...t,
              id: `${t.id}-${kls.id}`,
              tingkat: kls.nama,
            });
          });
        } else {
          expanded.push(t);
        }
      });
      return expanded;
    }

    // Fallback ONLY if teacher explicitly has both kelasIds and mataPelajaranIds configured
    if (currentTeacher.kelasIds.length > 0 && currentTeacher.mataPelajaranIds.length > 0) {
      const fallbackList: TugasMengajarItem[] = [];
      const targetClasses = allKelas.filter((k) => currentTeacher.kelasIds.includes(k.id));
      const targetMapels = allMapel.filter((m) => currentTeacher.mataPelajaranIds.includes(m.id));

      targetClasses.forEach((kls) => {
        targetMapels.forEach((mp) => {
          fallbackList.push({
            id: `fb-${kls.id}-${mp.id}`,
            tingkat: kls.nama,
            namaMapel: mp.nama,
            asatidzId: currentTeacher.id,
            kkm: mp.kkm || 75,
          });
        });
      });
      return fallbackList;
    }

    return [];
  }, [currentTeacher, allAsatidz, allTugasMengajar, allKelas, allMapel]);

  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);
  const [searchSantri, setSearchSantri] = useState<string>('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTaskIndex >= teacherAssignments.length) {
      setSelectedTaskIndex(0);
    }
  }, [teacherAssignments.length, selectedTaskIndex]);

  const selectedTask = teacherAssignments[selectedTaskIndex] || null;

  // Resolve Kelas object from selectedTask.tingkat
  const activeKelas = useMemo(() => {
    if (!selectedTask) return null;
    return (
      allKelas.find((k) => doesTugasMatchKelas(selectedTask, k, allKelas)) ||
      allKelas[0] ||
      null
    );
  }, [selectedTask, allKelas]);

  // Resolve Mapel ID (if matching in allMapel, use its id so Rekapan & Raport sync seamlessly)
  const resolvedMapelId = useMemo(() => {
    if (!selectedTask) return '';
    const matched = allMapel.find(
      (m) =>
        m.nama.trim().toLowerCase() === selectedTask.namaMapel.trim().toLowerCase() ||
        m.id.trim().toLowerCase() === selectedTask.namaMapel.trim().toLowerCase()
    );
    return matched ? matched.id : selectedTask.namaMapel.trim();
  }, [selectedTask, allMapel]);

  // Santri in activeKelas
  const santriInClass = useMemo(() => {
    return getSantriForKelas(activeKelas, allSantri);
  }, [allSantri, activeKelas]);

  // Draft scores state per santriId
  const [draftScores, setDraftScores] = useState<
    Record<
      string,
      {
        harian: number;
        lisan: number;
        tulis: number;
        catatan: string;
      }
    >
  >({});

  // Load existing grades whenever selectedTask or activeKelas changes
  useEffect(() => {
    if (!activeKelas || !selectedTask) return;

    const existingGrades = allNilai.filter(
      (n) =>
        n.termId === currentTerm.id &&
        (n.kelasId === activeKelas.id ||
          santriInClass.some((s) => s.id === n.santriId)) &&
        (doesGradeMatchMapel(n.mapelId, resolvedMapelId, allMapel) ||
          doesGradeMatchMapel(n.mapelId, selectedTask.namaMapel, allMapel))
    );

    const nextDraft: Record<
      string,
      { harian: number; lisan: number; tulis: number; catatan: string }
    > = {};

    santriInClass.forEach((santri) => {
      const found = existingGrades.find((g) => g.santriId === santri.id);
      if (found) {
        nextDraft[santri.id] = {
          harian: found.nilaiHarian,
          lisan: found.nilaiLisan,
          tulis: found.nilaiTulis,
          catatan: found.catatan || 'Alhamdulillah, pertahankan prestasi.',
        };
      } else {
        nextDraft[santri.id] = {
          harian: 80,
          lisan: 80,
          tulis: 80,
          catatan: 'Baik, terus tingkatkan murajaah dan ketelitian.',
        };
      }
    });

    setDraftScores(nextDraft);
    setHasUnsavedChanges(false);
  }, [activeKelas, selectedTask, resolvedMapelId, currentTerm.id, allNilai, santriInClass, allMapel]);

  const calculateFinal = (harian: number, lisan: number, tulis: number) => {
    return Math.round((harian * 0.3 + lisan * 0.3 + tulis * 0.4) * 10) / 10;
  };

  const getPredikat = (final: number): { predikat: string; badgeClass: string } => {
    if (final >= 90)
      return { predikat: 'Mumtaz (A)', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (final >= 80)
      return { predikat: 'Jayyid Jiddan (B)', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200' };
    if (final >= 70)
      return { predikat: 'Jayyid (C)', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (final >= 60)
      return { predikat: 'Maqbul (D)', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { predikat: 'Rosib (E)', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' };
  };

  const handleScoreChange = (
    santriId: string,
    field: 'harian' | 'lisan' | 'tulis' | 'catatan',
    value: string | number
  ) => {
    setDraftScores((prev) => {
      const current = prev[santriId] || { harian: 80, lisan: 80, tulis: 80, catatan: '' };
      return {
        ...prev,
        [santriId]: {
          ...current,
          [field]:
            field === 'catatan'
              ? String(value)
              : Math.max(0, Math.min(100, Number(value) || 0)),
        },
      };
    });
    setHasUnsavedChanges(true);
    setNotice(null);
  };

  const handleSaveGrades = () => {
    if (!activeKelas || !selectedTask || !currentTeacher) return;

    const entries: NilaiSantri[] = santriInClass.map((santri) => {
      const d = draftScores[santri.id] || {
        harian: 80,
        lisan: 80,
        tulis: 80,
        catatan: 'Baik',
      };
      const nilaiAkhir = calculateFinal(d.harian, d.lisan, d.tulis);
      const { predikat } = getPredikat(nilaiAkhir);

      return {
        id: `nil-${currentTerm.id}-${activeKelas.id}-${santri.id}-${resolvedMapelId.replace(/[^a-zA-Z0-9]/g, '_')}`,
        termId: currentTerm.id,
        santriId: santri.id,
        kelasId: activeKelas.id,
        mapelId: resolvedMapelId,
        asatidzId: currentTeacher.id,
        nilaiHarian: d.harian,
        nilaiLisan: d.lisan,
        nilaiTulis: d.tulis,
        nilaiAkhir,
        predikat,
        catatan: d.catatan,
        tanggalInput: new Date().toISOString().slice(0, 10),
      };
    });

    onSaveNilaiBatch(entries);
    setHasUnsavedChanges(false);
    setNotice({
      type: 'success',
      message: `Alhamdulillah! Nilai mata pelajaran "${selectedTask.namaMapel}" untuk ${activeKelas.nama} (${entries.length} Santri) berhasil disimpan dan tersinkron ke Rekapan & Raport.`,
    });
  };

  // Export current class & subject grade sheet to Excel
  const handleExportExcel = () => {
    if (!activeKelas || !selectedTask) return;
    const rows: (string | number)[][] = [
      ['FORMULIR INPUT NILAI UJIAN SANTRI - PONDOK PESANTREN AL-HUSNA'],
      [`Periode: ${currentTerm.label}`],
      [`Kelas: ${activeKelas.nama} | Mata Pelajaran: ${selectedTask.namaMapel} | KKM: ${selectedTask.kkm || 75}`],
      [`Guru Pengampu: ${currentTeacher?.nama || '-'}`],
      [''],
      ['No', 'NIS', 'Nama Santri', 'L/P', 'Nilai Harian (30%)', 'Nilai Lisan (30%)', 'Nilai Tulis (40%)', 'Nilai Akhir', 'Predikat', 'Catatan Ustadz'],
    ];

    santriInClass.forEach((s, idx) => {
      const d = draftScores[s.id] || { harian: 80, lisan: 80, tulis: 80, catatan: '' };
      const akhir = calculateFinal(d.harian, d.lisan, d.tulis);
      const { predikat } = getPredikat(akhir);
      rows.push([
        idx + 1,
        s.nis,
        s.nama,
        s.jenisKelamin,
        d.harian,
        d.lisan,
        d.tulis,
        akhir,
        predikat,
        d.catatan,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Input Nilai');
    XLSX.writeFile(
      wb,
      `Nilai_${activeKelas.nama.replace(/\s+/g, '_')}_${selectedTask.namaMapel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    );
  };

  // Import grades from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 });

      let updatedCount = 0;
      const nextDraft = { ...draftScores };

      rawRows.forEach((row) => {
        if (!Array.isArray(row) || row.length < 5) return;
        const rowNis = String(row[1] ?? '').trim();
        const rowNama = String(row[2] ?? '').trim().toLowerCase();

        const matchedSantri = santriInClass.find(
          (s) =>
            (rowNis && s.nis === rowNis) ||
            (rowNama && s.nama.trim().toLowerCase() === rowNama)
        );

        if (matchedSantri) {
          const harian = Math.max(0, Math.min(100, Number(row[4]) || 80));
          const lisan = Math.max(0, Math.min(100, Number(row[5]) || 80));
          const tulis = Math.max(0, Math.min(100, Number(row[6]) || 80));
          const catatan = String(row[9] ?? nextDraft[matchedSantri.id]?.catatan ?? 'Baik');

          nextDraft[matchedSantri.id] = { harian, lisan, tulis, catatan };
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        setDraftScores(nextDraft);
        setHasUnsavedChanges(true);
        setNotice({
          type: 'success',
          message: `Berhasil membaca nilai ${updatedCount} santri dari file Excel. Jangan lupa klik "Simpan Nilai" untuk menyimpan ke sistem.`,
        });
      } else {
        setNotice({
          type: 'error',
          message: 'Tidak ditemukan baris nama/NIS santri yang cocok pada file Excel tersebut.',
        });
      }
    } catch {
      setNotice({
        type: 'error',
        message: 'Gagal membaca file Excel. Pastikan menggunakan format template yang sesuai.',
      });
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const filteredSantri = santriInClass.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchSantri.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchSantri.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb / Identity Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold shadow-xs">
            <ClipboardEdit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PORTAL ASATIDZ
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                INPUT NILAI MATA PELAJARAN SANTRI
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pengampu: <strong className="text-slate-800">{currentTeacher?.nama || '-'}</strong> • NIP: {currentTeacher?.nip || '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Semester Aktif:</span>
          <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {currentTerm.label}
          </span>
        </div>
      </div>

      {/* Alert Notification */}
      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabel 1: Daftar Mata Pelajaran & Kelas yang Ditugaskan Admin */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase">
                Tabel Tugas Mengajar &amp; Mata Pelajaran Anda ({teacherAssignments.length} Mapel)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih baris mata pelajaran dan kelas di bawah ini yang sudah diatur oleh Admin untuk mengisi nilai santri.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-2 px-3 text-center border-r border-slate-200 w-12">No</th>
                <th className="py-2 px-3.5 border-r border-slate-200 w-36">Kelas / Tingkat</th>
                <th className="py-2 px-3.5 border-r border-slate-200">Nama Mata Pelajaran</th>
                <th className="py-2 px-3 text-center border-r border-slate-200 w-20">KKM</th>
                <th className="py-2 px-3 text-center border-r border-slate-200 w-32">Jumlah Santri</th>
                <th className="py-2 px-3 text-center border-r border-slate-200 w-40">Status Input Nilai</th>
                <th className="py-2 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teacherAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 border-b border-slate-200">
                    Belum ada tugas mengajar yang diatur oleh Admin untuk akun <strong>{currentTeacher?.nama || 'Anda'}</strong>. Silakan hubungi Admin untuk mengatur tugas mengajar di menu Atur Tugas Mengajar.
                  </td>
                </tr>
              ) : (
                teacherAssignments.map((task, idx) => {
                  const klsObj = allKelas.find((k) => doesTugasMatchKelas(task, k, allKelas));
                  const santriListForTask = getSantriForKelas(klsObj, allSantri);
                  const sCount = santriListForTask.length;
                  const gradedCount = klsObj
                    ? allNilai.filter(
                        (n) =>
                          n.termId === currentTerm.id &&
                          (n.kelasId === klsObj.id ||
                            santriListForTask.some((s) => s.id === n.santriId)) &&
                          doesGradeMatchMapel(n.mapelId, task.namaMapel, allMapel)
                      ).length
                    : 0;

                  const isSelected = idx === selectedTaskIndex;
                  const isDone = sCount > 0 && gradedCount >= sCount;

                  return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskIndex(idx)}
                    className={`border-b border-slate-200 transition cursor-pointer ${
                      isSelected ? 'bg-emerald-50/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3.5 font-extrabold text-emerald-900 border-r border-slate-200">
                      {task.tingkat}
                    </td>
                    <td className="py-2 px-3.5 font-bold text-slate-900 border-r border-slate-200">
                      {task.namaMapel}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                      {task.kkm || 75}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                      {sCount} Santri
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200">
                      {isDone ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Lengkap ({gradedCount}/{sCount})
                        </span>
                      ) : gradedCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Terisi {gradedCount}/{sCount}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Belum Diinput
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskIndex(idx);
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {isSelected ? 'Sedang Aktif' : 'Input Nilai'}
                      </button>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel 2: Lembar Input Nilai Santri untuk Mata Pelajaran & Kelas Terpilih */}
      {selectedTask && activeKelas && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header & Action Toolbar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-800 text-amber-300 text-[11px] font-extrabold uppercase">
                  {activeKelas.nama}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase">
                  Input Nilai: {selectedTask.namaMapel}
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  (KKM: {selectedTask.kkm || 75})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Masukkan Nilai Harian (30%), Ujian Lisan (30%), dan Ujian Tulis (40%). Nilai Akhir dan Predikat dihitung otomatis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSantri}
                  onChange={(e) => setSearchSantri(e.target.value)}
                  placeholder="Cari nama / NIS santri..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 w-44"
                />
              </div>

              <input
                type="file"
                ref={excelInputRef}
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Download Format Excel</span>
              </button>

              <button
                type="button"
                onClick={handleSaveGrades}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Nilai ({santriInClass.length} Santri)</span>
              </button>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
              <span>Perubahan nilai belum disimpan. Klik tombol "Simpan Nilai" agar tersinkron ke Rekapan &amp; Raport.</span>
              <button
                type="button"
                onClick={handleSaveGrades}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-extrabold cursor-pointer"
              >
                Simpan Sekarang
              </button>
            </div>
          )}

          {/* Grade Input Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center border-r border-slate-200 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-28">NIS</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[180px]">Nama Lengkap Santri</th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-200 w-12">L/P</th>
                  <th className="py-2.5 px-2.5 text-center border-r border-slate-200 w-28">
                    Harian (30%)
                  </th>
                  <th className="py-2.5 px-2.5 text-center border-r border-slate-200 w-28">
                    Lisan (30%)
                  </th>
                  <th className="py-2.5 px-2.5 text-center border-r border-slate-200 w-28">
                    Tulis (40%)
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200 w-24 bg-emerald-50/60">
                    Nilai Akhir
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200 w-36">
                    Predikat (Taqdir)
                  </th>
                  <th className="py-2.5 px-3.5 min-w-[200px]">Catatan / Evaluasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSantri.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 border-b border-slate-200">
                      Tidak ada data santri di kelas ini.
                    </td>
                  </tr>
                ) : (
                  filteredSantri.map((santri, idx) => {
                    const d = draftScores[santri.id] || {
                      harian: 80,
                      lisan: 80,
                      tulis: 80,
                      catatan: '',
                    };
                    const akhir = calculateFinal(d.harian, d.lisan, d.tulis);
                    const { predikat, badgeClass } = getPredikat(akhir);
                    const kkm = selectedTask.kkm || 75;
                    const isBelowKkm = akhir < kkm;

                    return (
                      <tr
                        key={santri.id}
                        className="border-b border-slate-200 hover:bg-slate-50/80 transition"
                      >
                        <td className="py-2 px-3 text-center text-slate-500 font-medium border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-200">
                          {santri.nis}
                        </td>
                        <td className="py-2 px-3.5 font-bold text-slate-900 border-r border-slate-200">
                          {santri.nama}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-slate-600 border-r border-slate-200">
                          {santri.jenisKelamin}
                        </td>
                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={d.harian}
                            onChange={(e) => handleScoreChange(santri.id, 'harian', e.target.value)}
                            className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded-md font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={d.lisan}
                            onChange={(e) => handleScoreChange(santri.id, 'lisan', e.target.value)}
                            className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded-md font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={d.tulis}
                            onChange={(e) => handleScoreChange(santri.id, 'tulis', e.target.value)}
                            className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded-md font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                        <td
                          className={`py-2 px-3 text-center font-extrabold border-r border-slate-200 ${
                            isBelowKkm
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50/40 text-emerald-900'
                          }`}
                        >
                          {akhir}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200">
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold inline-block ${badgeClass}`}
                          >
                            {predikat}
                          </span>
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            value={d.catatan}
                            onChange={(e) => handleScoreChange(santri.id, 'catatan', e.target.value)}
                            placeholder="Catatan evaluasi santri..."
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>
                Total Santri <strong>{activeKelas.nama}</strong>: <strong>{santriInClass.length} Santri</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveGrades}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Nilai {selectedTask.namaMapel} ({activeKelas.nama})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
