import {
  collection,
  doc,
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
} from '../data/initialData';

export interface AppSettingsData {
  adminPassword: string;
  permissions: { admin: RolePermissions; asatidz: RolePermissions };
  updatedAt?: string;
}

// Check & Seed Initial Data if database is freshly provisioned
export async function seedInitialDataIfEmpty() {
  testFirebaseConnection();
  try {
    const profileSnap = await getDocs(collection(db, 'pesantrenProfile'));
    if (profileSnap.empty) {
      console.log('Seeding initial pesantren profile to Firestore...');
      await setDoc(doc(db, 'pesantrenProfile', 'main'), INITIAL_PROFILE);
    }

    const settingsSnap = await getDocs(collection(db, 'settings'));
    if (settingsSnap.empty) {
      console.log('Seeding initial app settings & security to Firestore...');
      const initialSettings: AppSettingsData = {
        adminPassword: 'admin123',
        permissions: INITIAL_PERMISSIONS,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'settings', 'security'), initialSettings);
    }

    const termsSnap = await getDocs(collection(db, 'academicTerms'));
    if (termsSnap.empty) {
      console.log('Seeding initial academic terms...');
      const batch = writeBatch(db);
      for (const term of INITIAL_TERMS) {
        batch.set(doc(db, 'academicTerms', term.id), term);
      }
      await batch.commit();
    }

    const petinggiSnap = await getDocs(collection(db, 'petinggi'));
    if (petinggiSnap.empty) {
      console.log('Seeding initial petinggi...');
      const batch = writeBatch(db);
      for (const p of INITIAL_PETINGGI) {
        batch.set(doc(db, 'petinggi', p.id), p);
      }
      await batch.commit();
    }

    const panitiaSnap = await getDocs(collection(db, 'panitiaUjian'));
    if (panitiaSnap.empty) {
      console.log('Seeding initial panitia...');
      const batch = writeBatch(db);
      for (const pan of INITIAL_PANITIA) {
        batch.set(doc(db, 'panitiaUjian', pan.id), pan);
      }
      await batch.commit();
    }

    const mapelSnap = await getDocs(collection(db, 'mataPelajaran'));
    if (mapelSnap.empty) {
      console.log('Seeding initial mata pelajaran...');
      const batch = writeBatch(db);
      for (const m of INITIAL_MAPEL) {
        batch.set(doc(db, 'mataPelajaran', m.id), m);
      }
      await batch.commit();
    }

    const kelasSnap = await getDocs(collection(db, 'kelas'));
    if (kelasSnap.empty) {
      console.log('Seeding initial kelas...');
      const batch = writeBatch(db);
      for (const k of INITIAL_KELAS) {
        batch.set(doc(db, 'kelas', k.id), k);
      }
      await batch.commit();
    }

    const santriSnap = await getDocs(collection(db, 'santri'));
    if (santriSnap.empty) {
      console.log('Seeding initial santri...');
      const batch = writeBatch(db);
      for (const s of INITIAL_SANTRI) {
        batch.set(doc(db, 'santri', s.id), s);
      }
      await batch.commit();
    }

    const asatidzSnap = await getDocs(collection(db, 'asatidz'));
    if (asatidzSnap.empty) {
      console.log('Seeding initial asatidz...');
      const batch = writeBatch(db);
      for (const a of INITIAL_ASATIDZ) {
        batch.set(doc(db, 'asatidz', a.id), a);
      }
      await batch.commit();
    }

    const nilaiSnap = await getDocs(collection(db, 'nilaiSantri'));
    if (nilaiSnap.empty) {
      console.log('Seeding initial nilai santri...');
      const batch = writeBatch(db);
      for (const n of INITIAL_NILAI) {
        batch.set(doc(db, 'nilaiSantri', n.id), n);
      }
      await batch.commit();
    }

    const jadwalSnap = await getDocs(collection(db, 'jadwalUjian'));
    if (jadwalSnap.empty) {
      console.log('Seeding initial jadwal ujian...');
      const batch = writeBatch(db);
      for (const j of INITIAL_JADWAL) {
        batch.set(doc(db, 'jadwalUjian', j.id), j);
      }
      await batch.commit();
    }

    const pengumumanSnap = await getDocs(collection(db, 'pengumuman'));
    if (pengumumanSnap.empty) {
      console.log('Seeding initial pengumuman...');
      const batch = writeBatch(db);
      for (const p of INITIAL_PENGUMUMAN) {
        batch.set(doc(db, 'pengumuman', p.id), p);
      }
      await batch.commit();
    }
  } catch (error) {
    console.warn('Initial seed error or already initialized:', error);
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
      if (items.length > 0) callback(items);
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
    await setDoc(doc(db, 'settings', 'security'), {
      ...settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAcademicTermsToCloud(terms: AcademicTerm[]) {
  const path = 'academicTerms';
  try {
    const batch = writeBatch(db);
    for (const term of terms) {
      batch.set(doc(db, 'academicTerms', term.id), term);
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePetinggiListToCloud(petinggiList: Petinggi[]) {
  const path = 'petinggi';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    petinggiList.forEach((p) => batch.set(doc(db, path, p.id), p));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePanitiaListToCloud(panitiaList: PanitiaUjian[]) {
  const path = 'panitiaUjian';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    panitiaList.forEach((p) => batch.set(doc(db, path, p.id), p));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveMapelListToCloud(mapelList: MataPelajaran[]) {
  const path = 'mataPelajaran';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    mapelList.forEach((m) => batch.set(doc(db, path, m.id), m));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveKelasListToCloud(kelasList: Kelas[]) {
  const path = 'kelas';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    kelasList.forEach((k) => batch.set(doc(db, path, k.id), k));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveSantriListToCloud(santriList: Santri[]) {
  const path = 'santri';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    santriList.forEach((s) => batch.set(doc(db, path, s.id), s));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAsatidzListToCloud(asatidzList: Asatidz[]) {
  const path = 'asatidz';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    asatidzList.forEach((a) => batch.set(doc(db, path, a.id), a));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveNilaiBatchToCloud(nilaiBatch: NilaiSantri[]) {
  const path = 'nilaiSantri';
  try {
    const batch = writeBatch(db);
    for (const n of nilaiBatch) {
      batch.set(doc(db, path, n.id), n);
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveJadwalListToCloud(jadwalList: JadwalUjianItem[]) {
  const path = 'jadwalUjian';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    jadwalList.forEach((j) => batch.set(doc(db, path, j.id), j));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePengumumanListToCloud(pengumumanList: Pengumuman[]) {
  const path = 'pengumuman';
  try {
    const currentSnap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    currentSnap.forEach((d) => batch.delete(d.ref));
    pengumumanList.forEach((p) => batch.set(doc(db, path, p.id), p));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
