import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EARLY_DRIVE_MISSIONS, PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION } from '@dino-park/game-data';
import {
  PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
  type DriveMissionId,
  type ParkGrowthRouteId,
  type ParkGrowthRoutes,
} from '@dino-park/shared';
import { Button } from '@/components/ui';

const routeNames = { operations: '운영', exploration: '탐험' } as const;
const missionTitles = new Map(
  [...EARLY_DRIVE_MISSIONS, PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION].map(({ id, title }) => [
    id,
    title,
  ]),
);
const stageRequirements: Record<6 | 7, DriveMissionId[][]> = {
  6: [['dna1', 'dna2'], ['culture']],
  7: [[PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID], ['dna1'], ['dna2'], ['culture'], ['catalyst']],
};

interface Props {
  stage: 6 | 7;
  routes: ParkGrowthRoutes;
  researchDetail?: ReactNode;
  sharedResearchReceived: boolean;
  busy: boolean;
  isParkOpen: boolean;
  onShowExhibits: () => void;
  onClose: () => void;
  onClaim: (routeId: ParkGrowthRouteId) => void;
}

export default function ParkGrowthRoutesPanel({
  stage,
  routes,
  researchDetail,
  sharedResearchReceived,
  busy,
  isParkOpen,
  onShowExhibits,
  onClose,
  onClaim,
}: Props) {
  const { operations, exploration, claimedRoute } = routes;
  const completed = new Set(exploration.completedMissions);
  const needsResearch = stage === 7 && !exploration.researchCompleted;

  const claimButton = (routeId: ParkGrowthRouteId) => {
    const name = routeNames[routeId];
    if (claimedRoute === routeId)
      return <p className="park-growth__reward">{name} 성과 보상 받음</p>;
    if (claimedRoute || routes.rewardXp === 0) return null;
    if (routes[routeId].status !== 'claimable' || !sharedResearchReceived) return null;
    return (
      <Button type="button" disabled={busy} onClick={() => onClaim(routeId)}>
        {name} 성과 {routes.rewardXp.toLocaleString('ko-KR')} XP 받기
      </Button>
    );
  };

  return (
    <section className="park-growth__routes" aria-label="성장 경로">
      <p className="park-growth__routes-guide">
        {claimedRoute
          ? `${routeNames[claimedRoute]} 성과 보상을 받았어요. 두 경로의 활동은 계속할 수 있어요.`
          : routes.rewardXp > 0
            ? `운영·탐험 중 한 경로를 완료하면 ${routes.rewardXp.toLocaleString('ko-KR')} XP를 받을 수 있어요.`
            : '이 단계의 성장 보상을 모두 받았어요. 두 경로의 활동은 계속할 수 있어요.'}
      </p>
      {!sharedResearchReceived && routes.rewardXp > 0 && (
        <p className="park-growth__detail">
          환경 적응 연구 보상을 받으면 경로 보상을 받을 수 있어요.
        </p>
      )}
      <div className="park-growth__route-list">
        <article className="park-growth__route" aria-labelledby="park-growth-route-operations">
          <h3 id="park-growth-route-operations">운영 경로</h3>
          <p className="park-growth__detail">공룡을 배치하고 관람길을 연결하면 전시가 열려요.</p>
          <dl className="park-growth__route-counts">
            <div>
              <dt>연결된 운영 전시</dt>
              <dd>
                {operations.exhibits} / {operations.targetExhibits}곳
              </dd>
            </div>
            <div>
              <dt>동시 관람객</dt>
              <dd>
                {operations.visitors.toLocaleString('ko-KR')} / {operations.targetVisitors}명
              </dd>
            </div>
          </dl>
          {operations.achieved && <p className="park-growth__reward">운영 조건 달성</p>}
          <div className="park-growth__route-actions">
            {claimButton('operations')}
            {isParkOpen ? (
              <Button variant="outline" onClick={onShowExhibits}>
                전시 구역 관리
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>
                파크 운영 보기
              </Button>
            )}
          </div>
        </article>
        <article className="park-growth__route" aria-labelledby="park-growth-route-exploration">
          <h3 id="park-growth-route-exploration">탐험 경로</h3>
          <p className="park-growth__detail">
            첫 스테고케라톱스 전시 이후에 완료한 원정 보상을 받으세요.
          </p>
          {researchDetail}
          <ul className="park-growth__mission-steps">
            {stageRequirements[stage].map((group) => {
              const unavailable =
                needsResearch && group.includes(PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID);
              return (
                <li key={group[0]} className="park-growth__mission-step">
                  {group.length > 1 && (
                    <p className="park-growth__detail">중급 DNA 조사 중 한 곳</p>
                  )}
                  {group.map((id) => (
                    <div key={id} className="park-growth__mission-row">
                      {unavailable ? (
                        <p>{missionTitles.get(id)} · 지도화 연구 필요</p>
                      ) : (
                        <Link to={`/exploration?mission=${id}&stage=${stage}`} onClick={onClose}>
                          {missionTitles.get(id)}
                        </Link>
                      )}
                      {completed.has(id) && <p className="park-growth__reward">수령 완료</p>}
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
          <div className="park-growth__route-actions">{claimButton('exploration')}</div>
        </article>
      </div>
    </section>
  );
}
