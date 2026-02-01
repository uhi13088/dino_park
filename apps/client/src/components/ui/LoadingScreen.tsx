/**
 * 로딩 화면 컴포넌트
 */
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-primary-900 to-primary-700 flex flex-col items-center justify-center">
      {/* 로고 영역 */}
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          🦕 다이노 파크
        </h1>
        <p className="text-primary-200 text-center">타이쿤</p>
      </div>

      {/* 로딩 애니메이션 */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* 로딩 텍스트 */}
      <p className="mt-4 text-primary-200 text-sm">로딩 중...</p>
    </div>
  );
}
