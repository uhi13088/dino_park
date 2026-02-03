import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { useLogin } from '@/api';

/**
 * 홈 페이지 - 게임 시작/로딩 화면
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuthStore();
  const loginMutation = useLogin();

  // 이미 로그인되어 있으면 파크로 이동
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/park');
    }
  }, [isAuthenticated, navigate]);

  const handleStart = async () => {
    try {
      // 토스 앱스 환경이면 토스 로그인, 아니면 테스트 로그인
      const tossId = 'test_user_' + Date.now(); // 실제로는 토스 SDK에서 가져옴
      const nickname = '신입 사육사';

      const result = await loginMutation.mutateAsync({ tossId, nickname });

      // 스토어에 인증 정보 저장
      setAuth(result.user, result.currency, result.park);

      // 파크로 이동
      navigate('/park');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="from-primary-600 to-primary-800 flex h-full flex-col items-center justify-center bg-gradient-to-b p-8 text-white">
      {/* 로고 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <motion.h1
          className="font-display mb-4 text-5xl font-bold"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🦕 다이노 파크
        </motion.h1>
        <h2 className="font-display text-secondary-400 text-3xl font-bold">타이쿤</h2>
      </motion.div>

      {/* 시작 버튼 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Button
          variant="secondary"
          size="xl"
          onClick={handleStart}
          isLoading={loginMutation.isPending}
          className="rounded-full px-12 shadow-lg"
        >
          게임 시작
        </Button>
      </motion.div>

      {/* 부제목 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-center text-white/70"
      >
        나만의 공룡 테마파크를 만들어보세요!
      </motion.p>

      {/* 버전 */}
      <p className="absolute bottom-8 text-sm text-white/50">v0.1.0</p>
    </div>
  );
}
