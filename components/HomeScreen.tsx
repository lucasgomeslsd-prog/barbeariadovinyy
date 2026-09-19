import { Scissors, Calendar, Clock, User, ChevronRight, CalendarCheck, MapPin, Phone, Instagram, Info, BellRing, Sparkles } from 'lucide-react';
import { ClientProfile, Appointment, BarbershopConfig, AppointmentStatusChange } from '../types';
import { BARBERSHOP_INFO } from '../data/barberData';
import { formatDatePortuguese, getStoredConfig, cleanBarbershopTitle, cleanBarbershopName } from '../utils/storage';
import { BarbershopLogo } from './common/BarbershopLogo';
import { getBrandButtonStyle, getBrandButtonRadiusClass } from '../utils/theme';

interface HomeScreenProps {
  client: ClientProfile | null;
  upcomingAppointment: Appointment | null;
  appointmentsCount: number;
  unacknowledgedStatusChangesCount?: number;
  upcomingStatusChange?: AppointmentStatusChange | null;
  config?: BarbershopConfig;
  onGoToBooking: () => void;
  onGoToAppointments: () => void;
  onOpenProfile: () => void;
  onGoToAdmin?: () => void;
}

export function HomeScreen({
  client,
  upcomingAppointment,
  appointmentsCount,
  unacknowledgedStatusChangesCount,
  upcomingStatusChange,
  config: propConfig,
  onGoToBooking,
  onGoToAppointments,
  onOpenProfile,
  onGoToAdmin,
}: HomeScreenProps) {
  const config = propConfig || getStoredConfig() || BARBERSHOP_INFO;
  // Pega apenas o primeiro nome do cliente para saudação amigável ou Visitante
  const firstName = client ? (client.name.split(' ')[0] || client.name) : 'Visitante';

  // Monta endereço formatado
  const fullAddress = [
    config.address,
    config.number ? `nº ${config.number}` : '',
    config.neighborhood,
    config.city,
    config.state,
  ].filter(Boolean).join(', ') || config.address;

  // Celular limpo para link do WhatsApp
  const cleanPhone = (config.whatsapp || config.phone || '').replace(/\D/g, '');
  const whatsAppLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : undefined;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-8 flex flex-col min-h-screen justify-between">
      <div>
        {/* Top bar com saudação, logo da barbearia e atalho do perfil */}
        <header className="flex items-center justify-between pb-6 border-b border-stone-800/80 mb-6">
          <div className="flex items-center gap-3">
            <BarbershopLogo config={config} size="sm" showBorder={true} />
            <div>
              <p className="text-xs text-stone-400 font-medium">
                {client ? `Olá, ${firstName}` : 'Bem-vindo(a)!'}
              </p>
              <h2 className="text-sm font-bold text-stone-100 uppercase tracking-wide truncate max-w-[170px] sm:max-w-[220px]">
                {cleanBarbershopName(config.name)}
              </h2>
            </div>
          </div>

          <button
            id="btn-open-profile-top"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-300 hover:text-white hover:border-blue-500/50 text-xs font-medium transition cursor-pointer"
            title={client ? 'Meu perfil' : 'Identificar / Entrar'}
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>{client ? 'Perfil' : 'Entrar'}</span>
          </button>
        </header>

        {/* Card Principal da Barbearia (Logo + Nome + Slogan) */}
        {config.showHeroSection !== false && (
          <section className="text-center my-4 py-4 relative rounded-3xl overflow-hidden">
            {config.heroBackground && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
                style={{ backgroundImage: `url(${config.heroBackground})` }}
              />
            )}
            <div className="relative z-10">
              <div className="mb-4 hover:scale-105 transition-transform duration-300 inline-block relative">
                <BarbershopLogo 
                  config={config} 
                  size="2xl" 
                  showBorder={true}
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                {cleanBarbershopTitle(config.clientTopTitle || config.name)}
              </h1>
              {(config.clientSubtitle || config.tagline) && (
                <p className="text-sm text-stone-300 mt-1 max-w-xs mx-auto font-medium">
                  {config.clientSubtitle || config.tagline}
                </p>
              )}

              {config.presentationText && (
                <p className="text-xs text-stone-400 mt-2 max-w-xs mx-auto italic">
                  {config.presentationText}
                </p>
              )}

              {config.showWorkingHoursOnHome !== false && config.workingHours && (
                <div className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-full bg-blue-950/40 border border-blue-900/60 text-blue-200 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{config.workingHours}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Comunicado / Aviso Importante se configurado pelo Admin */}
        {config.showNoticeOnHome !== false && config.informativeNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-blue-950/60 border border-blue-500/40 flex items-start gap-2.5 text-xs text-blue-100 shadow-lg animate-fadeIn">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{config.informativeNotice}</p>
          </div>
        )}

        {/* Notificação de Agendamento Próximo se houver */}
        {config.showUpcomingSection !== false && upcomingAppointment && (
          <div
            className={`mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-stone-900 to-stone-900 border shadow-lg transition ${
              upcomingStatusChange
                ? 'border-emerald-500/60 ring-2 ring-emerald-500/30'
                : 'border-blue-600/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider flex-wrap">
                    <span>Próximo agendamento</span>
                    {upcomingStatusChange && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-bold animate-pulse flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        Status: {upcomingStatusChange.newStatus}!
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">{upcomingAppointment.serviceName}</p>
                  <p className="text-xs text-stone-200">
                    {formatDatePortuguese(upcomingAppointment.date)} às <span className="font-bold text-blue-300">{upcomingAppointment.time}</span>
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Profissional: <span className="text-white font-medium">{upcomingAppointment.professionalName}</span>
                  </p>
                </div>
              </div>

              <button
                id="btn-quick-view-appointment"
                onClick={onGoToAppointments}
                className="text-xs text-blue-400 hover:text-white underline font-semibold shrink-0 pt-1 cursor-pointer"
              >
                Ver
              </button>
            </div>
          </div>
        )}

        {/* Botões Principais Requeridos */}
        <section className="space-y-3.5 my-6">
          {/* Botão "Agendar horário" */}
          {config.showQuickBookingButton !== false && (
            <button
              id="btn-home-agendar"
              onClick={onGoToBooking}
              style={getBrandButtonStyle(config)}
              className={`w-full group p-5 active:scale-[0.99] font-bold shadow-xl flex items-center justify-between transition-all cursor-pointer hover:brightness-110 ${getBrandButtonRadiusClass(config)}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-tight">
                    {config.bookingButtonText || 'Agendar horário'}
                  </p>
                  <p className="text-xs opacity-90 font-medium mt-0.5">
                    Escolha serviço, barbeiro e horário em poucos cliques
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          )}

          {/* Botão "Meus agendamentos" */}
          {config.showMyAppointmentsButton !== false && (
            <button
              id="btn-home-meus-agendamentos"
              onClick={onGoToAppointments}
              className={`w-full group p-5 bg-stone-900 hover:bg-stone-800/90 active:scale-[0.99] border border-blue-950/80 hover:border-blue-600/60 text-stone-100 font-bold shadow-lg shadow-black/40 flex items-center justify-between transition-all cursor-pointer ${getBrandButtonRadiusClass(config)}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-bold leading-tight">
                      {config.myAppointmentsButtonText || 'Meus agendamentos'}
                    </p>
                    {unacknowledgedStatusChangesCount && unacknowledgedStatusChangesCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 text-xs font-bold flex items-center gap-1 animate-pulse shadow-sm shadow-emerald-500/20">
                        <BellRing className="w-3 h-3 text-emerald-400" />
                        Status atualizado!
                      </span>
                    ) : appointmentsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600/25 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                        {appointmentsCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-stone-400 font-normal mt-0.5">
                    Consultar detalhes ou cancelar horários marcados
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-stone-800/80 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-200" />
              </div>
            </button>
          )}
        </section>
      </div>

      {/* Rodapé com Informações da Barbearia */}
      <footer className="pt-6 border-t border-stone-800/80 text-xs text-stone-400 space-y-2.5">
        {config.showAddressOnHome !== false && fullAddress && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span>{fullAddress}</span>
          </div>
        )}

        {config.showPhoneOnHome !== false && (config.whatsapp || config.phone) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-500 shrink-0" />
              <span>WhatsApp: {config.whatsapp || config.phone}</span>
            </div>
            {whatsAppLink && (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-white underline font-semibold text-[11px]"
              >
                Falar no Whats
              </a>
            )}
          </div>
        )}

        {config.showInstagramOnHome !== false && config.instagram && (
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-red-400 shrink-0" />
            <span>{config.instagram}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-stone-500">
            Área exclusiva do cliente • {config.name}
          </p>
          {onGoToAdmin && (
            <button
              id="btn-link-admin-footer"
              type="button"
              onClick={onGoToAdmin}
              className="text-[11px] text-stone-500 hover:text-blue-400 transition cursor-pointer"
            >
              Acesso da Barbearia
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
