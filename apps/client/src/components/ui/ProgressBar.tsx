import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'exp' | 'happiness' | 'hunger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelFormat?: 'percentage' | 'value' | 'both';
  animated?: boolean;
  className?: string;
}

const variantColors = {
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  exp: 'bg-gradient-to-r from-purple-400 to-purple-600',
  happiness: 'bg-gradient-to-r from-pink-400 to-pink-600',
  hunger: 'bg-gradient-to-r from-orange-400 to-orange-600',
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  labelFormat = 'percentage',
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const formatLabel = () => {
    switch (labelFormat) {
      case 'percentage':
        return `${Math.round(percentage)}%`;
      case 'value':
        return `${value}/${max}`;
      case 'both':
        return `${value}/${max} (${Math.round(percentage)}%)`;
      default:
        return '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">{formatLabel()}</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantColors[variant],
            animated && 'relative overflow-hidden'
          )}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
}

// 경험치 바 (레벨 표시 포함)
interface ExpBarProps {
  level: number;
  exp: number;
  maxExp: number;
  className?: string;
}

export function ExpBar({ level, exp, maxExp, className }: ExpBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-500 text-white text-sm font-bold rounded-full">
        {level}
      </span>
      <div className="flex-1">
        <ProgressBar
          value={exp}
          max={maxExp}
          variant="exp"
          size="sm"
          showLabel
          labelFormat="value"
        />
      </div>
    </div>
  );
}

// 상태 바 (공룡 행복도, 배고픔 등)
interface StatusBarProps {
  label: string;
  value: number;
  max: number;
  icon?: React.ReactNode;
  variant?: 'happiness' | 'hunger' | 'primary';
  className?: string;
}

export function StatusBar({ label, value, max, icon, variant = 'primary', className }: StatusBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {icon && <span className="flex-shrink-0 w-5">{icon}</span>}
      <span className="flex-shrink-0 text-xs text-gray-500 w-12">{label}</span>
      <div className="flex-1">
        <ProgressBar value={value} max={max} variant={variant} size="sm" />
      </div>
      <span className="flex-shrink-0 text-xs font-medium text-gray-700 w-10 text-right">
        {value}/{max}
      </span>
    </div>
  );
}
