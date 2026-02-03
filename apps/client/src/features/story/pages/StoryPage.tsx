import { useState } from 'react';
import { useStoryChapters, useStartChapter, useAdvanceScene } from '@/api/queries';
import type {
  StoryChapterResponse,
  StorySceneResponse,
  AdvanceSceneResponse,
} from '@dino-park/shared';
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
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-purple-900 to-purple-700">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
      </div>
    );
  }

  // 스토리 플레이 모드
  if (isPlaying && currentScene) {
    return (
      <div className="relative h-full">
        <button
          onClick={() => setIsPlaying(false)}
          className="absolute left-4 top-4 z-20 text-white/60 hover:text-white"
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
    <div className="flex h-full flex-col bg-gradient-to-b from-purple-900 to-purple-700">
      {/* 헤더 */}
      <div className="p-6 text-center text-white">
        <h1 className="font-display mb-2 text-2xl font-bold">📖 메인 스토리</h1>
        <p className="text-white/70">다이노 파크의 비밀을 밝혀라</p>
      </div>

      {/* 챕터 목록 */}
      <div className="flex-1 space-y-4 overflow-auto px-4 pb-4">
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
      <Modal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} title="챕터 완료!">
        <div className="space-y-4">
          <div className="flex justify-center">
            <span className="text-6xl">🎉</span>
          </div>

          {rewards && rewards.length > 0 && (
            <div className="space-y-2">
              {rewards.map((reward, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-purple-50 p-3"
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

          <Button variant="primary" className="w-full" onClick={() => setShowRewardModal(false)}>
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
      className={`w-full rounded-xl bg-white/10 p-4 text-left backdrop-blur transition-all ${
        chapter.isLocked ? 'opacity-50' : 'hover:scale-[1.02] hover:bg-white/20'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* 챕터 번호 */}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold ${
            chapter.isCompleted
              ? 'bg-green-500 text-white'
              : chapter.isLocked
                ? 'bg-gray-600 text-gray-400'
                : 'bg-white/20 text-white'
          }`}
        >
          {chapter.isLocked ? '🔒' : chapter.isCompleted ? '✓' : chapter.number}
        </div>

        {/* 챕터 정보 */}
        <div className="flex-1">
          <h3 className="mb-1 font-bold text-white">
            챕터 {chapter.number}: {chapter.title}
          </h3>
          <p className="mb-2 text-sm text-white/60">{chapter.description}</p>

          {/* 진행도 바 */}
          {!chapter.isLocked && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/60">
                <span>
                  {chapter.completedScenes}/{chapter.totalScenes} 씬
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
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
            <p className="mt-2 text-xs text-white/40">🔒 {chapter.unlockRequirement}</p>
          )}
        </div>

        {/* 화살표 */}
        {!chapter.isLocked && <span className="text-xl text-white/40">›</span>}
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
