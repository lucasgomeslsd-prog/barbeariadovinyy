import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  DatabaseSchema, 
  BarberService, 
  BarberProfessional, 
  Appointment, 
  PaymentRecord, 
  BlockedSlot, 
  TimeOff, 
  AdminNotification, 
  BarbershopConfig, 
  ClientProfile,
  AdminUser,
  DaySchedule
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'barbershop_database.json');

// Funções criptográficas para segurança da senha do ADMIN
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const testHash = hashPassword(password, salt);
  return testHash === hash;
}

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, name: 'Segunda', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 2, name: 'Terça', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 3, name: 'Quarta', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 4, name: 'Quinta', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 5, name: 'Sexta', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 6, name: 'Sábado', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 0, name: 'Domingo', active: false, openTime: '08:00', closeTime: '18:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
];

function cleanBarbershopName(text?: string): string {
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

function cleanBarbershopTitle(text?: string): string {
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

// Configuração padrão
function sanitizeConfig(cfg: BarbershopConfig): BarbershopConfig {
  let name = cleanBarbershopName(cfg.name || 'BARBEARIA DO VINICIUS');
  let clientTopTitle = cleanBarbershopTitle(cfg.clientTopTitle || cfg.name || 'BARBEARIA DO VINICIUS');
  let pixReceiverName = cleanBarbershopTitle(cfg.pixReceiverName || cfg.name || 'BARBEARIA DO VINICIUS');
  let tagline = cfg.tagline || 'Cortes Clássicos, Barba, Navalha & Estilo';
  let logo = cfg.logo || '/logo_vinicius.jpg';
  if (!logo || logo === '/logo_viny.jpg') {
    logo = '/logo_vinicius.jpg';
  }

  if (/vinil|viny/i.test(tagline)) tagline = tagline.replace(/vinil|viny/gi, 'Vinicius');

  return {
    ...cfg,
    name,
    clientTopTitle,
    pixReceiverName,
    tagline,
    logo,
  };
}

const DEFAULT_CONFIG: BarbershopConfig = {
  id: 'cfg-default',
  name: 'BARBEARIA DO VINICIUS',
  clientTopTitle: 'BARBEARIA DO VINICIUS',
  tagline: 'Cortes Clássicos, Barba, Navalha & Estilo',
  phone: '(11) 98765-4321',
  address: 'Rua das Flores, 142 • Centro',
  logo: '/logo_vinicius.jpg',
  workingHours: 'Segunda a Sábado, das 08:00 às 18:00',
  openHour: 8,
  closeHour: 18,
  closedDays: [0], // Domingo
  lunchBreak: ['12:00', '13:00'],
  pixKey: '11987654321',
  pixKeyType: 'Celular',
  pixReceiverName: 'BARBEARIA DO VINICIUS',
  pixCity: 'São Paulo',
  blockedSlots: [],
  slotInterval: 30,
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  blockedPeriods: [],
  // Estilo Visual Barber Pole (Azul, Branco e Vermelho)
  primaryColor: 'blue',
  primaryColorHex: '#2563eb',
  secondaryColorHex: '#0b1329',
  buttonColorHex: '#dc2626',
  buttonTextColorHex: '#ffffff',
  textColorHex: '#ffffff',
  accentColorHex: '#dc2626',
  buttonStyle: 'rounded-2xl',
  borderRadius: 'rounded-2xl',
};

// Serviços padrão: inicializa vazio para dados reais da empresa
const DEFAULT_SERVICES: BarberService[] = [];

// Profissionais padrão: inicializa vazio para cadastro oficial pelo administrador
const DEFAULT_PROFESSIONALS: BarberProfessional[] = [];

function createInitialDatabase(): DatabaseSchema {
  const initialSalt = generateSalt();
  // Senha padrão 'admin123' armazenada de forma segura com hash PBKDF2
  const initialHash = hashPassword('admin123', initialSalt);

  const admin: AdminUser = {
    id: 'admin-1',
    name: 'Administrador Dom Pedro',
    email: 'contato@barbeariadompedro.com.br',
    phone: '(11) 98765-4321',
    username: 'admin',
    passwordHash: initialHash,
    passwordSalt: initialSalt,
    createdAt: new Date().toISOString(),
    status: 'ativo',
  };

  return {
    admins: [admin],
    clients: [],
    professionals: [],
    services: [],
    appointments: [],
    payments: [],
    blockedSlots: [],
    timeOffs: [],
    notifications: [],
    config: DEFAULT_CONFIG,
  };
}

class DatabaseManager {
  private schema: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.schema = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.admins)) {
          if (!parsed.config) parsed.config = { ...DEFAULT_CONFIG };
          if (!parsed.config.weeklySchedule || parsed.config.weeklySchedule.length === 0) {
            parsed.config.weeklySchedule = DEFAULT_WEEKLY_SCHEDULE;
          }
          if (!parsed.config.slotInterval) {
            parsed.config.slotInterval = 30;
          }
          if (!Array.isArray(parsed.config.blockedPeriods)) {
            parsed.config.blockedPeriods = [];
          }
          if (!Array.isArray(parsed.services)) {
            parsed.services = [];
          }
          if (!Array.isArray(parsed.professionals)) {
            parsed.professionals = [];
          }
          if (!Array.isArray(parsed.clients)) {
            parsed.clients = [];
          }
          if (!Array.isArray(parsed.appointments)) {
            parsed.appointments = [];
          }
          if (!Array.isArray(parsed.payments)) {
            parsed.payments = [];
          }
          if (!Array.isArray(parsed.notifications)) {
            parsed.notifications = [];
          }
          if (!Array.isArray(parsed.blockedSlots)) {
            parsed.blockedSlots = [];
          }
          if (!Array.isArray(parsed.timeOffs)) {
            parsed.timeOffs = [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('[DB] Error loading database file. Initializing defaults.', e);
    }

    const initial = createInitialDatabase();
    this.save(initial);
    return initial;
  }

  public save(data?: DatabaseSchema) {
    if (data) {
      this.schema = data;
    }
    this.ensureDataDir();
    // Escrita atômica para evitar corrupção de arquivo
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(this.schema, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public getSchema(): DatabaseSchema {
    return this.schema;
  }

  // ==========================================
  // AUTENTICAÇÃO E SENHA DO ADMIN
  // ==========================================
  public getAdminByUsername(username: string): AdminUser | undefined {
    return this.schema.admins.find((a) => a.username.toLowerCase() === username.toLowerCase());
  }

  public verifyAdminLogin(username: string, password: string): { success: boolean; admin?: AdminUser; error?: string } {
    const admin = this.getAdminByUsername(username);
    if (!admin) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    if (admin.status === 'inativo') {
      return { success: false, error: 'Usuário administrativo inativo' };
    }

    const isMatch = verifyPassword(password, admin.passwordSalt, admin.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Senha incorreta' };
    }

    return { success: true, admin };
  }

  public changeAdminPassword(
    username: string, 
    currentPassword: string, 
    newPassword: string
  ): { success: boolean; message: string } {
    const admin = this.getAdminByUsername(username);
    if (!admin) {
      return { success: false, message: 'Administrador não encontrado no banco de dados.' };
    }

    // 1. Confirmar se a senha atual está correta
    const isCurrentCorrect = verifyPassword(currentPassword, admin.passwordSalt, admin.passwordHash);
    if (!isCurrentCorrect) {
      return { success: false, message: 'A senha atual informada está incorreta.' };
    }

    // 2. Validar tamanho mínimo
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'A nova senha deve possuir no mínimo 6 caracteres.' };
    }

    // 3. Gerar novo salt e hash seguro
    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword.trim(), newSalt);

    admin.passwordSalt = newSalt;
    admin.passwordHash = newHash;

    this.save();
    return { success: true, message: 'Senha alterada com sucesso!' };
  }

  // ==========================================
  // AGENDAMENTOS
  // ==========================================
  public getAppointments(): Appointment[] {
    return this.schema.appointments;
  }

  public createAppointment(data: Partial<Appointment> & Omit<Appointment, 'id' | 'createdAt'>): { success: boolean; appointment?: Appointment; error?: string } {
    // 0. Prevenção de Duplicação: se já existe um agendamento idêntico recente do mesmo cliente no mesmo dia/horário/serviço
    const duplicateApp = this.schema.appointments.find(
      (a) =>
        (data.id && a.id === data.id) ||
        (a.clientPhone === data.clientPhone &&
          a.date === data.date &&
          a.time === data.time &&
          a.serviceId === data.serviceId &&
          a.status !== 'Cancelado' &&
          a.status !== 'Cancelado pelo cliente')
    );
    if (duplicateApp) {
      return {
        success: true,
        appointment: duplicateApp,
      };
    }

    // 1. Validar conflito de agendamento (mesmo profissional, mesma data, mesmo horário)
    const existingConflict = this.schema.appointments.find(
      (a) =>
        a.date === data.date &&
        a.time === data.time &&
        a.status !== 'Cancelado' &&
        (a.professionalId === data.professionalId || data.professionalId === 'qualquer' || a.professionalId === 'qualquer')
    );

    // Se o profissional for 'qualquer', permite se houver outros barbeiros disponíveis
    if (existingConflict && data.professionalId !== 'qualquer') {
      return {
        success: false,
        error: `O profissional já possui um agendamento confirmado às ${data.time} no dia ${data.date}.`,
      };
    }

    // 2. Verificar se o dia da semana está ativo ou se o horário está fora do expediente
    if (this.schema.config.weeklySchedule && this.schema.config.weeklySchedule.length > 0) {
      const dateObj = new Date(`${data.date}T12:00:00`);
      const dayOfWeek = dateObj.getDay();
      const daySched = this.schema.config.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);

      if (daySched && !daySched.active) {
        return {
          success: false,
          error: `A barbearia não abre aos ${daySched.name}s (dia desativado pelo administrador).`,
        };
      }

      if (daySched && daySched.active) {
        if (data.time < daySched.openTime || data.time >= daySched.closeTime) {
          return {
            success: false,
            error: `O horário ${data.time} está fora do expediente (${daySched.openTime} às ${daySched.closeTime}).`,
          };
        }
        if (daySched.hasBreak && daySched.breakStart && daySched.breakEnd) {
          if (data.time >= daySched.breakStart && data.time < daySched.breakEnd) {
            return {
              success: false,
              error: `O horário ${data.time} coincide com o intervalo (${daySched.breakStart} às ${daySched.breakEnd}).`,
            };
          }
        }
      }
    }

    // 3. Verificar bloqueio de data inteira ou faixa de horários (blockedPeriods)
    if (this.schema.config.blockedPeriods && this.schema.config.blockedPeriods.length > 0) {
      const isPeriodBlocked = this.schema.config.blockedPeriods.find((bp) => {
        if (bp.date !== data.date) return false;
        if (
          bp.professionalId &&
          bp.professionalId !== 'todos' &&
          bp.professionalId !== data.professionalId &&
          data.professionalId !== 'qualquer'
        ) {
          return false;
        }
        if (bp.isFullDay || bp.reason?.toLowerCase().includes('fechado')) return true;
        if (bp.startTime && bp.endTime) {
          return data.time >= bp.startTime && data.time < bp.endTime;
        }
        return false;
      });

      if (isPeriodBlocked) {
        return {
          success: false,
          error: `Este horário está bloqueado pelo administrador (${isPeriodBlocked.reason || 'Indisponível'}).`,
        };
      }
    }

    // 4. Verificar horário bloqueado legado (blockedSlots)
    const isBlocked = this.schema.blockedSlots.some(
      (b) => b.date === data.date && b.time === data.time && b.status !== 'inativo'
    );
    if (isBlocked) {
      return {
        success: false,
        error: `Este horário (${data.time}) está bloqueado pela barbearia para manutenção ou intervalo.`,
      };
    }

    const id = `app-${Date.now()}`;
    const newApp: Appointment = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    this.schema.appointments.push(newApp);

    // 3. Cadastrar ou atualizar o cliente na tabela CLIENTES
    let client = this.schema.clients.find((c) => c.phone === data.clientPhone || c.id === data.clientId);
    if (!client) {
      client = {
        id: data.clientId || `client-${Date.now()}`,
        name: data.clientName,
        phone: data.clientPhone,
        email: data.clientEmail,
        createdAt: new Date().toISOString(),
        status: 'ativo',
      };
      this.schema.clients.push(client);
    } else {
      client.name = data.clientName;
    }

    // 4. Criar registro de pagamento se houver taxa ou PIX
    if (data.paymentMethod === 'PIX' || data.hasBookingFee) {
      const paymentRecord: PaymentRecord = {
        id: `pay-${Date.now()}`,
        appointmentId: id,
        clientId: client.id,
        clientName: client.name,
        amount: data.amountPaid > 0 ? data.amountPaid : data.bookingFee,
        type: data.hasBookingFee ? 'TAXA_AGENDAMENTO' : 'PAGAMENTO_TOTAL',
        paymentMethod: data.paymentMethod,
        pixKey: this.schema.config.pixKey,
        status: data.paymentStatus === 'Taxa paga' || data.paymentStatus === 'Pagamento confirmado' ? 'Confirmado' : 'Pendente',
        createdAt: new Date().toISOString(),
      };
      this.schema.payments.push(paymentRecord);
    }

    // 5. Criar notificação para o ADMIN
    const notif: AdminNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      appointmentId: id,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      serviceName: data.serviceName,
      professionalName: data.professionalName,
      date: data.date,
      time: data.time,
      price: data.price,
      bookingFee: data.bookingFee,
      amountPaid: data.amountPaid,
      remainingAmount: data.remainingAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      isRead: false,
      action: 'NOVO_AGENDAMENTO',
    };
    this.schema.notifications.unshift(notif);

    this.save();
    return { success: true, appointment: newApp };
  }

  public updateAppointmentStatus(
    id: string, 
    status: Appointment['status'], 
    paymentStatus?: Appointment['paymentStatus']
  ): Appointment | null {
    const app = this.schema.appointments.find((a) => a.id === id);
    if (!app) return null;

    app.status = status;
    if (paymentStatus) {
      app.paymentStatus = paymentStatus;
      if (paymentStatus === 'Pagamento confirmado') {
        app.amountPaid = app.totalAmount;
        app.remainingAmount = 0;
      } else if (paymentStatus === 'Taxa paga') {
        app.amountPaid = app.bookingFee;
        app.remainingAmount = Math.max(0, app.totalAmount - app.bookingFee);
      }
    }

    // Atualiza registro de pagamento
    const payment = this.schema.payments.find((p) => p.appointmentId === id);
    if (payment && paymentStatus === 'Pagamento confirmado') {
      payment.status = 'Confirmado';
      payment.confirmedAt = new Date().toISOString();
    }

    this.save();
    return app;
  }

  public rescheduleAppointment(id: string, newDate: string, newTime: string): Appointment | null {
    const app = this.schema.appointments.find((a) => a.id === id);
    if (!app) return null;

    app.date = newDate;
    app.time = newTime;
    app.status = 'Confirmado';

    this.save();
    return app;
  }

  public cancelAppointment(
    id: string,
    reason?: string,
    cancelledBy: 'cliente' | 'admin' = 'cliente'
  ): Appointment | null {
    const app = this.schema.appointments.find((a) => a.id === id);
    if (!app) return null;

    const nowIso = new Date().toISOString();
    app.status = cancelledBy === 'cliente' ? 'Cancelado pelo cliente' : 'Cancelado';
    app.cancelledAt = nowIso;
    app.cancelledBy = cancelledBy;
    app.cancelReason = reason || '';

    if (cancelledBy === 'cliente') {
      const notif: AdminNotification = {
        id: `notif-${Date.now()}`,
        timestamp: nowIso,
        appointmentId: app.id,
        clientName: app.clientName,
        clientPhone: app.clientPhone,
        serviceName: app.serviceName,
        professionalName: app.professionalName,
        date: app.date,
        time: app.time,
        price: app.price,
        bookingFee: app.bookingFee,
        amountPaid: app.amountPaid,
        remainingAmount: app.remainingAmount,
        paymentMethod: app.paymentMethod,
        paymentStatus: app.paymentStatus,
        isRead: false,
        action: 'CANCELAMENTO_CLIENTE',
      };
      this.schema.notifications.unshift(notif);
    }

    this.save();
    return app;
  }

  public deleteAppointment(id: string): boolean {
    const beforeCount = this.schema.appointments.length;
    this.schema.appointments = this.schema.appointments.filter((a) => a.id !== id);
    this.schema.payments = this.schema.payments.filter((p) => p.appointmentId !== id);
    this.schema.notifications = this.schema.notifications.filter((n) => n.appointmentId !== id);
    const deleted = this.schema.appointments.length < beforeCount;
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  // ==========================================
  // SERVIÇOS
  // ==========================================
  public getServices(): BarberService[] {
    return this.schema.services;
  }

  public saveServices(services: BarberService[]): BarberService[] {
    this.schema.services = services;
    this.save();
    return this.schema.services;
  }

  public saveService(serviceData: BarberService): BarberService {
    const index = this.schema.services.findIndex((s) => s.id === serviceData.id);
    if (index >= 0) {
      this.schema.services[index] = { ...serviceData };
    } else {
      const newService: BarberService = {
        ...serviceData,
        id: serviceData.id || `svc-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.schema.services.push(newService);
    }
    this.save();
    return serviceData;
  }

  public deleteService(id: string): boolean {
    const before = this.schema.services.length;
    this.schema.services = this.schema.services.filter((s) => s.id !== id);
    this.save();
    return this.schema.services.length < before;
  }

  // ==========================================
  // CONFIGURAÇÕES E BLOQUEIOS
  // ==========================================
  public getConfig(): BarbershopConfig {
    return sanitizeConfig(this.schema.config);
  }

  public saveConfig(config: BarbershopConfig): BarbershopConfig {
    this.schema.config = sanitizeConfig({ ...config });
    this.save();
    return this.schema.config;
  }

  public getBlockedSlots(): BlockedSlot[] {
    return this.schema.blockedSlots;
  }

  public addBlockedSlot(slot: BlockedSlot): BlockedSlot {
    const newSlot: BlockedSlot = {
      ...slot,
      id: slot.id || `block-${Date.now()}`,
      status: 'ativo',
    };
    this.schema.blockedSlots.push(newSlot);
    // Sincroniza também no objeto config
    if (!this.schema.config.blockedSlots) this.schema.config.blockedSlots = [];
    this.schema.config.blockedSlots.push(newSlot);
    this.save();
    return newSlot;
  }

  public removeBlockedSlot(indexOrId: number | string): void {
    if (typeof indexOrId === 'number') {
      this.schema.blockedSlots.splice(indexOrId, 1);
      this.schema.config.blockedSlots.splice(indexOrId, 1);
    } else {
      this.schema.blockedSlots = this.schema.blockedSlots.filter((b) => b.id !== indexOrId);
      this.schema.config.blockedSlots = this.schema.config.blockedSlots.filter((b) => b.id !== indexOrId);
    }
    this.save();
  }

  // ==========================================
  // NOTIFICAÇÕES
  // ==========================================
  public getNotifications(): AdminNotification[] {
    return this.schema.notifications;
  }

  public markAllNotificationsRead(): void {
    this.schema.notifications.forEach((n) => (n.isRead = true));
    this.save();
  }

  // ==========================================
  // CLIENTES
  // ==========================================
  public getClients(): ClientProfile[] {
    return this.schema.clients;
  }

  public updateClient(client: ClientProfile): ClientProfile {
    const idx = this.schema.clients.findIndex((c) => c.id === client.id || c.phone === client.phone);
    if (idx >= 0) {
      this.schema.clients[idx] = { ...this.schema.clients[idx], ...client };
    } else {
      this.schema.clients.push(client);
    }
    this.save();
    return client;
  }

  public setClientStatus(id: string, status: 'ativo' | 'inativo'): ClientProfile | null {
    const client = this.schema.clients.find((c) => c.id === id);
    if (!client) return null;
    client.status = status;
    this.save();
    return client;
  }

  public deleteClient(id: string): boolean {
    const client = this.schema.clients.find((c) => c.id === id);
    const clientPhoneDigits = client?.phone ? client.phone.replace(/\D/g, '') : '';
    const beforeCount = this.schema.clients.length;

    this.schema.clients = this.schema.clients.filter((c) => c.id !== id);

    // Remove agendamentos vinculados a este cliente para evitar que ele seja ressuscitado
    this.schema.appointments = this.schema.appointments.filter((a) => {
      if (a.clientId === id) return false;
      if (clientPhoneDigits && a.clientPhone && a.clientPhone.replace(/\D/g, '') === clientPhoneDigits) {
        return false;
      }
      return true;
    });

    // Remove pagamentos vinculados
    this.schema.payments = this.schema.payments.filter((p) => p.clientId !== id);

    const deleted = this.schema.clients.length < beforeCount;
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  // ==========================================
  // PROFISSIONAIS E DISPONIBILIDADE INDIVIDUAL
  // ==========================================
  public getProfessionals(): BarberProfessional[] {
    return this.schema.professionals;
  }

  public saveProfessionals(professionals: BarberProfessional[]): BarberProfessional[] {
    this.schema.professionals = professionals;
    this.save();
    return this.schema.professionals;
  }

  public updateProfessional(pro: BarberProfessional): BarberProfessional {
    const idx = this.schema.professionals.findIndex((p) => p.id === pro.id);
    if (idx >= 0) {
      this.schema.professionals[idx] = { ...this.schema.professionals[idx], ...pro };
    } else {
      this.schema.professionals.push(pro);
    }
    this.save();
    return pro;
  }

  public deleteProfessional(id: string): boolean {
    const beforeCount = this.schema.professionals.length;
    this.schema.professionals = this.schema.professionals.filter((p) => p.id !== id);
    const deleted = this.schema.professionals.length < beforeCount;
    if (deleted) {
      this.save();
    }
    return deleted;
  }
}

export const db = new DatabaseManager();
