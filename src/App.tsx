/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { ClientProfile, Appointment, AppScreen, BarbershopConfig } from './types';
import { 
  getStoredClient, 
  saveStoredClient,
  getAllAppointments, 
  isAdminLoggedIn, 
  setAdminLoggedIn,
  getStoredConfig,
  getUnacknowledgedStatusChanges
} from './utils/storage';
import { applyThemeToDocument } from './utils/theme';
import { ClientAuth } from './components/ClientAuth';
import { HomeScreen } from './components/HomeScreen';
import { BookingFlow } from './components/BookingFlow';
import { MyAppointmentsScreen } from './components/MyAppointmentsScreen';
import { ProfileModal } from './components/ProfileModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  // Estado de autenticação simplificada do cliente
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [config, setConfig] = useState<BarbershopConfig>(getStoredConfig());

  // Carrega cliente, agendamentos e status do admin na inicialização
  useEffect(() => {
    const storedClient = getStoredClient();
    if (storedClient) {
      setClient(storedClient);
    }
    const all = getAllAppointments();
    setAppointments(all);
    const initialConfig = getStoredConfig();
    setConfig(initialConfig);
    applyThemeToDocument(initialConfig);

    const isLogged = isAdminLoggedIn();
    setAdminAuth(isLogged);

    // ========================================================
    // GARANTIA: TODA VEZ QUE UM LINK FOR ENVIADO/ABERTO,
    // APARECE DIRETAMENTE NA PÁGINA DO CLIENTE!
    // ========================================================
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page') || urlParams.get('screen') || urlParams.get('tab');
      const phoneParam = urlParams.get('phone');
      const appParam = urlParams.get('app') || urlParams.get('appointmentId');
      const adminParam = urlParams.get('admin');

      // Se o link contiver um agendamento específico (ex: link enviado no WhatsApp)
      if (appParam) {
        const foundApp = all.find((a) => a.id === appParam);
        if (foundApp) {
          if (!storedClient) {
            const reconstructedClient: ClientProfile = {
              id: foundApp.clientId || `client-${foundApp.clientPhone.replace(/\D/g, '')}`,
              name: foundApp.clientName,
              phone: foundApp.clientPhone,
              createdAt: new Date().toISOString(),
            };
            setClient(reconstructedClient);
            saveStoredClient(reconstructedClient);
          }
          setCurrentScreen('appointments');
          setIsInitialized(true);
          return;
        }
      }

      // Se houver parâmetro de telefone
      if (phoneParam) {
        const cleanParamPhone = phoneParam.replace(/\D/g, '');
        const clientApps = all.filter((a) => a.clientPhone.replace(/\D/g, '') === cleanParamPhone);
        if (clientApps.length > 0 && !storedClient) {
          const first = clientApps[0];
          const reconstructedClient: ClientProfile = {
            id: first.clientId || `client-${cleanParamPhone}`,
            name: first.clientName,
            phone: first.clientPhone,
            createdAt: new Date().toISOString(),
          };
          setClient(reconstructedClient);
          saveStoredClient(reconstructedClient);
        }
      }

      // Se for explicitamente solicitado o painel de administração via URL
      if (pageParam === 'admin' || adminParam === 'true' || adminParam === 'login') {
        if (isLogged) {
          setCurrentScreen('admin-dashboard');
        } else {
          setCurrentScreen('admin-login');
        }
        setIsInitialized(true);
        return;
      }

      // Se o link pedir a tela de agendamento diretamente
      if (pageParam === 'booking' || pageParam === 'agendar') {
        setCurrentScreen('booking');
        setIsInitialized(true);
        return;
      }

      // Se o link pedir a tela de agendamentos
      if (pageParam === 'appointments' || pageParam === 'meus-agendamentos') {
        setCurrentScreen('appointments');
        setIsInitialized(true);
        return;
      }

      // EM QUALQUER OUTRO CASO: Sempre direciona para a Página do Cliente ('home')!
      setCurrentScreen('home');
    }

    setIsInitialized(true);
  }, []);

  // Listener para sincronização global de dados
  useEffect(() => {
    const handleSync = () => {
      setAppointments(getAllAppointments());
      setAdminAuth(isAdminLoggedIn());
      const updatedConfig = getStoredConfig();
      setConfig(updatedConfig);
      applyThemeToDocument(updatedConfig);
    };
    window.addEventListener('barbershop_sync', handleSync);
    return () => window.removeEventListener('barbershop_sync', handleSync);
  }, []);

  // Atualiza tema sempre que config for alterada
  useEffect(() => {
    if (config) {
      applyThemeToDocument(config);
    }
  }, [config]);

  // Recarrega agendamentos atualizados
  const refreshAppointments = () => {
    const updated = getAllAppointments();
    setAppointments(updated);
  };

  // Agendamentos pertencentes estritamente a este cliente (por ID ou telefone)
  const clientAppointments = useMemo(() => {
    if (!client) return [];
    const cleanClientPhone = client.phone ? client.phone.replace(/\D/g, '') : '';
    return appointments
      .filter((a) => a.clientId === client.id || (cleanClientPhone && a.clientPhone.replace(/\D/g, '') === cleanClientPhone))
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments, client]);

  // Próximo agendamento ativo (Pendente ou Confirmado com data >= hoje)
  const upcomingAppointment = useMemo(() => {
    if (!clientAppointments.length) return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const activeFuture = clientAppointments
      .filter(
        (a) =>
          (a.status === 'Confirmado' || a.status === 'Pendente') &&
          a.date >= todayStr
      )
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    return activeFuture[0] || null;
  }, [clientAppointments]);

  // Alertas de atualização de status para o cliente
  const unacknowledgedStatusChanges = useMemo(() => {
    return getUnacknowledgedStatusChanges(clientAppointments);
  }, [clientAppointments]);

  // Transição suave de carregamento
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-blue-500">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-red-600 border-r-white rounded-full animate-spin" />
        <span className="text-xs text-stone-400 font-semibold mt-3">Carregando barbearia...</span>
      </div>
    );
  }

  // ========================================================
  // FLUXO ADMINISTRATIVO
  // ========================================================
  if (currentScreen === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setAdminAuth(true);
          setCurrentScreen('admin-dashboard');
        }}
        onBackToClient={() => {
          setCurrentScreen('home');
        }}
      />
    );
  }

  if (currentScreen === 'admin-dashboard') {
    if (!adminAuth) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            setAdminAuth(true);
            setCurrentScreen('admin-dashboard');
          }}
          onBackToClient={() => {
            setCurrentScreen('home');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        onLogout={() => {
          setAdminAuth(false);
          setAdminLoggedIn(false);
          setCurrentScreen('home');
        }}
        onGoToClientArea={() => {
          setCurrentScreen('home');
        }}
      />
    );
  }

  // ========================================================
  // FLUXO DO CLIENTE (EXIGE CADASTRO / IDENTIFICAÇÃO PRÉVIA)
  // ========================================================
  // Se o cliente ainda não estiver cadastrado no dispositivo,
  // exige o cadastro antes de liberar o acesso à barbearia e agendamentos
  if (!client) {
    return (
      <ClientAuth
        config={config}
        onAuthenticated={(newClient) => {
          setClient(newClient);
          refreshAppointments();
          setCurrentScreen('home');
        }}
        onGoToAdmin={() => {
          if (isAdminLoggedIn()) {
            setCurrentScreen('admin-dashboard');
          } else {
            setCurrentScreen('admin-login');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-blue-600 selection:text-white antialiased font-sans flex flex-col">
      {/* Faixa clássica Barber Pole no topo (Azul, Branco e Vermelho) */}
      <div className="barber-pole-stripes h-1.5 w-full shrink-0 shadow-sm" aria-hidden="true" />

      {/* 1. Tela Principal da Barbearia (Página do Cliente) */}
      {currentScreen === 'home' && (
        <HomeScreen
          client={client}
          config={config}
          upcomingAppointment={upcomingAppointment}
          appointmentsCount={clientAppointments.filter((a) => a.status !== 'Cancelado').length}
          unacknowledgedStatusChangesCount={unacknowledgedStatusChanges.length}
          upcomingStatusChange={
            upcomingAppointment
              ? unacknowledgedStatusChanges.find((c) => c.appointmentId === upcomingAppointment.id) || null
              : null
          }
          onGoToBooking={() => setCurrentScreen('booking')}
          onGoToAppointments={() => {
            if (client) {
              setCurrentScreen('appointments');
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          onOpenProfile={() => {
            if (client) {
              setIsProfileOpen(true);
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          onGoToAdmin={() => {
            if (isAdminLoggedIn()) {
              setCurrentScreen('admin-dashboard');
            } else {
              setCurrentScreen('admin-login');
            }
          }}
        />
      )}

      {/* 2. Fluxo de Agendamento */}
      {currentScreen === 'booking' && (
        <BookingFlow
          client={client}
          existingAppointments={appointments}
          onClientIdentified={(newClient) => {
            setClient(newClient);
          }}
          onAppointmentCreated={() => {
            refreshAppointments();
          }}
          onCancelBooking={() => setCurrentScreen('home')}
          onGoToMyAppointments={() => {
            refreshAppointments();
            setCurrentScreen('appointments');
          }}
        />
      )}

      {/* 3. Tela "Meus Agendamentos" */}
      {currentScreen === 'appointments' && (
        <MyAppointmentsScreen
          appointments={clientAppointments}
          onBackToHome={() => setCurrentScreen('home')}
          onGoToBooking={() => setCurrentScreen('booking')}
          onAppointmentCancelled={() => {
            refreshAppointments();
          }}
        />
      )}

      {/* 4. Modal de Identificação / Login do Cliente (quando solicitado) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/95 backdrop-blur-md">
          <ClientAuth
            config={config}
            onAuthenticated={(newClient) => {
              setClient(newClient);
              setIsAuthModalOpen(false);
              refreshAppointments();
            }}
            onBackToHome={() => setIsAuthModalOpen(false)}
            onGoToAdmin={() => {
              setIsAuthModalOpen(false);
              if (isAdminLoggedIn()) {
                setCurrentScreen('admin-dashboard');
              } else {
                setCurrentScreen('admin-login');
              }
            }}
          />
        </div>
      )}

      {/* 5. Modal de Perfil Simples (para clientes autenticados) */}
      {client && (
        <ProfileModal
          client={client}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onUpdateClient={(updated) => {
            setClient(updated);
          }}
          onLogout={() => {
            setClient(null);
            setIsProfileOpen(false);
            setCurrentScreen('home');
          }}
        />
      )}
    </div>
  );
}
