import { useGameEngine } from '@/hooks';
import { useGameStore, useUIStore } from '@/stores';
import { cn } from '@/utils/cn';

/**
 * 파크 페이지 - 메인 게임 화면 (PixiJS 캔버스)
 */
export default function ParkPage() {
  const { containerRef, isReady, error } = useGameEngine();
  const { mode, cancelPlacement, showGrid, toggleGrid } = useGameStore();
  const { openSidePanel } = useUIStore();

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-red-50">
        <div className="text-center text-red-600">
          <p className="mb-2 text-xl font-bold">게임 로딩 실패</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 게임 캔버스 영역 */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {/* 로딩 표시 */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-sky-400">
            <div className="text-center text-white">
              <div className="mb-4 animate-bounce text-4xl">🦕</div>
              <p className="text-lg font-medium">파크 로딩 중...</p>
            </div>
          </div>
        )}

        {/* 배치 모드 안내 */}
        {(mode === 'place_dinosaur' || mode === 'place_building') && (
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
              <span>
                {mode === 'place_dinosaur' ? '🦕 공룡 배치' : '🏗️ 건물 배치'}: 원하는 위치를
                탭하세요
              </span>
              <button
                onClick={cancelPlacement}
                className="rounded-full bg-red-500 px-2 py-0.5 text-xs hover:bg-red-600"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 그리드 토글 버튼 */}
        <button
          onClick={toggleGrid}
          className={cn(
            'absolute right-4 top-4 z-10 rounded-full p-2 shadow-lg transition-all',
            showGrid ? 'bg-primary-500 text-white' : 'bg-white/90 text-gray-700',
          )}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* 하단 퀵 액션 바 */}
      <div className="flex justify-around border-t border-gray-200 bg-white p-2">
        <QuickActionButton icon="🦕" label="공룡" onClick={() => openSidePanel('dinosaur_list')} />
        <QuickActionButton icon="🏗️" label="건물" onClick={() => openSidePanel('building_list')} />
        <QuickActionButton
          icon="👤"
          label="위인"
          onClick={() => openSidePanel('great_figure_list')}
        />
        <QuickActionButton icon="📦" label="인벤" onClick={() => {}} />
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  badge?: number;
}

function QuickActionButton({ icon, label, onClick, badge }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center rounded-lg px-4 py-1 transition-all hover:bg-gray-100 active:scale-95"
    >
      <span className="text-2xl">{icon}</span>
      <span className="mt-1 text-xs text-gray-600">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
