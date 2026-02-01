import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { ToastContainer } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { useProfile, useCollectOfflineRevenue, tokenManager } from '@/api';
import LoadingOverlay from './LoadingOverlay';

/**
 * 메인 레이아웃
 * - 상단: TopBar (재화, 레벨)
 * - 중앙: 콘텐츠 영역
 * - 하단: BottomNav (네비게이션)
 */
export default function MainLayout() {
  const { setAuth, isAuthenticated } = useAuthStore();
  const { data: profileData, isLoading } = useProfile();
  const { mutate: collectOfflineRevenue } = useCollectOfflineRevenue();

  // 프로필 데이터 동기화
  useEffect(() => {
    if (profileData) {
      setAuth(
        profileData.user,
        profileData.currency,
        profileData.park
      );
    }
  }, [profileData, setAuth]);

  // 오프라인 수익 수령 (앱 진입 시)
  useEffect(() => {
    if (isAuthenticated) {
      collectOfflineRevenue();
    }
  }, [isAuthenticated, collectOfflineRevenue]);

  // 로그아웃 이벤트 리스너
  useEffect(() => {
    const handleLogout = () => {
      useAuthStore.getState().logout();
      window.location.href = '/';
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

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

      {/* 토스트 컨테이너 */}
      <ToastContainer />

      {/* 로딩 오버레이 */}
      <LoadingOverlay />
    </div>
  );
}
