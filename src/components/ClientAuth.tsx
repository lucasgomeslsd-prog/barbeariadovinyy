import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { 
  Phone, 
  User, 
  ArrowRight, 
  Clock, 
  Camera, 
  Mail, 
  MapPin, 
  Calendar,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ClientProfile, BarbershopConfig } from '../types';
import { formatPhoneMask, saveStoredClient, getStoredConfig, cleanBarbershopTitle } from '../utils/storage';
import { BarbershopLogo } from './common/BarbershopLogo';
import { getBrandButtonStyle, getBrandButtonRadiusClass } from '../utils/theme';

interface ClientAuthProps {
  config?: BarbershopConfig;
  onAuthenticated: (client: ClientProfile) => void;
  onGoToAdmin?: () => void;
  onBackToHome?: () => void;
}

export function ClientAuth({ 
  config: propConfig, 
  onAuthenticated, 
  onGoToAdmin,
  onBackToHome
}: ClientAuthProps) {
  const [config, setConfig] = useState<BarbershopConfig>(propConfig || getStoredConfig());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');

  // Sincroniza configurações em tempo real se o admin mudar logo, cores ou nome
  useEffect(() => {
    const handleSync = () => {
      setConfig(getStoredConfig());
    };
    window.addEventListener('barbershop_sync', handleSync);
    return () => window.removeEventListener('barbershop_sync', handleSync);
  }, []);

  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
    }
  }, [propConfig]);

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneMask(e.target.value);
    setPhone(formatted);
    if (error) setError('');
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError('');
  };

  // Upload opcional de foto de perfil
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('A foto deve ter no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanName || cleanName.length < 3) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Por favor, informe um número de celular válido com DDD.');
      return;
    }

    const newClient: ClientProfile = {
      id: `client-${cleanPhone}`,
      name: cleanName,
      phone: phone,
      photo: photoUrl || '',
      email: email.trim() || '',
      address: address.trim() || '',
      birthDate: birthDate || '',
      createdAt: new Date().toISOString(),
    };

    saveStoredClient(newClient);
    onAuthenticated(newClient);
  };

  const primaryBtnStyle = getBrandButtonStyle(config);
  const btnRadiusClass = getBrandButtonRadiusClass(config);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-blue-600 selection:text-white">
      {/* Faixa superior Barber Pole */}
      <div className="fixed top-0 left-0 right-0 barber-pole-stripes h-1.5 w-full z-20 shadow-sm" aria-hidden="true" />

      {/* Fundo sutil com imagem se configurada */}
      {config.heroBackground && (
        <div 
          className="fixed inset-0 bg-cover bg-center opacity-10 pointer-events-none"
          style={{ backgroundImage: `url(${config.heroBackground})` }}
        />
      )}

      <div className="w-full max-w-md bg-stone-900/90 border border-stone-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 backdrop-blur-md animate-fadeIn overflow-hidden">
        {/* Linha decorativa tricolor no topo do card */}
        <div className="absolute top-0 left-0 right-0 h-1 barber-pole-stripes-slim" />
        
        {/* ======================================================== */}
        {/* 1. LOGO DA BARBEARIA EM DESTAQUE NO TOPO */}
        {/* ======================================================== */}
        <div className="flex flex-col items-center text-center mb-6 pt-1">
          <div className="mb-3 hover:scale-105 transition-transform duration-300">
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
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xs font-medium">
              {config.clientSubtitle || config.tagline}
            </p>
          )}

          {config.workingHours && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-950/40 border border-blue-900/60 text-blue-200 text-xs font-medium shadow-inner">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{config.workingHours}</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. CHAMADA "Crie seu cadastro" */}
        {/* ======================================================== */}
        <div className="mb-6 p-4 rounded-2xl bg-stone-950/60 border border-blue-950/80 text-left flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30"
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Crie seu cadastro</h2>
            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
              Informe seus dados para agendar seus horários e consultar seus atendimentos em poucos segundos.
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. FORMULÁRIO DE CADASTRAMENTO */}
        {/* ======================================================== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Foto de Perfil Opcional (se ativada pelo Admin) */}
          {config.profileShowPhoto !== false && (
            <div className="flex flex-col items-center justify-center pb-2">
              <label 
                htmlFor="client-photo-upload" 
                className="relative group cursor-pointer flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-stone-950 border-2 border-stone-700 group-hover:border-blue-500 flex items-center justify-center overflow-hidden transition-all shadow-lg">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center text-stone-500 group-hover:text-blue-400 transition-colors">
                      <Camera className="w-6 h-6 mb-0.5" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">Foto</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-stone-400 group-hover:text-stone-200 mt-1.5 transition">
                  {photoUrl ? 'Trocar foto do perfil' : 'Adicionar foto do perfil (opcional)'}
                </span>
                <input 
                  id="client-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label htmlFor="client-name" className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
              Nome Completo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <User className="w-5 h-5" />
              </div>
              <input
                id="client-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Ex: Lucas Ferreira"
                className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 text-sm"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Telefone / WhatsApp */}
          <div>
            <label htmlFor="client-phone" className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
              Telefone / WhatsApp *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Phone className="w-5 h-5" />
              </div>
              <input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 text-sm font-mono"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Outros dados configurados pelo Admin: E-mail */}
          {config.profileShowEmail && (
            <div>
              <label htmlFor="client-email" className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                E-mail (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 text-sm"
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          {/* Outros dados configurados pelo Admin: Endereço */}
          {config.profileShowAddress && (
            <div>
              <label htmlFor="client-address" className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Endereço (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="client-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          )}

          {/* Outros dados configurados pelo Admin: Data de Nascimento */}
          {config.profileShowBirthDate && (
            <div>
              <label htmlFor="client-birthdate" className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Data de Nascimento (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="client-birthdate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs font-medium bg-red-950/40 border border-red-900/50 rounded-xl p-3">
              {error}
            </p>
          )}

          {/* ======================================================== */}
          {/* 4. BOTÃO "Criar cadastro" DINÂMICO COM CORES DO ADMIN */}
          {/* ======================================================== */}
          <button
            id="btn-submit-auth"
            type="submit"
            style={primaryBtnStyle}
            className={`w-full mt-3 py-4 px-5 font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98] ${btnRadiusClass}`}
          >
            <span>Criar cadastro</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Endereço / Contato da Barbearia no rodapé */}
        {config.address && (
          <p className="text-center text-xs text-stone-500 mt-6">
            {config.address} {config.number && `nº ${config.number}`} {config.city && `- ${config.city}/${config.state || ''}`}
          </p>
        )}

        {/* Botão para voltar à página da barbearia sem login */}
        {onBackToHome && (
          <div className="mt-4 pt-4 border-t border-stone-800/80 text-center">
            <button
              id="btn-voltar-home-auth"
              type="button"
              onClick={onBackToHome}
              className="text-xs font-semibold text-stone-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-lg bg-stone-800/50 hover:bg-stone-800"
            >
              <span>← Voltar para a página da barbearia</span>
            </button>
          </div>
        )}

        {/* Link para o Painel do Administrador */}
        {onGoToAdmin && (
          <div className="mt-3 pt-3 border-t border-stone-800/40 text-center">
            <button
              id="btn-link-admin-auth"
              type="button"
              onClick={onGoToAdmin}
              className="text-[11px] text-stone-500 hover:text-blue-400 transition cursor-pointer"
            >
              É da barbearia? Acessar Painel Administrativo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
