import React from 'react';
import {
  AcademicTerm,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PesantrenProfile,
  Santri,
} from '../types';
import {
  RaportConfig,
  RaportSectionId,
  RaportSignatureRole,
  toArabicDigits,
  numberToTerbilangIndo,
  numberToTerbilangArab,
  getMapelArabicName,
  getPredikatBilingual,
  getRankArabic,
  getDefaultSantriExtra,
  buildRaportSheetGrid,
} from '../utils/excelExport';
import { ArrowUp, ArrowDown, Columns, AlignLeft, AlignCenter, AlignRight, ArrowLeftRight } from 'lucide-react';

interface RaportSheetCardProps {
  santri: Santri;
  santriIndex: number;
  totalSantriInClass: number;
  rank: number;
  kelas?: Kelas;
  currentTerm: AcademicTerm;
  profile: PesantrenProfile;
  allMapel: MataPelajaran[];
  santriGrades: NilaiSantri[];
  config: RaportConfig;
  autoFillPreviewGrades: boolean;
  isLiveEditMode: boolean;
  previewFormat?: 'paper' | 'excel_grid';
  onQuickUpdateGrade?: (santri: Santri, mapel: MataPelajaran, newAkhir: number) => void;
  onUpdateConfig?: (newConfig: RaportConfig) => void;
}

const SECTION_LABELS: Record<RaportSectionId, string> = {
  bismillah: 'Kalimat Bismillah',
  kop: 'Kop Surat Pesantren',
  judul: 'Judul Raport (Kasyfud Darajat)',
  identitas: 'Identitas Santri',
  nilai: 'Tabel Nilai Akademik',
  kepribadian: 'Tabel Nilai Kepribadian',
  ttd: 'Tanggal & Tanda Tangan',
};

const SIG_ROLE_LABELS: Record<RaportSignatureRole, string> = {
  orang_tua: 'Orang Tua / Wali',
  wali_kelas: 'Wali Kelas',
  pimpinan: 'Pimpinan / Mudir',
};

export const RaportSheetCard: React.FC<RaportSheetCardProps> = ({
  santri,
  santriIndex,
  totalSantriInClass,
  rank,
  kelas,
  currentTerm,
  profile,
  allMapel,
  santriGrades,
  config,
  autoFillPreviewGrades,
  isLiveEditMode,
  previewFormat = 'paper',
  onQuickUpdateGrade,
  onUpdateConfig,
}) => {
  const extra = getDefaultSantriExtra(santri, config.santriExtra);
  const waliName = config.waliKelasCustom || kelas?.waliKelas || 'Ust. Wali Kelas';
  const isArabic = config.showArabic;
  const isRTL = config.tableDirection === 'rtl' || config.templateStyle === 'arabic';
  const isFullArab = config.templateStyle === 'arabic';

  const sectionOrder: RaportSectionId[] =
    Array.isArray(config.sectionOrder) && config.sectionOrder.length > 0
      ? config.sectionOrder
      : ['bismillah', 'kop', 'judul', 'identitas', 'nilai', 'kepribadian', 'ttd'];

  const signatureOrder: [RaportSignatureRole, RaportSignatureRole, RaportSignatureRole] =
    Array.isArray(config.signatureOrder) && config.signatureOrder.length === 3
      ? (config.signatureOrder as [RaportSignatureRole, RaportSignatureRole, RaportSignatureRole])
      : ['orang_tua', 'wali_kelas', 'pimpinan'];

  const gapClass =
    config.sectionGap === 'compact'
      ? 'mb-1.5'
      : config.sectionGap === 'relaxed'
      ? 'mb-5'
      : 'mb-3';

  // Move section up or down
  const handleMoveSection = (secId: RaportSectionId, dir: -1 | 1) => {
    if (!onUpdateConfig) return;
    const idx = sectionOrder.indexOf(secId);
    if (idx === -1) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onUpdateConfig({ ...config, sectionOrder: next });
  };

  // Swap signature columns
  const handleSwapSignature = (idx: number, dir: -1 | 1) => {
    if (!onUpdateConfig) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= 3) return;
    const next = [...signatureOrder] as [
      RaportSignatureRole,
      RaportSignatureRole,
      RaportSignatureRole,
    ];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onUpdateConfig({ ...config, signatureOrder: next });
  };

  // Update Kepribadian value inline
  const handleUpdateKepribadianInline = (
    field: keyof typeof extra,
    value: string
  ) => {
    if (!onUpdateConfig) return;
    onUpdateConfig({
      ...config,
      santriExtra: {
        ...config.santriExtra,
        [santri.id]: {
          ...extra,
          [field]: value,
        },
      },
    });
  };

  // Theme colors
  const themeStyles = {
    classic_bw: {
      borderOuter: 'border-slate-900',
      borderTable: 'border-slate-800',
      headerBg: 'bg-slate-200/90 text-slate-950',
      subHeaderBg: 'bg-slate-100 text-slate-900',
      accentText: 'text-slate-950',
      kopBorder: 'border-slate-900',
      summaryBg: 'bg-slate-100/80',
    },
    emerald: {
      borderOuter: 'border-emerald-900',
      borderTable: 'border-emerald-800',
      headerBg: 'bg-emerald-900 text-white',
      subHeaderBg: 'bg-emerald-100 text-emerald-950',
      accentText: 'text-emerald-950',
      kopBorder: 'border-emerald-900',
      summaryBg: 'bg-emerald-50/90',
    },
    gold_classic: {
      borderOuter: 'border-amber-900',
      borderTable: 'border-amber-900',
      headerBg: 'bg-amber-900 text-amber-50',
      subHeaderBg: 'bg-amber-100/80 text-amber-950',
      accentText: 'text-amber-950',
      kopBorder: 'border-amber-900',
      summaryBg: 'bg-amber-50/80',
    },
    royal_blue: {
      borderOuter: 'border-blue-950',
      borderTable: 'border-blue-900',
      headerBg: 'bg-blue-950 text-white',
      subHeaderBg: 'bg-blue-100 text-blue-950',
      accentText: 'text-blue-950',
      kopBorder: 'border-blue-950',
      summaryBg: 'bg-blue-50/80',
    },
  }[config.colorTheme];

  // Determine mapel list
  const mapelToRender = config.showAllMapel
    ? allMapel
    : allMapel.filter((m) =>
        santriGrades.some(
          (g) =>
            g.mapelId === m.id ||
            g.mapelId.trim().toLowerCase() === m.nama.trim().toLowerCase()
        )
      );

  // Build rows with grades
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
      return {
        mapel,
        hasGrade: true,
        harian,
        lisan,
        tulis,
        akhir,
      };
    }
    return {
      mapel,
      hasGrade: false,
      harian: 0,
      lisan: 0,
      tulis: 0,
      akhir: 0,
    };
  });

  const gradedRows = gradeRows.filter((r) => r.hasGrade);
  const totalAkhir = gradedRows.reduce((sum, r) => sum + r.akhir, 0);
  const avgAkhir =
    gradedRows.length > 0 ? Math.round((totalAkhir / gradedRows.length) * 10) / 10 : 0;
  const overallPred =
    gradedRows.length > 0
      ? getPredikatBilingual(avgAkhir)
      : { indo: '-', arab: '-', letter: '-' };

  const logoSrc = profile.logoUrl || '/logo_alhusna.jpg';

  // ============================================================================
  // MODE 1: EXCEL GRID 1:1 PREVIEW (Identical to exported .xlsx file)
  // ============================================================================
  if (previewFormat === 'excel_grid') {
    const grid = buildRaportSheetGrid(
      santri,
      santriIndex,
      totalSantriInClass,
      rank,
      kelas,
      currentTerm,
      profile,
      allMapel,
      santriGrades,
      config,
      autoFillPreviewGrades
    );

    const colLetters = Array.from({ length: grid.totalCols }, (_, i) =>
      String.fromCharCode(65 + i)
    );

    // Helper to check if a cell (r, c) is the start of a merge or covered by a merge
    const getCellMergeState = (r: number, c: number) => {
      for (const m of grid.merges) {
        if (r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c) {
          if (r === m.s.r && c === m.s.c) {
            return {
              isOrigin: true,
              isCovered: false,
              colSpan: m.e.c - m.s.c + 1,
              rowSpan: m.e.r - m.s.r + 1,
            };
          }
          return { isOrigin: false, isCovered: true, colSpan: 1, rowSpan: 1 };
        }
      }
      return { isOrigin: true, isCovered: false, colSpan: 1, rowSpan: 1 };
    };

    return (
      <div className="bg-white border-2 border-emerald-800 rounded-xl shadow-xl overflow-hidden mx-auto max-w-[230mm] no-print-border">
        {/* Excel Sheet Header Bar */}
        <div className="bg-emerald-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-700 font-mono font-bold text-[11px]">
              .XLSX 1:1
            </span>
            <span className="font-bold">
              Preview Tabel Excel: {santriIndex + 1}. {santri.nama} ({grid.rows.length} Baris × {grid.totalCols} Kolom)
            </span>
          </div>
          <span className="text-emerald-200 text-[11px]">
            Tata letak baris, kolom &amp; merge cell di bawah ini 100% sama persis dengan file Excel saat diunduh
          </span>
        </div>

        <div className="overflow-x-auto bg-slate-100 p-2">
          <table
            className={`w-full border-collapse bg-white text-[11px] ${config.fontFamily}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <thead>
              <tr className="bg-slate-200 text-slate-700 font-mono text-[10px] select-none no-print">
                <th className="border border-slate-400 bg-slate-300/80 w-9 py-1 text-center font-bold">
                  #
                </th>
                {colLetters.map((letter, cIdx) => (
                  <th
                    key={letter}
                    className="border border-slate-400 py-1 px-2 text-center font-bold"
                    style={{
                      minWidth: `${Math.max(48, (grid.colWidths[cIdx]?.wch || 10) * 5.5)}px`,
                    }}
                  >
                    Kolom {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((rowCells, rIdx) => {
                const meta = grid.rowMeta[rIdx];
                const isSpacer = meta?.rowKind === 'spacer';
                const isKopTitle = meta?.rowKind === 'kop_title';
                const isDocTitle = meta?.rowKind === 'doc_title';
                const isTableHeader =
                  meta?.rowKind === 'table_header' ||
                  meta?.rowKind === 'kepribadian_header';
                const isSummary = meta?.rowKind === 'table_summary';

                return (
                  <tr
                    key={rIdx}
                    className={
                      isSpacer
                        ? 'h-3 bg-slate-50/60'
                        : isTableHeader
                        ? `${themeStyles.headerBg} font-bold`
                        : isSummary
                        ? `${themeStyles.summaryBg} font-bold`
                        : 'hover:bg-emerald-50/30'
                    }
                  >
                    {/* Excel Row Number */}
                    <td className="border border-slate-300 bg-slate-200/80 text-slate-600 font-mono text-[10px] text-center font-bold select-none px-1 py-0.5 no-print">
                      {rIdx + 1}
                    </td>

                    {Array.from({ length: grid.totalCols }).map((_, cIdx) => {
                      const mergeState = getCellMergeState(rIdx, cIdx);
                      if (mergeState.isCovered) return null;

                      const val = rowCells[cIdx] ?? '';
                      const textAlignClass =
                        isKopTitle || isDocTitle || meta?.rowKind === 'bismillah'
                          ? config.kopAlign === 'left'
                            ? 'text-left'
                            : config.kopAlign === 'right'
                            ? 'text-right'
                            : 'text-center'
                          : meta?.rowKind === 'tanggal_ttd'
                          ? (config.signatureAlign || config.tanggalAlign) === 'left'
                            ? 'text-left'
                            : (config.signatureAlign || config.tanggalAlign) === 'center'
                            ? 'text-center'
                            : 'text-right'
                          : meta?.rowKind === 'ttd_label' || meta?.rowKind === 'ttd_name'
                          ? 'text-center'
                          : isTableHeader
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td
                          key={cIdx}
                          colSpan={mergeState.colSpan}
                          rowSpan={mergeState.rowSpan}
                          className={`border border-slate-300 px-2 py-1 align-middle ${textAlignClass} ${
                            isKopTitle
                              ? 'font-extrabold text-xs sm:text-sm bg-emerald-50/30'
                              : isDocTitle
                              ? 'font-extrabold text-xs underline bg-amber-50/30'
                              : meta?.rowKind === 'bismillah'
                              ? 'font-amiri text-sm font-bold'
                              : meta?.rowKind === 'ttd_name'
                              ? 'font-extrabold underline'
                              : ''
                          }`}
                        >
                          <div className="min-h-[16px] whitespace-pre-wrap break-words">
                            {val !== '' ? String(val) : '\u00A0'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE 2: PAPER PREVIEW (WYSIWYG Printable Sheet with Section Reordering)
  // ============================================================================
  const renderSectionControlBar = (secId: RaportSectionId, extraControls?: React.ReactNode) => {
    if (!isLiveEditMode || !onUpdateConfig) return null;
    const idx = sectionOrder.indexOf(secId);
    return (
      <div className="no-print mb-1.5 px-2.5 py-1 rounded-lg bg-amber-50/95 border border-amber-300 flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
          <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-mono">
            Bagian #{idx + 1}
          </span>
          <span>{SECTION_LABELS[secId]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {extraControls}
          <button
            type="button"
            disabled={idx <= 0}
            onClick={() => handleMoveSection(secId, -1)}
            className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 disabled:opacity-40 border border-amber-300 font-bold text-slate-800 flex items-center gap-0.5 cursor-pointer"
            title="Geser posisi bagian ini ke atas"
          >
            <ArrowUp className="w-3 h-3" />
            <span>Geser Atas</span>
          </button>
          <button
            type="button"
            disabled={idx >= sectionOrder.length - 1}
            onClick={() => handleMoveSection(secId, 1)}
            className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 disabled:opacity-40 border border-amber-300 font-bold text-slate-800 flex items-center gap-0.5 cursor-pointer"
            title="Geser posisi bagian ini ke bawah"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Geser Bawah</span>
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (secId: RaportSectionId) => {
    switch (secId) {
      case 'bismillah': {
        if (!config.showBismillah) return null;
        return (
          <div key="bismillah" className={gapClass}>
            {renderSectionControlBar('bismillah')}
            <div className="text-center">
              <p className="font-amiri text-base sm:text-lg font-bold tracking-wide text-slate-900">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          </div>
        );
      }

      case 'kop': {
        const kopTextAlign =
          config.kopAlign === 'left'
            ? 'text-left'
            : config.kopAlign === 'right'
            ? 'text-right'
            : 'text-center';

        return (
          <div key="kop" className={gapClass}>
            {renderSectionControlBar(
              'kop',
              onUpdateConfig && (
                <div className="flex items-center gap-1 mr-1">
                  <span className="text-slate-600 font-semibold">Posisi Kop:</span>
                  {(['left', 'center', 'right'] as const).map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, kopAlign: al })}
                      className={`p-1 rounded border cursor-pointer ${
                        (config.kopAlign || 'center') === al
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                      title={`Rata ${al === 'left' ? 'Kiri' : al === 'right' ? 'Kanan' : 'Tengah'}`}
                    >
                      {al === 'left' ? (
                        <AlignLeft className="w-3 h-3" />
                      ) : al === 'right' ? (
                        <AlignRight className="w-3 h-3" />
                      ) : (
                        <AlignCenter className="w-3 h-3" />
                      )}
                    </button>
                  ))}
                </div>
              )
            )}
            <div className={`pb-3 border-b-4 border-double ${themeStyles.kopBorder}`}>
              <div className="flex items-center justify-between gap-4">
                {config.showLogo && (
                  <div className="shrink-0 hidden sm:flex items-center justify-center">
                    <img
                      src={logoSrc}
                      alt="Logo Pesantren"
                      className="w-16 h-16 object-contain rounded-full border border-slate-300 p-0.5 bg-white"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className={`flex-1 ${kopTextAlign} space-y-0.5`}>
                  {isArabic && (
                    <p className="font-amiri text-xs sm:text-sm font-bold text-slate-700" dir="rtl">
                      {config.yayasanNameArab}
                    </p>
                  )}
                  {!isFullArab && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {config.yayasanName}
                    </p>
                  )}
                  {isArabic && (
                    <h1
                      className={`font-amiri text-lg sm:text-xl font-bold leading-snug ${themeStyles.accentText}`}
                      dir="rtl"
                    >
                      {config.pesantrenNameArab}
                    </h1>
                  )}
                  {!isFullArab && (
                    <h2
                      className={`text-sm sm:text-base font-extrabold uppercase tracking-wide ${themeStyles.accentText}`}
                    >
                      {profile.nama}
                    </h2>
                  )}
                  {!isFullArab && (
                    <p className="text-[10px] font-semibold text-slate-700 uppercase">
                      {profile.subTitle}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-600">
                    NSPP: {profile.nspp} • {profile.alamat}, Kab. {profile.kabupaten}, {profile.provinsi}
                  </p>
                </div>

                {config.showLogo && (
                  <div className="shrink-0 hidden sm:flex items-center justify-center">
                    <img
                      src={logoSrc}
                      alt="Logo Pesantren"
                      className="w-16 h-16 object-contain rounded-full border border-slate-300 p-0.5 bg-white"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'judul': {
        return (
          <div key="judul" className={gapClass}>
            {renderSectionControlBar('judul')}
            <div className="text-center">
              {isArabic && (
                <h3
                  className="font-amiri text-base sm:text-lg font-bold text-slate-950 leading-tight"
                  dir="rtl"
                >
                  {config.headerTitleArab}
                </h3>
              )}
              {!isFullArab && (
                <h4 className="text-xs sm:text-sm font-extrabold uppercase underline tracking-wider text-slate-900 mt-0.5">
                  {config.headerTitle}
                </h4>
              )}
            </div>
          </div>
        );
      }

      case 'identitas': {
        const is1Col = config.identitasLayout === '1col';
        return (
          <div key="identitas" className={gapClass}>
            {renderSectionControlBar(
              'identitas',
              onUpdateConfig && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig({
                      ...config,
                      identitasLayout: is1Col ? '2col' : '1col',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Columns className="w-3 h-3" />
                  <span>{is1Col ? 'Ubah ke 2 Kolom' : 'Ubah ke 1 Kolom'}</span>
                </button>
              )
            )}
            <div
              className={`grid grid-cols-1 ${
                is1Col ? '' : 'sm:grid-cols-2'
              } gap-x-6 gap-y-1 text-[11px] p-2.5 border ${themeStyles.borderTable} ${
                themeStyles.summaryBg
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="space-y-1">
                <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-0.5">
                  <span className="font-semibold text-slate-700">
                    {isFullArab
                      ? 'اسم الطالب'
                      : isArabic
                      ? 'Nama Santri / اسم الطالب'
                      : 'Nama Santri'}
                  </span>
                  <span className="font-extrabold text-slate-950 uppercase">{santri.nama}</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-0.5">
                  <span className="font-semibold text-slate-700">
                    {isFullArab
                      ? 'رقم القيد / التسجيل'
                      : isArabic
                      ? 'Nomor Induk (NIS) / رقم القيد'
                      : 'Nomor Induk (NIS)'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {santri.nis} {isArabic && `(${toArabicDigits(santri.nis)})`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b sm:border-b-0 border-dotted border-slate-300 pb-0.5 sm:pb-0">
                  <span className="font-semibold text-slate-700">
                    {isFullArab ? 'الفصل الدراسي' : isArabic ? 'Kelas / الفصل' : 'Kelas'}
                  </span>
                  <span className="font-bold text-slate-900">{kelas?.nama || '-'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-0.5">
                  <span className="font-semibold text-slate-700">
                    {isFullArab ? 'الفترة الدراسية' : isArabic ? 'Semester / الفصل الدراسي' : 'Semester'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {currentTerm.semester === 'ganjil'
                      ? isArabic
                        ? 'Ganjil (الفصل الأول)'
                        : 'I (Ganjil)'
                      : isArabic
                      ? 'Genap (الفصل الثاني)'
                      : 'II (Genap)'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-0.5">
                  <span className="font-semibold text-slate-700">
                    {isFullArab
                      ? 'العام الدراسي'
                      : isArabic
                      ? 'Tahun Pelajaran / العام الدراسي'
                      : 'Tahun Pelajaran'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {currentTerm.year} M {isArabic && `/ ${config.tahunHijriyah}`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-slate-700">
                    {isFullArab
                      ? 'الحلقة / السكن'
                      : isArabic
                      ? 'Halaqah & Asrama / الحلقة'
                      : 'Halaqah & Asrama'}
                  </span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                    {santri.halaqah || 'Halaqah Tahfidz'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'nilai': {
        return (
          <div key="nilai" className={`${gapClass} overflow-x-auto`}>
            {renderSectionControlBar('nilai')}
            <table
              className={`w-full text-[11px] border-collapse border ${themeStyles.borderTable}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <thead>
                <tr className={`${themeStyles.headerBg} font-bold text-center`}>
                  <th
                    rowSpan={2}
                    className={`border ${themeStyles.borderTable} py-1.5 px-1.5 w-9`}
                  >
                    {isArabic && <div className="font-amiri text-xs leading-none">الرقم</div>}
                    {!isFullArab && <div className="text-[10px] mt-0.5">NO</div>}
                  </th>

                  <th
                    rowSpan={2}
                    className={`border ${themeStyles.borderTable} py-1.5 px-2.5`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {!isFullArab && <span>MATA PELAJARAN</span>}
                      {isArabic && (
                        <span className="font-amiri text-sm leading-none">المواد الدراسية</span>
                      )}
                    </div>
                  </th>

                  {config.showKKM && (
                    <th
                      rowSpan={2}
                      className={`border ${themeStyles.borderTable} py-1.5 px-1.5 w-13`}
                    >
                      {isArabic && <div className="font-amiri text-xs leading-none">الحد الأدنى</div>}
                      {!isFullArab && <div className="text-[10px] mt-0.5">KKM</div>}
                    </th>
                  )}

                  {config.showDetailNilai && (
                    <th
                      colSpan={3}
                      className={`border ${themeStyles.borderTable} py-1 px-2`}
                    >
                      {isArabic && (
                        <div className="font-amiri text-xs leading-none">تفاصيل الدرجات</div>
                      )}
                      {!isFullArab && <div className="text-[10px]">RINCIAN NILAI UJIAN</div>}
                    </th>
                  )}

                  <th
                    colSpan={config.showTerbilang ? (isArabic && !isFullArab ? 3 : 2) : 1}
                    className={`border ${themeStyles.borderTable} py-1 px-2`}
                  >
                    {isArabic && (
                      <div className="font-amiri text-xs leading-none">الدرجة النهائية</div>
                    )}
                    {!isFullArab && <div className="text-[10px]">NILAI HASIL UJIAN</div>}
                  </th>

                  {config.showPredikat && (
                    <th
                      rowSpan={2}
                      className={`border ${themeStyles.borderTable} py-1.5 px-2 w-24`}
                    >
                      {isArabic && <div className="font-amiri text-xs leading-none">التقدير</div>}
                      {!isFullArab && <div className="text-[10px] mt-0.5">PREDIKAT</div>}
                    </th>
                  )}
                </tr>

                <tr className={`${themeStyles.subHeaderBg} font-bold text-center text-[10px]`}>
                  {config.showDetailNilai && (
                    <>
                      <th className={`border ${themeStyles.borderTable} py-1 px-1 w-12`}>
                        {isArabic && <div className="font-amiri text-xs leading-none">اليومية</div>}
                        {!isFullArab && <div>Harian</div>}
                      </th>
                      <th className={`border ${themeStyles.borderTable} py-1 px-1 w-12`}>
                        {isArabic && <div className="font-amiri text-xs leading-none">الشفهي</div>}
                        {!isFullArab && <div>Lisan</div>}
                      </th>
                      <th className={`border ${themeStyles.borderTable} py-1 px-1 w-12`}>
                        {isArabic && <div className="font-amiri text-xs leading-none">التحريري</div>}
                        {!isFullArab && <div>Tulis</div>}
                      </th>
                    </>
                  )}

                  <th className={`border ${themeStyles.borderTable} py-1 px-1.5 w-14`}>
                    {isArabic && <div className="font-amiri text-xs leading-none">بالرقم</div>}
                    {!isFullArab && <div>Angka</div>}
                  </th>

                  {config.showTerbilang && !isFullArab && (
                    <th className={`border ${themeStyles.borderTable} py-1 px-2`}>
                      <div>Huruf / Terbilang</div>
                    </th>
                  )}

                  {config.showTerbilang && isArabic && (
                    <th className={`border ${themeStyles.borderTable} py-1 px-2`}>
                      <div className="font-amiri text-xs leading-none">بالحروف</div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {gradeRows.map((row, idx) => {
                  const arabMapel = getMapelArabicName(row.mapel, config.customMapelArab);
                  const pred = row.hasGrade
                    ? getPredikatBilingual(row.akhir)
                    : { indo: '-', arab: '-', letter: '-' };

                  return (
                    <tr
                      key={row.mapel.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className={`border ${themeStyles.borderTable} py-1 px-1.5 text-center font-semibold`}>
                        {isFullArab
                          ? toArabicDigits(idx + 1)
                          : isArabic
                          ? `${idx + 1} / ${toArabicDigits(idx + 1)}`
                          : idx + 1}
                      </td>

                      <td className={`border ${themeStyles.borderTable} py-1 px-2.5`}>
                        <div className="flex items-center justify-between gap-2">
                          {!isFullArab && (
                            <span className="font-bold text-slate-900">{row.mapel.nama}</span>
                          )}
                          {isArabic && (
                            <span
                              className="font-amiri text-sm font-bold text-slate-900"
                              dir="rtl"
                            >
                              {arabMapel}
                            </span>
                          )}
                        </div>
                      </td>

                      {config.showKKM && (
                        <td className={`border ${themeStyles.borderTable} py-1 px-1.5 text-center font-medium text-slate-700`}>
                          {isFullArab
                            ? toArabicDigits(row.mapel.kkm)
                            : isArabic
                            ? `${row.mapel.kkm} (${toArabicDigits(row.mapel.kkm)})`
                            : row.mapel.kkm}
                        </td>
                      )}

                      {config.showDetailNilai && (
                        <>
                          <td className={`border ${themeStyles.borderTable} py-1 px-1 text-center`}>
                            {row.hasGrade
                              ? isFullArab
                                ? toArabicDigits(row.harian)
                                : row.harian
                              : '-'}
                          </td>
                          <td className={`border ${themeStyles.borderTable} py-1 px-1 text-center`}>
                            {row.hasGrade
                              ? isFullArab
                                ? toArabicDigits(row.lisan)
                                : row.lisan
                              : '-'}
                          </td>
                          <td className={`border ${themeStyles.borderTable} py-1 px-1 text-center`}>
                            {row.hasGrade
                              ? isFullArab
                                ? toArabicDigits(row.tulis)
                                : row.tulis
                              : '-'}
                          </td>
                        </>
                      )}

                      <td className={`border ${themeStyles.borderTable} py-1 px-1.5 text-center font-extrabold text-slate-950 bg-slate-50/60`}>
                        {isLiveEditMode && onQuickUpdateGrade ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.hasGrade ? row.akhir : 80}
                            onChange={(e) =>
                              onQuickUpdateGrade(santri, row.mapel, Number(e.target.value))
                            }
                            className="w-12 px-1 py-0.5 text-center font-extrabold border border-emerald-500 rounded bg-amber-50 text-slate-950"
                          />
                        ) : row.hasGrade ? (
                          <span>
                            {!isFullArab && row.akhir}
                            {isArabic && !isFullArab && ' / '}
                            {isArabic && (
                              <span className="font-amiri text-sm">
                                {toArabicDigits(row.akhir)}
                              </span>
                            )}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {config.showTerbilang && !isFullArab && (
                        <td className={`border ${themeStyles.borderTable} py-1 px-2 text-[10px] italic font-medium text-slate-800`}>
                          {row.hasGrade ? numberToTerbilangIndo(row.akhir) : '-'}
                        </td>
                      )}

                      {config.showTerbilang && isArabic && (
                        <td
                          className={`border ${themeStyles.borderTable} py-1 px-2 font-amiri text-xs font-bold text-slate-900 text-right`}
                          dir="rtl"
                        >
                          {row.hasGrade ? numberToTerbilangArab(row.akhir) : '-'}
                        </td>
                      )}

                      {config.showPredikat && (
                        <td className={`border ${themeStyles.borderTable} py-1 px-2 text-center font-bold`}>
                          {row.hasGrade ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {!isFullArab && <span className="text-[10px]">{pred.indo}</span>}
                              {isArabic && (
                                <span className="font-amiri text-xs font-bold">{pred.arab}</span>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* SUMMARY ROW 1: JUMLAH NILAI */}
                <tr className={`${themeStyles.summaryBg} font-extrabold`}>
                  <td
                    colSpan={2 + (config.showKKM ? 1 : 0) + (config.showDetailNilai ? 3 : 0)}
                    className={`border ${themeStyles.borderTable} py-1.5 px-3`}
                  >
                    <div className="flex items-center justify-between">
                      {!isFullArab && <span>JUMLAH NILAI SELURUHNYA</span>}
                      {isArabic && (
                        <span className="font-amiri text-sm" dir="rtl">
                          المجموع الكلي للدرجات
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`border ${themeStyles.borderTable} py-1.5 px-1.5 text-center text-xs`}>
                    {gradedRows.length > 0 ? (
                      <>
                        {!isFullArab && totalAkhir}
                        {isArabic && !isFullArab && ' / '}
                        {isArabic && (
                          <span className="font-amiri text-sm">{toArabicDigits(totalAkhir)}</span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  {config.showTerbilang && !isFullArab && (
                    <td className={`border ${themeStyles.borderTable} py-1.5 px-2 text-[10px] italic`}>
                      {gradedRows.length > 0 ? numberToTerbilangIndo(totalAkhir) : '-'}
                    </td>
                  )}
                  {config.showTerbilang && isArabic && (
                    <td
                      className={`border ${themeStyles.borderTable} py-1.5 px-2 font-amiri text-xs text-right`}
                      dir="rtl"
                    >
                      {gradedRows.length > 0 ? numberToTerbilangArab(totalAkhir) : '-'}
                    </td>
                  )}
                  {config.showPredikat && (
                    <td className={`border ${themeStyles.borderTable} py-1.5 px-2 text-center text-[10px]`}>
                      {gradedRows.length} Mapel
                    </td>
                  )}
                </tr>

                {/* SUMMARY ROW 2: RATA-RATA NILAI */}
                <tr className={`${themeStyles.summaryBg} font-extrabold`}>
                  <td
                    colSpan={2 + (config.showKKM ? 1 : 0) + (config.showDetailNilai ? 3 : 0)}
                    className={`border ${themeStyles.borderTable} py-1.5 px-3`}
                  >
                    <div className="flex items-center justify-between">
                      {!isFullArab && <span>NILAI RATA-RATA (MU&apos;ADDAL)</span>}
                      {isArabic && (
                        <span className="font-amiri text-sm" dir="rtl">
                          المعدل العام
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`border ${themeStyles.borderTable} py-1.5 px-1.5 text-center text-xs`}>
                    {gradedRows.length > 0 ? (
                      <>
                        {!isFullArab && avgAkhir}
                        {isArabic && !isFullArab && ' / '}
                        {isArabic && (
                          <span className="font-amiri text-sm">
                            {toArabicDigits(Math.round(avgAkhir))}
                          </span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  {config.showTerbilang && !isFullArab && (
                    <td className={`border ${themeStyles.borderTable} py-1.5 px-2 text-[10px] italic`}>
                      {gradedRows.length > 0 ? numberToTerbilangIndo(Math.round(avgAkhir)) : '-'}
                    </td>
                  )}
                  {config.showTerbilang && isArabic && (
                    <td
                      className={`border ${themeStyles.borderTable} py-1.5 px-2 font-amiri text-xs text-right`}
                      dir="rtl"
                    >
                      {gradedRows.length > 0 ? numberToTerbilangArab(Math.round(avgAkhir)) : '-'}
                    </td>
                  )}
                  {config.showPredikat && (
                    <td className={`border ${themeStyles.borderTable} py-1.5 px-2 text-center`}>
                      <span className="text-[10px]">{overallPred.indo}</span>
                      {isArabic && (
                        <span className="font-amiri text-xs ml-1">({overallPred.arab})</span>
                      )}
                    </td>
                  )}
                </tr>

                {/* SUMMARY ROW 3: PERINGKAT KELAS */}
                {config.showRanking && (
                  <tr className={`${themeStyles.summaryBg} font-extrabold`}>
                    <td
                      colSpan={2 + (config.showKKM ? 1 : 0) + (config.showDetailNilai ? 3 : 0)}
                      className={`border ${themeStyles.borderTable} py-1.5 px-3`}
                    >
                      <div className="flex items-center justify-between">
                        {!isFullArab && <span>PERINGKAT KELAS (RANKING)</span>}
                        {isArabic && (
                          <span className="font-amiri text-sm" dir="rtl">
                            الترتيب في الفصل
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      colSpan={
                        1 +
                        (config.showTerbilang ? (isArabic && !isFullArab ? 2 : 1) : 0) +
                        (config.showPredikat ? 1 : 0)
                      }
                      className={`border ${themeStyles.borderTable} py-1.5 px-3`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Peringkat <strong>{rank}</strong> dari <strong>{totalSantriInClass}</strong> Santri
                        </span>
                        {isArabic && (
                          <span className="font-amiri text-sm font-bold" dir="rtl">
                            الترتيب: {getRankArabic(rank)} من {toArabicDigits(totalSantriInClass)} طلاب
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case 'kepribadian': {
        if (!config.showSikapAbsensi) return null;
        const kepLayout = config.kepribadianLayout || '2col';
        const items: Array<{
          no: number;
          key: keyof typeof extra;
          label: string;
          arab: string;
          val: string;
        }> = [
          { no: 1, key: 'akhlaq', label: 'AKHLAQ', arab: 'الأخلاق', val: extra.akhlaq },
          { no: 2, key: 'kebersihan', label: 'KEBERSIHAN', arab: 'النظافة', val: extra.kebersihan },
          { no: 3, key: 'ibadah', label: 'IBADAH', arab: 'العبادة', val: extra.ibadah },
          { no: 4, key: 'kesungguhan', label: 'KESUNGGUHAN', arab: 'الجد والاجتهاد', val: extra.kesungguhan },
          { no: 5, key: 'disiplinDiri', label: 'DISIPLIN DIRI', arab: 'الانضباط الذاتي', val: extra.disiplinDiri },
          { no: 6, key: 'ketaatan', label: 'KETAATAN', arab: 'الطاعة والامتثال', val: extra.ketaatan },
        ];

        const renderValueCell = (item: typeof items[number]) => {
          if (isLiveEditMode && onUpdateConfig) {
            return (
              <input
                type="text"
                value={item.val}
                onChange={(e) => handleUpdateKepribadianInline(item.key, e.target.value)}
                className="w-16 px-1 py-0.5 text-center font-extrabold border border-emerald-500 rounded bg-amber-50 text-slate-950"
              />
            );
          }
          return item.val;
        };

        return (
          <div key="kepribadian" className={gapClass}>
            {renderSectionControlBar(
              'kepribadian',
              onUpdateConfig && (
                <div className="flex items-center gap-1 mr-1">
                  <span className="text-slate-600 font-semibold">Bentuk Tabel:</span>
                  {(
                    [
                      { id: '2col', label: '2 Kolom' },
                      { id: '1col', label: '1 Kolom' },
                      { id: 'horizontal', label: 'Horizontal' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({ ...config, kepribadianLayout: opt.id })
                      }
                      className={`px-2 py-0.5 rounded border font-bold cursor-pointer ${
                        kepLayout === opt.id
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )
            )}

            <div
              className={`text-[10px] border ${themeStyles.borderTable}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div
                className={`${themeStyles.subHeaderBg} border-b ${themeStyles.borderTable} py-1 px-2.5 font-bold flex items-center justify-between`}
              >
                <span>NILAI KEPRIBADIAN SANTRI</span>
                {isArabic && <span className="font-amiri text-xs">تقييم السلوك والمواظبة</span>}
              </div>

              {kepLayout === 'horizontal' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className={`${themeStyles.subHeaderBg} border-b ${themeStyles.borderTable}`}>
                        {items.map((it) => (
                          <th
                            key={it.no}
                            className={`py-1 px-2 text-center border-r last:border-r-0 ${themeStyles.borderTable}`}
                          >
                            <div>
                              {it.no}. {it.label}
                            </div>
                            {isArabic && (
                              <div className="font-amiri text-xs leading-none">{it.arab}</div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {items.map((it) => (
                          <td
                            key={it.no}
                            className={`py-1.5 px-2 text-center font-extrabold border-r last:border-r-0 ${themeStyles.borderTable}`}
                          >
                            {renderValueCell(it)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : kepLayout === '1col' ? (
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className={`${themeStyles.subHeaderBg} border-b ${themeStyles.borderTable}`}>
                      <th className={`py-1 px-2 text-center w-10 border-r ${themeStyles.borderTable}`}>
                        NO
                      </th>
                      <th className={`py-1 px-2.5 text-left border-r ${themeStyles.borderTable}`}>
                        ASPEK KEPRIBADIAN
                      </th>
                      <th className="py-1 px-2.5 text-center w-28">NILAI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr
                        key={it.no}
                        className={
                          idx < items.length - 1 ? `border-b ${themeStyles.borderTable}` : ''
                        }
                      >
                        <td
                          className={`py-1 px-2 text-center font-semibold border-r ${themeStyles.borderTable}`}
                        >
                          {it.no}
                        </td>
                        <td
                          className={`py-1 px-2.5 font-medium border-r ${themeStyles.borderTable}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{it.label}</span>
                            {isArabic && <span className="font-amiri text-xs">{it.arab}</span>}
                          </div>
                        </td>
                        <td className="py-1 px-2.5 font-extrabold text-center">
                          {renderValueCell(it)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <table
                    className={`w-full text-[10px] border-collapse sm:border-r ${themeStyles.borderTable}`}
                  >
                    <thead>
                      <tr className={`${themeStyles.subHeaderBg} border-b ${themeStyles.borderTable}`}>
                        <th className={`py-1 px-2 text-center w-8 border-r ${themeStyles.borderTable}`}>
                          NO
                        </th>
                        <th className={`py-1 px-2.5 text-left border-r ${themeStyles.borderTable}`}>
                          ASPEK KEPRIBADIAN
                        </th>
                        <th className="py-1 px-2.5 text-center w-24">NILAI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(0, 3).map((it, idx) => (
                        <tr
                          key={it.no}
                          className={idx < 2 ? `border-b ${themeStyles.borderTable}` : ''}
                        >
                          <td
                            className={`py-1 px-2 text-center font-semibold border-r ${themeStyles.borderTable}`}
                          >
                            {it.no}
                          </td>
                          <td
                            className={`py-1 px-2.5 font-medium border-r ${themeStyles.borderTable}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{it.label}</span>
                              {isArabic && <span className="font-amiri text-xs">{it.arab}</span>}
                            </div>
                          </td>
                          <td className="py-1 px-2.5 font-extrabold text-center">
                            {renderValueCell(it)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <table className="w-full text-[10px] border-collapse border-t sm:border-t-0">
                    <thead>
                      <tr className={`${themeStyles.subHeaderBg} border-b ${themeStyles.borderTable}`}>
                        <th className={`py-1 px-2 text-center w-8 border-r ${themeStyles.borderTable}`}>
                          NO
                        </th>
                        <th className={`py-1 px-2.5 text-left border-r ${themeStyles.borderTable}`}>
                          ASPEK KEPRIBADIAN
                        </th>
                        <th className="py-1 px-2.5 text-center w-24">NILAI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(3, 6).map((it, idx) => (
                        <tr
                          key={it.no}
                          className={idx < 2 ? `border-b ${themeStyles.borderTable}` : ''}
                        >
                          <td
                            className={`py-1 px-2 text-center font-semibold border-r ${themeStyles.borderTable}`}
                          >
                            {it.no}
                          </td>
                          <td
                            className={`py-1 px-2.5 font-medium border-r ${themeStyles.borderTable}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{it.label}</span>
                              {isArabic && <span className="font-amiri text-xs">{it.arab}</span>}
                            </div>
                          </td>
                          <td className="py-1 px-2.5 font-extrabold text-center">
                            {renderValueCell(it)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'ttd': {
        const dateJustify =
          config.signatureAlign === 'left'
            ? 'justify-start'
            : config.signatureAlign === 'center'
            ? 'justify-center'
            : 'justify-end';

        const renderSigColumn = (role: RaportSignatureRole, colIdx: number) => {
          const swapButtons = isLiveEditMode && onUpdateConfig && (
            <div className="no-print flex items-center justify-center gap-1 mb-1">
              <button
                type="button"
                disabled={colIdx === 0}
                onClick={() => handleSwapSignature(colIdx, -1)}
                className="px-1.5 py-0.5 text-[9px] rounded bg-amber-100 hover:bg-amber-200 disabled:opacity-30 border border-amber-300 font-bold cursor-pointer"
                title="Geser kolom TTD ke kiri"
              >
                ← Kiri
              </button>
              <span className="text-[9px] font-bold text-slate-500">
                {SIG_ROLE_LABELS[role]}
              </span>
              <button
                type="button"
                disabled={colIdx === 2}
                onClick={() => handleSwapSignature(colIdx, 1)}
                className="px-1.5 py-0.5 text-[9px] rounded bg-amber-100 hover:bg-amber-200 disabled:opacity-30 border border-amber-300 font-bold cursor-pointer"
                title="Geser kolom TTD ke kanan"
              >
                Kanan →
              </button>
            </div>
          );

          if (role === 'orang_tua') {
            return (
              <div key="orang_tua">
                {swapButtons}
                {isArabic && (
                  <p className="font-amiri text-xs font-bold leading-tight">
                    {config.orangTuaLabelArab}
                  </p>
                )}
                <p className="font-bold text-slate-800 text-[10px] uppercase">
                  {config.orangTuaLabel}
                </p>
                <div className="h-14" />
                <p className="font-bold text-slate-900 border-b border-slate-800 pb-0.5 inline-block min-w-[130px]">
                  &nbsp;
                </p>
              </div>
            );
          }

          if (role === 'wali_kelas') {
            return (
              <div key="wali_kelas">
                {swapButtons}
                {isArabic && (
                  <p className="font-amiri text-xs font-bold leading-tight">
                    {config.waliKelasJabatanArab}
                  </p>
                )}
                <p className="font-bold text-slate-800 text-[10px] uppercase">
                  {config.waliKelasJabatan}
                </p>
                <div className="h-14" />
                <p className="font-extrabold text-slate-950 border-b border-slate-800 pb-0.5 inline-block min-w-[140px]">
                  {waliName}
                </p>
              </div>
            );
          }

          return (
            <div key="pimpinan">
              {swapButtons}
              {isArabic && (
                <p className="font-amiri text-xs font-bold leading-tight">
                  {config.pejabatJabatanArab}
                </p>
              )}
              <p className="font-bold text-slate-800 text-[10px] uppercase">
                {config.pejabatJabatan}
              </p>
              <div className="h-14" />
              <p className="font-extrabold text-slate-950 border-b border-slate-800 pb-0.5 inline-block min-w-[150px]">
                {config.pejabatName}
              </p>
              {isArabic && (
                <p className="font-amiri text-xs text-slate-700 mt-0.5">
                  {config.pejabatNameArab}
                </p>
              )}
            </div>
          );
        };

        return (
          <div key="ttd" className="pt-1 text-[11px]">
            {renderSectionControlBar(
              'ttd',
              onUpdateConfig && (
                <div className="flex items-center gap-1 mr-1">
                  <span className="text-slate-600 font-semibold">Posisi Tanggal:</span>
                  {(['left', 'center', 'right'] as const).map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, signatureAlign: al })}
                      className={`px-1.5 py-0.5 rounded border font-bold cursor-pointer ${
                        (config.signatureAlign || 'right') === al
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {al === 'left' ? 'Kiri' : al === 'center' ? 'Tengah' : 'Kanan'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        ...config,
                        signatureOrder: [
                          signatureOrder[2],
                          signatureOrder[1],
                          signatureOrder[0],
                        ],
                      })
                    }
                    className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                    title="Balik urutan kiri-kanan tanda tangan"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Balik Urutan TTD</span>
                  </button>
                </div>
              )
            )}

            <div
              className={`flex items-center ${dateJustify} gap-2 mb-2 text-[10px] font-semibold text-slate-800`}
            >
              <span>
                Ditetapkan di: <strong>{config.lokasiCetak}</strong>, {config.tanggalCetak}
              </span>
              {isArabic && (
                <span className="font-amiri text-xs" dir="rtl">
                  • تحريرا في {config.lokasiCetakArab}، {config.tanggalCetakArab}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center pt-1">
              {signatureOrder.map((role, idx) => renderSigColumn(role, idx))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`raport-sheet-page bg-white text-slate-950 mx-auto max-w-[210mm] p-5 sm:p-7 shadow-xl rounded-none sm:rounded-lg ${
        config.fontFamily
      } ${
        config.showBorderFrame
          ? `border-4 border-double ${themeStyles.borderOuter}`
          : 'border border-slate-300'
      }`}
    >
      {sectionOrder.map((secId) => renderSection(secId))}
    </div>
  );
};
