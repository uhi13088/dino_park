import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { getChapterById } from '@dino-park/game-data';
import type { StoryReward } from '@dino-park/shared';
import {
  type StoryPlaybackState,
  type StoryRequirement,
  useAdvanceScene,
  useStartChapter,
  useStoryChapters,
} from '@/api/queries';
import { Modal, Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { parkGrowthHref, parseParkGrowthStage } from '@/utils/parkGrowthNavigation';
import { StoryPlayer } from '../components/StoryPlayer';
import './StoryPage.css';

function requirementAction(requirement: StoryRequirement, chapter: string, stage?: number) {
  const params = new URLSearchParams({ returnChapter: chapter });
  if (stage !== undefined) params.set('stage', String(stage));
  const withPath = (path: string, label: string) => ({
    message: requirement.message,
    href: `${path}?${params}`,
    label,
  });
  const { kind, technologyId, facilityId, missionId, level } = requirement;
  if (kind === 'research' && technologyId) {
    params.set('technology', technologyId);
    if (level) params.set('level', String(level));
    return withPath('/research', '연구 보기');
  }
  if (kind === 'exploration' && missionId) {
    params.set('mission', missionId);
    return withPath('/exploration', '조사로 가기');
  }
  if (kind === 'facility' && facilityId) {
    params.set('facility', facilityId);
    return withPath('/park', '시설 관리');
  }
  params.set('panel', 'operations');
  return withPath('/park', '파크 운영 보기');
}

function rewardLabel(type: StoryReward['type']) {
  const labels: Record<StoryReward['type'], string> = {
    gold: '골드',
    diamond: '다이아',
    dinosaur: '공룡',
    greatFigure: '위인',
    item: '아이템',
    character: '인물',
    building: '시설',
    title: '칭호',
  };
  return labels[type];
}

export default function StoryPage() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [params] = useSearchParams();
  const requestedChapter = params.get('chapter');
  const growthStage = parseParkGrowthStage(params.get('stage'));
  const target = useRef<HTMLButtonElement>(null);
  const [chapterId, setChapterId] = useState<string>();
  const [playback, setPlayback] = useState<StoryPlaybackState>();
  const [completedChapter, setCompletedChapter] = useState<string>();
  const [rewards, setRewards] = useState<StoryReward[]>([]);
  const [error, setError] = useState<string>();
  const chapters = useStoryChapters();
  const start = useStartChapter();
  const advance = useAdvanceScene();
  const current = chapters.data?.find(({ chapter }) => chapter.id === chapterId);
  const scene = playback?.currentScene;
  const busy = start.isPending || advance.isPending;

  useEffect(() => {
    if (!requestedChapter || !chapters.data || scene) return;
    target.current?.scrollIntoView?.({ block: 'nearest' });
    target.current?.focus({ preventScroll: true });
  }, [requestedChapter, chapters.data, scene]);

  const play = async (id: string) => {
    setError(undefined);
    try {
      setPlayback(await start.mutateAsync(id));
      setChapterId(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '장면을 불러오지 못했어요.');
    }
  };
  const move = async (choiceId?: string) => {
    if (!chapterId || !scene) return;
    setError(undefined);
    try {
      const result = await advance.mutateAsync({ chapterId, sceneId: scene.id, choiceId });
      setPlayback(result);
      if (result.isChapterComplete) {
        setCompletedChapter(chapterId);
        setRewards(result.rewards ?? []);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '진행을 저장하지 못했어요.');
    }
  };

  if (!authenticated) return <Navigate to="/" replace />;
  if (scene && chapterId) {
    return (
      <StoryPlayer
        key={scene.id}
        scene={scene}
        chapterTitle={current?.chapter.titleKo ?? getChapterById(chapterId)?.titleKo ?? '스토리'}
        onExit={() => {
          setPlayback(undefined);
          setError(undefined);
        }}
        onAdvance={(choiceId) => void move(choiceId)}
        onRefresh={() => void play(chapterId)}
        busy={busy}
        error={error}
        requirement={
          playback?.requirement
            ? requirementAction(playback.requirement, chapterId, growthStage)
            : undefined
        }
      />
    );
  }

  return (
    <section className="game-story" aria-labelledby="story-list-title">
      <header className="game-story__header">
        <Link to={growthStage === undefined ? '/park' : parkGrowthHref(growthStage)}>
          {growthStage === undefined ? '← 파크' : '← 성장 목표'}
        </Link>
        <h1 id="story-list-title">메인 스토리</h1>
      </header>
      <div className="game-story__chapter-list">
        {chapters.isPending && <p role="status">스토리를 불러오고 있어요…</p>}
        {chapters.error && (
          <p role="alert" className="game-story__error">
            {chapters.error.message}{' '}
            <button type="button" onClick={() => void chapters.refetch()}>
              다시 시도
            </button>
          </p>
        )}
        {error && (
          <p role="alert" className="game-story__error">
            {error}
          </p>
        )}
        {chapters.data?.map((entry) => {
          const { chapter, isUnlocked, isCompleted, isStarted } = entry;
          const total = chapter.totalScenes ?? getChapterById(chapter.id)?.scenes.length ?? 0;
          const progress = entry.completedScenes;
          const number =
            chapter.order > 0 && /^chapter-/.test(chapter.id) ? `${chapter.order}장 ` : '';
          return (
            <button
              key={chapter.id}
              type="button"
              ref={requestedChapter === chapter.id ? target : undefined}
              className="game-story__chapter"
              data-targeted={requestedChapter === chapter.id}
              disabled={!isUnlocked || isCompleted || busy}
              onClick={() => void play(chapter.id)}
            >
              <div>
                <strong>
                  {number}
                  {chapter.titleKo}
                </strong>
                {!isUnlocked && entry.unlockRequirement && <span>{entry.unlockRequirement}</span>}
                {isUnlocked && !isCompleted && isStarted && total > 0 && progress !== undefined && (
                  <span>
                    {progress}/{total} 장면 완료
                  </span>
                )}
              </div>
              <span>
                {isCompleted ? '완료' : !isUnlocked ? '잠김' : isStarted ? '이어 보기' : '시작'}
              </span>
            </button>
          );
        })}
      </div>
      <Modal
        isOpen={!!completedChapter}
        onClose={() => setCompletedChapter(undefined)}
        title="장 완료"
      >
        {completedChapter && <p>{getChapterById(completedChapter)?.titleKo} 이야기를 마쳤어요.</p>}
        {!!rewards.length && <p>이 장의 보상 목록</p>}
        {!!rewards.length && (
          <ul>
            {rewards.map((reward, index) => (
              <li key={`${reward.type}-${reward.id ?? index}`}>
                {rewardLabel(reward.type)}
                {reward.amount ? ` ${reward.amount.toLocaleString('ko-KR')}` : ''}
              </li>
            ))}
          </ul>
        )}
        <Button onClick={() => setCompletedChapter(undefined)}>확인</Button>
      </Modal>
    </section>
  );
}
