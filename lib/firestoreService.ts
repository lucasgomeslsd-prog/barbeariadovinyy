import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { firestore, auth } from './firebase';
import {
  Appointment,
  BarberService,
  BarberProfessional,
  BarbershopConfig,
  AdminNotification,
} from '../types';

// ========================================================
// TRATAMENTO DE ERROS DO FIRESTORE (FIREBASE SKILL SPEC)
// ========================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (errMessage.toLowerCase().includes('missing or insufficient permissions')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

/**
 * Remove recursivamente campos 'undefined' para evitar que o Firestore
 * lance o erro "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (data instanceof Date) return data;
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

// Coleções Firestore
const APPOINTMENTS_COL = 'appointments';
const SERVICES_COL = 'services';
const PROFESSIONALS_COL = 'professionals';
const CONFIG_COL = 'config';
const NOTIFICATIONS_COL = 'notifications';

// ========================================================
// AGENDAMENTOS (APPOINTMENTS)
// ========================================================

export async function saveAppointmentToFirestore(appointment: Appointment): Promise<void> {
  const path = `${APPOINTMENTS_COL}/${appointment.id}`;
  try {
    const cleanData = sanitizeForFirestore(appointment);
    const docRef = doc(firestore, APPOINTMENTS_COL, appointment.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAppointmentInFirestore(
  id: string,
  partial: Partial<Appointment>
): Promise<void> {
  const path = `${APPOINTMENTS_COL}/${id}`;
  try {
    const cleanPartial = sanitizeForFirestore(partial);
    const docRef = doc(firestore, APPOINTMENTS_COL, id);
    await updateDoc(docRef, cleanPartial as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getAppointmentsFromFirestore(): Promise<Appointment[]> {
  try {
    const q = query(collection(firestore, APPOINTMENTS_COL));
    const snapshot = await getDocs(q);
    const list: Appointment[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Appointment);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, APPOINTMENTS_COL);
    return [];
  }
}

export function subscribeToAppointmentsFirestore(
  callback: (appointments: Appointment[]) => void
): () => void {
  try {
    const q = query(collection(firestore, APPOINTMENTS_COL));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Appointment[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Appointment);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, APPOINTMENTS_COL);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, APPOINTMENTS_COL);
    return () => {};
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<void> {
  const path = `${APPOINTMENTS_COL}/${id}`;
  try {
    const docRef = doc(firestore, APPOINTMENTS_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ========================================================
// CONFIGURAÇÕES DA BARBEARIA (CONFIG)
// ========================================================

const CONFIG_DOC_ID = 'main_config';

export async function saveConfigToFirestore(config: BarbershopConfig): Promise<void> {
  const path = `${CONFIG_COL}/${CONFIG_DOC_ID}`;
  try {
    const cleanConfig = sanitizeForFirestore(config);
    const docRef = doc(firestore, CONFIG_COL, CONFIG_DOC_ID);
    await setDoc(docRef, cleanConfig, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getConfigFromFirestore(): Promise<BarbershopConfig | null> {
  const path = `${CONFIG_COL}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(firestore, CONFIG_COL, CONFIG_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as BarbershopConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToConfigFirestore(
  callback: (config: BarbershopConfig) => void
): () => void {
  const path = `${CONFIG_COL}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(firestore, CONFIG_COL, CONFIG_DOC_ID);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as BarbershopConfig);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

// ========================================================
// SERVIÇOS (SERVICES)
// ========================================================

export async function saveServiceToFirestore(service: BarberService): Promise<void> {
  const path = `${SERVICES_COL}/${service.id}`;
  try {
    const cleanService = sanitizeForFirestore(service);
    const docRef = doc(firestore, SERVICES_COL, service.id);
    await setDoc(docRef, cleanService, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteServiceFromFirestore(id: string): Promise<void> {
  const path = `${SERVICES_COL}/${id}`;
  try {
    const docRef = doc(firestore, SERVICES_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getServicesFromFirestore(): Promise<BarberService[]> {
  try {
    const snapshot = await getDocs(collection(firestore, SERVICES_COL));
    const list: BarberService[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as BarberService);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SERVICES_COL);
    return [];
  }
}

// ========================================================
// PROFISSIONAIS (PROFESSIONALS)
// ========================================================

export async function saveProfessionalToFirestore(pro: BarberProfessional): Promise<void> {
  const path = `${PROFESSIONALS_COL}/${pro.id}`;
  try {
    const cleanPro = sanitizeForFirestore(pro);
    const docRef = doc(firestore, PROFESSIONALS_COL, pro.id);
    await setDoc(docRef, cleanPro, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProfessionalFromFirestore(proId: string): Promise<void> {
  const path = `${PROFESSIONALS_COL}/${proId}`;
  try {
    const docRef = doc(firestore, PROFESSIONALS_COL, proId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getProfessionalsFromFirestore(): Promise<BarberProfessional[]> {
  try {
    const snapshot = await getDocs(collection(firestore, PROFESSIONALS_COL));
    const list: BarberProfessional[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as BarberProfessional);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PROFESSIONALS_COL);
    return [];
  }
}

// ========================================================
// NOTIFICAÇÕES DO ADMIN
// ========================================================

export async function saveNotificationToFirestore(notif: AdminNotification): Promise<void> {
  const path = `${NOTIFICATIONS_COL}/${notif.id}`;
  try {
    const cleanNotif = sanitizeForFirestore(notif);
    const docRef = doc(firestore, NOTIFICATIONS_COL, notif.id);
    await setDoc(docRef, cleanNotif, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

