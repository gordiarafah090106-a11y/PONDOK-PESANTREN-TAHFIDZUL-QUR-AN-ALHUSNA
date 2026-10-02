import * as XLSX from 'xlsx';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PesantrenProfile,
  Santri,
  SantriKepribadianData,
} from '../types';

/**
 * Export all grades input by a single teacher across all classes into ONE unified Excel file (.xlsx)
 * As requested: "jika 1 guru mengimput 5 kelas maka dalam satu file yang mengatas namakan guru tadi terisi semua nilai yang dia input"
 */
export function exportTeacherRecapToExcel(
  teacher: Asatidz,
  term: AcademicTerm,
  allNilai: NilaiSantri[],
  allSantri: Santri[],
  allKelas: Kelas[],
  allMapel: MataPelajaran[],
  profile: PesantrenProfile
) {
  const wb = XLSX.utils.book_new();

  // Find all grades by this teacher in this term
  const teacherNilai = allNilai.filter(
    (n) => n.asatidzId === teacher.id && n.termId === term.id
  );

  // Group by Kelas
  const classesWithGrades = allKelas.filter((k) =>
    teacherNilai.some((n) => n.kelasId === k.id)
  );

  // If no grades yet, use the classes assigned to this teacher
  const targetClasses = classesWithGrades.length > 0
    ? classesWithGrades
    : allKelas.filter((k) => teacher.kelasIds.includes(k.id));

  // 1. Cover / Summary Sheet
  const summaryData: (string | number)[][] = [
    [profile.nama],
    [profile.subTitle],
    ['REKAPITULASI NILAI UJIAN SANTRI - GURU PENGAMPU'],
    ['--------------------------------------------------------------'],
    ['Nama Asatidz/Guru', `: ${teacher.nama} ${teacher.gelar || ''}`],
    ['NIP / Kode Guru', `: ${teacher.nip || '-'}`],
    ['Tahun Ajaran & Semester', `: ${term.label}`],
    ['Mata Pelajaran Diampu', `: ${teacher.mataPelajaranIds.map((id) => allMapel.find((m) => m.id === id)?.nama).filter(Boolean).join(', ')}`],
    ['Tanggal Cetak / Ekspor', `: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [''],
    ['RINGKASAN KELAS YANG DIINPUT'],
    ['No', 'Nama Kelas', 'Mata Pelajaran', 'Jumlah Santri', 'Sudah Dinilai', 'Rata-rata Nilai', 'Status'],
  ];

  targetClasses.forEach((cls, idx) => {
    const classSantri = allSantri.filter((s) => s.kelasId === cls.id && s.status === 'Aktif');
    const classGrades = teacherNilai.filter((n) => n.kelasId === cls.id);
    const avg =
      classGrades.length > 0
        ? (classGrades.reduce((sum, g) => sum + g.nilaiAkhir, 0) / classGrades.length).toFixed(1)
        : '-';
    const status =
      classSantri.length > 0 && classGrades.length >= classSantri.length
        ? 'Lengkap (100%)'
        : classGrades.length > 0
        ? `Sebagian (${classGrades.length}/${classSantri.length})`
        : 'Belum Diinput';

    const mapelNames =
      Array.from(
        new Set(
          classGrades
            .map(
              (g) =>
                allMapel.find(
                  (m) => m.id === g.mapelId || m.nama.toLowerCase() === g.mapelId.toLowerCase()
                )?.nama || g.mapelId
            )
            .filter(Boolean)
        )
      ).join(', ') ||
      teacher.mataPelajaranIds
        .map((id) => allMapel.find((m) => m.id === id)?.nama)
        .filter(Boolean)
        .join(', ');

    summaryData.push([
      idx + 1,
      cls.nama,
      mapelNames,
      classSantri.length,
      classGrades.length,
      avg,
      status,
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Guru');

  // 2. Class-by-Class Detail Sheets
  targetClasses.forEach((cls) => {
    const classSantri = allSantri.filter((s) => s.kelasId === cls.id && s.status === 'Aktif');
    const sheetData: (string | number)[][] = [
      [profile.nama],
      ['DAFTAR NILAI IMTIHAN NIHA\'I (UJIAN AKHIR SEMESTER)'],
      [`Tahun Ajaran: ${term.label} | Kelas: ${cls.nama}`],
      [`Guru Penguji: ${teacher.nama} ${teacher.gelar || ''}`],
      [''],
      [
        'No',
        'NIS',
        'Nama Santri',
        'Mata Pelajaran',
        'Nilai Harian (30%)',
        'Nilai Lisan/Tahfidz (30%)',
        'Nilai Tulis (40%)',
        'Nilai Akhir',
        'Predikat',
        'Status',
        'Catatan / Keterangan',
      ],
    ];

    let totalNilaiAkhir = 0;
    let gradedCount = 0;

    classSantri.forEach((santri, idx) => {
      const grade = teacherNilai.find(
        (n) => n.santriId === santri.id && n.kelasId === cls.id
      );
      const mapelName = grade
        ? allMapel.find(
            (m) => m.id === grade.mapelId || m.nama.toLowerCase() === grade.mapelId.toLowerCase()
          )?.nama || grade.mapelId
        : '-';

      if (grade) {
        totalNilaiAkhir += grade.nilaiAkhir;
        gradedCount++;
        const statusLulus = grade.nilaiAkhir >= 70 ? 'LULUS' : 'REMEDIAL';

        sheetData.push([
          idx + 1,
          santri.nis,
          santri.nama,
          mapelName,
          grade.nilaiHarian,
          grade.nilaiLisan,
          grade.nilaiTulis,
          grade.nilaiAkhir,
          grade.predikat,
          statusLulus,
          grade.catatan || '-',
        ]);
      } else {
        sheetData.push([
          idx + 1,
          santri.nis,
          santri.nama,
          '-',
          '-',
          '-',
          '-',
          '-',
          'Belum Dinilai',
          '-',
          '-',
        ]);
      }
    });

    // Add Statistics rows
    sheetData.push(['']);
    const average = gradedCount > 0 ? (totalNilaiAkhir / gradedCount).toFixed(2) : '0';
    sheetData.push(['', '', '', 'Rata-rata Nilai Akhir Kelas:', average]);
    sheetData.push(['', '', '', 'Total Santri:', classSantri.length]);
    sheetData.push(['', '', '', 'Santri Sudah Dinilai:', gradedCount]);

    // Clean sheet name (max 31 chars)
    const cleanSheetName = cls.nama.replace(/[\\/?*[\]:]/g, '').substring(0, 30);
    const wsClass = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, wsClass, cleanSheetName);
  });

  // Generate file name sanitized
  const cleanTeacherName = teacher.nama.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTermName = term.label.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Rekap_Nilai_${cleanTeacherName}_${cleanTermName}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Export Master Recap of all grades across the entire pesantren for this term
 */
export function exportMasterRecapToExcel(
  term: AcademicTerm,
  allNilai: NilaiSantri[],
  allSantri: Santri[],
  allKelas: Kelas[],
  allMapel: MataPelajaran[],
  allAsatidz: Asatidz[],
  profile: PesantrenProfile
) {
  const wb = XLSX.utils.book_new();
  const termNilai = allNilai.filter((n) => n.termId === term.id);

  const masterData: (string | number)[][] = [
    [profile.nama],
    [profile.subTitle],
    [`MASTER REKAPITULASI NILAI UJIAN SANTRI - ${term.label.toUpperCase()}`],
    ['---------------------------------------------------------------------------------------------'],
    ['No', 'NIS', 'Nama Santri', 'Kelas', 'Mata Pelajaran', 'Guru Pengampu', 'Harian', 'Lisan', 'Tulis', 'Nilai Akhir', 'Predikat', 'Status', 'Catatan'],
  ];

  termNilai.forEach((grade, idx) => {
    const santri = allSantri.find((s) => s.id === grade.santriId);
    const kelas = allKelas.find((k) => k.id === grade.kelasId);
    const mapel = allMapel.find(
      (m) => m.id === grade.mapelId || m.nama.toLowerCase() === grade.mapelId.toLowerCase()
    );
    const guru = allAsatidz.find((g) => g.id === grade.asatidzId);

    masterData.push([
      idx + 1,
      santri?.nis || '-',
      santri?.nama || '-',
      kelas?.nama || '-',
      mapel?.nama || grade.mapelId || '-',
      guru?.nama || '-',
      grade.nilaiHarian,
      grade.nilaiLisan,
      grade.nilaiTulis,
      grade.nilaiAkhir,
      grade.predikat,
      grade.nilaiAkhir >= 70 ? 'LULUS' : 'REMEDIAL',
      grade.catatan || '-',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, ws, 'Master Rekap Nilai');

  const cleanTermName = term.label.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Master_Rekap_Nilai_PPTQ_Alhusna_${cleanTermName}.xlsx`);
}

function extractCellString(rowFmt: unknown[], rowRaw: unknown[], colIdx: number): string {
  if (colIdx < 0) return '';
  const rawVal = rowRaw?.[colIdx];
  const fmtVal = rowFmt?.[colIdx];

  if (rawVal instanceof Date) {
    return rawVal.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  if (typeof rawVal === 'number') {
    const fmtStr = String(fmtVal ?? '').trim();
    if (fmtStr.includes('E+') || fmtStr.includes('e+') || Math.abs(rawVal) >= 1e11) {
      return rawVal.toLocaleString('fullwide', { useGrouping: false });
    }
    return fmtStr || String(rawVal);
  }

  return String(fmtVal ?? rawVal ?? '').trim();
}

function isBannerOrInstructionRow(row: unknown[]): boolean {
  if (!Array.isArray(row)) return true;
  const nonEmpty = row
    .map((c) => String(c ?? '').trim())
    .filter((s) => s !== '');
  if (nonEmpty.length === 0) return true;

  const firstUpper = nonEmpty[0].toUpperCase();
  if (
    firstUpper.startsWith('PETUNJUK') ||
    firstUpper.startsWith('CATATAN') ||
    firstUpper.startsWith('TEMPLATE ') ||
    firstUpper.startsWith('TARGET KELAS') ||
    firstUpper.startsWith('TANGGAL UNDUH') ||
    firstUpper.startsWith('TANGGAL EKSPOR') ||
    firstUpper.startsWith('TAHUN AJARAN') ||
    firstUpper.startsWith('PONDOK PESANTREN') ||
    firstUpper.startsWith('YAYASAN ') ||
    firstUpper.startsWith('DAFTAR DEWAN GURU') ||
    firstUpper.startsWith('MASTER REKAP') ||
    firstUpper.startsWith('---') ||
    firstUpper.startsWith('===')
  ) {
    return true;
  }

  if (nonEmpty.length === 1 && firstUpper.length > 65) {
    return true;
  }

  return false;
}

/**
 * Generate and download an Excel template for importing Santri per class
 */
export function downloadSantriTemplateExcel(kelasName: string) {
  const wb = XLSX.utils.book_new();

  const templateData = [
    ['TEMPLATE IMPORT SANTRI PER KELAS - PPTQ ALHUSNA'],
    [`Target Kelas: ${kelasName}`],
    ['Petunjuk: Silakan isi baris data di bawah tabel header berikut.'],
    [''],
    ['NO', 'NIS', 'NAMA SANTRI', 'JENIS KELAMIN (L/P)', 'HALAQAH TAHFIDZ', 'ASRAMA / KAMAR', 'STATUS'],
    [1, '202507101', 'Ahmad Farhan Mubarak', 'L', 'Halaqah Imam Ashim', 'Asrama Abu Bakar 01', 'Aktif'],
    [2, '202507102', "Muhammad Wildan Fathoni", 'L', "Halaqah Imam Nafi'", 'Asrama Abu Bakar 02', 'Aktif'],
    [3, '202507103', 'Rifqi Abdurrahman', 'L', 'Halaqah Imam Hamzah', 'Asrama Abu Bakar 03', 'Aktif'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 30 },
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Santri');
  const cleanKelas = kelasName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Template_Upload_Santri_${cleanKelas}.xlsx`);
}

/**
 * Parse an uploaded Excel file (.xlsx / .xls / .csv) into Santri records
 */
export async function parseSantriExcel(
  file: File,
  targetKelasId: string
): Promise<{ success: boolean; data: Omit<Santri, 'id'>[]; message: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    let rawData: unknown[][] = [];
    let rawValues: unknown[][] = [];

    for (const sName of workbook.SheetNames) {
      const ws = workbook.Sheets[sName];
      const candidateFmt = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: false });
      const candidateRaw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: true });
      const nonEmptyRows = (candidateFmt || []).filter(
        (r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== '')
      );
      if (nonEmptyRows.length > 0) {
        rawData = candidateFmt;
        rawValues = candidateRaw;
        break;
      }
    }

    if (!rawData || rawData.length === 0) {
      return { success: false, data: [], message: 'File Excel kosong atau tidak terbaca.' };
    }

    let headerRowIndex = -1;
    let noColIndex = -1;
    let nisColIndex = -1;
    let namaColIndex = -1;
    let jkColIndex = -1;
    let halaqahColIndex = -1;
    let kamarColIndex = -1;

    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
      const row = rawData[i];
      if (!Array.isArray(row) || isBannerOrInstructionRow(row)) continue;

      let rNo = -1;
      let rNis = -1;
      let rNama = -1;
      let rJk = -1;
      let rHalaqah = -1;
      let rKamar = -1;
      let score = 0;

      row.forEach((cell, colIdx) => {
        const rawText = String(cell ?? '').trim();
        if (!rawText || rawText.length > 45) return;
        const text = rawText.toUpperCase().replace(/\s+/g, ' ');

        if (text === 'NO' || text === 'NO.' || text === 'NOMOR' || text === 'URUT' || text === 'NO URUT' || text === 'NO. URUT') {
          if (rNo === -1) rNo = colIdx;
          score++;
        } else if (
          text.includes('JENIS KELAMIN') ||
          text.includes('KELAMIN') ||
          text.includes('GENDER') ||
          text === 'JK' ||
          text === 'LP' ||
          text.includes('L/P') ||
          text.includes('L / P')
        ) {
          if (rJk === -1) rJk = colIdx;
          score++;
        } else if (
          /\b(NIS|NISN|NISM|INDUK|STAMBUK)\b/.test(text) ||
          text === 'ID' ||
          text === 'ID SANTRI' ||
          text === 'NO INDUK' ||
          text === 'NOMOR INDUK'
        ) {
          if (rNis === -1) rNis = colIdx;
          score++;
        } else if (text.includes('NAMA') || text === 'SANTRI' || text === 'SISWA' || text === 'PESERTA DIDIK') {
          if (rNama === -1) rNama = colIdx;
          score += 2;
        } else if (text.includes('HALAQAH') || text.includes('HALAQOH') || text.includes('KELOMPOK')) {
          if (rHalaqah === -1) rHalaqah = colIdx;
          score++;
        } else if (text.includes('KAMAR') || text.includes('ASRAMA') || text.includes('RAYON')) {
          if (rKamar === -1) rKamar = colIdx;
          score++;
        }
      });

      const nonEmptyCount = row.filter((c) => String(c ?? '').trim() !== '').length;
      if ((rNama !== -1 && score >= 2) || (rNama !== -1 && nonEmptyCount === 1)) {
        headerRowIndex = i;
        noColIndex = rNo;
        nisColIndex = rNis;
        namaColIndex = rNama;
        jkColIndex = rJk;
        halaqahColIndex = rHalaqah;
        kamarColIndex = rKamar;
        break;
      }
    }

    // Auto-detect columns from data rows if header row was not found
    if (headerRowIndex === -1) {
      const sampleRows = rawData.filter((r) => Array.isArray(r) && !isBannerOrInstructionRow(r)).slice(0, 10);
      if (sampleRows.length > 0) {
        const maxCols = Math.max(...sampleRows.map((r) => r.length));
        for (let c = 0; c < maxCols; c++) {
          const vals = sampleRows.map((r) => String(r[c] ?? '').trim()).filter(Boolean);
          if (vals.length === 0) continue;
          const allSmallNums = vals.every((v) => /^\d{1,3}\.?$/.test(v));
          const allLongNums = vals.every((v) => /^[0-9\-\s]{5,20}$/.test(v));
          const allGender = vals.every((v) => ['L', 'P', 'LK', 'PR', 'LAKI-LAKI', 'PEREMPUAN', 'PUTRA', 'PUTRI'].includes(v.toUpperCase()));
          if (allSmallNums && noColIndex === -1) noColIndex = c;
          else if (allLongNums && nisColIndex === -1) nisColIndex = c;
          else if (allGender && jkColIndex === -1) jkColIndex = c;
          else if (namaColIndex === -1 && vals.some((v) => /[a-zA-Z]{2,}/.test(v))) namaColIndex = c;
        }
      }
      if (namaColIndex === -1) namaColIndex = 0;
    }

    const santriList: Omit<Santri, 'id'>[] = [];
    const klsNum = (targetKelasId || '1').replace(/[^0-9]/g, '').slice(-2) || '01';

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      const rawRow = rawValues[r] || row;
      if (!row || !Array.isArray(row) || isBannerOrInstructionRow(row)) continue;

      let nama = extractCellString(row, rawRow, namaColIndex);
      if ((!nama || /^\d+\.?$/.test(nama)) && row.length > 1) {
        for (let c = 0; c < row.length; c++) {
          if (c === noColIndex || c === nisColIndex || c === jkColIndex) continue;
          const candidate = extractCellString(row, rawRow, c);
          if (candidate && /[a-zA-Z]{3,}/.test(candidate) && !['AKTIF', 'NON-AKTIF', 'LAKI-LAKI', 'PEREMPUAN'].includes(candidate.toUpperCase())) {
            nama = candidate;
            break;
          }
        }
      }

      const upperNama = nama.toUpperCase();
      if (
        !nama ||
        /^\d+\.?$/.test(nama) ||
        ['NAMA', 'NAMA SANTRI', 'NAMA LENGKAP', 'NO', 'NIS', 'JENIS KELAMIN', 'L/P'].includes(upperNama) ||
        nama.toLowerCase().includes('petunjuk') ||
        nama.toLowerCase().includes('contoh')
      ) {
        continue;
      }

      const rawNis = nisColIndex !== -1 && nisColIndex !== jkColIndex ? extractCellString(row, rawRow, nisColIndex) : '';
      const isGenderOrEmptyNis =
        !rawNis ||
        rawNis === '-' ||
        ['L', 'P', 'LK', 'PR', 'LAKI-LAKI', 'PEREMPUAN', 'PUTRA', 'PUTRI'].includes(rawNis.toUpperCase());
      const nis = !isGenderOrEmptyNis
        ? rawNis
        : `2025${klsNum.padStart(2, '0')}${String(santriList.length + 1).padStart(3, '0')}`;
      const rawJk = jkColIndex !== -1 ? extractCellString(row, rawRow, jkColIndex).toUpperCase() : 'L';
      const jenisKelamin: 'L' | 'P' = rawJk.startsWith('P') || rawJk.startsWith('W') ? 'P' : 'L';
      const halaqah = halaqahColIndex !== -1 ? extractCellString(row, rawRow, halaqahColIndex) : 'Halaqah Tahfidz';
      const kamar = kamarColIndex !== -1 ? extractCellString(row, rawRow, kamarColIndex) : 'Asrama Santri';

      santriList.push({
        nis,
        nama,
        jenisKelamin,
        kelasId: targetKelasId,
        halaqah: halaqah || 'Halaqah Tahfidz',
        kamar: kamar || 'Asrama Santri',
        status: 'Aktif',
      });
    }

    if (santriList.length === 0) {
      return { success: false, data: [], message: 'Tidak ada baris data santri yang valid ditemukan dalam file.' };
    }

    return {
      success: true,
      data: santriList,
      message: `Berhasil mengekstrak ${santriList.length} data santri dari file Excel.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memproses file Excel.';
    return { success: false, data: [], message: errorMsg };
  }
}

/**
 * Download sample Excel template for Kelas bulk upload
 */
export function downloadKelasTemplateExcel() {
  const wb = XLSX.utils.book_new();

  const templateData: (string | number)[][] = [
    ['TEMPLATE DATA KELAS - PPTQ ALHUSNA'],
    ['Petunjuk: Silakan isi baris data kelas di bawah tabel header berikut (Tingkat: Kelas 1 s/d Kelas 6).'],
    [''],
    ['NO', 'NAMA KELAS', 'TINGKAT', 'KAPASITAS', 'WALI KELAS'],
    [1, 'Kelas 1', 'Kelas 1', 25, 'Ust. Abdullah Al-Hafidz'],
    [2, 'Kelas 2', 'Kelas 2', 25, 'Ust. Fauzan Adhim'],
    [3, 'Kelas 3', 'Kelas 3', 25, 'Ust. Mansur Hidayatulloh'],
    [4, 'Kelas 4', 'Kelas 4', 25, 'Ust. M. Zaki Mubarak'],
    [5, 'Kelas 5', 'Kelas 5', 25, 'Ust. Rifqi Ramadhan'],
    [6, 'Kelas 6', 'Kelas 6', 25, 'Ust. Abdullah Al-Hafidz'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template_Kelas');
  XLSX.writeFile(wb, 'Template_Daftar_Kelas_Alhusna.xlsx');
}

/**
 * Parse Excel file for bulk Kelas upload
 */
export async function parseKelasExcel(
  file: File
): Promise<{ success: boolean; data: Omit<Kelas, 'id'>[]; message: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    let rawData: unknown[][] = [];
    for (const sName of workbook.SheetNames) {
      const ws = workbook.Sheets[sName];
      const candidate = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: false });
      if (candidate && candidate.length > 0) {
        rawData = candidate;
        break;
      }
    }

    if (!rawData || rawData.length === 0) {
      return { success: false, data: [], message: 'Lembar kerja kosong.' };
    }

    let headerRowIndex = -1;
    let namaColIndex = -1;
    let tingkatColIndex = -1;
    let kapasitasColIndex = -1;
    let waliColIndex = -1;

    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
      const row = rawData[i];
      if (!Array.isArray(row) || isBannerOrInstructionRow(row)) continue;

      let rNama = -1;
      let rTingkat = -1;
      let rKapasitas = -1;
      let rWali = -1;
      let score = 0;

      row.forEach((cell, colIdx) => {
        const rawText = String(cell ?? '').trim();
        if (!rawText || rawText.length > 45) return;
        const text = rawText.toUpperCase().replace(/\s+/g, ' ');

        if (text.includes('WALI') || text.includes('PEMBINA')) {
          if (rWali === -1) rWali = colIdx;
          score++;
        } else if (text.includes('NAMA KELAS') || text === 'KELAS' || text === 'ROMBEL') {
          if (rNama === -1) rNama = colIdx;
          score += 2;
        } else if (text.includes('TINGKAT') || text.includes('JENJANG')) {
          if (rTingkat === -1) rTingkat = colIdx;
          score++;
        } else if (text.includes('KAPASITAS') || text.includes('KUOTA') || text.includes('JUMLAH')) {
          if (rKapasitas === -1) rKapasitas = colIdx;
          score++;
        }
      });

      if (rNama !== -1 && score >= 2) {
        headerRowIndex = i;
        namaColIndex = rNama;
        tingkatColIndex = rTingkat;
        kapasitasColIndex = rKapasitas;
        waliColIndex = rWali;
        break;
      }
    }

    if (headerRowIndex === -1) {
      namaColIndex = 1;
      tingkatColIndex = 2;
      kapasitasColIndex = 3;
      waliColIndex = 4;
    }

    const kelasList: Omit<Kelas, 'id'>[] = [];

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || !Array.isArray(row) || isBannerOrInstructionRow(row)) continue;

      let nama = String(row[namaColIndex] ?? '').trim();
      if (!nama && row.length > 0) {
        nama = String(row[0] ?? '').trim();
      }
      if (
        !nama ||
        /^\d+\.?$/.test(nama) ||
        ['NAMA KELAS', 'KELAS', 'NO'].includes(nama.toUpperCase()) ||
        nama.toLowerCase().includes('petunjuk') ||
        nama.toLowerCase().includes('contoh')
      ) {
        continue;
      }

      const rawTingkat = tingkatColIndex !== -1 && row[tingkatColIndex] ? String(row[tingkatColIndex]).trim() : '';
      const numMatch = (rawTingkat || nama).match(/[1-6]/);
      const tingkat = numMatch ? `Kelas ${numMatch[0]}` : 'Kelas 1';
      const kapasitasRaw = kapasitasColIndex !== -1 && row[kapasitasColIndex] ? parseInt(String(row[kapasitasColIndex]), 10) : 25;
      const kapasitas = isNaN(kapasitasRaw) || kapasitasRaw <= 0 ? 25 : kapasitasRaw;
      const waliKelas = waliColIndex !== -1 && row[waliColIndex] ? String(row[waliColIndex]).trim() : '';

      kelasList.push({
        nama,
        tingkat,
        kapasitas,
        waliKelas,
      });
    }

    if (kelasList.length === 0) {
      return { success: false, data: [], message: 'Tidak ada baris data kelas valid yang ditemukan dalam file.' };
    }

    return {
      success: true,
      data: kelasList,
      message: `Berhasil mengekstrak ${kelasList.length} data kelas dari file Excel.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memproses file Excel kelas.';
    return { success: false, data: [], message: errorMsg };
  }
}

/**
 * Download sample Excel template for Asatidz/Guru bulk upload
 * Matching columns: NO, NIK/NUPTK, NAMA GURU, L/P, TEMPAT TANGGAL LAHIR, PENDIDIKAN, PASSWORD, WALI KELAS, JTM, NO HP / WA
 */
export function downloadGuruTemplateExcel() {
  const wb = XLSX.utils.book_new();

  const templateData: (string | number)[][] = [
    ['TEMPLATE DATA GURU & AKUN ASATIDZ - PPTQ ALHUSNA'],
    ['Petunjuk: Silakan isi baris data di bawah tabel header berikut. Kolom selain Nama Guru bersifat opsional.'],
    [''],
    ['NO', 'NIK/NUPTK', 'NAMA GURU', 'L/P', 'TEMPAT TANGGAL LAHIR', 'PENDIDIKAN', 'PASSWORD', 'WALI KELAS', 'JTM', 'NO HP / WA'],
    [1, '198507142010011001', 'Ust. Abdullah Al-Hafidz', 'L', 'RANTAU EMBACANG, 14 Agustus 1985', 'Sarjana (S1)', 'MP2471FV', 'Kelas 7A Tahfidz (Putra)', 24, '081211112222'],
    [2, '199205022015011002', 'Ust. Fauzan Adhim, S.Pd.I.', 'L', 'MUARA BUNGO, 02 Mei 1992', 'Sarjana (S1)', 'Basri1973', 'Kelas 7B Tahfidz (Putra)', 22, '081233334444'],
    [3, '198810192013011003', 'Ust. Mansur Hidayatulloh, Lc.', 'L', 'PADANG, 19 Oktober 1988', 'Magister (S2)', 'DHRK9MQW', 'Kelas 9A Takhasus (Putra)', 26, '081255556666'],
    [4, '199601102019011004', 'Ust. M. Zaki Mubarak, S.Q.', 'L', 'JAMBI, 10 Januari 1996', 'Sarjana (S1)', 'ZAKI2025', 'Kelas 8A Tahfidz (Putra)', 20, '081277778888'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 32 },
    { wch: 8 },
    { wch: 35 },
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
    { wch: 8 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template_Guru');
  XLSX.writeFile(wb, 'Template_Data_Guru_PPTQ_Alhusna.xlsx');
}

/**
 * Parse Excel file for Guru bulk upload
 */
export async function parseGuruExcel(
  file: File
): Promise<{ success: boolean; data: Omit<Asatidz, 'id'>[]; message: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, data: [], message: 'File Excel tidak memiliki lembar kerja (sheet).' };
    }

    let rawData: unknown[][] = [];
    let rawValues: unknown[][] = [];

    // Find the first sheet that contains actual rows
    for (const sName of workbook.SheetNames) {
      const ws = workbook.Sheets[sName];
      const candidateFmt = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: false });
      const candidateRaw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: true });
      const nonEmptyRows = (candidateFmt || []).filter(
        (r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== '')
      );
      if (nonEmptyRows.length > 0) {
        rawData = candidateFmt;
        rawValues = candidateRaw;
        break;
      }
    }

    if (!rawData || rawData.length === 0) {
      return { success: false, data: [], message: 'Lembar kerja Excel kosong.' };
    }

    // Locate header row cleanly without matching single-cell title/instruction rows
    let headerRowIndex = -1;
    let noCol = -1;
    let nipCol = -1;
    let namaCol = -1;
    let gelarCol = -1;
    let lpCol = -1;
    let ttlCol = -1;
    let tempatLahirCol = -1;
    let tglLahirCol = -1;
    let pddkCol = -1;
    let passCol = -1;
    let waliCol = -1;
    let jtmCol = -1;
    let kontakCol = -1;
    let statusCol = -1;

    for (let i = 0; i < Math.min(rawData.length, 25); i++) {
      const row = rawData[i];
      if (!Array.isArray(row) || isBannerOrInstructionRow(row)) continue;

      let rNo = -1;
      let rNip = -1;
      let rNama = -1;
      let rGelar = -1;
      let rLp = -1;
      let rTtl = -1;
      let rTempatLahir = -1;
      let rTglLahir = -1;
      let rPddk = -1;
      let rPass = -1;
      let rWali = -1;
      let rJtm = -1;
      let rKontak = -1;
      let rStatus = -1;
      let headerScore = 0;

      row.forEach((cell, colIdx) => {
        const rawText = String(cell ?? '').trim();
        if (!rawText || rawText.length > 45) return;
        const text = rawText.toUpperCase().replace(/\s+/g, ' ');

        if (text === 'NO' || text === 'NO.' || text === 'NOMOR' || text === 'NO URUT' || text === 'NO. URUT' || text === 'URUT' || text === '#') {
          if (rNo === -1) rNo = colIdx;
          headerScore++;
        } else if (text.includes('WALI') || text.includes('KELAS BINAAN') || text.includes('AMANAH') || text === 'KELAS' || text === 'ROMBEL') {
          if (rWali === -1) rWali = colIdx;
          headerScore++;
        } else if (text.includes('MAPEL') || text.includes('MATA PELAJARAN') || text.includes('BIDANG STUDI') || text.includes('PELAJARAN')) {
          headerScore++;
        } else if (
          text.includes('NIK') ||
          text.includes('NUPTK') ||
          text.includes('NIP') ||
          text.includes('NIY') ||
          text.includes('NIG') ||
          text.includes('NO INDUK') ||
          text.includes('NOMOR INDUK') ||
          text === 'ID' ||
          text === 'ID GURU' ||
          text === 'KODE' ||
          text === 'KODE GURU' ||
          text === 'USERNAME' ||
          text === 'EMAIL'
        ) {
          if (rNip === -1) rNip = colIdx;
          headerScore++;
        } else if (
          text.includes('NAMA') ||
          text === 'GURU' ||
          text === 'DEWAN GURU' ||
          text === 'ASATIDZ' ||
          text === 'USTADZ' ||
          text === 'USTADZ/USTADZAH' ||
          text === 'USTADZ / USTADZAH' ||
          text === 'PENGAJAR' ||
          text === 'PENDIDIK' ||
          text === 'TENAGA PENDIDIK'
        ) {
          if (rNama === -1) rNama = colIdx;
          headerScore += 2;
        } else if (
          text.includes('L/P') ||
          text.includes('L / P') ||
          text === 'JK' ||
          text === 'LP' ||
          text.includes('JENIS KELAMIN') ||
          text.includes('KELAMIN') ||
          text.includes('GENDER')
        ) {
          if (rLp === -1) rLp = colIdx;
          headerScore++;
        } else if (
          text === 'TTL' ||
          text.includes('TEMPAT TANGGAL LAHIR') ||
          text.includes('TEMPAT, TANGGAL LAHIR') ||
          text.includes('TEMPAT, TGL LAHIR') ||
          text.includes('TEMPAT/TGL LAHIR') ||
          text.includes('TEMPAT & TANGGAL LAHIR') ||
          text.includes('TEMPAT / TGL LAHIR')
        ) {
          if (rTtl === -1) rTtl = colIdx;
          headerScore++;
        } else if (text.includes('TEMPAT LAHIR') || text === 'TMP LAHIR' || text === 'TEMPAT') {
          if (rTempatLahir === -1) rTempatLahir = colIdx;
          headerScore++;
        } else if (text.includes('TANGGAL LAHIR') || text.includes('TGL LAHIR') || text.includes('LAHIR')) {
          if (rTglLahir === -1) rTglLahir = colIdx;
          headerScore++;
        } else if (
          text.includes('PENDIDIKAN') ||
          text.includes('IJAZAH') ||
          text.includes('LULUSAN') ||
          text.includes('STRATA') ||
          text === 'PEND' ||
          text === 'PEND.'
        ) {
          if (rPddk === -1) rPddk = colIdx;
          headerScore++;
        } else if (text === 'GELAR' || text.includes('GELAR AKADEMIK')) {
          if (rGelar === -1) rGelar = colIdx;
          headerScore++;
        } else if (text.includes('PASSWORD') || text.includes('SANDI') || text === 'PASS' || text === 'PIN' || text.includes('KODE AKSES')) {
          if (rPass === -1) rPass = colIdx;
          headerScore++;
        } else if (text.includes('JTM') || text.includes('JAM') || text === 'JP' || text.includes('BEBAN')) {
          if (rJtm === -1) rJtm = colIdx;
          headerScore++;
        } else if (
          text.includes('HP') ||
          text.includes('WA') ||
          text.includes('WHATSAPP') ||
          text.includes('TELP') ||
          text.includes('TELEPON') ||
          text.includes('KONTAK')
        ) {
          if (rKontak === -1) rKontak = colIdx;
          headerScore++;
        } else if (text === 'STATUS' || text.includes('STATUS GURU') || text.includes('KEAKTIFAN')) {
          if (rStatus === -1) rStatus = colIdx;
          headerScore++;
        }
      });

      const nonEmptyCells = row.filter((c) => String(c ?? '').trim() !== '');
      const firstCellUpper = String(nonEmptyCells[0] ?? '').trim().toUpperCase();

      if (
        (rNama !== -1 && headerScore >= 2) ||
        (rNama !== -1 && nonEmptyCells.length === 1 && ['NAMA', 'NAMA GURU', 'NAMA LENGKAP', 'NAMA ASATIDZ', 'GURU', 'ASATIDZ', 'USTADZ'].includes(firstCellUpper)) ||
        headerScore >= 3
      ) {
        headerRowIndex = i;
        noCol = rNo;
        nipCol = rNip;
        namaCol = rNama;
        gelarCol = rGelar;
        lpCol = rLp;
        ttlCol = rTtl;
        tempatLahirCol = rTempatLahir;
        tglLahirCol = rTglLahir;
        pddkCol = rPddk;
        passCol = rPass;
        waliCol = rWali;
        jtmCol = rJtm;
        kontakCol = rKontak;
        statusCol = rStatus;
        break;
      }
    }

    // Smart auto-detection from data rows if header row was not found or namaCol is still -1
    if (headerRowIndex === -1 || namaCol === -1) {
      const startScan = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
      const sampleRows = rawData
        .slice(startScan)
        .filter((r) => Array.isArray(r) && !isBannerOrInstructionRow(r))
        .slice(0, 12);

      if (sampleRows.length > 0) {
        const maxCols = Math.max(...sampleRows.map((r) => r.length));
        for (let c = 0; c < maxCols; c++) {
          const vals = sampleRows.map((r) => String(r[c] ?? '').trim()).filter((v) => v !== '' && v !== '-');
          if (vals.length === 0) continue;

          const allSmallNums = vals.every((v) => /^\d{1,3}\.?$/.test(v));
          const allLongNums = vals.every((v) => /^[0-9\-\s]{6,25}$/.test(v));
          const allGender = vals.every((v) =>
            ['L', 'P', 'LK', 'PR', 'LAKI-LAKI', 'PEREMPUAN', 'PRIA', 'WANITA', 'PUTRA', 'PUTRI'].includes(v.toUpperCase())
          );

          if (allSmallNums && noCol === -1 && c <= 1) {
            noCol = c;
          } else if (allLongNums && nipCol === -1) {
            nipCol = c;
          } else if (allGender && lpCol === -1) {
            lpCol = c;
          } else if (
            namaCol === -1 &&
            vals.some((v) => /[a-zA-Z]{3,}/.test(v)) &&
            !vals.every((v) => ['S1', 'S2', 'S3', 'SMA', 'MA', 'AKTIF', 'CUTI'].includes(v.toUpperCase()))
          ) {
            namaCol = c;
          }
        }

        // If the sheet follows the standard 9-column template layout without headers
        if (noCol === 0 && nipCol === 1 && namaCol === 2) {
          if (lpCol === -1) lpCol = 3;
          if (ttlCol === -1) ttlCol = 4;
          if (pddkCol === -1) pddkCol = 5;
          if (passCol === -1) passCol = 6;
          if (waliCol === -1) waliCol = 7;
          if (jtmCol === -1) jtmCol = 8;
        }
      }

      if (namaCol === -1) {
        namaCol = 0;
      }
    }

    const guruList: Omit<Asatidz, 'id'>[] = [];
    const usedColumns = new Set(
      [noCol, nipCol, lpCol, ttlCol, tempatLahirCol, tglLahirCol, pddkCol, passCol, waliCol, jtmCol, kontakCol, statusCol].filter(
        (c) => c !== -1
      )
    );

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      const rawRow = rawValues[r] || row;
      if (!row || !Array.isArray(row) || isBannerOrInstructionRow(row)) continue;

      let nama = extractCellString(row, rawRow, namaCol);

      // Fallback if nama cell in this row is empty or just a row number
      if ((!nama || /^\d+\.?$/.test(nama)) && row.length > 1) {
        for (let c = 0; c < row.length; c++) {
          if (usedColumns.has(c)) continue;
          const candidate = extractCellString(row, rawRow, c);
          if (
            candidate &&
            /[a-zA-Z]{3,}/.test(candidate) &&
            !['AKTIF', 'NON-AKTIF', 'CUTI', 'LAKI-LAKI', 'PEREMPUAN', 'SARJANA (S1)', 'S1', 'S2'].includes(candidate.toUpperCase())
          ) {
            nama = candidate;
            break;
          }
        }
      }

      const upperNama = nama.toUpperCase();
      if (
        !nama ||
        /^\d+\.?$/.test(nama) ||
        ['NAMA', 'NAMA GURU', 'NAMA LENGKAP', 'NAMA ASATIDZ', 'GURU', 'ASATIDZ', 'NO', 'NIK/NUPTK', 'NIK / NUPTK', 'NIP'].includes(upperNama) ||
        nama.toLowerCase().includes('petunjuk') ||
        nama.toLowerCase().includes('contoh')
      ) {
        continue;
      }

      const gelar = gelarCol !== -1 ? extractCellString(row, rawRow, gelarCol) : '';
      if (gelar && gelar !== '-' && !nama.includes(gelar)) {
        nama = `${nama}, ${gelar}`;
      }

      const rawNip = nipCol !== -1 ? extractCellString(row, rawRow, nipCol) : '';
      const isPlaceholderNip = !rawNip || rawNip === '-' || rawNip === '--' || rawNip === '0' || rawNip.toLowerCase() === 'kosong';
      const nip = isPlaceholderNip
        ? `1985${String(Date.now()).slice(-5)}${String(guruList.length + 1).padStart(3, '0')}`
        : rawNip;

      const rawLp = lpCol !== -1 ? extractCellString(row, rawRow, lpCol).toUpperCase() : '';
      let gender: 'L' | 'P' = 'L';
      if (rawLp.startsWith('P') || rawLp.startsWith('W') || rawLp.includes('USTADZAH') || rawLp.includes('USTH')) {
        gender = 'P';
      } else if (rawLp.startsWith('L')) {
        gender = 'L';
      } else if (/\b(usth|ustadzah|hj\.|siti|aisyah|fatimah|maryam|nurul|annisa)\b/i.test(nama)) {
        gender = 'P';
      }

      let ttl = ttlCol !== -1 ? extractCellString(row, rawRow, ttlCol) : '';
      if ((!ttl || ttl === '-') && (tempatLahirCol !== -1 || tglLahirCol !== -1)) {
        const tmp = tempatLahirCol !== -1 ? extractCellString(row, rawRow, tempatLahirCol) : '';
        const tgl = tglLahirCol !== -1 ? extractCellString(row, rawRow, tglLahirCol) : '';
        ttl = [tmp, tgl].filter((x) => x && x !== '-').join(', ');
      }
      if (!ttl) ttl = '-';

      const rawPddk = pddkCol !== -1 ? extractCellString(row, rawRow, pddkCol) : '';
      const pendidikan = rawPddk && rawPddk !== '-' ? rawPddk : 'Sarjana (S1)';

      const rawPass = passCol !== -1 ? extractCellString(row, rawRow, passCol) : '';
      const password = rawPass && rawPass !== '-' && rawPass !== '******' ? rawPass : 'guru123';

      const rawWali = waliCol !== -1 ? extractCellString(row, rawRow, waliCol) : '';
      const waliKelas = rawWali && rawWali !== '-' ? rawWali : '-';

      const rawJtm = jtmCol !== -1 ? extractCellString(row, rawRow, jtmCol) : '';
      const parsedJtm = parseInt(rawJtm.replace(/[^0-9]/g, ''), 10);
      const jtm = isNaN(parsedJtm) || parsedJtm <= 0 ? 24 : parsedJtm;

      const kontak = kontakCol !== -1 ? extractCellString(row, rawRow, kontakCol) : '';

      const rawStatus = statusCol !== -1 ? extractCellString(row, rawRow, statusCol).toUpperCase() : '';
      let status: 'Aktif' | 'Cuti' | 'Non-Aktif' = 'Aktif';
      if (rawStatus.includes('CUTI')) status = 'Cuti';
      else if (rawStatus.includes('NON')) status = 'Non-Aktif';

      guruList.push({
        nip,
        nama,
        gender,
        ttl,
        pendidikan,
        password,
        waliKelas,
        jtm,
        kontak,
        noHp: kontak,
        mataPelajaranIds: [],
        kelasIds: [],
        status,
      });
    }

    if (guruList.length === 0) {
      return { success: false, data: [], message: 'Tidak ada baris data guru yang valid dalam file Excel.' };
    }

    return {
      success: true,
      data: guruList,
      message: `Berhasil mengekstrak ${guruList.length} data guru dari file Excel.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memproses file Excel guru.';
    return { success: false, data: [], message: errorMsg };
  }
}

/**
 * Export table of all teachers to Excel (.xlsx)
 */
export function exportGuruListToExcel(
  guruList: Asatidz[],
  _allKelas: Kelas[],
  allMapel: MataPelajaran[]
) {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['DAFTAR DEWAN GURU & ASATIDZ - PPTQ ALHUSNA'],
    [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [''],
    ['NO', 'NIK / NUPTK', 'NAMA GURU', 'L/P', 'TEMPAT TANGGAL LAHIR', 'PENDIDIKAN', 'PASSWORD', 'WALI KELAS', 'JTM', 'NO HP / WA', 'MAPEL DIAMPU', 'STATUS'],
  ];

  guruList.forEach((guru, idx) => {
    const mapelNames = guru.mataPelajaranIds
      .map((id) => allMapel.find((m) => m.id === id)?.nama)
      .filter(Boolean)
      .join(', ') || '-';

    rows.push([
      idx + 1,
      guru.nip || '-',
      guru.nama,
      guru.gender || 'L',
      guru.ttl || '-',
      guru.pendidikan || 'Sarjana (S1)',
      guru.password || 'guru123',
      guru.waliKelas || '-',
      guru.jtm || 24,
      guru.kontak || guru.noHp || '-',
      mapelNames,
      guru.status || 'Aktif',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 32 },
    { wch: 8 },
    { wch: 35 },
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
    { wch: 8 },
    { wch: 18 },
    { wch: 35 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data_Guru');
  XLSX.writeFile(wb, `Data_Guru_Asatidz_Alhusna_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export current class grading sheet to Excel
 */
export function exportClassGradesToExcel(
  kelasNama: string,
  mapelNama: string,
  guruNama: string,
  santriList: Santri[],
  draftScores: Record<string, { harian: number; lisan: number; tulis: number; catatan?: string }>
) {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['PONDOK PESANTREN TAHFIDZUL QUR\'AN ALHUSNA'],
    [`DAFTAR NILAI KELAS: ${kelasNama.toUpperCase()} | MAPEL: ${mapelNama.toUpperCase()}`],
    [`Guru Pengampu: ${guruNama}`],
    [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [''],
    ['NO', 'NIS', 'NAMA SANTRI', 'NILAI HARIAN (20%)', 'UJIAN LISAN (30%)', 'UJIAN TULIS (50%)', 'NILAI AKHIR', 'PREDIKAT', 'CATATAN'],
  ];

  santriList.forEach((santri, idx) => {
    const draft = draftScores[santri.id] || { harian: 80, lisan: 80, tulis: 80, catatan: '' };
    const finalScore = Math.round(draft.harian * 0.2 + draft.lisan * 0.3 + draft.tulis * 0.5);
    let predikat = 'Jayyid (C)';
    if (finalScore >= 90) predikat = 'Mumtaz (A)';
    else if (finalScore >= 80) predikat = 'Jayyid Jiddan (B)';
    else if (finalScore >= 70) predikat = 'Jayyid (C)';
    else if (finalScore >= 60) predikat = 'Maqbul (D)';
    else predikat = 'Rasib (E)';

    rows.push([
      idx + 1,
      santri.nis || '-',
      santri.nama,
      draft.harian,
      draft.lisan,
      draft.tulis,
      finalScore,
      predikat,
      draft.catatan || '-',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
  ];

  const safeSheetName = `${kelasNama.slice(0, 15)}_${mapelNama.slice(0, 10)}`.replace(/[\/\\?*\[\]]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  XLSX.writeFile(wb, `Nilai_${kelasNama}_${mapelNama}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface SantriExtraRaportData {
  akhlaq: string;
  kebersihan: string;
  ibadah: string;
  kesungguhan: string;
  disiplinDiri: string;
  ketaatan: string;
}

export type RaportSectionId =
  | 'bismillah'
  | 'kop'
  | 'judul'
  | 'identitas'
  | 'nilai'
  | 'kepribadian'
  | 'ttd';

export type RaportSignatureRole = 'orang_tua' | 'wali_kelas' | 'pimpinan';

export interface RaportConfig {
  templateStyle: 'bilingual' | 'arabic' | 'nasional';
  tableDirection: 'rtl' | 'ltr';
  fontFamily: 'font-serif' | 'font-sans' | 'font-mono' | 'font-amiri';
  colorTheme: 'emerald' | 'classic_bw' | 'royal_blue' | 'gold_classic';
  showArabic: boolean;
  showBismillah: boolean;
  showLogo: boolean;
  showBorderFrame: boolean;
  showAllMapel: boolean;
  showKKM: boolean;
  showDetailNilai: boolean;
  showTerbilang: boolean;
  showPredikat: boolean;
  showSikapAbsensi: boolean;
  showRanking: boolean;
  // Layout & Positioning controls (1:1 Preview & Excel)
  sectionOrder: RaportSectionId[];
  kopAlign: 'center' | 'left' | 'right';
  identitasLayout: '2col' | '1col';
  kepribadianLayout: '2col' | '1col' | 'horizontal';
  tanggalAlign: 'right' | 'center' | 'left';
  signatureAlign?: 'right' | 'center' | 'left';
  signatureOrder: RaportSignatureRole[];
  paperPadding: 'compact' | 'normal' | 'spacious';
  sectionGap?: 'compact' | 'normal' | 'relaxed';
  yayasanName: string;
  yayasanNameArab: string;
  pesantrenNameArab: string;
  headerTitle: string;
  headerTitleArab: string;
  tahunHijriyah: string;
  pejabatName: string;
  pejabatNameArab: string;
  pejabatJabatan: string;
  pejabatJabatanArab: string;
  waliKelasCustom: string;
  waliKelasJabatan: string;
  waliKelasJabatanArab: string;
  orangTuaLabel: string;
  orangTuaLabelArab: string;
  lokasiCetak: string;
  lokasiCetakArab: string;
  tanggalCetak: string;
  tanggalCetakArab: string;
  customMapelArab: Record<string, string>;
  santriExtra: Record<string, SantriExtraRaportData>;
}

export const DEFAULT_SECTION_ORDER: RaportSectionId[] = [
  'bismillah',
  'kop',
  'judul',
  'identitas',
  'nilai',
  'kepribadian',
  'ttd',
];

export const DEFAULT_SIGNATURE_ORDER: RaportSignatureRole[] = [
  'orang_tua',
  'wali_kelas',
  'pimpinan',
];

export const DEFAULT_RAPORT_CONFIG: RaportConfig = {
  templateStyle: 'bilingual',
  tableDirection: 'ltr',
  fontFamily: 'font-serif',
  colorTheme: 'classic_bw',
  showArabic: true,
  showBismillah: true,
  showLogo: true,
  showBorderFrame: true,
  showAllMapel: true,
  showKKM: true,
  showDetailNilai: true,
  showTerbilang: true,
  showPredikat: true,
  showSikapAbsensi: true,
  showRanking: true,
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  kopAlign: 'center',
  identitasLayout: '2col',
  kepribadianLayout: '2col',
  tanggalAlign: 'right',
  signatureAlign: 'right',
  signatureOrder: [...DEFAULT_SIGNATURE_ORDER],
  paperPadding: 'normal',
  sectionGap: 'normal',
  yayasanName: 'YAYASAN PENDIDIKAN ISLAM & TAHFIDZUL QUR\'AN AL-HUSNA',
  yayasanNameArab: 'مؤسسة الحسنى للتربية الإسلامية وتحفيظ القرآن الكريم',
  pesantrenNameArab: 'معهد الحسنى لتحفيظ القرآن الكريم والعلوم الشرعية',
  headerTitle: 'LAPORAN HASIL BELAJAR SANTRI (KASYFUD DARAJAT)',
  headerTitleArab: 'كشف الدرجات لاختبار نهاية الفصل الدراسي',
  tahunHijriyah: '1446 / 1447 هـ',
  pejabatName: 'K.H. Ahmad Husnan Al-Hafidz',
  pejabatNameArab: 'الشيخ أحمد حسنان الحافظ',
  pejabatJabatan: 'Pengasuh / Mudir Ma\'had',
  pejabatJabatanArab: 'مدير المعهد',
  waliKelasCustom: '',
  waliKelasJabatan: 'Wali Kelas',
  waliKelasJabatanArab: 'ولي الفصل',
  orangTuaLabel: 'Orang Tua / Wali Santri',
  orangTuaLabelArab: 'ولي أمر الطالب',
  lokasiCetak: 'Bungo',
  lokasiCetakArab: 'بونغو',
  tanggalCetak: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  tanggalCetakArab: '١٤ ربيع الآخر ١٤٤٧ هـ',
  customMapelArab: {},
  santriExtra: {},
};

export function toArabicDigits(val: number | string): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(val).replace(/[0-9]/g, (d) => map[Number(d)]);
}

export function numberToTerbilangIndo(n: number): string {
  const num = Math.round(n);
  if (isNaN(num) || num < 0) return '-';
  if (num === 0) return 'Nol';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (num < 12) return satuan[num];
  if (num < 20) return `${satuan[num - 10]} Belas`;
  if (num < 100) {
    const puluh = Math.floor(num / 10);
    const sisa = num % 10;
    return `${satuan[puluh]} Puluh${sisa > 0 ? ' ' + satuan[sisa] : ''}`;
  }
  if (num === 100) return 'Seratus';
  if (num < 200) return `Seratus ${numberToTerbilangIndo(num - 100)}`;
  if (num < 1000) {
    const ratus = Math.floor(num / 100);
    const sisa = num % 100;
    return `${satuan[ratus]} Ratus${sisa > 0 ? ' ' + numberToTerbilangIndo(sisa) : ''}`;
  }
  if (num === 1000) return 'Seribu';
  return String(num);
}

export function numberToTerbilangArab(n: number): string {
  const num = Math.round(n);
  if (isNaN(num) || num < 0) return '-';
  if (num === 0) return 'صفر';
  if (num === 100) return 'مائة';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

  const convertUnder100 = (val: number): string => {
    if (val === 0) return '';
    if (val <= 12) return ones[val];
    if (val < 20) return `${ones[val - 10]} عشر`;
    const u = val % 10;
    const t = Math.floor(val / 10);
    if (u === 0) return tens[t];
    return `${ones[u]} و${tens[t]}`;
  };

  if (num < 100) return convertUnder100(num);

  const hundredsMap = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  if (num < 1000) {
    const h = Math.floor(num / 100);
    const rem = num % 100;
    if (rem === 0) return hundredsMap[h];
    return `${hundredsMap[h]} و${convertUnder100(rem)}`;
  }
  return toArabicDigits(num);
}

export function getMapelArabicName(mapel: MataPelajaran, customMap?: Record<string, string>): string {
  if (customMap && customMap[mapel.id]) return customMap[mapel.id];
  if (customMap && customMap[mapel.nama]) return customMap[mapel.nama];

  const lower = mapel.nama.toLowerCase();
  if (lower.includes('tahfidz') || lower.includes('tahfiz')) return 'تحفيظ القرآن الكريم';
  if (lower.includes('tajwid') || lower.includes('makhorij') || lower.includes('tuhfatul')) return 'التجويد ومخارج الحروف';
  if (lower.includes('fiqih') || lower.includes('fikih') || lower.includes('safinah')) return 'الفقه والعبادات';
  if (lower.includes('aqidah') || lower.includes('akidah') || lower.includes('tauhid')) return 'العقيدة والتوحيد';
  if (lower.includes('nahwu') || lower.includes('jurumiyyah')) return 'النحو (الآجرومية)';
  if (lower.includes('shorof') || lower.includes('sharaf') || lower.includes('amtsilah')) return 'الصرف (الأمثلة التصريفية)';
  if (lower.includes('hadits') || lower.includes('hadis') || lower.includes('arbain')) return 'الحديث النبوي الشريف';
  if (lower.includes('bahasa arab') || lower.includes('durusul') || lower.includes('muhadatsah')) return 'اللغة العربية';
  if (lower.includes('sejarah') || lower.includes('ski') || lower.includes('tarikh')) return 'تاريخ الثقافة الإسلامية';
  if (lower.includes('tafsir')) return 'تفسير القرآن الكريم';
  if (lower.includes('akhlak') || lower.includes('adab')) return 'الأخلاق والآداب';
  return 'المادة الدراسية';
}

export function getPredikatBilingual(score: number): { indo: string; arab: string; letter: string } {
  if (score >= 90) return { indo: 'Mumtaz (A)', arab: 'ممتاز', letter: 'A' };
  if (score >= 80) return { indo: 'Jayyid Jiddan (B)', arab: 'جيد جدا', letter: 'B' };
  if (score >= 70) return { indo: 'Jayyid (C)', arab: 'جيد', letter: 'C' };
  if (score >= 60) return { indo: 'Maqbul (D)', arab: 'مقبول', letter: 'D' };
  return { indo: 'Rasib (E)', arab: 'راسب', letter: 'E' };
}

export function getRankArabic(rank: number): string {
  const ranks = [
    '',
    'الأول',
    'الثاني',
    'الثالث',
    'الرابع',
    'الخامس',
    'السادس',
    'السابع',
    'الثامن',
    'التاسع',
    'العاشر',
    'الحادي عشر',
    'الثاني عشر',
    'الثالث عشر',
    'الرابع عشر',
    'الخامس عشر',
  ];
  return ranks[rank] || `${toArabicDigits(rank)}`;
}

export function getDefaultSantriExtra(
  santriOrId: string | Santri,
  existing?: Record<string, SantriExtraRaportData>
): SantriExtraRaportData {
  const santriObj = typeof santriOrId === 'object' && santriOrId !== null ? santriOrId : null;
  const santriId = santriObj ? santriObj.id : String(santriOrId);

  const defaults: SantriExtraRaportData = {
    akhlaq: 'A',
    kebersihan: 'A',
    ibadah: 'A',
    kesungguhan: 'A',
    disiplinDiri: 'A',
    ketaatan: 'A',
  };

  const fromExisting = existing?.[santriId] as
    | (Partial<SantriExtraRaportData> & { akhlak?: string; bahasa?: string })
    | undefined;
  const fromSantri = santriObj?.kepribadian as
    | (Partial<SantriExtraRaportData> & { akhlak?: string; bahasa?: string })
    | undefined;

  return {
    akhlaq:
      fromSantri?.akhlaq ||
      fromSantri?.akhlak ||
      fromExisting?.akhlaq ||
      fromExisting?.akhlak ||
      defaults.akhlaq,
    kebersihan:
      fromSantri?.kebersihan || fromExisting?.kebersihan || defaults.kebersihan,
    ibadah: fromSantri?.ibadah || fromExisting?.ibadah || defaults.ibadah,
    kesungguhan:
      fromSantri?.kesungguhan || fromExisting?.kesungguhan || defaults.kesungguhan,
    disiplinDiri:
      fromSantri?.disiplinDiri ||
      fromSantri?.bahasa ||
      fromExisting?.disiplinDiri ||
      fromExisting?.bahasa ||
      defaults.disiplinDiri,
    ketaatan: fromSantri?.ketaatan || fromExisting?.ketaatan || defaults.ketaatan,
  };
}

export interface RaportGridRowMeta {
  rowIndex: number;
  section: RaportSectionId | 'spacer';
  rowKind:
    | 'bismillah'
    | 'kop_title'
    | 'kop_sub'
    | 'kop_divider'
    | 'doc_title'
    | 'identitas'
    | 'table_header'
    | 'table_row'
    | 'table_summary'
    | 'kepribadian_title'
    | 'kepribadian_header'
    | 'kepribadian_row'
    | 'tanggal_ttd'
    | 'ttd_label'
    | 'ttd_space'
    | 'ttd_name'
    | 'spacer';
  align?: 'left' | 'center' | 'right';
}

export interface RaportSheetGridResult {
  rows: (string | number)[][];
  merges: XLSX.Range[];
  colWidths: { wch: number }[];
  rowMeta: RaportGridRowMeta[];
  totalCols: number;
}

/**
 * Shared 1:1 Layout & Grid Builder used by BOTH the in-app Excel Grid Preview
 * AND the .xlsx file exporter so the Excel output matches the Preview layout 100%.
 */
export function buildRaportSheetGrid(
  santri: Santri,
  santriIndex: number,
  totalSantriInClass: number,
  rank: number,
  kelas: Kelas | undefined,
  term: AcademicTerm,
  profile: PesantrenProfile,
  allMapel: MataPelajaran[],
  santriGrades: NilaiSantri[],
  config: RaportConfig,
  autoFillPreviewGrades = true
): RaportSheetGridResult {
  const extra = getDefaultSantriExtra(santri, config.santriExtra);
  const waliName = config.waliKelasCustom || kelas?.waliKelas || 'Ust. Wali Kelas';
  const isArabic = config.showArabic;
  const isFullArab = config.templateStyle === 'arabic';
  const isRTL = config.tableDirection === 'rtl' || isFullArab;

  interface ColDef {
    id: string;
    headerTop: string;
    headerSub: string;
    wch: number;
  }

  const baseCols: ColDef[] = [
    {
      id: 'no',
      headerTop: isFullArab ? 'الرقم' : isArabic ? 'NO / الرقم' : 'NO',
      headerSub: '',
      wch: 8,
    },
  ];

  if (!isFullArab) {
    baseCols.push({
      id: 'mapel_indo',
      headerTop: 'MATA PELAJARAN',
      headerSub: '',
      wch: 30,
    });
  }
  if (isArabic) {
    baseCols.push({
      id: 'mapel_arab',
      headerTop: 'المواد الدراسية',
      headerSub: '',
      wch: 26,
    });
  }
  if (config.showKKM) {
    baseCols.push({
      id: 'kkm',
      headerTop: isFullArab ? 'الحد الأدنى' : isArabic ? 'KKM / الحد الأدنى' : 'KKM',
      headerSub: '',
      wch: 11,
    });
  }
  if (config.showDetailNilai) {
    baseCols.push(
      {
        id: 'harian',
        headerTop: isFullArab ? 'تفاصيل الدرجات' : 'RINCIAN NILAI',
        headerSub: isFullArab ? 'اليومية' : isArabic ? 'Harian / اليومية' : 'Harian',
        wch: 12,
      },
      {
        id: 'lisan',
        headerTop: '',
        headerSub: isFullArab ? 'الشفهي' : isArabic ? 'Lisan / الشفهي' : 'Lisan',
        wch: 12,
      },
      {
        id: 'tulis',
        headerTop: '',
        headerSub: isFullArab ? 'التحريري' : isArabic ? 'Tulis / التحريري' : 'Tulis',
        wch: 12,
      }
    );
  }

  baseCols.push({
    id: 'akhir',
    headerTop: isFullArab ? 'الدرجة النهائية' : 'NILAI HASIL UJIAN',
    headerSub: isFullArab ? 'بالرقم' : isArabic ? 'Angka / بالرقم' : 'Angka',
    wch: 14,
  });

  if (config.showTerbilang && !isFullArab) {
    baseCols.push({
      id: 'terbilang_indo',
      headerTop: '',
      headerSub: 'Huruf / Terbilang',
      wch: 24,
    });
  }
  if (config.showTerbilang && isArabic) {
    baseCols.push({
      id: 'terbilang_arab',
      headerTop: '',
      headerSub: 'بالحروف',
      wch: 22,
    });
  }
  if (config.showPredikat) {
    baseCols.push({
      id: 'predikat',
      headerTop: isFullArab ? 'التقدير' : isArabic ? 'PREDIKAT / التقدير' : 'PREDIKAT',
      headerSub: '',
      wch: 20,
    });
  }

  const activeCols = isRTL ? [...baseCols].reverse() : baseCols;
  const totalCols = Math.max(activeCols.length, 6);
  const lastCol = totalCols - 1;

  const rows: (string | number)[][] = [];
  const merges: XLSX.Range[] = [];
  const rowMeta: RaportGridRowMeta[] = [];

  const padRow = (arr: (string | number)[]): (string | number)[] => {
    const res = [...arr];
    while (res.length < totalCols) res.push('');
    return res.slice(0, totalCols);
  };

  const pushFullRow = (
    text: string,
    section: RaportSectionId | 'spacer',
    rowKind: RaportGridRowMeta['rowKind'],
    align: 'left' | 'center' | 'right' = 'center'
  ) => {
    const rIdx = rows.length;
    const rowArr = new Array(totalCols).fill('');
    rowArr[0] = text;
    rows.push(rowArr);
    if (text !== '') {
      merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: lastCol } });
    }
    rowMeta.push({ rowIndex: rIdx, section, rowKind, align });
  };

  const pushSpacer = () => {
    const rIdx = rows.length;
    rows.push(new Array(totalCols).fill(''));
    rowMeta.push({ rowIndex: rIdx, section: 'spacer', rowKind: 'spacer' });
  };

  const mapelToRender = config.showAllMapel
    ? allMapel
    : allMapel.filter((m) =>
        santriGrades.some(
          (g) =>
            g.mapelId === m.id ||
            g.mapelId.trim().toLowerCase() === m.nama.trim().toLowerCase()
        )
      );

  const gradeRows = mapelToRender.map((mapel, mIdx) => {
    const existing = santriGrades.find(
      (g) =>
        g.mapelId === mapel.id ||
        g.mapelId.trim().toLowerCase() === mapel.nama.trim().toLowerCase()
    );
    if (existing) {
      return {
        mapel,
        hasGrade: true,
        harian: existing.nilaiHarian,
        lisan: existing.nilaiLisan,
        tulis: existing.nilaiTulis,
        akhir: existing.nilaiAkhir,
      };
    }
    if (autoFillPreviewGrades) {
      const seed = (santriIndex * 7 + mIdx * 13) % 16;
      const base = 80 + seed;
      const harian = Math.min(98, base + 1);
      const lisan = Math.min(98, base + 2);
      const tulis = Math.max(75, base - 1);
      const akhir = Math.round(harian * 0.3 + lisan * 0.3 + tulis * 0.4);
      return { mapel, hasGrade: true, harian, lisan, tulis, akhir };
    }
    return { mapel, hasGrade: false, harian: 0, lisan: 0, tulis: 0, akhir: 0 };
  });

  const gradedRows = gradeRows.filter((r) => r.hasGrade);
  const totalAkhir = gradedRows.reduce((sum, r) => sum + r.akhir, 0);
  const avgAkhir =
    gradedRows.length > 0 ? Math.round((totalAkhir / gradedRows.length) * 10) / 10 : 0;
  const overallPred =
    gradedRows.length > 0
      ? getPredikatBilingual(avgAkhir)
      : { indo: '-', arab: '-', letter: '-' };

  const sectionOrder =
    config.sectionOrder && config.sectionOrder.length > 0
      ? config.sectionOrder
      : DEFAULT_SECTION_ORDER;

  const kopAlign = config.kopAlign || 'center';

  sectionOrder.forEach((secId) => {
    if (secId === 'bismillah') {
      if (!config.showBismillah) return;
      pushFullRow('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'bismillah', 'bismillah', 'center');
    } else if (secId === 'kop') {
      if (isArabic && config.yayasanNameArab) {
        pushFullRow(config.yayasanNameArab, 'kop', 'kop_sub', kopAlign);
      }
      if (!isFullArab && config.yayasanName) {
        pushFullRow(config.yayasanName, 'kop', 'kop_sub', kopAlign);
      }
      if (isArabic && config.pesantrenNameArab) {
        pushFullRow(config.pesantrenNameArab, 'kop', 'kop_title', kopAlign);
      }
      if (!isFullArab) {
        pushFullRow(profile.nama.toUpperCase(), 'kop', 'kop_title', kopAlign);
        if (profile.subTitle) {
          pushFullRow(profile.subTitle, 'kop', 'kop_sub', kopAlign);
        }
      }
      pushFullRow(
        `NSPP: ${profile.nspp} • ${profile.alamat}, Kab. ${profile.kabupaten}, ${profile.provinsi}`,
        'kop',
        'kop_sub',
        kopAlign
      );
      pushFullRow(
        '====================================================================================================',
        'kop',
        'kop_divider',
        'center'
      );
    } else if (secId === 'judul') {
      if (isArabic && config.headerTitleArab) {
        pushFullRow(config.headerTitleArab, 'judul', 'doc_title', 'center');
      }
      if (!isFullArab && config.headerTitle) {
        pushFullRow(config.headerTitle, 'judul', 'doc_title', 'center');
      }
      pushSpacer();
    } else if (secId === 'identitas') {
      const semText =
        term.semester === 'ganjil'
          ? isArabic
            ? 'Ganjil (الفصل الأول)'
            : 'I (Ganjil)'
          : isArabic
          ? 'Genap (الفصل الثاني)'
          : 'II (Genap)';

      const leftPairs = [
        [
          isFullArab ? 'اسم الطالب' : isArabic ? 'Nama Santri / اسم الطالب' : 'Nama Santri',
          `: ${santri.nama}`,
        ],
        [
          isFullArab ? 'رقم القيد' : isArabic ? 'Nomor Induk (NIS) / رقم القيد' : 'Nomor Induk (NIS)',
          `: ${santri.nis}${isArabic ? ` (${toArabicDigits(santri.nis)})` : ''}`,
        ],
        [
          isFullArab ? 'الفصل الدراسي' : isArabic ? 'Kelas / الفصل' : 'Kelas',
          `: ${kelas?.nama || '-'}`,
        ],
      ];

      const rightPairs = [
        [
          isFullArab ? 'الفترة الدراسية' : isArabic ? 'Semester / الفصل الدراسي' : 'Semester',
          `: ${semText}`,
        ],
        [
          isFullArab ? 'العام الدراسي' : isArabic ? 'Tahun Pelajaran / العام الدراسي' : 'Tahun Pelajaran',
          `: ${term.year} M${isArabic ? ` / ${config.tahunHijriyah}` : ''}`,
        ],
        [
          isFullArab ? 'الحلقة / السكن' : isArabic ? 'Halaqah & Asrama / الحلقة' : 'Halaqah & Asrama',
          `: ${santri.halaqah || 'Halaqah Tahfidz'}`,
        ],
      ];

      if (config.identitasLayout === '1col') {
        [...leftPairs, ...rightPairs].forEach(([lbl, val]) => {
          const rIdx = rows.length;
          const rArr = padRow([lbl, val]);
          rows.push(rArr);
          if (lastCol >= 2) {
            merges.push({ s: { r: rIdx, c: 1 }, e: { r: rIdx, c: lastCol } });
          }
          rowMeta.push({ rowIndex: rIdx, section: 'identitas', rowKind: 'identitas' });
        });
      } else {
        const midCol = Math.max(2, Math.floor(totalCols / 2));
        for (let i = 0; i < 3; i++) {
          const rIdx = rows.length;
          const rArr = new Array(totalCols).fill('');
          rArr[0] = leftPairs[i][0];
          rArr[1] = leftPairs[i][1];
          if (midCol < totalCols) {
            rArr[midCol] = rightPairs[i][0];
          }
          if (midCol + 1 < totalCols) {
            rArr[midCol + 1] = rightPairs[i][1];
          }
          rows.push(rArr);
          if (midCol - 1 > 1) {
            merges.push({ s: { r: rIdx, c: 1 }, e: { r: rIdx, c: midCol - 1 } });
          }
          if (lastCol > midCol + 1) {
            merges.push({ s: { r: rIdx, c: midCol + 1 }, e: { r: rIdx, c: lastCol } });
          }
          rowMeta.push({ rowIndex: rIdx, section: 'identitas', rowKind: 'identitas' });
        }
      }
      pushSpacer();
    } else if (secId === 'nilai') {
      const hIdx = rows.length;
      const headerRow = activeCols.map((c) =>
        c.headerSub ? `${c.headerTop ? c.headerTop + ' - ' : ''}${c.headerSub}` : c.headerTop
      );
      rows.push(padRow(headerRow));
      rowMeta.push({ rowIndex: hIdx, section: 'nilai', rowKind: 'table_header' });

      gradeRows.forEach((gr, mIdx) => {
        const rIdx = rows.length;
        const arabName = getMapelArabicName(gr.mapel, config.customMapelArab);
        const pred = gr.hasGrade
          ? getPredikatBilingual(gr.akhir)
          : { indo: '-', arab: '-', letter: '-' };

        const rowCells = activeCols.map((col) => {
          switch (col.id) {
            case 'no':
              return isFullArab ? toArabicDigits(mIdx + 1) : mIdx + 1;
            case 'mapel_indo':
              return gr.mapel.nama;
            case 'mapel_arab':
              return arabName;
            case 'kkm':
              return gr.mapel.kkm;
            case 'harian':
              return gr.hasGrade ? gr.harian : '-';
            case 'lisan':
              return gr.hasGrade ? gr.lisan : '-';
            case 'tulis':
              return gr.hasGrade ? gr.tulis : '-';
            case 'akhir':
              return gr.hasGrade ? gr.akhir : '-';
            case 'terbilang_indo':
              return gr.hasGrade ? numberToTerbilangIndo(gr.akhir) : '-';
            case 'terbilang_arab':
              return gr.hasGrade ? numberToTerbilangArab(gr.akhir) : '-';
            case 'predikat':
              return gr.hasGrade
                ? isFullArab
                  ? pred.arab
                  : isArabic
                  ? `${pred.indo} / ${pred.arab}`
                  : pred.indo
                : '-';
            default:
              return '';
          }
        });

        rows.push(padRow(rowCells));
        rowMeta.push({ rowIndex: rIdx, section: 'nilai', rowKind: 'table_row' });
      });

      const labelColIdx = activeCols.findIndex(
        (c) => c.id === 'mapel_indo' || c.id === 'mapel_arab'
      );
      const targetLabelCol = labelColIdx >= 0 ? labelColIdx : 1;

      const buildSummaryRow = (
        labelIndo: string,
        labelArab: string,
        akhirVal: string | number,
        terbilangIndoVal: string,
        terbilangArabVal: string,
        predVal: string
      ) => {
        const rIdx = rows.length;
        const arr = new Array(totalCols).fill('');
        arr[targetLabelCol] = isFullArab
          ? labelArab
          : isArabic
          ? `${labelIndo} / ${labelArab}`
          : labelIndo;

        activeCols.forEach((col, cIdx) => {
          if (col.id === 'akhir') arr[cIdx] = akhirVal;
          if (col.id === 'terbilang_indo') arr[cIdx] = terbilangIndoVal;
          if (col.id === 'terbilang_arab') arr[cIdx] = terbilangArabVal;
          if (col.id === 'predikat') arr[cIdx] = predVal;
        });

        rows.push(arr);
        rowMeta.push({ rowIndex: rIdx, section: 'nilai', rowKind: 'table_summary' });
      };

      buildSummaryRow(
        'JUMLAH NILAI SELURUHNYA',
        'المجموع الكلي للدرجات',
        gradedRows.length > 0 ? totalAkhir : '-',
        gradedRows.length > 0 ? numberToTerbilangIndo(totalAkhir) : '-',
        gradedRows.length > 0 ? numberToTerbilangArab(totalAkhir) : '-',
        `${gradedRows.length} Mapel`
      );

      buildSummaryRow(
        "NILAI RATA-RATA (MU'ADDAL)",
        'المعدل العام',
        gradedRows.length > 0 ? avgAkhir : '-',
        gradedRows.length > 0 ? numberToTerbilangIndo(Math.round(avgAkhir)) : '-',
        gradedRows.length > 0 ? numberToTerbilangArab(Math.round(avgAkhir)) : '-',
        gradedRows.length > 0
          ? isFullArab
            ? overallPred.arab
            : isArabic
            ? `${overallPred.indo} (${overallPred.arab})`
            : overallPred.indo
          : '-'
      );

      if (config.showRanking) {
        buildSummaryRow(
          'PERINGKAT KELAS (RANKING)',
          'الترتيب في الفصل',
          `Peringkat ${rank} dari ${totalSantriInClass} Santri`,
          `الترتيب: ${getRankArabic(rank)} من ${toArabicDigits(totalSantriInClass)} طلاب`,
          `الترتيب: ${getRankArabic(rank)}`,
          `Ke-${rank}`
        );
      }

      pushSpacer();
    } else if (secId === 'kepribadian') {
      if (!config.showSikapAbsensi) return;

      const kepTitle = isFullArab
        ? 'تقييم السلوك والمواظبة'
        : isArabic
        ? 'NILAI KEPRIBADIAN SANTRI / تقييم السلوك والمواظبة'
        : 'NILAI KEPRIBADIAN SANTRI';
      pushFullRow(kepTitle, 'kepribadian', 'kepribadian_title', 'left');

      const aspects = [
        { no: 1, label: isArabic ? 'AKHLAQ (الأخلاق)' : 'AKHLAQ', val: extra.akhlaq },
        { no: 2, label: isArabic ? 'KEBERSIHAN (النظافة)' : 'KEBERSIHAN', val: extra.kebersihan },
        { no: 3, label: isArabic ? 'IBADAH (العبادة)' : 'IBADAH', val: extra.ibadah },
        { no: 4, label: isArabic ? 'KESUNGGUHAN (الجد والاجتهاد)' : 'KESUNGGUHAN', val: extra.kesungguhan },
        { no: 5, label: isArabic ? 'DISIPLIN DIRI (الانضباط الذاتي)' : 'DISIPLIN DIRI', val: extra.disiplinDiri },
        { no: 6, label: isArabic ? 'KETAATAN (الطاعة والامتثال)' : 'KETAATAN', val: extra.ketaatan },
      ];

      const kLayout = config.kepribadianLayout || '2col';

      if (kLayout === 'horizontal') {
        const hIdx = rows.length;
        rows.push(
          padRow([
            'NO',
            'NAMA SANTRI',
            'AKHLAQ',
            'KEBERSIHAN',
            'IBADAH',
            'KESUNGGUHAN',
            'DISIPLIN DIRI',
            'KETAATAN',
          ])
        );
        rowMeta.push({ rowIndex: hIdx, section: 'kepribadian', rowKind: 'kepribadian_header' });

        const rIdx = rows.length;
        rows.push(
          padRow([
            1,
            santri.nama,
            extra.akhlaq,
            extra.kebersihan,
            extra.ibadah,
            extra.kesungguhan,
            extra.disiplinDiri,
            extra.ketaatan,
          ])
        );
        rowMeta.push({ rowIndex: rIdx, section: 'kepribadian', rowKind: 'kepribadian_row' });
      } else if (kLayout === '1col') {
        const hIdx = rows.length;
        rows.push(padRow(['NO', 'ASPEK KEPRIBADIAN / السلوك والمواظبة', 'NILAI / التقدير']));
        rowMeta.push({ rowIndex: hIdx, section: 'kepribadian', rowKind: 'kepribadian_header' });

        aspects.forEach((asp) => {
          const rIdx = rows.length;
          rows.push(padRow([asp.no, asp.label, asp.val]));
          rowMeta.push({ rowIndex: rIdx, section: 'kepribadian', rowKind: 'kepribadian_row' });
        });
      } else {
        const mid = Math.max(3, Math.floor(totalCols / 2));
        const hIdx = rows.length;
        const hArr = new Array(totalCols).fill('');
        hArr[0] = 'NO';
        hArr[1] = 'ASPEK KEPRIBADIAN';
        hArr[Math.min(2, mid - 1)] = 'NILAI';
        if (mid + 2 < totalCols) {
          hArr[mid] = 'NO';
          hArr[mid + 1] = 'ASPEK KEPRIBADIAN';
          hArr[mid + 2] = 'NILAI';
        }
        rows.push(hArr);
        rowMeta.push({ rowIndex: hIdx, section: 'kepribadian', rowKind: 'kepribadian_header' });

        for (let i = 0; i < 3; i++) {
          const left = aspects[i];
          const right = aspects[i + 3];
          const rIdx = rows.length;
          const rArr = new Array(totalCols).fill('');
          rArr[0] = left.no;
          rArr[1] = left.label;
          rArr[Math.min(2, mid - 1)] = left.val;
          if (mid + 2 < totalCols) {
            rArr[mid] = right.no;
            rArr[mid + 1] = right.label;
            rArr[mid + 2] = right.val;
          }
          rows.push(rArr);
          rowMeta.push({ rowIndex: rIdx, section: 'kepribadian', rowKind: 'kepribadian_row' });
        }
      }
      pushSpacer();
    } else if (secId === 'ttd') {
      const tglText = isFullArab
        ? `تحريرا في ${config.lokasiCetakArab}، ${config.tanggalCetakArab}`
        : isArabic
        ? `Ditetapkan di: ${config.lokasiCetak}, ${config.tanggalCetak} • تحريرا في ${config.lokasiCetakArab}، ${config.tanggalCetakArab}`
        : `Ditetapkan di: ${config.lokasiCetak}, ${config.tanggalCetak}`;

      pushFullRow(
        tglText,
        'ttd',
        'tanggal_ttd',
        config.signatureAlign || config.tanggalAlign || 'right'
      );

      const sigOrder =
        config.signatureOrder && config.signatureOrder.length > 0
          ? config.signatureOrder
          : DEFAULT_SIGNATURE_ORDER;

      const getSigData = (role: RaportSignatureRole) => {
        if (role === 'orang_tua') {
          return {
            title: isFullArab
              ? config.orangTuaLabelArab
              : isArabic
              ? `${config.orangTuaLabel} / ${config.orangTuaLabelArab}`
              : config.orangTuaLabel,
            name: '( ................................................. )',
          };
        }
        if (role === 'wali_kelas') {
          return {
            title: isFullArab
              ? config.waliKelasJabatanArab
              : isArabic
              ? `${config.waliKelasJabatan} / ${config.waliKelasJabatanArab}`
              : config.waliKelasJabatan,
            name: waliName,
          };
        }
        return {
          title: isFullArab
            ? config.pejabatJabatanArab
            : isArabic
            ? `${config.pejabatJabatan} / ${config.pejabatJabatanArab}`
            : config.pejabatJabatan,
          name: isFullArab
            ? config.pejabatNameArab
            : isArabic
            ? `${config.pejabatName} (${config.pejabatNameArab})`
            : config.pejabatName,
        };
      };

      const sigItems = sigOrder.map(getSigData);
      const colPositions = [
        0,
        Math.max(1, Math.floor(totalCols / 2) - 1),
        Math.max(2, totalCols - 2),
      ];

      const rLblIdx = rows.length;
      const lblArr = new Array(totalCols).fill('');
      sigItems.forEach((item, idx) => {
        const pos = colPositions[idx] ?? idx * 2;
        if (pos < totalCols) lblArr[pos] = item.title;
      });
      rows.push(lblArr);
      rowMeta.push({ rowIndex: rLblIdx, section: 'ttd', rowKind: 'ttd_label' });

      for (let s = 0; s < 3; s++) {
        const rsIdx = rows.length;
        rows.push(new Array(totalCols).fill(''));
        rowMeta.push({ rowIndex: rsIdx, section: 'ttd', rowKind: 'ttd_space' });
      }

      const rNameIdx = rows.length;
      const nameArr = new Array(totalCols).fill('');
      sigItems.forEach((item, idx) => {
        const pos = colPositions[idx] ?? idx * 2;
        if (pos < totalCols) nameArr[pos] = item.name;
      });
      rows.push(nameArr);
      rowMeta.push({ rowIndex: rNameIdx, section: 'ttd', rowKind: 'ttd_name' });
    }
  });

  const colWidths = activeCols.map((c) => ({ wch: c.wch }));
  while (colWidths.length < totalCols) {
    colWidths.push({ wch: 16 });
  }

  return {
    rows,
    merges,
    colWidths,
    rowMeta,
    totalCols,
  };
}

/**
 * Export full customizable Bilingual Pesantren Report Cards (Raport) to Excel (.xlsx).
 * Uses buildRaportSheetGrid so the Excel sheets match the Preview 1:1!
 */
export function exportRaportClassToExcel(
  kelas: Kelas,
  term: AcademicTerm,
  santriList: Santri[],
  allNilai: NilaiSantri[],
  allMapel: MataPelajaran[],
  profile: PesantrenProfile,
  config: RaportConfig,
  autoFillPreviewGrades = true
) {
  const wb = XLSX.utils.book_new();
  const termNilai = allNilai.filter((n) => n.termId === term.id);

  const rankingsMap: Record<string, number> = {};
  const totalsList = santriList.map((s, sIdx) => {
    const grades = termNilai.filter((n) => n.santriId === s.id);
    const sum =
      grades.length > 0
        ? grades.reduce((acc, g) => acc + g.nilaiAkhir, 0)
        : 80 * allMapel.length - sIdx;
    return { santriId: s.id, sum };
  });
  totalsList
    .slice()
    .sort((a, b) => b.sum - a.sum)
    .forEach((item, idx) => {
      rankingsMap[item.santriId] = idx + 1;
    });

  // =========================================================================
  // SHEET 1..N: INDIVIDUAL SANTRI REPORT CARD SHEETS (1:1 Match with Preview!)
  // =========================================================================
  santriList.forEach((santri, sIdx) => {
    const santriGrades = termNilai.filter((n) => n.santriId === santri.id);
    const rank = rankingsMap[santri.id] || sIdx + 1;

    const grid = buildRaportSheetGrid(
      santri,
      sIdx,
      santriList.length,
      rank,
      kelas,
      term,
      profile,
      allMapel,
      santriGrades,
      config,
      autoFillPreviewGrades
    );

    const wsSantri = XLSX.utils.aoa_to_sheet(grid.rows);
    wsSantri['!cols'] = grid.colWidths;
    wsSantri['!merges'] = grid.merges;

    const prefix = String(sIdx + 1).padStart(2, '0');
    const cleanName = santri.nama.replace(/[\\/?*[\]:]/g, '').substring(0, 25);
    XLSX.utils.book_append_sheet(wb, wsSantri, `${prefix}_${cleanName}`);
  });

  // =========================================================================
  // LAST SHEET: FORMAT_DAN_GAYA_RAPORT (Editable Configuration & Layout Sheet)
  // =========================================================================
  const configRows: (string | number)[][] = [
    ['PENGATURAN TATA LETAK, FORMAT, GAYA & DATA RAPORT PESANTREN (SINKRON 1:1 PREVIEW & EXCEL)'],
    ['Petunjuk: Ubah nilai pengaturan atau urutan tata letak di bawah ini, atau edit langsung pada sheet santri, lalu upload kembali ke aplikasi.'],
    [''],
    ['KODE PENGATURAN', 'NAMA PENGATURAN FORMAT / TATA LETAK', 'NILAI PENGATURAN', 'KETERANGAN / PILIHAN'],
    ['templateStyle', 'Gaya Template Raport', config.templateStyle, 'Pilihan: bilingual | arabic | nasional'],
    ['tableDirection', 'Arah Tabel Nilai', config.tableDirection, 'Pilihan: ltr (Indonesia Kiri) | rtl (Arab Kanan)'],
    ['fontFamily', 'Gaya Tulisan / Font', config.fontFamily, 'Pilihan: font-serif | font-amiri | font-sans | font-mono'],
    ['colorTheme', 'Tema Warna Raport', config.colorTheme, 'Pilihan: classic_bw | emerald | royal_blue | gold_classic'],
    ['sectionOrder', 'Urutan Posisi Bagian Raport', (config.sectionOrder || DEFAULT_SECTION_ORDER).join(','), 'Urutan: bismillah,kop,judul,identitas,nilai,kepribadian,ttd'],
    ['kopAlign', 'Posisi Perataan Kop Surat', config.kopAlign || 'center', 'Pilihan: center | left | right'],
    ['identitasLayout', 'Tata Letak Identitas Santri', config.identitasLayout || '2col', 'Pilihan: 2col (2 Kolom Kiri-Kanan) | 1col (1 Kolom Memanjang)'],
    ['kepribadianLayout', 'Tata Letak Tabel Kepribadian', config.kepribadianLayout || '2col', 'Pilihan: 2col (2 Kolom) | 1col (1 Kolom) | horizontal (Menyamping)'],
    ['tanggalAlign', 'Posisi Tempat & Tanggal Cetak', config.tanggalAlign || 'right', 'Pilihan: right | center | left'],
    ['signatureOrder', 'Urutan Posisi Tanda Tangan (Kiri-Tengah-Kanan)', (config.signatureOrder || DEFAULT_SIGNATURE_ORDER).join(','), 'Pilihan: orang_tua,wali_kelas,pimpinan'],
    ['paperPadding', 'Kerapatan Tata Letak Kertas', config.paperPadding || 'normal', 'Pilihan: compact | normal | spacious'],
    ['showArabic', 'Tampilkan Bahasa Arab', config.showArabic ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showBismillah', 'Tampilkan Bismillah di Atas Kop', config.showBismillah ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showLogo', 'Tampilkan Logo Pesantren', config.showLogo ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showBorderFrame', 'Tampilkan Bingkai Ornamen Raport', config.showBorderFrame ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showAllMapel', 'Tampilkan Semua Mapel di Tabel', config.showAllMapel ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showKKM', 'Tampilkan Kolom KKM', config.showKKM ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showDetailNilai', 'Tampilkan Kolom Harian/Lisan/Tulis', config.showDetailNilai ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showTerbilang', 'Tampilkan Nilai Huruf / Terbilang', config.showTerbilang ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showPredikat', 'Tampilkan Kolom Predikat / Taqdir', config.showPredikat ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showSikapAbsensi', 'Tampilkan Tabel Nilai Kepribadian', config.showSikapAbsensi ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['showRanking', 'Tampilkan Peringkat / Ranking Kelas', config.showRanking ? 'YA' : 'TIDAK', 'Pilihan: YA | TIDAK'],
    ['yayasanName', 'Nama Yayasan (Indonesia)', config.yayasanName, 'Teks kop atas Indonesia'],
    ['yayasanNameArab', 'Nama Yayasan (Arab)', config.yayasanNameArab, 'Teks kop atas Arab'],
    ['pesantrenNameArab', 'Nama Pesantren (Arab)', config.pesantrenNameArab, 'Nama Ma\'had dalam Bahasa Arab'],
    ['headerTitle', 'Judul Raport (Indonesia)', config.headerTitle, 'Judul utama lembar raport'],
    ['headerTitleArab', 'Judul Raport (Arab)', config.headerTitleArab, 'Judul utama Bahasa Arab (كشف الدرجات)'],
    ['tahunHijriyah', 'Tahun Ajaran Hijriyah', config.tahunHijriyah, 'Contoh: 1446 / 1447 هـ'],
    ['pejabatName', 'Nama Pimpinan / Mudir (Indonesia)', config.pejabatName, 'Nama penandatangan pimpinan'],
    ['pejabatNameArab', 'Nama Pimpinan / Mudir (Arab)', config.pejabatNameArab, 'Nama pimpinan dalam Bahasa Arab'],
    ['pejabatJabatan', 'Jabatan Pimpinan (Indonesia)', config.pejabatJabatan, 'Contoh: Pengasuh / Mudir Ma\'had'],
    ['pejabatJabatanArab', 'Jabatan Pimpinan (Arab)', config.pejabatJabatanArab, 'Contoh: مدير المعهد'],
    ['waliKelasCustom', 'Nama Wali Kelas (Opsional)', config.waliKelasCustom || kelas.waliKelas || '', 'Kosongkan jika ikut data kelas'],
    ['waliKelasJabatan', 'Label Wali Kelas (Indonesia)', config.waliKelasJabatan, 'Contoh: Wali Kelas'],
    ['waliKelasJabatanArab', 'Label Wali Kelas (Arab)', config.waliKelasJabatanArab, 'Contoh: ولي الفصل'],
    ['orangTuaLabel', 'Label Orang Tua / Wali (Indonesia)', config.orangTuaLabel, 'Contoh: Orang Tua / Wali Santri'],
    ['orangTuaLabelArab', 'Label Orang Tua / Wali (Arab)', config.orangTuaLabelArab, 'Contoh: ولي أمر الطالب'],
    ['lokasiCetak', 'Kota Cetak (Indonesia)', config.lokasiCetak, 'Contoh: Bungo / Cianjur'],
    ['lokasiCetakArab', 'Kota Cetak (Arab)', config.lokasiCetakArab, 'Contoh: بونغو'],
    ['tanggalCetak', 'Tanggal Cetak (Masehi)', config.tanggalCetak, 'Tanggal tanda tangan raport'],
    ['tanggalCetakArab', 'Tanggal Cetak (Hijriyah)', config.tanggalCetakArab, 'Tanggal Hijriyah tanda tangan'],
    [''],
    ['DAFTAR MATA PELAJARAN & TERJEMAHAN BAHASA ARAB (BISA DIEDIT DI SINI)'],
    ['ID_MAPEL', 'KODE MAPEL', 'NAMA MATA PELAJARAN (INDONESIA)', 'NAMA MATA PELAJARAN (ARAB)', 'KKM'],
  ];

  allMapel.forEach((m) => {
    configRows.push([
      m.id,
      m.kode,
      m.nama,
      getMapelArabicName(m, config.customMapelArab),
      m.kkm,
    ]);
  });

  configRows.push(['']);
  configRows.push(['DATA NILAI KEPRIBADIAN SANTRI (BISA DIEDIT DI SINI)']);
  configRows.push([
    'NO',
    'NAMA SANTRI',
    'AKHLAQ',
    'KEBERSIHAN',
    'IBADAH',
    'KESUNGGUHAN',
    'DISIPLIN DIRI',
    'KETAATAN',
  ]);

  santriList.forEach((s, idx) => {
    const extra = getDefaultSantriExtra(s, config.santriExtra);
    configRows.push([
      idx + 1,
      s.nama,
      extra.akhlaq,
      extra.kebersihan,
      extra.ibadah,
      extra.kesungguhan,
      extra.disiplinDiri,
      extra.ketaatan,
    ]);
  });

  const wsConfig = XLSX.utils.aoa_to_sheet(configRows);
  wsConfig['!cols'] = [
    { wch: 22 },
    { wch: 42 },
    { wch: 44 },
    { wch: 42 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsConfig, 'FORMAT_DAN_GAYA_RAPORT');

  const cleanKelasName = kelas.nama.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTermName = term.label.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Raport_Bilingual_${cleanKelasName}_${cleanTermName}.xlsx`);
}

/**
 * Parse an uploaded Raport Excel file (.xlsx) to update RaportConfig (format, layout, style, TTD, Arabic subject names, Kepribadian)
 * AND student grades/kepribadian edited directly inside the 1:1 student sheets!
 */
export async function parseRaportFormatFromExcel(
  file: File,
  currentConfig: RaportConfig,
  allSantri: Santri[],
  allMapel: MataPelajaran[],
  termId: string,
  kelasId: string
): Promise<{
  success: boolean;
  updatedConfig: RaportConfig;
  updatedGrades: NilaiSantri[];
  message: string;
}> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const newConfig: RaportConfig = {
      ...currentConfig,
      sectionOrder: [...(currentConfig.sectionOrder || DEFAULT_SECTION_ORDER)],
      signatureOrder: [...(currentConfig.signatureOrder || DEFAULT_SIGNATURE_ORDER)],
      customMapelArab: { ...currentConfig.customMapelArab },
      santriExtra: { ...currentConfig.santriExtra },
    };

    let configChangesCount = 0;
    const updatedGrades: NilaiSantri[] = [];

    const configSheetName = workbook.SheetNames.find(
      (n) => n.toUpperCase().includes('FORMAT') || n.toUpperCase().includes('PENGATURAN')
    );

    if (configSheetName) {
      const ws = workbook.Sheets[configSheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 });

      let section: 'settings' | 'mapel' | 'santri' = 'settings';

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row) || row.length === 0) continue;

        const col0 = String(row[0] || '').trim();
        const col2 = String(row[2] ?? '').trim();

        if (col0 === 'ID_MAPEL') {
          section = 'mapel';
          continue;
        }
        if (col0 === 'ID_SANTRI' || (col0 === 'NO' && String(row[1] || '').trim().toUpperCase() === 'NAMA SANTRI')) {
          section = 'santri';
          continue;
        }

        if (section === 'settings' && col0 && col2 !== '') {
          const boolVal = col2.toUpperCase() === 'YA' || col2.toUpperCase() === 'TRUE' || col2 === '1';
          switch (col0) {
            case 'templateStyle':
              if (['bilingual', 'arabic', 'nasional'].includes(col2)) {
                newConfig.templateStyle = col2 as RaportConfig['templateStyle'];
                configChangesCount++;
              }
              break;
            case 'tableDirection':
              if (['ltr', 'rtl'].includes(col2.toLowerCase())) {
                newConfig.tableDirection = col2.toLowerCase() as 'ltr' | 'rtl';
                configChangesCount++;
              }
              break;
            case 'fontFamily':
              if (['font-serif', 'font-sans', 'font-mono', 'font-amiri'].includes(col2)) {
                newConfig.fontFamily = col2 as RaportConfig['fontFamily'];
                configChangesCount++;
              }
              break;
            case 'colorTheme':
              if (['emerald', 'classic_bw', 'royal_blue', 'gold_classic'].includes(col2)) {
                newConfig.colorTheme = col2 as RaportConfig['colorTheme'];
                configChangesCount++;
              }
              break;
            case 'sectionOrder': {
              const parts = col2
                .split(',')
                .map((s) => s.trim() as RaportSectionId)
                .filter((s) => DEFAULT_SECTION_ORDER.includes(s));
              if (parts.length > 0) {
                newConfig.sectionOrder = parts;
                configChangesCount++;
              }
              break;
            }
            case 'kopAlign':
              if (['center', 'left', 'right'].includes(col2.toLowerCase())) {
                newConfig.kopAlign = col2.toLowerCase() as RaportConfig['kopAlign'];
                configChangesCount++;
              }
              break;
            case 'identitasLayout':
              if (['2col', '1col'].includes(col2.toLowerCase())) {
                newConfig.identitasLayout = col2.toLowerCase() as RaportConfig['identitasLayout'];
                configChangesCount++;
              }
              break;
            case 'kepribadianLayout':
              if (['2col', '1col', 'horizontal'].includes(col2.toLowerCase())) {
                newConfig.kepribadianLayout = col2.toLowerCase() as RaportConfig['kepribadianLayout'];
                configChangesCount++;
              }
              break;
            case 'tanggalAlign':
              if (['right', 'center', 'left'].includes(col2.toLowerCase())) {
                newConfig.tanggalAlign = col2.toLowerCase() as RaportConfig['tanggalAlign'];
                configChangesCount++;
              }
              break;
            case 'signatureOrder': {
              const sParts = col2
                .split(',')
                .map((s) => s.trim() as RaportSignatureRole)
                .filter((s) => DEFAULT_SIGNATURE_ORDER.includes(s));
              if (sParts.length > 0) {
                newConfig.signatureOrder = sParts;
                configChangesCount++;
              }
              break;
            }
            case 'paperPadding':
              if (['compact', 'normal', 'spacious'].includes(col2.toLowerCase())) {
                newConfig.paperPadding = col2.toLowerCase() as RaportConfig['paperPadding'];
                configChangesCount++;
              }
              break;
            case 'showArabic':
              newConfig.showArabic = boolVal;
              configChangesCount++;
              break;
            case 'showBismillah':
              newConfig.showBismillah = boolVal;
              configChangesCount++;
              break;
            case 'showLogo':
              newConfig.showLogo = boolVal;
              configChangesCount++;
              break;
            case 'showBorderFrame':
              newConfig.showBorderFrame = boolVal;
              configChangesCount++;
              break;
            case 'showAllMapel':
              newConfig.showAllMapel = boolVal;
              configChangesCount++;
              break;
            case 'showKKM':
              newConfig.showKKM = boolVal;
              configChangesCount++;
              break;
            case 'showDetailNilai':
              newConfig.showDetailNilai = boolVal;
              configChangesCount++;
              break;
            case 'showTerbilang':
              newConfig.showTerbilang = boolVal;
              configChangesCount++;
              break;
            case 'showPredikat':
              newConfig.showPredikat = boolVal;
              configChangesCount++;
              break;
            case 'showSikapAbsensi':
              newConfig.showSikapAbsensi = boolVal;
              configChangesCount++;
              break;
            case 'showRanking':
              newConfig.showRanking = boolVal;
              configChangesCount++;
              break;
            case 'yayasanName':
              newConfig.yayasanName = col2;
              configChangesCount++;
              break;
            case 'yayasanNameArab':
              newConfig.yayasanNameArab = col2;
              configChangesCount++;
              break;
            case 'pesantrenNameArab':
              newConfig.pesantrenNameArab = col2;
              configChangesCount++;
              break;
            case 'headerTitle':
              newConfig.headerTitle = col2;
              configChangesCount++;
              break;
            case 'headerTitleArab':
              newConfig.headerTitleArab = col2;
              configChangesCount++;
              break;
            case 'tahunHijriyah':
              newConfig.tahunHijriyah = col2;
              configChangesCount++;
              break;
            case 'pejabatName':
              newConfig.pejabatName = col2;
              configChangesCount++;
              break;
            case 'pejabatNameArab':
              newConfig.pejabatNameArab = col2;
              configChangesCount++;
              break;
            case 'pejabatJabatan':
              newConfig.pejabatJabatan = col2;
              configChangesCount++;
              break;
            case 'pejabatJabatanArab':
              newConfig.pejabatJabatanArab = col2;
              configChangesCount++;
              break;
            case 'waliKelasCustom':
              newConfig.waliKelasCustom = col2;
              configChangesCount++;
              break;
            case 'waliKelasJabatan':
              newConfig.waliKelasJabatan = col2;
              configChangesCount++;
              break;
            case 'waliKelasJabatanArab':
              newConfig.waliKelasJabatanArab = col2;
              configChangesCount++;
              break;
            case 'orangTuaLabel':
              newConfig.orangTuaLabel = col2;
              configChangesCount++;
              break;
            case 'orangTuaLabelArab':
              newConfig.orangTuaLabelArab = col2;
              configChangesCount++;
              break;
            case 'lokasiCetak':
              newConfig.lokasiCetak = col2;
              configChangesCount++;
              break;
            case 'lokasiCetakArab':
              newConfig.lokasiCetakArab = col2;
              configChangesCount++;
              break;
            case 'tanggalCetak':
              newConfig.tanggalCetak = col2;
              configChangesCount++;
              break;
            case 'tanggalCetakArab':
              newConfig.tanggalCetakArab = col2;
              configChangesCount++;
              break;
          }
        } else if (section === 'mapel' && col0) {
          const arabName = String(row[3] || '').trim();
          if (arabName) {
            newConfig.customMapelArab[col0] = arabName;
            configChangesCount++;
          }
        } else if (section === 'santri' && col0) {
          const namaCell = String(row[1] || '').trim();
          const matchedSantri = allSantri.find(
            (s) =>
              s.id === col0 ||
              s.nama.trim().toLowerCase() === namaCell.toLowerCase() ||
              s.nis === namaCell
          );
          if (matchedSantri) {
            newConfig.santriExtra[matchedSantri.id] = {
              akhlaq: String(row[2] || 'A').trim(),
              kebersihan: String(row[3] || 'A').trim(),
              ibadah: String(row[4] || 'A').trim(),
              kesungguhan: String(row[5] || 'A').trim(),
              disiplinDiri: String(row[6] || 'A').trim(),
              ketaatan: String(row[7] || 'A').trim(),
            };
            configChangesCount++;
          }
        }
      }
    }

    // 2. Also parse student sheets dynamically (whether columns were hidden, reordered, or RTL)
    workbook.SheetNames.forEach((sheetName) => {
      if (sheetName === configSheetName) return;
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 });
      if (!rows || rows.length < 6) return;

      let foundSantri: Santri | undefined;
      for (let r = 0; r < Math.min(rows.length, 25); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const text = row.map((c) => String(c || '')).join(' ');
        foundSantri = allSantri.find(
          (s) =>
            (s.nis && text.includes(s.nis)) ||
            text.toLowerCase().includes(s.nama.toLowerCase())
        );
        if (foundSantri) break;
      }
      if (!foundSantri) return;

      let mapelCol = -1;
      let harianCol = -1;
      let lisanCol = -1;
      let tulisCol = -1;
      let akhirCol = -1;
      let gradeHeaderRow = -1;

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const upperCells = row.map((c) => String(c || '').trim().toUpperCase());
        const mIdx = upperCells.findIndex(
          (c) => c.includes('MATA PELAJARAN') || c.includes('المواد الدراسية')
        );
        const aIdx = upperCells.findIndex(
          (c) => c.includes('ANGKA') || c.includes('بالرقم') || c.includes('NILAI HASIL')
        );
        if (mIdx >= 0 && aIdx >= 0) {
          mapelCol = mIdx;
          akhirCol = aIdx;
          harianCol = upperCells.findIndex((c) => c.includes('HARIAN') || c.includes('اليومية'));
          lisanCol = upperCells.findIndex((c) => c.includes('LISAN') || c.includes('الشفهي'));
          tulisCol = upperCells.findIndex((c) => c.includes('TULIS') || c.includes('التحريري'));
          gradeHeaderRow = r;
          break;
        }
      }

      if (gradeHeaderRow >= 0 && mapelCol >= 0 && akhirCol >= 0) {
        for (let r = gradeHeaderRow + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!Array.isArray(row)) continue;
          const mapelNameCell = String(row[mapelCol] || '').trim();
          if (!mapelNameCell) continue;
          const mapelObj = allMapel.find(
            (m) =>
              m.nama.toLowerCase() === mapelNameCell.toLowerCase() ||
              getMapelArabicName(m, newConfig.customMapelArab) === mapelNameCell
          );
          if (!mapelObj) continue;

          const akhirVal = Number(row[akhirCol]);
          const harianVal = harianCol >= 0 ? Number(row[harianCol]) : akhirVal;
          const lisanVal = lisanCol >= 0 ? Number(row[lisanCol]) : akhirVal;
          const tulisVal = tulisCol >= 0 ? Number(row[tulisCol]) : akhirVal;

          if (!isNaN(akhirVal) && akhirVal > 0) {
            const h = !isNaN(harianVal) && harianVal > 0 ? harianVal : akhirVal;
            const l = !isNaN(lisanVal) && lisanVal > 0 ? lisanVal : akhirVal;
            const t = !isNaN(tulisVal) && tulisVal > 0 ? tulisVal : akhirVal;
            const pred = getPredikatBilingual(akhirVal);
            updatedGrades.push({
              id: `nil-${foundSantri.id}-${mapelObj.id}`,
              termId,
              santriId: foundSantri.id,
              kelasId: foundSantri.kelasId || kelasId,
              mapelId: mapelObj.id,
              asatidzId: 'ust-1',
              nilaiHarian: h,
              nilaiLisan: l,
              nilaiTulis: t,
              nilaiAkhir: akhirVal,
              predikat: pred.indo,
              tanggalInput: new Date().toISOString().slice(0, 10),
            });
          }
        }
      }

      const currentExtra = { ...getDefaultSantriExtra(foundSantri, newConfig.santriExtra) };
      let extraUpdated = false;
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length - 1; c++) {
          const cellTxt = String(row[c] || '').trim().toUpperCase();
          const nextVal = String(row[c + 1] || row[c + 2] || '').trim();
          if (!cellTxt || !nextVal) continue;
          if (cellTxt.startsWith('AKHLAQ')) {
            currentExtra.akhlaq = nextVal;
            extraUpdated = true;
          } else if (cellTxt.startsWith('KEBERSIHAN')) {
            currentExtra.kebersihan = nextVal;
            extraUpdated = true;
          } else if (cellTxt.startsWith('IBADAH')) {
            currentExtra.ibadah = nextVal;
            extraUpdated = true;
          } else if (cellTxt.startsWith('KESUNGGUHAN')) {
            currentExtra.kesungguhan = nextVal;
            extraUpdated = true;
          } else if (cellTxt.startsWith('DISIPLIN DIRI')) {
            currentExtra.disiplinDiri = nextVal;
            extraUpdated = true;
          } else if (cellTxt.startsWith('KETAATAN')) {
            currentExtra.ketaatan = nextVal;
            extraUpdated = true;
          }
        }
      }
      if (extraUpdated) {
        newConfig.santriExtra[foundSantri.id] = currentExtra;
        configChangesCount++;
      }
    });

    return {
      success: true,
      updatedConfig: newConfig,
      updatedGrades,
      message: `Berhasil mengimpor format & gaya raport dari Excel (${configChangesCount} pengaturan diperbarui${
        updatedGrades.length > 0 ? `, serta ${updatedGrades.length} data nilai santri diperbarui` : ''
      }).`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membaca file Excel format raport.';
    return {
      success: false,
      updatedConfig: currentConfig,
      updatedGrades: [],
      message: msg,
    };
  }
}

/**
 * Download Excel Template for Kepribadian Santri pre-filled directly from Data Santri
 * Exact columns matching user specification:
 * NO | NAMA SANTRI | AKHLAQ | KEBERSIHAN | IBADAH | KESUNGGUHAN | DISIPLIN DIRI | KETAATAN
 */
export function downloadKepribadianTemplateExcel(
  santriList: Santri[],
  _allKelas: Kelas[],
  labelKelas = 'Semua_Kelas'
) {
  const wb = XLSX.utils.book_new();

  const headerRows: (string | number)[][] = [
    [
      'NO',
      'NAMA SANTRI',
      'AKHLAQ',
      'KEBERSIHAN',
      'IBADAH',
      'KESUNGGUHAN',
      'DISIPLIN DIRI',
      'KETAATAN',
    ],
  ];

  santriList.forEach((s, idx) => {
    const extra = getDefaultSantriExtra(s);
    headerRows.push([
      idx + 1,
      s.nama,
      extra.akhlaq,
      extra.kebersihan,
      extra.ibadah,
      extra.kesungguhan,
      extra.disiplinDiri,
      extra.ketaatan,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(headerRows);
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 32 }, // NAMA SANTRI
    { wch: 14 }, // AKHLAQ
    { wch: 14 }, // KEBERSIHAN
    { wch: 14 }, // IBADAH
    { wch: 16 }, // KESUNGGUHAN
    { wch: 16 }, // DISIPLIN DIRI
    { wch: 14 }, // KETAATAN
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Kepribadian_Santri');
  const safeName = labelKelas.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Template_Kepribadian_Santri_${safeName}.xlsx`);
}

/**
 * Parse uploaded Excel file of Kepribadian Santri and match with Data Santri
 * Exact columns: NO | NAMA SANTRI | AKHLAQ | KEBERSIHAN | IBADAH | KESUNGGUHAN | DISIPLIN DIRI | KETAATAN
 */
export async function parseKepribadianSantriExcel(
  file: File,
  allSantri: Santri[]
): Promise<{
  success: boolean;
  updatedMap: Record<string, SantriKepribadianData>;
  matchedCount: number;
  message: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        updatedMap: {},
        matchedCount: 0,
        message: 'File Excel tidak memiliki lembar kerja (sheet).',
      };
    }

    let rawData: unknown[][] = [];
    for (const sName of workbook.SheetNames) {
      const ws = workbook.Sheets[sName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
      if (rows && rows.length > 0) {
        rawData = rows;
        break;
      }
    }

    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        updatedMap: {},
        matchedCount: 0,
        message: 'Lembar kerja Excel kosong.',
      };
    }

    let headerRowIdx = -1;
    let namaCol = -1;
    let akhlaqCol = -1;
    let kebersihanCol = -1;
    let ibadahCol = -1;
    let kesungguhanCol = -1;
    let disiplinCol = -1;
    let ketaatanCol = -1;

    for (let r = 0; r < Math.min(rawData.length, 15); r++) {
      const row = rawData[r];
      if (!Array.isArray(row)) continue;

      let rNama = -1;
      let rAkhlaq = -1;
      let rKebersihan = -1;
      let rIbadah = -1;
      let rKesungguhan = -1;
      let rDisiplin = -1;
      let rKetaatan = -1;
      let score = 0;

      row.forEach((cell, cIdx) => {
        const txt = String(cell ?? '').trim().toUpperCase();
        if (!txt || txt.length > 50) return;

        if (txt.includes('NAMA SANTRI') || txt === 'NAMA' || txt === 'NAMA LENGKAP') {
          rNama = cIdx;
          score += 2;
        } else if (txt.includes('AKHLAQ') || txt.includes('AKHLAK')) {
          rAkhlaq = cIdx;
          score++;
        } else if (txt.includes('KEBERSIHAN')) {
          rKebersihan = cIdx;
          score++;
        } else if (txt.includes('IBADAH')) {
          rIbadah = cIdx;
          score++;
        } else if (txt.includes('KESUNGGUHAN')) {
          rKesungguhan = cIdx;
          score++;
        } else if (txt.includes('DISIPLIN')) {
          rDisiplin = cIdx;
          score++;
        } else if (txt.includes('KETAATAN')) {
          rKetaatan = cIdx;
          score++;
        }
      });

      if (rNama !== -1 && score >= 3) {
        headerRowIdx = r;
        namaCol = rNama;
        akhlaqCol = rAkhlaq;
        kebersihanCol = rKebersihan;
        ibadahCol = rIbadah;
        kesungguhanCol = rKesungguhan;
        disiplinCol = rDisiplin;
        ketaatanCol = rKetaatan;
        break;
      }
    }

    if (headerRowIdx === -1) {
      // Standard template column positions:
      // 0: NO, 1: NAMA SANTRI, 2: AKHLAQ, 3: KEBERSIHAN, 4: IBADAH, 5: KESUNGGUHAN, 6: DISIPLIN DIRI, 7: KETAATAN
      headerRowIdx = 0;
      namaCol = 1;
      akhlaqCol = 2;
      kebersihanCol = 3;
      ibadahCol = 4;
      kesungguhanCol = 5;
      disiplinCol = 6;
      ketaatanCol = 7;
    }

    const updatedMap: Record<string, SantriKepribadianData> = {};
    let matchedCount = 0;

    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!Array.isArray(row)) continue;

      const rawNama = namaCol !== -1 ? String(row[namaCol] ?? '').trim() : '';
      if (!rawNama || rawNama.toUpperCase() === 'NAMA SANTRI') continue;

      // Match santri from Data Santri (allSantri) by Name or NIS
      const matchedSantri = allSantri.find(
        (s) =>
          s.nama.trim().toLowerCase() === rawNama.toLowerCase() ||
          (s.nis && s.nis.trim().toLowerCase() === rawNama.toLowerCase())
      );

      if (!matchedSantri) continue;

      const existingExtra = getDefaultSantriExtra(matchedSantri);
      const akhlaq =
        akhlaqCol !== -1 && String(row[akhlaqCol] ?? '').trim()
          ? String(row[akhlaqCol]).trim()
          : existingExtra.akhlaq;
      const kebersihan =
        kebersihanCol !== -1 && String(row[kebersihanCol] ?? '').trim()
          ? String(row[kebersihanCol]).trim()
          : existingExtra.kebersihan;
      const ibadah =
        ibadahCol !== -1 && String(row[ibadahCol] ?? '').trim()
          ? String(row[ibadahCol]).trim()
          : existingExtra.ibadah;
      const kesungguhan =
        kesungguhanCol !== -1 && String(row[kesungguhanCol] ?? '').trim()
          ? String(row[kesungguhanCol]).trim()
          : existingExtra.kesungguhan;
      const disiplinDiri =
        disiplinCol !== -1 && String(row[disiplinCol] ?? '').trim()
          ? String(row[disiplinCol]).trim()
          : existingExtra.disiplinDiri;
      const ketaatan =
        ketaatanCol !== -1 && String(row[ketaatanCol] ?? '').trim()
          ? String(row[ketaatanCol]).trim()
          : existingExtra.ketaatan;

      updatedMap[matchedSantri.id] = {
        akhlaq,
        kebersihan,
        ibadah,
        kesungguhan,
        disiplinDiri,
        ketaatan,
      };
      matchedCount++;
    }

    if (matchedCount === 0) {
      return {
        success: false,
        updatedMap: {},
        matchedCount: 0,
        message:
          'Tidak ditemukan Nama Santri pada file Excel yang cocok dengan Data Santri. Pastikan menggunakan Template Excel Kepribadian Santri.',
      };
    }

    return {
      success: true,
      updatedMap,
      matchedCount,
      message: `Alhamdulillah! Berhasil mengimpor nilai kepribadian untuk ${matchedCount} santri dari file Excel.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses file Excel Kepribadian Santri.';
    return {
      success: false,
      updatedMap: {},
      matchedCount: 0,
      message: msg,
    };
  }
}




