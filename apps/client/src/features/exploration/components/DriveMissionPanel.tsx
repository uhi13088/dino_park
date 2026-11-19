import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getDinosaurById } from '@dino-park/game-data';
import {
  MATERIAL_QUALITY_LABELS,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  RESEARCH_MATERIAL_LABELS,
  type DriveExpeditionMission,
} from '@dino-park/shared';
import { useClaimHatchingEgg, useStartHatchingEgg } from '@/api';
import {
  driveKey,
  synthesisKey,
  useDriveAction,
  useDriveExpedition,
} from '@/api/queries/hybridMilestone';
import { Button } from '@/components/ui';
import { useGameStore, useUIStore } from '@/stores';
import ExpeditionDrive from './ExpeditionDrive';

function rewardLabel(reward: DriveExpeditionMission['reward']) {
  if (reward.type === 'egg')
    return `${getDinosaurById(reward.speciesId)?.nameKo ?? reward.speciesId} 알 1개`;
  return `${MATERIAL_QUALITY_LABELS[reward.quality]} ${RESEARCH_MATERIAL_LABELS[reward.material]} ${reward.amount}개`;
}

export default function DriveMissionPanel({ focusGrowth = false }: { focusGrowth?: boolean }) {
  const query = useDriveExpedition(true);
  const drive = useDriveAction();
  const startHatch = useStartHatchingEgg();
  const claimHatch = useClaimHatchingEgg();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { startPlacement } = useGameStore();
  const { closeModal, closeSidePanel } = useUIStore();
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playArea = useRef<HTMLDivElement>(null);
  const state = query.data;
  const playing = !!openRunId && state?.run?.id === openRunId && state.run.status === 'running';
  useEffect(() => {
    if (playing) playArea.current?.scrollIntoView({ block: 'start' });
  }, [playing]);
  const busy = drive.isPending || startHatch.isPending || claimHatch.isPending;
  const runAction = async (work: () => Promise<unknown>) => {
    setError(null);
    try {
      await work();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '진행을 저장하지 못했어요.');
    }
  };
  if (!state)
    return (
      <section className="hybrid-panel" aria-label="주행 탐험">
        <p role={query.isError ? 'alert' : 'status'}>
          {query.isError ? query.error.message : '원정 지도를 불러오고 있어요…'}
        </p>
        {query.isError && <Button onClick={() => void query.refetch()}>다시 불러오기</Button>}
      </section>
    );

  const run = state.run;
  const repeatUnlocked = state.missions.some(
    (mission) => mission.repeatable && mission.id !== PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  );
  const growthMission = focusGrowth
    ? state.missions.find((mission) => mission.id === PARK_LEVEL_SIX_CATALYST_MISSION_ID)
    : undefined;
  const missions = growthMission
    ? [growthMission, ...state.missions.filter((mission) => mission.id !== growthMission.id)]
    : state.missions;
  const active = state.missions.find((mission) => mission.id === run?.missionId);
  const hatch = (id: string, ready: boolean) =>
    runAction(async () => {
      await (ready ? claimHatch.mutateAsync(id) : startHatch.mutateAsync(id));
      await Promise.all([
        client.invalidateQueries({ queryKey: driveKey }),
        client.invalidateQueries({ queryKey: synthesisKey }),
      ]);
    });
  const place = (id: string, speciesId: string) => {
    closeModal();
    closeSidePanel();
    startPlacement({ type: 'dinosaur', id, speciesId });
    navigate('/park');
  };

  if (run && active && playing)
    return (
      <div ref={playArea}>
        <ExpeditionDrive
          run={run}
          title={active.title}
          isEgg={active.reward.type === 'egg'}
          onCheckpoint={(sector, positions) =>
            drive.mutateAsync({ kind: 'checkpoint', id: run.id, sector, positions })
          }
          onLeave={() => setOpenRunId(null)}
        />
      </div>
    );

  return (
    <section className="hybrid-panel" aria-labelledby="drive-missions-title">
      <header className="hybrid-section-heading">
        <div>
          <h2 id="drive-missions-title">원정 지도</h2>
          <p>차량을 좌우로 밀어 장애물을 피하고 목표물을 회수하세요.</p>
        </div>
        <span className="hybrid-balance">
          연료 {state.energy} · {state.gold.toLocaleString()}골드
        </span>
      </header>
      {(error || query.error) && (
        <p role="alert" className="hybrid-error">
          {error ?? query.error?.message}
        </p>
      )}
      {!state.unlocked && <p>첫 이구아노돈 부화를 수령하면 원정 지도가 열려요.</p>}
      {growthMission && (
        <div className="hybrid-callout">
          <p>하급 합성 촉매를 받은 뒤 파크에서 현장 발견 경험치를 수령하세요.</p>
          <Link to="/park?panel=growth" className="first-expedition__link-button">
            성장 목표로 돌아가기
          </Link>
        </div>
      )}
      {run && active && (
        <div className="hybrid-callout">
          <div>
            <h3>
              {run.status === 'reward'
                ? '원정 성공'
                : run.status === 'failed'
                  ? '원정 중단'
                  : '진행 중인 원정'}
            </h3>
            <p>
              {active.title} · 회수 {run.collected}/{run.required}
            </p>
          </div>
          {run.status === 'reward' ? (
            <Button
              isLoading={busy}
              onClick={() => void runAction(() => drive.mutateAsync({ kind: 'claim', id: run.id }))}
            >
              {rewardLabel(active.reward)} 받기
            </Button>
          ) : (
            <div className="hybrid-actions">
              {run.status === 'running' && (
                <Button onClick={() => setOpenRunId(run.id)}>주행 이어가기</Button>
              )}
              <Button
                variant="outline"
                isLoading={busy}
                onClick={() =>
                  void runAction(() => drive.mutateAsync({ kind: 'abandon', id: run.id }))
                }
              >
                {run.status === 'failed' ? '결과 닫기' : '원정 포기'}
              </Button>
            </div>
          )}
        </div>
      )}
      <ul className="hybrid-task-list">
        {missions.map((mission) => {
          const { egg } = mission;
          const species = mission.reward.type === 'egg' ? mission.reward.speciesId : null;
          const time = egg?.remainingSeconds ?? 0;
          const canStart =
            state.unlocked &&
            mission.status === 'available' &&
            !run &&
            state.gold >= mission.goldCost &&
            state.energy >= mission.energyCost;
          return (
            <li key={mission.id} className="hybrid-task">
              <div>
                <p className="hybrid-task__region">{mission.regionName}</p>
                <h3>{mission.title}</h3>
                <p>{rewardLabel(mission.reward)}</p>
                {mission.repeatable && (
                  <p className="hybrid-detail">귀환 후 다시 출발할 수 있어요.</p>
                )}
                {mission.status === 'available' && (
                  <p className="hybrid-detail">
                    {mission.goldCost.toLocaleString()}골드 · 연료 {mission.energyCost}
                  </p>
                )}
                {mission.requirement && <p className="hybrid-detail">{mission.requirement}</p>}
                {egg?.status === 'hatching' && (
                  <p className="hybrid-detail">
                    부화 중 · 약 {Math.max(1, Math.ceil(time / 60))}분 남음
                  </p>
                )}
              </div>
              {egg && species ? (
                <div className="hybrid-actions">
                  {egg.status === 'stored' && (
                    <Button
                      disabled={busy || state.hatchingSlots.used >= state.hatchingSlots.total}
                      onClick={() => void hatch(egg.id, false)}
                    >
                      부화 시작
                    </Button>
                  )}
                  {egg.status === 'stored' &&
                    state.hatchingSlots.used >= state.hatchingSlots.total && (
                      <span>부화 자리가 차 있어요</span>
                    )}
                  {egg.status === 'ready' && (
                    <Button disabled={busy} onClick={() => void hatch(egg.id, true)}>
                      부화한 공룡 받기
                    </Button>
                  )}
                  {egg.status === 'claimed' && egg.dinosaurId && (
                    <Button variant="outline" onClick={() => place(egg.dinosaurId!, species)}>
                      파크에서 배치
                    </Button>
                  )}
                </div>
              ) : mission.status === 'available' ? (
                <Button
                  disabled={!canStart || busy}
                  onClick={() =>
                    void runAction(async () => {
                      const next = await drive.mutateAsync({
                        kind: 'start',
                        missionId: mission.id,
                      });
                      setOpenRunId(next.run?.id ?? null);
                    })
                  }
                >
                  {mission.repeatable ? '재료 원정 출발' : '출발'}
                </Button>
              ) : (
                <span className="hybrid-status">
                  {mission.status === 'claimed'
                    ? '수령 완료'
                    : mission.status === 'active'
                      ? '원정 중'
                      : '준비 필요'}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="hybrid-callout">
        <div>
          <h3>연구 재료함</h3>
          <p>
            {state.stock
              .map(
                (item) =>
                  `${MATERIAL_QUALITY_LABELS[item.quality]} ${RESEARCH_MATERIAL_LABELS[item.material]} ${item.amount}개`,
              )
              .join(' · ')}
          </p>
        </div>
        <Link
          to={repeatUnlocked ? '/exploration?tab=repeat' : '/exploration?tab=synthesis'}
          className="first-expedition__link-button"
        >
          {repeatUnlocked ? '반복 합성 준비' : '합성 준비 확인'}
        </Link>
      </div>
    </section>
  );
}
