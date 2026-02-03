import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-primary-100 text-primary-700',
        secondary: 'bg-secondary-100 text-secondary-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        // 희귀도
        common: 'bg-gray-200 text-gray-700',
        uncommon: 'bg-green-200 text-green-800',
        rare: 'bg-blue-200 text-blue-800',
        epic: 'bg-purple-200 text-purple-800',
        legendary: 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white',
        // 카테고리
        herbivore: 'bg-green-200 text-green-800',
        carnivore: 'bg-red-200 text-red-800',
        pterosaur: 'bg-purple-200 text-purple-800',
        marine: 'bg-blue-200 text-blue-800',
        hybrid: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white',
      },
      size: {
        xs: 'h-4 px-1.5 text-[10px]',
        sm: 'h-5 px-2 text-xs',
        md: 'h-6 px-2.5 text-sm',
        lg: 'h-7 px-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}

// 희귀도 배지
interface RarityBadgeProps {
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const rarityLabels = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

export function RarityBadge({ rarity, size = 'sm', showLabel = true, className }: RarityBadgeProps) {
  return (
    <Badge variant={rarity} size={size} className={className}>
      {showLabel ? rarityLabels[rarity] : rarity.charAt(0).toUpperCase()}
    </Badge>
  );
}

// 카테고리 배지 (공룡 분류)
interface CategoryBadgeProps {
  category: 'herbivore' | 'carnivore' | 'pterosaur' | 'marine' | 'hybrid';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const categoryLabels = {
  herbivore: '초식',
  carnivore: '육식',
  pterosaur: '익룡',
  marine: '해양',
  hybrid: '하이브리드',
};

const categoryIcons = {
  herbivore: '🌿',
  carnivore: '🍖',
  pterosaur: '🦅',
  marine: '🌊',
  hybrid: '🧬',
};

export function CategoryBadge({ category, size = 'sm', showLabel = true, className }: CategoryBadgeProps) {
  return (
    <Badge variant={category} size={size} className={className}>
      <span className="mr-0.5">{categoryIcons[category]}</span>
      {showLabel && categoryLabels[category]}
    </Badge>
  );
}

// 레벨 배지
interface LevelBadgeProps {
  level: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({ level, size = 'sm', className }: LevelBadgeProps) {
  return (
    <Badge variant="primary" size={size} className={className}>
      Lv.{level}
    </Badge>
  );
}

// 상태 배지
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'constructing' | 'upgrading' | 'completed';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  active: { variant: 'success' as const, label: '활성' },
  inactive: { variant: 'default' as const, label: '비활성' },
  constructing: { variant: 'warning' as const, label: '건설 중' },
  upgrading: { variant: 'info' as const, label: '업그레이드 중' },
  completed: { variant: 'success' as const, label: '완료' },
};

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}
