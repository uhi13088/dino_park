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
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold mb-2">게임 로딩 실패</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 게임 캔버스 영역 */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
      >
        {/* 로딩 표시 */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-sky-400">
            <div className="text-center text-white">
              <div className="text-4xl mb-4 animate-bounce">🦕</div>
              <p className="text-lg font-medium">파크 로딩 중...</p>
            </div>
          </div>
        )}

        {/* 배치 모드 안내 */}
        {(mode === 'place_dinosaur' || mode === 'place_building') && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <span>
                {mode === 'place_dinosaur' ? '🦕 공룡 배치' : '🏗️ 건물 배치'}: 원하는 위치를 탭하세요
              </span>
              <button
                onClick={cancelPlacement}
                className="bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-full text-xs"
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
            'absolute top-4 right-4 z-10 p-2 rounded-full shadow-lg transition-all',
            showGrid ? 'bg-primary-500 text-white' : 'bg-white/90 text-gray-700'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* 하단 퀵 액션 바 */}
      <div className="bg-white border-t border-gray-200 p-2 flex justify-around">
        <QuickActionButton
          icon="🦕"
          label="공룡"
          onClick={() => openSidePanel('dinosaur_list')}
        />
        <QuickActionButton
          icon="🏗️"
          label="건물"
          onClick={() => openSidePanel('building_list')}
        />
        <QuickActionButton
          icon="👤"
          label="위인"
          onClick={() => openSidePanel('great_figure_list')}
        />
        <QuickActionButton
          icon="📦"
          label="인벤"
          onClick={() => {}}
        />
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
      className="relative flex flex-col items-center px-4 py-1 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-600 mt-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
