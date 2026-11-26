import { useAuthStore } from '@/stores';
import { useCurrency, useParkMe } from '@/api';
import { CurrencyBar } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * 상단 바 - 레벨, 재화 표시
 */
export default function TopBar() {
  const { user, park } = useAuthStore();
  const { data: currencyData } = useCurrency();
  const { data: parkData } = useParkMe();

  const level = parkData?.level ?? park?.level ?? 1;
  const gold = currencyData?.gold ?? 0;
  const diamond = currencyData?.diamond ?? 0;

  return (
    <header className="safe-area-top flex items-center justify-between bg-black/30 px-4 py-2 backdrop-blur-sm">
      {/* 프로필 & 레벨 */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full font-bold text-white',
            'from-primary-400 to-primary-600 bg-gradient-to-br shadow-lg',
            'border-2 border-white/50',
          )}
        >
          {level}
        </div>
        <div className="flex flex-col">
          <span className="max-w-[80px] truncate text-sm font-bold text-white">
            {user?.nickname ?? '사육사'}
          </span>
          <span className="text-[10px] text-white/70">{park?.name ?? '파크'}</span>
        </div>
      </div>

      {/* 재화 */}
      <CurrencyBar gold={gold} diamond={diamond} />
    </header>
  );
}
