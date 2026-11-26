import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RESEARCH_LAB_ID, RESEARCH_STORAGE_ID, SCOUT_MISSIONS } from '@dino-park/game-data';
import type {
  ParkGrowthAlternativeView,
  ParkGrowthGoalId,
  ParkGrowthStage,
  ParkMidgameGrowthStage,
} from '@dino-park/shared';
import { useHatchingQueue } from '@/api';
import { useParkGrowth, useParkGrowthAction } from '@/api/queries/parkGrowth';
import { Button } from '@/components/ui';
import {
  currentParkGrowthStage,
  growthOriginParams,
  LAST_PARK_GROWTH_STAGE,
  parseParkGrowthStage,
} from '@/utils/parkGrowthNavigation';
import './ParkGrowthPanel.css';

const names: Record<ParkGrowthGoalId, string> = {
  facility: '시설 준비',
  research: '연구 적용',
  field: '현장 발견',
  operation: '운영 실적',
};
const format = (value: number) => value.toLocaleString('ko-KR');

interface Actions {
  onClose: () => void;
  onManageBuilding: (typeId: string) => void;
  onShowOperations: () => void;
}

function AlternativeAction({
  alternative,
  stage,
  eggSpecies,
  actions,
}: {
  alternative: ParkGrowthAlternativeView;
  stage: ParkMidgameGrowthStage;
  eggSpecies: ReadonlySet<string>;
  actions: Actions;
}) {
  if (alternative.status === 'unavailable')
    return <span className="park-growth__reward">준비 중</span>;
  if (alternative.status === 'complete')
    return <span className="park-growth__midgame-done">완료</span>;
  const params = growthOriginParams(stage);
  switch (alternative.kind) {
    case 'research':
      params.set('technology', alternative.technologyId);
      params.set('level', String(alternative.level));
      return (
        <Link className="park-growth__link" to={`/research?${params}`} onClick={actions.onClose}>
          연구 보기
        </Link>
      );
    case 'building':
      if ([RESEARCH_LAB_ID, RESEARCH_STORAGE_ID].some((id) => alternative.typeId === id)) {
        params.set('facility', alternative.typeId);
        params.set('level', String(alternative.level));
        return (
          <Link className="park-growth__link" to={`/research?${params}`} onClick={actions.onClose}>
            시설 관리
          </Link>
        );
      }
      return (
        <Button
          className="park-growth__stage-link"
          onClick={() => actions.onManageBuilding(alternative.typeId)}
        >
          시설 관리
        </Button>
      );
    case 'dispatch':
      params.set('mission', alternative.missionId);
      return (
        <Link className="park-growth__link" to={`/exploration?${params}`} onClick={actions.onClose}>
          조사로 가기
        </Link>
      );
    case 'owned': {
      const mission = SCOUT_MISSIONS.find(
        ({ reward }) => reward.type === 'egg' && reward.speciesId === alternative.speciesId,
      );
      if (eggSpecies.has(alternative.speciesId)) {
        params.set('hatch', alternative.speciesId);
        return (
          <Link
            className="park-growth__link"
            to={`/exploration?${params}`}
            onClick={actions.onClose}
          >
            알 부화 보기
          </Link>
        );
      }
      if (mission) {
        params.set('mission', mission.id);
        return (
          <Link
            className="park-growth__link"
            to={`/exploration?${params}`}
            onClick={actions.onClose}
          >
            알 조사로 가기
          </Link>
        );
      }
      params.set('species', alternative.speciesId);
      return (
        <Link className="park-growth__link" to={`/dinosaur?${params}`} onClick={actions.onClose}>
          획득 방법
        </Link>
      );
    }
    case 'paid':
      return (
        <Button className="park-growth__stage-link" onClick={actions.onShowOperations}>
          입장 운영 보기
        </Button>
      );
  }
}

export default function ParkMidgameGrowthPanel({
  stage,
  onStageChange,
  ...actions
}: Actions & {
  stage: ParkMidgameGrowthStage;
  onStageChange: (stage: ParkGrowthStage) => void;
}) {
  const query = useParkGrowth(stage);
  const claim = useParkGrowthAction();
  const state = query.data && !('research' in query.data) ? query.data : undefined;
  const needsEgg = !!state?.goals.some(
    ({ status, alternatives }) =>
      status === 'incomplete' &&
      alternatives.some(
        ({ kind, status: alternativeStatus }) =>
          kind === 'owned' && alternativeStatus === 'incomplete',
      ),
  );
  const eggs = useHatchingQueue(needsEgg);
  const title = useRef<HTMLHeadingElement>(null);
  const milestone = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState('');
  const achieved = !!state && state.level >= state.targetLevel;
  const currentStage = state ? currentParkGrowthStage(state.level) : stage;
  const claimable = state?.goals.filter(({ status }) => status === 'claimable').length ?? 0;
  const received = state?.goals.filter(({ status }) => status === 'claimed').length ?? 0;
  const eggSpecies = new Set(
    (eggs.data?.queue ?? []).flatMap(({ speciesId }) => (speciesId ? [speciesId] : [])),
  );

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!achieved || state?.level !== state?.targetLevel) return;
    if (body.current) body.current.scrollTop = 0;
    milestone.current?.focus({ preventScroll: true });
  }, [achieved, state?.level, state?.targetLevel]);

  return (
    <section className="park-growth park-growth--midgame" aria-labelledby="park-growth-title">
      <header className="park-growth__header">
        <div>
          <h2 id="park-growth-title" ref={title} tabIndex={-1}>
            성장 목표
          </h2>
          {state?.unlocked && (
            <p>
              보상 수령 {received}/{state.goals.length}
              {claimable > 0 ? ` · 받을 보상 ${claimable}개` : ''}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          aria-label="성장 목표 닫기"
          className="park-growth__close"
          onClick={actions.onClose}
        >
          닫기
        </Button>
      </header>
      <div className="park-growth__body" ref={body}>
        {query.error && (
          <div className="park-growth__notice park-growth__notice--error">
            <p role="alert">{query.error.message}</p>
            <Button onClick={() => void query.refetch()}>다시 불러오기</Button>
          </div>
        )}
        {query.isPending && !query.error && <p role="status">성장 목표를 확인하고 있어요…</p>}
        {state && (
          <>
            <div className="park-growth__progress">
              <div>
                <h3 ref={milestone} tabIndex={-1}>
                  {achieved
                    ? `파크 Lv.${state.targetLevel} 달성!`
                    : `파크 Lv.${stage} → Lv.${state.targetLevel}`}
                </h3>
                <select
                  aria-label="성장 목표 단계"
                  className="park-growth__midgame-select"
                  value={stage}
                  disabled={claim.isPending}
                  onChange={(event) => {
                    const value = parseParkGrowthStage(event.target.value);
                    if (value !== undefined) onStageChange(value);
                  }}
                >
                  {Array.from(
                    { length: Math.max(currentStage, stage) - 4 },
                    (_, index) => index + 5,
                  ).map((step) => (
                    <option
                      key={step}
                      value={step}
                      disabled={step > currentStage && step !== stage}
                    >
                      파크 Lv.{step} → {step + 1}
                    </option>
                  ))}
                </select>
              </div>
              {state.unlocked && !achieved && (
                <>
                  <p>
                    {format(state.exp)} / {format(state.expForNextLevel)} XP
                  </p>
                  <progress
                    aria-label="파크 레벨 경험치"
                    value={state.exp}
                    max={Math.max(1, state.expForNextLevel)}
                  />
                </>
              )}
            </div>
            {!state.unlocked && (
              <p className="park-growth__detail">
                첫 스테고케라톱스를 받고 파크 Lv.{stage}에 도달하면 열려요.
              </p>
            )}
            {achieved && stage < LAST_PARK_GROWTH_STAGE && (
              <section
                className="park-growth__next"
                aria-label={`Lv.${state.targetLevel} 달성 후 이어 할 일`}
              >
                <Button onClick={() => onStageChange(currentParkGrowthStage(stage + 1))}>
                  Lv.{stage + 2} 성장 목표
                </Button>
              </section>
            )}
            {achieved && stage === LAST_PARK_GROWTH_STAGE && (
              <section className="park-growth__next" aria-label="Lv.15 달성 후 이어 할 일">
                <Link
                  className="park-growth__link"
                  to={`/exploration?${growthOriginParams(stage)}&mission=mission.mutation-crater.basic-mutation-cell.v1`}
                  onClick={actions.onClose}
                >
                  기초 변이세포 조사
                </Link>
                <Link
                  className="park-growth__link"
                  to={`/story?chapter=chapter-4&${growthOriginParams(stage)}`}
                  onClick={actions.onClose}
                >
                  4장 심연의 비밀
                </Link>
              </section>
            )}
            {notice && (
              <p role="status" className="park-growth__notice">
                {notice}
              </p>
            )}
            {claim.error && (
              <p role="alert" className="park-growth__notice park-growth__notice--error">
                {claim.error.message}
              </p>
            )}
            {state.unlocked && (
              <>
                {!achieved && (
                  <p className="park-growth__midgame-guide">
                    각 목표에서 조건 하나를 완료하면 경험치를 받을 수 있어요.
                  </p>
                )}
                <ul className="park-growth__goals" aria-label="레벨업 목표">
                  {state.goals.map((goal) => (
                    <li key={goal.id}>
                      <article
                        className="park-growth__midgame-goal"
                        aria-labelledby={`growth-goal-${goal.id}`}
                      >
                        <header className="park-growth__midgame-row">
                          <h3 id={`growth-goal-${goal.id}`}>{names[goal.id]}</h3>
                          {goal.status === 'claimable' ? (
                            <Button
                              disabled={claim.isPending}
                              onClick={() => {
                                setNotice('');
                                claim.mutate(
                                  { kind: 'claim', goalId: goal.id, stage },
                                  {
                                    onSuccess: () => setNotice(`${format(goal.xp)} XP를 받았어요.`),
                                  },
                                );
                              }}
                            >
                              {format(goal.xp)} XP 받기
                            </Button>
                          ) : (
                            <span className="park-growth__reward">
                              {goal.status === 'claimed' ? '보상 받음' : `${format(goal.xp)} XP`}
                            </span>
                          )}
                        </header>
                        <ul className="park-growth__midgame-alternatives">
                          {goal.alternatives.map((alternative) => (
                            <li key={alternative.label} className="park-growth__midgame-row">
                              <div>
                                <p>{alternative.label}</p>
                                {alternative.kind === 'paid' && (
                                  <small className="park-growth__detail">
                                    {format(goal.progress)} / {format(goal.target)}명
                                  </small>
                                )}
                              </div>
                              {(goal.status === 'incomplete' ||
                                alternative.status === 'complete') && (
                                <AlternativeAction
                                  alternative={alternative}
                                  stage={stage}
                                  eggSpecies={eggSpecies}
                                  actions={actions}
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                      </article>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
