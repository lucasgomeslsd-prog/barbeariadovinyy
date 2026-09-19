import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  XCircle, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  CalendarX,
  MessageSquare,
  ExternalLink,
  Info,
  BellRing,
  Sparkles,
  Check,
  X,
  Bell
} from 'lucide-react';
import { Appointment, AppointmentStatus, AppointmentStatusChange } from '../types';
import { 
  formatDatePortuguese, 
  formatCurrency, 
  cancelAppointment, 
  generateCancellationWhatsAppMessage,
  getWhatsAppLink,
  getStoredConfig,
  getUnacknowledgedStatusChanges,
  acknowledgeStatusChange,
  acknowledgeAllStatusChanges,
  cleanBarbershopName
} from '../utils/storage';
import { BarbershopLogo } from './common/BarbershopLogo';
import { getBrandButtonStyle, getBrandButtonRadiusClass } from '../utils/theme';

interface MyAppointmentsScreenProps {
  appointments: Appointment[];
  onBackToHome: () => void;
  onGoToBooking: () => void;
  onAppointmentCancelled: () => void;
}

export function MyAppointmentsScreen({
  appointments,
  onBackToHome,
  onGoToBooking,
  onAppointmentCancelled,
}: MyAppointmentsScreenProps) {
  const config = getStoredConfig();

  // Estado para modal de cancelamento
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelFeedback, setCancelFeedback] = useState<{
    appointment: Appointment;
    whatsAppUrl: string;
  } | null>(null);

  // Alertas locais de mudança de status (ex: Pendente -> Confirmado)
  const [unseenChanges, setUnseenChanges] = useState<AppointmentStatusChange[]>(() => {
    return getUnacknowledgedStatusChanges(appointments);
  });

  // Atualiza e sincroniza notificações quando os agendamentos mudarem ou houver sync
  useEffect(() => {
    const updateChanges = () => {
      const changes = getUnacknowledgedStatusChanges(appointments);
      setUnseenChanges(changes);

      // Dispara Notificação Web se suportada e permitida pelo usuário
      if (changes.length > 0 && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            const first = changes[0];
            const target = appointments.find((a) => a.id === first.appointmentId);
            new Notification(`Barbearia: Agendamento ${first.newStatus}!`, {
              body: target 
                ? `${target.serviceName} em ${formatDatePortuguese(target.date)} às ${target.time} está agora ${first.newStatus}.`
                : `Seu horário foi atualizado para ${first.newStatus}.`,
              icon: '/logo_vinicius.jpg',
            });
          } catch {}
        }
      }
    };

    updateChanges();

    const handleSync = () => {
      updateChanges();
    };

    window.addEventListener('barbershop_sync', handleSync);
    return () => {
      window.removeEventListener('barbershop_sync', handleSync);
    };
  }, [appointments]);

  const handleDismissChange = (appointmentId: string, currentStatus: AppointmentStatus) => {
    acknowledgeStatusChange(appointmentId, currentStatus);
    setUnseenChanges((prev) => prev.filter((c) => c.appointmentId !== appointmentId));
  };

  const handleDismissAll = () => {
    acknowledgeAllStatusChanges(appointments);
    setUnseenChanges([]);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          new Notification('Notificações ativadas!', {
            body: 'Você receberá avisos quando seus horários forem confirmados ou alterados.',
          });
        }
      } catch {}
    }
  };

  // Verificação de prazo mínimo de cancelamento em horas
  const checkCanCancel = (app: Appointment): { allowed: boolean; reason?: string } => {
    if (app.status === 'Cancelado' || app.status === 'Cancelado pelo cliente' || app.status === 'Concluído') {
      return { allowed: false, reason: 'Este agendamento já foi finalizado ou cancelado.' };
    }

    if (config.allowClientCancellation === false) {
      return { 
        allowed: false, 
        reason: 'O cancelamento automático pelo aplicativo foi desativado pela barbearia. Por favor, entre em contato direto pelo WhatsApp.' 
      };
    }

    const minHours = config.cancellationMinHours ?? 2;
    if (minHours > 0) {
      try {
        const [year, month, day] = app.date.split('-').map(Number);
        const [hours, minutes] = app.time.split(':').map(Number);
        const appDate = new Date(year, month - 1, day, hours, minutes);
        const now = new Date();
        const diffHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < minHours) {
          return {
            allowed: false,
            reason: `Cancelamentos devem ser feitos com no mínimo ${minHours}h de antecedência. Entre em contato com a barbearia pelo WhatsApp para suporte.`
          };
        }
      } catch {
        // Ignora erro de parsing
      }
    }

    return { allowed: true };
  };

  const handleStartCancel = (app: Appointment) => {
    const check = checkCanCancel(app);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }
    setCancelReason('');
    setCancelingAppointment(app);
  };

  const handleConfirmCancel = () => {
    if (!cancelingAppointment) return;

    const reasonMode = config.cancellationReasonMode || 'optional';
    if (reasonMode === 'required' && !cancelReason.trim()) {
      alert('Por favor, informe o motivo do cancelamento.');
      return;
    }

    const targetApp = cancelingAppointment;
    const success = cancelAppointment(targetApp.id, cancelReason, 'cliente');

    if (success) {
      // Gera mensagem de WhatsApp para a Barbearia
      const barbershopPhone = config.whatsapp || config.phone || '11987654321';
      const encodedMsg = generateCancellationWhatsAppMessage(
        targetApp,
        cancelReason,
        config.msgBookingCancelledByClient
      );
      const whatsAppUrl = getWhatsAppLink(barbershopPhone, encodedMsg);

      // Envia imediatamente para o WhatsApp da barbearia
      if (config.sendWhatsAppOnCancel !== false) {
        try {
          window.open(whatsAppUrl, '_blank');
        } catch {
          // Navegador bloqueou popup, fallback no modal
        }
      }

      setCancelingAppointment(null);
      setCancelFeedback({
        appointment: targetApp,
        whatsAppUrl,
      });
      onAppointmentCancelled();
    }
  };

  // Cores e estilos do Status conforme especificação
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Confirmado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Confirmado
          </span>
        );
      case 'Pendente':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'Cancelado pelo cliente':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelado pelo cliente
          </span>
        );
      case 'Cancelado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelado pela barbearia
          </span>
        );
      case 'Concluído':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-stone-700/60 text-stone-300 text-xs font-medium border border-stone-600">
            Concluído
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col justify-between">
      <div>
        {/* Header com Voltar e Logo da Barbearia */}
        <div className="flex items-center justify-between mb-6">
          <button
            id="btn-appointments-voltar"
            onClick={onBackToHome}
            className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Voltar para a página inicial"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mx-2 min-w-0">
            <BarbershopLogo config={config} size="sm" showBorder={true} />
            <div className="text-left min-w-0">
              <h1 className="text-base font-bold text-white leading-tight truncate">
                {config.myAppointmentsButtonText || 'Meus Agendamentos'}
              </h1>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider truncate">{cleanBarbershopName(config.name)}</p>
            </div>
          </div>

          <button
            id="btn-appointments-novo"
            onClick={onGoToBooking}
            className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Agendar novo horário"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso informativo de cancelamento configurado pelo Admin */}
        {config.cancellationNoticeText && (
          <div className="mb-4 p-3 bg-stone-900/90 border border-stone-800 rounded-xl flex items-start gap-2.5 text-xs text-stone-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>{config.cancellationNoticeText}</p>
          </div>
        )}

        {/* Banner de Notificação Local de Mudança de Status */}
        {unseenChanges.length > 0 && (
          <div
            id="client-status-change-alert-banner"
            className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-stone-900 to-stone-900 border border-emerald-500/50 shadow-xl shadow-emerald-950/40 animate-fadeIn"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      Atualização de Agendamento
                    </span>
                  </div>
                  <button
                    onClick={handleDismissAll}
                    className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                    title="Dispensar avisos"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {unseenChanges.length === 1 ? (
                  (() => {
                    const ch = unseenChanges[0];
                    const app = appointments.find((a) => a.id === ch.appointmentId);
                    const isConfirmed = ch.newStatus === 'Confirmado';
                    return (
                      <div className="mt-1 text-xs text-stone-200 space-y-1">
                        <p className="leading-relaxed font-medium">
                          {isConfirmed ? '🎉 Ótima notícia! ' : '🔔 '}
                          Seu agendamento de <strong className="text-white">{app?.serviceName || 'serviço'}</strong> para{' '}
                          <strong className="text-white">{app ? formatDatePortuguese(app.date) : ''}</strong> às{' '}
                          <strong className="text-emerald-300 font-bold">{app?.time}</strong> foi atualizado para:
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border mt-0.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Status: {ch.newStatus}</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="mt-1 text-xs text-stone-200">
                    <p className="leading-relaxed">
                      Você tem <strong className="text-emerald-400 font-bold">{unseenChanges.length}</strong> horários com novos status atualizados pela barbearia!
                    </p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    id="btn-dismiss-all-status-alerts"
                    onClick={handleDismissAll}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Marcar como visto
                  </button>
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
                    <button
                      onClick={handleRequestNotificationPermission}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition flex items-center gap-1 cursor-pointer border border-stone-700"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      Ativar avisos no aparelho
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Agendamentos */}
        {appointments.length === 0 ? (
          <div className="py-12 px-6 bg-stone-900/60 border border-stone-800 rounded-3xl text-center my-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-800/80 text-stone-400 flex items-center justify-center mx-auto">
              <CalendarX className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Você não tem agendamentos</h2>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                Seus horários marcados na BARBEARIA DO VINICIUS aparecerão aqui.
              </p>
            </div>
            <button
              id="btn-primeiro-agendamento"
              onClick={onGoToBooking}
              className="mt-2 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Agendar Horário Agora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => {
              const canCancel = app.status === 'Confirmado' || app.status === 'Pendente';
              const isCancelled = app.status === 'Cancelado' || app.status === 'Cancelado pelo cliente';
              const statusChange = unseenChanges.find((c) => c.appointmentId === app.id);
              const hasNewStatus = Boolean(statusChange);
              const isConfirmedChange = statusChange?.newStatus === 'Confirmado';

              return (
                <div
                  key={app.id}
                  id={`appointment-card-${app.id}`}
                  className={`p-5 bg-stone-900 border rounded-2xl shadow-lg space-y-3 transition relative ${
                    hasNewStatus
                      ? isConfirmedChange
                        ? 'border-emerald-500/60 ring-2 ring-emerald-500/40 shadow-emerald-500/10'
                        : 'border-amber-500/60 ring-2 ring-amber-500/40 shadow-amber-500/10'
                      : isCancelled
                      ? 'border-stone-800/60 opacity-85'
                      : 'border-stone-800'
                  }`}
                >
                  {/* Status e Valor */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(app.status)}
                      {hasNewStatus && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 shadow-sm animate-pulse ${
                            isConfirmedChange
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          Novo Status!
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-white block">
                        {formatCurrency(app.price)}
                      </span>
                      {app.paymentMethod && (
                        <span className="text-[10px] text-blue-400/90 font-medium">
                          {app.paymentMethod === 'PIX' ? 'PIX' : 'No local'} • {app.paymentStatus || 'Pendente'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações: Serviço, Profissional, Horário, Data */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-stone-400 block">
                        Serviço
                      </span>
                      <p className="font-bold text-stone-100 text-base">{app.serviceName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-stone-400 block">
                          Profissional
                        </span>
                        <div className="flex items-center gap-1.5 text-stone-200 font-medium">
                          <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{app.professionalName}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] uppercase font-semibold text-stone-400 block">
                          Horário
                        </span>
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{app.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-[11px] uppercase font-semibold text-stone-400 block">
                        Data
                      </span>
                      <div className="flex items-center gap-1.5 text-stone-300 font-medium text-xs">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{formatDatePortuguese(app.date)}</span>
                      </div>
                    </div>

                    {/* Detalhe da Notificação de Mudança de Status */}
                    {statusChange && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2.5 text-xs animate-fadeIn">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <BellRing className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                          <div className="min-w-0">
                            <p className="font-bold text-emerald-300 text-xs">
                              {statusChange.newStatus === 'Confirmado'
                                ? 'Status Confirmado pela Barbearia!'
                                : `Status atualizado para ${statusChange.newStatus}!`}
                            </p>
                            <p className="text-[11px] text-stone-300">
                              Status anterior: <span className="line-through text-stone-400">{statusChange.oldStatus}</span> → <strong className="text-white">{statusChange.newStatus}</strong>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDismissChange(app.id, app.status)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shrink-0 cursor-pointer transition flex items-center gap-1"
                          title="Marcar como visto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Entendi
                        </button>
                      </div>
                    )}

                    {/* Histórico do Cancelamento se cancelado */}
                    {isCancelled && (
                      <div className="mt-3 p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-stone-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {app.cancelledBy === 'cliente'
                              ? 'Cancelado pelo cliente'
                              : 'Cancelado pela barbearia'}
                          </span>
                        </div>
                        {app.cancelledAt && (
                          <p className="text-[11px] text-stone-400">
                            Cancelado em:{' '}
                            {new Date(app.cancelledAt).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </p>
                        )}
                        {app.cancelReason && (
                          <p className="text-[11px] text-stone-300 italic">
                            Motivo: "{app.cancelReason}"
                          </p>
                        )}
                        <p className="text-[10px] text-emerald-400/90 font-medium pt-0.5">
                          ✓ Horário liberado na agenda
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Opção solicitada: "Cancelar agendamento" */}
                  {canCancel && (
                    <div className="pt-3 border-t border-stone-800">
                      <button
                        id={`btn-cancelar-${app.id}`}
                        type="button"
                        onClick={() => handleStartCancel(app)}
                        className="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancelar agendamento</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão Inferior de Agendamento Rápido */}
      <div className="pt-6">
        <button
          id="btn-appointments-novo-bottom"
          onClick={onGoToBooking}
          style={getBrandButtonStyle(config)}
          className={`w-full py-3.5 font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-[0.98] ${getBrandButtonRadiusClass(config)}`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{config.bookingButtonText || 'Novo Agendamento'}</span>
        </button>
      </div>

      {/* Modal de Confirmação de Cancelamento conforme solicitado */}
      {cancelingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-left">
            
            {/* Logo da Barbearia no Modal de Cancelamento */}
            <div className="flex flex-col items-center mb-4">
              <BarbershopLogo config={config} size="lg" showBorder={true} className="mb-2" />
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">{cleanBarbershopName(config.name)}</span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white text-center">
              Deseja realmente cancelar este agendamento?
            </h2>
            <p className="text-xs text-stone-400 mt-2 text-center">
              Você está prestes a cancelar o serviço{' '}
              <strong className="text-stone-200">{cancelingAppointment.serviceName}</strong> com{' '}
              <strong className="text-stone-200">{cancelingAppointment.professionalName}</strong> no dia{' '}
              <strong className="text-stone-200">{formatDatePortuguese(cancelingAppointment.date)}</strong> às{' '}
              <strong className="text-blue-400">{cancelingAppointment.time}</strong>.
            </p>

            {/* Campo para informar Motivo */}
            <div className="mt-4 space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-300 flex items-center justify-between">
                <span>Motivo do cancelamento:</span>
                <span className="text-[10px] text-stone-400">
                  {config.cancellationReasonMode === 'required' ? '(Obrigatório)' : '(Opcional)'}
                </span>
              </label>
              <textarea
                id="input-motivo-cancelamento"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Tive um imprevisto / Compromisso urgente..."
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            {/* Regras e avisos de cancelamento */}
            <div className="mt-4 p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1 text-[11px] text-stone-400">
              <div className="flex items-center gap-1.5 text-stone-300">
                <span className="text-emerald-400">✓</span>
                <span>O horário será liberado na agenda para outros clientes.</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-300">
                <span className="text-emerald-400">✓</span>
                <span>A barbearia ({config.name}) será informada via WhatsApp e Painel.</span>
              </div>
            </div>

            <div className="space-y-2.5 mt-6">
              <button
                id="btn-confirmar-cancelamento"
                type="button"
                onClick={handleConfirmCancel}
                className="w-full py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-lg shadow-red-600/20"
              >
                Sim, cancelar agendamento
              </button>
              <button
                id="btn-desistir-cancelamento"
                type="button"
                onClick={() => setCancelingAppointment(null)}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium rounded-xl text-sm transition cursor-pointer"
              >
                Voltar / Manter horário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Feedback do Cancelamento com link de WhatsApp */}
      {cancelFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-white">Agendamento Cancelado!</h2>
            <p className="text-xs text-stone-300 mt-2">
              Seu agendamento foi alterado para <strong>"Cancelado pelo cliente"</strong> e o horário foi liberado com sucesso.
            </p>

            <div className="mt-4 p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-400 text-left space-y-1">
              <p>• Notificação registrada no painel da barbearia.</p>
              <p>• Mensagem de cancelamento formatada para o WhatsApp.</p>
            </div>

            <div className="space-y-2.5 mt-6">
              <a
                id="btn-abrir-whatsapp-barbearia"
                href={cancelFeedback.whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Abrir aviso no WhatsApp da Barbearia</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                id="btn-fechar-cancel-feedback"
                type="button"
                onClick={() => setCancelFeedback(null)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
