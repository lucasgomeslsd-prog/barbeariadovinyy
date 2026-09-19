import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Save, 
  Coffee, 
  Users, 
  Sparkles,
  CalendarOff,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Info,
  Shield,
  Edit3,
  Phone,
  UserPlus,
  UserCheck,
  UserX,
  Briefcase
} from 'lucide-react';
import { 
  BarbershopConfig, 
  DaySchedule, 
  SlotIntervalMinutes, 
  BlockedPeriod, 
  BarberProfessional 
} from '../../../types';
import { 
  saveStoredConfig, 
  getStoredConfig, 
  getStoredProfessionals, 
  saveStoredProfessionals,
  updateStoredProfessional,
  deleteStoredProfessional,
  removeBlockedPeriodFromConfig
} from '../../../utils/storage';
import { DEFAULT_WEEKLY_SCHEDULE, generateSlotsFromRange } from '../../../data/barberData';

interface AdminDisponibilidadeViewProps {
  config: BarbershopConfig;
  onRefresh: () => void;
}

const AVATAR_STYLES = [
  { id: 'amber', label: 'Âmbar / Dourado', classes: 'bg-amber-950 text-amber-300 border border-amber-800' },
  { id: 'stone', label: 'Grafite Clássico', classes: 'bg-stone-800 text-stone-200 border border-stone-700' },
  { id: 'neutral', label: 'Carvão Escuro', classes: 'bg-neutral-800 text-amber-200 border border-neutral-700' },
  { id: 'emerald', label: 'Esmeralda / Verde', classes: 'bg-emerald-950 text-emerald-300 border border-emerald-800' },
  { id: 'blue', label: 'Azul Real', classes: 'bg-blue-950 text-blue-300 border border-blue-800' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'PR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const INTERVAL_OPTIONS: { value: SlotIntervalMinutes; label: string; desc: string }[] = [
  { value: 15, label: '15 minutos', desc: 'Atendimentos rápidos ou procedimentos curtos' },
  { value: 30, label: '30 minutos', desc: 'Padrão mais recomendado para barbearias' },
  { value: 45, label: '45 minutos', desc: 'Ideal para cortes detalhados ou combos' },
  { value: 60, label: '60 minutos (1 hora)', desc: 'Serviços completos ou atendimento premium' },
];

export function AdminDisponibilidadeView({ config: initialConfig, onRefresh }: AdminDisponibilidadeViewProps) {
  // Configuração atual
  const [config, setConfig] = useState<BarbershopConfig>(() => {
    const current = getStoredConfig();
    return {
      ...current,
      weeklySchedule: current.weeklySchedule && current.weeklySchedule.length === 7 
        ? current.weeklySchedule 
        : DEFAULT_WEEKLY_SCHEDULE,
      slotInterval: current.slotInterval || 30,
      blockedPeriods: current.blockedPeriods || [],
    };
  });

  // Lista de barbeiros
  const [professionals, setProfessionals] = useState<BarberProfessional[]>(() => {
    return getStoredProfessionals();
  });

  useEffect(() => {
    const handleSync = () => {
      setProfessionals(getStoredProfessionals());
      setConfig(getStoredConfig());
    };
    window.addEventListener('barbershop_sync', handleSync);
    return () => window.removeEventListener('barbershop_sync', handleSync);
  }, []);

  // Alvo selecionado: 'geral' (barbearia inteira) ou ID de um profissional específico
  const [targetScope, setTargetScope] = useState<string>('geral');

  // Estados de Gerenciamento & Edição de Profissionais
  const [editingPro, setEditingPro] = useState<BarberProfessional | null>(null);
  const [isCreatingPro, setIsCreatingPro] = useState<boolean>(false);
  const [proToDelete, setProToDelete] = useState<BarberProfessional | null>(null);

  // Form states de profissional
  const [proFormName, setProFormName] = useState('');
  const [proFormRole, setProFormRole] = useState('Barbeiro Especialista');
  const [proFormPhone, setProFormPhone] = useState('');
  const [proFormSpecialty, setProFormSpecialty] = useState('');
  const [proFormExperience, setProFormExperience] = useState(3);
  const [proFormStatus, setProFormStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [proFormAvatarColor, setProFormAvatarColor] = useState('bg-amber-950 text-amber-300 border border-amber-800');
  const [proFormHasCustomSchedule, setProFormHasCustomSchedule] = useState(false);

  // Estado de feedback de salvamento
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Estados do formulário de novo bloqueio
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [newBlockDate, setNewBlockDate] = useState<string>(todayStr);
  const [newBlockIsFullDay, setNewBlockIsFullDay] = useState<boolean>(true);
  const [newBlockStartTime, setNewBlockStartTime] = useState<string>('12:00');
  const [newBlockEndTime, setNewBlockEndTime] = useState<string>('14:00');
  const [newBlockReason, setNewBlockReason] = useState<string>('Indisponível');
  const [newBlockTargetPro, setNewBlockTargetPro] = useState<string>('todos');
  const [blockError, setBlockError] = useState<string | null>(null);

  // Profissional ativo quando targetScope !== 'geral'
  const activePro = useMemo(() => {
    if (targetScope === 'geral') return null;
    return professionals.find((p) => p.id === targetScope) || null;
  }, [targetScope, professionals]);

  // Agenda ativa no editor: se for 'geral', é a config.weeklySchedule. Se for profissional, verifica se ele tem agenda própria
  const currentSchedule: DaySchedule[] = useMemo(() => {
    if (activePro && activePro.weeklySchedule && activePro.weeklySchedule.length === 7) {
      return activePro.weeklySchedule;
    }
    return config.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE;
  }, [activePro, config.weeklySchedule]);

  // Manipular alteração de dia na semana
  const handleToggleDay = (dayOfWeek: number) => {
    const updated = currentSchedule.map((d) => {
      if (d.dayOfWeek === dayOfWeek) {
        return { ...d, active: !d.active };
      }
      return d;
    });
    updateActiveSchedule(updated);
  };

  const handleUpdateDayField = (
    dayOfWeek: number, 
    field: keyof DaySchedule, 
    value: string | boolean | undefined
  ) => {
    const updated = currentSchedule.map((d) => {
      if (d.dayOfWeek === dayOfWeek) {
        return { ...d, [field]: value };
      }
      return d;
    });
    updateActiveSchedule(updated);
  };

  const updateActiveSchedule = (newSched: DaySchedule[]) => {
    if (activePro) {
      const updatedPros = professionals.map((p) => {
        if (p.id === activePro.id) {
          return { ...p, weeklySchedule: newSched };
        }
        return p;
      });
      setProfessionals(updatedPros);
    } else {
      setConfig((prev) => ({
        ...prev,
        weeklySchedule: newSched,
      }));
    }
  };

  // Alternar personalização do profissional
  const handleToggleProCustomSchedule = (enabled: boolean) => {
    if (!activePro) return;
    const updatedPros = professionals.map((p) => {
      if (p.id === activePro.id) {
        return {
          ...p,
          weeklySchedule: enabled ? JSON.parse(JSON.stringify(config.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE)) : undefined,
        };
      }
      return p;
    });
    setProfessionals(updatedPros);
  };

  // Alterar intervalo de slots (15, 30, 45, 60)
  const handleSlotIntervalChange = (interval: SlotIntervalMinutes) => {
    setConfig((prev) => ({
      ...prev,
      slotInterval: interval,
    }));
  };

  // Adicionar novo bloqueio
  const handleAddBlockedPeriod = (e: FormEvent) => {
    e.preventDefault();
    setBlockError(null);

    if (!newBlockDate) {
      setBlockError('Selecione uma data para o bloqueio.');
      return;
    }

    if (!newBlockIsFullDay) {
      if (!newBlockStartTime || !newBlockEndTime) {
        setBlockError('Informe os horários de início e fim do bloqueio.');
        return;
      }
      if (newBlockStartTime >= newBlockEndTime) {
        setBlockError('O horário inicial deve ser anterior ao horário final.');
        return;
      }
    }

    const newPeriod: BlockedPeriod = {
      id: `block-${Date.now()}`,
      date: newBlockDate,
      isFullDay: newBlockIsFullDay,
      startTime: newBlockIsFullDay ? undefined : newBlockStartTime,
      endTime: newBlockIsFullDay ? undefined : newBlockEndTime,
      reason: newBlockReason.trim() || 'Indisponível',
      professionalId: newBlockTargetPro,
      createdAt: new Date().toISOString(),
    };

    const updatedBlocks = [...(config.blockedPeriods || []), newPeriod];
    setConfig((prev) => ({
      ...prev,
      blockedPeriods: updatedBlocks,
    }));

    // Resetar campos
    setNewBlockReason('Indisponível');
    setBlockError(null);
  };

  // Remover bloqueio (salva e persiste imediatamente)
  const handleRemoveBlockedPeriod = (periodId: string) => {
    removeBlockedPeriodFromConfig(periodId);
    const updated = (config.blockedPeriods || []).filter((p) => p.id !== periodId);
    const newConfig = {
      ...config,
      blockedPeriods: updated,
    };
    setConfig(newConfig);
    saveStoredConfig(newConfig);
    onRefresh();
  };

  // Abrir modal de criação de profissional
  const handleOpenCreatePro = () => {
    setProFormName('');
    setProFormRole('Barbeiro Especialista');
    setProFormPhone('');
    setProFormSpecialty('Cortes modernos, degradê & barba');
    setProFormExperience(3);
    setProFormStatus('ativo');
    setProFormAvatarColor('bg-amber-950 text-amber-300 border border-amber-800');
    setProFormHasCustomSchedule(false);
    setIsCreatingPro(true);
    setEditingPro(null);
  };

  // Abrir modal de edição de profissional
  const handleOpenEditPro = (pro: BarberProfessional) => {
    setEditingPro(pro);
    setIsCreatingPro(false);
    setProFormName(pro.name);
    setProFormRole(pro.role || 'Barbeiro');
    setProFormPhone(pro.phone || '');
    setProFormSpecialty(pro.specialty || '');
    setProFormExperience(pro.experienceYears || 1);
    setProFormStatus(pro.status || 'ativo');
    setProFormAvatarColor(pro.avatarColor || 'bg-stone-800 text-stone-200 border border-stone-700');
    setProFormHasCustomSchedule(Boolean(pro.weeklySchedule));
  };

  // Salvar criação ou edição de profissional
  const handleSavePro = (e: FormEvent) => {
    e.preventDefault();
    if (!proFormName.trim()) return;

    if (editingPro) {
      // Atualiza existente
      const updatedPro: BarberProfessional = {
        ...editingPro,
        name: proFormName.trim(),
        role: proFormRole.trim(),
        phone: proFormPhone.trim() || '',
        specialty: proFormSpecialty.trim() || '',
        experienceYears: Number(proFormExperience) || 0,
        status: proFormStatus,
        avatarColor: proFormAvatarColor,
        initials: getInitials(proFormName),
        ...(proFormHasCustomSchedule
          ? { weeklySchedule: editingPro.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE.map((d) => ({ ...d })) }
          : {}),
      };
      if (!proFormHasCustomSchedule && updatedPro.weeklySchedule) {
        delete updatedPro.weeklySchedule;
      }

      const updatedList = professionals.map((p) => (p.id === editingPro.id ? updatedPro : p));
      setProfessionals(updatedList);
      updateStoredProfessional(updatedPro);
      saveStoredProfessionals(updatedList);
      setEditingPro(null);
    } else {
      // Cria novo
      const newId = `pro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newPro: BarberProfessional = {
        id: newId,
        name: proFormName.trim(),
        role: proFormRole.trim(),
        phone: proFormPhone.trim() || '',
        specialty: proFormSpecialty.trim() || '',
        experienceYears: Number(proFormExperience) || 0,
        status: proFormStatus,
        avatarColor: proFormAvatarColor,
        initials: getInitials(proFormName),
        availableDays: [1, 2, 3, 4, 5, 6],
        ...(proFormHasCustomSchedule
          ? { weeklySchedule: DEFAULT_WEEKLY_SCHEDULE.map((d) => ({ ...d })) }
          : {}),
      };

      const updatedList = [...professionals, newPro];
      setProfessionals(updatedList);
      updateStoredProfessional(newPro);
      saveStoredProfessionals(updatedList);
      setIsCreatingPro(false);
    }

    onRefresh();
  };

  // Confirmar exclusão definitiva de profissional (seguro no iframe)
  const handleConfirmDeletePro = () => {
    if (!proToDelete) return;
    const id = proToDelete.id;
    deleteStoredProfessional(id);
    const updatedList = professionals.filter((p) => p.id !== id);
    setProfessionals(updatedList);
    if (targetScope === id) {
      setTargetScope('geral');
    }
    setProToDelete(null);
    onRefresh();
  };

  // Prévia de horários gerados para uma segunda-feira padrão com o intervalo atual
  const previewSlots = useMemo(() => {
    const monday = currentSchedule.find((d) => d.dayOfWeek === 1) || currentSchedule[0];
    if (!monday || !monday.active) return [];
    return generateSlotsFromRange(
      monday.openTime,
      monday.closeTime,
      config.slotInterval || 30,
      monday.hasBreak,
      monday.breakStart,
      monday.breakEnd
    );
  }, [currentSchedule, config.slotInterval]);

  // Salvar no Banco de Dados
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      // 1. Salva a configuração geral
      saveStoredConfig(config);

      // 2. Salva os profissionais com suas agendas individuais
      saveStoredProfessionals(professionals);

      // Atualiza estado do componente pai
      onRefresh();

      setSaveSuccessMsg('Disponibilidade salva no banco de dados com sucesso! O cliente já visualiza os novos dias e horários em tempo real.');
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 5000);
    } catch (e) {
      console.error('Erro ao salvar disponibilidade', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho do Módulo */}
      <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Sliders className="w-3.5 h-3.5" />
              Controle de Agenda & Horários
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Disponibilidade para Clientes
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Defina os dias da semana que a barbearia abre, os horários de início e encerramento, pausas de almoço,
              intervalos entre agendamentos e bloqueios pontuais. <strong>O cliente somente visualiza e escolhe o que o administrador ativar.</strong>
            </p>
          </div>

          <button
            id="btn-salvar-disponibilidade-topo"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="self-start sm:self-center px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-stone-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition shrink-0 disabled:opacity-50"
          >
            {isSaving ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar no Banco
              </>
            )}
          </button>
        </div>

        {/* Notificação de Sucesso */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* SELETOR DE ESCOPO: GERAL OU PROFISSIONAL INDIVIDUAL */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-800">
          <div>
            <span className="text-xs text-amber-400 font-bold block uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              7. Configuração por Profissional (Equipe & Disponibilidade)
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
              Gerencie seus barbeiros, edite cadastros ou personalize horários individuais:
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Clique para selecionar e editar os horários do barbeiro, ou use os botões de <strong>Editar</strong> e <strong>Excluir</strong>.
            </p>
          </div>

          <button
            id="btn-adicionar-novo-profissional"
            type="button"
            onClick={handleOpenCreatePro}
            className="self-start sm:self-center px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-md shadow-amber-500/10 shrink-0"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Novo Barbeiro</span>
          </button>
        </div>

        {/* Lista de Seleção e Ações de Profissionais */}
        <div className="space-y-3">
          {/* Botão Geral da Barbearia */}
          <button
            id="scope-btn-geral"
            type="button"
            onClick={() => setTargetScope('geral')}
            className={`w-full p-3.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-3 cursor-pointer border text-left ${
              targetScope === 'geral'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                targetScope === 'geral' ? 'bg-stone-950 text-amber-400' : 'bg-stone-900 text-amber-400 border border-amber-500/30'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-sm">Horário Geral da Barbearia (Padrão)</p>
                <p className={`text-[11px] ${targetScope === 'geral' ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
                  Aplica-se a todos os profissionais que não possuem horário próprio.
                </p>
              </div>
            </div>

            {targetScope === 'geral' && (
              <span className="px-2.5 py-1 bg-stone-950 text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wide">
                Configurando Agora
              </span>
            )}
          </button>

          {/* Cards dos Barbeiros Cadastrados */}
          {professionals.filter((p) => p.id !== 'qualquer').length === 0 ? (
            <div className="p-5 text-center bg-stone-950/40 border border-dashed border-stone-800 rounded-xl space-y-2">
              <Users className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs font-bold text-stone-300">Nenhum profissional cadastrado</p>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                Cadastre os barbeiros da sua equipe pelo botão acima para definir horários de atendimento personalizados para cada um.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {professionals
                .filter((p) => p.id !== 'qualquer')
                .map((pro) => {
                const isSelected = targetScope === pro.id;
                const hasCustom = !!pro.weeklySchedule;
                const isInactive = pro.status === 'inativo';

                return (
                  <div
                    key={pro.id}
                    id={`pro-card-${pro.id}`}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/5'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                    } ${isInactive ? 'opacity-65' : ''}`}
                  >
                    {/* Linha Superior: Avatar, Nome, Cargo e Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            pro.avatarColor || 'bg-stone-800 text-stone-200 border border-stone-700'
                          }`}
                        >
                          {pro.initials || getInitials(pro.name)}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {pro.name}
                            </span>
                            {isInactive && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                                Inativo
                              </span>
                            )}
                            {hasCustom ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                                Horário Próprio
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 font-medium">
                                Horário Geral
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                            <span>{pro.role || 'Barbeiro'}</span>
                            {pro.phone && (
                              <span className="text-stone-500">• {pro.phone}</span>
                            )}
                          </p>

                          {pro.specialty && (
                            <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                              {pro.specialty}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Linha Inferior: Botões de Ação (Configurar Horário, Editar, Deletar) */}
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <button
                        id={`scope-btn-${pro.id}`}
                        type="button"
                        onClick={() => setTargetScope(pro.id)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                            : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 border-stone-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Configurando Horários' : 'Ajustar Horários'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-editar-pro-${pro.id}`}
                          type="button"
                          onClick={() => handleOpenEditPro(pro)}
                          title={`Editar dados de ${pro.name}`}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          id={`btn-deletar-pro-${pro.id}`}
                          type="button"
                          onClick={() => setProToDelete(pro)}
                          title={`Excluir ${pro.name}`}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Se um profissional estiver selecionado, permite ativar ou desativar agenda própria */}
        {activePro && (
          <div className="mt-4 pt-3 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950/60 p-3.5 rounded-xl border border-amber-500/20">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Disponibilidade individual de <strong className="text-amber-400">{activePro.name}</strong>:
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {activePro.weeklySchedule
                  ? `Este profissional possui horários e dias próprios. Você pode editá-los nas seções abaixo.`
                  : `Atualmente este profissional segue o horário geral da barbearia. Ative o botão ao lado para criar horários próprios.`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!activePro.weeklySchedule}
                  onChange={(e) => handleToggleProCustomSchedule(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
              <span className="text-xs text-stone-300 font-medium">
                {activePro.weeklySchedule ? 'Horário Personalizado' : 'Usar Horário Geral'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1 & 2. CONTROLE DOS DIAS DA SEMANA E HORÁRIOS */}
      {/* ======================================================== */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="border-b border-stone-800 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">
                1 & 2. Dias e Horários de Atendimento
              </h3>
            </div>
            <span className="text-xs text-stone-400">
              {targetScope === 'geral' ? 'Horário Geral da Barbearia' : `Horário de ${activePro?.name}`}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Ative ou desative cada dia da semana. Para os dias ativos, ajuste o horário de abertura, encerramento e intervalo para almoço.
          </p>
        </div>

        <div className="space-y-3">
          {currentSchedule.map((day) => (
            <div
              key={day.dayOfWeek}
              id={`day-config-row-${day.dayOfWeek}`}
              className={`p-4 rounded-xl border transition-all ${
                day.active
                  ? 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  : 'bg-stone-950/30 border-stone-900 opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Lado Esquerdo: Dia e Switch Ativo/Fechado */}
                <div className="flex items-center justify-between lg:justify-start gap-4 min-w-[180px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{day.name}</span>
                      {day.active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ATIVO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          FECHADO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      {day.active ? 'Disponível para clientes' : 'Clientes não podem agendar'}
                    </span>
                  </div>

                  {/* Switch Ativo/Fechado */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.active}
                      onChange={() => handleToggleDay(day.dayOfWeek)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Se ativo: Configuração de Horários */}
                {day.active ? (
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 text-xs">
                    {/* Expediente Principal */}
                    <div className="flex items-center gap-2 bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400">Das:</span>
                        <input
                          id={`open-time-${day.dayOfWeek}`}
                          type="time"
                          value={day.openTime}
                          onChange={(e) => handleUpdateDayField(day.dayOfWeek, 'openTime', e.target.value)}
                          className="bg-stone-950 border border-stone-700 text-stone-100 rounded-lg px-2 py-1 text-xs focus:border-amber-500 outline-none"
                        />
                      </div>
                      <span className="text-stone-500">às</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          id={`close-time-${day.dayOfWeek}`}
                          type="time"
                          value={day.closeTime}
                          onChange={(e) => handleUpdateDayField(day.dayOfWeek, 'closeTime', e.target.value)}
                          className="bg-stone-950 border border-stone-700 text-stone-100 rounded-lg px-2 py-1 text-xs focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Intervalo / Almoço */}
                    <div className="flex-1 flex items-center gap-3 bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/80">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          id={`has-break-${day.dayOfWeek}`}
                          type="checkbox"
                          checked={day.hasBreak || false}
                          onChange={(e) => handleUpdateDayField(day.dayOfWeek, 'hasBreak', e.target.checked)}
                          className="rounded border-stone-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-stone-950"
                        />
                        <span className="text-stone-300 font-medium flex items-center gap-1">
                          <Coffee className="w-3.5 h-3.5 text-stone-400" />
                          Intervalo:
                        </span>
                      </label>

                      {day.hasBreak ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            id={`break-start-${day.dayOfWeek}`}
                            type="time"
                            value={day.breakStart || '12:00'}
                            onChange={(e) => handleUpdateDayField(day.dayOfWeek, 'breakStart', e.target.value)}
                            className="bg-stone-950 border border-stone-700 text-stone-100 rounded-lg px-2 py-1 text-xs focus:border-amber-500 outline-none"
                          />
                          <span className="text-stone-500">às</span>
                          <input
                            id={`break-end-${day.dayOfWeek}`}
                            type="time"
                            value={day.breakEnd || '13:00'}
                            onChange={(e) => handleUpdateDayField(day.dayOfWeek, 'breakEnd', e.target.value)}
                            className="bg-stone-950 border border-stone-700 text-stone-100 rounded-lg px-2 py-1 text-xs focus:border-amber-500 outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-stone-500 italic text-[11px]">Sem pausa configurada</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 py-1 text-stone-500 text-xs italic flex items-center gap-1.5">
                    <CalendarOff className="w-4 h-4 text-stone-600" />
                    Dia fechado para atendimentos. O cliente não conseguirá selecionar este dia no calendário.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INTERVALO ENTRE HORÁRIOS */}
      {/* ======================================================== */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">
              3. Intervalo Entre Horários (Slots da Agenda)
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Escolha o tempo de espaçamento entre cada horário exibido para o cliente agendar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INTERVAL_OPTIONS.map((opt) => {
            const isSelected = (config.slotInterval || 30) === opt.value;
            return (
              <div
                key={opt.value}
                id={`interval-opt-${opt.value}`}
                onClick={() => handleSlotIntervalChange(opt.value)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-white">{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-700'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-stone-400 text-xs leading-relaxed">{opt.desc}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-stone-800/80 text-[11px] text-amber-400/90 font-mono">
                  {opt.value === 15 && 'Ex: 08:00, 08:15, 08:30, 08:45...'}
                  {opt.value === 30 && 'Ex: 08:00, 08:30, 09:00, 09:30...'}
                  {opt.value === 45 && 'Ex: 08:00, 08:45, 09:30, 10:15...'}
                  {opt.value === 60 && 'Ex: 08:00, 09:00, 10:00, 11:00...'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prévia dos Horários Gerados */}
        <div className="bg-stone-950/80 rounded-xl p-4 border border-stone-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              Exemplo de horários que o cliente verá (com base no intervalo de {config.slotInterval || 30} min):
            </span>
            <span className="text-[11px] text-stone-500">{previewSlots.length} horários no expediente</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            {previewSlots.map((slot) => (
              <span
                key={slot}
                className="px-2.5 py-1 bg-stone-900 border border-stone-700/60 rounded-lg text-xs font-mono text-stone-200"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BLOQUEAR DATA OU HORÁRIO */}
      {/* ======================================================== */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">
              4. Bloquear Data ou Horário Específico
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Bloqueie um dia inteiro (ex: feriado, reforma) ou uma faixa de horário específica (ex: reunião, almoço estendido, folga).
            Esses horários ficarão <strong>imediatamente indisponíveis</strong> para o cliente.
          </p>
        </div>

        {/* Formulário de Novo Bloqueio */}
        <form onSubmit={handleAddBlockedPeriod} className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-4">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            Adicionar Novo Bloqueio
          </span>

          {blockError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{blockError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Data do Bloqueio */}
            <div>
              <label className="text-xs text-stone-400 font-medium block mb-1">
                Data do Bloqueio:
              </label>
              <input
                id="input-block-date"
                type="date"
                value={newBlockDate}
                onChange={(e) => setNewBlockDate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-100 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            {/* Tipo de Bloqueio */}
            <div>
              <label className="text-xs text-stone-400 font-medium block mb-1">
                Tipo de Bloqueio:
              </label>
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="radio"
                    name="blockType"
                    checked={newBlockIsFullDay}
                    onChange={() => setNewBlockIsFullDay(true)}
                    className="text-amber-500 focus:ring-0 bg-stone-900"
                  />
                  Dia Inteiro
                </label>
                <label className="flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="radio"
                    name="blockType"
                    checked={!newBlockIsFullDay}
                    onChange={() => setNewBlockIsFullDay(false)}
                    className="text-amber-500 focus:ring-0 bg-stone-900"
                  />
                  Faixa de Horário
                </label>
              </div>
            </div>

            {/* Se faixa de horário */}
            {!newBlockIsFullDay && (
              <div className="sm:col-span-2 flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 font-medium block mb-1">
                    Horário Inicial:
                  </label>
                  <input
                    id="input-block-start"
                    type="time"
                    value={newBlockStartTime}
                    onChange={(e) => setNewBlockStartTime(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-100 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 font-medium block mb-1">
                    Horário Final:
                  </label>
                  <input
                    id="input-block-end"
                    type="time"
                    value={newBlockEndTime}
                    onChange={(e) => setNewBlockEndTime(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-100 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Profissional Afetado */}
            <div>
              <label className="text-xs text-stone-400 font-medium block mb-1">
                Profissional Afetado:
              </label>
              <select
                id="select-block-pro"
                value={newBlockTargetPro}
                onChange={(e) => setNewBlockTargetPro(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-100 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none cursor-pointer"
              >
                <option value="todos">Todos os Profissionais</option>
                {professionals
                  .filter((p) => p.id !== 'qualquer' && p.status !== 'inativo')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      Apenas {p.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Motivo do Bloqueio */}
            <div className={newBlockIsFullDay ? 'sm:col-span-2' : 'sm:col-span-1'}>
              <label className="text-xs text-stone-400 font-medium block mb-1">
                Motivo / Identificação:
              </label>
              <input
                id="input-block-reason"
                type="text"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                placeholder="Ex: Feriado, Reforma, Indisponível"
                className="w-full bg-stone-900 border border-stone-700 text-stone-100 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              id="btn-adicionar-bloqueio"
              type="submit"
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-[0.98] text-amber-400 font-bold text-xs rounded-xl border border-stone-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Bloqueio
            </button>
          </div>
        </form>

        {/* Lista de Bloqueios Cadastrados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Bloqueios Ativos no Sistema ({(config.blockedPeriods || []).length})
            </span>
          </div>

          {(!config.blockedPeriods || config.blockedPeriods.length === 0) ? (
            <div className="p-6 text-center rounded-xl bg-stone-950/40 border border-stone-850 text-stone-500 text-xs">
              Nenhum bloqueio cadastrado no momento. Todos os horários ativos do expediente estão liberados para clientes.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {config.blockedPeriods.map((bp) => {
                const targetProName =
                  bp.professionalId === 'todos' || !bp.professionalId
                    ? 'Todos os profissionais'
                    : professionals.find((p) => p.id === bp.professionalId)?.name || bp.professionalId;

                return (
                  <div
                    key={bp.id}
                    id={`blocked-item-${bp.id}`}
                    className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
                        <CalendarOff className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{bp.date}</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {bp.isFullDay ? 'Dia Fechado' : `${bp.startTime} às ${bp.endTime}`}
                          </span>
                        </div>
                        <p className="text-stone-300 text-xs mt-0.5 font-medium">{bp.reason || 'Indisponível'}</p>
                        <p className="text-stone-500 text-[11px] mt-0.5">
                          Afeta: <span className="text-stone-400">{targetProName}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      id={`btn-remover-bloqueio-${bp.id}`}
                      type="button"
                      onClick={() => handleRemoveBlockedPeriod(bp.id)}
                      title="Remover bloqueio e liberar horário"
                      className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. REGRAS GERAIS DE PROTEÇÃO DO CLIENTE */}
      {/* ======================================================== */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Shield className="w-4 h-4" />
          Regras de Validação Automática Aplicadas ao Cliente
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-stone-300">
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
            🚫 <strong>Dia Fechado:</strong> O cliente não visualiza a data no calendário.
          </div>
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
            ⏳ <strong>Fora do Expediente:</strong> Nenhum horário antes da abertura ou após o fechamento é ofertado.
          </div>
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
            ☕ <strong>Intervalo de Almoço:</strong> Horários dentro da pausa são filtrados automaticamente.
          </div>
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
            🔒 <strong>Horário Bloqueado:</strong> Feriados e manutenções somem da lista de slots.
          </div>
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
            📅 <strong>Horário Já Ocupado:</strong> Agendamentos confirmados removem o horário.
          </div>
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
            👤 <strong>Folga do Barbeiro:</strong> A agenda individual de cada profissional é respeitada.
          </div>
        </div>
      </div>

      {/* Botão de Ação Inferior */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          id="btn-salvar-disponibilidade-rodape"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-stone-950 font-black rounded-xl text-sm shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
        >
          {isSaving ? (
            <>Salvando no Banco...</>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Disponibilidade no Banco de Dados
            </>
          )}
        </button>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE PROFISSIONAL */}
      {(isCreatingPro || editingPro) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                {editingPro ? 'Editar Dados do Barbeiro' : 'Cadastrar Novo Barbeiro'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingPro(null);
                  setIsCreatingPro(false);
                }}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePro} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={proFormName}
                  onChange={(e) => setProFormName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={proFormRole}
                    onChange={(e) => setProFormRole(e.target.value)}
                    placeholder="Ex: Mestre Barbeiro"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={proFormPhone}
                    onChange={(e) => setProFormPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    Anos de Experiência
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={proFormExperience}
                    onChange={(e) => setProFormExperience(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    Status no Sistema
                  </label>
                  <select
                    value={proFormStatus}
                    onChange={(e) => setProFormStatus(e.target.value as 'ativo' | 'inativo')}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ativo">Ativo (recebe agendamentos)</option>
                    <option value="inativo">Inativo (oculto no agendamento)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Especialidade / Descrição
                </label>
                <input
                  type="text"
                  value={proFormSpecialty}
                  onChange={(e) => setProFormSpecialty(e.target.value)}
                  placeholder="Ex: Cortes clássicos, navalhado, degradê & barba"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1.5">
                  Estilo Visual / Badge do Barbeiro
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVATAR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setProFormAvatarColor(style.classes)}
                      className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 cursor-pointer transition ${
                        proFormAvatarColor === style.classes
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${style.classes}`}>
                        CS
                      </span>
                      <span className="truncate">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proFormHasCustomSchedule}
                    onChange={(e) => setProFormHasCustomSchedule(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-stone-900 border-stone-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Horário e dias de atendimento individuais
                    </span>
                    <span className="text-[11px] text-stone-400 block">
                      Permite configurar dias de folga e expedientes exclusivos para este profissional.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  id="btn-salvar-modal-profissional"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {editingPro ? 'Salvar Alterações' : 'Cadastrar Barbeiro'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPro(null);
                    setIsCreatingPro(false);
                  }}
                  className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PROFISSIONAL */}
      {proToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-stone-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Excluir Profissional?</h3>
              <p className="text-xs text-stone-400">
                Tem certeza que deseja remover <strong className="text-white">{proToDelete.name}</strong> da equipe?
              </p>
              <p className="text-[11px] text-stone-500 pt-1">
                Ele deixará de aparecer na lista de agendamentos e sua escala será excluída.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                id="btn-confirmar-exclusao-pro"
                onClick={handleConfirmDeletePro}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
              <button
                type="button"
                id="btn-cancelar-exclusao-pro"
                onClick={() => setProToDelete(null)}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
