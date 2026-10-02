import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirebaseConnection } from '../lib/firebase';
import {
  AcademicTerm,
  Asatidz,
  JadwalUjianItem,
  Kelas,
  MataPelajaran,
  NilaiSantri,
  PanitiaUjian,
  Pengumuman,
  PesantrenProfile,
  Petinggi,
  RolePermissions,
  Santri,
  TugasMengajarItem,
  AdminUser,
} from '../types';
import {
  INITIAL_TERMS,
  INITIAL_PROFILE,
  INITIAL_PETINGGI,
  INITIAL_PANITIA,
  INITIAL_MAPEL,
  INITIAL_KELAS,
  INITIAL_ASATIDZ,
  INITIAL_SANTRI,
  INITIAL_NILAI,
  INITIAL_JADWAL,
  INITIAL_PENGUMUMAN,
  INITIAL_PERMISSIONS,
  INITIAL_TUGAS_MENGAJAR,
  INITIAL_ADMIN_USERS,
} from '../data/initialData';

export interface AppSettingsData {
  adminPassword: string;
  permissions: { admin: RolePermissions; asatidz: RolePermissions };
  updatedAt?: string;
}

// Safe Chunked Batch Executor (Maximum 350 ops per batch)
async function executeBatchOperations(
  operations: Array<{ type: 'set' | 'delete'; path: string; docId: string; data?: unknown }>
) {
  const CHUNK_SIZE = 350;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      const docRef = doc(db, op.path, op.docId);
      if (op.type === 'delete') {
        batch.delete(docRef);
      } else if (op.data !== undefined) {
        const cleanData = JSON.parse(JSON.stringify(op.data)) as Record<string, unknown>;
        batch.set(docRef, cleanData);
      }
    }
    await batch.commit();
  }
}

// Differential Collection Sync: Only deletes removed items and updates existing/new items
async function syncCollectionDiff<T extends { id: string }>(
  collectionName: string,
  newItems: T[]
) {
  try {
    const existingSnap = await getDocs(collection(db, collectionName));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const newIds = new Set(newItems.map((item) => item.id));

    const ops: Array<{ type: 'set' | 'delete'; path: string; docId: string; data?: unknown }> = [];

    // Delete documents that are no longer in newItems
    existingSnap.docs.forEach((d) => {
      if (!newIds.has(d.id)) {
        ops.push({ type: 'delete', path: collectionName, docId: d.id });
      }
    });

    // Set or Update all items in newItems
    newItems.forEach((item) => {
      ops.push({ type: 'set', path: collectionName, docId: item.id, data: item });
    });

    if (ops.length > 0) {
      await executeBatchOperations(ops);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

// Check & Seed Initial Data ONLY ONCE on database first initialization
export async function seedInitialDataIfEmpty() {
  testFirebaseConnection();
  try {
    // Check bootstrap marker
    const bootstrapRef = doc(db, 'system', 'bootstrap');
    const bootstrapSnap = await getDoc(bootstrapRef);

    if (bootstrapSnap.exists() && bootstrapSnap.data()?.initialized) {
      // Ensure v2 collections (tugasMengajar & adminUsers) were also initialized after rules deployment
      if (!bootstrapSnap.data()?.v2CollectionsInitialized) {
        const tugasMengajarSnap = await getDocs(collection(db, 'tugasMengajar'));
        if (tugasMengajarSnap.empty) {
          await syncCollectionDiff('tugasMengajar', INITIAL_TUGAS_MENGAJAR);
        }
        const adminUsersSnap = await getDocs(collection(db, 'adminUsers'));
        if (adminUsersSnap.empty) {
          await syncCollectionDiff('adminUsers', INITIAL_ADMIN_USERS);
        }
        await setDoc(
          bootstrapRef,
          { v2CollectionsInitialized: true, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
      // System was already bootstrapped. DO NOT re-seed, to preserve user deletions and customizations!
      return;
    }

    console.log('Bootstrapping initial database state...');

    const profileSnap = await getDocs(collection(db, 'pesantrenProfile'));
    if (profileSnap.empty) {
      await setDoc(doc(db, 'pesantrenProfile', 'main'), INITIAL_PROFILE);
    }

    const settingsSnap = await getDocs(collection(db, 'settings'));
    if (settingsSnap.empty) {
      const initialSettings: AppSettingsData = {
        adminPassword: 'admin123',
        permissions: INITIAL_PERMISSIONS,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'settings', 'security'), initialSettings);
    }

    const termsSnap = await getDocs(collection(db, 'academicTerms'));
    if (termsSnap.empty) {
      await syncCollectionDiff('academicTerms', INITIAL_TERMS);
    }

    const petinggiSnap = await getDocs(collection(db, 'petinggi'));
    if (petinggiSnap.empty) {
      await syncCollectionDiff('petinggi', INITIAL_PETINGGI);
    }

    const panitiaSnap = await getDocs(collection(db, 'panitiaUjian'));
    if (panitiaSnap.empty) {
      await syncCollectionDiff('panitiaUjian', INITIAL_PANITIA);
    }

    const mapelSnap = await getDocs(collection(db, 'mataPelajaran'));
    if (mapelSnap.empty) {
      await syncCollectionDiff('mataPelajaran', INITIAL_MAPEL);
    }

    const kelasSnap = await getDocs(collection(db, 'kelas'));
    if (kelasSnap.empty) {
      await syncCollectionDiff('kelas', INITIAL_KELAS);
    }

    const santriSnap = await getDocs(collection(db, 'santri'));
    if (santriSnap.empty) {
      await syncCollectionDiff('santri', INITIAL_SANTRI);
    }

    const asatidzSnap = await getDocs(collection(db, 'asatidz'));
    if (asatidzSnap.empty) {
      await syncCollectionDiff('asatidz', INITIAL_ASATIDZ);
    }

    const nilaiSnap = await getDocs(collection(db, 'nilaiSantri'));
    if (nilaiSnap.empty) {
      await syncCollectionDiff('nilaiSantri', INITIAL_NILAI);
    }

    const jadwalSnap = await getDocs(collection(db, 'jadwalUjian'));
    if (jadwalSnap.empty) {
      await syncCollectionDiff('jadwalUjian', INITIAL_JADWAL);
    }

    const pengumumanSnap = await getDocs(collection(db, 'pengumuman'));
    if (pengumumanSnap.empty) {
      await syncCollectionDiff('pengumuman', INITIAL_PENGUMUMAN);
    }

    const tugasMengajarSnap = await getDocs(collection(db, 'tugasMengajar'));
    if (tugasMengajarSnap.empty) {
      await syncCollectionDiff('tugasMengajar', INITIAL_TUGAS_MENGAJAR);
    }

    const adminUsersSnap = await getDocs(collection(db, 'adminUsers'));
    if (adminUsersSnap.empty) {
      await syncCollectionDiff('adminUsers', INITIAL_ADMIN_USERS);
    }

    // Set bootstrap marker so subsequent reloads never overwrite or re-seed
    await setDoc(bootstrapRef, {
      initialized: true,
      v2CollectionsInitialized: true,
      bootstrappedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Initial seed info or already initialized:', error);
  }
}

// ----------------------------------------------------
// Realtime Subscriptions (onSnapshot)
// ----------------------------------------------------

export function subscribePesantrenProfile(callback: (profile: PesantrenProfile) => void) {
  const path = 'pesantrenProfile/main';
  return onSnapshot(
    doc(db, 'pesantrenProfile', 'main'),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as PesantrenProfile);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

export function subscribeAppSettings(callback: (settings: AppSettingsData) => void) {
  const path = 'settings/security';
  return onSnapshot(
    doc(db, 'settings', 'security'),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AppSettingsData);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

export function subscribeAcademicTerms(callback: (terms: AcademicTerm[]) => void) {
  const path = 'academicTerms';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: AcademicTerm[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as AcademicTerm));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribePetinggi(callback: (petinggi: Petinggi[]) => void) {
  const path = 'petinggi';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: Petinggi[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as Petinggi));
      // Sort by urutan
      items.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribePanitiaUjian(callback: (panitia: PanitiaUjian[]) => void) {
  const path = 'panitiaUjian';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: PanitiaUjian[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as PanitiaUjian));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeMataPelajaran(callback: (mapel: MataPelajaran[]) => void) {
  const path = 'mataPelajaran';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: MataPelajaran[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as MataPelajaran));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeKelas(callback: (kelas: Kelas[]) => void) {
  const path = 'kelas';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: Kelas[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as Kelas));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeSantri(callback: (santri: Santri[]) => void) {
  const path = 'santri';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: Santri[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as Santri));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeAsatidz(callback: (asatidz: Asatidz[]) => void) {
  const path = 'asatidz';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: Asatidz[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as Asatidz));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeNilaiSantri(callback: (nilai: NilaiSantri[]) => void) {
  const path = 'nilaiSantri';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: NilaiSantri[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as NilaiSantri));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeJadwalUjian(callback: (jadwal: JadwalUjianItem[]) => void) {
  const path = 'jadwalUjian';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: JadwalUjianItem[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as JadwalUjianItem));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribePengumuman(callback: (pengumuman: Pengumuman[]) => void) {
  const path = 'pengumuman';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: Pengumuman[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as Pengumuman));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeTugasMengajar(callback: (items: TugasMengajarItem[]) => void) {
  const path = 'tugasMengajar';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: TugasMengajarItem[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as TugasMengajarItem));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeAdminUsers(callback: (items: AdminUser[]) => void) {
  const path = 'adminUsers';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: AdminUser[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as AdminUser));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

// ----------------------------------------------------
// Mutation Helpers (Saving to Cloud)
// ----------------------------------------------------

export async function savePesantrenProfileToCloud(profile: PesantrenProfile) {
  const path = 'pesantrenProfile/main';
  try {
    await setDoc(doc(db, 'pesantrenProfile', 'main'), profile);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAppSettingsToCloud(settings: Partial<AppSettingsData>) {
  const path = 'settings/security';
  try {
    await setDoc(
      doc(db, 'settings', 'security'),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAcademicTermsToCloud(terms: AcademicTerm[]) {
  await syncCollectionDiff('academicTerms', terms);
}

export async function savePetinggiListToCloud(petinggiList: Petinggi[]) {
  await syncCollectionDiff('petinggi', petinggiList);
}

export async function savePanitiaListToCloud(panitiaList: PanitiaUjian[]) {
  await syncCollectionDiff('panitiaUjian', panitiaList);
}

export async function saveMapelListToCloud(mapelList: MataPelajaran[]) {
  await syncCollectionDiff('mataPelajaran', mapelList);
}

export async function saveKelasListToCloud(kelasList: Kelas[]) {
  await syncCollectionDiff('kelas', kelasList);
}

export async function saveSantriListToCloud(santriList: Santri[]) {
  await syncCollectionDiff('santri', santriList);
}

export async function saveAsatidzListToCloud(asatidzList: Asatidz[]) {
  await syncCollectionDiff('asatidz', asatidzList);
}

export async function saveNilaiBatchToCloud(nilaiBatch: NilaiSantri[]) {
  const path = 'nilaiSantri';
  try {
    const ops = nilaiBatch.map((n) => ({
      type: 'set' as const,
      path,
      docId: n.id,
      data: n,
    }));
    await executeBatchOperations(ops);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveNilaiListToCloud(nilaiList: NilaiSantri[]) {
  await syncCollectionDiff('nilaiSantri', nilaiList);
}

export async function deleteNilaiFromCloud(id: string) {
  const path = 'nilaiSantri';
  try {
    await deleteDoc(doc(db, path, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveJadwalListToCloud(jadwalList: JadwalUjianItem[]) {
  await syncCollectionDiff('jadwalUjian', jadwalList);
}

export async function savePengumumanListToCloud(pengumumanList: Pengumuman[]) {
  await syncCollectionDiff('pengumuman', pengumumanList);
}

export async function saveTugasMengajarToCloud(tugasList: TugasMengajarItem[]) {
  await syncCollectionDiff('tugasMengajar', tugasList);
}

export async function saveAdminUsersToCloud(adminUsersList: AdminUser[]) {
  await syncCollectionDiff('adminUsers', adminUsersList);
}

