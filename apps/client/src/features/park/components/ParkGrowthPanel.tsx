import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
  PARK_LEVEL_SEVEN_DNA_MISSION_ID,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  type ParkEarlyGrowthResponse,
  type ParkEarlyGrowthStage,
  type ParkGrowthStage,
} from '@dino-park/shared';
import { useParkGrowth, useParkGrowthAction } from '@/api/queries/parkGrowth';
import { Button } from '@/components/ui';
import ParkGrowthRoutesPanel from './ParkGrowthRoutesPanel';
import './ParkGrowthPanel.css';

type Goal = ParkEarlyGrowthResponse['goals'][number];

const levelSixGoals = {
  facility: { title: '시설 준비', requirement: 'DNA 연구소 Lv.1 완공' },
  research: { title: '연구 적용', requirement: '입장 수속 Lv.1 완료' },
  field: { title: '현장 발견', requirement: '폐연구소 기초 촉매 보상 수령' },
  operation: { title: '입장 실적', requirement: '누적 유료 입장객' },
} satisfies Record<Goal['id'], { title: string; requirement: string }>;

const levelSevenGoals = {
  facility: { title: '시설 준비', requirement: '관람대 Lv.2 완공' },
  research: { title: '연구 적용', requirement: '환경 적응 Lv.1 완료' },
  field: { title: '현장 발견', requirement: '화석 계곡 하급 DNA 보상 수령' },
  operation: { title: '운영 실적', requirement: '누적 유료 입장객' },
} satisfies typeof levelSixGoals;

const levelEightGoals = {
  facility: { title: '시설 준비', requirement: '보안센터 Lv.2 완공' },
  research: { title: '연구 적용', requirement: '현장 지도화 Lv.1 완료' },
  field: { title: '현장 발견', requirement: '화석 계곡 재조사 보상 수령' },
  operation: levelSevenGoals.operation,
} satisfies typeof levelSixGoals;

const stages = {
  5: {
    goals: levelSixGoals,
    researchName: '입장 수속',
    facilityAction: '시설 보기',
    fieldMissionId: PARK_LEVEL_SIX_CATALYST_MISSION_ID,
    fieldAction: '폐연구소로 가기',
    previous: null,
    next: 6,
  },
  6: {
    goals: levelSevenGoals,
    researchName: '환경 적응',
    facilityAction: '관람대 확인',
    fieldMissionId: PARK_LEVEL_SEVEN_DNA_MISSION_ID,
    fieldAction: '화석 계곡으로 가기',
    previous: 5,
    next: 7,
  },
  7: {
    goals: levelEightGoals,
    researchName: '현장 지도화',
    facilityAction: '보안센터 확인',
    fieldMissionId: PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
    fieldAction: '화석 계곡 재조사로 가기',
    previous: 6,
    next: 8,
  },
} as const;

const nextMilestone = {
  5: '관람할 전시를 늘리거나 다음 합성에 쓸 중급 재료를 모을 수 있어요.',
  6: '현장 지도화로 화석 계곡의 새 조사 구간을 열거나 네 번째 전시를 준비해요.',
  7: '전시 구역을 다듬거나 다른 성향의 스테고케라톱스를 합성해보세요.',
} as const;

const formatNumber = (value: number) => value.toLocaleString('ko-KR');

interface Props {
  isParkOpen: boolean;
  canRepeatSynthesis?: boolean;
  stage?: ParkEarlyGrowthStage;
  onStageChange?: (stage: ParkGrowthStage) => void;
  focusEntranceResearch?: boolean;
  onClose: () => void;
  onShowFacilities: () => void;
  onShowExhibits: () => void;
  onShowResources: () => void;
  onPrepareLab: () => void;
}

export default function ParkGrowthPanel({
  isParkOpen,
  canRepeatSynthesis = false,
  stage = 5,
  onStageChange,
  focusEntranceResearch,
  onClose,
  onShowFacilities,
  onShowExhibits,
  onShowResources,
  onPrepareLab,
}: Props) {
  const query = useParkGrowth(stage);
  const mutation = useParkGrowthAction();
  const state = query.data && 'research' in query.data ? query.data : undefined;
  const research = state?.research;
  const {
    goals: goalLabels,
    researchName,
    facilityAction,
    fieldMissionId,
    fieldAction,
    previous,
    next,
  } = stages[stage];
  const title = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const achievementTitle = useRef<HTMLHeadingElement>(null);
  const entranceResearchGoal = useRef<HTMLElement>(null);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now);
  const isResearchRunning = research?.status === 'running';
  const remainingSeconds = research?.completesAt
    ? Math.max(0, Math.ceil((Date.parse(research.completesAt) - now) / 1000))
    : 0;
  const canFocusResearch = focusEntranceResearch && state?.unlocked;
  useEffect(() => {
    if (canFocusResearch) entranceResearchGoal.current?.focus();
    else title.current?.focus({ preventScroll: true });
  }, [canFocusResearch]);
  useEffect(() => {
    if (!isResearchRunning) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isResearchRunning]);

  const achieved = !!state && state.level >= state.targetLevel;
  const showHandoff = achieved && state.level === state.targetLevel;
  useEffect(() => {
    if (!showHandoff || canFocusResearch) return;
    if (body.current) body.current.scrollTop = 0;
    achievementTitle.current?.focus({ preventScroll: true });
  }, [showHandoff, canFocusResearch]);
  const routes = stage !== 5 ? state?.routes : undefined;
  const routeClaimable =
    !!routes &&
    (routes.operations.status === 'claimable' || routes.exploration.status === 'claimable');
  const claimable =
    (state?.goals.filter(({ status }) => status === 'claimable').length ?? 0) +
    Number(routeClaimable);
  const claimed =
    (state?.goals.filter(({ status }) => status === 'claimed').length ?? 0) +
    Number(!!routes && (!!routes.claimedRoute || achieved));
  const sharedResearchReceived =
    stage !== 6 ||
    !!state?.goals.some(({ id, status }) => id === 'research' && status === 'claimed');
  const busy = mutation.isPending;
  const openNextStage = next !== null && (state?.level ?? 0) >= next;
  const moveForwardInHistory = openNextStage && !showHandoff;
  const switchStage = onStageChange && (previous !== null || moveForwardInHistory) && (
    <nav className="park-growth__stage-links" aria-label="성장 목표 단계">
      {previous !== null && (
        <Button
          type="button"
          variant="outline"
          className="park-growth__stage-link"
          disabled={busy}
          onClick={() => onStageChange(previous)}
        >
          Lv.{previous + 1} 성장 목표
        </Button>
      )}
      {moveForwardInHistory && (
        <Button
          type="button"
          variant="outline"
          className="park-growth__stage-link"
          disabled={busy}
          onClick={() => onStageChange(next)}
        >
          Lv.{next + 1} 성장 목표
        </Button>
      )}
    </nav>
  );
  let researchEffect = `입구 분당 처리량 +${research?.entranceBonusPercent ?? 0}%`;
  if (stage === 6) {
    researchEffect = `호환 서식지의 공룡 행복도 감소·허기 증가 속도 ${research?.careDecayReductionPercent ?? 0}% 완화`;
  } else if (stage === 7) {
    researchEffect = '화석 계곡의 기슭 화석층에서 재조사 가능';
  }

  const runAction = (action: Parameters<typeof mutation.mutate>[0]) => {
    setNotice('');
    mutation.mutate(stage === 5 || action.kind === 'claim-route' ? action : { ...action, stage }, {
      onSuccess: (updated) => {
        if (action.kind === 'start-research') {
          setNow(Date.now());
          setNotice(`${researchName} 연구를 시작했어요.`);
          return;
        }
        if (action.kind === 'claim-route') {
          if (updated.level < updated.targetLevel) {
            const name = action.routeId === 'operations' ? '운영' : '탐험';
            setNotice(`${name} 성과 보상을 받았어요.`);
          }
          return;
        }
        const goal = updated.goals.find((item) => item.id === action.goalId);
        if (achieved || updated.level < updated.targetLevel) {
          setNotice(goal ? `${formatNumber(goal.xp)} XP 보상을 받았어요.` : '보상을 받았어요.');
        }
      },
    });
  };

  const researchDetails =
    research &&
    (research.status === 'locked' ? (
      <p className="park-growth__detail">{research.unavailableReason}</p>
    ) : (
      <>
        <p className="park-growth__detail">
          {research.status === 'completed' ? '적용 중' : '완료 효과'} · {researchEffect}
        </p>
        {isResearchRunning && (
          <p className="park-growth__detail">
            {remainingSeconds > 0 ? `연구 중 · ${remainingSeconds}초 남음` : '연구 결과 확인 중'}
          </p>
        )}
        {research.status === 'available' && (
          <>
            <p className="park-growth__detail">
              {formatNumber(research.costs.gold)}골드 · 목재 {research.costs.wood}개 · 석재{' '}
              {research.costs.stone}개 · {research.durationSeconds}초
            </p>
            {research.unavailableReason && (
              <p className="park-growth__detail">{research.unavailableReason}</p>
            )}
          </>
        )}
      </>
    ));

  const researchAction =
    research?.status === 'locked' ? (
      <Button variant="outline" onClick={onPrepareLab}>
        연구소 확인
      </Button>
    ) : research?.status === 'available' && !research.blockedByResearch ? (
      research.unavailableReason ? (
        <Button variant="outline" onClick={onShowResources}>
          자원 시설 보기
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => runAction({ kind: 'start-research' })}
        >
          {busy ? '처리 중' : '연구 시작'}
        </Button>
      )
    ) : null;

  return (
    <section
      className="park-growth"
      aria-labelledby="park-growth-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <header className="park-growth__header">
        <div>
          <h2 id="park-growth-title" ref={title} tabIndex={-1}>
            성장 목표
          </h2>
          {state?.unlocked && (
            <p>
              보상 수령 {claimed}/{state.goals.length + Number(!!routes)}
              {claimable > 0 && ` · 받을 보상 ${claimable}개`}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          aria-label="성장 목표 닫기"
          className="park-growth__close"
          onClick={onClose}
        >
          닫기
        </Button>
      </header>
      <div className="park-growth__body" ref={body}>
        {query.error && (
          <div className="park-growth__notice">
            <p role="alert">성장 목표를 불러오지 못했어요.</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              다시 불러오기
            </Button>
          </div>
        )}
        {query.isPending && !query.error && <p role="status">성장 목표를 확인하고 있어요…</p>}
        {state && !state.unlocked && (
          <div>
            <p>
              {stage === 5
                ? '첫 스테고케라톱스를 받은 뒤 성장 목표를 진행할 수 있어요.'
                : `첫 스테고케라톱스를 받고 파크 Lv.${stage}에 도달하면 열려요.`}
            </p>
            {switchStage}
          </div>
        )}
        {state?.unlocked && (
          <>
            <div className="park-growth__progress" aria-live="polite">
              <div>
                <h3
                  ref={showHandoff ? achievementTitle : undefined}
                  tabIndex={showHandoff ? -1 : undefined}
                >
                  {achieved
                    ? `파크 Lv.${state.targetLevel} 달성!`
                    : `파크 Lv.${state.level} → Lv.${state.targetLevel}`}
                </h3>
                {!achieved && (
                  <p>
                    {formatNumber(state.exp)} / {formatNumber(state.expForNextLevel)} XP
                  </p>
                )}
                {switchStage}
              </div>
              {!achieved && (
                <progress
                  aria-label="파크 레벨 경험치"
                  value={state.exp}
                  max={Math.max(1, state.expForNextLevel)}
                />
              )}
            </div>
            {showHandoff && (
              <section
                className="park-growth__next"
                aria-label={`Lv.${state.targetLevel} 달성 후 이어 할 일`}
              >
                <p>
                  {stage === 7 && !canRepeatSynthesis
                    ? '전시 구역을 다듬어 다음 손님을 맞이해요.'
                    : nextMilestone[stage]}
                </p>
                <div className="park-growth__next-actions">
                  {next !== null && onStageChange && (
                    <Button type="button" disabled={busy} onClick={() => onStageChange(next)}>
                      Lv.{next + 1} 성장 목표
                    </Button>
                  )}
                  {stage === 7 && (
                    <>
                      <Button type="button" onClick={onShowExhibits}>
                        전시 구역 관리
                      </Button>
                      {canRepeatSynthesis && (
                        <Link
                          className="park-growth__link"
                          to="/exploration?tab=repeat"
                          onClick={onClose}
                        >
                          반복 합성 보러 가기
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </section>
            )}
            {notice && (
              <p className="park-growth__notice" role="status">
                {notice}
              </p>
            )}
            {mutation.error && (
              <p className="park-growth__notice park-growth__notice--error" role="alert">
                {mutation.error.message}
              </p>
            )}
            <ul className="park-growth__goals" aria-label="레벨업 목표">
              {state.goals.map((goal) => {
                const label =
                  routes && goal.id === 'research'
                    ? { ...goalLabels[goal.id], title: '공통 연구' }
                    : goalLabels[goal.id];
                const reward = `${formatNumber(goal.xp)} XP`;
                return (
                  <li key={goal.id}>
                    <article
                      aria-labelledby={`park-growth-${goal.id}`}
                      className="park-growth__goal"
                      ref={goal.id === 'research' ? entranceResearchGoal : undefined}
                      tabIndex={goal.id === 'research' ? -1 : undefined}
                    >
                      <div>
                        <h3 id={`park-growth-${goal.id}`}>{label.title}</h3>
                        <p>
                          {label.requirement}
                          {goal.id === 'operation' &&
                            ` ${formatNumber(goal.progress)} / ${formatNumber(goal.target)}명`}
                        </p>
                        {goal.id === 'research' && researchDetails}
                      </div>
                      <div className="park-growth__action">
                        {goal.status === 'claimable' ? (
                          <Button
                            disabled={busy}
                            onClick={() => runAction({ kind: 'claim', goalId: goal.id })}
                          >
                            {reward} 받기
                          </Button>
                        ) : (
                          <p className="park-growth__reward">
                            {goal.status === 'claimed' ? '보상 받음' : reward}
                          </p>
                        )}
                        {goal.status === 'incomplete' && (
                          <>
                            {goal.id === 'facility' && (
                              <Button variant="outline" onClick={onShowFacilities}>
                                {facilityAction}
                              </Button>
                            )}
                            {goal.id === 'research' && researchAction}
                            {goal.id === 'field' && (
                              <Link
                                className="park-growth__link"
                                to={`/exploration?mission=${fieldMissionId}`}
                                onClick={onClose}
                              >
                                {fieldAction}
                              </Link>
                            )}
                            {goal.id === 'operation' && !isParkOpen && (
                              <Button variant="outline" onClick={onClose}>
                                파크 운영 보기
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
            {routes && stage !== 5 && (
              <ParkGrowthRoutesPanel
                stage={stage}
                routes={routes}
                sharedResearchReceived={sharedResearchReceived}
                busy={busy}
                isParkOpen={isParkOpen}
                onShowExhibits={onShowExhibits}
                onClose={onClose}
                onClaim={(routeId) => runAction({ kind: 'claim-route', routeId, stage })}
                researchDetail={
                  stage === 7 && (
                    <div className="park-growth__route-research">
                      <h4>현장 지도화 Lv.1</h4>
                      {researchDetails}
                      {researchAction}
                    </div>
                  )
                }
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
