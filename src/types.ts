export type SemesterType = 'ganjil' | 'genap';

export interface AcademicTerm {
  id: string;
  year: string; // e.g. "2025/2026"
  semester: SemesterType; // 'ganjil' | 'genap'
  label: string; // e.g. "Semester Ganjil 2025/2026"
  isActive: boolean;
}

export type RoleType = 'admin' | 'asatidz';

export interface RolePermissions {
  canEditProfil: boolean;
  canEditPanitia: boolean;
  canManageLembaga: boolean;
  canUploadSantri: boolean;
  canUploadJadwal: boolean;
  canInputNilai: boolean;
  canViewAllRekap: boolean;
  canDownloadExcel: boolean;
  canManagePermissions: boolean;
}

export interface Petinggi {
  id: string;
  nama: string;
  gelar: string;
  jabatan: string;
  kontak?: string;
  foto?: string;
  urutan: number;
}

export interface PanitiaUjian {
  id: string;
  nama: string;
  jabatan: string;
  tugas: string;
  kontak?: string;
}

export interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  kategori: 'Tahfidz' | 'Diniyyah' | 'Umum' | 'Bahasa';
  kkm: number;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: string;
  waliKelas?: string;
  kapasitas?: number;
}

export interface Santri {
  id: string;
  nis: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  kelasId: string;
  halaqah?: string;
  kamar?: string;
  status: 'Aktif' | 'Non-Aktif';
}

export interface Asatidz {
  id: string;
  nip?: string;
  nama: string;
  gelar?: string;
  mataPelajaranIds: string[];
  kelasIds: string[];
  noHp?: string;
  email?: string;
  kontak?: string;
  status?: string;
}

export interface NilaiSantri {
  id: string;
  termId: string; // scoped to AcademicTerm id
  santriId: string;
  kelasId: string;
  mapelId: string;
  asatidzId: string;
  nilaiHarian: number;
  nilaiLisan: number; // Tahfidz / Ujian Lisan
  nilaiTulis: number; // Ujian Tulis
  nilaiAkhir: number;
  predikat: string;
  catatan?: string;
  tanggalInput: string;
}

export interface JadwalUjianItem {
  id: string;
  termId: string;
  judul: string;
  tanggalUjian: string;
  imageUrl: string;
  keterangan?: string;
}

export interface PesantrenProfile {
  nama: string;
  subTitle: string;
  nspp: string;
  skKemenag?: string;
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  noTelp: string;
  email: string;
  website: string;
  logoUrl: string;
  visi: string;
  misi: string[];
}
