import { CSSProperties } from 'react';
import { BarbershopConfig } from '../types';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryColor: BarbershopConfig['primaryColor'];
  primaryColorHex: string;
  secondaryColorHex: string;
  buttonColorHex: string;
  buttonTextColorHex: string;
  textColorHex: string;
  accentColorHex?: string;
  buttonStyle: BarbershopConfig['buttonStyle'];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'barber-pole-classic',
    name: 'Barber Pole Clássico (Azul, Branco & Vermelho)',
    description: 'A clássica e autêntica identidade tradicional das barbearias mundiais: Azul Royal, Branco Puro e Vermelho Carmim.',
    primaryColor: 'blue',
    primaryColorHex: '#2563eb', // Azul Royal vibrante
    secondaryColorHex: '#0b1329', // Azul Meia-Noite / Navy refinado
    buttonColorHex: '#dc2626', // Vermelho Barber clássico
    buttonTextColorHex: '#ffffff', // Branco Puro
    textColorHex: '#ffffff',
    accentColorHex: '#dc2626',
    buttonStyle: 'rounded-2xl',
  },
  {
    id: 'midnight-blue',
    name: 'Azul Real & Aço (Modern Blue)',
    description: 'Elegância contemporânea com azul vibrante, branco neve e detalhes de alta precisão.',
    primaryColor: 'blue',
    primaryColorHex: '#3b82f6',
    secondaryColorHex: '#0f172a',
    buttonColorHex: '#2563eb',
    buttonTextColorHex: '#ffffff',
    textColorHex: '#ffffff',
    accentColorHex: '#ef4444',
    buttonStyle: 'rounded-2xl',
  },
  {
    id: 'ruby-barber',
    name: 'Rubi & Navalha',
    description: 'Vermelho intenso e marcante das autênticas barber poles com branco e grafite.',
    primaryColor: 'rose',
    primaryColorHex: '#dc2626',
    secondaryColorHex: '#18181b',
    buttonColorHex: '#dc2626',
    buttonTextColorHex: '#ffffff',
    textColorHex: '#ffffff',
    accentColorHex: '#2563eb',
    buttonStyle: 'rounded-2xl',
  },
  {
    id: 'amber-vintage',
    name: 'Âmbar Clássico (Vintage)',
    description: 'Estilo tradicional de barbearia com tons dourados e preto profundo.',
    primaryColor: 'amber',
    primaryColorHex: '#f59e0b',
    secondaryColorHex: '#1c1917',
    buttonColorHex: '#f59e0b',
    buttonTextColorHex: '#0c0a09',
    textColorHex: '#ffffff',
    accentColorHex: '#d97706',
    buttonStyle: 'rounded-2xl',
  },
  {
    id: 'gold-luxury',
    name: 'Ouro Nobre & Luxo',
    description: 'Tons de ouro polido para barbearias premium e executivas.',
    primaryColor: 'yellow',
    primaryColorHex: '#eab308',
    secondaryColorHex: '#18181b',
    buttonColorHex: '#eab308',
    buttonTextColorHex: '#09090b',
    textColorHex: '#ffffff',
    accentColorHex: '#ca8a04',
    buttonStyle: 'rounded-2xl',
  },
  {
    id: 'emerald-master',
    name: 'Esmeralda & Couro',
    description: 'Verde nobre e sofisticado, lembrando clubes clássicos ingleses.',
    primaryColor: 'emerald',
    primaryColorHex: '#10b981',
    secondaryColorHex: '#064e3b',
    buttonColorHex: '#10b981',
    buttonTextColorHex: '#022c22',
    textColorHex: '#ffffff',
    accentColorHex: '#059669',
    buttonStyle: 'rounded-2xl',
  },
  {
    id: 'dark-minimal',
    name: 'Monocromático Dark Minimal',
    description: 'Preto puro, grafite e branco de alto contraste.',
    primaryColor: 'zinc',
    primaryColorHex: '#e4e4e7',
    secondaryColorHex: '#18181b',
    buttonColorHex: '#f4f4f5',
    buttonTextColorHex: '#09090b',
    textColorHex: '#ffffff',
    accentColorHex: '#71717a',
    buttonStyle: 'rounded-xl',
  },
];

/**
 * Injeta ou atualiza a folha de estilos dinâmica no documento
 */
export function applyThemeToDocument(config: BarbershopConfig) {
  if (typeof document === 'undefined') return;

  const primary = config.primaryColorHex || '#2563eb';
  const secondary = config.secondaryColorHex || '#0b1329';
  const button = config.buttonColorHex || '#dc2626';
  const buttonText = config.buttonTextColorHex || '#ffffff';
  const textColor = config.textColorHex || '#ffffff';
  const accentRed = config.accentColorHex || '#dc2626';
  const accentBlue = '#2563eb';

  const styleId = 'barbershop-dynamic-theme-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --brand-primary: ${primary};
      --brand-secondary: ${secondary};
      --brand-button: ${button};
      --brand-button-text: ${buttonText};
      --brand-text: ${textColor};
      --brand-red: ${accentRed};
      --brand-blue: ${accentBlue};
    }
    .brand-primary-text {
      color: var(--brand-primary) !important;
    }
    .brand-primary-bg {
      background-color: var(--brand-primary) !important;
    }
    .brand-primary-border {
      border-color: var(--brand-primary) !important;
    }
    .brand-btn-primary {
      background-color: var(--brand-button) !important;
      color: var(--brand-button-text) !important;
    }
    .brand-btn-primary:hover {
      filter: brightness(1.1);
    }
    .brand-btn-primary:active {
      filter: brightness(0.95);
      transform: scale(0.985);
    }
    .brand-accent-red-bg {
      background-color: var(--brand-red) !important;
    }
    .brand-accent-red-text {
      color: var(--brand-red) !important;
    }
  `;
}

/**
 * Retorna o objeto CSS inline para os botões primários
 */
export function getBrandButtonStyle(config: BarbershopConfig): CSSProperties {
  const buttonBg = config.buttonColorHex || '#dc2626';
  const buttonText = config.buttonTextColorHex || '#ffffff';

  return {
    backgroundColor: buttonBg,
    color: buttonText,
  };
}


/**
 * Retorna classe de formato do botão
 */
export function getBrandButtonRadiusClass(config: BarbershopConfig): string {
  switch (config.buttonStyle || config.borderRadius) {
    case 'rounded-lg':
      return 'rounded-lg';
    case 'rounded-xl':
      return 'rounded-xl';
    case 'rounded-3xl':
      return 'rounded-3xl';
    case 'rounded-full':
    case 'pill-gradient':
      return 'rounded-full';
    case 'rounded-2xl':
    default:
      return 'rounded-2xl';
  }
}
