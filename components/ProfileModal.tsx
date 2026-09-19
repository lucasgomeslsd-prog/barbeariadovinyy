import { useState, type ChangeEvent, type FormEvent } from 'react';
import { X, User, Phone, Check, LogOut, Mail, MapPin, Calendar, Lock } from 'lucide-react';
import { ClientProfile } from '../types';
import { formatPhoneMask, saveStoredClient, clearStoredClient, getStoredConfig, cleanBarbershopName } from '../utils/storage';
import { BarbershopLogo } from './common/BarbershopLogo';
import { getBrandButtonStyle, getBrandButtonRadiusClass } from '../utils/theme';

interface ProfileModalProps {
  client: ClientProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClient: (updated: ClientProfile) => void;
  onLogout: () => void;
}

export function ProfileModal({
  client,
  isOpen,
  onClose,
  onUpdateClient,
  onLogout,
}: ProfileModalProps) {
  const config = getStoredConfig();

  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email || '');
  const [address, setAddress] = useState(client.address || '');
  const [birthDate, setBirthDate] = useState(client.birthDate || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const allowEditName = config.profileAllowEditName !== false;
  const allowEditPhone = config.profileAllowEditPhone !== false;
  const allowEditEmail = config.profileAllowEditEmail !== false;
  const allowEditAddress = config.profileAllowEditAddress !== false;
  const allowEditBirthDate = config.profileAllowEditBirthDate !== false;

  const showEmail = config.profileShowEmail !== false;
  const showAddress = config.profileShowAddress !== false;
  const showBirthDate = config.profileShowBirthDate !== false;

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!allowEditPhone) return;
    setPhone(formatPhoneMask(e.target.value));
    if (error) setError('');
    if (savedSuccess) setSavedSuccess(false);
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!allowEditName) return;
    setName(e.target.value);
    if (error) setError('');
    if (savedSuccess) setSavedSuccess(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanName || cleanName.length < 3) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Por favor, informe um número de celular válido.');
      return;
    }

    const updated: ClientProfile = {
      ...client,
      name: allowEditName ? cleanName : client.name,
      phone: allowEditPhone ? phone : client.phone,
      email: showEmail ? (allowEditEmail ? email.trim() : client.email) : client.email,
      address: showAddress ? (allowEditAddress ? address.trim() : client.address) : client.address,
      birthDate: showBirthDate ? (allowEditBirthDate ? birthDate : client.birthDate) : client.birthDate,
    };

    saveStoredClient(updated);
    onUpdateClient(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    clearStoredClient();
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Header do Perfil com Logo da Barbearia */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <BarbershopLogo config={config} size="sm" showBorder={true} />
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Meu Perfil</h2>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider">{cleanBarbershopName(config.name)}</p>
            </div>
          </div>
          <button
            id="btn-fechar-perfil"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com Suporte às Configurações do Admin */}
        <form onSubmit={handleSave} className="space-y-4 my-5">
          {/* Nome */}
          <div>
            <label
              htmlFor="edit-profile-name"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center justify-between"
            >
              <span>Nome</span>
              {!allowEditName && (
                <span className="text-[10px] text-stone-500 flex items-center gap-1 font-normal lowercase">
                  <Lock className="w-2.5 h-2.5" /> bloqueado pelo admin
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="edit-profile-name"
                type="text"
                disabled={!allowEditName}
                value={name}
                onChange={handleNameChange}
                placeholder="Seu nome"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-stone-100 text-sm focus:outline-none ${
                  allowEditName
                    ? 'bg-stone-950 border-stone-800 focus:border-blue-500'
                    : 'bg-stone-900/60 border-stone-800/60 text-stone-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Celular / WhatsApp */}
          <div>
            <label
              htmlFor="edit-profile-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center justify-between"
            >
              <span>Celular / WhatsApp</span>
              {!allowEditPhone && (
                <span className="text-[10px] text-stone-500 flex items-center gap-1 font-normal lowercase">
                  <Lock className="w-2.5 h-2.5" /> bloqueado pelo admin
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="edit-profile-phone"
                type="tel"
                disabled={!allowEditPhone}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-stone-100 font-mono text-sm focus:outline-none ${
                  allowEditPhone
                    ? 'bg-stone-950 border-stone-800 focus:border-blue-500'
                    : 'bg-stone-900/60 border-stone-800/60 text-stone-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* E-mail (Opcional por config) */}
          {showEmail && (
            <div>
              <label
                htmlFor="edit-profile-email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center justify-between"
              >
                <span>E-mail</span>
                {!allowEditEmail && (
                  <span className="text-[10px] text-stone-500 flex items-center gap-1 font-normal lowercase">
                    <Lock className="w-2.5 h-2.5" /> bloqueado
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="edit-profile-email"
                  type="email"
                  disabled={!allowEditEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-stone-100 text-sm focus:outline-none ${
                    allowEditEmail
                      ? 'bg-stone-950 border-stone-800 focus:border-blue-500'
                      : 'bg-stone-900/60 border-stone-800/60 text-stone-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Endereço (Opcional por config) */}
          {showAddress && (
            <div>
              <label
                htmlFor="edit-profile-address"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center justify-between"
              >
                <span>Endereço</span>
                {!allowEditAddress && (
                  <span className="text-[10px] text-stone-500 flex items-center gap-1 font-normal lowercase">
                    <Lock className="w-2.5 h-2.5" /> bloqueado
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="edit-profile-address"
                  type="text"
                  disabled={!allowEditAddress}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, bairro, cidade..."
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-stone-100 text-sm focus:outline-none ${
                    allowEditAddress
                      ? 'bg-stone-950 border-stone-800 focus:border-blue-500'
                      : 'bg-stone-900/60 border-stone-800/60 text-stone-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Data de Nascimento (Opcional por config) */}
          {showBirthDate && (
            <div>
              <label
                htmlFor="edit-profile-birthdate"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center justify-between"
              >
                <span>Data de Nascimento</span>
                {!allowEditBirthDate && (
                  <span className="text-[10px] text-stone-500 flex items-center gap-1 font-normal lowercase">
                    <Lock className="w-2.5 h-2.5" /> bloqueado
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="edit-profile-birthdate"
                  type="date"
                  disabled={!allowEditBirthDate}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-stone-100 text-sm focus:outline-none ${
                    allowEditBirthDate
                      ? 'bg-stone-950 border-stone-800 focus:border-blue-500'
                      : 'bg-stone-900/60 border-stone-800/60 text-stone-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded-lg p-2">
              {error}
            </p>
          )}

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-900/50 rounded-lg p-2">
              <Check className="w-4 h-4" />
              <span>Informações salvas com sucesso!</span>
            </div>
          )}

          <button
            id="btn-salvar-perfil"
            type="submit"
            style={getBrandButtonStyle(config)}
            className={`w-full py-3 font-bold text-sm transition cursor-pointer shadow-md hover:brightness-110 active:scale-[0.98] ${getBrandButtonRadiusClass(config)}`}
          >
            Salvar alterações
          </button>
        </form>

        {/* Botão para Sair / Trocar de Cliente */}
        <div className="pt-3 border-t border-stone-800 text-center">
          <button
            id="btn-logout-cliente"
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair / Trocar de cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
}

