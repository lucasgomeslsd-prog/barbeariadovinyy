import { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Scissors, 
  Settings, 
  Clock, 
  DollarSign, 
  Bell, 
  LogOut, 
  ExternalLink, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Check,
  Palette,
  Share2,
  Copy
} from 'lucide-react';
import { Appointment, BarbershopConfig, AdminNotification } from '../../types';
import { 
  formatCurrency, 
  formatDatePortuguese,
  getStoredConfig, 
  getAdminNotifications, 
  markAllNotificationsRead, 
  setAdminLoggedIn, 
  getAllAppointments,
  getClientPortalUrl
} from '../../utils/storage';
import { AdminAgendaTab } from './tabs/AdminAgendaTab';
import { AdminClientsTab } from './tabs/AdminClientsTab';
import { AdminServicesTab } from './tabs/AdminServicesTab';
import { AdminConfigTab } from './tabs/AdminConfigTab';
import { AdminCustomizeClientPortalTab } from './tabs/AdminCustomizeClientPortalTab';

interface AdminDashboardProps {
  onLogout: () => void;
  onGoToClientArea: () => void;
}

type AdminTab = 'agenda' | 'clients' | 'services' | 'config' | 'customize';

export function AdminDashboard({ onLogout, onGoToClientArea }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('agenda');
  const [appointments, setAppointments] = useState<Appointment[]>(getAllAppointments);
  const [config, setConfig] = useState<BarbershopConfig>(getStoredConfig);
  const [notifications, setNotifications] = useState<AdminNotification[]>(getAdminNotifications);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);

  // Copiar link para enviar aos clientes
  const handleShareClientLink = () => {
    const url = getClientPortalUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setLinkCopiedToast(true);
    setTimeout(() => setLinkCopiedToast(false), 3000);
  };

  // Recarregar dados
  const reloadData = () => {
    setAppointments(getAllAppointments());
    setConfig(getStoredConfig());
    setNotifications(getAdminNotifications());
  };

  useEffect(() => {
    const handleSync = () => reloadData();
    window.addEventListener('barbershop_sync', handleSync);
    return () => window.removeEventListener('barbershop_sync', handleSync);
  }, []);

  // Notificações não lidas
  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // KPIs de HOJE:
  // - Agendamentos de hoje
  // - Próximo horário
  // - Quantidade de clientes do dia
  // - Faturamento do dia
  const todayStats = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const todayApps = appointments.filter(
      (a) => a.date === todayStr && a.status !== 'Cancelado'
    );

    // Contagem de agendamentos
    const totalTodayBookings = todayApps.length;

    // Clientes únicos do dia
    const uniqueClients = new Set(todayApps.map((a) => a.clientPhone || a.clientId));
    const clientsCount = uniqueClients.size;

    // Faturamento do dia (somatório do valor dos agendamentos de hoje)
    const dailyRevenue = todayApps.reduce((acc, curr) => acc + curr.price, 0);

    // Próximo horário de hoje a partir da hora atual
    const currentHours = today.getHours();
    const currentMinutes = today.getMinutes();
    const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

    const upcomingToday = todayApps
      .filter((a) => a.time >= currentTimeStr && a.status !== 'Concluído')
      .sort((a, b) => a.time.localeCompare(b.time));

    const nextBooking = upcomingToday[0] || null;

    return {
      totalTodayBookings,
      clientsCount,
      dailyRevenue,
      nextBooking,
    };
  }, [appointments]);

  const handleOpenNotifications = () => {
    setIsNotifModalOpen(true);
    markAllNotificationsRead();
    setNotifications(getAdminNotifications());
  };

  const handleLogoutClick = () => {
    setAdminLoggedIn(false);
    onLogout();
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between">
      <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* HEADER DO ADMIN */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{config.name}</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-400">Painel de Gestão e Operações</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Copiar Link do Cliente */}
            <button
              id="btn-admin-copiar-link"
              type="button"
              onClick={handleShareClientLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition cursor-pointer"
              title="Copiar link para enviar aos clientes"
            >
              {linkCopiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Link do Cliente</span>
                  <span className="sm:hidden">Link</span>
                </>
              )}
            </button>

            {/* Botão Notificações */}
            <button
              id="btn-admin-notificacoes"
              type="button"
              onClick={handleOpenNotifications}
              className="relative p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 transition cursor-pointer"
              title="Notificações da Barbearia"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Botão Ver Área do Cliente */}
            <button
              id="btn-admin-ver-cliente"
              type="button"
              onClick={onGoToClientArea}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 text-xs font-medium transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Área do Cliente</span>
            </button>

            {/* Botão Logout */}
            <button
              id="btn-admin-logout"
              type="button"
              onClick={handleLogoutClick}
              className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 hover:border-red-500/30 transition cursor-pointer"
              title="Sair da administração"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Banner de Envio de Link para Clientes */}
        <div className="mb-6 p-4 rounded-2xl bg-stone-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Link da Página do Cliente</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Toda vez que você enviar este link, o cliente cairá direto no portal de agendamento da sua barbearia.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="btn-copiar-link-banner"
              onClick={handleShareClientLink}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
            >
              {linkCopiedToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{linkCopiedToast ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <a
              id="btn-whatsapp-share-banner"
              href={`https://wa.me/?text=${encodeURIComponent(`Olá! Faça seu agendamento na ${config.name} pelo nosso site: ${getClientPortalUrl()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <span>Enviar via WhatsApp</span>
            </a>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RESUMO DE HOJE (KPIS SOLICITADOS) */}
        {/* ======================================================== */}
        <section className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Agendamentos de Hoje */}
          <div className="p-4 sm:p-5 bg-stone-900 border border-stone-800 rounded-2xl">
            <span className="text-xs text-stone-400 font-semibold block">
              Agendamentos de Hoje
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {todayStats.totalTodayBookings}
              </span>
              <span className="text-xs text-stone-500">horários</span>
            </div>
          </div>

          {/* 2. Próximo Horário */}
          <div className="p-4 sm:p-5 bg-stone-900 border border-stone-800 rounded-2xl">
            <span className="text-xs text-stone-400 font-semibold block">
              Próximo Horário
            </span>
            {todayStats.nextBooking ? (
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-amber-400 block">
                  {todayStats.nextBooking.time}
                </span>
                <span className="text-xs text-stone-300 font-medium truncate block mt-0.5">
                  {todayStats.nextBooking.clientName.split(' ')[0]} ({todayStats.nextBooking.professionalName.split(' ')[0]})
                </span>
              </div>
            ) : (
              <div className="mt-2">
                <span className="text-lg font-bold text-stone-500 block">Nenhum</span>
                <span className="text-xs text-stone-400">pela frente hoje</span>
              </div>
            )}
          </div>

          {/* 3. Clientes do Dia */}
          <div className="p-4 sm:p-5 bg-stone-900 border border-stone-800 rounded-2xl">
            <span className="text-xs text-stone-400 font-semibold block">
              Clientes do Dia
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {todayStats.clientsCount}
              </span>
              <span className="text-xs text-stone-500">pessoas</span>
            </div>
          </div>

          {/* 4. Faturamento do Dia */}
          <div className="p-4 sm:p-5 bg-stone-900 border border-stone-800 rounded-2xl">
            <span className="text-xs text-stone-400 font-semibold block">
              Faturamento do Dia
            </span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {formatCurrency(todayStats.dailyRevenue)}
              </span>
              <span className="text-[11px] text-stone-400 block mt-0.5">previsto hoje</span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* BOTÕES GRANDES (ABAS): AGENDA, CLIENTES, SERVIÇOS, CONFIG, PERSONALIZAR */}
        {/* ======================================================== */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-6">
          {/* Botão Grande 📅 Agenda */}
          <button
            id="admin-btn-agenda"
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[95px] ${
              activeTab === 'agenda'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xl shadow-amber-500/20 font-black'
                : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Calendar className="w-6 h-6" />
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'agenda' ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-800 text-stone-400'
                }`}
              >
                {appointments.length}
              </span>
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight mt-2">Agenda</p>
              <p
                className={`text-[11px] font-normal ${
                  activeTab === 'agenda' ? 'text-stone-900 font-medium' : 'text-stone-400'
                }`}
              >
                Ver e gerenciar horários
              </p>
            </div>
          </button>

          {/* Botão Grande 👥 Clientes */}
          <button
            id="admin-btn-clientes"
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[95px] ${
              activeTab === 'clients'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xl shadow-amber-500/20 font-black'
                : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight mt-2">Clientes</p>
              <p
                className={`text-[11px] font-normal ${
                  activeTab === 'clients' ? 'text-stone-900 font-medium' : 'text-stone-400'
                }`}
              >
                Histórico e contatos
              </p>
            </div>
          </button>

          {/* Botão Grande ✂️ Serviços */}
          <button
            id="admin-btn-servicos"
            type="button"
            onClick={() => setActiveTab('services')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[95px] ${
              activeTab === 'services'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xl shadow-amber-500/20 font-black'
                : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight mt-2">Serviços</p>
              <p
                className={`text-[11px] font-normal ${
                  activeTab === 'services' ? 'text-stone-900 font-medium' : 'text-stone-400'
                }`}
              >
                Preços e durações
              </p>
            </div>
          </button>

          {/* Botão Grande 🎨 Personalizar Portal */}
          <button
            id="admin-btn-personalizar-portal"
            type="button"
            onClick={() => setActiveTab('customize')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[95px] ${
              activeTab === 'customize'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xl shadow-amber-500/20 font-black'
                : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Palette className="w-6 h-6" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Novo
              </span>
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight mt-2">Personalizar</p>
              <p
                className={`text-[11px] font-normal ${
                  activeTab === 'customize' ? 'text-stone-900 font-medium' : 'text-stone-400'
                }`}
              >
                Portal do Cliente
              </p>
            </div>
          </button>

          {/* Botão Grande ⚙️ Configurações */}
          <button
            id="admin-btn-configuracoes"
            type="button"
            onClick={() => setActiveTab('config')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[95px] ${
              activeTab === 'config'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xl shadow-amber-500/20 font-black'
                : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-850'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight mt-2">Configurações</p>
              <p
                className={`text-[11px] font-normal ${
                  activeTab === 'config' ? 'text-stone-900 font-medium' : 'text-stone-400'
                }`}
              >
                PIX, horários e dados
              </p>
            </div>
          </button>
        </section>

        {/* ======================================================== */}
        {/* CONTEÚDO DA ABA ATIVA */}
        {/* ======================================================== */}
        <main>
          {activeTab === 'agenda' && (
            <AdminAgendaTab
              appointments={appointments}
              config={config}
              onRefresh={reloadData}
            />
          )}

          {activeTab === 'clients' && (
            <AdminClientsTab
              appointments={appointments}
              onRefresh={reloadData}
            />
          )}

          {activeTab === 'services' && (
            <AdminServicesTab
              onRefresh={reloadData}
            />
          )}

          {activeTab === 'customize' && (
            <AdminCustomizeClientPortalTab
              config={config}
              onRefresh={reloadData}
              onGoToClientArea={onGoToClientArea}
            />
          )}

          {activeTab === 'config' && (
            <AdminConfigTab
              config={config}
              onRefresh={reloadData}
            />
          )}
        </main>
      </div>

      {/* RODAPÉ DO ADMIN */}
      <footer className="py-4 border-t border-stone-900 text-center text-xs text-stone-500">
        Área Administrativa • BARBEARIA DO VINICIUS • Versão de Gestão Simples
      </footer>

      {/* MODAL DE NOTIFICAÇÕES */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Notificações Recentes</h3>
              </div>
              <button
                onClick={() => setIsNotifModalOpen(false)}
                className="text-stone-400 hover:text-white text-xs cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">
                  Nenhuma notificação recebida no momento.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">
                        {n.action === 'NOVO_AGENDAMENTO' ? 'Novo Agendamento' : 'Cancelamento'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-stone-200 font-medium text-xs">
                      {n.clientName} • {n.serviceName}
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      {formatDatePortuguese(n.date)} às {n.time} • Barbeiro: {n.professionalName}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-stone-500 pt-1">
                      <span>{n.paymentMethod} ({n.paymentStatus})</span>
                      <span className="text-white font-bold">{formatCurrency(n.price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsNotifModalOpen(false)}
              className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Fechar Notificações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
