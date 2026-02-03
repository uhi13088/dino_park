/**
 * 로딩 화면 컴포넌트
 */
export default function LoadingScreen() {
  return (
    <div className="from-primary-900 to-primary-700 fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b">
      {/* 로고 영역 */}
      <div className="mb-8">
        <h1 className="font-display mb-2 text-4xl font-bold text-white">🦕 다이노 파크</h1>
        <p className="text-primary-200 text-center">타이쿤</p>
      </div>

      {/* 로딩 애니메이션 */}
      <div className="flex space-x-2">
        <div
          className="bg-secondary-400 h-3 w-3 animate-bounce rounded-full"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="bg-secondary-400 h-3 w-3 animate-bounce rounded-full"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="bg-secondary-400 h-3 w-3 animate-bounce rounded-full"
          style={{ animationDelay: '300ms' }}
        />
      </div>

      {/* 로딩 텍스트 */}
      <p className="text-primary-200 mt-4 text-sm">로딩 중...</p>
    </div>
  );
}
