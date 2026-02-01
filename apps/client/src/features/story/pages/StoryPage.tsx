/**
 * 스토리 페이지 - 메인 스토리 챕터 선택
 */
export default function StoryPage() {
  // Placeholder: 스토리 챕터 데이터
  const chapters = [
    {
      id: 'chapter1',
      number: 1,
      title: '다이노 파크에 오신 것을 환영합니다',
      description: '폐허가 된 테마파크를 되살리는 첫 걸음',
      scenes: 8,
      completed: true,
      progress: 8,
    },
    {
      id: 'chapter2',
      number: 2,
      title: '위기의 첫 날',
      description: '공룡들이 탈출했다! 파크의 위기',
      scenes: 10,
      completed: false,
      progress: 6,
    },
    {
      id: 'chapter3',
      number: 3,
      title: '숨겨진 연구소',
      description: '비밀스러운 지하 시설의 발견',
      scenes: 12,
      completed: false,
      progress: 0,
    },
    {
      id: 'chapter4',
      number: 4,
      title: '위인들의 귀환',
      description: '과거의 영웅들이 깨어난다',
      scenes: 10,
      completed: false,
      progress: 0,
      locked: true,
    },
    {
      id: 'chapter5',
      number: 5,
      title: '거대한 음모',
      description: '파크를 노리는 어둠의 세력',
      scenes: 15,
      completed: false,
      progress: 0,
      locked: true,
    },
    {
      id: 'chapter6',
      number: 6,
      title: '다이노 파크의 미래',
      description: '세계 최고의 공룡 테마파크를 향해',
      scenes: 12,
      completed: false,
      progress: 0,
      locked: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900 to-purple-700">
      {/* 헤더 */}
      <div className="p-6 text-center text-white">
        <h1 className="text-2xl font-display font-bold mb-2">📖 메인 스토리</h1>
        <p className="text-white/70">다이노 파크의 비밀을 밝혀라</p>
      </div>

      {/* 챕터 목록 */}
      <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
        {chapters.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} />
        ))}
      </div>
    </div>
  );
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  scenes: number;
  completed: boolean;
  progress: number;
  locked?: boolean;
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const progressPercent = (chapter.progress / chapter.scenes) * 100;

  return (
    <button
      disabled={chapter.locked}
      className={`w-full bg-white/10 backdrop-blur rounded-xl p-4 text-left transition-all ${
        chapter.locked
          ? 'opacity-50'
          : 'hover:bg-white/20 hover:scale-[1.02]'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* 챕터 번호 */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
          chapter.completed
            ? 'bg-green-500 text-white'
            : chapter.locked
              ? 'bg-gray-600 text-gray-400'
              : 'bg-white/20 text-white'
        }`}>
          {chapter.locked ? '🔒' : chapter.completed ? '✓' : chapter.number}
        </div>

        {/* 챕터 정보 */}
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">
            챕터 {chapter.number}: {chapter.title}
          </h3>
          <p className="text-sm text-white/60 mb-2">{chapter.description}</p>

          {/* 진행도 바 */}
          {!chapter.locked && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/60">
                <span>{chapter.progress}/{chapter.scenes} 씬</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    chapter.completed ? 'bg-green-400' : 'bg-secondary-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 화살표 */}
        {!chapter.locked && (
          <span className="text-white/40 text-xl">›</span>
        )}
      </div>
    </button>
  );
}
