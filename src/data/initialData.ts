import {
  AcademicTerm,
  PesantrenProfile,
  Petinggi,
  PanitiaUjian,
  MataPelajaran,
  Kelas,
  Santri,
  Asatidz,
  NilaiSantri,
  JadwalUjianItem,
  RolePermissions,
  Pengumuman,
} from '../types';

export const INITIAL_TERMS: AcademicTerm[] = [
  {
    id: 'term-2025-ganjil',
    year: '2025/2026',
    semester: 'ganjil',
    label: 'Semester Ganjil 2025/2026',
    isActive: true,
  },
  {
    id: 'term-2025-genap',
    year: '2025/2026',
    semester: 'genap',
    label: 'Semester Genap 2025/2026',
    isActive: false,
  },
  {
    id: 'term-2026-ganjil',
    year: '2026/2027',
    semester: 'ganjil',
    label: 'Semester Ganjil 2026/2027',
    isActive: false,
  },
];

export const INITIAL_PERMISSIONS: { admin: RolePermissions; asatidz: RolePermissions } = {
  admin: {
    canEditProfil: true,
    canEditPanitia: true,
    canManageLembaga: true,
    canUploadSantri: true,
    canUploadJadwal: true,
    canInputNilai: true,
    canViewAllRekap: true,
    canDownloadExcel: true,
    canManagePermissions: true,
  },
  asatidz: {
    canEditProfil: false,
    canEditPanitia: false,
    canManageLembaga: false,
    canUploadSantri: false,
    canUploadJadwal: false,
    canInputNilai: true,
    canViewAllRekap: false,
    canDownloadExcel: true,
    canManagePermissions: false,
  },
};

export const INITIAL_PROFILE: PesantrenProfile = {
  nama: "PONDOK PESANTREN TAHFIDZUL QUR'AN ALHUSNA",
  subTitle: "Lembaga Pendidikan Kader Penghafal Al-Qur'an & Ilmu Syariah",
  nspp: '510032010088',
  alamat: 'Jl. Pesantren Al-Husna No. 09, Kp. Santri',
  desa: 'Sukamaju',
  kecamatan: 'Cianjur',
  kabupaten: 'Cianjur',
  provinsi: 'Jawa Barat',
  noTelp: '(0263) 291-8899 / 0812-3456-7890',
  email: 'info@pptq-alhusna.ac.id',
  website: 'https://pptq-alhusna.sch.id',
  logoUrl: '', // Uses default SVG badge if empty
  visi: "Mencetak Generasi Qur'ani yang Hafidz 30 Juz, Berakhlakul Karimah, Mandiri, dan Berwawasan Global.",
  misi: [
    "Menyelenggarakan program tahfidzul Qur'an mutqin 30 juz bersanad.",
    "Menanamkan adab islami, mahabbah kepada Rasulullah, dan akhlaqul karimah.",
    "Mengembangkan penguasaan kitab kuning, kaidah fiqhiyyah, dan bahasa Arab aktif.",
    "Membekali santri dengan kecakapan kepemimpinan, kemandirian, dan teknologi.",
  ],
};

export const INITIAL_PETINGGI: Petinggi[] = [
  {
    id: 'pet-1',
    nama: 'K.H. Ahmad Husnan Al-Hafidz',
    gelar: 'Al-Hafidz, Lc., M.A.',
    jabatan: 'Pengasuh & Pimpinan Pondok Pesantren',
    kontak: '0811-2345-6789',
    foto: '',
    urutan: 1,
  },
  {
    id: 'pet-2',
    nama: 'Dr. K.H. Muhammad Ridwan Al-Husni',
    gelar: 'Dr., M.Ag.',
    jabatan: 'Ketua Dewan Pembina Yayasan',
    kontak: '0812-9876-5432',
    foto: '',
    urutan: 2,
  },
  {
    id: 'pet-3',
    nama: 'Ust. H. Syihabuddin Al-Bantani',
    gelar: 'S.Th.I., S.Q.',
    jabatan: "Mudir Ma'had & Penanggung Jawab Tahfidz",
    kontak: '0813-1122-3344',
    foto: '',
    urutan: 3,
  },
  {
    id: 'pet-4',
    nama: 'Ust. Mansur Hidayatulloh',
    gelar: 'Lc., M.H.',
    jabatan: 'Kepala Bidang Kepengasuhan & Tarbiyah',
    kontak: '0815-5566-7788',
    foto: '',
    urutan: 4,
  },
  {
    id: 'pet-5',
    nama: 'Ust. Nur Fadli Al-Makki',
    gelar: 'S.Pd.I.',
    jabatan: 'Kepala Bagian Kurikulum Diniyyah',
    kontak: '0817-9900-1122',
    foto: '',
    urutan: 5,
  },
];

export const INITIAL_PANITIA: PanitiaUjian[] = [
  {
    id: 'pan-1',
    nama: 'Ust. Fauzan Adhim, S.Pd.I.',
    jabatan: 'Ketua Panitia Ujian',
    tugas: 'Bertanggung jawab penuh atas kelancaran pelaksanaan ujian semester santri.',
    kontak: '0821-4455-6677',
  },
  {
    id: 'pan-2',
    nama: 'Ust. Abdullah Al-Hafidz, S.Ag.',
    jabatan: 'Sekretaris Panitia',
    tugas: 'Pengelolaan naskah, presensi, berita acara, dan pengarsipan hasil nilai.',
    kontak: '0813-2233-4455',
  },
  {
    id: 'pan-3',
    nama: 'Ustadzah Siti Maryam, S.E.',
    jabatan: 'Bendahara Panitia',
    tugas: 'Pengelolaan anggaran logistik, cetak soal, dan operasional pengawas ujian.',
    kontak: '0878-3344-5566',
  },
  {
    id: 'pan-4',
    nama: 'Ust. M. Zaki Mubarak, S.Q.',
    jabatan: "Koordinator Ujian Tahfidz & Lisan",
    tugas: 'Penyusunan jadwal sima\'an, tasmi\' 5/10/30 juz, dan penguji lisan.',
    kontak: '0852-7788-9900',
  },
  {
    id: 'pan-5',
    nama: 'Ust. Rifqi Ramadhan, M.Pd.',
    jabatan: 'Koordinator Naskah & Pengawas Tulis',
    tugas: 'Penyusunan bank soal, penggandaan naskah ujian, dan jadwal pengawas kelas.',
    kontak: '0896-1234-5678',
  },
];

export const INITIAL_MAPEL: MataPelajaran[] = [
  {
    id: 'mapel-1',
    kode: 'TFZ-01',
    nama: "Tahfidzul Qur'an (Tasmi' & Ziyadah)",
    kategori: 'Tahfidz',
    kkm: 80,
  },
  {
    id: 'mapel-2',
    kode: 'TJW-02',
    nama: "Tajwid & Makhorijul Huruf (Tuhfatul Athfal)",
    kategori: 'Tahfidz',
    kkm: 75,
  },
  {
    id: 'mapel-3',
    kode: 'FQH-03',
    nama: 'Fiqih Ibadah (Safinatun Najah)',
    kategori: 'Diniyyah',
    kkm: 75,
  },
  {
    id: 'mapel-4',
    kode: 'AQD-04',
    nama: 'Aqidah & Tauhid (Aqidatul Awam)',
    kategori: 'Diniyyah',
    kkm: 75,
  },
  {
    id: 'mapel-5',
    kode: 'NHW-05',
    nama: 'Nahwu Dasar (Al-Jurumiyyah)',
    kategori: 'Diniyyah',
    kkm: 70,
  },
  {
    id: 'mapel-6',
    kode: 'SRF-06',
    nama: 'Shorof (Al-Amtsilah At-Tashrifiyyah)',
    kategori: 'Diniyyah',
    kkm: 70,
  },
  {
    id: 'mapel-7',
    kode: 'HDT-07',
    nama: 'Hadits (Al-Arba\'in An-Nawawiyyah)',
    kategori: 'Diniyyah',
    kkm: 75,
  },
  {
    id: 'mapel-8',
    kode: 'ARB-08',
    nama: 'Bahasa Arab (Durusul Lughah)',
    kategori: 'Bahasa',
    kkm: 75,
  },
];

export const INITIAL_KELAS: Kelas[] = [
  {
    id: 'kls-7a',
    nama: 'Kelas 7A Tahfidz (Putra)',
    tingkat: 'Kelas 7',
    waliKelas: 'Ust. Abdullah Al-Hafidz, S.Ag.',
    kapasitas: 25,
  },
  {
    id: 'kls-7b',
    nama: 'Kelas 7B Tahfidz (Putra)',
    tingkat: 'Kelas 7',
    waliKelas: 'Ust. Fauzan Adhim, S.Pd.I.',
    kapasitas: 25,
  },
  {
    id: 'kls-8a',
    nama: 'Kelas 8A Tahfidz (Putra)',
    tingkat: 'Kelas 8',
    waliKelas: 'Ust. M. Zaki Mubarak, S.Q.',
    kapasitas: 25,
  },
  {
    id: 'kls-8b',
    nama: 'Kelas 8B Tahfidz (Putra)',
    tingkat: 'Kelas 8',
    waliKelas: 'Ust. Rifqi Ramadhan, M.Pd.',
    kapasitas: 25,
  },
  {
    id: 'kls-9a',
    nama: 'Kelas 9A Takhasus (Putra)',
    tingkat: 'Kelas 9',
    waliKelas: 'Ust. Mansur Hidayatulloh, Lc.',
    kapasitas: 20,
  },
];

export const INITIAL_ASATIDZ: Asatidz[] = [
  {
    id: 'ust-1',
    nip: '198507142010011001',
    nama: 'Ust. Abdullah Al-Hafidz',
    gelar: 'S.Ag., Al-Hafidz',
    gender: 'L',
    ttl: 'RANTAU EMBACANG, 14 Agustus 1985',
    pendidikan: 'Sarjana (S1)',
    password: 'MP2471FV',
    waliKelas: 'Kelas 7A Tahfidz (Putra)',
    jtm: 24,
    mataPelajaranIds: ['mapel-1', 'mapel-2'],
    kelasIds: ['kls-7a', 'kls-7b', 'kls-8a', 'kls-8b', 'kls-9a'],
    noHp: '0812-1111-2222',
    email: 'abdullah@pptq-alhusna.ac.id',
    status: 'Aktif',
  },
  {
    id: 'ust-2',
    nip: '199205022015011002',
    nama: 'Ust. Fauzan Adhim',
    gelar: 'S.Pd.I.',
    gender: 'L',
    ttl: 'MUARA BUNGO, 02 Mei 1992',
    pendidikan: 'Sarjana (S1)',
    password: 'Basri1973',
    waliKelas: 'Kelas 7B Tahfidz (Putra)',
    jtm: 22,
    mataPelajaranIds: ['mapel-3', 'mapel-4'],
    kelasIds: ['kls-7a', 'kls-7b', 'kls-8a'],
    noHp: '0812-3333-4444',
    email: 'fauzan@pptq-alhusna.ac.id',
    status: 'Aktif',
  },
  {
    id: 'ust-3',
    nip: '198810192013011003',
    nama: 'Ust. Mansur Hidayatulloh',
    gelar: 'Lc., M.H.',
    gender: 'L',
    ttl: 'PADANG, 19 Oktober 1988',
    pendidikan: 'Magister (S2)',
    password: 'DHRK9MQW',
    waliKelas: 'Kelas 9A Takhasus (Putra)',
    jtm: 26,
    mataPelajaranIds: ['mapel-5', 'mapel-6', 'mapel-8'],
    kelasIds: ['kls-7a', 'kls-7b', 'kls-8a', 'kls-8b', 'kls-9a'],
    noHp: '0812-5555-6666',
    email: 'mansur@pptq-alhusna.ac.id',
    status: 'Aktif',
  },
  {
    id: 'ust-4',
    nip: '199601102019011004',
    nama: 'Ust. M. Zaki Mubarak',
    gelar: 'S.Q., Al-Hafidz',
    gender: 'L',
    ttl: 'JAMBI, 10 Januari 1996',
    pendidikan: 'Sarjana (S1)',
    password: 'ZAKI2025',
    waliKelas: 'Kelas 8A Tahfidz (Putra)',
    jtm: 20,
    mataPelajaranIds: ['mapel-1', 'mapel-7'],
    kelasIds: ['kls-8a', 'kls-8b', 'kls-9a'],
    noHp: '0812-7777-8888',
    email: 'zaki@pptq-alhusna.ac.id',
    status: 'Aktif',
  },
  {
    id: 'ust-5',
    nip: '199112252016011005',
    nama: 'Ust. Rifqi Ramadhan',
    gelar: 'M.Pd.',
    gender: 'L',
    ttl: 'BUKITTINGGI, 25 Desember 1991',
    pendidikan: 'Magister (S2)',
    password: 'RIFQI123',
    waliKelas: 'Kelas 8B Tahfidz (Putra)',
    jtm: 24,
    mataPelajaranIds: ['mapel-8'],
    kelasIds: ['kls-7a', 'kls-7b', 'kls-8a', 'kls-8b'],
    noHp: '0813-8899-0011',
    email: 'rifqi@pptq-alhusna.ac.id',
    status: 'Aktif',
  },
];

export const INITIAL_SANTRI: Santri[] = [
  // Kelas 7A
  { id: 'snt-01', nis: '202507001', nama: 'Ahmad Raihan Pratama', jenisKelamin: 'L', kelasId: 'kls-7a', halaqah: 'Halaqah Imam Ashim', kamar: 'Asrama Abu Bakar 01', status: 'Aktif' },
  { id: 'snt-02', nis: '202507002', nama: 'Muhammad Bilal Al-Ghifari', jenisKelamin: 'L', kelasId: 'kls-7a', halaqah: 'Halaqah Imam Ashim', kamar: 'Asrama Abu Bakar 01', status: 'Aktif' },
  { id: 'snt-03', nis: '202507003', nama: 'Faris Farhan Ramadhan', jenisKelamin: 'L', kelasId: 'kls-7a', halaqah: 'Halaqah Imam Nafi\'', kamar: 'Asrama Abu Bakar 02', status: 'Aktif' },
  { id: 'snt-04', nis: '202507004', nama: 'Zulfikar Ali Murtadha', jenisKelamin: 'L', kelasId: 'kls-7a', halaqah: 'Halaqah Imam Nafi\'', kamar: 'Asrama Abu Bakar 02', status: 'Aktif' },
  { id: 'snt-05', nis: '202507005', nama: 'Hasan Al-Bashri Kurniawan', jenisKelamin: 'L', kelasId: 'kls-7a', halaqah: 'Halaqah Imam Hamzah', kamar: 'Asrama Abu Bakar 03', status: 'Aktif' },
  { id: 'snt-06', nis: '202507006', nama: 'Ibrahim Khalilurrahman', jenisKelamin: 'L', kelasId: 'kls-7a', halaqah: 'Halaqah Imam Hamzah', kamar: 'Asrama Abu Bakar 03', status: 'Aktif' },

  // Kelas 7B
  { id: 'snt-07', nis: '202507007', nama: 'Fathan Mubina Al-Farisi', jenisKelamin: 'L', kelasId: 'kls-7b', halaqah: 'Halaqah Imam Qalun', kamar: 'Asrama Umar 01', status: 'Aktif' },
  { id: 'snt-08', nis: '202507008', nama: 'Daffa Rizky Ramadhan', jenisKelamin: 'L', kelasId: 'kls-7b', halaqah: 'Halaqah Imam Qalun', kamar: 'Asrama Umar 01', status: 'Aktif' },
  { id: 'snt-09', nis: '202507009', nama: 'Hilman Faqih Syakir', jenisKelamin: 'L', kelasId: 'kls-7b', halaqah: 'Halaqah Imam Warsy', kamar: 'Asrama Umar 02', status: 'Aktif' },
  { id: 'snt-10', nis: '202507010', nama: 'Salman Al-Farisi Saputra', jenisKelamin: 'L', kelasId: 'kls-7b', halaqah: 'Halaqah Imam Warsy', kamar: 'Asrama Umar 02', status: 'Aktif' },
  { id: 'snt-11', nis: '202507011', nama: 'Umar Abdullah As-Syafi\'i', jenisKelamin: 'L', kelasId: 'kls-7b', halaqah: 'Halaqah Imam Warsy', kamar: 'Asrama Umar 03', status: 'Aktif' },

  // Kelas 8A
  { id: 'snt-12', nis: '202408001', nama: 'Rayhan Maulana Yusuf', jenisKelamin: 'L', kelasId: 'kls-8a', halaqah: 'Halaqah Imam Syu\'bah', kamar: 'Asrama Utsman 01', status: 'Aktif' },
  { id: 'snt-13', nis: '202408002', nama: 'Thoriq Ziyad Al-Ayyubi', jenisKelamin: 'L', kelasId: 'kls-8a', halaqah: 'Halaqah Imam Syu\'bah', kamar: 'Asrama Utsman 01', status: 'Aktif' },
  { id: 'snt-14', nis: '202408003', nama: 'Ammar Yasir Al-Bukhari', jenisKelamin: 'L', kelasId: 'kls-8a', halaqah: 'Halaqah Imam Hafs', kamar: 'Asrama Utsman 02', status: 'Aktif' },
  { id: 'snt-15', nis: '202408004', nama: 'Naufal Hafizh Ar-Rasyid', jenisKelamin: 'L', kelasId: 'kls-8a', halaqah: 'Halaqah Imam Hafs', kamar: 'Asrama Utsman 02', status: 'Aktif' },

  // Kelas 8B
  { id: 'snt-16', nis: '202408005', nama: 'Akmal Fathurrahman', jenisKelamin: 'L', kelasId: 'kls-8b', halaqah: 'Halaqah Imam Kisa\'i', kamar: 'Asrama Ali 01', status: 'Aktif' },
  { id: 'snt-17', nis: '202408006', nama: 'Dzaky Rahmatullah', jenisKelamin: 'L', kelasId: 'kls-8b', halaqah: 'Halaqah Imam Kisa\'i', kamar: 'Asrama Ali 01', status: 'Aktif' },
  { id: 'snt-18', nis: '202408007', nama: 'Hamzah Ibnu Abdul Muthalib', jenisKelamin: 'L', kelasId: 'kls-8b', halaqah: 'Halaqah Imam Kisa\'i', kamar: 'Asrama Ali 02', status: 'Aktif' },

  // Kelas 9A Takhasus
  { id: 'snt-19', nis: '202309001', nama: 'Abdullah Azzam Al-Mujahid', jenisKelamin: 'L', kelasId: 'kls-9a', halaqah: 'Halaqah Takhasus 30 Juz', kamar: 'Asrama Darussalam 01', status: 'Aktif' },
  { id: 'snt-20', nis: '202309002', nama: 'Fakhri Hanif As-Shiddiq', jenisKelamin: 'L', kelasId: 'kls-9a', halaqah: 'Halaqah Takhasus 30 Juz', kamar: 'Asrama Darussalam 01', status: 'Aktif' },
  { id: 'snt-21', nis: '202309003', nama: 'Lukman Hakim Al-Hafidz', jenisKelamin: 'L', kelasId: 'kls-9a', halaqah: 'Halaqah Takhasus 30 Juz', kamar: 'Asrama Darussalam 02', status: 'Aktif' },
];

export const INITIAL_NILAI: NilaiSantri[] = [
  // Grades entered by Ust. Abdullah for Kelas 7A (Tahfidzul Qur'an)
  {
    id: 'nil-01',
    termId: 'term-2025-ganjil',
    santriId: 'snt-01',
    kelasId: 'kls-7a',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 92,
    nilaiLisan: 95,
    nilaiTulis: 90,
    nilaiAkhir: 93,
    predikat: 'Mumtaz (A)',
    catatan: 'Hafalan sangat mutqin juz 1-3, makharijul huruf fasih.',
    tanggalInput: '2025-11-20',
  },
  {
    id: 'nil-02',
    termId: 'term-2025-ganjil',
    santriId: 'snt-02',
    kelasId: 'kls-7a',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 88,
    nilaiLisan: 86,
    nilaiTulis: 85,
    nilaiAkhir: 86,
    predikat: 'Jayyid Jiddan (B+)',
    catatan: 'Hafalan lancar, tingkatkan konsistensi ghunnah dan mad.',
    tanggalInput: '2025-11-20',
  },
  {
    id: 'nil-03',
    termId: 'term-2025-ganjil',
    santriId: 'snt-03',
    kelasId: 'kls-7a',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 95,
    nilaiLisan: 96,
    nilaiTulis: 94,
    nilaiAkhir: 95,
    predikat: 'Mumtaz (A)',
    catatan: 'Mutqin sempurna, tajwid sangat baik.',
    tanggalInput: '2025-11-20',
  },
  {
    id: 'nil-04',
    termId: 'term-2025-ganjil',
    santriId: 'snt-04',
    kelasId: 'kls-7a',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 82,
    nilaiLisan: 80,
    nilaiTulis: 80,
    nilaiAkhir: 81,
    predikat: 'Jayyid (B)',
    catatan: 'Perlu muraja\'ah lebih giat pada juz 2.',
    tanggalInput: '2025-11-20',
  },
  {
    id: 'nil-05',
    termId: 'term-2025-ganjil',
    santriId: 'snt-05',
    kelasId: 'kls-7a',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 90,
    nilaiLisan: 92,
    nilaiTulis: 88,
    nilaiAkhir: 90,
    predikat: 'Mumtaz (A)',
    catatan: 'Suara merdu dan tartil terjaga.',
    tanggalInput: '2025-11-20',
  },
  {
    id: 'nil-06',
    termId: 'term-2025-ganjil',
    santriId: 'snt-06',
    kelasId: 'kls-7a',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 85,
    nilaiLisan: 84,
    nilaiTulis: 86,
    nilaiAkhir: 85,
    predikat: 'Jayyid Jiddan (B+)',
    catatan: 'Bagus, teruskan ziyadah hafalan juz baru.',
    tanggalInput: '2025-11-20',
  },

  // Grades entered by Ust. Abdullah for Kelas 7B (Tahfidzul Qur'an)
  {
    id: 'nil-07',
    termId: 'term-2025-ganjil',
    santriId: 'snt-07',
    kelasId: 'kls-7b',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 91,
    nilaiLisan: 94,
    nilaiTulis: 89,
    nilaiAkhir: 92,
    predikat: 'Mumtaz (A)',
    catatan: 'Sangat baik, tasmi\' satu duduk lancar.',
    tanggalInput: '2025-11-21',
  },
  {
    id: 'nil-08',
    termId: 'term-2025-ganjil',
    santriId: 'snt-08',
    kelasId: 'kls-7b',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 86,
    nilaiLisan: 85,
    nilaiTulis: 84,
    nilaiAkhir: 85,
    predikat: 'Jayyid Jiddan (B+)',
    catatan: 'Rajin muraja\'ah bersama kelompok halaqah.',
    tanggalInput: '2025-11-21',
  },
  {
    id: 'nil-09',
    termId: 'term-2025-ganjil',
    santriId: 'snt-09',
    kelasId: 'kls-7b',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 84,
    nilaiLisan: 82,
    nilaiTulis: 85,
    nilaiAkhir: 83,
    predikat: 'Jayyid (B)',
    catatan: 'Perbanyak setoran harian.',
    tanggalInput: '2025-11-21',
  },
  {
    id: 'nil-10',
    termId: 'term-2025-ganjil',
    santriId: 'snt-10',
    kelasId: 'kls-7b',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 89,
    nilaiLisan: 90,
    nilaiTulis: 88,
    nilaiAkhir: 89,
    predikat: 'Jayyid Jiddan (B+)',
    catatan: 'Bagus, fashahah dan tartil konsisten.',
    tanggalInput: '2025-11-21',
  },
  {
    id: 'nil-11',
    termId: 'term-2025-ganjil',
    santriId: 'snt-11',
    kelasId: 'kls-7b',
    mapelId: 'mapel-1',
    asatidzId: 'ust-1',
    nilaiHarian: 94,
    nilaiLisan: 95,
    nilaiTulis: 92,
    nilaiAkhir: 94,
    predikat: 'Mumtaz (A)',
    catatan: 'Istimewa dalam hafalan dan tajwid.',
    tanggalInput: '2025-11-21',
  },

  // Grades entered by Ust. Fauzan for Kelas 7A (Fiqih Ibadah)
  {
    id: 'nil-12',
    termId: 'term-2025-ganjil',
    santriId: 'snt-01',
    kelasId: 'kls-7a',
    mapelId: 'mapel-3',
    asatidzId: 'ust-2',
    nilaiHarian: 88,
    nilaiLisan: 90,
    nilaiTulis: 86,
    nilaiAkhir: 88,
    predikat: 'Jayyid Jiddan (B+)',
    catatan: 'Paham bab thaharah dan syarat sah shalat.',
    tanggalInput: '2025-11-22',
  },
  {
    id: 'nil-13',
    termId: 'term-2025-ganjil',
    santriId: 'snt-02',
    kelasId: 'kls-7a',
    mapelId: 'mapel-3',
    asatidzId: 'ust-2',
    nilaiHarian: 85,
    nilaiLisan: 86,
    nilaiTulis: 84,
    nilaiAkhir: 85,
    predikat: 'Jayyid Jiddan (B+)',
    catatan: 'Bagus dalam praktik wudhu dan shalat jenazah.',
    tanggalInput: '2025-11-22',
  },
  {
    id: 'nil-14',
    termId: 'term-2025-ganjil',
    santriId: 'snt-03',
    kelasId: 'kls-7a',
    mapelId: 'mapel-3',
    asatidzId: 'ust-2',
    nilaiHarian: 94,
    nilaiLisan: 92,
    nilaiTulis: 96,
    nilaiAkhir: 94,
    predikat: 'Mumtaz (A)',
    catatan: 'Memahami dalil-dalil fiqih dengan sangat baik.',
    tanggalInput: '2025-11-22',
  },
  {
    id: 'nil-15',
    termId: 'term-2025-ganjil',
    santriId: 'snt-04',
    kelasId: 'kls-7a',
    mapelId: 'mapel-3',
    asatidzId: 'ust-2',
    nilaiHarian: 80,
    nilaiLisan: 78,
    nilaiTulis: 80,
    nilaiAkhir: 79,
    predikat: 'Jayyid (B)',
    catatan: 'Perlu pengulangan pada rukun dan pembatal puasa.',
    tanggalInput: '2025-11-22',
  },
  {
    id: 'nil-16',
    termId: 'term-2025-ganjil',
    santriId: 'snt-05',
    kelasId: 'kls-7a',
    mapelId: 'mapel-3',
    asatidzId: 'ust-2',
    nilaiHarian: 90,
    nilaiLisan: 88,
    nilaiTulis: 91,
    nilaiAkhir: 90,
    predikat: 'Mumtaz (A)',
    catatan: 'Aktif bertanya dan hafalan matan Safinah lancar.',
    tanggalInput: '2025-11-22',
  },
  {
    id: 'nil-17',
    termId: 'term-2025-ganjil',
    santriId: 'snt-06',
    kelasId: 'kls-7a',
    mapelId: 'mapel-3',
    asatidzId: 'ust-2',
    nilaiHarian: 86,
    nilaiLisan: 85,
    nilaiTulis: 88,
    nilaiAkhir: 87,
    predikat: 'Jayyid Jiddan (B+)',
    catatan: 'Karakter santri berakhlak dan rajin mencatat.',
    tanggalInput: '2025-11-22',
  },
];

// High quality SVG data URL for default exam schedule
export const DEFAULT_JADWAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%23064e3b" />
      <stop offset="100%" stop-color="%23065f46" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23ffffff" />
      <stop offset="100%" stop-color="%23f8fafc" />
    </linearGradient>
  </defs>
  <rect width="1000" height="650" fill="%23f1f5f9" rx="16" />
  <rect width="1000" height="150" fill="url(%23bgGrad)" />
  <circle cx="920" cy="75" r="110" fill="%2310b981" opacity="0.15" />
  <circle cx="80" cy="75" r="70" fill="%2310b981" opacity="0.15" />
  
  <text x="500" y="55" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="%23ecfdf5" text-anchor="middle" letter-spacing="1">JADWAL IMTIHAN NIHA'I (UJIAN AKHIR SEMESTER)</text>
  <text x="500" y="85" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="%23a7f3d0" text-anchor="middle">PONDOK PESANTREN TAHFIDZUL QUR'AN ALHUSNA</text>
  <text x="500" y="112" font-family="Arial, sans-serif" font-size="13" fill="%23d1fae5" text-anchor="middle">TAHUN AJARAN 2025/2026 • GELOMBANG UJIAN TAHFIDZ & TULIS</text>

  <!-- Table Header -->
  <g transform="translate(50, 180)">
    <rect width="900" height="42" fill="%23065f46" rx="8" />
    <text x="50" y="26" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23ffffff" text-anchor="middle">HARI / TGL</text>
    <text x="180" y="26" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23ffffff" text-anchor="middle">WAKTU (WIB)</text>
    <text x="430" y="26" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23ffffff">MATA PELAJARAN / UJIAN</text>
    <text x="730" y="26" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23ffffff">SIFAT UJIAN</text>
    <text x="840" y="26" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23ffffff" text-anchor="middle">STATUS</text>

    <!-- Row 1 -->
    <rect y="50" width="900" height="48" fill="%23ffffff" stroke="%23e2e8f0" rx="6" />
    <text x="50" y="80" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="middle">Senin, 15 Des</text>
    <text x="180" y="80" font-family="Arial, sans-serif" font-size="12" fill="%23475569" text-anchor="middle">07.30 - 11.30</text>
    <text x="430" y="80" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23065f46">Tasmi' Tahfidzul Qur'an Bil Ghaib (Juz 1-5)</text>
    <text x="730" y="80" font-family="Arial, sans-serif" font-size="12" fill="%23047857">Lisan / Sima'an</text>
    <rect x="805" y="62" width="70" height="24" rx="12" fill="%23d1fae5" />
    <text x="840" y="78" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23065f46" text-anchor="middle">Terlaksana</text>

    <!-- Row 2 -->
    <rect y="106" width="900" height="48" fill="%23ffffff" stroke="%23e2e8f0" rx="6" />
    <text x="50" y="136" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="middle">Selasa, 16 Des</text>
    <text x="180" y="136" font-family="Arial, sans-serif" font-size="12" fill="%23475569" text-anchor="middle">07.30 - 09.30</text>
    <text x="430" y="136" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23065f46">Tajwid & Ghoribul Qur'an (Tuhfatul Athfal)</text>
    <text x="730" y="136" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Lisan & Praktik</text>
    <rect x="805" y="118" width="70" height="24" rx="12" fill="%23d1fae5" />
    <text x="840" y="134" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23065f46" text-anchor="middle">Terlaksana</text>

    <!-- Row 3 -->
    <rect y="162" width="900" height="48" fill="%23ffffff" stroke="%23e2e8f0" rx="6" />
    <text x="50" y="192" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="middle">Rabu, 17 Des</text>
    <text x="180" y="192" font-family="Arial, sans-serif" font-size="12" fill="%23475569" text-anchor="middle">08.00 - 10.00</text>
    <text x="430" y="192" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23065f46">Fiqih Ibadah (Safinatun Najah)</text>
    <text x="730" y="192" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Tulis / Naskah</text>
    <rect x="805" y="174" width="70" height="24" rx="12" fill="%23fef3c7" />
    <text x="840" y="190" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%2392400e" text-anchor="middle">Proses Nilai</text>

    <!-- Row 4 -->
    <rect y="218" width="900" height="48" fill="%23ffffff" stroke="%23e2e8f0" rx="6" />
    <text x="50" y="248" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="middle">Kamis, 18 Des</text>
    <text x="180" y="248" font-family="Arial, sans-serif" font-size="12" fill="%23475569" text-anchor="middle">08.00 - 10.00</text>
    <text x="430" y="248" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23065f46">Aqidah & Tauhid (Aqidatul Awam)</text>
    <text x="730" y="248" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Tulis / Hafalan</text>
    <rect x="805" y="230" width="70" height="24" rx="12" fill="%23fef3c7" />
    <text x="840" y="246" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%2392400e" text-anchor="middle">Proses Nilai</text>

    <!-- Row 5 -->
    <rect y="274" width="900" height="48" fill="%23ffffff" stroke="%23e2e8f0" rx="6" />
    <text x="50" y="304" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="middle">Sabtu, 20 Des</text>
    <text x="180" y="304" font-family="Arial, sans-serif" font-size="12" fill="%23475569" text-anchor="middle">08.00 - 10.30</text>
    <text x="430" y="304" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23065f46">Nahwu & Shorof (Jurumiyyah & Amtsilah)</text>
    <text x="730" y="304" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Tulis & I'rob</text>
    <rect x="805" y="286" width="70" height="24" rx="12" fill="%23e0e7ff" />
    <text x="840" y="302" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%233730a3" text-anchor="middle">Menunggu</text>

    <!-- Row 6 -->
    <rect y="330" width="900" height="48" fill="%23ffffff" stroke="%23e2e8f0" rx="6" />
    <text x="50" y="360" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="middle">Ahad, 21 Des</text>
    <text x="180" y="360" font-family="Arial, sans-serif" font-size="12" fill="%23475569" text-anchor="middle">08.00 - 10.00</text>
    <text x="430" y="360" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23065f46">Bahasa Arab & Hadits Arba'in</text>
    <text x="730" y="360" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Tulis & Hafalan</text>
    <rect x="805" y="342" width="70" height="24" rx="12" fill="%23e0e7ff" />
    <text x="840" y="358" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%233730a3" text-anchor="middle">Menunggu</text>
  </g>

  <!-- Footer note -->
  <text x="50" y="620" font-family="Arial, sans-serif" font-size="12" fill="%2364748b" font-style="italic">* Peringatan: Santri wajib hadir 15 menit sebelum ujian dengan seragam rapi dan membawa perlengkapan alat tulis.</text>
  <text x="950" y="620" font-family="Arial, sans-serif" font-size="12" fill="%23065f46" font-weight="bold" text-anchor="end">Panitia Imtihan PPTQ ALHUSNA</text>
</svg>`;

export const INITIAL_JADWAL: JadwalUjianItem[] = [
  {
    id: 'jdw-1',
    termId: 'term-2025-ganjil',
    judul: 'Jadwal Resmi Imtihan Niha\'i Semester Ganjil 2025/2026',
    tanggalUjian: '15 - 21 Desember 2025',
    imageUrl: DEFAULT_JADWAL_SVG,
    keterangan: 'Jadwal pelaksanaan Ujian Tahfidz, Lisan, dan Ujian Tulis Diniyyah seluruh tingkatan santri.',
  },
];

export const INITIAL_PENGUMUMAN: Pengumuman[] = [
  {
    id: 'ann-1',
    judul: 'Edaran Pelaksanaan Imtihan Niha\'i (Ujian Akhir Semester) 1446 H',
    kategori: 'Ujian',
    konten: 'Assalamu\'alaikum Wr. Wb. Diberitahukan kepada seluruh Asatidz/Asatidzah pengampu mata pelajaran bahwa Imtihan Niha\'i Semester Ganjil akan dimulai sesuai jadwal yang terlampir di menu Jadwal Ujian. Mohon seluruh lembar soal dan format penilaian disiapkan dengan seksama.',
    tanggal: '10 November 2025',
    penulis: 'Panitia Imtihan Niha\'i',
    pinned: true,
  },
  {
    id: 'ann-2',
    judul: 'Batas Akhir Penginputan Nilai Ujian Santri ke Portal Aplikasi',
    kategori: 'Penting',
    konten: 'Batas akhir pengisian seluruh nilai harian, lisan, dan tulis adalah H-3 sebelum pembagian raport santri. Mohon dewan guru segera menyelesaikan penginputan nilai pada kelas masing-masing agar rekapitulasi raport dapat diproses tepat waktu.',
    tanggal: '15 November 2025',
    penulis: 'Bagian Kurikulum & Akademik',
    pinned: true,
  },
  {
    id: 'ann-3',
    judul: 'Panduan Fitur Manajemen Mengajar & Rekapitulasi Excel Multi-Kelas',
    kategori: 'Info',
    konten: 'Fitur tugas mengajar telah dipetakan oleh Admin. Setiap Ustadz dapat langsung menginput nilai santri sesuai kelas yang diampu dan mengunduh berkas Excel otomatis pada portal Asatidz.',
    tanggal: '18 November 2025',
    penulis: 'Admin IT Pesantren',
    pinned: false,
  },
];

