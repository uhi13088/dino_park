import { useState } from 'react';
import {
  useStoryChapters,
  useStartChapter,
  useAdvanceScene,
} from '@/api/queries';
import type { StoryChapterResponse, StorySceneResponse, AdvanceSceneResponse } from '@dino-park/shared';
import { Modal, Button } from '@/components/ui';
import { StoryPlayer } from '../components/StoryPlayer';

/**
 * 스토리 페이지 - 메인 스토리 챕터 선택
 */
export default function StoryPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState<StorySceneResponse | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewards, setRewards] = useState<AdvanceSceneResponse['rewards']>(undefined);

  const { data: chaptersData, isLoading } = useStoryChapters();
  const startChapterMutation = useStartChapter();
  const advanceSceneMutation = useAdvanceScene();

  const chapters = chaptersData?.chapters ?? [];

  const handleStartChapter = async (chapterId: string) => {
    try {
      const result = await startChapterMutation.mutateAsync(chapterId);
      setCurrentChapterId(chapterId);
      setCurrentScene(result.scene);
      setIsPlaying(true);
    } catch (error) {
      console.error('챕터 시작 실패:', error);
    }
  };

  const handleAdvanceScene = async (choiceId?: string): Promise<AdvanceSceneResponse> => {
    if (!currentChapterId || !currentScene) {
      throw new Error('No active scene');
    }

    const result = await advanceSceneMutation.mutateAsync({
      chapterId: currentChapterId,
      sceneId: currentScene.id,
      choiceId,
    });

    if (result.scene) {
      setCurrentScene(result.scene);
    }

    return result;
  };

  const handleChapterComplete = (chapterRewards?: AdvanceSceneResponse['rewards']) => {
    setIsPlaying(false);
    setCurrentScene(null);
    setCurrentChapterId(null);

    if (chapterRewards && chapterRewards.length > 0) {
      setRewards(chapterRewards);
      setShowRewardModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-purple-900 to-purple-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  // 스토리 플레이 모드
  if (isPlaying && currentScene) {
    return (
      <div className="h-full relative">
        <button
          onClick={() => setIsPlaying(false)}
          className="absolute top-4 left-4 z-20 text-white/60 hover:text-white"
        >
          ← 나가기
        </button>
        <StoryPlayer
          scene={currentScene}
          onAdvance={handleAdvanceScene}
          onComplete={handleChapterComplete}
          isAdvancing={advanceSceneMutation.isPending}
        />
      </div>
    );
  }

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
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            onStart={handleStartChapter}
            isStarting={startChapterMutation.isPending}
          />
        ))}
      </div>

      {/* 보상 모달 */}
      <Modal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title="챕터 완료!"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <span className="text-6xl">🎉</span>
          </div>

          {rewards && rewards.length > 0 && (
            <div className="space-y-2">
              {rewards.map((reward, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{getRewardEmoji(reward.type)}</span>
                    <span>{reward.type}</span>
                  </span>
                  <span className="font-bold text-purple-600">+{reward.quantity}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="primary"
            className="w-full"
            onClick={() => setShowRewardModal(false)}
          >
            확인
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ChapterCard({
  chapter,
  onStart,
  isStarting,
}: {
  chapter: StoryChapterResponse;
  onStart: (chapterId: string) => void;
  isStarting: boolean;
}) {
  const progressPercent = (chapter.completedScenes / chapter.totalScenes) * 100;

  return (
    <button
      disabled={chapter.isLocked || isStarting}
      onClick={() => !chapter.isLocked && onStart(chapter.id)}
      className={`w-full bg-white/10 backdrop-blur rounded-xl p-4 text-left transition-all ${
        chapter.isLocked
          ? 'opacity-50'
          : 'hover:bg-white/20 hover:scale-[1.02]'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* 챕터 번호 */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
          chapter.isCompleted
            ? 'bg-green-500 text-white'
            : chapter.isLocked
              ? 'bg-gray-600 text-gray-400'
              : 'bg-white/20 text-white'
        }`}>
          {chapter.isLocked ? '🔒' : chapter.isCompleted ? '✓' : chapter.number}
        </div>

        {/* 챕터 정보 */}
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">
            챕터 {chapter.number}: {chapter.title}
          </h3>
          <p className="text-sm text-white/60 mb-2">{chapter.description}</p>

          {/* 진행도 바 */}
          {!chapter.isLocked && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/60">
                <span>{chapter.completedScenes}/{chapter.totalScenes} 씬</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    chapter.isCompleted ? 'bg-green-400' : 'bg-secondary-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* 잠금 조건 */}
          {chapter.isLocked && chapter.unlockRequirement && (
            <p className="text-xs text-white/40 mt-2">
              🔒 {chapter.unlockRequirement}
            </p>
          )}
        </div>

        {/* 화살표 */}
        {!chapter.isLocked && (
          <span className="text-white/40 text-xl">›</span>
        )}
      </div>
    </button>
  );
}

function getRewardEmoji(type: string): string {
  const emojis: Record<string, string> = {
    gold: '🪙',
    diamond: '💎',
    dinosaur: '🦕',
    greatFigure: '👤',
    item: '📦',
  };
  return emojis[type] ?? '🎁';
}
