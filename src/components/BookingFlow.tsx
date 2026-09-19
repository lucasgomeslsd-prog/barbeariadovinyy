import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  User, 
  Scissors, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Copy,
  CheckCheck,
  MessageSquare,
  Building2,
  QrCode
} from 'lucide-react';
import { 
  BarberService, 
  BarberProfessional, 
  ClientProfile, 
  Appointment,
  PaymentMethod,
  PaymentStatus,
  BarbershopConfig
} from '../types';
import { 
  getAvailableDays, 
  getAvailableTimeSlots 
} from '../data/barberData';
import { 
  formatCurrency, 
  formatDatePortuguese, 
  saveNewAppointment,
  getStoredServices,
  getStoredConfig,
  getStoredProfessionals,
  generateWhatsAppMessage,
  getWhatsAppLink,
  calculateBookingFee,
  formatPhoneMask,
  saveStoredClient,
  cleanBarbershopName,
  cleanBarbershopTitle
} from '../utils/storage';
import { BarbershopLogo } from './common/BarbershopLogo';
import { getBrandButtonStyle, getBrandButtonRadiusClass } from '../utils/theme';

interface BookingFlowProps {
  client: ClientProfile | null;
  existingAppointments: Appointment[];
  onAppointmentCreated: (newApp: Appointment) => void;
  onCancelBooking: () => void;
  onGoToMyAppointments: () => void;
  onClientIdentified?: (client: ClientProfile) => void;
}

export function BookingFlow({
  client,
  existingAppointments,
  onAppointmentCreated,
  onCancelBooking,
  onGoToMyAppointments,
  onClientIdentified,
}: BookingFlowProps) {
  // Passos: 1 = Serviço, 2 = Profissional, 3 = Dia, 4 = Horário, 5 = Confirmação & Pagamento, 6 = Sucesso
  const [step, setStep] = useState<number>(1);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorError, setVisitorError] = useState('');

  // Configuração, serviços e profissionais dinâmicos (obtidos do Admin / banco de dados)
  const [config, setConfig] = useState<BarbershopConfig>(getStoredConfig);
  const [professionals, setProfessionals] = useState<BarberProfessional[]>(getStoredProfessionals);
  const [services, setServices] = useState<BarberService[]>(() => {
    const list = getStoredServices();
    return list.filter((s) => s.active !== false);
  });

  useEffect(() => {
    const handleSync = () => {
      setConfig(getStoredConfig());
      setProfessionals(getStoredProfessionals());
      const updated = getStoredServices();
      setServices(updated.filter((s) => s.active !== false));
    };
    window.addEventListener('barbershop_sync', handleSync);
    return () => window.removeEventListener('barbershop_sync', handleSync);
  }, []);

  // Estados de seleção
  const [selectedService, setSelectedService] = useState<BarberService | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<BarberProfessional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Taxa de Agendamento
  const feeInfo = useMemo(() => {
    if (!selectedService) return { hasFee: false, feeAmount: 0, remainingAmount: 0 };
    return calculateBookingFee(selectedService);
  }, [selectedService]);

  const [feeAcknowledged, setFeeAcknowledged] = useState<boolean>(false);

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [isPixPaidMarked, setIsPixPaidMarked] = useState<boolean>(false);
  const [pixCopied, setPixCopied] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Lista de dias disponíveis (respeita dias ativos da semana, feriados, dia fechado e folga do barbeiro)
  const availableDays = useMemo(
    () => getAvailableDays(14, config, selectedProfessional),
    [config, selectedProfessional]
  );

  // Horários disponíveis calculados estritamente com base nos filtros e bloqueios do ADMIN
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedProfessional) return [];
    return getAvailableTimeSlots(
      selectedDate,
      selectedProfessional.id,
      existingAppointments,
      config,
      professionals
    );
  }, [selectedDate, selectedProfessional, existingAppointments, config, professionals]);

  // Agrupa os horários por período para facilitar a leitura no celular
  const groupedSlots = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    availableSlots.forEach((slot) => {
      const hour = parseInt(slot.split(':')[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 18) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [availableSlots]);

  // Navegação para o passo anterior
  const handlePrevStep = () => {
    if (step === 1) {
      onCancelBooking();
    } else {
      setStep((prev) => prev - 1);
    }
  };

  // 1. Seleciona o serviço
  const handleSelectService = (service: BarberService) => {
    setSelectedService(service);
    setFeeAcknowledged(false);
    setIsPixPaidMarked(false);
    // Se o serviço cobra taxa de agendamento, o método de pagamento inicial é PIX para a reserva
    if (service.hasBookingFee) {
      setPaymentMethod('PIX');
    }
    setStep(2);
  };

  // 2. Seleciona o profissional
  const handleSelectProfessional = (pro: BarberProfessional) => {
    setSelectedProfessional(pro);
    setSelectedTime('');
    setStep(3);
  };

  // 3. Seleciona o dia
  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime('');
    setStep(4);
  };

  // 4. Seleciona o horário
  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep(5);
  };

  // Copiar chave PIX
  const handleCopyPix = () => {
    if (!config.pixKey) return;
    navigator.clipboard?.writeText(config.pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  // 5. Finaliza e confirma o agendamento
  const handleConfirmBooking = () => {
    if (isSubmitting || !selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;

    // Se houver taxa de agendamento, exige confirmação expressa do cliente
    if (feeInfo.hasFee && !feeAcknowledged) {
      return;
    }

    const cleanName = (client?.name || visitorName).trim();
    const rawPhone = client?.phone || visitorPhone;
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '');

    if (!cleanName || cleanName.length < 3) {
      setVisitorError('Por favor, informe seu nome completo para confirmar.');
      return;
    }

    if (cleanPhoneDigits.length < 10) {
      setVisitorError('Por favor, informe seu número de WhatsApp com DDD.');
      return;
    }

    setIsSubmitting(true);

    const activeClient: ClientProfile = client || {
      id: `client-${cleanPhoneDigits}`,
      name: cleanName,
      phone: formatPhoneMask(rawPhone),
      createdAt: new Date().toISOString(),
    };

    saveStoredClient(activeClient);
    if (onClientIdentified) {
      onClientIdentified(activeClient);
    }

    const isFeeRequired = feeInfo.hasFee;
    let finalPaymentMethod: PaymentMethod = isFeeRequired ? 'PIX' : paymentMethod;
    let paymentStatus: PaymentStatus = 'Pagar no estabelecimento';

    if (isFeeRequired) {
      // Se teve taxa, o cliente faz o PIX da taxa de reserva
      paymentStatus = isPixPaidMarked ? 'Taxa paga' : 'Pagamento pendente';
    } else if (paymentMethod === 'PIX') {
      paymentStatus = isPixPaidMarked ? 'PIX enviado' : 'Pagamento pendente';
    }

    const feeAmount = isFeeRequired ? feeInfo.feeAmount : 0;
    const amountPaid = isFeeRequired
      ? (isPixPaidMarked ? feeAmount : 0)
      : (paymentMethod === 'PIX' && isPixPaidMarked ? selectedService.price : 0);
    const remainingAmount = isFeeRequired
      ? (isPixPaidMarked ? feeInfo.remainingAmount : selectedService.price)
      : (paymentMethod === 'PIX' && isPixPaidMarked ? 0 : selectedService.price);

    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      clientId: activeClient.id,
      clientName: activeClient.name,
      clientPhone: activeClient.phone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDuration: selectedService.durationMinutes,
      price: selectedService.price,
      hasBookingFee: isFeeRequired,
      bookingFee: feeAmount,
      totalAmount: selectedService.price,
      amountPaid,
      remainingAmount,
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      date: selectedDate,
      time: selectedTime,
      status: 'Confirmado',
      paymentMethod: finalPaymentMethod,
      paymentStatus,
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      saveNewAppointment(newAppointment);
      setConfirmedAppointment(newAppointment);
      setIsSubmitting(false);
      setStep(6);
      onAppointmentCreated(newAppointment);
    }, 400);
  };

  // Tela de Sucesso (Passo 6)
  if (step === 6 && confirmedAppointment) {
    const whatsAppMsg = generateWhatsAppMessage(confirmedAppointment, false);
    const targetPhone = config.whatsapp || config.phone;
    const whatsAppLink = getWhatsAppLink(targetPhone, whatsAppMsg);

    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 min-h-screen flex flex-col justify-between">
        <div className="text-center pt-4">
          <div className="mb-3 hover:scale-105 transition-transform duration-300 inline-block">
            <BarbershopLogo config={config} size="xl" showBorder={true} />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white">
            Agendamento Confirmado!
          </h2>
          <p className="text-stone-400 text-sm mt-1 max-w-xs mx-auto">
            Seu horário na <strong className="text-stone-200">{cleanBarbershopName(config.name)}</strong> foi reservado com sucesso.
          </p>

          {/* Ticket de Resumo */}
          <div className="mt-6 p-5 bg-stone-900 border border-stone-800 rounded-2xl text-left shadow-xl space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-stone-800">
              <span className="text-xs text-stone-400 font-medium">Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                Confirmado
              </span>
            </div>

            <div>
              <span className="text-xs text-stone-500">Serviço:</span>
              <p className="text-stone-200 font-semibold">{confirmedAppointment.serviceName}</p>
            </div>

            <div>
              <span className="text-xs text-stone-500">Profissional:</span>
              <p className="text-stone-200 font-semibold">{confirmedAppointment.professionalName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-stone-500">Data:</span>
                <p className="text-stone-200 font-semibold text-sm">
                  {formatDatePortuguese(confirmedAppointment.date)}
                </p>
              </div>
              <div>
                <span className="text-xs text-stone-500">Horário:</span>
                <p className="text-blue-400 font-bold text-base">{confirmedAppointment.time}</p>
              </div>
            </div>

            {confirmedAppointment.hasBookingFee && confirmedAppointment.bookingFee > 0 ? (
              <div className="pt-2.5 border-t border-stone-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Valor do serviço:</span>
                  <span className="text-stone-200 font-semibold">{formatCurrency(confirmedAppointment.price)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-400 font-medium">Taxa de agendamento (PIX):</span>
                  <span className="text-red-400 font-bold">{formatCurrency(confirmedAppointment.bookingFee)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-medium">Total pago agora:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(confirmedAppointment.amountPaid || confirmedAppointment.bookingFee)}</span>
                </div>
                <div className="pt-1.5 border-t border-stone-800 flex justify-between items-center">
                  <span className="text-xs text-stone-300 font-semibold">Restante no atendimento:</span>
                  <span className="text-base font-extrabold text-blue-400">
                    {formatCurrency(confirmedAppointment.remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-stone-400 pt-0.5">
                  <span>Status do pagamento:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 font-bold">
                    {confirmedAppointment.paymentStatus}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-stone-500 block">Forma de Pagamento:</span>
                  <span className="text-xs font-semibold text-amber-300">
                    {confirmedAppointment.paymentMethod === 'PIX' ? 'PIX' : 'No Estabelecimento'} ({confirmedAppointment.paymentStatus})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Valor:</span>
                  <span className="text-lg font-extrabold text-white">
                    {formatCurrency(confirmedAppointment.price)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botão em Destaque: Enviar Notificação pelo WhatsApp */}
          <div className="mt-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Avisar a barbearia no WhatsApp</h4>
                <p className="text-xs text-stone-300 mt-0.5">
                  Envie os dados do seu agendamento diretamente para o WhatsApp oficial da barbearia.
                </p>
              </div>
            </div>

            <a
              id="btn-whatsapp-confirmacao"
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-stone-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-stone-950" />
              Enviar dados pelo WhatsApp
            </a>
          </div>
        </div>

        {/* Botões de Ação Pós-Agendamento */}
        <div className="space-y-2.5 pt-6 pb-2">
          <button
            id="btn-ver-meus-agendamentos"
            onClick={onGoToMyAppointments}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/30 cursor-pointer transition"
          >
            Ver Meus Agendamentos
          </button>
          <button
            id="btn-voltar-inicio"
            onClick={onCancelBooking}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 font-medium rounded-xl text-xs border border-stone-800 cursor-pointer transition"
          >
            Voltar à Tela Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col justify-between">
      <div>
        {/* Header com Botão Voltar e Título do Passo */}
        <div className="flex items-center justify-between mb-4">
          <button
            id="btn-booking-voltar"
            onClick={handlePrevStep}
            className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Passo {step} de 5
            </span>
            <h2 className="text-lg font-bold text-white leading-tight">
              {step === 1 && 'Escolha o serviço'}
              {step === 2 && 'Escolha o profissional'}
              {step === 3 && 'Escolha o dia'}
              {step === 4 && 'Escolha o horário'}
              {step === 5 && 'Confirmar agendamento'}
            </h2>
          </div>

          <div className="w-10 flex justify-end">
            <BarbershopLogo config={config} size="sm" showBorder={false} />
          </div>
        </div>

        {/* Barra de Progresso Visual dos 5 Passos */}
        <div className="grid grid-cols-5 gap-1.5 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step 
                  ? i === 5 ? 'bg-red-600' : 'bg-blue-600'
                  : 'bg-stone-800'
              }`}
            />
          ))}
        </div>

        {/* ======================================================== */}
        {/* PASSO 1: ESCOLHA O SERVIÇO */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-stone-400 mb-2">
              Selecione o serviço desejado para prosseguir:
            </p>

            {services.length === 0 ? (
              <div className="p-8 text-center bg-stone-900/60 border border-stone-800 rounded-2xl space-y-3">
                <Scissors className="w-10 h-10 text-stone-600 mx-auto" />
                <h3 className="font-bold text-stone-200 text-sm">Nenhum serviço disponível no momento</h3>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  A barbearia ainda está cadastrando o catálogo oficial de serviços. Por favor, contate o estabelecimento ou tente novamente em breve.
                </p>
              </div>
            ) : (
              services.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <div
                    key={service.id}
                    id={`service-item-${service.id}`}
                    onClick={() => handleSelectService(service)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-stone-100 text-base">{service.name}</h3>
                          {service.popular && (
                            <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-red-500/30">
                              <Sparkles className="w-2.5 h-2.5" /> Popular
                            </span>
                          )}
                        </div>
                        <p className="text-stone-400 text-xs mt-1 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-stone-400 text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {service.durationMinutes} min
                          </span>
                          <span className="text-blue-400 font-extrabold text-base">
                            {formatCurrency(service.price)}
                          </span>
                          {service.hasBookingFee && service.bookingFeeValue && (
                            <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 text-[10px] font-bold border border-red-500/30">
                              Taxa: {service.bookingFeeType === 'percentual' ? `${service.bookingFeeValue}%` : formatCurrency(service.bookingFeeValue)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-stone-700 bg-stone-800/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 2: ESCOLHA O PROFISSIONAL */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-stone-400 mb-2">
              Selecione o profissional de sua preferência:
            </p>

            {(() => {
              const activePros = professionals.filter((p) => p.status !== 'inativo');
              if (activePros.length === 0) {
                return (
                  <div className="p-8 text-center bg-stone-900/60 border border-stone-800 rounded-2xl space-y-3">
                    <User className="w-10 h-10 text-stone-600 mx-auto" />
                    <h3 className="font-bold text-stone-200 text-sm">Nenhum profissional disponível</h3>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      A barbearia ainda não configurou os profissionais disponíveis. Por favor, volte em breve.
                    </p>
                  </div>
                );
              }

              const displayPros =
                activePros.length > 1 && !activePros.some((p) => p.id === 'qualquer')
                  ? [
                      {
                        id: 'qualquer',
                        name: 'Qualquer profissional disponível',
                        role: 'Primeiro horário livre',
                        initials: 'QP',
                        avatarColor: 'bg-stone-800 text-blue-400 border border-blue-500/30',
                        specialty: 'Atendimento mais rápido',
                        experienceYears: 0,
                        availableDays: [1, 2, 3, 4, 5, 6],
                        status: 'ativo' as const,
                      },
                      ...activePros,
                    ]
                  : activePros;

              return displayPros.map((pro) => {
                const isSelected = selectedProfessional?.id === pro.id;
                return (
                  <div
                    key={pro.id}
                    id={`pro-item-${pro.id}`}
                    onClick={() => handleSelectProfessional(pro)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md ${pro.avatarColor || 'bg-stone-800 text-blue-400 border border-blue-500/30'}`}
                        >
                          {pro.id === 'qualquer' ? <User className="w-6 h-6 text-blue-400" /> : pro.initials}
                        </div>

                        <div>
                          <h3 className="font-bold text-stone-100 text-base">{pro.name}</h3>
                          <p className="text-stone-400 text-xs mt-0.5">{pro.role}</p>
                          <p className="text-blue-400/90 text-[11px] mt-1 font-medium flex items-center gap-1">
                            <Scissors className="w-3 h-3" /> {pro.specialty}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-stone-700 bg-stone-800/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 3: ESCOLHA O DIA */}
        {/* ======================================================== */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-stone-400">
              Selecione uma data para ver os horários disponíveis:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {availableDays.map((day) => {
                const isSelected = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    id={`day-select-${day.dateStr}`}
                    type="button"
                    onClick={() => handleSelectDay(day.dateStr)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-blue-500/50 hover:bg-stone-800'
                    }`}
                  >
                    <span
                      className={`text-[11px] uppercase font-bold tracking-wider ${
                        isSelected ? 'text-white' : 'text-blue-400'
                      }`}
                    >
                      {day.isToday ? 'Hoje' : day.isTomorrow ? 'Amanhã' : day.dayName}
                    </span>
                    <span className="text-xl font-extrabold my-0.5">{day.dayNumber}</span>
                    <span
                      className={`text-[11px] font-medium ${
                        isSelected ? 'text-blue-100' : 'text-stone-400'
                      }`}
                    >
                      {day.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 4: ESCOLHA O HORÁRIO */}
        {/* ======================================================== */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-stone-900/60 p-3 rounded-xl border border-stone-800">
              <span className="text-xs text-stone-400">Data selecionada:</span>
              <span className="text-xs font-bold text-blue-400">
                {formatDatePortuguese(selectedDate)}
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-8 text-center bg-stone-900/40 rounded-2xl border border-stone-800 my-4">
                <AlertCircle className="w-10 h-10 text-stone-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-200">Nenhum horário livre nesta data</h4>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  Todos os horários deste profissional já foram preenchidos para este dia ou ele está de folga.
                </p>
                <button
                  onClick={() => setStep(3)}
                  className="mt-4 px-4 py-2 bg-blue-950/40 text-blue-400 text-xs font-bold rounded-xl border border-blue-800/60 hover:bg-blue-900/40 cursor-pointer"
                >
                  Escolher outro dia
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Manhã */}
                {groupedSlots.morning.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Manhã (09:00 - 12:00)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {groupedSlots.morning.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            id={`time-slot-${slot.replace(':', '-')}`}
                            type="button"
                            onClick={() => handleSelectTime(slot)}
                            className={`py-2.5 px-2 rounded-xl border text-center text-sm font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-md shadow-blue-600/30'
                                : 'bg-stone-900 border-stone-800 text-stone-100 hover:border-blue-500/50 hover:bg-stone-800'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tarde */}
                {groupedSlots.afternoon.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Tarde (13:00 - 18:00)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {groupedSlots.afternoon.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            id={`time-slot-${slot.replace(':', '-')}`}
                            type="button"
                            onClick={() => handleSelectTime(slot)}
                            className={`py-2.5 px-2 rounded-xl border text-center text-sm font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-md shadow-blue-600/30'
                                : 'bg-stone-900 border-stone-800 text-stone-100 hover:border-blue-500/50 hover:bg-stone-800'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Noite */}
                {groupedSlots.evening.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Noite (18:00 - 20:00)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {groupedSlots.evening.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            id={`time-slot-${slot.replace(':', '-')}`}
                            type="button"
                            onClick={() => handleSelectTime(slot)}
                            className={`py-2.5 px-2 rounded-xl border text-center text-sm font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-md shadow-blue-600/30'
                                : 'bg-stone-900 border-stone-800 text-stone-100 hover:border-blue-500/50 hover:bg-stone-800'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 5: CONFIRMAÇÃO DO AGENDAMENTO & PAGAMENTO */}
        {/* ======================================================== */}
        {step === 5 && selectedService && selectedProfessional && (
          <div className="space-y-4">
            {/* Cabeçalho da Marca da Barbearia */}
            <div className="flex items-center gap-3 p-3 bg-stone-900/80 border border-stone-800 rounded-2xl">
              <BarbershopLogo config={config} size="sm" showBorder={true} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white uppercase truncate">{cleanBarbershopName(config.name)}</p>
                <p className="text-[11px] text-stone-400 truncate">{config.address}</p>
              </div>
            </div>

            {/* Cartão de Resumo */}
            <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Resumo do Agendamento
                </span>
                <span className="text-xs text-stone-400">
                  Duração: ~{selectedService.durationMinutes} min
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400 text-xs font-medium">Serviço:</span>
                  <span className="font-bold text-white text-right">{selectedService.name}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400 text-xs font-medium">Profissional:</span>
                  <span className="font-bold text-white text-right">{selectedProfessional.name}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400 text-xs font-medium">Data:</span>
                  <span className="font-bold text-white text-right">
                    {formatDatePortuguese(selectedDate)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400 text-xs font-medium">Horário:</span>
                  <span className="font-extrabold text-blue-400 text-base text-right">
                    {selectedTime}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline">
                  <span className="text-stone-400 text-xs font-bold">Valor do Serviço:</span>
                  <span className="text-xl font-extrabold text-white">
                    {formatCurrency(selectedService.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* SEUS DADOS: SE O CLIENTE JÁ ESTIVER LOGADO OU FOR UM VISITANTE VIA LINK */}
            {client ? (
              <div className="p-4 bg-stone-900/90 border border-stone-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block font-medium">Agendando para:</span>
                  <p className="text-sm font-bold text-white">{client.name}</p>
                  <p className="text-xs text-blue-400 font-mono mt-0.5">{client.phone}</p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-medium">
                  Cliente cadastrado
                </div>
              </div>
            ) : (
              <div className="p-4 bg-stone-900 border border-blue-500/40 rounded-2xl space-y-3 shadow-lg shadow-blue-500/5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Seus Dados de Contato</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Informe seu nome e WhatsApp para confirmar a reserva do seu horário.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs text-stone-300 font-medium block mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      id="input-visitor-name"
                      type="text"
                      value={visitorName}
                      onChange={(e) => {
                        setVisitorName(e.target.value);
                        setVisitorError('');
                      }}
                      placeholder="Ex: Carlos Silva"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-300 font-medium block mb-1">
                      Seu Celular / WhatsApp (com DDD) *
                    </label>
                    <input
                      id="input-visitor-phone"
                      type="tel"
                      value={visitorPhone}
                      onChange={(e) => {
                        setVisitorPhone(formatPhoneMask(e.target.value));
                        setVisitorError('');
                      }}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {visitorError && (
                    <p className="text-xs text-red-400 font-semibold bg-red-950/40 border border-red-900/50 rounded-lg p-2">
                      ⚠️ {visitorError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* AVISO CLARO PARA O CLIENTE CASO POSSUA TAXA DE AGENDAMENTO */}
            {feeInfo.hasFee && (
              <div
                id="aviso-taxa-agendamento"
                className="p-4 bg-red-950/30 border-2 border-red-600/50 rounded-2xl space-y-3 shadow-lg shadow-red-600/5"
              >
                <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>⚠️ ATENÇÃO</span>
                </div>

                <div className="text-xs text-stone-200 leading-relaxed space-y-1">
                  <p>
                    Para confirmar seu horário, será cobrada uma taxa de agendamento de{' '}
                    <strong className="text-red-300 font-bold text-sm">
                      {formatCurrency(feeInfo.feeAmount)}
                    </strong>.
                  </p>
                  <p className="text-stone-400 text-[11px]">
                    Essa taxa é referente à reserva do seu horário pelo sistema.
                  </p>
                </div>

                {/* Checkbox Obrigatório */}
                <div className="pt-2 border-t border-red-600/20">
                  <label
                    id="checkbox-concordo-taxa"
                    onClick={() => setFeeAcknowledged(!feeAcknowledged)}
                    className="flex items-start gap-3 cursor-pointer select-none text-xs text-stone-200"
                  >
                    <div
                      className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition shrink-0 ${
                        feeAcknowledged
                          ? 'bg-red-600 border-red-600 text-white font-black'
                          : 'border-stone-600 bg-stone-900'
                      }`}
                    >
                      {feeAcknowledged && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="font-semibold text-red-100">
                      Li e estou ciente da taxa de agendamento.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* PAGAMENTO */}
            {feeInfo.hasFee ? (
              /* SE HOUVER TAXA DE AGENDAMENTO: PAGAMENTO DA TAXA VIA PIX */
              <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Pagamento da Reserva
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 text-[10px] font-bold border border-red-500/30">
                    PIX Obrigatório
                  </span>
                </div>

                {/* Demonstrativo de Valores */}
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Valor do serviço:</span>
                    <span className="font-semibold text-stone-200">{formatCurrency(selectedService.price)}</span>
                  </div>
                  <div className="flex justify-between text-red-400 font-bold">
                    <span>Taxa de agendamento:</span>
                    <span>{formatCurrency(feeInfo.feeAmount)}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-800 flex justify-between text-emerald-400 font-extrabold text-sm">
                    <span>Total pago agora (PIX):</span>
                    <span>{formatCurrency(feeInfo.feeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400 text-[11px] pt-1 border-t border-stone-800">
                    <span>Restante no atendimento:</span>
                    <span className="font-bold text-stone-200">{formatCurrency(feeInfo.remainingAmount)}</span>
                  </div>
                </div>

                {/* Detalhes do PIX */}
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Recebedor:</span>
                    <span className="font-bold text-stone-200 text-right">
                      {cleanBarbershopTitle(config.pixReceiverName || config.name)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Tipo da chave:</span>
                    <span className="font-semibold text-stone-300">
                      {config.pixKeyType || 'Chave'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-stone-400 block mb-1">Chave PIX:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-stone-900 px-3 py-2 rounded-lg border border-stone-800 text-xs font-mono text-blue-300 truncate">
                        {config.pixKey}
                      </div>
                      <button
                        type="button"
                        id="btn-copiar-chave-pix-taxa"
                        onClick={handleCopyPix}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                      >
                        {pixCopied ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar chave PIX</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox: "Já fiz o pagamento" */}
                  <div className="pt-2 border-t border-stone-800">
                    <label
                      id="checkbox-pix-pago-taxa"
                      onClick={() => setIsPixPaidMarked(!isPixPaidMarked)}
                      className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-stone-300"
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isPixPaidMarked
                            ? 'bg-emerald-500 border-emerald-500 text-stone-950'
                            : 'border-stone-700 bg-stone-900'
                        }`}
                      >
                        {isPixPaidMarked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="font-medium text-emerald-400">Já fiz o pagamento</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* SE NÃO HOUVER TAXA: SELEÇÃO LIVRE DE PAGAMENTO */
              <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  Forma de Pagamento
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id="pay-method-pix"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'PIX'
                        ? 'bg-blue-950/50 border-blue-500 text-white'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-blue-400">PIX</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'PIX' ? 'border-blue-500 bg-blue-600' : 'border-stone-700'
                        }`}
                      >
                        {paymentMethod === 'PIX' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white">Pagar via PIX</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">Rápido e prático</span>
                  </button>

                  <button
                    type="button"
                    id="pay-method-local"
                    onClick={() => setPaymentMethod('LOCAL')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'LOCAL'
                        ? 'bg-blue-950/50 border-blue-500 text-white'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Building2 className="w-4 h-4 text-stone-400" />
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'LOCAL' ? 'border-blue-500 bg-blue-600' : 'border-stone-700'
                        }`}
                      >
                        {paymentMethod === 'LOCAL' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white">No local</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">Cartão ou dinheiro</span>
                  </button>
                </div>

                {/* DETALHES DO PIX LIVRE */}
                {paymentMethod === 'PIX' && (
                  <div className="mt-3 p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Recebedor:</span>
                      <span className="text-xs font-bold text-stone-200 text-right">
                        {cleanBarbershopTitle(config.pixReceiverName || config.name)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Tipo da chave:</span>
                      <span className="text-xs font-semibold text-stone-300">
                        {config.pixKeyType || 'Chave'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-stone-400 block mb-1">Chave PIX:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-stone-900 px-3 py-2 rounded-lg border border-stone-800 text-xs font-mono text-blue-300 truncate">
                          {config.pixKey}
                        </div>
                        <button
                          type="button"
                          id="btn-copiar-chave-pix"
                          onClick={handleCopyPix}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                        >
                          {pixCopied ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Checkbox: "Já realizei a transferência PIX" */}
                    <div className="pt-2 border-t border-stone-800">
                      <label
                        id="checkbox-pix-pago"
                        onClick={() => setIsPixPaidMarked(!isPixPaidMarked)}
                        className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-stone-300"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                            isPixPaidMarked
                              ? 'bg-emerald-500 border-emerald-500 text-stone-950'
                              : 'border-stone-700 bg-stone-900'
                          }`}
                        >
                          {isPixPaidMarked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span>Já realizei a transferência PIX</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {config.bookingInstructions && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 text-xs text-blue-200">
                <p className="font-medium leading-relaxed">{config.bookingInstructions}</p>
              </div>
            )}

            <p className="text-[11px] text-stone-400 text-center">
              Ao clicar no botão abaixo, seu horário será imediatamente reservado.
            </p>
          </div>
        )}
      </div>

      {/* Botões de Ação Inferiores */}
      <div className="pt-6 space-y-2">
        {step === 5 ? (
          <div>
            <button
              id="btn-confirmar-agendamento"
              onClick={handleConfirmBooking}
              disabled={isSubmitting || (feeInfo.hasFee && !feeAcknowledged)}
              style={!(feeInfo.hasFee && !feeAcknowledged) ? getBrandButtonStyle(config) : undefined}
              className={`w-full py-4 px-4 font-black tracking-wide text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${getBrandButtonRadiusClass(config)} ${
                feeInfo.hasFee && !feeAcknowledged
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  : 'hover:brightness-110 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <span>Salvando agendamento...</span>
              ) : (
                <span>CONFIRMAR AGENDAMENTO</span>
              )}
            </button>
            {feeInfo.hasFee && !feeAcknowledged && (
              <p className="text-[11px] text-red-400 font-medium text-center mt-2">
                * Marque a opção &quot;Li e estou ciente da taxa de agendamento&quot; acima para continuar.
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handlePrevStep}
              className="py-3 px-4 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              Voltar
            </button>
            <div className="flex-1 text-center flex items-center justify-center text-xs text-stone-400">
              {step === 1 && 'Selecione um serviço para continuar'}
              {step === 2 && 'Selecione o profissional'}
              {step === 3 && 'Selecione o dia do atendimento'}
              {step === 4 && 'Selecione um horário disponível'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
