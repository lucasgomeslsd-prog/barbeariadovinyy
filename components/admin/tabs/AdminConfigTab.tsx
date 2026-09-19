import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { 
  Building2, 
  CreditCard, 
  Ban, 
  Plus, 
  Trash2, 
  Check,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Database,
  Cloud,
  Palette,
  MapPin,
  Instagram,
  Mail,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { BarbershopConfig, BlockedSlot } from '../../../types';
import { saveStoredConfig, changeAdminPassword, cleanBarbershopName, cleanBarbershopTitle } from '../../../utils/storage';

interface AdminConfigTabProps {
  config: BarbershopConfig;
  onRefresh: () => void;
}

export function AdminConfigTab({ config, onRefresh }: AdminConfigTabProps) {
  // Estados do formulário - Informações editáveis do estabelecimento
  const [name, setName] = useState(config.name);
  const [tagline, setTagline] = useState(config.tagline);
  const [phone, setPhone] = useState(config.phone);
  const [whatsapp, setWhatsapp] = useState(config.whatsapp || config.phone);
  const [email, setEmail] = useState(config.email || '');
  const [address, setAddress] = useState(config.address);
  const [number, setNumber] = useState(config.number || '');
  const [neighborhood, setNeighborhood] = useState(config.neighborhood || '');
  const [city, setCity] = useState(config.city || '');
  const [state, setState] = useState(config.state || '');
  const [postalCode, setPostalCode] = useState(config.postalCode || config.zipCode || '');
  const [instagram, setInstagram] = useState(config.instagram || '');
  const [logo, setLogo] = useState(config.logo || '/logo_vinicius.jpg');
  const [openHour, setOpenHour] = useState(config.openHour || 9);
  const [closeHour, setCloseHour] = useState(config.closeHour || 20);
  const [workingHoursText, setWorkingHoursText] = useState(config.workingHours || 'Seg - Sáb: 09:00 às 20:00');

  // Personalização do Painel do Cliente
  const [clientTopTitle, setClientTopTitle] = useState(config.clientTopTitle || config.name);
  const [presentationText, setPresentationText] = useState(config.presentationText || 'Escolha seu serviço favorito, o barbeiro de sua preferência e marque seu horário com rapidez.');
  const [informativeNotice, setInformativeNotice] = useState(config.informativeNotice || '');
  const [bookingPageTitle, setBookingPageTitle] = useState(config.bookingPageTitle || 'Novo Agendamento');
  const [bookingButtonText, setBookingButtonText] = useState(config.bookingButtonText || 'Agendar horário');
  const [myAppointmentsButtonText, setMyAppointmentsButtonText] = useState(config.myAppointmentsButtonText || 'Meus agendamentos');
  const [showAddressOnHome, setShowAddressOnHome] = useState(config.showAddressOnHome !== false);
  const [showPhoneOnHome, setShowPhoneOnHome] = useState(config.showPhoneOnHome !== false);
  const [showWorkingHoursOnHome, setShowWorkingHoursOnHome] = useState(config.showWorkingHoursOnHome !== false);
  const [showInstagramOnHome, setShowInstagramOnHome] = useState(config.showInstagramOnHome !== false);
  const [showNoticeOnHome, setShowNoticeOnHome] = useState(config.showNoticeOnHome || false);

  // Dados PIX
  const [pixKey, setPixKey] = useState(config.pixKey);
  const [pixKeyType, setPixKeyType] = useState(config.pixKeyType);
  const [pixReceiverName, setPixReceiverName] = useState(config.pixReceiverName);
  const [pixCity, setPixCity] = useState(config.pixCity);

  // Bloqueio de horários
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(config.blockedSlots || []);
  const [blockDate, setBlockDate] = useState('');
  const [blockTime, setBlockTime] = useState('12:00');
  const [blockReason, setBlockReason] = useState('Intervalo de almoço');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Atualiza estados caso a prop `config` mude externamente
  useEffect(() => {
    setName(config.name);
    setTagline(config.tagline);
    setPhone(config.phone);
    setWhatsapp(config.whatsapp || config.phone);
    setEmail(config.email || '');
    setAddress(config.address);
    setNumber(config.number || '');
    setNeighborhood(config.neighborhood || '');
    setCity(config.city || '');
    setState(config.state || '');
    setPostalCode(config.postalCode || config.zipCode || '');
    setInstagram(config.instagram || '');
    setLogo(config.logo || '/logo_vinicius.jpg');
    setOpenHour(config.openHour || 9);
    setCloseHour(config.closeHour || 20);
    setWorkingHoursText(config.workingHours || 'Seg - Sáb: 09:00 às 20:00');
    setClientTopTitle(config.clientTopTitle || config.name);
    setPresentationText(config.presentationText || 'Escolha seu serviço favorito, o barbeiro de sua preferência e marque seu horário com rapidez.');
    setInformativeNotice(config.informativeNotice || '');
    setBookingPageTitle(config.bookingPageTitle || 'Novo Agendamento');
    setBookingButtonText(config.bookingButtonText || 'Agendar horário');
    setMyAppointmentsButtonText(config.myAppointmentsButtonText || 'Meus agendamentos');
    setShowAddressOnHome(config.showAddressOnHome !== false);
    setShowPhoneOnHome(config.showPhoneOnHome !== false);
    setShowWorkingHoursOnHome(config.showWorkingHoursOnHome !== false);
    setShowInstagramOnHome(config.showInstagramOnHome !== false);
    setShowNoticeOnHome(config.showNoticeOnHome || false);
    setPixKey(config.pixKey);
    setPixKeyType(config.pixKeyType);
    setPixReceiverName(config.pixReceiverName);
    setPixCity(config.pixCity);
    setBlockedSlots(config.blockedSlots || []);
  }, [config]);

  // Estados para alteração de senha do Admin
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Submeter alteração de senha
  const handleChangePasswordSubmit = async (e: MouseEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdFeedback({ type: 'error', message: 'Preencha todos os campos da senha.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdFeedback({ type: 'error', message: 'A nova senha deve possuir no mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdFeedback({ type: 'error', message: 'A nova senha e a confirmação não conferem.' });
      return;
    }

    setPwdLoading(true);
    setPwdFeedback(null);

    const res = await changeAdminPassword(currentPassword, newPassword, confirmPassword);
    setPwdLoading(false);

    if (res.success) {
      setPwdFeedback({ type: 'success', message: res.message || 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdFeedback(null), 5000);
    } else {
      setPwdFeedback({ type: 'error', message: res.message || 'Falha ao alterar senha. Verifique a senha atual.' });
    }
  };

  // Adicionar bloqueio de horário
  const handleAddBlock = () => {
    if (!blockDate || !blockTime) return;
    const newBlock: BlockedSlot = {
      date: blockDate,
      time: blockTime,
      reason: blockReason.trim() || 'Horário reservado pela barbearia',
    };
    setBlockedSlots([...blockedSlots, newBlock]);
    setBlockDate('');
  };

  // Remover bloqueio
  const handleRemoveBlock = (index: number) => {
    const updated = [...blockedSlots];
    updated.splice(index, 1);
    setBlockedSlots(updated);
  };

  // Salvar tudo
  const handleSaveAll = (e: FormEvent) => {
    e.preventDefault();

    const cleanedName = cleanBarbershopName(name.trim());
    const cleanedTitle = cleanBarbershopTitle(clientTopTitle.trim() || name.trim());
    const updatedConfig: BarbershopConfig = {
      ...config,
      name: cleanedName,
      tagline: tagline.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      address: address.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      instagram: instagram.trim(),
      logo: logo.trim(),
      openHour: Number(openHour),
      closeHour: Number(closeHour),
      workingHours: workingHoursText.trim(),
      // Customizações do Portal do Cliente
      clientTopTitle: cleanedTitle,
      presentationText: presentationText.trim(),
      informativeNotice: informativeNotice.trim(),
      bookingPageTitle: bookingPageTitle.trim() || 'Novo Agendamento',
      bookingButtonText: bookingButtonText.trim() || 'Agendar horário',
      myAppointmentsButtonText: myAppointmentsButtonText.trim() || 'Meus agendamentos',
      showAddressOnHome,
      showPhoneOnHome,
      showWorkingHoursOnHome,
      showInstagramOnHome,
      showNoticeOnHome,
      // Pagamento PIX
      pixKey: pixKey.trim(),
      pixKeyType,
      pixReceiverName: cleanBarbershopTitle(pixReceiverName.trim() || cleanedTitle),
      pixCity: pixCity.trim(),
      blockedSlots,
    };

    saveStoredConfig(updatedConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefresh();
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Alerta de Sucesso */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Configurações salvas e aplicadas em tempo real em toda a barbearia!</span>
        </div>
      )}

      {/* 1. DADOS GERAIS DO ESTABELECIMENTO */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Informações Editáveis do Estabelecimento
          </h3>
          <span className="text-[10px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded-md font-mono">
            Sincronização Automática
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Nome da Empresa / Barbearia *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Slogan / Subtítulo
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ex: Cortes Clássicos, Barba & Estilo"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Telefone Fixo / Comercial
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 3456-7890"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              WhatsApp da Barbearia *
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 98765-4321"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              E-mail de Contato
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@barbearia.com.br"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Instagram (@usuario ou link)
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@barbeariadovinicius"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              URL da Logomarca ou Imagem do Perfil
            </label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="/logo_vinicius.jpg ou link da imagem"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Endereço Detalhado */}
        <div className="pt-3 border-t border-stone-800 space-y-3">
          <span className="text-[11px] font-bold uppercase text-stone-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Endereço Completo do Estabelecimento
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-stone-400 mb-1">Logradouro / Rua</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="R. Pref. Osmário Gomes"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="22"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Estado</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">CEP</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="01000-000"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horários de Funcionamento */}
        <div className="pt-3 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Hora de Abertura (ex: 8)
            </label>
            <input
              type="number"
              min={6}
              max={12}
              value={openHour}
              onChange={(e) => setOpenHour(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Hora de Fechamento (ex: 19)
            </label>
            <input
              type="number"
              min={13}
              max={23}
              value={closeHour}
              onChange={(e) => setCloseHour(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Texto de Horário no Topo
            </label>
            <input
              type="text"
              value={workingHoursText}
              onChange={(e) => setWorkingHoursText(e.target.value)}
              className="w-full px-2.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 2. PERSONALIZAÇÃO DO PAINEL DO CLIENTE */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            Personalização do Painel do Cliente
          </h3>
          <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
            Visão do Cliente
          </span>
        </div>

        <p className="text-xs text-stone-400">
          Personalize as mensagens, textos e quais elementos são exibidos para o cliente no portal.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Nome Exibido no Topo do Painel
            </label>
            <input
              type="text"
              value={clientTopTitle}
              onChange={(e) => setClientTopTitle(e.target.value)}
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              placeholder="Nome exibido na tela inicial"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Título da Tela de Agendamento
            </label>
            <input
              type="text"
              value={bookingPageTitle}
              onChange={(e) => setBookingPageTitle(e.target.value)}
              placeholder="Ex: Novo Agendamento"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Texto do Botão Principal 1
            </label>
            <input
              type="text"
              value={bookingButtonText}
              onChange={(e) => setBookingButtonText(e.target.value)}
              placeholder="Agendar horário"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Texto do Botão Principal 2
            </label>
            <input
              type="text"
              value={myAppointmentsButtonText}
              onChange={(e) => setMyAppointmentsButtonText(e.target.value)}
              placeholder="Meus agendamentos"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Texto de Apresentação / Boas-vindas
            </label>
            <textarea
              rows={2}
              value={presentationText}
              onChange={(e) => setPresentationText(e.target.value)}
              placeholder="Mensagem explicativa ou de boas-vindas para o cliente na tela inicial..."
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-300">
                Aviso / Comunicado Importante para os Clientes
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNoticeOnHome}
                  onChange={(e) => setShowNoticeOnHome(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-800 text-amber-500 focus:ring-0"
                />
                <span className="text-[11px] text-amber-400 font-medium">Exibir no painel do cliente</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={informativeNotice}
              onChange={(e) => setInformativeNotice(e.target.value)}
              placeholder="Ex: Neste feriado estaremos funcionando até as 14h. Não se atrase!"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>
        </div>

        {/* Opções de visibilidade no painel do cliente */}
        <div className="pt-3 border-t border-stone-800">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-2.5">
            Elementos Visíveis no Rodapé / Tela do Cliente
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2.5 bg-stone-950 border border-stone-800 rounded-xl cursor-pointer hover:border-stone-700 transition">
              <input
                type="checkbox"
                checked={showAddressOnHome}
                onChange={(e) => setShowAddressOnHome(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-stone-300 text-[11px]">Endereço</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-stone-950 border border-stone-800 rounded-xl cursor-pointer hover:border-stone-700 transition">
              <input
                type="checkbox"
                checked={showPhoneOnHome}
                onChange={(e) => setShowPhoneOnHome(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-stone-300 text-[11px]">WhatsApp</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-stone-950 border border-stone-800 rounded-xl cursor-pointer hover:border-stone-700 transition">
              <input
                type="checkbox"
                checked={showWorkingHoursOnHome}
                onChange={(e) => setShowWorkingHoursOnHome(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-stone-300 text-[11px]">Horários</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-stone-950 border border-stone-800 rounded-xl cursor-pointer hover:border-stone-700 transition">
              <input
                type="checkbox"
                checked={showInstagramOnHome}
                onChange={(e) => setShowInstagramOnHome(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-stone-300 text-[11px]">Instagram</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. DADOS DO PAGAMENTO VIA PIX */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4" />
          Configurações de Pagamento PIX
        </h3>
        <p className="text-xs text-stone-400">
          Estes dados serão apresentados ao cliente durante a confirmação do agendamento para que ele realize a transferência.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Nome do Titular / Recebedor
            </label>
            <input
              type="text"
              value={pixReceiverName}
              onChange={(e) => setPixReceiverName(e.target.value)}
              placeholder="Ex: Pedro Henrique Alcantara"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Tipo da Chave
            </label>
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value as any)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            >
              <option value="CNPJ">CNPJ</option>
              <option value="CPF">CPF</option>
              <option value="Celular">Celular / Telefone</option>
              <option value="E-mail">E-mail</option>
              <option value="Chave Aleatória">Chave Aleatória</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Chave PIX
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex: 12.345.678/0001-90"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white font-mono focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Cidade da Conta
            </label>
            <input
              type="text"
              value={pixCity}
              onChange={(e) => setPixCity(e.target.value)}
              placeholder="Ex: São Paulo"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 3. BLOQUEIO MANUAL DE HORÁRIOS */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Ban className="w-4 h-4" />
          Bloqueio de Horários Específicos
        </h3>
        <p className="text-xs text-stone-400">
          Bloqueie horários para almoço, folgas ou manutenções. Horários bloqueados não aparecem para o cliente agendar.
        </p>

        {/* Adicionar Bloqueio */}
        <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2.5">
          <span className="text-xs font-semibold text-stone-300 block">Novo Bloqueio:</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500"
            />
            <input
              type="time"
              value={blockTime}
              onChange={(e) => setBlockTime(e.target.value)}
              className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500"
            />
            <button
              type="button"
              id="btn-adicionar-bloqueio"
              onClick={handleAddBlock}
              disabled={!blockDate}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bloquear</span>
            </button>
          </div>
        </div>

        {/* Lista de Bloqueios */}
        {blockedSlots.length === 0 ? (
          <p className="text-xs text-stone-500 italic">Nenhum horário bloqueado no momento.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {blockedSlots.map((b, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs"
              >
                <div>
                  <span className="font-bold text-stone-200">{b.date}</span> às{' '}
                  <strong className="text-amber-400">{b.time}</strong>
                  {b.reason && <span className="text-stone-400 ml-2">({b.reason})</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBlock(idx)}
                  className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                  title="Remover bloqueio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. INTEGRAÇÃO FIREBASE FIRESTORE */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-amber-400" />
            Banco de Dados em Nuvem (Google Cloud Firebase Firestore)
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Conectado em Tempo Real
          </span>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          O banco de dados Firestore está provisionado e ativo. Todos os agendamentos, serviços, configurações de disponibilidade e profissionais são sincronizados instantaneamente na nuvem com regras de segurança ativas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Database className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-stone-500 uppercase font-bold">Coleções Sincronizadas</p>
              <p className="text-xs font-bold text-white">Agendamentos & Configurações</p>
            </div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-stone-500 uppercase font-bold">Regras de Segurança</p>
              <p className="text-xs font-bold text-emerald-400">firestore.rules Implantadas</p>
            </div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-stone-500 uppercase font-bold">Sincronização</p>
              <p className="text-xs font-bold text-white">Listeners Tempo Real Ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SEGURANÇA & ALTERAÇÃO DE SENHA DO ADMINISTRADOR */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" />
            Segurança de Acesso (Alterar Senha do Administrador)
          </h3>
          <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1 bg-stone-950 px-2 py-1 rounded-md border border-stone-800">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Hash PBKDF2
          </span>
        </div>
        <p className="text-xs text-stone-400">
          Altere a senha de acesso ao painel administrativo. A nova senha será imediatamente protegida no banco de dados.
        </p>

        {/* Feedback de alteração de senha */}
        {pwdFeedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              pwdFeedback.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}
          >
            {pwdFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{pwdFeedback.message}</span>
          </div>
        )}

        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Senha Atual *
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Nova Senha * (mín. 6 dígitos)
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              id="btn-alterar-senha-admin"
              onClick={handleChangePasswordSubmit}
              disabled={pwdLoading || !currentPassword || !newPassword || !confirmPassword}
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{pwdLoading ? 'Atualizando senha...' : 'Salvar Nova Senha'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Botão Salvar Todas as Configurações */}
      <div className="pt-2">
        <button
          type="submit"
          id="btn-salvar-configuracoes"
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-stone-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>SALVAR TODAS AS CONFIGURAÇÕES</span>
        </button>
      </div>
    </form>
  );
}
