import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// 재화 타입
export type CurrencyType = 'gold' | 'diamond' | 'dna' | 'energy';

// 재화 아이콘
const currencyIcons: Record<CurrencyType, React.ReactNode> = {
  gold: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FFD700" />
      <circle cx="12" cy="12" r="8" fill="#FFC107" />
      <text x="12" y="16" textAnchor="middle" fill="#B8860B" fontSize="10" fontWeight="bold">G</text>
    </svg>
  ),
  diamond: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 9L12 22L22 9L12 2Z" fill="#00BCD4" />
      <path d="M12 2L7 9H17L12 2Z" fill="#4DD0E1" />
      <path d="M7 9L12 22L17 9H7Z" fill="#00ACC1" />
    </svg>
  ),
  dna: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path d="M6 3C6 3 8 5 12 5C16 5 18 3 18 3" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 8C6 8 8 10 12 10C16 10 18 8 18 8" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 13C6 13 8 15 12 15C16 15 18 13 18 13" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 18C6 18 8 20 12 20C16 20 18 18 18 18" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="3" x2="6" y2="21" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="3" x2="18" y2="21" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  energy: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FFC107" stroke="#FF9800" strokeWidth="1" />
    </svg>
  ),
};

// 재화 배경색
const currencyBgColors: Record<CurrencyType, string> = {
  gold: 'bg-yellow-100',
  diamond: 'bg-cyan-100',
  dna: 'bg-purple-100',
  energy: 'bg-amber-100',
};

interface CurrencyDisplayProps {
  type: CurrencyType;
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: { container: 'h-6 text-xs', icon: 'w-4 h-4' },
  md: { container: 'h-8 text-sm', icon: 'w-5 h-5' },
  lg: { container: 'h-10 text-base', icon: 'w-6 h-6' },
};

export function CurrencyDisplay({
  type,
  value,
  size = 'md',
  showChange = false,
  compact = false,
  onClick,
  className,
}: CurrencyDisplayProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [change, setChange] = useState<number | null>(null);

  useEffect(() => {
    if (showChange && value !== prevValue) {
      setChange(value - prevValue);
      setPrevValue(value);

      const timer = setTimeout(() => setChange(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue, showChange]);

  const formatNumber = (num: number) => {
    if (compact) {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const sizes = sizeClasses[size];

  return (
    <div className="relative">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 rounded-full font-medium',
          currencyBgColors[type],
          sizes.container,
          onClick && 'cursor-pointer hover:opacity-80 active:scale-95 transition-all',
          className
        )}
        onClick={onClick}
      >
        <span className={sizes.icon}>{currencyIcons[type]}</span>
        <span className="text-gray-800">{formatNumber(value)}</span>
      </div>

      {/* 변화량 애니메이션 */}
      <AnimatePresence>
        {change !== null && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className={cn(
              'absolute -top-2 right-0 text-sm font-bold',
              change > 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            {change > 0 ? '+' : ''}{formatNumber(change)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// 재화 모음 (상단 바용)
interface CurrencyBarProps {
  gold: number;
  diamond: number;
  energy?: number;
  maxEnergy?: number;
  onGoldClick?: () => void;
  onDiamondClick?: () => void;
  onEnergyClick?: () => void;
  className?: string;
}

export function CurrencyBar({
  gold,
  diamond,
  energy,
  maxEnergy = 30,
  onGoldClick,
  onDiamondClick,
  onEnergyClick,
  className,
}: CurrencyBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CurrencyDisplay
        type="gold"
        value={gold}
        size="sm"
        showChange
        compact
        onClick={onGoldClick}
      />
      <CurrencyDisplay
        type="diamond"
        value={diamond}
        size="sm"
        showChange
        compact
        onClick={onDiamondClick}
      />
      {energy !== undefined && (
        <div
          className={cn(
            'inline-flex items-center gap-1 px-2 h-6 rounded-full bg-amber-100 text-xs font-medium',
            onEnergyClick && 'cursor-pointer hover:opacity-80'
          )}
          onClick={onEnergyClick}
        >
          <span className="w-4 h-4">{currencyIcons.energy}</span>
          <span className="text-gray-800">
            {energy}/{maxEnergy}
          </span>
        </div>
      )}
    </div>
  );
}
