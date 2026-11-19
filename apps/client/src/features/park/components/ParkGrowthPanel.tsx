import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PARK_LEVEL_SIX_CATALYST_MISSION_ID, type ParkGrowthResponse } from '@dino-park/shared';
import { useParkGrowth, useParkGrowthAction } from '@/api/queries/parkGrowth';
import { Button } from '@/components/ui';
import './ParkGrowthPanel.css';

type Goal = ParkGrowthResponse['goals'][number];

const goalLabels = {
  facility: { title: '시설 준비', requirement: 'DNA 연구소 Lv.1 완공' },
  research: { title: '연구 적용', requirement: '입장 수속 Lv.1 완료' },
  field: { title: '현장 발견', requirement: '폐연구소 기초 촉매 보상 수령' },
  operation: { title: '입장 실적', requirement: '누적 유료 입장객' },
} satisfies Record<Goal['id'], { title: string; requirement: string }>;

const formatNumber = (value: number) => value.toLocaleString('ko-KR');

interface Props {
  isParkOpen: boolean;
  onClose: () => void;
  onShowFacilities: () => void;
  onShowResources: () => void;
  onPrepareLab: () => void;
}

export default function ParkGrowthPanel({
  isParkOpen,
  onClose,
  onShowFacilities,
  onShowResources,
  onPrepareLab,
}: Props) {
  const query = useParkGrowth();
  const mutation = useParkGrowthAction();
  const state = query.data;
  const research = state?.research;
  const title = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now);
  const isResearchRunning = research?.status === 'running';
  const remainingSeconds = research?.completesAt
    ? Math.max(0, Math.ceil((Date.parse(research.completesAt) - now) / 1000))
    : 0;
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!isResearchRunning) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isResearchRunning]);

  const achieved = !!state && state.level >= state.targetLevel;
  const claimable = state?.goals.filter(({ status }) => status === 'claimable').length ?? 0;
  const claimed = state?.goals.filter(({ status }) => status === 'claimed').length ?? 0;
  const busy = mutation.isPending;

  const runAction = (action: Parameters<typeof mutation.mutate>[0]) => {
    setNotice('');
    mutation.mutate(action, {
      onSuccess: (updated) => {
        if (action.kind === 'start-research') {
          setNow(Date.now());
          setNotice('입장 수속 연구를 시작했어요.');
          return;
        }
        const goal = updated.goals.find((item) => item.id === action.goalId);
        if (achieved || updated.level < updated.targetLevel) {
          setNotice(goal ? `${formatNumber(goal.xp)} XP 보상을 받았어요.` : '보상을 받았어요.');
        }
      },
    });
  };

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
              보상 수령 {claimed}/{state.goals.length}
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
      <div className="park-growth__body">
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
          <p>첫 스테고케라톱스를 받은 뒤 성장 목표를 진행할 수 있어요.</p>
        )}
        {state?.unlocked && (
          <>
            <div className="park-growth__progress" aria-live="polite">
              <div>
                <h3>
                  {achieved
                    ? `파크 Lv.${state.targetLevel} 달성!`
                    : `파크 Lv.${state.level} → Lv.${state.targetLevel}`}
                </h3>
                {!achieved && (
                  <p>
                    {formatNumber(state.exp)} / {formatNumber(state.expForNextLevel)} XP
                  </p>
                )}
              </div>
              {!achieved && (
                <progress
                  aria-label="파크 레벨 경험치"
                  value={state.exp}
                  max={Math.max(1, state.expForNextLevel)}
                />
              )}
            </div>
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
                const label = goalLabels[goal.id];
                const reward = `${formatNumber(goal.xp)} XP`;
                return (
                  <li key={goal.id}>
                    <article
                      aria-labelledby={`park-growth-${goal.id}`}
                      className="park-growth__goal"
                    >
                      <div>
                        <h3 id={`park-growth-${goal.id}`}>{label.title}</h3>
                        <p>
                          {label.requirement}
                          {goal.id === 'operation' &&
                            ` ${formatNumber(goal.progress)} / ${formatNumber(goal.target)}명`}
                        </p>
                        {goal.id === 'research' && research && research.status !== 'locked' && (
                          <>
                            <p className="park-growth__detail">
                              {research.status === 'completed' ? '적용 중' : '완료 효과'} · 입구
                              분당 처리량 +{research.entranceBonusPercent}%
                            </p>
                            {isResearchRunning && (
                              <p className="park-growth__detail">
                                {remainingSeconds > 0
                                  ? `연구 중 · ${remainingSeconds}초 남음`
                                  : '연구 결과 확인 중'}
                              </p>
                            )}
                            {research.status === 'available' && (
                              <>
                                <p className="park-growth__detail">
                                  {formatNumber(research.costs.gold)}골드 · 목재{' '}
                                  {research.costs.wood}개 · 석재 {research.costs.stone}개 ·{' '}
                                  {research.durationSeconds}초
                                </p>
                                {research.unavailableReason && (
                                  <p className="park-growth__detail">
                                    {research.unavailableReason}
                                  </p>
                                )}
                              </>
                            )}
                          </>
                        )}
                        {goal.id === 'research' && research?.status === 'locked' && (
                          <p className="park-growth__detail">{research.unavailableReason}</p>
                        )}
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
                                시설 보기
                              </Button>
                            )}
                            {goal.id === 'research' &&
                              research?.status === 'available' &&
                              (research.unavailableReason ? (
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
                              ))}
                            {goal.id === 'research' && research?.status === 'locked' && (
                              <Button variant="outline" onClick={onPrepareLab}>
                                연구소 확인
                              </Button>
                            )}
                            {goal.id === 'field' && (
                              <Link
                                className="park-growth__link"
                                to={`/exploration?tab=drive&mission=${PARK_LEVEL_SIX_CATALYST_MISSION_ID}`}
                                onClick={onClose}
                              >
                                폐연구소로 가기
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
          </>
        )}
      </div>
    </section>
  );
}
