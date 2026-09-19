export type AppointmentStatus =
  | 'Pendente'
  | 'Confirmado'
  | 'Cancelado'
  | 'Cancelado pelo cliente'
  | 'Concluído';

export type PaymentMethod = 'PIX' | 'LOCAL';

export type PaymentStatus =
  | 'Pagamento pendente'
  | 'PIX enviado'
  | 'Taxa paga'
  | 'Pagamento confirmado'
  | 'Pagar no estabelecimento';

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  photo?: string;
  createdAt: string;
  status?: 'ativo' | 'inativo';
}

export type BookingFeeType = 'fixo' | 'percentual';

export interface BarberService {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
  popular?: boolean;
  active: boolean;
  category: 'cabelo' | 'barba' | 'combo' | 'extra' | 'acabamento';
  professionalId?: string; // ID do profissional ou vazio/qualquer
  // Taxa de agendamento configurável individualmente
  hasBookingFee?: boolean;
  bookingFeeType?: BookingFeeType;
  bookingFeeValue?: number; // valor fixo (ex: 10) ou percentual (ex: 20%)
  createdAt?: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  name: string; // 'Segunda', 'Terça', etc.
  active: boolean; // true = ATIVO, false = FECHADO
  openTime: string; // ex: '08:00'
  closeTime: string; // ex: '18:00'
  hasBreak: boolean; // intervalo / almoço
  breakStart: string; // ex: '12:00'
  breakEnd: string; // ex: '13:00'
}

export type SlotIntervalMinutes = 15 | 30 | 45 | 60;

export interface BlockedPeriod {
  id: string;
  date: string; // YYYY-MM-DD
  isFullDay: boolean; // true = "Dia fechado"
  startTime?: string; // '14:00'
  endTime?: string; // '16:00'
  reason: string; // "Indisponível", "Reforma", "Feriado", etc.
  professionalId?: string; // 'todos' ou ID do profissional
  createdAt?: string;
}

export interface BarberProfessional {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  role: string;
  initials: string;
  avatarColor: string;
  specialty: string;
  experienceYears: number;
  availableDays: number[]; // 0 = Domingo, 1 = Segunda, etc.
  status?: 'ativo' | 'inativo';
  // Disponibilidade individual do profissional
  useCustomSchedule?: boolean;
  weeklySchedule?: DaySchedule[];
  slotInterval?: SlotIntervalMinutes;
  timeOffs?: TimeOff[];
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  price: number; // Valor do serviço

  // Detalhes da taxa de agendamento
  hasBookingFee: boolean;
  bookingFee: number; // Valor da taxa calculado
  totalAmount: number; // Valor total do serviço
  amountPaid: number; // Quanto já foi pago (ex: taxa de R$ 10 paga ou total R$ 55)
  remainingAmount: number; // Quanto falta pagar no atendimento (ex: R$ 45)

  professionalId: string;
  professionalName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  notes?: string;

  // Registro de Cancelamento
  cancelledAt?: string;
  cancelledBy?: 'cliente' | 'admin';
  cancelReason?: string;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  amount: number;
  type: 'TAXA_AGENDAMENTO' | 'PAGAMENTO_TOTAL' | 'RESTANTE_ATENDIMENTO';
  paymentMethod: PaymentMethod;
  pixKey?: string;
  status: 'Pendente' | 'Confirmado' | 'Recusado';
  createdAt: string;
  confirmedAt?: string;
}

export interface BlockedSlot {
  id?: string;
  professionalId?: string;
  date: string;
  time: string;
  reason?: string;
  status?: 'ativo' | 'inativo';
}

export interface TimeOff {
  id: string;
  professionalId: string;
  startDate: string;
  endDate: string;
  type: 'folga' | 'ferias';
  observation?: string;
}

export interface BarbershopConfig {
  id?: string;
  name: string;
  tagline: string;
  phone: string; // WhatsApp ou telefone comercial
  whatsapp?: string; // WhatsApp da barbearia
  secondaryPhone?: string; // Telefone fixo / secundário
  email?: string; // E-mail da empresa
  address: string; // Endereço / Rua
  number?: string; // Número
  neighborhood?: string; // Bairro
  city?: string; // Cidade
  state?: string; // Estado (UF)
  zipCode?: string; // CEP
  postalCode?: string; // Alias CEP
  instagram?: string;
  logo?: string;
  
  // Customizações do Portal do Cliente - Tela de Entrada
  clientTopTitle?: string; // Nome exibido no topo do painel do cliente
  clientSubtitle?: string; // Subtítulo ou slogan no portal
  presentationText?: string; // Texto de apresentação na Home do cliente
  informativeNotice?: string; // Mensagens informativas / avisos no portal do cliente
  heroBackground?: string; // Foto/imagem de fundo do banner inicial
  bookingPageTitle?: string; // Título da página de agendamento
  bookingPageSubtitle?: string; // Subtítulo da página de agendamento
  bookingButtonText?: string; // Texto do botão "Agendar horário"
  myAppointmentsButtonText?: string; // Texto do botão "Meus agendamentos"
  
  // Customização Visual Completa
  primaryColor?: 'blue' | 'barber-pole' | 'amber' | 'yellow' | 'emerald' | 'rose' | 'zinc'; // Paleta de cores do cliente
  primaryColorHex?: string; // Cor primária personalizada (Hex)
  secondaryColorHex?: string; // Cor secundária / cards (Hex)
  buttonColorHex?: string; // Cor de fundo dos botões principais (Hex)
  buttonTextColorHex?: string; // Cor do texto dos botões (Hex)
  textColorHex?: string; // Cor dos textos principais (Hex)
  accentColorHex?: string; // Cor de destaque terciária / barber pole red (Hex)
  buttonStyle?: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full' | 'pill-gradient'; // Formato e acabamento dos botões
  borderRadius?: 'rounded-lg' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full'; // Estilo de arredondamento geral
  logoShape?: 'circle' | 'rounded-2xl' | 'rounded-3xl' | 'shield'; // Formato da moldura da logo
  logoSize?: 'sm' | 'md' | 'lg' | 'xl'; // Tamanho de exibição da logo

  // Visibilidade de Seções na Home / Portal
  showAddressOnHome?: boolean;
  showPhoneOnHome?: boolean;
  showWorkingHoursOnHome?: boolean;
  showInstagramOnHome?: boolean;
  showNoticeOnHome?: boolean;
  showHeroSection?: boolean;
  showUpcomingSection?: boolean;
  showQuickBookingButton?: boolean;
  showMyAppointmentsButton?: boolean;
  showAdminAccessFooter?: boolean;

  // Regras de Perfil do Cliente
  profileShowPhoto?: boolean;
  profileShowEmail?: boolean;
  profileShowAddress?: boolean;
  profileShowBirthDate?: boolean;
  profileAllowEditName?: boolean;
  profileAllowEditPhone?: boolean;
  profileAllowEditEmail?: boolean;
  profileAllowEditAddress?: boolean;
  profileAllowEditBirthDate?: boolean;

  // Regras da Área de Agendamento
  bookingInstructions?: string;
  allowReschedule?: boolean;
  rescheduleMinHours?: number;
  showServiceDuration?: boolean;
  showServicePrice?: boolean;

  // Regras de Cancelamento pelo Cliente
  allowClientCancellation?: boolean; // Permitir ou bloquear cancelamento pelo cliente (padrão true)
  cancellationMinHours?: number; // Prazo mínimo para cancelar em horas (ex: 2h antes, 0 = livre)
  cancellationNoticeText?: string; // Texto apresentado ao cliente ao cancelar
  cancellationReasonMode?: 'none' | 'optional' | 'required'; // Solicitar motivo do cancelamento
  notifyAdminOnCancel?: boolean; // Criar notificação no painel administrativo
  sendWhatsAppOnCancel?: boolean; // Enviar cancelamento para o WhatsApp da barbearia
  autoFreeSlotOnCancel?: boolean; // Liberar automaticamente o horário cancelado na agenda

  // Modelos de Notificações / Mensagens
  msgBookingCreated?: string;
  msgBookingConfirmed?: string;
  msgBookingCancelledByClient?: string;
  msgBookingCancelledByBarber?: string;
  msgBookingReminder?: string;

  workingHours: string;
  openHour: number; // ex: 8
  closeHour: number; // ex: 18
  closedDays: number[]; // 0 = Domingo
  lunchBreak: string[]; // ['12:00', '13:00']
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'Celular' | 'E-mail' | 'Chave Aleatória';
  pixReceiverName: string;
  pixCity: string;
  blockedSlots: BlockedSlot[];
  // Controle de Disponibilidade para Clientes
  slotInterval?: SlotIntervalMinutes; // 15, 30, 45, 60 (padrão 30)
  weeklySchedule?: DaySchedule[]; // Configuração detalhada por dia da semana
  blockedPeriods?: BlockedPeriod[]; // Bloqueios de data inteira ou faixa de horário
}

export interface AdminNotification {
  id: string;
  timestamp: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  price: number;
  bookingFee?: number;
  amountPaid?: number;
  remainingAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  isRead: boolean;
  action: 'NOVO_AGENDAMENTO' | 'CANCELAMENTO_CLIENTE' | 'STATUS_ALTERADO' | 'PAGAMENTO_CONFIRMADO';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  status: 'ativo' | 'inativo';
}

export interface DatabaseSchema {
  admins: AdminUser[];
  clients: ClientProfile[];
  professionals: BarberProfessional[];
  services: BarberService[];
  appointments: Appointment[];
  payments: PaymentRecord[];
  blockedSlots: BlockedSlot[];
  timeOffs: TimeOff[];
  notifications: AdminNotification[];
  config: BarbershopConfig;
}

export type AppMode = 'client' | 'admin';
export type AdminTab = 'agenda' | 'clientes' | 'servicos' | 'configuracoes';
export type ClientScreen = 'home' | 'booking' | 'appointments' | 'profile';
export type AppScreen = 'home' | 'booking' | 'appointments' | 'admin-login' | 'admin-dashboard';

export interface AppointmentStatusChange {
  appointmentId: string;
  oldStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  changedAt: string;
}

