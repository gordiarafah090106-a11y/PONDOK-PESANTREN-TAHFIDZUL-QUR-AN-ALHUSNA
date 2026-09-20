import * as XLSX from 'xlsx';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PesantrenProfile,
  Santri,
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

    const mapelNames = Array.from(
      new Set(classGrades.map((g) => allMapel.find((m) => m.id === g.mapelId)?.nama).filter(Boolean))
    ).join(', ') || teacher.mataPelajaranIds.map((id) => allMapel.find((m) => m.id === id)?.nama).join(', ');

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
        ? allMapel.find((m) => m.id === grade.mapelId)?.nama || '-'
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
    const mapel = allMapel.find((m) => m.id === grade.mapelId);
    const guru = allAsatidz.find((g) => g.id === grade.asatidzId);

    masterData.push([
      idx + 1,
      santri?.nis || '-',
      santri?.nama || '-',
      kelas?.nama || '-',
      mapel?.nama || '-',
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

/**
 * Generate and download an Excel template for importing Santri per class
 */
export function downloadSantriTemplateExcel(kelasName: string) {
  const wb = XLSX.utils.book_new();

  const templateData = [
    ['TEMPLATE IMPORT SANTRI PER KELAS - PPTQ ALHUSNA'],
    [`Target Kelas: ${kelasName}`],
    ['Petunjuk: Isi data santri mulai baris ke-5. Kolom NIS dan Nama Santri WAJIB diisi. Jenis Kelamin: L atau P.'],
    [''],
    ['NIS', 'Nama Santri', 'Jenis Kelamin (L/P)', 'Halaqah Tahfidz', 'Asrama / Kamar', 'Status (Aktif/Non-Aktif)'],
    ['202507101', 'Ahmad Farhan Mubarak', 'L', 'Halaqah Imam Ashim', 'Asrama Abu Bakar 01', 'Aktif'],
    ['202507102', 'Muhammad Wildan Fathoni', 'L', 'Halaqah Imam Nafi\'', 'Asrama Abu Bakar 02', 'Aktif'],
    ['202507103', 'Rifqi Abdurrahman', 'L', 'Halaqah Imam Hamzah', 'Asrama Abu Bakar 03', 'Aktif'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // NIS
    { wch: 30 }, // Nama
    { wch: 20 }, // JK
    { wch: 25 }, // Halaqah
    { wch: 25 }, // Asrama
    { wch: 20 }, // Status
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
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to json array of arrays
    const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    if (!rawData || rawData.length === 0) {
      return { success: false, data: [], message: 'File Excel kosong atau tidak terbaca.' };
    }

    // Find header row by searching for 'NIS' or 'NAMA'
    let headerRowIndex = -1;
    let nisColIndex = -1;
    let namaColIndex = -1;
    let jkColIndex = -1;
    let halaqahColIndex = -1;
    let kamarColIndex = -1;

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        row.forEach((cell, colIdx) => {
          const text = String(cell || '').trim().toUpperCase();
          if (text.includes('NIS')) nisColIndex = colIdx;
          if (text.includes('NAMA')) namaColIndex = colIdx;
          if (text.includes('JENIS KELAMIN') || text.includes('GENDER') || text === 'JK') jkColIndex = colIdx;
          if (text.includes('HALAQAH')) halaqahColIndex = colIdx;
          if (text.includes('KAMAR') || text.includes('ASRAMA')) kamarColIndex = colIdx;
        });

        if (nisColIndex !== -1 && namaColIndex !== -1) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      // Fallback default columns if not found
      nisColIndex = 0;
      namaColIndex = 1;
      jkColIndex = 2;
      halaqahColIndex = 3;
      kamarColIndex = 4;
      headerRowIndex = 0;
    }

    const santriList: Omit<Santri, 'id'>[] = [];

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || !Array.isArray(row)) continue;

      const nis = String(row[nisColIndex] || '').trim();
      const nama = String(row[namaColIndex] || '').trim();

      // Skip empty or comment rows
      if (!nama || nama.toLowerCase().includes('petunjuk') || nama.toLowerCase().includes('contoh')) {
        continue;
      }

      const rawJk = String(row[jkColIndex] || 'L').trim().toUpperCase();
      const jenisKelamin: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';
      const halaqah = halaqahColIndex !== -1 ? String(row[halaqahColIndex] || '').trim() : 'Halaqah Tahfidz';
      const kamar = kamarColIndex !== -1 ? String(row[kamarColIndex] || '').trim() : 'Asrama Santri';

      santriList.push({
        nis: nis || `2025${Math.floor(10000 + Math.random() * 90000)}`,
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
    ['Petunjuk: Isi kolom Nama Kelas, Tingkat, Kapasitas, dan Wali Kelas.'],
    [''],
    ['NO', 'NAMA KELAS', 'TINGKAT', 'KAPASITAS', 'WALI KELAS'],
    [1, 'Kelas 7A Tahfidz (Putra)', 'Kelas 7', 25, 'Ust. Syihabuddin Al-Bantani'],
    [2, 'Kelas 7B Tahfidz (Putra)', 'Kelas 7', 25, 'Ust. Mansur Hidayatulloh'],
    [3, 'Kelas 8A Tahfidz (Putra)', 'Kelas 8', 24, 'Ust. H. Abdurrahman'],
    [4, 'Kelas 8B Tahfidz (Putri)', 'Kelas 8', 24, 'Usth. Maryam An-Nisa'],
    [5, 'Kelas 9 Takhasus Mutqin', 'Kelas 9', 20, 'Ust. Ahmad Husnan Al-Hafidz'],
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
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, data: [], message: 'File Excel tidak memiliki lembar kerja (sheet).' };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (!rawData || rawData.length === 0) {
      return { success: false, data: [], message: 'Lembar kerja kosong.' };
    }

    // Locate header row
    let headerRowIndex = -1;
    let namaColIndex = -1;
    let tingkatColIndex = -1;
    let kapasitasColIndex = -1;
    let waliColIndex = -1;

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        row.forEach((cell, colIdx) => {
          const text = String(cell || '').trim().toUpperCase();
          if (text.includes('NAMA KELAS') || text === 'KELAS') namaColIndex = colIdx;
          if (text.includes('TINGKAT') || text.includes('JENJANG')) tingkatColIndex = colIdx;
          if (text.includes('KAPASITAS') || text.includes('KUOTA') || text.includes('JUMLAH')) kapasitasColIndex = colIdx;
          if (text.includes('WALI') || text.includes('PEMBINA')) waliColIndex = colIdx;
        });

        if (namaColIndex !== -1) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      namaColIndex = 1;
      tingkatColIndex = 2;
      kapasitasColIndex = 3;
      waliColIndex = 4;
      headerRowIndex = 2;
    }

    const kelasList: Omit<Kelas, 'id'>[] = [];

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || !Array.isArray(row)) continue;

      const nama = String(row[namaColIndex] || '').trim();
      if (!nama || nama.toLowerCase().includes('petunjuk') || nama.toLowerCase().includes('contoh')) {
        continue;
      }

      const tingkat = tingkatColIndex !== -1 && row[tingkatColIndex] ? String(row[tingkatColIndex]).trim() : 'Kelas 7';
      const kapasitasRaw = kapasitasColIndex !== -1 && row[kapasitasColIndex] ? parseInt(String(row[kapasitasColIndex])) : 25;
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
 * Matching Image 1 columns: NIK/NUPTK, Nama, L/P, TTL, Pendidikan, Password, Wali Kelas, JTM
 */
export function downloadGuruTemplateExcel() {
  const wb = XLSX.utils.book_new();

  const templateData: (string | number)[][] = [
    ['TEMPLATE DATA GURU & AKUN ASATIDZ - PPTQ ALHUSNA'],
    ['Petunjuk: Isi NIK/NUPTK (sebagai ID Login), Nama, L/P, TTL, Pendidikan, Password login, Wali Kelas, dan JTM.'],
    [''],
    ['NO', 'NIK/NUPTK', 'NAMA GURU', 'L/P', 'TEMPAT TANGGAL LAHIR', 'PENDIDIKAN', 'PASSWORD', 'WALI KELAS', 'JTM'],
    [1, '198507142010011001', 'Ust. Abdullah Al-Hafidz', 'L', 'RANTAU EMBACANG, 14 Agustus 1985', 'Sarjana (S1)', 'MP2471FV', 'Kelas 7A Tahfidz (Putra)', 24],
    [2, '199205022015011002', 'Ust. Fauzan Adhim, S.Pd.I.', 'L', 'MUARA BUNGO, 02 Mei 1992', 'Sarjana (S1)', 'Basri1973', 'Kelas 7B Tahfidz (Putra)', 22],
    [3, '198810192013011003', 'Ust. Mansur Hidayatulloh, Lc.', 'L', 'PADANG, 19 Oktober 1988', 'Magister (S2)', 'DHRK9MQW', 'Kelas 9A Takhasus (Putra)', 26],
    [4, '199601102019011004', 'Ust. M. Zaki Mubarak, S.Q.', 'L', 'JAMBI, 10 Januari 1996', 'Sarjana (S1)', 'ZAKI2025', 'Kelas 8A Tahfidz (Putra)', 20],
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
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, data: [], message: 'File Excel tidak memiliki lembar kerja (sheet).' };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (!rawData || rawData.length === 0) {
      return { success: false, data: [], message: 'Lembar kerja kosong.' };
    }

    // Locate header row
    let headerRowIndex = -1;
    let nipCol = -1;
    let namaCol = -1;
    let lpCol = -1;
    let ttlCol = -1;
    let pddkCol = -1;
    let passCol = -1;
    let waliCol = -1;
    let jtmCol = -1;

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        row.forEach((cell, colIdx) => {
          const text = String(cell || '').trim().toUpperCase();
          if (text.includes('NIK') || text.includes('NUPTK') || text.includes('NIP')) nipCol = colIdx;
          if (text.includes('NAMA')) namaCol = colIdx;
          if (text.includes('L/P') || text === 'JK' || text.includes('GENDER')) lpCol = colIdx;
          if (text.includes('TTL') || text.includes('LAHIR')) ttlCol = colIdx;
          if (text.includes('PENDIDIKAN')) pddkCol = colIdx;
          if (text.includes('PASSWORD') || text.includes('SANDI')) passCol = colIdx;
          if (text.includes('WALI')) waliCol = colIdx;
          if (text.includes('JTM') || text.includes('JAM')) jtmCol = colIdx;
        });

        if (namaCol !== -1) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      nipCol = 1;
      namaCol = 2;
      lpCol = 3;
      ttlCol = 4;
      pddkCol = 5;
      passCol = 6;
      waliCol = 7;
      jtmCol = 8;
      headerRowIndex = 2;
    }

    const guruList: Omit<Asatidz, 'id'>[] = [];

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || !Array.isArray(row)) continue;

      const nama = String(row[namaCol] || '').trim();
      if (!nama || nama.toLowerCase().includes('petunjuk') || nama.toLowerCase().includes('contoh')) {
        continue;
      }

      const nip = nipCol !== -1 && row[nipCol] ? String(row[nipCol]).trim() : `19${Math.floor(10000000 + Math.random() * 90000000)}`;
      const rawLp = lpCol !== -1 ? String(row[lpCol] || 'L').trim().toUpperCase() : 'L';
      const gender: 'L' | 'P' = rawLp.startsWith('P') ? 'P' : 'L';
      const ttl = ttlCol !== -1 && row[ttlCol] ? String(row[ttlCol]).trim() : '-';
      const pendidikan = pddkCol !== -1 && row[pddkCol] ? String(row[pddkCol]).trim() : 'Sarjana (S1)';
      const password = passCol !== -1 && row[passCol] ? String(row[passCol]).trim() : `GURU${Math.floor(1000 + Math.random() * 9000)}`;
      const waliKelas = waliCol !== -1 && row[waliCol] ? String(row[waliCol]).trim() : '';
      const jtmRaw = jtmCol !== -1 && row[jtmCol] ? parseInt(String(row[jtmCol])) : 24;
      const jtm = isNaN(jtmRaw) ? 24 : jtmRaw;

      guruList.push({
        nip,
        nama,
        gender,
        ttl,
        pendidikan,
        password,
        waliKelas,
        jtm,
        mataPelajaranIds: [],
        kelasIds: [],
        status: 'Aktif',
      });
    }

    if (guruList.length === 0) {
      return { success: false, data: [], message: 'Tidak ada baris data guru yang valid dalam file.' };
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
  allKelas: Kelas[],
  allMapel: MataPelajaran[]
) {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['DAFTAR DEWAN GURU & ASATIDZ - PPTQ ALHUSNA'],
    [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [''],
    ['NO', 'NIK / NUPTK', 'NAMA GURU', 'L/P', 'TEMPAT TANGGAL LAHIR', 'PENDIDIKAN', 'PASSWORD', 'WALI KELAS', 'JTM', 'MAPEL DIAMPU', 'STATUS'],
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
      guru.password || '******',
      guru.waliKelas || '-',
      guru.jtm || 24,
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



