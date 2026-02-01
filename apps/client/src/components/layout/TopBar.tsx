import { useAuthStore } from '@/stores';
import { useCurrency } from '@/api';
import { CurrencyBar } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * 상단 바 - 레벨, 재화 표시
 */
export default function TopBar() {
  const { user, park } = useAuthStore();
  const { data: currencyData } = useCurrency();

  const level = user?.level ?? 1;
  const gold = currencyData?.gold ?? 0;
  const diamond = currencyData?.diamond ?? 0;
  const energy = currencyData?.explorationEnergy ?? 0;
  const maxEnergy = currencyData?.maxEnergy ?? 30;

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm safe-area-top">
      {/* 프로필 & 레벨 */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white',
            'bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg',
            'border-2 border-white/50'
          )}
        >
          {level}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white truncate max-w-[80px]">
            {user?.nickname ?? '사육사'}
          </span>
          <span className="text-[10px] text-white/70">
            {park?.name ?? '파크'}
          </span>
        </div>
      </div>

      {/* 재화 */}
      <CurrencyBar
        gold={gold}
        diamond={diamond}
        energy={energy}
        maxEnergy={maxEnergy}
      />
    </header>
  );
}
