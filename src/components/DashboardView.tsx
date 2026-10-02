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
  TugasMengajarItem,
} from '../types';
import {
  Users,
  GraduationCap,
  School,
  CheckCircle,
  Sparkles,
  Award,
  Bell,
  Plus,
  Trash2,
  Edit2,
  Pin,
  Calendar,
  FileText,
  Search,
  X,
  ClipboardEdit,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { TabKey } from './Sidebar';
import {
  doesTugasBelongToAsatidz,
  getAllActiveSantriInExistingKelas,
} from '../utils/dataSyncHelpers';

interface DashboardViewProps {
  profile: PesantrenProfile;
  currentTerm: AcademicTerm;
  allSantri: Santri[];
  allKelas: Kelas[];
  allMapel: MataPelajaran[];
  allAsatidz: Asatidz[];
  allNilai: NilaiSantri[];
  allTugasMengajar?: TugasMengajarItem[];
  allPengumuman: Pengumuman[];
  onSavePengumuman: (list: Pengumuman[]) => void;
  currentRole: RoleType;
  currentTeacherAccount?: Asatidz | null;
  onNavigate: (tab: TabKey, subTab?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  currentTerm,
  allSantri,
  allKelas,
  allAsatidz,
  allNilai,
  allTugasMengajar = [],
  allPengumuman,
  onSavePengumuman,
  currentRole,
  currentTeacherAccount,
  onNavigate,
}) => {
  // Strictly synchronize Santri with existing classes in Data Santri (allKelas)
  const activeSantri = getAllActiveSantriInExistingKelas(allSantri, allKelas);
  const validSantriIds = new Set(activeSantri.map((s) => s.id));

  // Filter nilai for the active academic term and valid santri
  const termNilai = allNilai.filter(
    (n) => n.termId === currentTerm.id && validSantriIds.has(n.santriId)
  );

  // Stats
  const totalSantri = activeSantri.length;
  const totalPutra = activeSantri.filter((s) => s.jenisKelamin === 'L').length;
  const totalPutri = activeSantri.filter((s) => s.jenisKelamin === 'P').length;
  const totalGuru = allAsatidz.length;
  const totalKelas = allKelas.length;
  const totalNilaiMasuk = termNilai.length;

  const averageScore =
    termNilai.length > 0
      ? (termNilai.reduce((sum, n) => sum + n.nilaiAkhir, 0) / termNilai.length).toFixed(1)
      : '0.0';

  const mumtazCount = termNilai.filter((n) => n.predikat.includes('Mumtaz')).length;

  const teacherAssignedTasks = currentTeacherAccount
    ? allTugasMengajar.filter((t) =>
        doesTugasBelongToAsatidz(t, currentTeacherAccount, allAsatidz)
      )
    : [];

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

  // In-app delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleDeleteAnnouncement = (id: string, judul?: string) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Pengumuman',
      message: `Yakin ingin menghapus pengumuman ${judul ? `"${judul}"` : 'ini'}?`,
      onConfirm: () => {
        const updated = allPengumuman.filter((p) => p.id !== id);
        onSavePengumuman(updated);
      },
    });
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
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Compact Hero Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-sm px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 text-[10px] font-semibold">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Sistem Penilaian &amp; Administrasi Akademik</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-[10px]">
                <Calendar className="w-3 h-3 text-amber-300" />
                <span className="text-emerald-200">Periode:</span>
                <span className="font-bold text-white">{currentTerm.label}</span>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-snug truncate">
              {profile.nama}
            </h2>

            <p className="text-emerald-100/90 text-[11px] leading-snug truncate mt-0.5">
              {profile.alamat}
            </p>
          </div>

          <div className="hidden sm:flex items-center justify-center p-1.5 rounded-xl bg-white/10 border border-white/20 shrink-0">
            <img
              src={profile.logoUrl || '/logo_alhusna.jpg'}
              alt="Logo Alhusna"
              className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-amber-400/80 bg-white p-0.5"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo_alhusna.jpg';
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Bar for Asatidz Account */}
      {currentRole === 'asatidz' && currentTeacherAccount && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
              {currentTeacherAccount.nama.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-emerald-950">
                Selamat bertugas, {currentTeacherAccount.nama}
              </div>
              <div className="text-[11px] text-emerald-800">
                Tugas Mengajar Anda: <strong>{teacherAssignedTasks.length} Mata Pelajaran</strong> yang telah diatur oleh Admin.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('input_nilai')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <ClipboardEdit className="w-3.5 h-3.5" />
            <span>Buka Input Nilai</span>
          </button>
        </div>
      )}

      {/* Compact Primary Stats Grid (Diperkecil agar tidak makan tempat) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Stat: Guru */}
        <div
          onClick={() => currentRole === 'admin' && onNavigate('asatidz', 'akun')}
          className={`bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition ${
            currentRole === 'admin' ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Jumlah Guru (Asatidz)
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {totalGuru} <span className="text-[11px] font-normal text-slate-500">Ustadz/ah</span>
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-emerald-700 font-medium flex items-center gap-1 truncate">
            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">Akun Asatidz Terdaftar</span>
          </div>
        </div>

        {/* Stat: Santri (Singkron dengan Santri yang sudah diinput) */}
        <div
          onClick={() => onNavigate('lembaga', 'kelas')}
          className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Jumlah Siswa (Santri)
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {totalSantri} <span className="text-[11px] font-normal text-slate-500">Santri</span>
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              Sinkron Data Santri ({totalPutra} L / {totalPutri} P)
            </span>
          </div>
        </div>

        {/* Stat: Kelas */}
        <div
          onClick={() => onNavigate('lembaga', 'kelas')}
          className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Jumlah Kelas
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {totalKelas} <span className="text-[11px] font-normal text-slate-500">Kelas</span>
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1 truncate">
            <span className="truncate">Tingkat Kelas 1 s/d Kelas 6</span>
          </div>
        </div>

        {/* Stat: Nilai Terinput */}
        <div
          onClick={() =>
            currentRole === 'admin' ? onNavigate('rekapan', 'rekap_guru') : onNavigate('input_nilai')
          }
          className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Nilai Terinput ({currentTerm.semester.toUpperCase()})
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5 tabular-nums">
                {totalNilaiMasuk} <span className="text-[11px] font-normal text-slate-500">Entri</span>
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-600 flex items-center justify-between gap-1 truncate">
            <span>Rata: <strong className="text-slate-900">{averageScore}</strong></span>
            <span className="text-emerald-700 font-semibold">{mumtazCount} Mumtaz</span>
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
                <span>PAPAN PENGUMUMAN</span>
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
                          onClick={() => handleDeleteAnnouncement(item.id, item.judul)}
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

      {/* In-app deletion confirmation modal */}
      <ConfirmModal
        isOpen={!!confirmDelete?.isOpen}
        title={confirmDelete?.title}
        message={confirmDelete?.message || ''}
        onConfirm={() => {
          if (confirmDelete?.onConfirm) {
            confirmDelete.onConfirm();
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

    </div>
  );
};
