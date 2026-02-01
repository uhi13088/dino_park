import { useGameStore } from '@stores/useGameStore';

/**
 * 상단 바 - 재화, 레벨 표시
 */
export default function TopBar() {
  const { gold, diamond, parkLevel } = useGameStore();

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm">
      {/* 레벨 */}
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center font-bold">
          {parkLevel}
        </div>
        <span className="text-sm font-medium">Lv.{parkLevel}</span>
      </div>

      {/* 재화 */}
      <div className="flex items-center space-x-4">
        {/* 골드 */}
        <div className="flex items-center space-x-1 bg-black/30 rounded-full px-3 py-1">
          <span>🪙</span>
          <span className="font-bold text-secondary-400">
            {gold.toLocaleString()}
          </span>
        </div>

        {/* 다이아 */}
        <div className="flex items-center space-x-1 bg-black/30 rounded-full px-3 py-1">
          <span>💎</span>
          <span className="font-bold text-accent-500">
            {diamond.toLocaleString()}
          </span>
        </div>
      </div>
    </header>
  );
}
