import { Asatidz, Kelas, MataPelajaran, Santri, TugasMengajarItem } from '../types';

/**
 * Checks if a Santri ID is one of the 21 hardcoded initial demo santri (snt-01 .. snt-21).
 */
export function isDummyInitialSantri(id: string): boolean {
  return /^snt-(0[1-9]|1[0-9]|2[01])$/.test((id || '').trim());
}

/**
 * Checks if a Santri is active (handles both 'Non-Aktif' and 'Nonaktif').
 */
export function isSantriActive(s: Santri): boolean {
  const st = (s.status || 'Aktif').trim().toLowerCase();
  return st !== 'non-aktif' && st !== 'nonaktif';
}

/**
 * Checks whether a Santri belongs to a given Kelas (by kelas.id or kelas.nama).
 */
export function doesSantriBelongToKelas(s: Santri, k: Kelas): boolean {
  if (!s || !k || !s.kelasId) return false;
  if (s.kelasId === k.id) return true;
  const sKls = s.kelasId.trim().toLowerCase();
  const kNama = (k.nama || '').trim().toLowerCase();
  return kNama !== '' && sKls === kNama;
}

/**
 * Returns all active Santri belonging to a specific Kelas.
 */
export function getSantriForKelas(k: Kelas | null | undefined, allSantri: Santri[]): Santri[] {
  if (!k) return [];
  return allSantri.filter((s) => isSantriActive(s) && doesSantriBelongToKelas(s, k));
}

/**
 * Returns all active Santri that belong to any existing Kelas in allKelas.
 * Guarantees 100% identical count between Dashboard and Data Santri.
 */
export function getAllActiveSantriInExistingKelas(
  allSantri: Santri[],
  allKelas: Kelas[]
): Santri[] {
  if (!allKelas || allKelas.length === 0) return [];
  return allSantri.filter(
    (s) => isSantriActive(s) && allKelas.some((k) => doesSantriBelongToKelas(s, k))
  );
}

/**
 * Checks if a TugasMengajarItem is assigned to a specific Asatidz (by ID, Nama, or NIP).
 */
export function doesTugasBelongToAsatidz(
  t: TugasMengajarItem,
  guru: Asatidz | null | undefined,
  allAsatidz: Asatidz[] = []
): boolean {
  if (!t || !guru) return false;
  const rawId = (t.asatidzId || '').trim();
  if (!rawId) return false;
  if (rawId === guru.id) return true;

  const rawLower = rawId.toLowerCase();
  const guruNamaLower = (guru.nama || '').trim().toLowerCase();
  const guruNipLower = (guru.nip || '').trim().toLowerCase();

  if (guruNamaLower && rawLower === guruNamaLower) return true;
  if (guruNipLower && guruNipLower !== '-' && rawLower === guruNipLower) return true;

  const matchedOwner = allAsatidz.find((a) => a.id === rawId);
  if (matchedOwner) {
    if (guruNamaLower && (matchedOwner.nama || '').trim().toLowerCase() === guruNamaLower) {
      return true;
    }
    if (
      guruNipLower &&
      guruNipLower !== '-' &&
      (matchedOwner.nip || '').trim().toLowerCase() === guruNipLower
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a TugasMengajarItem applies to a given Kelas.
 */
export function doesTugasMatchKelas(
  t: TugasMengajarItem,
  k: Kelas,
  allKelas: Kelas[] = []
): boolean {
  if (!t || !k) return false;
  const tTingkat = (t.tingkat || '').trim().toLowerCase();
  const kNama = (k.nama || '').trim().toLowerCase();
  const kTingkat = (k.tingkat || '').trim().toLowerCase();
  if (!tTingkat) return false;

  if (tTingkat === kNama || t.tingkat === k.id) return true;

  const matchesSpecificClassName = allKelas.some(
    (other) => (other.nama || '').trim().toLowerCase() === tTingkat
  );
  if (!matchesSpecificClassName && kTingkat && tTingkat === kTingkat) {
    return true;
  }
  return false;
}

/**
 * Checks if a NilaiSantri's mapelId matches a target Mapel ID or Nama (case-insensitive).
 */
export function doesGradeMatchMapel(
  gradeMapelId: string,
  targetMapelIdOrName: string,
  allMapel: MataPelajaran[] = []
): boolean {
  const g = (gradeMapelId || '').trim().toLowerCase();
  const t = (targetMapelIdOrName || '').trim().toLowerCase();
  if (!g || !t) return false;
  if (g === t) return true;

  const matchedInMaster = allMapel.find(
    (m) => m.id.trim().toLowerCase() === t || m.nama.trim().toLowerCase() === t
  );
  if (matchedInMaster) {
    return (
      g === matchedInMaster.id.trim().toLowerCase() ||
      g === matchedInMaster.nama.trim().toLowerCase()
    );
  }
  return false;
}
