import { motion } from 'framer-motion';
import { useSeasonStore, type SeasonChapter, REWARD_CONFIG } from '../stores/useSeasonStore';

interface SeasonChapterListProps {
  onSelectChapter: (chapterId: string) => void;
}

export default function SeasonChapterList({ onSelectChapter }: SeasonChapterListProps) {
  const { chapters, isLoading } = useSeasonStore();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        챕터 정보를 불러오는 중...
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-500">
        <span className="mb-2 text-4xl">📖</span>
        <span>시즌 스토리가 준비 중입니다</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white">시즌 스토리</h3>

      <div className="space-y-2">
        {chapters.map((chapter, index) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={index}
            onSelect={() => onSelectChapter(chapter.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ChapterCardProps {
  chapter: SeasonChapter;
  index: number;
  onSelect: () => void;
}

function ChapterCard({ chapter, index, onSelect }: ChapterCardProps) {
  const isLocked = !chapter.isUnlocked;

  return (
    <motion.button
      onClick={!isLocked ? onSelect : undefined}
      disabled={isLocked}
      className={`
        relative w-full rounded-xl p-4 text-left transition-all
        ${
          chapter.isCompleted
            ? 'border border-gray-700 bg-gray-800/50'
            : isLocked
              ? 'cursor-not-allowed border border-gray-800 bg-gray-900'
              : 'border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 hover:border-blue-500'
        }
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={!isLocked ? { scale: 1.01 } : {}}
    >
      <div className="flex items-start gap-4">
        {/* 챕터 번호 */}
        <div
          className={`
          flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg
          ${
            chapter.isCompleted
              ? 'bg-green-900/50 text-green-400'
              : isLocked
                ? 'bg-gray-800 text-gray-600'
                : 'bg-blue-900/50 text-blue-400'
          }
        `}
        >
          {chapter.isCompleted ? (
            <span className="text-2xl">✓</span>
          ) : isLocked ? (
            <span className="text-xl">🔒</span>
          ) : (
            <span className="text-xl font-bold">{chapter.order}</span>
          )}
        </div>

        {/* 챕터 정보 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={`
              truncate font-semibold
              ${isLocked ? 'text-gray-500' : 'text-white'}
            `}
            >
              {chapter.titleKo}
            </h4>
            {chapter.isCompleted && (
              <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-xs text-green-400">
                완료
              </span>
            )}
          </div>

          <p className={`mt-1 text-sm ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {isLocked ? '이전 챕터를 완료하세요' : `${chapter.sceneCount}개의 씬`}
          </p>

          {/* 보상 미리보기 */}
          {!isLocked && chapter.rewards.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {chapter.rewards.slice(0, 3).map((reward, idx) => {
                const config = REWARD_CONFIG[reward.type] || { icon: '🎁', color: 'text-gray-500' };
                return (
                  <span
                    key={idx}
                    className={`flex items-center gap-1 rounded bg-gray-700/50 px-2 py-0.5 text-xs ${config.color}`}
                  >
                    <span>{config.icon}</span>
                    <span>{reward.amount.toLocaleString()}</span>
                  </span>
                );
              })}
              {chapter.rewards.length > 3 && (
                <span className="rounded bg-gray-700/50 px-2 py-0.5 text-xs text-gray-400">
                  +{chapter.rewards.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 진행 아이콘 */}
        {!isLocked && !chapter.isCompleted && (
          <div className="flex-shrink-0 text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* 잠금 오버레이 */}
      {isLocked && (
        <div className="absolute inset-0 rounded-xl bg-gray-900/50 backdrop-blur-[1px]" />
      )}
    </motion.button>
  );
}
