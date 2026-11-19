import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FIRST_EXPEDITION, getDinosaurById } from '@dino-park/game-data';
import { PARK_LEVEL_SIX_CATALYST_MISSION_ID } from '@dino-park/shared';
import {
  useFirstExpedition,
  useStartFirstExpedition,
  useChooseFirstExpedition,
  useClaimFirstExpedition,
  useStartHatchingEgg,
  useClaimHatchingEgg,
  useExplorations,
  useHatchingQueue,
  useCheckExploration,
  useClaimExploration,
} from '@/api';
import { useDriveExpedition, useFirstSynthesis } from '@/api/queries/hybridMilestone';
import { useAuthStore, useGameStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui';
import FirstExpeditionPanel from '../components/FirstExpeditionPanel';
import DriveMissionPanel from '../components/DriveMissionPanel';
import FirstSynthesisPanel from '../components/FirstSynthesisPanel';
import RepeatSynthesisPanel from '../components/RepeatSynthesisPanel';
import './FirstExpedition.css';
import './HybridMilestone.css';

const statusName = (status: string) =>
  ({ IN_PROGRESS: '진행 중', COMPLETED: '보상 수령 대기', CLAIMED: '수령 완료' })[
    status.toUpperCase()
  ] ?? status;
const eggName = (type: string) =>
  ({ common: '일반', uncommon: '고급', rare: '희귀', epic: '영웅', legendary: '전설' })[type] ??
  type;

export default function ExplorationPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { startPlacement } = useGameStore();
  const { closeModal, closeSidePanel, showToast } = useUIStore();
  const first = useFirstExpedition();
  const history = useExplorations();
  const hatching = useHatchingQueue();
  const start = useStartFirstExpedition();
  const choose = useChooseFirstExpedition();
  const claimEgg = useClaimFirstExpedition();
  const startHatch = useStartHatchingEgg();
  const claimHatch = useClaimHatchingEgg();
  const checkLegacy = useCheckExploration();
  const claimLegacy = useClaimExploration();
  const [actionError, setActionError] = useState<string | null>(null);
  const state = first.data;
  const hatchReceived = state?.stage === 'complete' || state?.stage === 'placement';
  const drive = useDriveExpedition(hatchReceived);
  const synthesis = useFirstSynthesis(hatchReceived);
  const busy =
    start.isPending ||
    choose.isPending ||
    claimEgg.isPending ||
    startHatch.isPending ||
    claimHatch.isPending ||
    checkLegacy.isPending ||
    claimLegacy.isPending;
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
    (item) => item.id !== state.mission?.id,
  );
  const driveEggIds = new Set(drive.data?.missions.map((mission) => mission.egg?.id));
  const legacyEggs = (hatching.data?.queue ?? []).filter(
    (item) => item.id !== state.egg?.id && !driveEggIds.has(item.id),
  );
  const showSynthesis = hatchReceived && params.get('tab') === 'synthesis';
  const canRepeat = !!synthesis.data?.job?.exhibitedAt;
  const showRepeat = canRepeat && params.get('tab') === 'repeat';
  const pendingLegacy =
    legacyTrips.some((item) => item.status.toUpperCase() !== 'CLAIMED') || legacyEggs.length > 0;
  const place = () => {
    if (!state.dinosaur) return;
    closeModal();
    closeSidePanel();
    startPlacement({
      type: 'dinosaur',
      id: state.dinosaur.id,
      speciesId: state.dinosaur.speciesId,
    });
    navigate('/park');
  };
  return (
    <div className="first-expedition">
      <div className="first-expedition__content">
        <header className="first-expedition__header">
          <div>
            <h1>{hatchReceived ? '탐험 기지' : '첫 탐험'}</h1>
            {!hatchReceived && <p>단서에서 알로, 알에서 파크의 새 친구로.</p>}
          </div>
          <Link to="/park">파크로</Link>
        </header>
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
        {state.stage !== 'complete' && (
          <FirstExpeditionPanel
            state={state}
            busy={busy}
            onStart={() => void run(() => start.mutateAsync(FIRST_EXPEDITION.regionId))}
            onChoice={(choiceId) => {
              if (state.mission)
                void run(() =>
                  choose.mutateAsync({
                    id: state.mission!.id,
                    step: state.mission!.step,
                    choiceId,
                  }),
                );
            }}
            onClaimEgg={() => {
              if (state.mission) void run(() => claimEgg.mutateAsync(state.mission!.id));
            }}
            onStartHatch={() => {
              if (state.egg) void run(() => startHatch.mutateAsync(state.egg!.id));
            }}
            onClaimHatch={() => {
              if (state.egg) void run(() => claimHatch.mutateAsync(state.egg!.id));
            }}
            onPlace={place}
            onRefresh={() => void first.refetch()}
          />
        )}
        {hatchReceived && (
          <>
            <nav className="hybrid-tabs" aria-label="원정과 합성">
              <Link
                to="/exploration"
                aria-current={!showSynthesis && !showRepeat ? 'page' : undefined}
              >
                주행 탐험
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
            {showRepeat ? (
              <RepeatSynthesisPanel />
            ) : showSynthesis ? (
              <FirstSynthesisPanel />
            ) : (
              <DriveMissionPanel
                focusGrowth={params.get('mission') === PARK_LEVEL_SIX_CATALYST_MISSION_ID}
              />
            )}
          </>
        )}
        <details className="first-expedition__history" open={pendingLegacy}>
          <summary>이전 탐험과 부화 기록{pendingLegacy ? ' · 확인할 기록이 있어요' : ''}</summary>
          <p className="first-expedition__small">
            이전에 시작한 탐험과 얻은 알은 그대로 남아 있어요. 진행 중인 탐험이나 부화를 먼저 마치면
            새 자리를 사용할 수 있어요.
          </p>
          {(history.error || hatching.error) && (
            <div role="alert">
              <p>이전 기록을 불러오지 못했어요.</p>
              <Button
                variant="outline"
                disabled={history.isFetching || hatching.isFetching}
                onClick={() => {
                  void history.refetch();
                  void hatching.refetch();
                }}
              >
                이전 기록 다시 보기
              </Button>
            </div>
          )}
          {!legacyTrips.length &&
            !legacyEggs.length &&
            !history.isPending &&
            !hatching.isPending && <p className="first-expedition__small">이전 기록이 없어요.</p>}
          {!!legacyTrips.length && (
            <ul aria-label="이전 탐험 기록">
              {legacyTrips.slice(0, 8).map((item) => {
                const status = item.status.toUpperCase();
                const ready = (item.remainingSeconds ?? 0) <= 0;
                return (
                  <li key={item.id}>
                    <div>
                      <strong>{item.regionId === 'grassland' ? '초원 지대' : '이전 탐험'}</strong>
                      <p>
                        {statusName(item.status)}
                        {status === 'IN_PROGRESS' && !ready
                          ? ` · 약 ${Math.ceil((item.remainingSeconds ?? 0) / 60)}분 남음`
                          : ''}
                      </p>
                    </div>
                    {status === 'IN_PROGRESS' && (
                      <Button
                        variant="outline"
                        disabled={!ready || busy}
                        onClick={() => void run(() => checkLegacy.mutateAsync(item.id))}
                      >
                        탐험 완료 확인
                      </Button>
                    )}
                    {status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => claimLegacy.mutateAsync(item.id),
                            '이전 탐험의 보상을 받았어요.',
                          )
                        }
                      >
                        이전 보상 수령
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!!legacyEggs.length && (
            <ul aria-label="이전 부화 기록">
              {legacyEggs.map((egg) => (
                <li key={egg.id}>
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
                      이전 알 부화 시작
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={busy || (egg.remainingSeconds ?? 0) > 0}
                      onClick={() =>
                        void run(() => claimHatch.mutateAsync(egg.id), '공룡이 태어났어요.')
                      }
                    >
                      부화한 공룡 받기
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>
    </div>
  );
}
