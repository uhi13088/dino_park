import { useEffect, useRef } from 'react';

/**
 * 파크 페이지 - 메인 게임 화면 (PixiJS 캔버스)
 * Phase 3에서 PixiJS 게임 엔진 연동 예정
 */
export default function ParkPage() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TODO: Phase 3에서 PixiJS Application 초기화
    // const app = new PIXI.Application({ ... });
    // canvasRef.current?.appendChild(app.view);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* 게임 캔버스 영역 */}
      <div
        ref={canvasRef}
        className="flex-1 bg-gradient-to-b from-green-300 to-green-500 relative overflow-hidden"
      >
        {/* Placeholder: 2.5D 아이소메트릭 파크 뷰 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/80">
            <div className="text-6xl mb-4">🏞️</div>
            <p className="text-lg font-medium">파크 건설 영역</p>
            <p className="text-sm mt-2">Phase 3에서 PixiJS 게임 엔진 연동</p>
          </div>
        </div>

        {/* 그리드 오버레이 (개발용) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* 하단 퀵 액션 바 */}
      <div className="bg-white border-t border-gray-200 p-2 flex justify-around">
        <QuickActionButton icon="🦕" label="공룡" />
        <QuickActionButton icon="🏗️" label="건물" />
        <QuickActionButton icon="🔬" label="연구" />
        <QuickActionButton icon="📦" label="인벤" />
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center px-4 py-1 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-600 mt-1">{label}</span>
    </button>
  );
}
