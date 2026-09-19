import { BarberService, BarberProfessional, Appointment, BarbershopConfig, DaySchedule } from '../types';

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, name: 'Segunda', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 2, name: 'Terça', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 3, name: 'Quarta', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 4, name: 'Quinta', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 5, name: 'Sexta', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 6, name: 'Sábado', active: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 0, name: 'Domingo', active: false, openTime: '08:00', closeTime: '18:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
];

export const DEFAULT_BARBERSHOP_CONFIG: BarbershopConfig = {
  name: 'BARBEARIA DO VINICIUS',
  tagline: 'Cortes Clássicos, Barba, Navalha & Estilo',
  phone: '(11) 98765-4321', // WhatsApp da barbearia
  secondaryPhone: '(11) 3456-7890',
  email: 'contato@barbeariadovinicius.com.br',
  address: 'Rua das Flores',
  number: '142',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01001-000',
  instagram: '@barbeariadovinicius',
  logo: '/logo_vinicius.jpg',
  clientTopTitle: 'BARBEARIA DO VINICIUS',
  clientSubtitle: 'Seu estilo, sua identidade.',
  heroBackground: '',
  presentationText: 'Tradição, precisão no corte e ambiente acolhedor. Escolha seu serviço e agende seu horário com nossos profissionais especializados.',
  informativeNotice: 'Atendimento com horário marcado. Chegue com 5 minutos de antecedência.',
  bookingPageTitle: 'Agendamento Online',
  bookingPageSubtitle: 'Selecione o serviço, profissional e melhor horário para seu atendimento',
  bookingButtonText: 'Agendar meu horário',
  myAppointmentsButtonText: 'Meus agendamentos',
  
  // Customização Visual Completa - Barber Pole (Azul, Branco e Vermelho)
  primaryColor: 'blue',
  primaryColorHex: '#2563eb', // Azul Royal vibrante
  secondaryColorHex: '#0b1329', // Azul Meia-Noite / Navy
  buttonColorHex: '#dc2626', // Vermelho Barber clássico
  buttonTextColorHex: '#ffffff', // Branco Puro
  textColorHex: '#ffffff',
  accentColorHex: '#dc2626',
  buttonStyle: 'rounded-2xl',
  borderRadius: 'rounded-2xl',
  logoShape: 'rounded-3xl',
  logoSize: 'lg',

  // Visibilidade de Seções
  showAddressOnHome: true,
  showPhoneOnHome: true,
  showWorkingHoursOnHome: true,
  showInstagramOnHome: true,
  showNoticeOnHome: true,
  showHeroSection: true,
  showUpcomingSection: true,
  showQuickBookingButton: true,
  showMyAppointmentsButton: true,
  showAdminAccessFooter: true,

  // Perfil do Cliente
  profileShowPhoto: true,
  profileShowEmail: true,
  profileShowAddress: true,
  profileShowBirthDate: true,
  profileAllowEditName: true,
  profileAllowEditPhone: true,
  profileAllowEditEmail: true,
  profileAllowEditAddress: true,
  profileAllowEditBirthDate: true,

  // Agendamento
  bookingInstructions: 'Escolha seu serviço favorito, o barbeiro de sua preferência e marque seu horário com rapidez.',
  allowReschedule: true,
  rescheduleMinHours: 2,
  showServiceDuration: true,
  showServicePrice: true,

  // Cancelamento
  allowClientCancellation: true,
  cancellationMinHours: 2,
  cancellationNoticeText: 'Você pode cancelar seu agendamento gratuitamente até 2 horas antes do horário marcado.',
  cancellationReasonMode: 'optional',
  notifyAdminOnCancel: true,
  sendWhatsAppOnCancel: true,
  autoFreeSlotOnCancel: true,

  // Notificações e Mensagens WhatsApp
  msgBookingCreated: 'Olá! Seu agendamento foi registrado com sucesso.',
  msgBookingConfirmed: 'Seu agendamento foi confirmado pela BARBEARIA DO VINICIUS!',
  msgBookingCancelledByClient: `❌ *Cancelamento de agendamento*\nCliente: [Nome do cliente]\nServiço: [Serviço]\nBarbeiro: [Profissional]\nData: [Data]\nHorário: [Horário]\nMotivo: [Motivo]\n\nO cliente cancelou este agendamento pelo aplicativo.`,
  msgBookingCancelledByBarber: 'Seu agendamento foi cancelado pela barbearia.',
  msgBookingReminder: 'Lembrete: você tem um horário agendado hoje na barbearia!',

  workingHours: 'Segunda a Sábado, das 08:00 às 18:00',
  openHour: 8,
  closeHour: 18,
  closedDays: [0], // 0 = Domingo
  lunchBreak: ['12:00', '13:00'],
  pixKey: '11987654321',
  pixKeyType: 'Celular',
  pixReceiverName: 'BARBEARIA DO VINICIUS',
  pixCity: 'São Paulo',
  blockedSlots: [],
  slotInterval: 30,
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  blockedPeriods: [],
};

export const DEFAULT_SERVICES: BarberService[] = [];

export const PROFESSIONALS: BarberProfessional[] = [];

// Retrocompatibilidade
export const BARBERSHOP_INFO = DEFAULT_BARBERSHOP_CONFIG;

// Helper: Converte 'HH:mm' em minutos do dia
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Helper: Converte minutos em 'HH:mm'
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Gera lista de horários respeitando horário de início, fim, intervalo (passo) e horário de almoço/pausa
export function generateSlotsFromRange(
  openTime: string,
  closeTime: string,
  stepMinutes = 30,
  hasBreak = false,
  breakStart = '',
  breakEnd = ''
): string[] {
  const slots: string[] = [];
  const startM = timeToMinutes(openTime || '08:00');
  const endM = timeToMinutes(closeTime || '18:00');
  const breakStartM = hasBreak && breakStart ? timeToMinutes(breakStart) : -1;
  const breakEndM = hasBreak && breakEnd ? timeToMinutes(breakEnd) : -1;
  const step = Number(stepMinutes) || 30;

  for (let m = startM; m < endM; m += step) {
    // Se cai dentro do intervalo de almoço/pausa definido, não disponibiliza
    if (hasBreak && breakStartM !== -1 && breakEndM !== -1) {
      if (m >= breakStartM && m < breakEndM) {
        continue;
      }
    }
    slots.push(minutesToTime(m));
  }
  return slots;
}

// Gera lista de datas disponíveis nos próximos 14 dias (excluindo dias fechados e bloqueados)
export function getAvailableDays(
  count = 14,
  config: BarbershopConfig = DEFAULT_BARBERSHOP_CONFIG,
  selectedProfessional?: BarberProfessional | null
): { dateStr: string; dayName: string; dayNumber: number; monthName: string; isToday: boolean; isTomorrow: boolean; dayOfWeek: number }[] {
  const list = [];
  const today = new Date();

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dayOfWeek = d.getDay();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // 1. Verifica se o dia da semana está ATIVO ou FECHADO no weeklySchedule da barbearia
    if (config.weeklySchedule && config.weeklySchedule.length > 0) {
      const daySched = config.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
      if (daySched && !daySched.active) {
        // Dia desativado pelo ADMIN (ex: Domingo: FECHADO)
        continue;
      }
    } else if (config.closedDays && config.closedDays.includes(dayOfWeek)) {
      // Fallback legado
      continue;
    }

    // 2. Verifica se a data inteira está bloqueada ("Dia fechado") em config.blockedPeriods
    if (config.blockedPeriods && config.blockedPeriods.length > 0) {
      const isFullDayBlocked = config.blockedPeriods.some((bp) => {
        if (bp.date !== dateStr) return false;
        if (
          bp.professionalId &&
          selectedProfessional &&
          bp.professionalId !== 'todos' &&
          bp.professionalId !== selectedProfessional.id
        ) {
          return false;
        }
        return bp.isFullDay || bp.reason?.toLowerCase().includes('fechado');
      });
      if (isFullDayBlocked) {
        continue;
      }
    }

    // 3. Se um profissional específico foi escolhido, verifica disponibilidade dele
    if (selectedProfessional && selectedProfessional.id !== 'qualquer') {
      // Se tem agenda individual semanal configurada
      if (selectedProfessional.useCustomSchedule && selectedProfessional.weeklySchedule) {
        const proDay = selectedProfessional.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
        if (proDay && !proDay.active) {
          continue; // Folga do profissional
        }
      } else if (selectedProfessional.availableDays && !selectedProfessional.availableDays.includes(dayOfWeek)) {
        continue; // Folga semanal do profissional
      }

      // Férias / Afastamentos cadastrados para o profissional
      if (selectedProfessional.timeOffs && selectedProfessional.timeOffs.length > 0) {
        const isOnTimeOff = selectedProfessional.timeOffs.some(
          (to) => dateStr >= to.startDate && dateStr <= to.endDate
        );
        if (isOnTimeOff) {
          continue; // Profissional de férias/folga
        }
      }
    }

    list.push({
      dateStr,
      dayName: dayNames[dayOfWeek],
      dayNumber: d.getDate(),
      monthName: monthNames[d.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1,
      dayOfWeek,
    });
  }

  return list;
}

// Gera todos os horários padrão de funcionamento para retrocompatibilidade
export function generateBaseTimeSlots(
  config: BarbershopConfig = DEFAULT_BARBERSHOP_CONFIG
): string[] {
  const startHour = config.openHour || 8;
  const endHour = config.closeHour || 18;
  return generateSlotsFromRange(
    `${String(startHour).padStart(2, '0')}:00`,
    `${String(endHour).padStart(2, '0')}:00`,
    config.slotInterval || 30,
    config.lunchBreak && config.lunchBreak.length > 0,
    config.lunchBreak?.[0] || '12:00',
    config.lunchBreak?.[1] || '13:00'
  );
}

// Filtra horários estritamente disponíveis conforme as regras solicitadas:
// - Não mostrar horários já ocupados
// - Não mostrar horários fora do expediente do dia
// - Não mostrar dias/horários desativados pelo ADMIN
// - Não mostrar horários de intervalo de almoço
// - Não mostrar horários de folga/férias do profissional
// - Não mostrar datas ou horários bloqueados
// - Não mostrar horários passados de hoje
export function getAvailableTimeSlots(
  dateStr: string,
  professionalId: string,
  existingAppointments: Appointment[],
  config: BarbershopConfig = DEFAULT_BARBERSHOP_CONFIG,
  professionalsList: BarberProfessional[] = PROFESSIONALS
): string[] {
  const selectedDate = new Date(`${dateStr}T12:00:00`);
  const dayOfWeek = selectedDate.getDay();

  // 1. Verifica configuração do dia da semana
  const daySched = config.weeklySchedule?.find((s) => s.dayOfWeek === dayOfWeek);
  if (daySched && !daySched.active) {
    // Dia fechado pelo ADMIN
    return [];
  }

  // 2. Localiza o profissional selecionado
  const professional = professionalsList.find((p) => p.id === professionalId);

  // Verifica folga do profissional
  if (professional && professional.id !== 'qualquer') {
    if (professional.useCustomSchedule && professional.weeklySchedule) {
      const proDay = professional.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
      if (proDay && !proDay.active) {
        return []; // Dia de folga do profissional
      }
    } else if (professional.availableDays && !professional.availableDays.includes(dayOfWeek)) {
      return []; // Dia de folga do profissional
    }

    // Verifica férias do profissional
    if (professional.timeOffs && professional.timeOffs.length > 0) {
      const isOnHoliday = professional.timeOffs.some(
        (to) => dateStr >= to.startDate && dateStr <= to.endDate
      );
      if (isOnHoliday) return [];
    }
  }

  // 3. Verifica se a data inteira está bloqueada
  if (config.blockedPeriods && config.blockedPeriods.length > 0) {
    const isFullDay = config.blockedPeriods.some((bp) => {
      if (bp.date !== dateStr) return false;
      if (
        bp.professionalId &&
        bp.professionalId !== 'todos' &&
        bp.professionalId !== professionalId &&
        professionalId !== 'qualquer'
      ) {
        return false;
      }
      return bp.isFullDay || bp.reason?.toLowerCase().includes('fechado');
    });
    if (isFullDay) return [];
  }

  // 4. Determina horários de início, fim, intervalo e passo para este dia
  let openTime = '08:00';
  let closeTime = '18:00';
  let hasBreak = false;
  let breakStart = '12:00';
  let breakEnd = '13:00';
  const stepMinutes = Number(config.slotInterval) || 30;

  // Se o profissional tiver horário customizado para o dia
  if (
    professional &&
    professional.id !== 'qualquer' &&
    professional.useCustomSchedule &&
    professional.weeklySchedule
  ) {
    const proDay = professional.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (proDay) {
      openTime = proDay.openTime || openTime;
      closeTime = proDay.closeTime || closeTime;
      hasBreak = proDay.hasBreak;
      breakStart = proDay.breakStart || breakStart;
      breakEnd = proDay.breakEnd || breakEnd;
    }
  } else if (daySched) {
    openTime = daySched.openTime || openTime;
    closeTime = daySched.closeTime || closeTime;
    hasBreak = daySched.hasBreak;
    breakStart = daySched.breakStart || breakStart;
    breakEnd = daySched.breakEnd || breakEnd;
  } else {
    // Fallback legado
    openTime = `${String(config.openHour || 8).padStart(2, '0')}:00`;
    closeTime = `${String(config.closeHour || 18).padStart(2, '0')}:00`;
    if (config.lunchBreak && config.lunchBreak.length > 0) {
      hasBreak = true;
      breakStart = config.lunchBreak[0];
      breakEnd = config.lunchBreak[1] || '13:00';
    }
  }

  // Gera a base de horários
  const allSlots = generateSlotsFromRange(openTime, closeTime, stepMinutes, hasBreak, breakStart, breakEnd);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const isToday = dateStr === todayStr;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Agendamentos ativos na data (ignora Cancelado e Cancelado pelo cliente, liberando o horário automaticamente)
  const activeBookingsOnDate = existingAppointments.filter(
    (app) => app.date === dateStr && app.status !== 'Cancelado' && app.status !== 'Cancelado pelo cliente'
  );

  return allSlots.filter((slot) => {
    // 1. Bloqueios de horários específicos configurados pelo ADMIN em blockedPeriods
    if (config.blockedPeriods && config.blockedPeriods.length > 0) {
      const isPeriodBlocked = config.blockedPeriods.some((bp) => {
        if (bp.date !== dateStr) return false;
        if (
          bp.professionalId &&
          bp.professionalId !== 'todos' &&
          bp.professionalId !== professionalId &&
          professionalId !== 'qualquer'
        ) {
          return false;
        }
        if (bp.isFullDay) return true;
        if (bp.startTime && bp.endTime) {
          return slot >= bp.startTime && slot < bp.endTime;
        }
        return false;
      });
      if (isPeriodBlocked) return false;
    }

    // 1.1 Bloqueios pontuais legados (config.blockedSlots)
    if (config.blockedSlots && config.blockedSlots.some((b) => b.date === dateStr && b.time === slot)) {
      return false;
    }

    // 2. Se for hoje, não mostrar horários passados (com 15 minutos de folga para chegada)
    if (isToday) {
      const [slotH, slotM] = slot.split(':').map(Number);
      if (slotH < currentHour || (slotH === currentHour && slotM <= currentMinute + 15)) {
        return false;
      }
    }

    // 3. Verificar se o horário já está ocupado por outro agendamento
    if (professionalId === 'qualquer') {
      // Se selecionou 'qualquer', o slot só é inválido se TODOS os profissionais que trabalham hoje estiverem ocupados
      const workingPros = professionalsList.filter((p) => {
        if (p.id === 'qualquer') return false;
        if (p.useCustomSchedule && p.weeklySchedule) {
          const pDay = p.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
          return pDay ? pDay.active : true;
        }
        return p.availableDays ? p.availableDays.includes(dayOfWeek) : true;
      });

      const bookingsAtSlot = activeBookingsOnDate.filter((app) => app.time === slot);
      if (bookingsAtSlot.length >= workingPros.length && workingPros.length > 0) {
        return false;
      }
    } else {
      // Profissional específico
      const isBooked = activeBookingsOnDate.some(
        (app) => app.time === slot && (app.professionalId === professionalId || app.professionalId === 'qualquer')
      );
      if (isBooked) {
        return false;
      }
    }

    return true;
  });
}

