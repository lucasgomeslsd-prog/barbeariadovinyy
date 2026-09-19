import { useState, useMemo, type FormEvent } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Calendar, 
  Clock, 
  Edit3, 
  History, 
  MessageSquare, 
  Check, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  UserCheck,
  Trash2,
  UserX,
  AlertTriangle,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { Appointment, ClientProfile } from '../../../types';
import { 
  formatDatePortuguese, 
  formatPhoneMask, 
  formatCurrency, 
  getStoredClient, 
  getAllStoredClients,
  saveStoredClient,
  setStoredClientStatus,
  deleteStoredClient,
  getAllAppointments 
} from '../../../utils/storage';

interface AdminClientsTabProps {
  appointments: Appointment[];
  onRefresh: () => void;
}

interface ClientSummary {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'ativo' | 'inativo';
  createdAt?: string;
  totalBookings: number;
  lastBookingDate?: string;
  lastBookingService?: string;
  history: Appointment[];
}

export function AdminClientsTab({ appointments, onRefresh }: AdminClientsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<ClientSummary | null>(null);
  const [editingClient, setEditingClient] = useState<ClientSummary | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  
  // Estados para edição
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Compila lista de clientes cadastrados agregando da lista permanente de clientes e dos agendamentos
  const clientsList = useMemo(() => {
    const clientsMap = new Map<string, ClientSummary>();

    // 1. Clientes registrados no sistema permanente (banco de dados/storage)
    const storedClients = getAllStoredClients();
    storedClients.forEach((c) => {
      const key = c.phone.replace(/\D/g, '') || c.id;
      clientsMap.set(key, {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        status: c.status || 'ativo',
        createdAt: c.createdAt,
        totalBookings: 0,
        history: [],
      });
    });

    // 2. Cliente ativo atual caso ainda não esteja na lista
    const currentClient = getStoredClient();
    if (currentClient) {
      const key = currentClient.phone.replace(/\D/g, '') || currentClient.id;
      if (!clientsMap.has(key)) {
        clientsMap.set(key, {
          id: currentClient.id,
          name: currentClient.name,
          phone: currentClient.phone,
          email: currentClient.email,
          status: currentClient.status || 'ativo',
          createdAt: currentClient.createdAt,
          totalBookings: 0,
          history: [],
        });
      }
    }

    // 3. Agrega histórico de todos os agendamentos registrados
    appointments.forEach((app) => {
      const key = app.clientPhone.replace(/\D/g, '') || app.clientId;
      const existing = clientsMap.get(key);

      if (existing) {
        existing.history.push(app);
        existing.totalBookings += 1;
        if (!existing.name && app.clientName) {
          existing.name = app.clientName;
        }
      } else {
        clientsMap.set(key, {
          id: app.clientId,
          name: app.clientName,
          phone: app.clientPhone,
          status: 'ativo',
          totalBookings: 1,
          history: [app],
        });
      }
    });

    // Ordena histórico de cada cliente e define o último agendamento
    const result: ClientSummary[] = [];
    clientsMap.forEach((c) => {
      c.history.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
      if (c.history.length > 0) {
        c.lastBookingDate = c.history[0].date;
        c.lastBookingService = c.history[0].serviceName;
      }
      result.push(c);
    });

    // Ordena por maior número de agendamentos e depois alfabeticamente
    return result.sort((a, b) => b.totalBookings - a.totalBookings || a.name.localeCompare(b.name));
  }, [appointments]);

  // Filtra por termo de busca e status
  const filteredClients = useMemo(() => {
    return clientsList.filter((c) => {
      const matchesSearch = !searchTerm.trim() || 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clientsList, searchTerm, statusFilter]);

  // Iniciar edição
  const handleOpenEdit = (client: ClientSummary) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditPhone(client.phone);
    setEditEmail(client.email || '');
    setEditStatus(client.status || 'ativo');
  };

  // Alternar status (Ativar / Inativar)
  const handleToggleStatus = (client: ClientSummary) => {
    const nextStatus: 'ativo' | 'inativo' = client.status === 'inativo' ? 'ativo' : 'inativo';
    setStoredClientStatus(client.id, nextStatus);
    onRefresh();
  };

  // Confirmar exclusão definitiva
  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    deleteStoredClient(clientToDelete.id);
    setClientToDelete(null);
    onRefresh();
  };

  // Salvar edição
  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editName.trim() || !editPhone.trim()) return;

    // Atualiza cliente local e permanente
    const updatedClientProfile: ClientProfile = {
      id: editingClient.id,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || '',
      status: editStatus,
      createdAt: editingClient.createdAt || new Date().toISOString(),
    };
    saveStoredClient(updatedClientProfile);

    // Atualiza nos agendamentos vinculados
    const allApps = getAllAppointments();
    let changed = false;
    const updatedApps = allApps.map((a) => {
      if (a.clientId === editingClient.id || a.clientPhone.replace(/\D/g, '') === editingClient.phone.replace(/\D/g, '')) {
        changed = true;
        return {
          ...a,
          clientName: editName.trim(),
          clientPhone: editPhone.trim(),
        };
      }
      return a;
    });

    if (changed) {
      localStorage.setItem('barbershop_appointments', JSON.stringify(updatedApps));
    }

    setEditingClient(null);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {/* Topo com Barra de Busca e Filtros */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Clientes Cadastrados ({filteredClients.length})
          </span>
          <div className="flex gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'todos' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              Todos ({clientsList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ativo')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'ativo' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              Ativos ({clientsList.filter((c) => c.status !== 'inativo').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inativo')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'inativo' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              Inativos ({clientsList.filter((c) => c.status === 'inativo').length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
          <input
            id="search-clients-input"
            type="text"
            placeholder="Pesquisar por nome, WhatsApp ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="p-8 text-center bg-stone-900/50 border border-stone-800 rounded-3xl space-y-2">
          <Users className="w-10 h-10 text-stone-600 mx-auto" />
          <h4 className="text-sm font-bold text-stone-300">Nenhum cliente encontrado</h4>
          <p className="text-xs text-stone-500">Tente buscar por outro termo ou limpar os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredClients.map((client) => {
            const cleanPhone = client.phone.replace(/\D/g, '');
            const whatsAppLink = `https://wa.me/55${cleanPhone}`;
            const isInactive = client.status === 'inativo';

            return (
              <div
                key={client.phone + client.id}
                id={`client-card-${cleanPhone}`}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  isInactive 
                    ? 'bg-stone-950/60 border-stone-900 opacity-75' 
                    : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-extrabold border ${
                      isInactive 
                        ? 'bg-stone-800 text-stone-500 border-stone-700' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{client.name}</h4>
                        {isInactive ? (
                          <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700 text-[10px] font-bold">
                            Inativo
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-500" />
                        {formatPhoneMask(client.phone)}
                      </p>
                      {client.email && (
                        <p className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-600" />
                          {client.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações Administrativas */}
                  <div className="flex items-center gap-1">
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir WhatsApp do Cliente"
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    
                    <button
                      onClick={() => handleOpenEdit(client)}
                      title="Editar dados"
                      className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(client)}
                      title={isInactive ? "Reativar cliente" : "Inativar cliente"}
                      className={`p-2 rounded-lg transition cursor-pointer border ${
                        isInactive
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isInactive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setClientToDelete(client)}
                      title="Excluir cliente definitivamente"
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Métricas do Cliente */}
                <div className="pt-2 border-t border-stone-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-500 text-[11px] block">Total de agendamentos:</span>
                    <span className="font-extrabold text-amber-400 text-sm">
                      {client.totalBookings} {client.totalBookings === 1 ? 'horário' : 'horários'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[11px] block">Último agendamento:</span>
                    <span className="font-medium text-stone-300 text-xs truncate block">
                      {client.lastBookingDate ? formatDatePortuguese(client.lastBookingDate) : 'Nenhum'}
                    </span>
                  </div>
                </div>

                {/* Botão Ver Histórico */}
                <button
                  type="button"
                  id={`btn-historico-${cleanPhone}`}
                  onClick={() => setSelectedClientForHistory(client)}
                  className="w-full py-2 bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl text-xs font-semibold border border-stone-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Histórico Completo ({client.history.length})</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (ADM) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-stone-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Excluir Cliente?</h3>
              <p className="text-xs text-stone-400">
                Tem certeza que deseja remover o cadastro de <strong className="text-white">{clientToDelete.name}</strong>?
              </p>
              <p className="text-[11px] text-stone-500 pt-1">
                Dica: Se você não quiser apagar os registros, você pode apenas <span className="text-amber-400">Inativar</span> o cliente.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Agendamentos do Cliente */}
      {selectedClientForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  Histórico de {selectedClientForHistory.name}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {formatPhoneMask(selectedClientForHistory.phone)} • {selectedClientForHistory.history.length} agendamentos registrados
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForHistory(null)}
                className="text-stone-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {selectedClientForHistory.history.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-6">
                  Nenhum agendamento registrado ainda para este cliente.
                </p>
              ) : (
                selectedClientForHistory.history.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-200">{app.serviceName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          app.status === 'Confirmado'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : app.status === 'Pendente'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : app.status === 'Concluído'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-stone-400 text-[11px]">
                      <span>
                        {formatDatePortuguese(app.date)} às <strong className="text-amber-400">{app.time}</strong>
                      </span>
                      <span>Barbeiro: {app.professionalName}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-stone-900 text-[11px]">
                      <span className="text-stone-500">
                        {app.paymentMethod === 'PIX' ? 'PIX' : 'Local'}: {app.paymentStatus}
                      </span>
                      <span className="font-extrabold text-white">
                        {formatCurrency(app.price)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedClientForHistory(null)}
              className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Fechar Histórico
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edição de Cliente */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-stone-800">
              <Edit3 className="w-4 h-4 text-amber-400" />
              Editar Informações do Cliente
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Celular / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="cliente@exemplo.com"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Status da Conta
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'ativo' | 'inativo')}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
