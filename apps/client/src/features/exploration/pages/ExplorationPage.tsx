import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { getDinosaurById } from '@dino-park/game-data';
import {
  MATERIAL_QUALITY_LABELS,
  RESEARCH_MATERIAL_LABELS,
  type FirstExpeditionStateResponse,
} from '@dino-park/shared';
import {
  useFirstExpedition,
  useClaimFirstExpedition,
  useStartHatchingEgg,
  useClaimHatchingEgg,
  useExplorations,
  useHatchingQueue,
  useClaimExploration,
} from '@/api';
import {
  useClaimLegacyDriveReward,
  useFirstSynthesis,
  useLegacyDriveReward,
} from '@/api/queries/hybridMilestone';
import { useAuthStore, useGameStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui';
import {
  parkGrowthHref,
  parseParkGrowthStage,
  storyReturnHref,
} from '@/utils/parkGrowthNavigation';
import FirstHatchingPanel from '../components/FirstHatchingPanel';
import FirstSynthesisPanel from '../components/FirstSynthesisPanel';
import RepeatSynthesisPanel from '../components/RepeatSynthesisPanel';
import ScoutDispatchPanel from '../components/ScoutDispatchPanel';
import './FirstExpedition.css';
import './HybridMilestone.css';
import './ScoutDispatch.css';

const eggName = (type: string) =>
  ({ common: '일반', uncommon: '고급', rare: '희귀', epic: '영웅', legendary: '전설' })[type] ??
  type;
export default function ExplorationPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedMission = params.get('mission');
  const requestedSpot = params.get('spot');
  const requestedStage = params.get('stage');
  const growthStage = parseParkGrowthStage(requestedStage);
  const requestedHatch = params.get('hatch');
  const returnChapter = params.get('returnChapter');
  const returnToHybridNotebook = params.get('returnTo') === 'hybrid-notebook';
  const cameFromGrowth =
    growthStage !== undefined ||
    params.get('from') === 'growth' ||
    (!requestedSpot &&
      ['basic-catalyst', 'basic-dna', 'repeat-rim-survey'].includes(requestedMission ?? ''));
  const growthReturnPath =
    cameFromGrowth && !returnChapter ? parkGrowthHref(growthStage) : undefined;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { startPlacement } = useGameStore();
  const { closeModal, closeSidePanel, showToast } = useUIStore();
  const first = useFirstExpedition();
  const history = useExplorations();
  const hatching = useHatchingQueue();
  const claimEgg = useClaimFirstExpedition();
  const startHatch = useStartHatchingEgg();
  const claimHatch = useClaimHatchingEgg();
  const claimLegacy = useClaimExploration();
  const drive = useLegacyDriveReward();
  const claimDrive = useClaimLegacyDriveReward();
  const [actionError, setActionError] = useState<string | null>(null);
  const [hatched, setHatched] = useState<
    NonNullable<FirstExpeditionStateResponse['hatchedDinosaur']>[]
  >([]);
  const state = first.data;
  const hatchReceived = state?.stage === 'complete' || state?.stage === 'placement';
  const synthesis = useFirstSynthesis(hatchReceived);
  const requestedEggId = requestedHatch
    ? hatching.data?.queue.find(({ speciesId }) => speciesId === requestedHatch)?.id
    : undefined;
  const expeditionLoaded = !!state;
  useEffect(() => {
    if (!requestedEggId || !expeditionLoaded) return;
    const egg = document.getElementById(`hatching-${requestedEggId}`);
    egg?.scrollIntoView?.({ block: 'nearest' });
    egg?.focus({ preventScroll: true });
  }, [requestedEggId, expeditionLoaded]);
  const busy =
    claimEgg.isPending ||
    startHatch.isPending ||
    claimHatch.isPending ||
    claimLegacy.isPending ||
    claimDrive.isPending;
  const run = async (action: () => Promise<unknown>, message?: string) => {
    setActionError(null);
    try {
      await action();
      if (message) showToast({ type: 'success', message });
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : '저장하지 못했어요. 다시 시도해주세요.',
      );
    }
  };
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!state && first.isPending)
    return (
      <div role="status" className="first-expedition__loading">
        탐험을 준비하고 있어요…
      </div>
    );
  if (!state)
    return (
      <div className="first-expedition__loading">
        <p role="alert">탐험 정보를 불러오지 못했어요. {first.error?.message}</p>
        <Button onClick={() => void first.refetch()} disabled={first.isFetching}>
          다시 시도
        </Button>
      </div>
    );
  const legacyTrips = (history.data?.explorations ?? []).filter(
    ({ id, status }) => id !== state.mission?.id && status.toUpperCase() === 'COMPLETED',
  );
  const legacyDrive = drive.data?.run;
  const driveReward = legacyDrive?.reward;
  const otherEggs = (hatching.data?.queue ?? []).filter(({ id }) => id !== state.egg?.id);
  const showSynthesis = hatchReceived && params.get('tab') === 'synthesis';
  const canRepeat = !!synthesis.data?.job?.exhibitedAt;
  const showRepeat = canRepeat && params.get('tab') === 'repeat';
  const showMap = !showSynthesis && !showRepeat;
  const showHatching = (!!state.egg && state.egg.status !== 'claimed') || otherEggs.length > 0;
  const pendingLegacy =
    !!driveReward || legacyTrips.length > 0 || otherEggs.length > 0 || hatched.length > 0;
  const place = (id: string, speciesId: string) => {
    closeModal();
    closeSidePanel();
    startPlacement({
      type: 'dinosaur',
      id,
      speciesId,
    });
    navigate('/park');
  };
  return (
    <div className={showMap ? 'first-expedition first-expedition--map' : 'first-expedition'}>
      <div className="first-expedition__content">
        {showMap ? (
          <h1 className="sr-only">탐험 기지</h1>
        ) : (
          <header className="first-expedition__header">
            <h1>탐험 기지</h1>
            {hatchReceived && (
              <nav className="hybrid-tabs" aria-label="탐험과 합성">
                <Link to="/exploration" aria-current={showMap ? 'page' : undefined}>
                  탐험 지도
                </Link>
                <Link
                  to="/exploration?tab=synthesis"
                  aria-current={showSynthesis ? 'page' : undefined}
                >
                  첫 합성·전시
                </Link>
                {canRepeat && (
                  <Link to="/exploration?tab=repeat" aria-current={showRepeat ? 'page' : undefined}>
                    반복 합성
                  </Link>
                )}
              </nav>
            )}
            <Link to="/park">파크로</Link>
          </header>
        )}
        {(actionError || first.error) && (
          <div className="first-expedition__error" role="alert">
            <p>{actionError ?? `진행 정보를 갱신하지 못했어요. ${first.error?.message ?? ''}`}</p>
            <Button
              variant="outline"
              disabled={busy || first.isFetching}
              onClick={() => {
                setActionError(null);
                void first.refetch();
              }}
            >
              다시 확인
            </Button>
          </div>
        )}
        {showRepeat ? (
          <RepeatSynthesisPanel />
        ) : showSynthesis ? (
          <FirstSynthesisPanel />
        ) : (
          <ScoutDispatchPanel
            requestedMission={requestedMission}
            requestedSpot={requestedSpot}
            stage={requestedStage}
            canSynthesize={hatchReceived}
            canRepeat={canRepeat}
            showHatching={showHatching}
            growthReturnPath={growthReturnPath}
            returnChapter={returnChapter}
            returnToHybridNotebook={returnToHybridNotebook}
            storyReturnPath={
              returnChapter ? storyReturnHref(returnChapter, growthStage) : undefined
            }
          />
        )}
        <div id="expedition-hatching" className="expedition-hatching">
          <FirstHatchingPanel
            state={state}
            busy={busy}
            onClaimEgg={() => {
              if (state.mission) void run(() => claimEgg.mutateAsync(state.mission!.id));
            }}
            onStartHatch={() => {
              if (state.egg) void run(() => startHatch.mutateAsync(state.egg!.id));
            }}
            onClaimHatch={() => {
              if (state.egg) void run(() => claimHatch.mutateAsync(state.egg!.id));
            }}
            onPlace={() => {
              if (state.dinosaur) place(state.dinosaur.id, state.dinosaur.speciesId);
            }}
            onRefresh={() => void first.refetch()}
          />
          <details className="first-expedition__history" open={pendingLegacy}>
            <summary>알 보관함과 이전 탐험 보상</summary>
            {(history.error || hatching.error || drive.error) && (
              <div role="alert">
                <p>이전 기록을 불러오지 못했어요.</p>
                <Button
                  variant="outline"
                  disabled={history.isFetching || hatching.isFetching || drive.isFetching}
                  onClick={() => {
                    void history.refetch();
                    void hatching.refetch();
                    void drive.refetch();
                  }}
                >
                  이전 기록 다시 보기
                </Button>
              </div>
            )}
            {!legacyTrips.length &&
              !driveReward &&
              !otherEggs.length &&
              !hatched.length &&
              !history.isPending &&
              !hatching.isPending &&
              !drive.isPending && (
                <p className="first-expedition__small">보관 중인 알이나 받을 보상이 없어요.</p>
              )}
            {(driveReward || legacyTrips.length > 0) && (
              <ul aria-label="이전 탐험 보상">
                {legacyDrive && driveReward && (
                  <li key={legacyDrive.id}>
                    <div>
                      <strong>{legacyDrive.title}</strong>
                      <p>
                        {driveReward.type === 'egg'
                          ? `${getDinosaurById(driveReward.speciesId)?.nameKo ?? driveReward.speciesId} 알 1개`
                          : `${MATERIAL_QUALITY_LABELS[driveReward.quality]} ${RESEARCH_MATERIAL_LABELS[driveReward.material]} ${driveReward.amount}개`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => claimDrive.mutateAsync(legacyDrive.id),
                          '이전 탐험 보상을 받았어요.',
                        )
                      }
                    >
                      이전 보상 수령
                    </Button>
                  </li>
                )}
                {legacyTrips.map((item) => (
                  <li key={item.id}>
                    <strong>{item.regionId === 'grassland' ? '초원 지대' : '이전 탐험'}</strong>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => claimLegacy.mutateAsync(item.id),
                          '이전 탐험 보상을 받았어요.',
                        )
                      }
                    >
                      이전 보상 수령
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {(otherEggs.length > 0 || hatched.length > 0) && (
              <ul aria-label="알 보관함">
                {otherEggs.map((egg) => (
                  <li
                    key={egg.id}
                    id={`hatching-${egg.id}`}
                    tabIndex={egg.id === requestedEggId ? -1 : undefined}
                  >
                    <div>
                      <strong>
                        {(egg.speciesId ? getDinosaurById(egg.speciesId)?.nameKo : null) ??
                          `${eggName(egg.eggType)} 공룡`}{' '}
                        알
                      </strong>
                      <p>
                        {egg.readyToStart
                          ? '부화 시작 대기'
                          : (egg.remainingSeconds ?? 0) > 0
                            ? `부화 중 · 약 ${Math.ceil((egg.remainingSeconds ?? 0) / 60)}분 남음`
                            : '부화 완료 · 수령 대기'}
                      </p>
                    </div>
                    {egg.readyToStart ? (
                      <Button
                        variant="outline"
                        disabled={busy || state.hatchingSlots.used >= state.hatchingSlots.total}
                        onClick={() => void run(() => startHatch.mutateAsync(egg.id))}
                      >
                        부화 시작
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled={busy || (egg.remainingSeconds ?? 0) > 0}
                        onClick={() =>
                          void run(async () => {
                            const { hatchedDinosaur } = await claimHatch.mutateAsync(egg.id);
                            if (hatchedDinosaur)
                              setHatched((list) =>
                                list.some(({ id }) => id === hatchedDinosaur.id)
                                  ? list
                                  : [...list, hatchedDinosaur],
                              );
                          }, '공룡이 태어났어요.')
                        }
                      >
                        부화한 공룡 받기
                      </Button>
                    )}
                  </li>
                ))}
                {hatched.map(({ id, speciesId }) => (
                  <li key={id}>
                    <div>
                      <strong>{getDinosaurById(speciesId)?.nameKo ?? speciesId}</strong>
                      <p>부화 완료</p>
                    </div>
                    <Button variant="outline" onClick={() => place(id, speciesId)}>
                      파크에서 배치
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </div>
      </div>
    </div>
  );
}
