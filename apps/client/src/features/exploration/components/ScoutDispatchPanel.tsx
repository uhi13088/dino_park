import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDinosaurById,
  getParkMidgameGrowth,
  getScoutFuelCost,
  getTechnology,
  RESEARCH_LAB_ID,
  SCOUT_MISSIONS,
  SCOUT_REGIONS,
} from '@dino-park/game-data';
import {
  MATERIAL_QUALITY_LABELS,
  RESEARCH_MATERIAL_LABELS,
  scoutTravelSeconds,
  type ParkScout,
  type ScoutExpeditionState,
  type ScoutMission,
  type ScoutReward,
} from '@dino-park/shared';
import {
  type ScoutAction,
  useScoutAction,
  useScoutExpedition,
} from '@/api/queries/scoutExpedition';
import { Button } from '@/components/ui';
import { parseParkGrowthStage } from '@/utils/parkGrowthNavigation';
import ScoutTerrain, { regionPositions, spotPositions } from './ScoutTerrain';

type Selection = { regionId: string; spotId?: string; missionId?: string };
type MapContext = {
  requestedMission?: string | null;
  requestedSpot?: string | null;
  stage?: string | null;
  canSynthesize?: boolean;
  canRepeat?: boolean;
  showHatching?: boolean;
  growthReturnPath?: string;
  returnChapter?: string | null;
  storyReturnPath?: string;
  returnToHybridNotebook?: boolean;
};

const firstObjectives = [
  'first-iguanodon-v1',
  'trike',
  'stego',
  'dna1',
  'dna2',
  'culture',
  'catalyst',
];
const missionById = new Map<string, ScoutMission>(
  SCOUT_MISSIONS.map((mission) => [mission.id, mission]),
);
const materialNumber = new Intl.NumberFormat('ko-KR');

function locateMission(missionId?: string | null) {
  if (!missionId) return undefined;
  const id = missionById.has(missionId)
    ? missionId
    : SCOUT_MISSIONS.find((mission) => mission.legacyMissionId === missionId)?.id;
  if (!id) return undefined;
  for (const region of SCOUT_REGIONS) {
    const spot = region.spots.find((item) => item.missionIds.includes(id));
    if (spot) return { regionId: region.id, spotId: spot.id, missionId: id };
  }
  return undefined;
}

function locateAssignment(assignment?: ParkScout['assignment']) {
  if (!assignment) return undefined;
  const region = SCOUT_REGIONS.find(({ spots }) =>
    spots.some(({ id }) => id === assignment.spotId),
  );
  return region
    ? { regionId: region.id, spotId: assignment.spotId, missionId: assignment.missionId }
    : undefined;
}

function rewardLabel(reward: ScoutReward) {
  if (reward.type === 'egg')
    return `${getDinosaurById(reward.speciesId)?.nameKo ?? reward.speciesId} 알 1개`;
  return reward.items
    .map(
      ({ material, quality, amount }) =>
        `${MATERIAL_QUALITY_LABELS[quality]} ${RESEARCH_MATERIAL_LABELS[material]} ${amount}개`,
    )
    .join(' · ');
}

function gateLabel(gate: ScoutMission['gate']) {
  if (!gate) return '';
  return [
    gate.platform && '첫 관람대 완공',
    gate.iguanodon && '이구아노돈 부화 수령',
    gate.safety && '2장 안전 목표 완료',
    gate.firstHero && '첫 스테고케라톱스 수령',
    gate.parkLevel && `파크 Lv.${gate.parkLevel}`,
    gate.labLevel && `DNA 연구소 Lv.${gate.labLevel}`,
    gate.research && `${gate.research.name} Lv.${gate.research.level}`,
    gate.claimed?.map((id) => `${missionById.get(id)?.title ?? id} 보상 수령`).join(' · '),
    gate.registered && `${getDinosaurById(gate.registered)?.nameKo ?? gate.registered} 도감 등록`,
    gate.responseLevel && `탐험 대응 Lv.${gate.responseLevel}`,
    gate.afterExhibitionToRepeat && '재파견은 첫 스테고케라톱스 전시 후',
  ]
    .filter(Boolean)
    .join(' · ');
}

function formatTime(seconds: number) {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }
  if (seconds >= 60)
    return `${Math.floor(seconds / 60)}분${seconds % 60 ? ` ${seconds % 60}초` : ''}`;
  return `${seconds}초`;
}

function mapMarker(state: 'locked' | 'ready' | 'busy' | 'completed') {
  if (state === 'locked') return <path d="M5 9h10v7H5zM7 9V7a3 3 0 0 1 6 0v2" />;
  if (state === 'busy') return <path d="M10 4v6l3 2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />;
  if (state === 'completed') return <path d="m5 10 3 3 7-7" />;
  return <path d="M10 2 16 8l-6 10L4 8Zm-6 6h12M10 2v16" />;
}

function ScoutRoster({
  state,
  now,
  busy,
  onAction,
}: {
  state: ScoutExpeditionState;
  now: number;
  busy: boolean;
  onAction: (action: ScoutAction) => void;
}) {
  return (
    <section className="scout-roster" aria-label="탐험가 목록">
      {state.scouts.map((scout) => {
        const report = scout.assignment;
        const seconds = report
          ? Math.max(0, Math.ceil((Date.parse(report.readyAt) - now) / 1000))
          : 0;
        return (
          <div key={scout.id} className="scout-roster__row">
            <div>
              <strong>{scout.name}</strong>
              <small>
                탐색 Lv.{scout.searchLevel} · 기동 Lv.{scout.mobilityLevel} · 대응 Lv.
                {scout.responseLevel}
              </small>
            </div>
            {!report ? (
              <span className="scout-roster__status">대기 중</span>
            ) : seconds > 0 ? (
              <span
                className="scout-roster__status"
                aria-label={`${scout.name} 귀환까지 ${formatTime(seconds)}`}
              >
                귀환 {formatTime(seconds)}
              </span>
            ) : (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => onAction({ kind: 'claim', id: report.id })}
              >
                보고서 수령
              </Button>
            )}
            {report && (
              <small className="scout-roster__mission">
                {missionById.get(report.missionId)?.title ?? '원정'}
              </small>
            )}
          </div>
        );
      })}
      {state.hireDiamondCost !== null && (
        <div className="scout-roster__row scout-roster__hire">
          <span>
            {state.hireDiamondCost
              ? `다이아 ${materialNumber.format(state.hireDiamondCost)}`
              : '무료'}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !!state.hireBlockedReason || state.diamond < state.hireDiamondCost}
            onClick={() => onAction({ kind: 'hire', request: { slot: state.scouts.length + 1 } })}
          >
            탐험가 고용
          </Button>
          {state.hireBlockedReason && (
            <small className="scout-roster__mission">{state.hireBlockedReason}</small>
          )}
        </div>
      )}
    </section>
  );
}

function ScoutBoard({
  state,
  refreshedAt,
  requestedMission,
  requestedSpot,
  stage,
  canSynthesize,
  canRepeat,
  showHatching,
  growthReturnPath,
  returnChapter,
  storyReturnPath,
  returnToHybridNotebook,
  busy,
  onAction,
}: MapContext & {
  state: ScoutExpeditionState;
  refreshedAt: number;
  busy: boolean;
  onAction: (action: ScoutAction) => void;
}) {
  const [selection, setSelection] = useState<Selection>();
  const [showWorld, setShowWorld] = useState(false);
  const mapToggle = useRef<HTMLButtonElement>(null);
  const [chosenScoutId, setChosenScoutId] = useState<string>();
  const [clock, setClock] = useState(Date.now);
  const assignments = state.scouts.flatMap(({ assignment }) => assignment ?? []);
  const hasAssignment = assignments.length > 0;
  useEffect(() => {
    if (!hasAssignment) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasAssignment]);
  const now = Date.parse(state.serverNow) + Math.max(0, clock - refreshedAt);
  const isUnlocked = (id: string) => !!state.missions[id] && !state.missions[id].blockedReason;
  const exactSpot =
    requestedSpot && requestedMission
      ? SCOUT_REGIONS.find(({ spots }) =>
          spots.some(
            ({ id, missionIds }) => id === requestedSpot && missionIds.includes(requestedMission),
          ),
        )
      : undefined;
  const focus =
    selection ??
    (exactSpot && requestedSpot && requestedMission
      ? { regionId: exactSpot.id, spotId: requestedSpot, missionId: requestedMission }
      : undefined) ??
    locateMission(requestedMission) ??
    locateAssignment(assignments[0]) ??
    locateMission(firstObjectives.find(isUnlocked));
  const region = SCOUT_REGIONS.find(({ id }) => id === focus?.regionId) ?? SCOUT_REGIONS[0];
  const spot = region.spots.find(({ id }) => id === focus?.spotId) ?? region.spots[0];
  const missions = spot.missionIds
    .map((id) => missionById.get(id))
    .filter((mission) => mission !== undefined);
  const mission =
    missions.find(({ id }) => focus?.missionId === id) ??
    missions.find(({ id }) => isUnlocked(id)) ??
    missions[0];
  const readyScouts = state.scouts.filter((scout) => !scout.assignment);
  const requiredResponse = mission?.gate?.responseLevel ?? 1;
  const eligibleScouts = readyScouts.filter(
    ({ responseLevel }) => responseLevel >= requiredResponse,
  );
  const scout: ParkScout | undefined =
    eligibleScouts.find(({ id }) => id === chosenScoutId) ?? eligibleScouts[0];
  const reason =
    mission &&
    (state.missions[mission.id]?.blockedReason ||
      (!state.missions[mission.id] && '목표 정보를 불러오지 못했어요.'));
  const fuelCost = mission ? getScoutFuelCost(spot.id, mission.id) : 0;
  const canPay = mission && state.gold >= mission.gold && (!fuelCost || state.fuel >= fuelCost);
  const conditions = gateLabel(mission?.gate);
  const growthStage = parseParkGrowthStage(stage ?? null);
  const researchParams = new URLSearchParams(mission ? { mission: mission.id, spot: spot.id } : {});
  if (growthStage !== undefined) researchParams.set('stage', String(growthStage));
  if (growthReturnPath) researchParams.set('from', 'growth');
  if (returnToHybridNotebook) researchParams.set('returnTo', 'hybrid-notebook');
  if (returnChapter) researchParams.set('returnChapter', returnChapter);
  const researchPath = (params?: Record<string, string>) => {
    const path = new URLSearchParams(researchParams);
    if (params) for (const [key, value] of Object.entries(params)) path.set(key, value);
    const query = path.toString();
    return query ? `/research?${query}` : '/research';
  };
  const blocker = mission && state.missions[mission.id]?.blocker;
  const gateAction =
    blocker?.kind === 'research'
      ? {
          to: researchPath({ technology: blocker.technologyId, level: String(blocker.level) }),
          label: `${getTechnology(blocker.technologyId)?.name ?? '필요 연구'} 보기`,
        }
      : blocker?.kind === 'lab'
        ? {
            to: researchPath({ facility: RESEARCH_LAB_ID, level: String(blocker.level) }),
            label: `연구소 Lv.${blocker.level} 준비`,
          }
        : blocker?.kind === 'park'
          ? { to: '/park?panel=growth', label: '성장 목표 보기' }
          : null;
  const lastReport = state.lastReport;
  const midgame = growthStage === undefined ? undefined : getParkMidgameGrowth(growthStage);
  const growthReport =
    !!growthReturnPath &&
    !!lastReport &&
    !!requestedMission &&
    (lastReport.missionId === requestedMission ||
      missionById.get(lastReport.missionId)?.legacyMissionId === requestedMission) &&
    (!midgame ||
      midgame.goals.some(({ alternatives }) =>
        alternatives.some(
          (condition) =>
            condition.kind === 'dispatch' && condition.missionId === lastReport.missionId,
        ),
      ));
  const openRegion = (regionId: string) => {
    if (regionId !== region.id) setSelection({ regionId });
    setShowWorld(false);
    mapToggle.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <div className={showWorld ? 'scout-board scout-board--atlas' : 'scout-board'}>
        <section
          className={showWorld ? 'scout-map scout-map--atlas' : 'scout-map'}
          aria-label={showWorld ? '전체 지도' : `${region.name} 탐험 지도`}
        >
          <ScoutTerrain regionId={showWorld ? 'overworld' : region.id} />
          <div className="scout-map__bar">
            <div className="scout-map__navigation">
              <button
                ref={mapToggle}
                type="button"
                className="scout-map__view"
                aria-expanded={showWorld}
                aria-controls="scout-map-pins"
                onClick={() => setShowWorld((show) => !show)}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="7" />
                  <path d="M3 10h14M10 3c-4 4-4 10 0 14 4-4 4-10 0-14Z" />
                </svg>
                {showWorld ? '지역 지도' : '전체 지도'}
              </button>
              {!showWorld && (
                <select
                  aria-label="탐험 지역"
                  value={region.id}
                  onChange={(event) => setSelection({ regionId: event.target.value })}
                >
                  <optgroup label="공룡 발견">
                    {SCOUT_REGIONS.filter(({ type }) => type === 'discovery').map(
                      ({ id, name }) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ),
                    )}
                  </optgroup>
                  <optgroup label="재료 조사">
                    {SCOUT_REGIONS.filter(({ type }) => type === 'material').map(({ id, name }) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              )}
            </div>
            <div className="scout-map__balance">
              <span aria-label={`${materialNumber.format(state.gold)}골드`}>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="7" />
                  <path d="M8 12.5h3a1.2 1.2 0 1 0 0-2.4H9a1.2 1.2 0 1 1 0-2.4h3M10 6v8" />
                </svg>
                {materialNumber.format(state.gold)}
              </span>
              {fuelCost > 0 && mission && (
                <Link
                  className="scout-map__fuel"
                  to={`/park?${new URLSearchParams({
                    panel: 'resources',
                    tab: 'fuel',
                    mission: mission.id,
                    spot: spot.id,
                  })}`}
                  aria-label={`연료 ${state.fuel}/${state.fuelMax} · 보급소 열기`}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M5 5h8v11H5zM7 3h4M7 8l4 4m0-4-4 4m6-6 2-1v6l-2 2" />
                  </svg>
                  {state.fuel}/{state.fuelMax}
                </Link>
              )}
            </div>
          </div>
          {showWorld ? (
            <div
              id="scout-map-pins"
              className="scout-map__pinfield scout-map__pinfield--world"
              role="group"
              aria-label="탐험 지역 지도"
            >
              {SCOUT_REGIONS.map((item) => {
                const [left, top] = regionPositions[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="scout-map__spot scout-map__region"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    aria-current={item.id === region.id ? 'location' : undefined}
                    onClick={() => openRegion(item.id)}
                  >
                    <span className="scout-map__marker">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        {item.type === 'discovery' ? (
                          <path d="M15 8c0 3-5 8-5 8s-5-5-5-8a5 5 0 0 1 10 0Zm-3 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
                        ) : (
                          <path d="m10 3 6 4v6l-6 4-6-4V7Zm0 5v9m-6-10 6 3 6-3" />
                        )}
                      </svg>
                    </span>
                    <span className="scout-map__spot-label">
                      <span className="scout-map__spot-name">{item.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              id="scout-map-pins"
              className="scout-map__pinfield"
              role="group"
              aria-label={`${region.name} 스팟`}
            >
              {region.spots.map((item, index) => {
                const [left, top] = spotPositions[index];
                const status = assignments.some(({ spotId }) => spotId === item.id)
                  ? 'busy'
                  : item.missionIds.some(isUnlocked)
                    ? 'ready'
                    : lastReport?.spotId === item.id
                      ? 'completed'
                      : 'locked';
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="scout-map__spot"
                    data-state={status}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    aria-pressed={item.id === spot.id}
                    aria-label={`${item.name}, 별 ${item.stars}개${status === 'locked' ? ', 잠김' : ''}`}
                    onClick={() => setSelection({ regionId: region.id, spotId: item.id })}
                  >
                    <span className="scout-map__marker">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.55"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        {mapMarker(status)}
                      </svg>
                    </span>
                    <span className="scout-map__spot-label">
                      <span className="scout-map__spot-name">{item.name}</span>
                      <span className="scout-map__spot-score" aria-hidden="true">
                        ★{item.stars}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <nav className="scout-map__links" aria-label="탐험 이동">
            <Link to="/park" aria-label="파크로">
              파크
            </Link>
            <Link to={researchPath()}>연구</Link>
            {showHatching && <a href="#expedition-hatching">부화</a>}
            {canSynthesize && <Link to="/exploration?tab=synthesis">첫 합성</Link>}
            {canRepeat && <Link to="/exploration?tab=repeat">반복 합성</Link>}
            {growthReturnPath && (
              <Link to={growthReturnPath} aria-label="성장 목표로 돌아가기">
                성장 목표
              </Link>
            )}
            {storyReturnPath && <Link to={storyReturnPath}>스토리</Link>}
            {returnToHybridNotebook && <Link to="/research/hybrids?tab=notes">연구 노트</Link>}
          </nav>
        </section>
        {!showWorld && (
          <section className="scout-brief" aria-labelledby="scout-spot-title">
            {lastReport && (
              <p className="scout-brief__report" role="status">
                <strong>귀환 보고서</strong> · {rewardLabel(lastReport.reward)}
                {lastReport.reward.type === 'egg' && (
                  <>
                    {' '}
                    · <a href="#expedition-hatching">부화 확인</a>
                  </>
                )}
                {growthReport && ' · 성장 목표 반영'}
              </p>
            )}
            <div className="scout-brief__details">
              <header className="scout-brief__location">
                <h2 id="scout-spot-title">{spot.name}</h2>
                <span className="scout-brief__stars" aria-label={`난도 별 ${spot.stars}개`}>
                  {'★'.repeat(spot.stars)}
                </span>
              </header>
              {mission && (
                <>
                  {missions.length > 1 && (
                    <label className="scout-brief__select">
                      조사 목표
                      <select
                        value={mission.id}
                        onChange={(event) =>
                          setSelection({
                            regionId: region.id,
                            spotId: spot.id,
                            missionId: event.target.value,
                          })
                        }
                      >
                        {missions.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <p className="scout-brief__reward">
                    {mission.reward.type === 'materials' && <span>기본 보상 · </span>}
                    {rewardLabel(mission.reward)}
                  </p>
                  <p className="scout-brief__meta">
                    {materialNumber.format(mission.gold)}골드
                    {fuelCost > 0 && ` · 연료 ${fuelCost}`}
                    {' · '}
                    <strong>
                      {formatTime(scoutTravelSeconds(mission.seconds, scout?.mobilityLevel ?? 1))}
                    </strong>
                  </p>
                  {reason && (
                    <p className="scout-brief__note" id="scout-dispatch-reason">
                      {reason}
                    </p>
                  )}
                  {!reason && !canPay && (
                    <p className="scout-brief__note" id="scout-dispatch-reason">
                      {state.gold < mission.gold ? '골드가 부족해요.' : '연료가 부족해요.'}
                    </p>
                  )}
                  <div className="scout-brief__actions">
                    {!reason && eligibleScouts.length > 1 && (
                      <select
                        aria-label="파견할 탐험가"
                        value={scout?.id ?? ''}
                        onChange={(event) => setChosenScoutId(event.target.value)}
                      >
                        {eligibleScouts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {gateAction && reason ? (
                      <Link to={gateAction.to}>{gateAction.label}</Link>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy || !!reason || !canPay || !scout}
                        aria-describedby={reason || !canPay ? 'scout-dispatch-reason' : undefined}
                        onClick={() => {
                          if (scout)
                            onAction({
                              kind: 'dispatch',
                              request: {
                                scoutId: scout.id,
                                spotId: spot.id,
                                missionId: mission.id,
                              },
                            });
                        }}
                      >
                        탐험가 파견
                      </Button>
                    )}
                    {!reason && canPay && !scout && (
                      <span className="scout-brief__meta">
                        {readyScouts.length > 0
                          ? `대응 Lv.${requiredResponse} 탐험가가 돌아오면 파견할 수 있어요.`
                          : '대기 중인 탐험가가 없어요.'}
                      </span>
                    )}
                  </div>
                  {conditions && (
                    <details className="scout-brief__conditions" key={mission.id}>
                      <summary>파견 조건</summary>
                      <p>{conditions}</p>
                    </details>
                  )}
                </>
              )}
            </div>
            <ScoutRoster state={state} now={now} busy={busy} onAction={onAction} />
          </section>
        )}
      </div>
    </>
  );
}

export default function ScoutDispatchPanel(context: MapContext) {
  const query = useScoutExpedition();
  const action = useScoutAction();
  const [error, setError] = useState<string | null>(null);
  const state = query.data;
  const send = (request: ScoutAction) => {
    setError(null);
    action.mutate(request, { onError: (cause) => setError(cause.message) });
  };
  return (
    <section aria-label="탐험가 파견">
      {(error || query.error) && (
        <div className="first-expedition__error" role="alert">
          <p>{error ?? query.error?.message}</p>
          {query.error && <Button onClick={() => void query.refetch()}>다시 불러오기</Button>}
        </div>
      )}
      {state ? (
        <ScoutBoard
          key={`${context.requestedMission ?? 'map'}|${context.requestedSpot ?? ''}`}
          state={state}
          refreshedAt={query.dataUpdatedAt}
          {...context}
          busy={action.isPending}
          onAction={send}
        />
      ) : (
        query.isPending && <p role="status">탐험 지도를 불러오고 있어요…</p>
      )}
    </section>
  );
}
