import { useState } from 'react';
import { 
  Sparkles, 
  Palette, 
  Layout, 
  UserCheck, 
  CalendarClock, 
  XCircle, 
  MessageSquare, 
  Check, 
  Save, 
  Eye, 
  Info, 
  Smartphone, 
  CheckCircle2, 
  Sliders, 
  MapPin, 
  Phone, 
  Clock, 
  Instagram,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { BarbershopConfig } from '../../../types';
import { saveStoredConfig, cleanBarbershopTitle, cleanBarbershopName } from '../../../utils/storage';

interface AdminCustomizeClientPortalTabProps {
  config: BarbershopConfig;
  onRefresh: () => void;
  onGoToClientArea: () => void;
}

type SubTab = 'geral' | 'perfil' | 'agendamento' | 'cancelamento' | 'mensagens' | 'visual' | 'secoes';

export function AdminCustomizeClientPortalTab({
  config,
  onRefresh,
  onGoToClientArea,
}: AdminCustomizeClientPortalTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('geral');
  const [formData, setFormData] = useState<BarbershopConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Manipulador genérico de mudança
  const handleChange = (field: keyof BarbershopConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  // Salvar no banco de dados e localStorage
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const sanitizedData = {
        ...formData,
        name: cleanBarbershopName(formData.name),
        clientTopTitle: cleanBarbershopTitle(formData.clientTopTitle || formData.name),
        pixReceiverName: cleanBarbershopTitle(formData.pixReceiverName || formData.name),
      };
      saveStoredConfig(sanitizedData);
      setFormData(sanitizedData);
      // Envia para o backend express
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      }).catch(() => {});

      setIsSaving(false);
      setSaveSuccess(true);
      onRefresh();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3500);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  // Cores do tema disponíveis
  const themeColors: { id: BarbershopConfig['primaryColor']; name: string; hex: string; bgClass: string }[] = [
    { id: 'amber', name: 'Âmbar Clássico (Padrão)', hex: '#f59e0b', bgClass: 'bg-amber-500' },
    { id: 'yellow', name: 'Ouro Nobre', hex: '#eab308', bgClass: 'bg-yellow-500' },
    { id: 'emerald', name: 'Esmeralda Barber', hex: '#10b981', bgClass: 'bg-emerald-500' },
    { id: 'blue', name: 'Azul Vintage', hex: '#3b82f6', bgClass: 'bg-blue-500' },
    { id: 'rose', name: 'Rubi Elegance', hex: '#f43f5e', bgClass: 'bg-rose-500' },
    { id: 'zinc', name: 'Grafite Minimalista', hex: '#71717a', bgClass: 'bg-zinc-500' },
  ];

  // Estilos de arredondamento
  const borderRadii: { id: BarbershopConfig['borderRadius']; name: string; example: string }[] = [
    { id: 'rounded-lg', name: 'Reto Clássico (8px)', example: 'rounded-lg' },
    { id: 'rounded-2xl', name: 'Moderno Elegante (16px)', example: 'rounded-2xl' },
    { id: 'rounded-3xl', name: 'Arredondado Suave (24px)', example: 'rounded-3xl' },
    { id: 'rounded-full', name: 'Cápsula / Pill', example: 'rounded-full' },
  ];

  return (
    <div className="space-y-6">
      {/* Header com Ações Rápidas */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-stone-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Personalizar Portal do Cliente</h2>
              <p className="text-xs text-stone-400">
                Edite textos, visibilidade de seções, cores e regras de agendamento e cancelamento do cliente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-preview-portal-cliente"
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-750 text-stone-200 border border-stone-700 font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Visualizar Portal</span>
          </button>

          <button
            id="btn-salvar-personalizacao-topo"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-stone-950" />
                <span>Salvo com sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-navegação do Módulo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-stone-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('geral')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'geral'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>1. Tela de Entrada</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('perfil')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'perfil'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>2. Perfil do Cliente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('agendamento')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'agendamento'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>3. Agendamento</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cancelamento')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'cancelamento'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>4. Cancelamento</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mensagens')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'mensagens'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>5. Mensagens & WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('visual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'visual'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>6. Visual & Cores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('secoes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'secoes'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>7. Seções Ativas</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. TELA DE ENTRADA DO CLIENTE */}
      {/* ======================================================== */}
      {activeSubTab === 'geral' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-amber-400" />
              <span>Personalização da Tela de Entrada (Home)</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Configure o título, logotipo, textos, botões e dados de contato que o cliente vê na página inicial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nome / Título no Topo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Nome da Barbearia no Topo do Portal
              </label>
              <input
                type="text"
                value={formData.clientTopTitle ?? formData.name ?? ''}
                onChange={(e) => handleChange('clientTopTitle', e.target.value)}
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                placeholder="Ex: BARBEARIA DO VINICIUS"
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Slogan / Subtítulo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Slogan / Subtítulo
              </label>
              <input
                type="text"
                value={formData.clientSubtitle ?? formData.tagline ?? ''}
                onChange={(e) => handleChange('clientSubtitle', e.target.value)}
                placeholder="Ex: Seu estilo, sua identidade."
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* URL da Logo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                <span>URL do Logotipo da Barbearia</span>
                <span className="text-[10px] text-stone-400">Dimensões ideais: 200x200px</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.logo ?? ''}
                  onChange={(e) => handleChange('logo', e.target.value)}
                  placeholder="Ex: /logo_vinicius.jpg ou https://..."
                  className="flex-1 px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {formData.logo && (
                  <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 p-1 flex items-center justify-center shrink-0">
                    <img 
                      src={formData.logo} 
                      alt="Logo Preview" 
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo_vinicius.jpg';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Foto/Imagem de Fundo do Banner */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                URL da Foto/Imagem de Fundo do Banner (Opcional)
              </label>
              <input
                type="text"
                value={formData.heroBackground ?? ''}
                onChange={(e) => handleChange('heroBackground', e.target.value)}
                placeholder="Ex: https://images.unsplash.com/... (Deixe vazio para usar gradiente escuro)"
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Texto do Botão de Agendar */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Texto do Botão Principal "Agendar Horário"
              </label>
              <input
                type="text"
                value={formData.bookingButtonText ?? 'Agendar meu horário'}
                onChange={(e) => handleChange('bookingButtonText', e.target.value)}
                placeholder="Ex: Agendar meu horário"
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Texto do Botão Meus Agendamentos */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Texto do Botão "Meus Agendamentos"
              </label>
              <input
                type="text"
                value={formData.myAppointmentsButtonText ?? 'Meus agendamentos'}
                onChange={(e) => handleChange('myAppointmentsButtonText', e.target.value)}
                placeholder="Ex: Meus agendamentos"
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Texto de Apresentação */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">
              Texto de Apresentação na Home do Cliente
            </label>
            <textarea
              rows={2}
              value={formData.presentationText ?? ''}
              onChange={(e) => handleChange('presentationText', e.target.value)}
              placeholder="Ex: Tradição, precisão no corte e ambiente acolhedor..."
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Comunicado / Aviso Especial */}
          <div className="space-y-2 p-4 bg-stone-950 border border-stone-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-bold text-white">
                  Aviso ou Comunicado Importante na Home
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showNoticeOnHome !== false}
                  onChange={(e) => handleChange('showNoticeOnHome', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-medium text-stone-300">
                  {formData.showNoticeOnHome !== false ? 'Ativo' : 'Oculto'}
                </span>
              </label>
            </div>
            <textarea
              rows={2}
              value={formData.informativeNotice ?? ''}
              onChange={(e) => handleChange('informativeNotice', e.target.value)}
              placeholder="Ex: Atendimento com horário marcado. Chegue com 5 minutos de antecedência."
              className="w-full px-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none mt-2"
            />
          </div>

          {/* Informações de Contato e Endereço */}
          <div className="pt-4 border-t border-stone-800 space-y-4">
            <h4 className="text-sm font-bold text-white">Informações de Contato & Endereço do Estabelecimento</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">WhatsApp Oficial</label>
                <input
                  type="text"
                  value={formData.whatsapp ?? formData.phone ?? ''}
                  onChange={(e) => {
                    handleChange('whatsapp', e.target.value);
                    handleChange('phone', e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Telefone Secundário / Fixo</label>
                <input
                  type="text"
                  value={formData.secondaryPhone ?? ''}
                  onChange={(e) => handleChange('secondaryPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Instagram</label>
                <input
                  type="text"
                  value={formData.instagram ?? ''}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-stone-300">Endereço Completo</label>
                <input
                  type="text"
                  value={`${formData.address || ''}${formData.number ? ', ' + formData.number : ''}${formData.neighborhood ? ' - ' + formData.neighborhood : ''}`}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, número e bairro"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Horário de Funcionamento Textual</label>
                <input
                  type="text"
                  value={formData.workingHours ?? 'Segunda a Sábado, das 08:00 às 18:00'}
                  onChange={(e) => handleChange('workingHours', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ÁREA DE PERFIL DO CLIENTE */}
      {/* ======================================================== */}
      {activeSubTab === 'perfil' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>Controle da Área de Perfil do Cliente</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Escolha quais campos o cliente pode visualizar e quais campos ele tem permissão para editar no próprio cadastro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campos Visíveis */}
            <div className="p-5 bg-stone-950 border border-stone-800 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Campos Visíveis no Perfil</span>
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">Foto de Perfil / Avatar</span>
                  <input
                    type="checkbox"
                    checked={formData.profileShowPhoto !== false}
                    onChange={(e) => handleChange('profileShowPhoto', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">E-mail do Cliente</span>
                  <input
                    type="checkbox"
                    checked={formData.profileShowEmail !== false}
                    onChange={(e) => handleChange('profileShowEmail', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">Endereço Residencial</span>
                  <input
                    type="checkbox"
                    checked={formData.profileShowAddress !== false}
                    onChange={(e) => handleChange('profileShowAddress', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">Data de Nascimento</span>
                  <input
                    type="checkbox"
                    checked={formData.profileShowBirthDate !== false}
                    onChange={(e) => handleChange('profileShowBirthDate', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>
              </div>
            </div>

            {/* Permissão para Edição */}
            <div className="p-5 bg-stone-950 border border-stone-800 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Permissão de Edição pelo Cliente</span>
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">Cliente pode alterar seu Nome</span>
                  <input
                    type="checkbox"
                    checked={formData.profileAllowEditName !== false}
                    onChange={(e) => handleChange('profileAllowEditName', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">Cliente pode alterar Telefone</span>
                  <input
                    type="checkbox"
                    checked={formData.profileAllowEditPhone !== false}
                    onChange={(e) => handleChange('profileAllowEditPhone', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">Cliente pode alterar E-mail</span>
                  <input
                    type="checkbox"
                    checked={formData.profileAllowEditEmail !== false}
                    onChange={(e) => handleChange('profileAllowEditEmail', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-stone-200">Cliente pode alterar Endereço</span>
                  <input
                    type="checkbox"
                    checked={formData.profileAllowEditAddress !== false}
                    onChange={(e) => handleChange('profileAllowEditAddress', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ÁREA DE AGENDAMENTO */}
      {/* ======================================================== */}
      {activeSubTab === 'agendamento' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-400" />
              <span>Regras e Textos da Área de Agendamento</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Defina como o fluxo de agendamento funciona e como os serviços são exibidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Título da Página de Agendamento
              </label>
              <input
                type="text"
                value={formData.bookingPageTitle ?? 'Agendamento Online'}
                onChange={(e) => handleChange('bookingPageTitle', e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Subtítulo da Página de Agendamento
              </label>
              <input
                type="text"
                value={formData.bookingPageSubtitle ?? 'Selecione o serviço, profissional e melhor horário'}
                onChange={(e) => handleChange('bookingPageSubtitle', e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">
              Instruções Gerais para o Cliente no Agendamento
            </label>
            <textarea
              rows={2}
              value={formData.bookingInstructions ?? ''}
              onChange={(e) => handleChange('bookingInstructions', e.target.value)}
              placeholder="Instruções adicionais exibidas na tela de seleção de horários..."
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 bg-stone-900 border border-stone-800 rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Exibir Duração dos Serviços</span>
                <span className="text-[11px] text-stone-400">Exibe tempo estimado (ex: 30 min)</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showServiceDuration !== false}
                onChange={(e) => handleChange('showServiceDuration', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-stone-900 border border-stone-800 rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Exibir Preço dos Serviços</span>
                <span className="text-[11px] text-stone-400">Exibe o valor do serviço em R$</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showServicePrice !== false}
                onChange={(e) => handleChange('showServicePrice', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CANCELAMENTO PELO CLIENTE */}
      {/* ======================================================== */}
      {activeSubTab === 'cancelamento' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Regras de Cancelamento de Agendamento</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Controle se os clientes podem cancelar seus próprios horários, prazos mínimos de antecedência e notificações.
            </p>
          </div>

          {/* Toggle Principal: Permitir / Bloquear Cancelamento */}
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">
                Permitir Cancelamento pelo Painel do Cliente
              </span>
              <p className="text-xs text-stone-400">
                Se desativado, o cliente será instruído a entrar em contato com a barbearia por WhatsApp.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowClientCancellation !== false}
                onChange={(e) => handleChange('allowClientCancellation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Prazo Mínimo em Horas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                <span>Prazo Mínimo de Antecedência (Horas)</span>
                <span className="text-[10px] text-stone-400">0 = sem limite de antecedência</span>
              </label>
              <input
                type="number"
                min={0}
                max={48}
                value={formData.cancellationMinHours ?? 2}
                onChange={(e) => handleChange('cancellationMinHours', Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Solicitar Motivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Solicitar Motivo do Cancelamento
              </label>
              <select
                value={formData.cancellationReasonMode ?? 'optional'}
                onChange={(e) => handleChange('cancellationReasonMode', e.target.value as any)}
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="none">Não solicitar motivo</option>
                <option value="optional">Opcional (cliente informa se quiser)</option>
                <option value="required">Obrigatório (cliente deve justificar)</option>
              </select>
            </div>
          </div>

          {/* Texto Explicativo para o Cliente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">
              Política de Cancelamento (Apresentada ao cliente na tela de agendamentos)
            </label>
            <textarea
              rows={2}
              value={formData.cancellationNoticeText ?? 'Você pode cancelar seu agendamento gratuitamente até 2 horas antes do horário marcado.'}
              onChange={(e) => handleChange('cancellationNoticeText', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Automações ao Cancelar */}
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-stone-400">
              Automações ao Cancelar
            </h4>
            
            <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Liberar automaticamente o horário cancelado na agenda
                </span>
                <span className="text-[11px] text-stone-400">
                  Permite que outro cliente marque imediatamente o mesmo dia e horário
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoFreeSlotOnCancel !== false}
                onChange={(e) => handleChange('autoFreeSlotOnCancel', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Criar notificação no painel administrativo da barbearia
                </span>
                <span className="text-[11px] text-stone-400">
                  Exibe o badge e o histórico de cancelamento no sininho de notificações do admin
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyAdminOnCancel !== false}
                onChange={(e) => handleChange('notifyAdminOnCancel', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800/80 rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Enviar mensagem para o WhatsApp da barbearia
                </span>
                <span className="text-[11px] text-stone-400">
                  Prepara e envia automaticamente os detalhes do cancelamento para o número da barbearia
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.sendWhatsAppOnCancel !== false}
                onChange={(e) => handleChange('sendWhatsAppOnCancel', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MENSAGENS E TEMPLATES WHATSAPP */}
      {/* ======================================================== */}
      {activeSubTab === 'mensagens' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>Modelos de Mensagens WhatsApp & Notificações</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Personalize o texto das mensagens enviadas via WhatsApp. As variáveis entre colchetes serão substituídas automaticamente.
            </p>
          </div>

          <div className="space-y-4">
            {/* Mensagem de Cancelamento pelo Cliente */}
            <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400">
                  Mensagem de Cancelamento pelo Cliente (Enviada à Barbearia)
                </span>
                <span className="text-[10px] text-stone-500">
                  Variáveis: [Nome do cliente], [Serviço], [Profissional], [Data], [Horário], [Motivo]
                </span>
              </div>
              <textarea
                rows={7}
                value={formData.msgBookingCancelledByClient ?? `❌ *Cancelamento de agendamento*\nCliente: [Nome do cliente]\nServiço: [Serviço]\nBarbeiro: [Profissional]\nData: [Data]\nHorário: [Horário]\nMotivo: [Motivo]\n\nO cliente cancelou este agendamento pelo aplicativo.`}
                onChange={(e) => handleChange('msgBookingCancelledByClient', e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 font-mono focus:outline-none focus:border-amber-500 resize-y"
              />
            </div>

            {/* Mensagem de Agendamento Confirmado */}
            <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">
                Mensagem de Agendamento Confirmado
              </span>
              <textarea
                rows={3}
                value={formData.msgBookingConfirmed ?? 'Seu agendamento foi confirmado com sucesso na BARBEARIA DO VINICIUS!'}
                onChange={(e) => handleChange('msgBookingConfirmed', e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 font-mono focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. VISUAL & CORES */}
      {/* ======================================================== */}
      {activeSubTab === 'visual' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <span>Identidade Visual & Paleta do Portal</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Escolha a cor de destaque e o arredondamento dos cartões e botões para o Portal do Cliente.
            </p>
          </div>

          {/* Paleta de Cores */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white block">
              Cor de Destaque Primária (Botões e Realces)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themeColors.map((color) => {
                const isSelected = (formData.primaryColor || 'amber') === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleChange('primaryColor', color.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-stone-800 border-amber-400 ring-2 ring-amber-400/30'
                        : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${color.bgClass} flex items-center justify-center shrink-0 shadow-md`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-stone-950 stroke-[3]" />}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-white block truncate">{color.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono">{color.hex}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estilo de Arredondamento */}
          <div className="space-y-3 pt-4 border-t border-stone-800">
            <label className="text-xs font-bold text-white block">
              Estilo de Arredondamento dos Cards e Botões
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {borderRadii.map((rad) => {
                const isSelected = (formData.borderRadius || 'rounded-2xl') === rad.id;
                return (
                  <button
                    key={rad.id}
                    type="button"
                    onClick={() => handleChange('borderRadius', rad.id)}
                    className={`p-4 border text-center transition cursor-pointer ${rad.example} ${
                      isSelected
                        ? 'bg-stone-800 border-amber-400 ring-2 ring-amber-400/30 text-white font-bold'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="text-xs">{rad.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SEÇÕES ATIVAS DO PORTAL */}
      {/* ======================================================== */}
      {activeSubTab === 'secoes' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Visibilidade de Seções no Portal do Cliente</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Ative ou desative seções inteiras do portal do cliente de forma rápida e segura.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Banner Superior (Logo & Nome)</span>
                <span className="text-[11px] text-stone-400">Exibe o topo com imagem de fundo, logo e título</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showHeroSection !== false}
                onChange={(e) => handleChange('showHeroSection', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Cartão de Próximo Horário Marcado</span>
                <span className="text-[11px] text-stone-400">Mostra o agendamento mais recente no topo</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showUpcomingSection !== false}
                onChange={(e) => handleChange('showUpcomingSection', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Botão Principal de Agendar</span>
                <span className="text-[11px] text-stone-400">Botão dourado "Agendar meu horário"</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showQuickBookingButton !== false}
                onChange={(e) => handleChange('showQuickBookingButton', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Botão "Meus Agendamentos"</span>
                <span className="text-[11px] text-stone-400">Permite ao cliente consultar e cancelar agendamentos</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showMyAppointmentsButton !== false}
                onChange={(e) => handleChange('showMyAppointmentsButton', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Endereço no Rodapé</span>
                <span className="text-[11px] text-stone-400">Exibe a localização com link no rodapé</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showAddressOnHome !== false}
                onChange={(e) => handleChange('showAddressOnHome', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">WhatsApp no Rodapé</span>
                <span className="text-[11px] text-stone-400">Exibe o botão de contato direto por WhatsApp</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showPhoneOnHome !== false}
                onChange={(e) => handleChange('showPhoneOnHome', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Instagram no Rodapé</span>
                <span className="text-[11px] text-stone-400">Exibe o perfil social da barbearia</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showInstagramOnHome !== false}
                onChange={(e) => handleChange('showInstagramOnHome', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Link de Acesso Administrativo no Rodapé</span>
                <span className="text-[11px] text-stone-400">Permite abrir o login do painel de administração</span>
              </div>
              <input
                type="checkbox"
                checked={formData.showAdminAccessFooter !== false}
                onChange={(e) => handleChange('showAdminAccessFooter', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Botão de Ação Salvar Flutuante / Fixo no Rodapé do Formulário */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="px-4 py-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>Prévia do Cliente</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-stone-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Salvando alterações...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Todas as Alterações</span>
            </>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE PRÉ-VISUALIZAÇÃO INTERATIVA EM SMARTPHONE */}
      {/* ======================================================== */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-stone-950 border border-stone-800 rounded-[36px] p-5 shadow-2xl overflow-hidden relative">
            {/* Barra do Smartphone (Speaker & Cam) */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800/80 mb-3">
              <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulação Visual do Cliente</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-stone-400 hover:text-white text-xs font-bold px-2 py-1 bg-stone-900 rounded-lg cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Mockup do Portal do Cliente */}
            <div className="max-h-[520px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {/* Header do Cliente */}
              <div className="text-center p-4 bg-gradient-to-b from-stone-900 to-stone-950 rounded-2xl border border-stone-800/60 relative overflow-hidden">
                {formData.heroBackground && (
                  <img
                    src={formData.heroBackground}
                    alt="Banner"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-1 mb-2">
                    <img
                      src={formData.logo || '/logo_vinicius.jpg'}
                      alt="Logo"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo_vinicius.jpg';
                      }}
                    />
                  </div>
                  <h3 className="text-base font-black text-white tracking-wide">
                    {cleanBarbershopTitle(formData.clientTopTitle || formData.name || 'BARBEARIA DO VINICIUS')}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-medium">
                    {formData.clientSubtitle || formData.tagline || 'Seu estilo, sua identidade.'}
                  </p>
                </div>
              </div>

              {/* Aviso Informativo */}
              {formData.showNoticeOnHome !== false && formData.informativeNotice && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <p>{formData.informativeNotice}</p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-2">
                {formData.showQuickBookingButton !== false && (
                  <button
                    type="button"
                    className="w-full py-3 bg-amber-500 text-stone-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20"
                  >
                    {formData.bookingButtonText || 'Agendar meu horário'}
                  </button>
                )}

                {formData.showMyAppointmentsButton !== false && (
                  <button
                    type="button"
                    className="w-full py-2.5 bg-stone-900 border border-stone-800 text-stone-300 font-bold rounded-xl text-xs"
                  >
                    {formData.myAppointmentsButtonText || 'Meus agendamentos'}
                  </button>
                )}
              </div>

              {/* Informações de Contato na Home */}
              <div className="p-3 bg-stone-900/60 border border-stone-800/80 rounded-xl text-[11px] text-stone-400 space-y-2">
                {formData.showWorkingHoursOnHome !== false && (
                  <div className="flex items-center gap-2 text-stone-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{formData.workingHours || 'Segunda a Sábado, das 08:00 às 18:00'}</span>
                  </div>
                )}
                {formData.showPhoneOnHome !== false && (
                  <div className="flex items-center gap-2 text-stone-300">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{formData.whatsapp || formData.phone || '(11) 98765-4321'}</span>
                  </div>
                )}
                {formData.showAddressOnHome !== false && (
                  <div className="flex items-center gap-2 text-stone-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{formData.address || 'Rua das Flores, 142 - Centro'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 mt-3 flex items-center justify-between">
              <span className="text-[10px] text-stone-500">Prévia atualizada dinamicamente</span>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewOpen(false);
                  onGoToClientArea();
                }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Abrir Portal Real →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
