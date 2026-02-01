import { useNavigate } from 'react-router-dom';

/**
 * 홈 페이지 - 게임 시작/로딩 화면
 */
export default function HomePage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/park');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-primary-600 to-primary-800 text-white p-8">
      {/* 로고 */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-display font-bold mb-4">
          🦕 다이노 파크
        </h1>
        <h2 className="text-3xl font-display font-bold text-secondary-400">
          타이쿤
        </h2>
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={handleStart}
        className="btn-secondary text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-transform"
      >
        게임 시작
      </button>

      {/* 버전 */}
      <p className="absolute bottom-8 text-white/50 text-sm">v0.1.0</p>
    </div>
  );
}
