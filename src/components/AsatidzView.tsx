import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AcademicTerm,
  Asatidz,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  RoleType,
  Santri,
  TugasMengajarItem,
} from '../types';
import {
  BookOpen,
  Save,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  UserCheck,
  AlertCircle,
  Clock,
  Layers,
  RotateCcw,
  Copy,
  GraduationCap,
  Printer,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  downloadGuruTemplateExcel,
  parseGuruExcel,
  exportGuruListToExcel,
  exportClassGradesToExcel,
} from '../utils/excelExport';
import { ConfirmModal } from './ConfirmModal';
import {
  doesGradeMatchMapel,
  doesTugasBelongToAsatidz,
  doesTugasMatchKelas,
  getSantriForKelas,
} from '../utils/dataSyncHelpers';

interface AsatidzViewProps {
  currentTerm: AcademicTerm;
  allAsatidz: Asatidz[];
  onUpdateAsatidz: (updated: Asatidz[]) => void;
  allKelas: Kelas[];
  allMapel?: MataPelajaran[];
  allSantri: Santri[];
  allNilai: NilaiSantri[];
  allTugasMengajar?: TugasMengajarItem[];
  onUpdateTugasMengajar?: (updated: TugasMengajarItem[]) => void;
  onSaveNilaiBatch: (savedNilai: NilaiSantri[]) => void;
  currentRole: RoleType;
  currentActiveAsatidz: Asatidz | null;
  onSelectActiveAsatidz?: (guru: Asatidz) => void;
  onNavigateToRekap?: () => void;
  activeSubTab?: string;
  onSelectSubTab?: (tab: 'akun' | 'mengajar' | 'rekapan') => void;
}

export const AsatidzView: React.FC<AsatidzViewProps> = ({
  currentTerm,
  allAsatidz,
  onUpdateAsatidz,
  allKelas,
  allMapel = [],
  allSantri,
  allNilai,
  allTugasMengajar = [],
  onUpdateTugasMengajar,
  onSaveNilaiBatch,
  currentRole,
  currentActiveAsatidz,
  onSelectActiveAsatidz,
  onNavigateToRekap,
  activeSubTab: propSubTab,
  onSelectSubTab,
}) => {
  const isAdmin = currentRole === 'admin';

  // Subtabs: 'akun' (Daftar Akun Guru) | 'mengajar' (Atur Tugas Mengajar) | 'rekapan' (Rekapan Asatidz Belum Input)
  const [internalTab, setInternalTab] = useState<'akun' | 'mengajar' | 'rekapan'>(
    isAdmin ? 'akun' : 'mengajar'
  );
  const activeTab = (propSubTab as 'akun' | 'mengajar' | 'rekapan') || internalTab;
  const setActiveTab = (tab: 'akun' | 'mengajar' | 'rekapan') => {
    setInternalTab(tab);
    if (onSelectSubTab) onSelectSubTab(tab);
  };

  // Toast / Alert Notification State
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setAlertNotice({ type, message });
    setTimeout(() => {
      setAlertNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Search & Filters for Akun Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWali, setFilterWali] = useState<string>('all');
  const [guruPageSize, setGuruPageSize] = useState<number>(10);
  const [guruCurrentPage, setGuruCurrentPage] = useState<number>(1);
  const [guruCopyFeedback, setGuruCopyFeedback] = useState(false);

  // Copy teacher data to clipboard
  const handleCopyGuruData = () => {
    const header = ['No', 'NIP / NIK', 'Nama Guru', 'L/P', 'TTL', 'Pendidikan', 'Password', 'Wali Kelas', 'JTM', 'Status'].join('\t');
    const rows = filteredGuruList.map((g, idx) =>
      [
        idx + 1,
        g.nip || '-',
        g.nama,
        g.gender || 'L',
        g.ttl || '-',
        g.pendidikan || '-',
        g.password || 'guru123',
        g.waliKelas || '-',
        `${g.jtm || 0} Jam`,
        g.status || 'Aktif',
      ].join('\t')
    );
    const fullText = [header, ...rows].join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setGuruCopyFeedback(true);
      setTimeout(() => setGuruCopyFeedback(false), 3000);
    });
  };

  const handlePrintGuruData = () => {
    window.print();
  };

  // --- Modal 1: Tambah / Edit Akun Guru ---
  const [guruModalOpen, setGuruModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Asatidz | null>(null);
  const [guruForm, setGuruForm] = useState<{
    nip: string;
    nama: string;
    gender: 'L' | 'P';
    ttl: string;
    pendidikan: string;
    password: string;
    waliKelas: string;
    jtm: number;
    kontak: string;
    status: 'Aktif' | 'Cuti' | 'Non-Aktif';
  }>({
    nip: '',
    nama: '',
    gender: 'L',
    ttl: '',
    pendidikan: 'S1 Pendidikan Agama Islam',
    password: 'guru123',
    waliKelas: '-',
    jtm: 24,
    kontak: '',
    status: 'Aktif',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open modal add guru
  const handleOpenAddGuru = () => {
    setEditingGuru(null);
    setGuruForm({
      nip: '',
      nama: '',
      gender: 'L',
      ttl: 'Jakarta, 01 Januari 1990',
      pendidikan: 'Sarjana (S1)',
      password: 'guru123',
      waliKelas: '-',
      jtm: 24,
      kontak: '',
      status: 'Aktif',
    });
    setGuruModalOpen(true);
  };

  // Open modal edit guru
  const handleOpenEditGuru = (guru: Asatidz) => {
    setEditingGuru(guru);
    setGuruForm({
      nip: guru.nip || '',
      nama: guru.nama,
      gender: guru.gender || 'L',
      ttl: guru.ttl || '',
      pendidikan: guru.pendidikan || 'Sarjana (S1)',
      password: guru.password || 'guru123',
      waliKelas: guru.waliKelas || '-',
      jtm: guru.jtm || 24,
      kontak: guru.kontak || '',
      status: guru.status || 'Aktif',
    });
    setGuruModalOpen(true);
  };

  // Submit guru form
  const handleSaveGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guruForm.nama.trim()) return;

    if (editingGuru) {
      const updated = allAsatidz.map((g) =>
        g.id === editingGuru.id
          ? {
              ...g,
              ...guruForm,
            }
          : g
      );
      onUpdateAsatidz(updated);
      showNotification(`Alhamdulillah, akun Asatidz "${guruForm.nama}" berhasil diperbarui!`);
    } else {
      const newGuru: Asatidz = {
        id: `ast-${Date.now()}`,
        mataPelajaranIds: [],
        kelasIds: [],
        ...guruForm,
      };
      onUpdateAsatidz([...allAsatidz, newGuru]);
      showNotification(`Alhamdulillah, akun Asatidz baru "${guruForm.nama}" berhasil ditambahkan!`);
    }
    setGuruModalOpen(false);
  };

  // State for in-app deletion confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [lastImportedBatch, setLastImportedBatch] = useState<Asatidz[] | null>(null);

  // Delete guru
  const handleDeleteGuru = (id: string, nama: string) => {
    setConfirmDelete({
      isOpen: true,
      title: 'Hapus Akun Guru / Ustadz',
      message: `Yakin ingin menghapus akun guru/ustadz "${nama}"? Akun dan data penugasan terkait akan terhapus dari sistem.`,
      onConfirm: () => {
        onUpdateAsatidz(allAsatidz.filter((g) => g.id !== id));
        showNotification(`Akun guru "${nama}" berhasil dihapus.`);
      },
    });
  };

  // Handle Excel Upload for Teachers
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parseResult = await parseGuruExcel(file);
      if (!parseResult.success || parseResult.data.length === 0) {
        showNotification(parseResult.message || 'Tidak ada data guru yang valid pada file Excel.', 'error');
        return;
      }

      const nowTs = Date.now();
      const importedWithIds: Asatidz[] = [];
      const merged = [...allAsatidz];

      parseResult.data.forEach((imported, index) => {
        const cleanNip = (imported.nip || '').trim();
        const hasValidNip = cleanNip !== '' && cleanNip !== '-' && cleanNip !== '0';
        const cleanNama = (imported.nama || '').trim().toLowerCase();

        const existingIdx = merged.findIndex((m) => {
          const mNip = (m.nip || '').trim();
          if (hasValidNip && mNip && mNip !== '-' && mNip === cleanNip) return true;
          if (cleanNama && (m.nama || '').trim().toLowerCase() === cleanNama) return true;
          return false;
        });

        if (existingIdx >= 0) {
          const updatedItem: Asatidz = {
            ...merged[existingIdx],
            ...imported,
            id: merged[existingIdx].id,
            mataPelajaranIds: merged[existingIdx].mataPelajaranIds || [],
            kelasIds: merged[existingIdx].kelasIds || [],
          };
          merged[existingIdx] = updatedItem;
          importedWithIds.push(updatedItem);
        } else {
          const newItem: Asatidz = {
            ...imported,
            mataPelajaranIds: [],
            kelasIds: [],
            id: `ast-${nowTs}-${index}`,
          };
          merged.push(newItem);
          importedWithIds.push(newItem);
        }
      });

      setSearchQuery('');
      setFilterWali('all');
      setGuruCurrentPage(1);
      setGuruModalOpen(false);
      setLastImportedBatch(importedWithIds);
      onUpdateAsatidz(merged);
      showNotification(
        `Alhamdulillah, berhasil mengimpor ${parseResult.data.length} data guru dari file Excel "${file.name}"!`
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Format tidak sesuai';
      showNotification(`Gagal mengimpor file Excel: ${errMsg}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      e.target.value = '';
    }
  };

  // =========================================================================
  // --- ATUR TUGAS MENGAJAR STATE & LOGIC (SINKRON DENGAN DATA KELAS SANTRI) ---
  // =========================================================================

  // 1. Available Kelas List strictly synchronized with DATA SANTRI (allKelas)
  const availableKelasList = useMemo(() => {
    const fromKelas = allKelas.map((k) => k.nama?.trim()).filter(Boolean);
    const unique = Array.from(new Set(fromKelas));
    if (unique.length === 0) {
      return ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    }
    return unique;
  }, [allKelas]);

  // Selected Kelas
  const [selectedKelasNama, setSelectedKelasNama] = useState<string>(
    availableKelasList[0] || 'Kelas 1'
  );

  // Sync selectedKelasNama if list updates and current selected is not present
  useEffect(() => {
    if (availableKelasList.length > 0 && !availableKelasList.includes(selectedKelasNama)) {
      setSelectedKelasNama(availableKelasList[0]);
    }
  }, [availableKelasList, selectedKelasNama]);

  // Local editing rows for the currently selected Kelas
  interface EditingTugasRow {
    id: string;
    namaMapel: string;
    asatidzId: string;
    kkm: number;
  }

  const [tugasRows, setTugasRows] = useState<EditingTugasRow[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const resolveValidAsatidzId = (rawId: string): string => {
    if (!allAsatidz || allAsatidz.length === 0) return '';
    const trimmed = (rawId || '').trim();
    if (trimmed) {
      const exact = allAsatidz.find((a) => a.id === trimmed);
      if (exact) return exact.id;
      const byHelper = allAsatidz.find((a) =>
        doesTugasBelongToAsatidz({ id: '', tingkat: '', namaMapel: '', asatidzId: trimmed }, a, allAsatidz)
      );
      if (byHelper) return byHelper.id;
    }
    return allAsatidz[0]?.id || '';
  };

  // When selectedKelasNama changes, populate tugasRows from allTugasMengajar
  useEffect(() => {
    const matchingKelasObj = allKelas.find(
      (k) => k.nama.trim().toLowerCase() === selectedKelasNama.trim().toLowerCase()
    );

    const directMatches = allTugasMengajar.filter(
      (t) => t.tingkat.trim().toLowerCase() === selectedKelasNama.trim().toLowerCase()
    );

    const existing =
      directMatches.length > 0
        ? directMatches
        : allTugasMengajar.filter((t) =>
            matchingKelasObj ? doesTugasMatchKelas(t, matchingKelasObj, allKelas) : false
          );

    if (existing.length > 0) {
      setTugasRows(
        existing.map((t, idx) => ({
          id: `tug-${selectedKelasNama.replace(/[^a-zA-Z0-9]/g, '_')}-${idx + 1}`,
          namaMapel: t.namaMapel,
          asatidzId: resolveValidAsatidzId(t.asatidzId),
          kkm: t.kkm || 75,
        }))
      );
    } else {
      // Provide clean initial rows for newly selected Kelas
      setTugasRows([
        {
          id: `row-${Date.now()}-1`,
          namaMapel: '',
          asatidzId: allAsatidz[0]?.id || '',
          kkm: 75,
        },
        {
          id: `row-${Date.now()}-2`,
          namaMapel: '',
          asatidzId: allAsatidz[1]?.id || allAsatidz[0]?.id || '',
          kkm: 75,
        },
      ]);
    }
    setHasUnsavedChanges(false);
  }, [selectedKelasNama, allTugasMengajar, allAsatidz, allKelas]);

  // Helper to commit a set of rows for a given class name into allTugasMengajar
  const commitTugasForKelas = (rowsToCommit: EditingTugasRow[], targetKelasNama: string) => {
    const validRows = rowsToCommit.filter((r) => r.namaMapel && r.namaMapel.trim() !== '');
    const matchingKelasObj = allKelas.find(
      (k) => k.nama.trim().toLowerCase() === targetKelasNama.trim().toLowerCase()
    );

    const newItemsForKelas: TugasMengajarItem[] = validRows.map((r, idx) => ({
      id: `tug-${targetKelasNama.replace(/[^a-zA-Z0-9]/g, '_')}-${idx + 1}`,
      tingkat: targetKelasNama,
      namaMapel: r.namaMapel.trim(),
      asatidzId: resolveValidAsatidzId(r.asatidzId),
      kkm: Number(r.kkm) || 75,
    }));

    // Keep items from OTHER classes, and if any item had a general tingkat matching matchingKelasObj,
    // convert it to explicit items for any other classes in that same tingkat so it doesn't linger on targetKelasNama
    const remainingItems: TugasMengajarItem[] = [];
    allTugasMengajar.forEach((t) => {
      const tLower = t.tingkat.trim().toLowerCase();
      if (tLower === targetKelasNama.trim().toLowerCase()) {
        return; // replaced by newItemsForKelas
      }
      if (matchingKelasObj && doesTugasMatchKelas(t, matchingKelasObj, allKelas)) {
        const otherClassesInSameTingkat = allKelas.filter(
          (other) =>
            other.nama.trim().toLowerCase() !== targetKelasNama.trim().toLowerCase() &&
            doesTugasMatchKelas(t, other, allKelas)
        );
        otherClassesInSameTingkat.forEach((other, oIdx) => {
          remainingItems.push({
            ...t,
            id: `tug-${other.nama.replace(/[^a-zA-Z0-9]/g, '_')}-mig-${t.id}-${oIdx}`,
            tingkat: other.nama,
            asatidzId: resolveValidAsatidzId(t.asatidzId),
          });
        });
        return;
      }
      remainingItems.push({
        ...t,
        asatidzId: resolveValidAsatidzId(t.asatidzId),
      });
    });

    const updatedAllTugas = [...remainingItems, ...newItemsForKelas];

    if (onUpdateTugasMengajar) {
      onUpdateTugasMengajar(updatedAllTugas);
    }

    // Automatically sync assigned classes to Asatidz accounts
    const updatedAsatidz = allAsatidz.map((guru) => {
      const assignedToThisGuru = updatedAllTugas.filter((t) =>
        doesTugasBelongToAsatidz(t, guru, allAsatidz)
      );
      const matchingKelas = allKelas.filter((k) =>
        assignedToThisGuru.some((t) => doesTugasMatchKelas(t, k, allKelas))
      );
      return {
        ...guru,
        kelasIds: matchingKelas.map((k) => k.id),
      };
    });
    onUpdateAsatidz(updatedAsatidz);

    return validRows.length;
  };

  // Handlers for Tugas Rows
  const handleAddTugasRow = () => {
    const newRow: EditingTugasRow = {
      id: `row-${Date.now()}-${tugasRows.length + 1}`,
      namaMapel: '',
      asatidzId: allAsatidz[0]?.id || '',
      kkm: 75,
    };
    setTugasRows((prev) => [...prev, newRow]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveTugasRow = (index: number) => {
    const nextRows = tugasRows.filter((_, idx) => idx !== index);
    setTugasRows(nextRows);
    commitTugasForKelas(nextRows, selectedKelasNama);
    setHasUnsavedChanges(false);
    showNotification(`Baris mata pelajaran pada ${selectedKelasNama} berhasil dihapus dan disinkronkan.`);
  };

  const handleTugasRowChange = (index: number, field: keyof EditingTugasRow, value: string | number) => {
    setTugasRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Save Penugasan Mengajar for the selected Kelas
  const handleSaveTugasForKelas = () => {
    const savedCount = commitTugasForKelas(tugasRows, selectedKelasNama);
    setHasUnsavedChanges(false);
    showNotification(
      `Alhamdulillah! Data penugasan mata pelajaran & asatidz untuk ${selectedKelasNama} (${savedCount} Mapel) berhasil disimpan dan disinkronkan ke akun guru.`
    );
  };

  // Copy format from another Kelas
  const [copyFromKelas, setCopyFromKelas] = useState<string>('');
  const handleCopyFromOtherKelas = (sourceKelas: string) => {
    if (!sourceKelas) return;
    const sourceRows = allTugasMengajar.filter(
      (t) => t.tingkat.trim().toLowerCase() === sourceKelas.trim().toLowerCase()
    );
    if (sourceRows.length === 0) {
      showNotification(`Kelas ${sourceKelas} belum memiliki data penugasan mapel.`, 'error');
      return;
    }
    const cloned: EditingTugasRow[] = sourceRows.map((s, idx) => ({
      id: `row-${Date.now()}-${idx}`,
      namaMapel: s.namaMapel,
      asatidzId: s.asatidzId || (allAsatidz[0]?.id || ''),
      kkm: s.kkm || 75,
    }));
    setTugasRows(cloned);
    setHasUnsavedChanges(true);
    setCopyFromKelas('');
    showNotification(`Berhasil menyalin ${cloned.length} mata pelajaran dari ${sourceKelas}. Silakan atur asatidz dan klik Simpan Perubahan.`);
  };

  // Export Entire Tugas Mengajar Table across All Kelas to Excel
  const exportAllTugasExcel = () => {
    const data: (string | number)[][] = [
      ['PONDOK PESANTREN AL-HUSNA'],
      ['DAFTAR PENUGASAN MENGAJAR ASATIDZ BERDASARKAN KELAS & MATA PELAJARAN'],
      [`Tahun Ajaran / Semester: ${currentTerm.label}`],
      [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
      [''],
      ['No', 'Kelas', 'Nama Mata Pelajaran', 'Guru Pengampu / Asatidz', 'NIP Asatidz', 'KKM'],
    ];

    let rowNum = 1;
    availableKelasList.forEach((kelasNama) => {
      const kelasTugas = allTugasMengajar.filter(
        (t) => t.tingkat.trim().toLowerCase() === kelasNama.trim().toLowerCase()
      );
      kelasTugas.forEach((item) => {
        const guru = allAsatidz.find((g) => g.id === item.asatidzId);
        data.push([
          rowNum++,
          item.tingkat,
          item.namaMapel,
          guru?.nama || 'Belum diatur',
          guru?.nip || '-',
          item.kkm || 75,
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Penugasan Mengajar');
    XLSX.writeFile(wb, `Penugasan_Mengajar_Kelas_${currentTerm.label.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // =========================================================================
  // --- INPUT NILAI UJIAN STATE & LOGIC ---
  // =========================================================================

  const activeGuru =
    currentActiveAsatidz ||
    allAsatidz.find((g) => g.id === (isAdmin ? allAsatidz[0]?.id : '')) ||
    allAsatidz[0];

  const [selectedGuruId, setSelectedGuruId] = useState<string>(activeGuru?.id || '');

  // Selectable Classes
  const availableKelas = allKelas;
  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    availableKelas[0]?.id || ''
  );

  const activeKelas = allKelas.find((k) => k.id === selectedKelasId);

  // Available subjects for the active class's tingkat
  const availableSubjectsForClass = useMemo(() => {
    if (!activeKelas) return [];
    const fromTugas = allTugasMengajar.filter(
      (t) => t.tingkat.trim().toLowerCase() === activeKelas.tingkat.trim().toLowerCase()
    );

    // If teacher is non-admin, prefer subjects assigned to this teacher, or show all for this class
    if (!isAdmin && activeGuru) {
      const assignedToTeacher = fromTugas.filter((t) => t.asatidzId === activeGuru.id);
      if (assignedToTeacher.length > 0) return assignedToTeacher;
    }

    return fromTugas;
  }, [activeKelas, allTugasMengajar, isAdmin, activeGuru]);

  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');

  // Update selectedSubjectName when availableSubjectsForClass changes
  useEffect(() => {
    if (availableSubjectsForClass.length > 0) {
      if (!availableSubjectsForClass.some((s) => s.namaMapel === selectedSubjectName)) {
        setSelectedSubjectName(availableSubjectsForClass[0].namaMapel);
      }
    } else {
      setSelectedSubjectName('');
    }
  }, [availableSubjectsForClass, selectedSubjectName]);

  const [draftScores, setDraftScores] = useState<
    Record<string, { harian: number; lisan: number; tulis: number; catatan: string }>
  >({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const classSantri = useMemo(() => {
    return allSantri.filter((s) => s.kelasId === selectedKelasId && s.status === 'Aktif');
  }, [allSantri, selectedKelasId]);

  // Load existing grades
  useEffect(() => {
    const existingGrades = allNilai.filter(
      (n) =>
        n.termId === currentTerm.id &&
        n.kelasId === selectedKelasId &&
        (n.mapelId === selectedSubjectName || n.mapelId === activeKelas?.nama)
    );

    const initialMap: Record<string, { harian: number; lisan: number; tulis: number; catatan: string }> = {};

    classSantri.forEach((santri) => {
      const found = existingGrades.find((g) => g.santriId === santri.id);
      if (found) {
        initialMap[santri.id] = {
          harian: found.nilaiHarian,
          lisan: found.nilaiLisan,
          tulis: found.nilaiTulis,
          catatan: found.catatan || '',
        };
      } else {
        initialMap[santri.id] = {
          harian: 80,
          lisan: 80,
          tulis: 80,
          catatan: 'Baik, tingkatkan ketelitian.',
        };
      }
    });

    setDraftScores(initialMap);
    setSaveSuccessNotice(null);
  }, [selectedKelasId, selectedSubjectName, currentTerm.id, allNilai, classSantri, activeKelas]);

  // Compute final score (Harian 30%, Lisan 30%, Tulis 40%)
  const calculateFinal = (harian: number, lisan: number, tulis: number) => {
    const final = harian * 0.3 + lisan * 0.3 + tulis * 0.4;
    return Math.round(final * 10) / 10;
  };

  const getPredikat = (final: number): { predikat: string; badgeColor: string } => {
    if (final >= 90) return { predikat: 'Mumtaz (A)', badgeColor: 'bg-emerald-100 text-emerald-800' };
    if (final >= 80) return { predikat: 'Jayyid Jiddan (B)', badgeColor: 'bg-teal-100 text-teal-800' };
    if (final >= 70) return { predikat: 'Jayyid (C)', badgeColor: 'bg-blue-100 text-blue-800' };
    if (final >= 60) return { predikat: 'Maqbul (D)', badgeColor: 'bg-amber-100 text-amber-800' };
    return { predikat: 'Rosib (E)', badgeColor: 'bg-rose-100 text-rose-800' };
  };

  const handleScoreChange = (
    santriId: string,
    field: 'harian' | 'lisan' | 'tulis' | 'catatan',
    val: string | number
  ) => {
    setDraftScores((prev) => {
      const current = prev[santriId] || { harian: 80, lisan: 80, tulis: 80, catatan: '' };
      return {
        ...prev,
        [santriId]: {
          ...current,
          [field]: field === 'catatan' ? val : Math.max(0, Math.min(100, Number(val) || 0)),
        },
      };
    });
  };

  const handleSaveGrades = () => {
    if (!selectedKelasId) {
      showNotification('Silakan pilih kelas terlebih dahulu.', 'error');
      return;
    }

    const currentSubject = selectedSubjectName || 'Umum';

    const newNilaiEntries: NilaiSantri[] = classSantri.map((santri) => {
      const draft = draftScores[santri.id] || { harian: 80, lisan: 80, tulis: 80, catatan: '' };
      const nilaiAkhir = calculateFinal(draft.harian, draft.lisan, draft.tulis);
      const { predikat } = getPredikat(nilaiAkhir);

      return {
        id: `nil-${currentTerm.id}-${selectedKelasId}-${currentSubject.replace(/[^a-zA-Z0-9]/g, '_')}-${santri.id}`,
        santriId: santri.id,
        mapelId: currentSubject,
        asatidzId: selectedGuruId || activeGuru?.id || '',
        kelasId: selectedKelasId,
        termId: currentTerm.id,
        nilaiHarian: draft.harian,
        nilaiLisan: draft.lisan,
        nilaiTulis: draft.tulis,
        nilaiAkhir,
        predikat,
        catatan: draft.catatan,
        tanggalInput: new Date().toISOString().split('T')[0],
      };
    });

    onSaveNilaiBatch(newNilaiEntries);
    const successMsg = `Alhamdulillah! Nilai ujian santri kelas ${activeKelas?.nama || ''} untuk mata pelajaran "${currentSubject}" berhasil disimpan ke Cloud database.`;
    setSaveSuccessNotice(successMsg);
    showNotification(successMsg);
  };

  // Filtered teachers for Admin list
  const filteredGuruList = useMemo(() => {
    return allAsatidz.filter((guru) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        guru.nama.toLowerCase().includes(q) ||
        (guru.nip && guru.nip.toLowerCase().includes(q)) ||
        (guru.pendidikan && guru.pendidikan.toLowerCase().includes(q));

      if (filterWali === 'all') return matchQuery;
      if (filterWali === 'wali') return matchQuery && guru.waliKelas && guru.waliKelas !== '-';
      if (filterWali === 'non_wali') return matchQuery && (!guru.waliKelas || guru.waliKelas === '-');
      return matchQuery;
    });
  }, [allAsatidz, searchQuery, filterWali]);

  const totalGuruPages = Math.max(1, Math.ceil(filteredGuruList.length / guruPageSize));
  const paginatedGuruList = useMemo(() => {
    const start = (guruCurrentPage - 1) * guruPageSize;
    return filteredGuruList.slice(start, start + guruPageSize);
  }, [filteredGuruList, guruCurrentPage, guruPageSize]);

  return (
    <div className="space-y-5">
      {/* Active Sub-Section Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold shadow-xs">
            {activeTab === 'akun' && <Users className="w-4 h-4" />}
            {activeTab === 'mengajar' && <BookOpen className="w-4 h-4" />}
            {activeTab === 'rekapan' && <FileSpreadsheet className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ASATIDZ &amp; DEWAN GURU
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                {activeTab === 'akun' && `DAFTAR AKUN GURU & ASATIDZ (${allAsatidz.length} TERDAFTAR)`}
                {activeTab === 'mengajar' && (isAdmin ? 'ATUR TUGAS MENGAJAR (MAPEL & ASATIDZ)' : 'JADWAL TUGAS MENGAJAR SAYA')}
                {activeTab === 'rekapan' && 'REKAPAN ASATIDZ BELUM MENGINPUT NILAI UJIAN'}
              </h2>
            </div>
          </div>
        </div>

        {/* Current Active User Info & Term */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Periode:</span>
          <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
            {currentTerm.label}
          </span>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alertNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
            alertNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-medium">{alertNotice.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {alertNotice.type === 'success' &&
              lastImportedBatch &&
              lastImportedBatch.length > 0 &&
              allAsatidz.length > lastImportedBatch.length && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateAsatidz(lastImportedBatch);
                    setGuruCurrentPage(1);
                    const count = lastImportedBatch.length;
                    setLastImportedBatch(null);
                    showNotification(
                      `Daftar guru telah disesuaikan menjadi hanya ${count} data guru dari file Excel yang baru diupload.`
                    );
                  }}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs"
                >
                  Gunakan Hanya Data Excel Ini ({lastImportedBatch.length} Guru)
                </button>
              )}
            <button
              onClick={() => setAlertNotice(null)}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. ADMIN TAB: DAFTAR AKUN GURU & ASATIDZ (Image 2 Table Style) */}
      {/* ============================================================ */}
      {isAdmin && activeTab === 'akun' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Daftar Akun Guru &amp; Asatidz
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Master data akun pengajar madrasah, hak akses portal asatidz, dan wali kelas ({allAsatidz.length} Guru terdaftar)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-tambah-guru-baru"
                onClick={handleOpenAddGuru}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Akun Guru</span>
              </button>
            </div>
          </div>

          {/* Datatable Toolbar: Action Buttons, Entries, Search */}
          <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyGuruData}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer text-xs"
                title="Salin data tabel guru ke clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{guruCopyFeedback ? 'Tersalin!' : 'Copy'}</span>
              </button>

              <button
                onClick={handlePrintGuruData}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer text-xs"
                title="Cetak tabel guru"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print</span>
              </button>

              <button
                onClick={() => exportGuruListToExcel(allAsatidz, allKelas, allMapel)}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer text-xs shadow-2xs"
                title="Unduh data akun guru ke file Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Excel</span>
              </button>

              <label
                htmlFor="upload-guru-excel"
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer text-xs shadow-2xs"
                title="Impor akun guru dari file Excel (.xlsx, .xls, .csv)"
              >
                <Upload className="w-3.5 h-3.5 text-teal-700" />
                <span>Upload Guru</span>
                <input
                  ref={fileInputRef}
                  id="upload-guru-excel"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={downloadGuruTemplateExcel}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer text-xs"
                title="Download format template Excel untuk pengisian data guru"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Format Excel</span>
              </button>

              <select
                value={filterWali}
                onChange={(e) => {
                  setFilterWali(e.target.value);
                  setGuruCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Penugasan</option>
                <option value="wali">Wali Kelas Saja</option>
                <option value="non_wali">Bukan Wali Kelas</option>
              </select>

              {/* Show Entries Dropdown */}
              <div className="flex items-center gap-1.5 text-slate-600 pl-1">
                <span>Show</span>
                <select
                  value={guruPageSize}
                  onChange={(e) => {
                    setGuruPageSize(Number(e.target.value));
                    setGuruCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            {/* Right Search Input */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setGuruCurrentPage(1);
                  }}
                  placeholder="Cari guru..."
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setGuruCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Element with Clean Borders */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center border-r border-slate-200 w-12">
                    No
                  </th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 whitespace-nowrap w-36">
                    NIP / NIK
                  </th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[200px]">
                    Nama Lengkap Guru
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-200 w-14">
                    L/P
                  </th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[180px]">
                    Tempat, Tgl Lahir
                  </th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[140px]">
                    Pendidikan
                  </th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 w-36">
                    Password Log In
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200 w-28">
                    Wali Kelas
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-200 w-16">
                    JTM
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-200 w-20">
                    Status
                  </th>
                  <th className="py-2.5 px-3 text-center w-28">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedGuruList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400 border-b border-slate-200">
                      Tidak ada data guru yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedGuruList.map((guru, idx) => {
                    const rowNumber = (guruCurrentPage - 1) * guruPageSize + idx + 1;
                    return (
                      <tr
                        key={guru.id}
                        className="hover:bg-emerald-50/40 border-b border-slate-200 transition-colors"
                      >
                        {/* No */}
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium border-r border-slate-200">
                          {rowNumber}
                        </td>

                        {/* NIP / NIK */}
                        <td className="py-2.5 px-3.5 font-mono text-slate-700 border-r border-slate-200">
                          {guru.nip || '-'}
                        </td>

                        {/* Nama Guru */}
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-slate-200 uppercase">
                          {guru.nama}
                        </td>

                        {/* L/P */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              guru.gender === 'P'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {guru.gender || 'L'}
                          </span>
                        </td>

                        {/* Tempat, Tgl Lahir */}
                        <td className="py-2.5 px-3.5 text-slate-600 border-r border-slate-200">
                          {guru.ttl || '-'}
                        </td>

                        {/* Pendidikan */}
                        <td className="py-2.5 px-3.5 text-slate-700 border-r border-slate-200">
                          {guru.pendidikan || 'S1'}
                        </td>

                        {/* Password */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 font-mono">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-semibold text-xs inline-block">
                            {guru.password || 'guru123'}
                          </span>
                        </td>

                        {/* Wali Kelas */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-200">
                          {guru.waliKelas && guru.waliKelas !== '-' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                              {guru.waliKelas}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* JTM */}
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                          {guru.jtm || 0} Jam
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              guru.status === 'Cuti'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {guru.status || 'Aktif'}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditGuru(guru)}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="Edit Data Guru"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('mengajar')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="Atur Tugas Mengajar"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Mapel</span>
                            </button>
                            <button
                              onClick={() => handleDeleteGuru(guru.id, guru.nama)}
                              className="px-1.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                              title="Hapus Akun Guru"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Datatable Footer: Info & Pagination Controls */}
          <div className="p-3.5 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-200">
            <div>
              {filteredGuruList.length === 0 ? (
                <span>Showing 0 to 0 of 0 entries</span>
              ) : (
                <span>
                  Showing {(guruCurrentPage - 1) * guruPageSize + 1} to{' '}
                  {Math.min(guruCurrentPage * guruPageSize, filteredGuruList.length)} of{' '}
                  {filteredGuruList.length} entries
                  {searchQuery && ` (filtered from ${allAsatidz.length} total entries)`}
                </span>
              )}
            </div>

            {/* Pagination Button Controls */}
            <div className="flex items-center gap-1 select-none">
              <button
                onClick={() => setGuruCurrentPage(1)}
                disabled={guruCurrentPage === 1}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition cursor-pointer"
              >
                First
              </button>
              <button
                onClick={() => setGuruCurrentPage((p) => Math.max(1, p - 1))}
                disabled={guruCurrentPage === 1}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition cursor-pointer"
              >
                Previous
              </button>

              {/* Dynamic Page Indicator */}
              {Array.from({ length: totalGuruPages }, (_, i) => i + 1)
                .filter((p) => {
                  return (
                    p === 1 ||
                    p === totalGuruPages ||
                    Math.abs(p - guruCurrentPage) <= 1
                  );
                })
                .map((page, i, arr) => {
                  const prevPage = arr[i - 1];
                  const hasGap = prevPage && page - prevPage > 1;
                  return (
                    <React.Fragment key={page}>
                      {hasGap && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setGuruCurrentPage(page)}
                        className={`px-3 py-1 rounded border text-xs font-bold transition cursor-pointer ${
                          guruCurrentPage === page
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setGuruCurrentPage((p) => Math.min(totalGuruPages, p + 1))}
                disabled={guruCurrentPage >= totalGuruPages}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition cursor-pointer"
              >
                Next
              </button>
              <button
                onClick={() => setGuruCurrentPage(totalGuruPages)}
                disabled={guruCurrentPage >= totalGuruPages}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition cursor-pointer"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TAB: ATUR TUGAS MENGAJAR (SINKRON DATA KELAS SANTRI) */}
      {/* ============================================================ */}
      {activeTab === 'mengajar' && (
        <div className="space-y-4">
          {isAdmin ? (
            /* ADMIN VIEW: Kelas Dropdown + Manual Subject & Asatidz Matrix with Save Button */
            <div className="space-y-4">
              {/* Header & Kelas Selector Bar */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-700" />
                    <label className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                      KELAS :
                    </label>
                  </div>

                  {/* Dropdown Kelas synced with Data Santri */}
                  <select
                    id="select-kelas-dropdown"
                    value={selectedKelasNama}
                    onChange={(e) => {
                      const nextKelas = e.target.value;
                      if (hasUnsavedChanges) {
                        commitTugasForKelas(tugasRows, selectedKelasNama);
                      }
                      setSelectedKelasNama(nextKelas);
                    }}
                    className="text-xs sm:text-sm font-extrabold px-3.5 py-2 bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs cursor-pointer"
                  >
                    {availableKelasList.map((kelasNama) => (
                      <option key={kelasNama} value={kelasNama}>
                        {kelasNama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right side actions: Salin format */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={copyFromKelas}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCopyFromKelas(val);
                        if (val) handleCopyFromOtherKelas(val);
                      }}
                      className="bg-transparent text-xs text-slate-600 font-semibold outline-none cursor-pointer"
                    >
                      <option value="">Salin Dari Kelas Lain...</option>
                      {availableKelasList
                        .filter((k) => k.toLowerCase() !== selectedKelasNama.toLowerCase())
                        .map((k) => (
                          <option key={k} value={k}>
                            Salin Mapel {k}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Information Banner */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 block">
                      Pengaturan Penugasan Guru untuk {selectedKelasNama}:
                    </span>
                    <span className="text-emerald-800 text-[11px]">
                      Isi nama mata pelajaran dan pilih guru pengampu (Asatidz) dari akun guru terdaftar. Saat Anda klik <strong>Simpan Perubahan</strong>, seluruh mata pelajaran ini akan otomatis masuk ke akun masing-masing asatidz untuk pengisian nilai santri.
                    </span>
                  </div>
                </div>

                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 font-bold text-[11px] rounded-full border border-amber-300 animate-pulse flex-shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Perubahan Belum Disimpan</span>
                  </span>
                )}
              </div>

              {/* Table of Subjects & Asatidz for Selected Kelas */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase">
                      Tabel Pengaturan Mata Pelajaran &amp; Guru Pengampu — {selectedKelasNama}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Data mata pelajaran di tabel ini otomatis tersinkron ke fitur Input Nilai Asatidz, Rekapan, dan Cetak Raport.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportAllTugasExcel}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Export Tabel Tugas (Excel)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 w-12">No</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200 w-32">Kelas / Tingkat</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[220px]">Nama Mata Pelajaran</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[240px]">Guru Pengampu / Asatidz (Sinkron Akun Guru)</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 w-24">KKM</th>
                        <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tugasRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 border-b border-slate-200">
                            Belum ada baris mata pelajaran untuk {selectedKelasNama}. Klik tombol "+ Tambah Baris Mata Pelajaran" di bawah.
                          </td>
                        </tr>
                      ) : (
                        tugasRows.map((row, idx) => (
                          <tr key={row.id} className="border-b border-slate-200 hover:bg-emerald-50/30 transition">
                            {/* No */}
                            <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                              {idx + 1}
                            </td>

                            {/* Kelas */}
                            <td className="py-2 px-3.5 font-bold text-emerald-800 border-r border-slate-200 bg-slate-50/50">
                              {selectedKelasNama}
                            </td>

                            {/* Nama Mata Pelajaran */}
                            <td className="py-2 px-3.5 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.namaMapel}
                                onChange={(e) => handleTugasRowChange(idx, 'namaMapel', e.target.value)}
                                placeholder="Ketik nama mata pelajaran (contoh: Fiqih, Tahfidzul Qur'an, Nahwu...)"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition"
                              />
                            </td>

                            {/* Guru Pengampu / Asatidz */}
                            <td className="py-2 px-3.5 border-r border-slate-200">
                              <select
                                value={row.asatidzId}
                                onChange={(e) => handleTugasRowChange(idx, 'asatidzId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-emerald-50/60 border border-emerald-300 rounded-lg font-bold text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
                              >
                                {allAsatidz.length === 0 ? (
                                  <option value="">Belum ada akun guru (Tambahkan di Daftar Akun Guru)</option>
                                ) : (
                                  allAsatidz.map((guru) => (
                                    <option key={guru.id} value={guru.id}>
                                      {guru.nama} {guru.nip ? `(NIP: ${guru.nip})` : ''}
                                    </option>
                                  ))
                                )}
                              </select>
                            </td>

                            {/* KKM */}
                            <td className="py-2 px-3 text-center border-r border-slate-200">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={row.kkm || 75}
                                onChange={(e) => handleTugasRowChange(idx, 'kkm', parseInt(e.target.value) || 75)}
                                className="w-16 px-2 py-1.5 text-center bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                            </td>

                            {/* Aksi */}
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTugasRow(idx)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                                title="Hapus Baris Mata Pelajaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Actions */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    id="btn-tambah-baris-mapel"
                    type="button"
                    onClick={handleAddTugasRow}
                    className="py-1.5 px-3.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Tambah Baris Mata Pelajaran</span>
                  </button>

                  <div className="flex items-center justify-end gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      Total: <strong className="text-slate-800">{tugasRows.filter((r) => r.namaMapel.trim()).length}</strong> mata pelajaran untuk <strong>{selectedKelasNama}</strong>
                    </span>

                    <button
                      id="btn-simpan-tugas-kelas"
                      type="button"
                      onClick={handleSaveTugasForKelas}
                      className="py-1.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabel Ringkasan Seluruh Penugasan Mengajar Semua Kelas (Kelas 1 s/d Kelas 6) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase">
                      Tabel Daftar Seluruh Tugas Mengajar Asatidz (Semua Kelas)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ringkasan seluruh penugasan mengajar yang telah tersimpan untuk setiap kelas. Klik tombol "Pilih Kelas" untuk mengubah.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                    Total: {allTugasMengajar.length} Tugas Mengajar Aktif
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 w-12">No</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200 w-32">Kelas</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200">Mata Pelajaran</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200">Guru Pengampu (Asatidz)</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200 w-36">NIP / NIK</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 w-20">KKM</th>
                        <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTugasMengajar.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 border-b border-slate-200">
                            Belum ada tugas mengajar yang disimpan.
                          </td>
                        </tr>
                      ) : (
                        allTugasMengajar.map((item, idx) => {
                          const guru = allAsatidz.find((g) =>
                            doesTugasBelongToAsatidz(item, g, allAsatidz)
                          );
                          return (
                            <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                              <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-200 font-medium">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3.5 font-bold text-emerald-800 border-r border-slate-200">
                                {item.tingkat}
                              </td>
                              <td className="py-2 px-3.5 font-bold text-slate-800 border-r border-slate-200">
                                {item.namaMapel}
                              </td>
                              <td className="py-2 px-3.5 font-semibold text-slate-800 border-r border-slate-200">
                                {guru?.nama || 'Belum ditentukan'}
                              </td>
                              <td className="py-2 px-3.5 font-mono text-slate-600 border-r border-slate-200">
                                {guru?.nip || '-'}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                                {item.kkm || 75}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (hasUnsavedChanges) {
                                        commitTugasForKelas(tugasRows, selectedKelasNama);
                                      }
                                      const matchedKls = allKelas.find((k) =>
                                        doesTugasMatchKelas(item, k, allKelas)
                                      );
                                      setSelectedKelasNama(matchedKls ? matchedKls.nama : item.tingkat);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onUpdateTugasMengajar) {
                                        onUpdateTugasMengajar(
                                          allTugasMengajar.filter((t) => t.id !== item.id)
                                        );
                                        showNotification(
                                          `Tugas mengajar "${item.namaMapel}" (${item.tingkat}) berhasil dihapus.`
                                        );
                                      }
                                    }}
                                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md transition cursor-pointer"
                                    title="Hapus Tugas Mengajar Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ASATIDZ / GURU VIEW: Clean Table of Assigned Classes & Mapels */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase">
                    Tabel Tugas Mengajar Saya ({activeGuru?.nama})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftar kelas dan mata pelajaran yang ditugaskan kepada Anda pada {currentTerm.label}.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 text-center border-r border-slate-200 w-12">No</th>
                      <th className="py-2.5 px-3.5 border-r border-slate-200">Kelas / Tingkat</th>
                      <th className="py-2.5 px-3.5 border-r border-slate-200">Mata Pelajaran Diampu</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-200 w-24">KKM</th>
                      <th className="py-2.5 px-3 text-center w-32">Jumlah Santri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTugasMengajar
                      .filter((t) => doesTugasBelongToAsatidz(t, activeGuru, allAsatidz))
                      .map((t, idx) => {
                        const kls = allKelas.find((k) => doesTugasMatchKelas(t, k, allKelas));
                        const santriCount = getSantriForKelas(kls, allSantri).length;
                        return (
                          <tr key={t.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="py-2 px-3 text-center border-r border-slate-200">{idx + 1}</td>
                            <td className="py-2 px-3.5 font-bold text-emerald-800 border-r border-slate-200">{t.tingkat}</td>
                            <td className="py-2 px-3.5 font-bold text-slate-800 border-r border-slate-200">{t.namaMapel}</td>
                            <td className="py-2 px-3 text-center font-bold border-r border-slate-200">{t.kkm || 75}</td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-700">{santriCount} Santri</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TAB: REKAPAN ASATIDZ BELUM MENGINPUT NILAI UJIAN */}
      {/* ============================================================ */}
      {activeTab === 'rekapan' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase">
                  Tabel Rekapan Status Input Nilai Asatidz
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau progres penginputan nilai ujian santri oleh masing-masing guru pengampu pada {currentTerm.label}.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                  {allAsatidz.filter(g => allNilai.some(n => n.termId === currentTerm.id && n.asatidzId === g.id)).length} Sudah Input
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
                  {allAsatidz.filter(g => !allNilai.some(n => n.termId === currentTerm.id && n.asatidzId === g.id)).length} Belum Input
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-3 text-center border-r border-slate-200 w-10">No</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 w-36">NIP / NIK</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[160px]">Nama Asatidz</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[380px]">
                      Mata Pelajaran Diampu (Tabel Rincian Mapel &amp; Kelas)
                    </th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 min-w-[180px]">
                      Ringkasan Kelas / Tugas
                    </th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200 w-36">Status Input Nilai</th>
                    <th className="py-2.5 px-3 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allAsatidz.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 border-b border-slate-200">
                        Belum ada data asatidz terdaftar.
                      </td>
                    </tr>
                  ) : (
                    allAsatidz.map((guru, idx) => {
                      const assignedTasks = allTugasMengajar.filter((t) =>
                        doesTugasBelongToAsatidz(t, guru, allAsatidz)
                      );
                      const fallbackTasks =
                        assignedTasks.length === 0
                          ? guru.mataPelajaranIds
                              .map((mid, mIdx) => {
                                const m = allMapel.find((mp) => mp.id === mid);
                                if (!m) return null;
                                return {
                                  id: `fb-${guru.id}-${mIdx}`,
                                  namaMapel: m.nama,
                                  tingkat:
                                    guru.waliKelas && guru.waliKelas !== '-'
                                      ? guru.waliKelas
                                      : 'Umum',
                                  kkm: m.kkm || 75,
                                };
                              })
                              .filter(Boolean) as Array<{
                              id: string;
                              namaMapel: string;
                              tingkat: string;
                              kkm: number;
                            }>
                          : [];

                      const displayTasks =
                        assignedTasks.length > 0
                          ? assignedTasks.map((t) => ({
                              id: t.id,
                              namaMapel: t.namaMapel,
                              tingkat: t.tingkat,
                              kkm: t.kkm || 75,
                            }))
                          : fallbackTasks;

                      const termNilai = allNilai.filter(
                        (n) =>
                          n.termId === currentTerm.id &&
                          (n.asatidzId === guru.id ||
                            assignedTasks.some((t) =>
                              doesGradeMatchMapel(n.mapelId, t.namaMapel, allMapel)
                            ))
                      );
                      const isSubmitted = termNilai.length > 0;
                      const mapelListForWa =
                        displayTasks.length > 0
                          ? displayTasks.map((t) => `${t.namaMapel} (${t.tingkat})`).join(', ')
                          : 'Belum Diatur';

                      const uniqueKelasSummary = Array.from(
                        new Set(displayTasks.map((t) => t.tingkat))
                      ).map((klsName) => ({
                        kelas: klsName,
                        count: displayTasks.filter((t) => t.tingkat === klsName).length,
                      }));

                      return (
                        <tr key={guru.id} className="border-b border-slate-200 hover:bg-slate-50/60 transition align-top">
                          <td className="py-3 px-3 text-center text-slate-500 font-medium border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-600 border-r border-slate-200">
                            {guru.nip || '-'}
                          </td>
                          <td className="py-3 px-3.5 font-bold text-slate-900 border-r border-slate-200 uppercase">
                            {guru.nama}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200">
                            {displayTasks.length === 0 ? (
                              <span className="text-slate-400 italic">Belum Diatur</span>
                            ) : (
                              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <table className="w-full text-[11px] text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                      <th className="py-1.5 px-2 text-center border-r border-slate-200 w-8">No</th>
                                      <th className="py-1.5 px-2.5 border-r border-slate-200">Nama Mata Pelajaran</th>
                                      <th className="py-1.5 px-2.5 border-r border-slate-200 w-36">Kelas / Tingkat</th>
                                      <th className="py-1.5 px-2 text-center w-12">KKM</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {displayTasks.map((task, tIdx) => (
                                      <tr
                                        key={task.id || tIdx}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-emerald-50/40"
                                      >
                                        <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-100 font-medium">
                                          {tIdx + 1}
                                        </td>
                                        <td className="py-1.5 px-2.5 font-semibold text-emerald-950 border-r border-slate-100">
                                          {task.namaMapel}
                                        </td>
                                        <td className="py-1.5 px-2.5 font-bold text-emerald-800 border-r border-slate-100">
                                          {task.tingkat}
                                        </td>
                                        <td className="py-1.5 px-2 text-center font-semibold text-slate-600">
                                          {task.kkm}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200">
                            {uniqueKelasSummary.length === 0 ? (
                              <span className="text-slate-500 font-medium">
                                {guru.waliKelas && guru.waliKelas !== '-' ? guru.waliKelas : 'Umum'}
                              </span>
                            ) : (
                              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <table className="w-full text-[11px] text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                      <th className="py-1.5 px-2.5 border-r border-slate-200">Kelas</th>
                                      <th className="py-1.5 px-2 text-center w-16">Mapel</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {uniqueKelasSummary.map((kItem, kIdx) => (
                                      <tr
                                        key={kIdx}
                                        className="border-b border-slate-100 last:border-b-0"
                                      >
                                        <td className="py-1.5 px-2.5 font-bold text-slate-800 border-r border-slate-100">
                                          {kItem.kelas}
                                        </td>
                                        <td className="py-1.5 px-2 text-center font-semibold text-emerald-800">
                                          {kItem.count}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center border-r border-slate-200">
                            {isSubmitted ? (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                                Sudah Input ({termNilai.length} Nilai)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-block">
                                Belum Input Nilai
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setActiveTab('mengajar')}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-bold transition shadow-2xs cursor-pointer"
                              >
                                Atur Tugas
                              </button>
                              {(() => {
                                const phone = guru.kontak ? guru.kontak.replace(/[^0-9]/g, '') : '';
                                const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
                                const msg = encodeURIComponent(
                                  `Assalamu'alaikum Ustadz/Ustadzah ${guru.nama},\n\nMohon bantuan untuk segera menginput nilai ujian santri untuk mata pelajaran *${mapelListForWa}* pada periode *${currentTerm.label}* di SIM Nilai Pondok Pesantren Alhusna.\n\nJazakumullahu khairan katsiran.`
                                );
                                const waLink = formattedPhone ? `https://wa.me/${formattedPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
                                return (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition shadow-2xs inline-flex items-center gap-1"
                                    title="Kirim Pengingat WhatsApp"
                                  >
                                    <span>WA</span>
                                  </a>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT AKUN GURU (ADMIN ONLY) */}
      {/* ============================================================ */}
      {guruModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{editingGuru ? 'Edit Akun Asatidz / Guru' : 'Tambah Akun Asatidz Baru'}</span>
              </h4>
              <button
                onClick={() => setGuruModalOpen(false)}
                className="text-emerald-200 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuruSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {!editingGuru && (
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-1">
                  <div>
                    <span className="font-bold text-teal-900 block">
                      Upload Banyak Guru Sekaligus via Excel
                    </span>
                    <span className="text-[11px] text-teal-700">
                      Unggah file .xlsx / .xls / .csv daftar guru atau unduh format templatenya.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <label className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer inline-flex items-center gap-1 text-[11px] shadow-2xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File Excel</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={downloadGuruTemplateExcel}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg inline-flex items-center gap-1 text-[11px] transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Template</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK / NUPTK / NIP
                  </label>
                  <input
                    type="text"
                    value={guruForm.nip}
                    onChange={(e) => setGuruForm({ ...guruForm, nip: e.target.value })}
                    placeholder="Contoh: 3201123456780001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin (L/P)
                  </label>
                  <select
                    value={guruForm.gender}
                    onChange={(e) => setGuruForm({ ...guruForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="L">L (Laki-laki / Ustadz)</option>
                    <option value="P">P (Perempuan / Ustadzah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Guru / Asatidz
                </label>
                <input
                  type="text"
                  value={guruForm.nama}
                  onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
                  placeholder="Contoh: Ust. Syahrul Ramadhan, S.Pd.I."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tempat, Tanggal Lahir (TTL)
                </label>
                <input
                  type="text"
                  value={guruForm.ttl}
                  onChange={(e) => setGuruForm({ ...guruForm, ttl: e.target.value })}
                  placeholder="Contoh: RANTAU EMBACANG, 14 Agustus 1985"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pendidikan Terakhir
                  </label>
                  <input
                    type="text"
                    value={guruForm.pendidikan}
                    onChange={(e) => setGuruForm({ ...guruForm, pendidikan: e.target.value })}
                    placeholder="S1 Pendidikan Islam"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password Akun Log In
                  </label>
                  <input
                    type="text"
                    value={guruForm.password}
                    onChange={(e) => setGuruForm({ ...guruForm, password: e.target.value })}
                    placeholder="guru123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amanah Wali Kelas
                  </label>
                  <select
                    value={guruForm.waliKelas}
                    onChange={(e) => setGuruForm({ ...guruForm, waliKelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="-">- Bukan Wali Kelas -</option>
                    {allKelas.map((k) => (
                      <option key={k.id} value={k.nama}>
                        Wali Kelas {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    JTM (Jam Tatap Muka)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={guruForm.jtm}
                    onChange={(e) => setGuruForm({ ...guruForm, jtm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuruModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Akun Guru
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
