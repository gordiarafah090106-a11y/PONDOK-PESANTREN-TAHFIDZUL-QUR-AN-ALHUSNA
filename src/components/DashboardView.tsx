import React, { useState } from 'react';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  Pengumuman,
  PesantrenProfile,
  RoleType,
  Santri,
} from '../types';
import {
  Users,
  GraduationCap,
  School,
  CheckCircle,
  Sparkles,
  Layers,
  Award,
  Bell,
  Plus,
  Trash2,
  Edit2,
  Pin,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  Check,
  X,
} from 'lucide-react';
import { TabKey } from './Navbar';

interface DashboardViewProps {
  profile: PesantrenProfile;
  currentTerm: AcademicTerm;
  allSantri: Santri[];
  allKelas: Kelas[];
  allMapel: MataPelajaran[];
  allAsatidz: Asatidz[];
  allNilai: NilaiSantri[];
  allPengumuman: Pengumuman[];
  onSavePengumuman: (list: Pengumuman[]) => void;
  currentRole: RoleType;
  currentTeacherAccount?: Asatidz | null;
  onNavigate: (tab: TabKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  currentTerm,
  allSantri,
  allKelas,
  allMapel,
  allAsatidz,
  allNilai,
  allPengumuman,
  onSavePengumuman,
  currentRole,
  currentTeacherAccount,
  onNavigate,
}) => {
  // Filter nilai for the active academic term
  const termNilai = allNilai.filter((n) => n.termId === currentTerm.id);
  const activeSantri = allSantri.filter((s) => s.status === 'Aktif');

  // Stats
  const totalSantri = activeSantri.length;
  const totalGuru = allAsatidz.length;
  const totalKelas = allKelas.length;
  const totalNilaiMasuk = termNilai.length;

  const averageScore =
    termNilai.length > 0
      ? (termNilai.reduce((sum, n) => sum + n.nilaiAkhir, 0) / termNilai.length).toFixed(1)
      : '0.0';

  const mumtazCount = termNilai.filter((n) => n.predikat.includes('Mumtaz')).length;

  // Announcement State (Admin CRUD)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengumuman | null>(null);
  const [judulInput, setJudulInput] = useState('');
  const [kategoriInput, setKategoriInput] = useState<'Ujian' | 'Penting' | 'Info' | 'Umum' | 'Pengumuman'>('Penting');
  const [kontenInput, setKontenInput] = useState('');
  const [penulisInput, setPenulisInput] = useState('Admin Pesantren');
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setJudulInput('');
    setKategoriInput('Penting');
    setKontenInput('');
    setPenulisInput('Admin Pesantren');
    setIsPinned(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: Pengumuman) => {
    setEditingItem(item);
    setJudulInput(item.judul);
    setKategoriInput(item.kategori || 'Penting');
    setKontenInput(item.konten);
    setPenulisInput(item.penulis || 'Admin Pesantren');
    setIsPinned(!!item.pinned);
    setShowAddModal(true);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulInput.trim() || !kontenInput.trim()) return;

    if (editingItem) {
      const updated = allPengumuman.map((p) =>
        p.id === editingItem.id
          ? {
              ...p,
              judul: judulInput.trim(),
              kategori: kategoriInput,
              konten: kontenInput.trim(),
              penulis: penulisInput.trim(),
              pinned: isPinned,
            }
          : p
      );
      onSavePengumuman(updated);
    } else {
      const newItem: Pengumuman = {
        id: `ann-${Date.now()}`,
        judul: judulInput.trim(),
        kategori: kategoriInput,
        konten: kontenInput.trim(),
        penulis: penulisInput.trim() || 'Admin Pesantren',
        tanggal: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        pinned: isPinned,
      };
      onSavePengumuman([newItem, ...allPengumuman]);
    }

    setShowAddModal(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm('Hapus pengumuman ini?')) {
      const updated = allPengumuman.filter((p) => p.id !== id);
      onSavePengumuman(updated);
    }
  };

  const handleTogglePin = (id: string) => {
    const updated = allPengumuman.map((p) =>
      p.id === id ? { ...p, pinned: !p.pinned } : p
    );
    onSavePengumuman(updated);
  };

  const filteredPengumuman = allPengumuman
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.judul.toLowerCase().includes(q) ||
        p.konten.toLowerCase().includes(q) ||
        p.penulis?.toLowerCase().includes(q) ||
        p.kategori?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-md p-6 sm:p-7">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sistem Penilaian &amp; Administrasi Akademik</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              {profile.nama}
            </h2>

            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed mb-3.5">
              {profile.alamat}
            </p>

            <div className="inline-flex items-center gap-2 bg-emerald-950/50 backdrop-blur-xs border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-emerald-200">Periode Semester Aktif:</span>
              <span className="font-bold text-white bg-emerald-600/80 px-2 py-0.5 rounded border border-emerald-400/40">
                {currentTerm.label}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 self-center">
            <img
              src={profile.logoUrl || '/logo_alhusna.jpg'}
              alt="Logo Alhusna"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg ring-4 ring-amber-400/80 bg-white p-1"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
              }}
            />
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Stat: Guru */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Guru (Asatidz)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalGuru} <span className="text-xs font-normal text-slate-500">Ustadz/ah</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Akun Asatidz Aktif</span>
          </div>
        </div>

        {/* Stat: Santri */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Siswa (Santri)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalSantri} <span className="text-xs font-normal text-slate-500">Santri</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Status Aktif Mengikuti Ujian</span>
          </div>
        </div>

        {/* Stat: Kelas */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Kelas
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalKelas} <span className="text-xs font-normal text-slate-500">Halaqah/Kelas</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Tingkat Wustho &amp; Takhasus</span>
          </div>
        </div>

        {/* Stat: Nilai Terinput */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nilai Terinput ({currentTerm.semester.toUpperCase()})
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                {totalNilaiMasuk} <span className="text-xs font-normal text-slate-500">Entri</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 text-xs text-slate-600 flex items-center justify-between">
            <span>Rata-rata: <strong className="text-slate-900">{averageScore}</strong></span>
            <span className="text-emerald-700 font-semibold">{mumtazCount} Mumtaz (A)</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* PAPAN PENGUMUMAN PESANTREN (ADMIN DAPAT EDIT & ASATIDZ DAPAT LIHAT) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-200/70 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Papan Pengumuman &amp; Informasi Akademik</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  {allPengumuman.length} Pesan
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentRole === 'admin'
                  ? 'Ketik dan kelola pengumuman resmi yang dapat dilihat oleh seluruh Asatidz.'
                  : 'Pemberitahuan dan edaran resmi dari pihak Pimpinan & Panitia Ujian Pesantren.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengumuman..."
                className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-36 sm:w-48"
              />
            </div>

            {/* Admin Add Announcement Button */}
            {currentRole === 'admin' && (
              <button
                id="btn-tambah-pengumuman"
                onClick={handleOpenAdd}
                className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tulis Pengumuman</span>
                <span className="sm:hidden">Tulis</span>
              </button>
            )}
          </div>
        </div>

        {/* Announcement List */}
        <div className="mt-4 space-y-3">
          {filteredPengumuman.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <span>Belum ada pengumuman yang diterbitkan.</span>
            </div>
          ) : (
            filteredPengumuman.map((item) => {
              const categoryBadge =
                item.kategori === 'Ujian'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : item.kategori === 'Penting'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : item.kategori === 'Info'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.pinned
                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {item.pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                            <Pin className="w-3 h-3" />
                            <span>Sematkan</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${categoryBadge}`}>
                          {item.kategori || 'Info'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {item.judul}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mt-1">
                        {item.konten}
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Penulis: <strong className="text-slate-600">{item.penulis}</strong></span>
                        <span>•</span>
                        <span>{item.tanggal}</span>
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    {currentRole === 'admin' && (
                      <div className="flex items-center gap-1.5 self-end sm:self-start pt-1">
                        <button
                          onClick={() => handleTogglePin(item.id)}
                          title={item.pinned ? 'Lepas Sematan' : 'Sematkan Pengumuman'}
                          className={`p-1.5 rounded-lg border text-xs transition ${
                            item.pinned
                              ? 'bg-amber-200 text-amber-900 border-amber-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Pengumuman"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(item.id)}
                          title="Hapus Pengumuman"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Progress per Kelas List */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Status Kelengkapan Nilai Per Kelas ({currentTerm.label})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau kelengkapan nilai santri pada masing-masing kelas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {allKelas.map((kelas) => {
            const santriInKelas = allSantri.filter(
              (s) => s.kelasId === kelas.id && s.status === 'Aktif'
            );
            const gradesInKelas = termNilai.filter((n) => n.kelasId === kelas.id);
            const totalStudents = santriInKelas.length;
            const gradedStudentsCount = new Set(gradesInKelas.map((g) => g.santriId)).size;
            const percent =
              totalStudents > 0
                ? Math.min(100, Math.round((gradedStudentsCount / totalStudents) * 100))
                : 0;

            return (
              <div
                key={kelas.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{kelas.nama}</span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
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

                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>{gradedStudentsCount} / {totalStudents} Santri Dinilai</span>
                    <span>Wali: {kelas.waliKelas || '-'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex justify-end">
                  <button
                    onClick={() => onNavigate('asatidz')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    Buka Lembar Nilai →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT PENGUMUMAN */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                <span>{editingItem ? 'Edit Pengumuman' : 'Tulis Pengumuman Baru'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  value={judulInput}
                  onChange={(e) => setJudulInput(e.target.value)}
                  placeholder="Contoh: Edaran Pelaksanaan Imtihan Niha'i 1446 H"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={kategoriInput}
                    onChange={(e) => setKategoriInput(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  >
                    <option value="Penting">Penting</option>
                    <option value="Ujian">Ujian / Imtihan</option>
                    <option value="Info">Informasi</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Atas Nama / Penulis
                  </label>
                  <input
                    type="text"
                    value={penulisInput}
                    onChange={(e) => setPenulisInput(e.target.value)}
                    placeholder="Admin Pesantren / Panitia"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pesan Pengumuman
                </label>
                <textarea
                  rows={4}
                  value={kontenInput}
                  onChange={(e) => setKontenInput(e.target.value)}
                  placeholder="Tuliskan isi pengumuman atau instruksi untuk seluruh dewan guru di sini..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="check-pinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="check-pinned" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Sematkan di urutan paling atas (Pinned)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
