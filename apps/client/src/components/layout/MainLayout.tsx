import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

/**
 * 메인 레이아웃
 * - 상단: TopBar (재화, 레벨)
 * - 중앙: 콘텐츠 영역
 * - 하단: BottomNav (네비게이션)
 */
export default function MainLayout() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sky-400 to-sky-200">
      {/* 상단 바 */}
      <TopBar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}
