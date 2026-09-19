import { useState, useEffect, type FormEvent } from 'react';
import { 
  Scissors, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Check, 
  Sparkles, 
  Power, 
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { BarberService, BookingFeeType } from '../../../types';
import { 
  formatCurrency, 
  getStoredServices, 
  saveStoredServices,
  saveServiceToDB,
  deleteServiceFromDB
} from '../../../utils/storage';

interface AdminServicesTabProps {
  onRefresh: () => void;
}

export function AdminServicesTab({ onRefresh }: AdminServicesTabProps) {
  const [services, setServices] = useState<BarberService[]>(getStoredServices);
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<BarberService | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setServices(getStoredServices());
    };
    window.addEventListener('barbershop_sync', handleSync);
    return () => window.removeEventListener('barbershop_sync', handleSync);
  }, []);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(35);
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formCategory, setFormCategory] = useState<'cabelo' | 'barba' | 'combo' | 'acabamento'>('cabelo');
  const [formPopular, setFormPopular] = useState(false);
  
  // Taxa de Agendamento
  const [formHasBookingFee, setFormHasBookingFee] = useState<boolean>(false);
  const [formBookingFeeType, setFormBookingFeeType] = useState<BookingFeeType>('fixo');
  const [formBookingFeeValue, setFormBookingFeeValue] = useState<number>(10);

  // Abrir modal de criação
  const handleOpenCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice(40);
    setFormDuration(30);
    setFormCategory('cabelo');
    setFormPopular(false);
    setFormHasBookingFee(false);
    setFormBookingFeeType('fixo');
    setFormBookingFeeValue(10);
    setIsCreatingNew(true);
  };

  // Abrir modal de edição
  const handleOpenEdit = (svc: BarberService) => {
    setEditingService(svc);
    setFormName(svc.name);
    setFormDescription(svc.description);
    setFormPrice(svc.price);
    setFormDuration(svc.durationMinutes);
    setFormCategory(svc.category);
    setFormPopular(svc.popular || false);
    setFormHasBookingFee(Boolean(svc.hasBookingFee));
    setFormBookingFeeType(svc.bookingFeeType || 'fixo');
    setFormBookingFeeValue(svc.bookingFeeValue !== undefined ? svc.bookingFeeValue : 10);
  };

  // Alternar ativo/inativo
  const handleToggleActive = (id: string) => {
    const target = services.find((s) => s.id === id);
    if (!target) return;
    const updatedService = { ...target, active: target.active === false ? true : false };
    const updatedList = services.map((s) => (s.id === id ? updatedService : s));

    setServices(updatedList);
    saveStoredServices(updatedList);
    saveServiceToDB(updatedService);
    onRefresh();
  };

  // Salvar novo serviço ou edição
  const handleSaveService = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0 || formDuration <= 0) return;

    let targetService: BarberService;

    if (editingService) {
      targetService = {
        ...editingService,
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        durationMinutes: Number(formDuration),
        category: formCategory,
        popular: formPopular,
        hasBookingFee: formHasBookingFee,
        bookingFeeType: formHasBookingFee ? formBookingFeeType : undefined,
        bookingFeeValue: formHasBookingFee ? Number(formBookingFeeValue) : undefined,
      };

      const updatedList = services.map((s) => (s.id === editingService.id ? targetService : s));
      setServices(updatedList);
      saveStoredServices(updatedList);
      saveServiceToDB(targetService);
      setEditingService(null);
    } else {
      targetService = {
        id: `svc-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        durationMinutes: Number(formDuration),
        category: formCategory,
        popular: formPopular,
        active: true,
        hasBookingFee: formHasBookingFee,
        bookingFeeType: formHasBookingFee ? formBookingFeeType : undefined,
        bookingFeeValue: formHasBookingFee ? Number(formBookingFeeValue) : undefined,
      };

      const updatedList = [...services, targetService];
      setServices(updatedList);
      saveStoredServices(updatedList);
      saveServiceToDB(targetService);
      setIsCreatingNew(false);
    }

    onRefresh();
  };

  // Excluir serviço (abre modal seguro, compatível com iframe)
  const handleConfirmDeleteService = () => {
    if (!serviceToDelete) return;
    const id = serviceToDelete.id;
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    saveStoredServices(updated);
    deleteServiceFromDB(id);
    setServiceToDelete(null);
    onRefresh();
  };

  // Cálculo da prévia da taxa no formulário
  const previewFeeAmount = formHasBookingFee
    ? formBookingFeeType === 'percentual'
      ? Math.round(((formPrice * formBookingFeeValue) / 100) * 100) / 100
      : Math.min(formPrice, Number(formBookingFeeValue))
    : 0;
  const previewRemaining = Math.max(0, formPrice - previewFeeAmount);

  return (
    <div className="space-y-5">
      {/* Topo com Botão Adicionar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-amber-400" />
            Catálogo de Serviços ({services.length})
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Cadastre serviços, configure taxas de agendamento e valores
          </p>
        </div>

        <button
          id="btn-admin-add-service"
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Novo Serviço</span>
        </button>
      </div>

      {/* Grid de Serviços */}
      {services.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/60 border border-dashed border-stone-800 rounded-3xl space-y-3">
          <Scissors className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="font-bold text-stone-200 text-base">Nenhum serviço cadastrado ainda</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            O catálogo da sua barbearia está vazio e limpo, pronto para receber seus serviços oficiais.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Primeiro Serviço</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {services.map((svc) => {
            const isActive = svc.active !== false;
            const feeVal = svc.bookingFeeValue || 0;
            const calculatedFee = svc.hasBookingFee
              ? svc.bookingFeeType === 'percentual'
                ? (svc.price * feeVal) / 100
                : Math.min(svc.price, feeVal)
              : 0;

            return (
              <div
                key={svc.id}
                id={`service-card-${svc.id}`}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-stone-900 border-stone-800 shadow-md'
                    : 'bg-stone-950/60 border-stone-900 opacity-60'
                }`}
              >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-base">{svc.name}</h4>
                      {svc.popular && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase flex items-center gap-1 border border-amber-500/30">
                          <Sparkles className="w-2.5 h-2.5" /> Popular
                        </span>
                      )}
                      {!isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 text-[10px] font-semibold">
                          Inativo
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(svc.id)}
                      title={isActive ? 'Desativar serviço' : 'Ativar serviço'}
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-stone-800 text-stone-500 border-stone-700 hover:text-stone-300'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(svc)}
                      title="Editar serviço"
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      id={`btn-deletar-servico-${svc.id}`}
                      onClick={() => setServiceToDelete(svc)}
                      title="Excluir serviço"
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {svc.durationMinutes} min
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {formatCurrency(svc.price)}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-stone-500 px-2 py-0.5 rounded bg-stone-800">
                    {svc.category}
                  </span>
                </div>
              </div>

              {/* Informação sobre Taxa de Agendamento */}
              <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  Taxa de agendamento:
                </span>
                {svc.hasBookingFee && svc.bookingFeeValue ? (
                  <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {svc.bookingFeeType === 'percentual'
                      ? `${svc.bookingFeeValue}% (${formatCurrency(calculatedFee)})`
                      : formatCurrency(svc.bookingFeeValue)}
                  </span>
                ) : (
                  <span className="text-stone-500 font-medium">Sem taxa (grátis)</span>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {(isCreatingNew || editingService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
              </h3>
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsCreatingNew(false);
                }}
                className="text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Corte + Barba"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Descrição exibida para o cliente no agendamento..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Valor do Serviço (R$) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Duração (minutos) *
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={50}>50 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos (1h 30m)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                  >
                    <option value="cabelo">Cabelo</option>
                    <option value="barba">Barba</option>
                    <option value="combo">Combo</option>
                    <option value="acabamento">Acabamento</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label
                    onClick={() => setFormPopular(!formPopular)}
                    className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-300"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        formPopular
                          ? 'bg-amber-500 border-amber-500 text-stone-950'
                          : 'border-stone-700 bg-stone-950'
                      }`}
                    >
                      {formPopular && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span>Destacar como Popular</span>
                  </label>
                </div>
              </div>

              {/* ======================================================== */}
              {/* BLOCO: TAXA DE AGENDAMENTO (ESPECIFICADA PELO USUÁRIO) */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <label
                  onClick={() => setFormHasBookingFee(!formHasBookingFee)}
                  className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-amber-400"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      formHasBookingFee
                        ? 'bg-amber-500 border-amber-500 text-stone-950'
                        : 'border-stone-700 bg-stone-900'
                    }`}
                  >
                    {formHasBookingFee && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span>☑ Cobrar taxa de agendamento</span>
                </label>

                {formHasBookingFee && (
                  <div className="pt-3 border-t border-stone-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
                          Tipo da taxa:
                        </label>
                        <select
                          value={formBookingFeeType}
                          onChange={(e) => setFormBookingFeeType(e.target.value as BookingFeeType)}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                        >
                          <option value="fixo">Valor fixo (R$)</option>
                          <option value="percentual">Percentual do serviço (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
                          {formBookingFeeType === 'fixo' ? 'Valor da taxa (R$):' : 'Percentual (%):'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={formBookingFeeType === 'percentual' ? 100 : formPrice}
                          step={formBookingFeeType === 'percentual' ? 1 : 0.5}
                          value={formBookingFeeValue}
                          onChange={(e) => setFormBookingFeeValue(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Exemplo / Prévia em tempo real */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-amber-300 block">Exemplo para o cliente:</span>
                      <p className="text-stone-300 text-[11px]">
                        Serviço: <strong>{formName || 'Corte + Barba'}</strong> ({formatCurrency(formPrice)})
                      </p>
                      <p className="text-amber-400 text-[11px] font-semibold">
                        Taxa de agendamento (PIX): {formatCurrency(previewFeeAmount)}
                      </p>
                      <p className="text-stone-400 text-[11px]">
                        Restante no atendimento: {formatCurrency(previewRemaining)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-3 bg-stone-800 text-stone-300 text-xs rounded-xl hover:bg-stone-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão de Serviço */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-stone-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Excluir Serviço?</h3>
              <p className="text-xs text-stone-400">
                Tem certeza que deseja remover <strong className="text-white">{serviceToDelete.name}</strong> do catálogo?
              </p>
              <p className="text-[11px] text-stone-500 pt-1">
                Dica: Se você não quiser apagar, pode apenas desativar o serviço para não aparecer no agendamento.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                id="btn-confirmar-exclusao-servico"
                onClick={handleConfirmDeleteService}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
              <button
                type="button"
                id="btn-cancelar-exclusao-servico"
                onClick={() => setServiceToDelete(null)}
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
