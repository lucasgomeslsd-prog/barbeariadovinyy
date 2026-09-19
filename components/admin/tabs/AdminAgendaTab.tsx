import { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Check, 
  MessageSquare, 
  RefreshCw, 
  Search, 
  Filter, 
  CreditCard,
  Building2,
  CalendarDays,
  AlertCircle,
  Sliders,
  Trash2
} from 'lucide-react';
import { Appointment, AppointmentStatus, PaymentStatus, BarbershopConfig } from '../../../types';
import { 
  formatCurrency, 
  formatDatePortuguese, 
  updateAppointmentStatus, 
  rescheduleAppointment,
  deleteAppointmentFromDB,
  generateWhatsAppMessage, 
  getWhatsAppLink,
  formatPhoneMask
} from '../../../utils/storage';
import { getAvailableDays, getAvailableTimeSlots } from '../../../data/barberData';
import { AdminDisponibilidadeView } from './AdminDisponibilidadeView';

interface AdminAgendaTabProps {
  appointments: Appointment[];
  config: BarbershopConfig;
  onRefresh: () => void;
}

export function AdminAgendaTab({ appointments, config, onRefresh }: AdminAgendaTabProps) {
  // Sub-abas dentro da área AGENDA do Admin
  const [subTab, setSubTab] = useState<'appointments' | 'availability'>('appointments');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  // Filtros
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de Reagendamento
  const [reschedulingApp, setReschedulingApp] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<string>(todayStr);
  const [newTime, setNewTime] = useState<string>('');

  // Modal de Exclusão Definitiva
  const [appToDelete, setAppToDelete] = useState<Appointment | null>(null);

  const handleConfirmDeleteApp = () => {
    if (!appToDelete) return;
    deleteAppointmentFromDB(appToDelete.id);
    setAppToDelete(null);
    onRefresh();
  };

  // Lista de agendamentos filtrados
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Filtro de data
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (dateFilter === 'tomorrow' && app.date !== tomorrowStr) return false;
      if (dateFilter === 'custom' && app.date !== customDate) return false;

      // Filtro de status
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Filtro de busca (nome do cliente, serviço ou telefone)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = app.clientName.toLowerCase().includes(term);
        const matchPhone = app.clientPhone.includes(term);
        const matchService = app.serviceName.toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchService) return false;
      }

      return true;
    }).sort((a, b) => {
      // Ordena por data e depois horário crescente
      return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    });
  }, [appointments, dateFilter, customDate, todayStr, tomorrowStr, statusFilter, searchTerm]);

  // Ações de alteração de status
  const handleStatusChange = (appId: string, newStatus: AppointmentStatus, paymentStatus?: PaymentStatus) => {
    updateAppointmentStatus(appId, newStatus, paymentStatus);
    onRefresh();
  };

  // Alternar pagamento
  const handleTogglePayment = (app: Appointment) => {
    const nextStatus: PaymentStatus =
      app.paymentStatus === 'Pagamento confirmado'
        ? (app.paymentMethod === 'PIX' ? 'PIX enviado' : 'Pagar no estabelecimento')
        : 'Pagamento confirmado';
    updateAppointmentStatus(app.id, app.status, nextStatus);
    onRefresh();
  };

  // Confirmar reagendamento
  const handleConfirmReschedule = () => {
    if (!reschedulingApp || !newDate || !newTime) return;
    rescheduleAppointment(reschedulingApp.id, newDate, newTime);
    setReschedulingApp(null);
    onRefresh();
  };

  // Horários disponíveis para a nova data no reagendamento
  const availableSlotsForReschedule = useMemo(() => {
    if (!reschedulingApp || !newDate) return [];
    return getAvailableTimeSlots(
      newDate,
      reschedulingApp.professionalId,
      appointments.filter((a) => a.id !== reschedulingApp.id),
      config
    );
  }, [reschedulingApp, newDate, appointments, config]);

  return (
    <div className="space-y-5">
      {/* SELETOR DE MODO NA AGENDA DO ADMIN */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-stone-900/90 border border-stone-800 p-1.5 rounded-2xl gap-2">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            id="tab-agenda-agendamentos"
            type="button"
            onClick={() => setSubTab('appointments')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'appointments'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Agendamentos Marcados
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                subTab === 'appointments' ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-stone-400'
              }`}
            >
              {appointments.length}
            </span>
          </button>

          <button
            id="tab-agenda-disponibilidade"
            type="button"
            onClick={() => setSubTab('availability')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'availability'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Disponibilidade para Clientes
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                subTab === 'availability'
                  ? 'bg-stone-950 text-amber-400'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              Configurar
            </span>
          </button>
        </div>

        {subTab === 'appointments' && (
          <div className="text-right px-3 hidden sm:block">
            <span className="text-xs text-stone-400">
              Total hoje: <strong className="text-white">{appointments.filter((a) => a.date === todayStr).length}</strong>
            </span>
          </div>
        )}
      </div>

      {/* MODO DISPONIBILIDADE PARA CLIENTES */}
      {subTab === 'availability' && (
        <AdminDisponibilidadeView config={config} onRefresh={onRefresh} />
      )}

      {/* MODO AGENDAMENTOS MARCADOS */}
      {subTab === 'appointments' && (
        <>
          {/* Barra de Filtros de Data */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-amber-400" />
            Visualizar Agenda
          </span>

          <div className="flex items-center gap-1.5">
            <button
              id="filter-date-today"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Hoje
            </button>
            <button
              id="filter-date-tomorrow"
              onClick={() => setDateFilter('tomorrow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dateFilter === 'tomorrow'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Amanhã
            </button>
            <button
              id="filter-date-all"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Todos
            </button>
            <button
              id="filter-date-custom"
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dateFilter === 'custom'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Outro dia
            </button>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
            <span className="text-xs text-stone-400">Escolha a data:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>
        )}

        {/* Busca e Filtro de Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-500" />
            <input
              id="search-agenda-input"
              type="text"
              placeholder="Buscar cliente, serviço ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'Confirmado', 'Pendente', 'Concluído', 'Cancelado'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-stone-200 text-stone-950 font-bold'
                    : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
                }`}
              >
                {st === 'all' ? 'Todos os Status' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista dos Agendamentos */}
      {filteredAppointments.length === 0 ? (
        <div className="p-8 text-center bg-stone-900/50 border border-stone-800 rounded-3xl space-y-2">
          <Clock className="w-10 h-10 text-stone-600 mx-auto" />
          <h4 className="text-sm font-bold text-stone-300">Nenhum agendamento encontrado</h4>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Não há horários marcados com os filtros atuais selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((app) => {
            const isToday = app.date === todayStr;
            const isCancelled = app.status === 'Cancelado';
            const isCompleted = app.status === 'Concluído';
            const isConfirmed = app.status === 'Confirmado';
            const isPending = app.status === 'Pendente';

            // Mensagem formatada do WhatsApp
            const whatsAppMsg = generateWhatsAppMessage(app, true);
            const clientWhatsAppLink = getWhatsAppLink(app.clientPhone, whatsAppMsg);

            return (
              <div
                key={app.id}
                id={`admin-card-app-${app.id}`}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCancelled
                    ? 'bg-stone-950/60 border-stone-900 opacity-60'
                    : isCompleted
                    ? 'bg-stone-900/60 border-stone-800/60'
                    : isToday
                    ? 'bg-stone-900 border-amber-500/40 shadow-lg shadow-black/20'
                    : 'bg-stone-900 border-stone-800'
                }`}
              >
                {/* Linha Superior: Data, Horário, Status e Pagamento */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-sm flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {app.time}
                    </span>
                    <span className="text-xs text-stone-300 font-medium">
                      {formatDatePortuguese(app.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge de Status */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isPending
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : isCompleted
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {app.status}
                    </span>

                    {/* Badge de Pagamento clicável para alternar status */}
                    <button
                      type="button"
                      onClick={() => handleTogglePayment(app)}
                      title="Clique para alternar o status do pagamento"
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 cursor-pointer transition ${
                        app.paymentStatus === 'Pagamento confirmado'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                          : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                      }`}
                    >
                      <span>{app.paymentMethod === 'PIX' ? 'PIX' : 'Local'}:</span>
                      <span>{app.paymentStatus || 'Pendente'}</span>
                    </button>
                  </div>
                </div>

                {/* Dados Principais do Agendamento */}
                <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 block">Cliente:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-stone-100 text-sm">{app.clientName}</span>
                      <a
                        href={`https://wa.me/55${app.clientPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-mono font-medium flex items-center gap-0.5"
                        title="Conversar no WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {formatPhoneMask(app.clientPhone)}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Serviço:</span>
                    <p className="font-bold text-stone-200 mt-0.5">
                      {app.serviceName}{' '}
                      <span className="text-stone-400 font-normal">
                        ({app.serviceDuration} min)
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Profissional:</span>
                    <p className="text-stone-300 mt-0.5 font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-400" />
                      {app.professionalName}
                    </p>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Valor:</span>
                    <p className="text-base font-extrabold text-white mt-0.5">
                      {formatCurrency(app.price)}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação do ADMIN */}
                <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
                  {/* Botão de Enviar agendamento pelo WhatsApp */}
                  <a
                    id={`btn-whatsapp-agenda-${app.id}`}
                    href={clientWhatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-emerald-400/20" />
                    <span>Enviar no WhatsApp</span>
                  </a>

                  {/* Ações de Estado */}
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    {isPending && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'Confirmado')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}

                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'Concluído')}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Concluir</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        onClick={() => {
                          setReschedulingApp(app);
                          setNewDate(app.date);
                          setNewTime('');
                        }}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-400" />
                        <span>Reagendar</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'Cancelado')}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Cancelar</span>
                      </button>
                    )}

                    {isCancelled && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'Confirmado')}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium rounded-xl transition cursor-pointer"
                      >
                        Reativar
                      </button>
                    )}

                    {/* Botão de Exclusão Definitiva do Banco de Dados */}
                    <button
                      type="button"
                      onClick={() => setAppToDelete(app)}
                      className="px-2.5 py-1.5 bg-stone-900 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-500/30 text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1"
                      title="Excluir este agendamento do banco de dados definitivamente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Exclusão Definitiva */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                Excluir Agendamento Definitivamente
              </h3>
              <button
                onClick={() => setAppToDelete(null)}
                className="text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Tem certeza que deseja apagar este agendamento do banco de dados?
              Esta ação removerá o registro permanentemente do sistema e da nuvem.
            </p>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
              <p>
                Cliente: <strong className="text-white">{appToDelete.clientName}</strong>
              </p>
              <p>
                Serviço: <strong className="text-white">{appToDelete.serviceName}</strong>
              </p>
              <p>
                Horário:{' '}
                <strong className="text-amber-400">
                  {appToDelete.date} às {appToDelete.time}
                </strong>
              </p>
            </div>

            <div className="pt-3 border-t border-stone-800 flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDeleteApp}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Sim, Excluir Definitivamente
              </button>
              <button
                type="button"
                onClick={() => setAppToDelete(null)}
                className="px-4 py-3 bg-stone-800 text-stone-300 text-xs rounded-xl hover:bg-stone-700 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reagendamento */}
      {reschedulingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                Reagendar Agendamento
              </h3>
              <button
                onClick={() => setReschedulingApp(null)}
                className="text-stone-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-400 space-y-1">
              <p>
                Cliente: <strong className="text-stone-200">{reschedulingApp.clientName}</strong>
              </p>
              <p>
                Serviço: <strong className="text-stone-200">{reschedulingApp.serviceName}</strong>
              </p>
              <p>
                Profissional: <strong className="text-amber-400">{reschedulingApp.professionalName}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Nova Data
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewTime('');
                  }}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Novo Horário Disponível
                </label>
                {availableSlotsForReschedule.length === 0 ? (
                  <p className="text-xs text-red-400 py-2">
                    Nenhum horário livre nesta data para este profissional.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {availableSlotsForReschedule.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setNewTime(slot)}
                        className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          newTime === slot
                            ? 'bg-amber-500 text-stone-950 border-amber-500'
                            : 'bg-stone-950 border-stone-800 text-stone-200 hover:bg-stone-800'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex gap-2">
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={!newDate || !newTime}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                Confirmar Novo Horário
              </button>
              <button
                type="button"
                onClick={() => setReschedulingApp(null)}
                className="px-4 py-3 bg-stone-800 text-stone-300 text-xs rounded-xl hover:bg-stone-700 cursor-pointer"
              >
                Desistir
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
