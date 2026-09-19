import {
  ClientProfile,
  Appointment,
  AppointmentStatus,
  AppointmentStatusChange,
  PaymentStatus,
  BarbershopConfig,
  BarberService,
  BarberProfessional,
  AdminNotification,
  DatabaseSchema,
  BlockedPeriod,
  DaySchedule,
  SlotIntervalMinutes,
} from '../types';
import { DEFAULT_BARBERSHOP_CONFIG, DEFAULT_SERVICES, PROFESSIONALS } from '../data/barberData';
import {
  saveAppointmentToFirestore,
  updateAppointmentInFirestore,
  deleteAppointmentFromFirestore,
  saveConfigToFirestore,
  saveServiceToFirestore,
  deleteServiceFromFirestore,
  saveProfessionalToFirestore,
  deleteProfessionalFromFirestore,
  saveNotificationToFirestore,
  subscribeToAppointmentsFirestore,
  subscribeToConfigFirestore,
} from '../lib/firestoreService';

const CLIENT_KEY = 'barbershop_client_profile';
const ALL_CLIENTS_KEY = 'barbershop_all_clients';
const APPOINTMENTS_KEY = 'barbershop_appointments';
const CONFIG_KEY = 'barbershop_config';
const SERVICES_KEY = 'barbershop_services';
const PROFESSIONALS_KEY = 'barbershop_professionals';
const NOTIFICATIONS_KEY = 'barbershop_admin_notifications';
const ADMIN_AUTH_KEY = 'barbershop_admin_authenticated';
const CLIENT_SEEN_STATUSES_KEY = 'barbershop_client_seen_statuses';

// Notifica a aplicação sobre mudanças no armazenamento para sincronizar clientes e admin
export function notifySync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barbershop_sync'));
  }
}

// ========================================================
// SINCRONIZAÇÃO COM O BANCO DE DADOS REAL (API BACKEND)
// ========================================================

let hasInitializedFromDB = false;

export async function syncWithServerDatabase(): Promise<void> {
  try {
    const res = await fetch('/api/database');
    if (!res.ok) return;
    const db: DatabaseSchema = await res.json();

    if (db.clients && Array.isArray(db.clients)) {
      localStorage.setItem(ALL_CLIENTS_KEY, JSON.stringify(db.clients));
    }
    if (db.appointments && Array.isArray(db.appointments)) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(db.appointments));
    }
    if (db.services && Array.isArray(db.services)) {
      localStorage.setItem(SERVICES_KEY, JSON.stringify(db.services));
    }
    if (db.config) {
      const sanitized = sanitizeBarbershopConfig(db.config);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(sanitized));
    }
    if (db.professionals && Array.isArray(db.professionals)) {
      localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify(db.professionals));
    }
    if (db.notifications && Array.isArray(db.notifications)) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(db.notifications));
    }
    notifySync();
  } catch (e) {
    // Modo offline resiliente caso o servidor esteja inicializando
    console.warn('[Sync] Rodando em modo local temporário', e);
  }
}

// Inicia sincronização automática ao carregar
if (typeof window !== 'undefined' && !hasInitializedFromDB) {
  hasInitializedFromDB = true;
  syncWithServerDatabase();

  // Escuta atualizações em tempo real do Firestore
  try {
    subscribeToAppointmentsFirestore((remoteAppointments) => {
      if (Array.isArray(remoteAppointments)) {
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(remoteAppointments));
        notifySync();
      }
    });

    subscribeToConfigFirestore((remoteConfig) => {
      if (remoteConfig) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(remoteConfig));
        notifySync();
      }
    });
  } catch (err) {
    console.warn('[Firestore] Listeners em tempo real indisponíveis temporariamente:', err);
  }
}

// ========================================================
// CÁLCULO DA TAXA DE AGENDAMENTO
// ========================================================

export function calculateBookingFee(service: BarberService): {
  hasFee: boolean;
  feeAmount: number;
  remainingAmount: number;
} {
  if (!service.hasBookingFee || !service.bookingFeeValue || service.bookingFeeValue <= 0) {
    return {
      hasFee: false,
      feeAmount: 0,
      remainingAmount: service.price,
    };
  }

  let fee = 0;
  if (service.bookingFeeType === 'percentual') {
    fee = Math.round(((service.price * service.bookingFeeValue) / 100) * 100) / 100;
  } else {
    // Valor fixo
    fee = Math.min(service.price, Number(service.bookingFeeValue));
  }

  const remaining = Math.max(0, service.price - fee);

  return {
    hasFee: true,
    feeAmount: fee,
    remainingAmount: remaining,
  };
}

// ========================================================
// CLIENTE
// ========================================================
export function getStoredClient(): ClientProfile | null {
  try {
    const raw = localStorage.getItem(CLIENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAllStoredClients(): ClientProfile[] {
  try {
    const raw = localStorage.getItem(ALL_CLIENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredClient(client: ClientProfile): void {
  try {
    localStorage.setItem(CLIENT_KEY, JSON.stringify(client));
    
    // Atualiza também na lista de todos os clientes
    const all = getAllStoredClients();
    const idx = all.findIndex((c) => c.id === client.id || c.phone === client.phone);
    let updatedAll: ClientProfile[];
    if (idx >= 0) {
      updatedAll = [...all];
      updatedAll[idx] = { ...updatedAll[idx], ...client };
    } else {
      updatedAll = [client, ...all];
    }
    localStorage.setItem(ALL_CLIENTS_KEY, JSON.stringify(updatedAll));

    // Sincroniza com backend
    fetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    }).catch(() => {});
    notifySync();
  } catch (e) {
    console.error('Error saving client profile', e);
  }
}

export function setStoredClientStatus(clientId: string, status: 'ativo' | 'inativo'): void {
  try {
    const all = getAllStoredClients();
    const idx = all.findIndex((c) => c.id === clientId);
    if (idx >= 0) {
      all[idx].status = status;
      localStorage.setItem(ALL_CLIENTS_KEY, JSON.stringify(all));
    }

    const currentLocal = getStoredClient();
    if (currentLocal && currentLocal.id === clientId) {
      currentLocal.status = status;
      localStorage.setItem(CLIENT_KEY, JSON.stringify(currentLocal));
    }

    fetch(`/api/clients/${clientId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});

    notifySync();
  } catch (e) {
    console.error('Error updating client status', e);
  }
}

export function deleteStoredClient(clientId: string): void {
  try {
    const all = getAllStoredClients();
    const targetClient = all.find((c) => c.id === clientId);
    const targetPhoneDigits = targetClient?.phone ? targetClient.phone.replace(/\D/g, '') : '';

    const updated = all.filter((c) => c.id !== clientId);
    localStorage.setItem(ALL_CLIENTS_KEY, JSON.stringify(updated));

    const currentLocal = getStoredClient();
    if (
      currentLocal &&
      (currentLocal.id === clientId ||
        (targetPhoneDigits && currentLocal.phone.replace(/\D/g, '') === targetPhoneDigits))
    ) {
      localStorage.removeItem(CLIENT_KEY);
    }

    // Remove agendamentos associados ao cliente para evitar registros órfãos ou re-criação
    const allApps = getAllAppointments();
    const appsToDelete = allApps.filter((a) => {
      if (a.clientId === clientId) return true;
      if (targetPhoneDigits && a.clientPhone && a.clientPhone.replace(/\D/g, '') === targetPhoneDigits) {
        return true;
      }
      return false;
    });
    const cleanApps = allApps.filter((a) => !appsToDelete.some((del) => del.id === a.id));
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(cleanApps));

    // Exclui cada agendamento associado no Firestore e no servidor
    appsToDelete.forEach((app) => {
      deleteAppointmentFromFirestore(app.id).catch(() => {});
      fetch(`/api/appointments/${app.id}`, { method: 'DELETE' }).catch(() => {});
    });

    fetch(`/api/clients/${clientId}`, {
      method: 'DELETE',
    }).catch(() => {});

    notifySync();
  } catch (e) {
    console.error('Error deleting client', e);
  }
}

export function clearStoredClient(): void {
  try {
    localStorage.removeItem(CLIENT_KEY);
    notifySync();
  } catch (e) {
    console.error('Error clearing client', e);
  }
}

// ========================================================
// CONFIGURAÇÕES DA BARBEARIA & DISPONIBILIDADE
// ========================================================
export function cleanBarbershopName(text?: string): string {
  if (!text) return 'BARBEARIA DO VINICIUS';
  let cleaned = text;
  cleaned = cleaned.replace(/(barbearia\s+do\s+)+/gi, 'BARBEARIA DO ');
  cleaned = cleaned.replace(/vinil/gi, 'VINICIUS');
  cleaned = cleaned.replace(/viny/gi, 'VINICIUS');
  cleaned = cleaned.replace(/vin[ií]cius/gi, 'VINICIUS');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (/^barbearia\s+do$/i.test(cleaned) || !/vinicius/i.test(cleaned)) {
    cleaned = 'BARBEARIA DO VINICIUS';
  }
  return cleaned.toUpperCase();
}

export function cleanBarbershopTitle(text?: string): string {
  if (!text) return 'BARBEARIA DO VINICIUS';
  let cleaned = text;
  cleaned = cleaned.replace(/(barbearia\s+do\s+)+/gi, 'BARBEARIA DO ');
  cleaned = cleaned.replace(/vinil/gi, 'VINICIUS');
  cleaned = cleaned.replace(/viny/gi, 'VINICIUS');
  cleaned = cleaned.replace(/vin[ií]cius/gi, 'VINICIUS');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (/^barbearia\s+do$/i.test(cleaned) || !/vinicius/i.test(cleaned)) {
    cleaned = 'BARBEARIA DO VINICIUS';
  }
  return cleaned.toUpperCase();
}

export function sanitizeBarbershopConfig(cfg: BarbershopConfig): BarbershopConfig {
  let name = cleanBarbershopName(cfg.name || 'BARBEARIA DO VINICIUS');
  let clientTopTitle = cleanBarbershopTitle(cfg.clientTopTitle || cfg.name || 'BARBEARIA DO VINICIUS');
  let pixReceiverName = cleanBarbershopTitle(cfg.pixReceiverName || cfg.name || 'BARBEARIA DO VINICIUS');
  let tagline = cfg.tagline || 'Cortes Clássicos, Barba, Navalha & Estilo';
  let email = cfg.email || '';
  let instagram = cfg.instagram || '';
  let logo = cfg.logo || '/logo_vinicius.jpg';

  // Corrige qualquer variação indesejada causada por auto-corretor
  if (/vinil|viny/i.test(tagline)) {
    tagline = tagline.replace(/vinil|viny/gi, 'Vinicius');
  }
  if (/vinil|viny/i.test(email)) {
    email = email.replace(/vinil|viny/gi, 'vinicius');
  }
  if (/vinil|viny/i.test(instagram)) {
    instagram = instagram.replace(/vinil|viny/gi, 'vinicius');
  }
  if (!logo || logo === '/logo_viny.jpg') {
    logo = '/logo_vinicius.jpg';
  }

  return {
    ...cfg,
    name,
    clientTopTitle,
    pixReceiverName,
    tagline,
    email,
    instagram,
    logo,
  };
}

export function getStoredConfig(): BarbershopConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) {
      const sanitizedDefault = sanitizeBarbershopConfig(DEFAULT_BARBERSHOP_CONFIG);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(sanitizedDefault));
      return sanitizedDefault;
    }
    const parsed = JSON.parse(raw);

    // Se o estilo anterior ainda for o padrão de fábrica âmbar, migra para a identidade visual Azul, Branco e Vermelho
    const isOldAmber = parsed.primaryColor === 'amber' || parsed.primaryColorHex === '#f59e0b' || !parsed.primaryColor;
    const primaryColor = isOldAmber ? 'blue' : parsed.primaryColor;
    const primaryColorHex = isOldAmber ? '#2563eb' : (parsed.primaryColorHex || '#2563eb');
    const secondaryColorHex = isOldAmber ? '#0b1329' : (parsed.secondaryColorHex || '#0b1329');
    const buttonColorHex = isOldAmber ? '#dc2626' : (parsed.buttonColorHex || '#dc2626');
    const buttonTextColorHex = isOldAmber ? '#ffffff' : (parsed.buttonTextColorHex || '#ffffff');
    const textColorHex = isOldAmber ? '#ffffff' : (parsed.textColorHex || '#ffffff');
    const accentColorHex = isOldAmber ? '#dc2626' : (parsed.accentColorHex || '#dc2626');

    const mergedConfig: BarbershopConfig = {
      ...DEFAULT_BARBERSHOP_CONFIG,
      ...parsed,
      primaryColor,
      primaryColorHex,
      secondaryColorHex,
      buttonColorHex,
      buttonTextColorHex,
      textColorHex,
      accentColorHex,
      weeklySchedule: parsed.weeklySchedule || DEFAULT_BARBERSHOP_CONFIG.weeklySchedule,
      slotInterval: parsed.slotInterval || DEFAULT_BARBERSHOP_CONFIG.slotInterval || 30,
      blockedPeriods: parsed.blockedPeriods || [],
    };

    const sanitized = sanitizeBarbershopConfig(mergedConfig);

    if (isOldAmber || JSON.stringify(sanitized) !== raw) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch {
    return sanitizeBarbershopConfig(DEFAULT_BARBERSHOP_CONFIG);
  }
}

export function saveStoredConfig(config: BarbershopConfig): void {
  try {
    const sanitized = sanitizeBarbershopConfig(config);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(sanitized));
    // Persiste no Firestore
    saveConfigToFirestore(sanitized).catch(() => {});
    // Persiste no Servidor Express
    fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    }).catch(() => {});
    notifySync();
  } catch (e) {
    console.error('Error saving config', e);
  }
}

// Helper para adicionar bloqueio de data ou horário
export function addBlockedPeriodToConfig(period: BlockedPeriod): void {
  const config = getStoredConfig();
  const current = config.blockedPeriods || [];
  const newPeriod: BlockedPeriod = {
    ...period,
    id: period.id || `bp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated: BarbershopConfig = {
    ...config,
    blockedPeriods: [...current, newPeriod],
  };
  saveStoredConfig(updated);
}

// Helper para remover bloqueio de data ou horário
export function removeBlockedPeriodFromConfig(id: string): void {
  const config = getStoredConfig();
  const current = config.blockedPeriods || [];
  const updated: BarbershopConfig = {
    ...config,
    blockedPeriods: current.filter((p) => p.id !== id),
  };
  saveStoredConfig(updated);
}

// ========================================================
// PROFISSIONAIS (BARBEIROS) & DISPONIBILIDADE INDIVIDUAL
// ========================================================
export function getStoredProfessionals(): BarberProfessional[] {
  try {
    const raw = localStorage.getItem(PROFESSIONALS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredProfessionals(professionals: BarberProfessional[]): void {
  try {
    localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify(professionals));
    // Persiste cada profissional no Firestore
    professionals.forEach((p) => {
      saveProfessionalToFirestore(p).catch(() => {});
    });
    fetch('/api/professionals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(professionals),
    }).catch(() => {});
    notifySync();
  } catch (e) {
    console.error('Error saving professionals', e);
  }
}

export function updateStoredProfessional(professional: BarberProfessional): void {
  const list = getStoredProfessionals();
  const idx = list.findIndex((p) => p.id === professional.id);
  let updated: BarberProfessional[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = professional;
  } else {
    updated = [...list, professional];
  }
  saveStoredProfessionals(updated);
}

export function deleteStoredProfessional(id: string): void {
  try {
    const list = getStoredProfessionals();
    const updated = list.filter((p) => p.id !== id);
    localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify(updated));

    // Remove do Firestore
    deleteProfessionalFromFirestore(id).catch(() => {});

    // Sincroniza lista completa com o backend
    fetch('/api/professionals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    // Executa também remoção por ID
    fetch(`/api/professionals/${id}`, {
      method: 'DELETE',
    }).catch(() => {});

    notifySync();
  } catch (e) {
    console.error('Error deleting professional', e);
  }
}

export function saveProfessionalToDB(professional: BarberProfessional): void {
  saveProfessionalToFirestore(professional).catch(() => {});
  fetch(`/api/professionals/${professional.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(professional),
  }).catch(() => {});
}

export function deleteProfessionalFromDB(id: string): void {
  deleteStoredProfessional(id);
}

// ========================================================
// SERVIÇOS
// ========================================================
export function getStoredServices(): BarberService[] {
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredServices(services: BarberService[]): void {
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
    // Sincroniza a lista atualizada de serviços com o backend Express
    fetch('/api/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(services),
    }).catch(() => {});
    notifySync();
  } catch (e) {
    console.error('Error saving services', e);
  }
}

export function saveServiceToDB(service: BarberService): void {
  const current = getStoredServices();
  const idx = current.findIndex((s) => s.id === service.id);
  let updated: BarberService[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = service;
  } else {
    updated = [...current, service];
  }

  saveStoredServices(updated);

  // Envia para o Firestore
  saveServiceToFirestore(service).catch(() => {});

  // Envia para o banco de dados backend
  fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  }).catch(() => {});
}

export function deleteServiceFromDB(id: string): void {
  const current = getStoredServices();
  const updated = current.filter((s) => s.id !== id);
  saveStoredServices(updated);

  // Remove do Firestore
  deleteServiceFromFirestore(id).catch(() => {});

  fetch(`/api/services/${id}`, {
    method: 'DELETE',
  }).catch(() => {});
}

// ========================================================
// AGENDAMENTOS
// ========================================================
export function deleteAppointmentFromDB(id: string): void {
  try {
    const all = getAllAppointments();
    const updated = all.filter((a) => a.id !== id);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));

    // Remove do Firestore
    deleteAppointmentFromFirestore(id).catch(() => {});

    // Remove do servidor backend
    fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
    }).catch(() => {});

    notifySync();
  } catch (e) {
    console.error('Error deleting appointment', e);
  }
}
export function getAllAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getClientAppointments(clientId: string): Appointment[] {
  const all = getAllAppointments();
  return all
    .filter((a) => a.clientId === clientId)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

export function saveNewAppointment(appointment: Appointment): void {
  const all = getAllAppointments();
  // Prevenção estrita de duplicidade por duplo clique ou refresh
  const isDuplicate = all.some(
    (a) =>
      a.id === appointment.id ||
      (a.clientPhone === appointment.clientPhone &&
        a.date === appointment.date &&
        a.time === appointment.time &&
        a.serviceId === appointment.serviceId &&
        a.status !== 'Cancelado' &&
        a.status !== 'Cancelado pelo cliente')
  );
  if (isDuplicate) {
    return;
  }

  const updated = [appointment, ...all];
  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));

    // Salva no Firestore
    saveAppointmentToFirestore(appointment).catch(() => {});

    // Registra status inicial para o cliente (evita falso alerta logo após agendar)
    try {
      const seen = getClientSeenStatuses();
      seen[appointment.id] = {
        status: appointment.status,
        updatedAt: new Date().toISOString(),
      };
      saveClientSeenStatuses(seen);
    } catch {}

    // Notificação enviada para o ADMIN
    const notif = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      appointmentId: appointment.id,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      serviceName: appointment.serviceName,
      professionalName: appointment.professionalName,
      date: appointment.date,
      time: appointment.time,
      price: appointment.price,
      bookingFee: appointment.bookingFee,
      amountPaid: appointment.amountPaid,
      remainingAmount: appointment.remainingAmount,
      paymentMethod: appointment.paymentMethod,
      paymentStatus: appointment.paymentStatus,
      isRead: false,
      action: 'NOVO_AGENDAMENTO' as const,
    };
    addAdminNotification(notif);
    saveNotificationToFirestore(notif).catch(() => {});

    // Persiste no Banco de Dados Backend
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    }).catch(() => {});

    notifySync();
  } catch (e) {
    console.error('Error saving appointment', e);
  }
}

export function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  paymentStatus?: PaymentStatus
): boolean {
  const all = getAllAppointments();
  const index = all.findIndex((a) => a.id === appointmentId);
  if (index === -1) return false;

  all[index].status = newStatus;
  if (paymentStatus) {
    all[index].paymentStatus = paymentStatus;
    if (paymentStatus === 'Pagamento confirmado') {
      all[index].amountPaid = all[index].totalAmount;
      all[index].remainingAmount = 0;
    } else if (paymentStatus === 'Taxa paga') {
      all[index].amountPaid = all[index].bookingFee;
      all[index].remainingAmount = Math.max(0, all[index].totalAmount - all[index].bookingFee);
    }
  }

  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));

    // Atualiza no Firestore
    updateAppointmentInFirestore(appointmentId, {
      status: newStatus,
      ...(paymentStatus ? { paymentStatus } : {}),
      amountPaid: all[index].amountPaid,
      remainingAmount: all[index].remainingAmount,
    }).catch(() => {});

    // Persiste no Banco de Dados
    fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, paymentStatus }),
    }).catch(() => {});

    notifySync();
    return true;
  } catch (e) {
    console.error('Error updating appointment status', e);
    return false;
  }
}

export function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
): boolean {
  const all = getAllAppointments();
  const index = all.findIndex((a) => a.id === appointmentId);
  if (index === -1) return false;

  all[index].date = newDate;
  all[index].time = newTime;
  all[index].status = 'Confirmado';

  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));

    // Atualiza no Firestore
    updateAppointmentInFirestore(appointmentId, {
      date: newDate,
      time: newTime,
      status: 'Confirmado',
    }).catch(() => {});

    fetch(`/api/appointments/${appointmentId}/reschedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, time: newTime }),
    }).catch(() => {});

    notifySync();
    return true;
  } catch (e) {
    console.error('Error rescheduling appointment', e);
    return false;
  }
}

export function cancelAppointment(
  appointmentId: string,
  reason?: string,
  cancelledBy: 'cliente' | 'admin' = 'cliente'
): boolean {
  const all = getAllAppointments();
  const index = all.findIndex((a) => a.id === appointmentId);
  if (index === -1) return false;

  const nowIso = new Date().toISOString();
  const newStatus: AppointmentStatus = cancelledBy === 'cliente' ? 'Cancelado pelo cliente' : 'Cancelado';

  all[index].status = newStatus;
  all[index].cancelledAt = nowIso;
  all[index].cancelledBy = cancelledBy;
  all[index].cancelReason = reason || '';

  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));

    // Atualiza no Firestore
    updateAppointmentInFirestore(appointmentId, {
      status: newStatus,
      cancelledAt: nowIso,
      cancelledBy,
      cancelReason: reason || '',
    }).catch(() => {});

    // Notificação para o painel administrativo da barbearia
    const cancelNotif = {
      id: `notif-${Date.now()}`,
      timestamp: nowIso,
      appointmentId: all[index].id,
      clientName: all[index].clientName,
      clientPhone: all[index].clientPhone,
      serviceName: all[index].serviceName,
      professionalName: all[index].professionalName,
      date: all[index].date,
      time: all[index].time,
      price: all[index].price,
      bookingFee: all[index].bookingFee,
      amountPaid: all[index].amountPaid,
      remainingAmount: all[index].remainingAmount,
      paymentMethod: all[index].paymentMethod,
      paymentStatus: all[index].paymentStatus,
      isRead: false,
      action: 'CANCELAMENTO_CLIENTE' as const,
    };
    addAdminNotification(cancelNotif);
    saveNotificationToFirestore(cancelNotif).catch(() => {});

    // Envia para o backend express
    fetch(`/api/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: reason || '',
        cancelledBy,
        cancelledAt: nowIso,
      }),
    }).catch(() => {
      fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {});
    });

    notifySync();
    return true;
  } catch (e) {
    console.error('Error canceling appointment', e);
    return false;
  }
}

// ========================================================
// NOTIFICAÇÕES ADMIN
// ========================================================
export function getAdminNotifications(): AdminNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addAdminNotification(notif: AdminNotification): void {
  try {
    const notifs = getAdminNotifications();
    const updated = [notif, ...notifs].slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function markAllNotificationsRead(): void {
  try {
    const notifs = getAdminNotifications();
    const updated = notifs.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    fetch('/api/notifications/read-all', {
      method: 'POST',
    }).catch(() => {});

    notifySync();
  } catch {
    // ignore
  }
}

export function markNotificationRead(id: string): void {
  try {
    const notifs = getAdminNotifications();
    const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    notifySync();
  } catch {
    // ignore
  }
}

// ========================================================
// ADMIN AUTH & ALTERAR SENHA
// ========================================================
export function isAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(status: boolean): void {
  try {
    if (status) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch {
    // ignore
  }
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await res.json();
    return data;
  } catch (e: any) {
    return {
      success: false,
      message: 'Falha na comunicação com o banco de dados. Tente novamente.',
    };
  }
}

// ========================================================
// WHATSAPP & FORMATAÇÃO
// ========================================================
export function getClientPortalUrl(appointmentId?: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  if (appointmentId) {
    return `${origin}/?page=cliente&app=${encodeURIComponent(appointmentId)}`;
  }
  return `${origin}/?page=cliente`;
}

export function generateWhatsAppMessage(
  appointment: Appointment,
  isConfirmedByAdmin = false
): string {
  const dateFormatted = formatDatePortuguese(appointment.date);
  const paymentMethodText =
    appointment.paymentMethod === 'PIX' ? 'PIX' : 'Pagar no estabelecimento';

  const title = isConfirmedByAdmin
    ? '✅ *AGENDAMENTO CONFIRMADO*'
    : '✂️ *NOVO AGENDAMENTO*';

  // Se o serviço possui taxa de agendamento, mostra o detalhamento de pagamento
  const hasFee = Boolean(appointment.hasBookingFee && appointment.bookingFee > 0);

  const feeDetails = hasFee
    ? `*Valor do serviço:* ${formatCurrency(appointment.price)}
*Taxa de agendamento:* ${formatCurrency(appointment.bookingFee)}
*Pago via PIX:* ${formatCurrency(appointment.amountPaid || appointment.bookingFee)}
*Restante no atendimento:* ${formatCurrency(appointment.remainingAmount)}`
    : `*Valor do serviço:* ${formatCurrency(appointment.price)}`;

  // Link direto para o cliente acessar seu agendamento no site
  const clientAppUrl = getClientPortalUrl(appointment.id);
  const linkText = clientAppUrl
    ? `\n📲 *Acesse seu agendamento no nosso site:*\n${clientAppUrl}\n`
    : '';

  return encodeURIComponent(
`${title}

*Cliente:* ${appointment.clientName}
*Telefone:* ${appointment.clientPhone}
*Serviço:* ${appointment.serviceName}
*Profissional:* ${appointment.professionalName}
*Data:* ${dateFormatted}
*Horário:* ${appointment.time}

${feeDetails}

*Forma de Pagamento:* ${paymentMethodText}
*Status:* ${appointment.paymentStatus || 'Confirmado'}
${linkText}`
  );
}

export function getWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${finalPhone}?text=${text}`;
}

export function generateCancellationWhatsAppMessage(
  appointment: Appointment,
  reason?: string,
  customTemplate?: string
): string {
  const dateFormatted = formatDatePortuguese(appointment.date);
  const reasonText = reason && reason.trim() ? reason.trim() : 'Não informado';

  if (customTemplate && customTemplate.trim()) {
    const replaced = customTemplate
      .replace(/\[Nome do cliente\]/gi, appointment.clientName)
      .replace(/\[Cliente\]/gi, appointment.clientName)
      .replace(/\[Serviço\]/gi, appointment.serviceName)
      .replace(/\[Profissional\]/gi, appointment.professionalName)
      .replace(/\[Barbeiro\]/gi, appointment.professionalName)
      .replace(/\[Data\]/gi, dateFormatted)
      .replace(/\[Horário\]/gi, appointment.time)
      .replace(/\[Motivo\]/gi, reasonText)
      .replace(/\[Motivo, se informado\]/gi, reasonText);
    return encodeURIComponent(replaced);
  }

  const raw = `❌ Cancelamento de agendamento
Cliente: ${appointment.clientName}
Serviço: ${appointment.serviceName}
Barbeiro: ${appointment.professionalName}
Data: ${dateFormatted}
Horário: ${appointment.time}
Motivo: ${reasonText}

O cliente cancelou este agendamento pelo aplicativo.`;

  return encodeURIComponent(raw);
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

export function formatPhoneMask(val: string): string {
  const numbers = val.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) {
    return numbers ? `(${numbers}` : '';
  }
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

export function formatDatePortuguese(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date);
    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ${day} de ${monthName}`;
  } catch {
    return dateStr;
  }
}

// ========================================================
// SISTEMA DE NOTIFICAÇÕES E ALERTAS DE MUDANÇA DE STATUS (CLIENTE)
// ========================================================

export function getClientSeenStatuses(): Record<string, { status: AppointmentStatus; updatedAt: string }> {
  try {
    const raw = localStorage.getItem(CLIENT_SEEN_STATUSES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveClientSeenStatuses(data: Record<string, { status: AppointmentStatus; updatedAt: string }>): void {
  try {
    localStorage.setItem(CLIENT_SEEN_STATUSES_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar status vistos pelo cliente', e);
  }
}

/**
 * Retorna lista de agendamentos cujo status atual difere do último status visto pelo cliente.
 * Se um agendamento nunca foi visto antes, ele é registrado silenciosamente.
 */
export function getUnacknowledgedStatusChanges(appointments: Appointment[]): AppointmentStatusChange[] {
  const seenMap = getClientSeenStatuses();
  let hasNewRegistrations = false;
  const changes: AppointmentStatusChange[] = [];

  for (const app of appointments) {
    const recorded = seenMap[app.id];
    if (!recorded) {
      // Primeira vez que o cliente vê esse agendamento -> inicializa sem alertar
      seenMap[app.id] = {
        status: app.status,
        updatedAt: new Date().toISOString(),
      };
      hasNewRegistrations = true;
    } else if (recorded.status !== app.status) {
      // O status mudou (ex: de 'Pendente' para 'Confirmado' ou 'Cancelado')!
      changes.push({
        appointmentId: app.id,
        oldStatus: recorded.status,
        newStatus: app.status,
        changedAt: new Date().toISOString(),
      });
    }
  }

  if (hasNewRegistrations) {
    saveClientSeenStatuses(seenMap);
  }

  return changes;
}

/**
 * Reconhece a mudança de status de um agendamento individual (marca como visto)
 */
export function acknowledgeStatusChange(appointmentId: string, currentStatus: AppointmentStatus): void {
  const seenMap = getClientSeenStatuses();
  seenMap[appointmentId] = {
    status: currentStatus,
    updatedAt: new Date().toISOString(),
  };
  saveClientSeenStatuses(seenMap);
  notifySync();
}

/**
 * Reconhece todas as mudanças de status para uma lista de agendamentos
 */
export function acknowledgeAllStatusChanges(appointments: Appointment[]): void {
  const seenMap = getClientSeenStatuses();
  for (const app of appointments) {
    seenMap[app.id] = {
      status: app.status,
      updatedAt: new Date().toISOString(),
    };
  }
  saveClientSeenStatuses(seenMap);
  notifySync();
}
