import { useState } from 'react';
import { Scissors } from 'lucide-react';
import { BarbershopConfig } from '../../types';

interface BarbershopLogoProps {
  config?: BarbershopConfig;
  logoUrl?: string;
  name?: string;
  shape?: 'circle' | 'rounded-2xl' | 'rounded-3xl' | 'shield';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  className?: string;
  showBorder?: boolean;
  priority?: boolean;
}

export function BarbershopLogo({
  config,
  logoUrl,
  name,
  shape,
  size = 'md',
  className = '',
  showBorder = true,
}: BarbershopLogoProps) {
  const [imageError, setImageError] = useState(false);

  const effectiveLogo = logoUrl !== undefined ? logoUrl : (config?.logo || '/logo_vinicius.jpg');
  const effectiveName = name || config?.name || 'Barbearia';
  const effectiveShape = shape || config?.logoShape || 'rounded-3xl';
  const accentColor = config?.primaryColorHex || '#2563eb';
  const accentRed = config?.accentColorHex || '#dc2626';

  // Mapeamento de tamanhos em pixels / classes Tailwind
  const sizeClasses: Record<string, { container: string; img: string; icon: string; text: string }> = {
    xs: {
      container: 'w-6 h-6 p-0.5',
      img: 'w-5 h-5',
      icon: 'w-3 h-3',
      text: 'text-[10px]',
    },
    sm: {
      container: 'w-8 h-8 p-0.5',
      img: 'w-7 h-7',
      icon: 'w-4 h-4',
      text: 'text-xs',
    },
    md: {
      container: 'w-12 h-12 p-1',
      img: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-sm font-bold',
    },
    lg: {
      container: 'w-16 h-16 p-1.5',
      img: 'w-13 h-13 sm:w-14 sm:h-14',
      icon: 'w-7 h-7',
      text: 'text-lg font-bold',
    },
    xl: {
      container: 'w-20 h-20 p-2',
      img: 'w-16 h-16 sm:w-18 sm:h-18',
      icon: 'w-9 h-9',
      text: 'text-xl font-black',
    },
    '2xl': {
      container: 'w-24 h-24 p-2 sm:w-28 sm:h-28',
      img: 'w-20 h-20 sm:w-24 sm:h-24',
      icon: 'w-12 h-12',
      text: 'text-2xl font-black',
    },
    hero: {
      container: 'w-28 h-28 p-2.5 sm:w-32 sm:h-32',
      img: 'w-24 h-24 sm:w-28 sm:h-28',
      icon: 'w-14 h-14',
      text: 'text-3xl font-black',
    },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  // Formato da moldura
  let shapeClass = 'rounded-3xl';
  let innerShapeClass = 'rounded-2xl';

  if (effectiveShape === 'circle') {
    shapeClass = 'rounded-full';
    innerShapeClass = 'rounded-full';
  } else if (effectiveShape === 'rounded-2xl') {
    shapeClass = 'rounded-2xl';
    innerShapeClass = 'rounded-xl';
  } else if (effectiveShape === 'shield') {
    shapeClass = 'rounded-b-3xl rounded-t-xl';
    innerShapeClass = 'rounded-b-2xl rounded-t-lg';
  }

  const borderStyle = showBorder
    ? { borderColor: `${accentColor}40` }
    : undefined;

  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-b from-stone-800 to-stone-900 shadow-xl shadow-black/50 border overflow-hidden shrink-0 transition-transform duration-200 ${shapeClass} ${selectedSize.container} ${className}`}
      style={borderStyle}
      title={effectiveName}
    >
      {effectiveLogo && !imageError ? (
        <img
          src={effectiveLogo}
          alt={effectiveName}
          referrerPolicy="no-referrer"
          className={`object-contain ${innerShapeClass} ${selectedSize.img}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-stone-900/90 text-amber-400 ${innerShapeClass}`}
        >
          <Scissors className={selectedSize.icon} style={{ color: accentColor }} />
        </div>
      )}
    </div>
  );
}
