import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getTechnology,
  GOLD_VAULT_ID,
  RESEARCH_LAB_ID,
  RESEARCH_STORAGE_ID,
} from '@dino-park/game-data';
import type {
  ResearchCosts,
  ResearchFacilityState,
  ResearchStateResponse,
  ResearchTechnologyState,
} from '@dino-park/shared';
import { useCompleteBuilding, useUpgradeBuilding } from '@/api';
import { useResearch, useStartTechnologyResearch } from '@/api/queries/research';
import { Button } from '@/components/ui';
import { useAuthStore, useGameStore, useUIStore } from '@/stores';
import {
  parkGrowthHref,
  parseParkGrowthStage,
  storyReturnHref,
} from '@/utils/parkGrowthNavigation';
import './ResearchPage.css';

const families = { ops: '운영', care: '사육', exp: '탐험', gene: '유전' };
type Family = keyof typeof families;
const compact = new Intl.NumberFormat('ko-KR');
const materials = { wood: '목재', stone: '석재', metal: '금속' } as const;
type MaterialKey = keyof typeof materials;
const materialKeys = Object.keys(materials) as MaterialKey[];

function capacityFacility(costs: ResearchCosts, state: ResearchStateResponse) {
  if (costs.gold > state.goldCapacity) return GOLD_VAULT_ID;
  if (materialKeys.some((key) => costs[key] > state.capacityPerMaterial))
    return RESEARCH_STORAGE_ID;
  return null;
}

function facilityEffect(typeId: string, effect: number) {
  if (typeId === RESEARCH_LAB_ID)
    return effect ? `기술 연구 시간 ${effect}% 단축` : '기술 연구 가능';
  if (typeId === GOLD_VAULT_ID) return `골드 한도 ${compact.format(effect)}`;
  return `자원별 보관 한도 ${compact.format(effect)}개`;
}

function duration(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days}일${hours ? ` ${hours}시간` : ''}`;
  if (hours) return `${hours}시간${minutes ? ` ${minutes}분` : ''}`;
  return minutes ? `${minutes}분${seconds % 60 ? ` ${seconds % 60}초` : ''}` : `${seconds}초`;
}

function timeUntil(end: string, now: number) {
  return Math.max(0, Math.ceil((Date.parse(end) - now) / 1000));
}

function CostLine({ costs }: { costs: ResearchCosts }) {
  return (
    <p className="research-page__costs">
      {[
        costs.gold > 0 ? `${compact.format(costs.gold)}골드` : '',
        ...materialKeys.map((key) =>
          costs[key] ? `${materials[key]} ${compact.format(costs[key])}개` : '',
        ),
      ]
        .filter(Boolean)
        .join(' · ') || '비용 없음'}
    </p>
  );
}

function ResearchQueue({ queue, now }: { queue: ResearchStateResponse['queue']; now: number }) {
  return (
    <section className="research-page__queue" aria-label="연구원 현황">
      <strong>
        연구원 {queue.jobs.length}/{queue.capacity}
      </strong>
      {queue.jobs.map((job) => {
        const remaining = timeUntil(job.completesAt, now);
        return (
          <span key={job.technologyId}>
            {job.name} Lv.{job.level} · {remaining ? duration(remaining) : '완료 확인 중'}
          </span>
        );
      })}
    </section>
  );
}

function TechnologyDetail({
  technology,
  state,
  requestedRank,
  busy,
  onSelectTech,
  onSelectFacility,
  onStart,
  onResources,
}: {
  technology: ResearchTechnologyState;
  state: ResearchStateResponse;
  requestedRank: number;
  busy: boolean;
  onSelectTech: (id: string, level?: number) => void;
  onSelectFacility: (id: string, level?: number) => void;
  onStart: (id: string, level: number) => void;
  onResources: () => void;
}) {
  const { next, completedLevel, prerequisites } = technology;
  const job = state.queue.jobs.find(({ technologyId }) => technologyId === technology.id);
  const lab = state.facilities.find(({ typeId }) => typeId === RESEARCH_LAB_ID);
  const completed = requestedRank > 0 && completedLevel >= requestedRank;
  const missingPrerequisite = prerequisites.find(
    ({ completedLevel, level }) => completedLevel < level,
  );
  const description = getTechnology(technology.id)?.description;
  const action = () => {
    if (!next || job || !technology.connected) return null;
    if (next.labLevel > (lab?.completedLevel ?? 0))
      return (
        <button
          type="button"
          className="research-page__route"
          onClick={() => onSelectFacility(RESEARCH_LAB_ID, next.labLevel)}
        >
          연구소 Lv.{next.labLevel} 준비
        </button>
      );
    if (missingPrerequisite)
      return (
        <button
          type="button"
          className="research-page__route"
          onClick={() => onSelectTech(missingPrerequisite.technologyId, missingPrerequisite.level)}
        >
          선행 연구 보기
        </button>
      );
    const neededFacility = capacityFacility(next.costs, state);
    if (neededFacility === GOLD_VAULT_ID)
      return (
        <button
          type="button"
          className="research-page__route"
          onClick={() => onSelectFacility(GOLD_VAULT_ID)}
        >
          금고 한도 늘리기
        </button>
      );
    if (neededFacility === RESEARCH_STORAGE_ID)
      return (
        <button
          type="button"
          className="research-page__route"
          onClick={() => onSelectFacility(RESEARCH_STORAGE_ID)}
        >
          자원 창고 한도 늘리기
        </button>
      );
    if (
      next.costs.gold > state.gold ||
      materialKeys.some((key) => next.costs[key] > state.stock[key])
    )
      return (
        <Link to="/park" className="research-page__route" onClick={onResources}>
          파크 자원 보기
        </Link>
      );
    return (
      <Button
        disabled={busy || !!next.unavailableReason}
        onClick={() => onStart(technology.id, next.level)}
      >
        Lv.{next.level} 연구 시작
      </Button>
    );
  };
  const availableAction = action();
  return (
    <article className="research-page__brief" aria-labelledby="research-decision-title">
      <h2 id="research-decision-title">{technology.name}</h2>
      <ol className="research-page__ranks" aria-label="완료 수준">
        {Array.from({ length: technology.maxLevel }, (_, index) => index + 1).map((level) => (
          <li
            key={level}
            data-complete={completedLevel >= level}
            aria-current={requestedRank === level ? 'step' : undefined}
          >
            Lv.{level}
          </li>
        ))}
      </ol>
      {completed && (
        <p role="status" className="research-page__success">
          탐험에 필요한 Lv.{requestedRank} 연구를 마쳤어요.
        </p>
      )}
      {job ? (
        <p className="research-page__state">Lv.{job.level} 연구 중</p>
      ) : !next ? (
        <p className="research-page__state">모든 단계 완료</p>
      ) : (
        <div className="research-page__requirement">
          <strong>
            다음 단계 Lv.{next.level} · {duration(next.durationSeconds)}
          </strong>
          <CostLine costs={next.costs} />
          <p>
            DNA 연구소 Lv.{next.labLevel}
            {next.afterFirstHero ? ' · 첫 스테고케라톱스 수령' : ''}
          </p>
          {next.unavailableReason && (
            <p className="research-page__reason">{next.unavailableReason}</p>
          )}
          {!technology.connected && <p className="research-page__reason">게임 적용 준비 중</p>}
        </div>
      )}
      {availableAction && <div className="research-page__actions">{availableAction}</div>}
      {!!prerequisites.length && (
        <section className="research-page__prereqs" aria-label="선행 연구">
          <h3>선행 연구</h3>
          {prerequisites.map((node) => (
            <button
              key={node.technologyId}
              type="button"
              onClick={() => onSelectTech(node.technologyId, node.level)}
            >
              {node.name} Lv.{node.level}{' '}
              <span>{node.completedLevel >= node.level ? '완료' : '보기'}</span>
            </button>
          ))}
        </section>
      )}
      {description && <p className="research-page__description">{description}</p>}
    </article>
  );
}

function FacilityDetail({
  facility,
  state,
  now,
  requestedRank,
  busy,
  onBuild,
  onUpgrade,
  onComplete,
  onSelectTech,
  onSelectFacility,
}: {
  facility: ResearchFacilityState;
  state: ResearchStateResponse;
  now: number;
  requestedRank: number;
  busy: boolean;
  onBuild: (typeId: string) => void;
  onUpgrade: (id: string, targetLevel: number) => void;
  onComplete: (id: string) => void;
  onSelectTech: (id: string, level: number) => void;
  onSelectFacility: (id: string) => void;
}) {
  const { next, building, completedLevel } = facility;
  const neededFacility = next && capacityFacility(next.costs, state);
  const prerequisite = next?.prerequisite;
  const underConstruction =
    building?.completesAt && ['CONSTRUCTING', 'UPGRADING'].includes(building.status.toUpperCase());
  const seconds =
    underConstruction && building.completesAt ? timeUntil(building.completesAt, now) : null;
  return (
    <article className="research-page__brief" aria-labelledby="research-decision-title">
      <h2 id="research-decision-title">{facility.name}</h2>
      <p className="research-page__state">
        {completedLevel
          ? `Lv.${completedLevel} · ${facilityEffect(facility.typeId, facility.effect)}`
          : '건설 대기'}
      </p>
      {requestedRank > completedLevel && (
        <p className="research-page__state">필요 Lv.{requestedRank}</p>
      )}
      {building && seconds !== null ? (
        <div className="research-page__requirement">
          <strong>{seconds > 0 ? `공사 완료까지 ${duration(seconds)}` : '공사가 끝났어요'}</strong>
          {!seconds && (
            <div className="research-page__actions">
              <Button disabled={busy} onClick={() => onComplete(building.id)}>
                완공 확인
              </Button>
            </div>
          )}
        </div>
      ) : next ? (
        <>
          <div className="research-page__requirement">
            <strong>
              Lv.{next.level} · {duration(next.durationSeconds)}
            </strong>
            <CostLine costs={next.costs} />
            <p>
              파크 Lv.{next.parkLevel} · {facilityEffect(facility.typeId, next.effect)}
            </p>
            {next.unavailableReason && (
              <p className="research-page__reason">{next.unavailableReason}</p>
            )}
          </div>
          <div className="research-page__actions">
            {prerequisite && prerequisite.completedLevel < prerequisite.level && (
              <button
                type="button"
                className="research-page__route"
                onClick={() => onSelectTech(prerequisite.technologyId, prerequisite.level)}
              >
                {prerequisite.name} Lv.{prerequisite.level} 보기
              </button>
            )}
            {neededFacility && neededFacility !== facility.typeId && (
              <button
                type="button"
                className="research-page__route"
                onClick={() => onSelectFacility(neededFacility)}
              >
                {neededFacility === GOLD_VAULT_ID ? '금고 한도 늘리기' : '자원 창고 한도 늘리기'}
              </button>
            )}
            <Button
              disabled={busy || !!next.unavailableReason}
              onClick={() =>
                building ? onUpgrade(building.id, next.level) : onBuild(facility.typeId)
              }
            >
              {building ? `Lv.${next.level} 강화` : '파크에 건설 배치'}
            </Button>
          </div>
        </>
      ) : (
        <p className="research-page__state">최고 레벨</p>
      )}
    </article>
  );
}

export default function ResearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const { startPlacement } = useGameStore();
  const { closeModal, closeSidePanel, openSidePanel } = useUIStore();
  const query = useResearch();
  const start = useStartTechnologyResearch();
  const upgrade = useUpgradeBuilding();
  const complete = useCompleteBuilding();
  const [clock, setClock] = useState(Date.now);
  const [error, setError] = useState<string>();
  const state = query.data;
  const shouldTick =
    !!state?.queue.jobs.length || !!state?.facilities.some(({ building }) => building?.completesAt);
  useEffect(() => {
    if (!shouldTick) return;
    const handle = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, [shouldTick]);

  if (!authenticated) return <Navigate to="/" replace />;
  const returnParams = new URLSearchParams();
  for (const key of ['mission', 'spot', 'stage', 'from', 'returnChapter', 'returnTo']) {
    const value = params.get(key);
    if (value) returnParams.set(key, value);
  }
  const hasReturn = returnParams.has('mission');
  const returnChapter = returnParams.get('returnChapter');
  const fromGrowth = returnParams.get('from') === 'growth';
  const originStage = parseParkGrowthStage(returnParams.get('stage'));
  const backPath = hasReturn
    ? `/exploration?${returnParams}`
    : returnChapter
      ? storyReturnHref(returnChapter, originStage)
      : fromGrowth
        ? parkGrowthHref(originStage)
        : '/park';
  const backLabel = hasReturn
    ? '← 탐험으로'
    : returnChapter
      ? '← 스토리로'
      : fromGrowth
        ? '← 성장 목표'
        : '← 파크로';
  const researchId = params.get('technology');
  const facilityId = params.get('facility');
  const requestedRank = Number(params.get('level') ?? 0);
  const family = params.get('family') as Family | null;
  const selection = state?.technologies.find(({ id }) => id === researchId);
  const currentFamily =
    selection?.family ?? (family && Object.hasOwn(families, family) ? family : 'exp');
  const technologies =
    state?.technologies.filter(({ family: itemFamily }) => itemFamily === currentFamily) ?? [];
  const technology =
    selection ?? technologies.find(({ connected }) => connected) ?? technologies[0];
  const facility =
    state?.facilities.find(({ typeId }) => typeId === facilityId) ?? state?.facilities[0];
  const now = state
    ? Date.parse(state.serverNow) + Math.max(0, clock - query.dataUpdatedAt)
    : clock;
  const busy = start.isPending || upgrade.isPending || complete.isPending;
  const pick = (key: 'technology' | 'facility' | 'family', id: string, rank?: number) => {
    const next = new URLSearchParams(returnParams);
    next.set(key, id);
    if (rank) next.set('level', String(rank));
    setError(undefined);
    setParams(next, { replace: true });
  };
  const act = async (request: () => Promise<unknown>) => {
    setError(undefined);
    try {
      await request();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '진행을 저장하지 못했어요.');
    }
  };

  return (
    <div className="research-page">
      <header className="research-page__header">
        <Link to={backPath}>{backLabel}</Link>
        <h1>DNA 연구소</h1>
        {state && <span>파크 Lv.{state.parkLevel}</span>}
        <Link className="research-page__hybrid" to="/research/hybrids">
          실험 합성
        </Link>
      </header>
      {(error || query.error) && (
        <p className="research-page__error" role="alert">
          {error ?? query.error?.message}{' '}
          {query.error && (
            <button type="button" onClick={() => void query.refetch()}>
              다시 불러오기
            </button>
          )}
        </p>
      )}
      {!state ? (
        !query.error && (
          <p role="status" className="research-page__error">
            연구를 불러오고 있어요…
          </p>
        )
      ) : (
        <>
          <nav className="research-page__families" aria-label="연구 계열">
            {Object.entries(families).map(([key, name]) => (
              <button
                key={key}
                type="button"
                aria-pressed={!facilityId && currentFamily === key}
                onClick={() => pick('family', key)}
              >
                {name}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={!!facilityId}
              onClick={() => pick('facility', RESEARCH_LAB_ID)}
            >
              시설
            </button>
          </nav>
          <ResearchQueue queue={state.queue} now={now} />
          <div className="research-page__body">
            {facilityId ? (
              <>
                <div className="research-page__list" aria-label="연구 시설">
                  {state.facilities.map((item) => (
                    <button
                      key={item.typeId}
                      type="button"
                      aria-pressed={facility?.typeId === item.typeId}
                      onClick={() => pick('facility', item.typeId)}
                    >
                      <span>{item.name}</span>
                      <span>{item.completedLevel ? `Lv.${item.completedLevel}` : '미건설'}</span>
                    </button>
                  ))}
                </div>
                {facility && (
                  <FacilityDetail
                    facility={facility}
                    state={state}
                    now={now}
                    busy={busy}
                    requestedRank={requestedRank}
                    onBuild={(typeId) => {
                      closeModal();
                      closeSidePanel();
                      startPlacement({ type: 'building', typeId });
                      navigate('/park');
                    }}
                    onUpgrade={(id, targetLevel) =>
                      void act(() => upgrade.mutateAsync({ id, targetLevel }))
                    }
                    onComplete={(id) => void act(() => complete.mutateAsync(id))}
                    onSelectTech={(id, level) => pick('technology', id, level)}
                    onSelectFacility={(id) => pick('facility', id)}
                  />
                )}
              </>
            ) : (
              <>
                <div className="research-page__list" aria-label={`${families[currentFamily]} 연구`}>
                  {technologies.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={technology?.id === item.id}
                      onClick={() => pick('technology', item.id)}
                    >
                      <span>{item.name}</span>
                      <span>
                        {item.completedLevel}/{item.maxLevel}
                      </span>
                    </button>
                  ))}
                </div>
                {technology && (
                  <TechnologyDetail
                    technology={technology}
                    state={state}
                    busy={busy}
                    requestedRank={requestedRank}
                    onSelectTech={(id, level) => pick('technology', id, level)}
                    onSelectFacility={(id, level) => pick('facility', id, level)}
                    onStart={(id, level) => void act(() => start.mutateAsync({ id, level }))}
                    onResources={() => {
                      closeModal();
                      openSidePanel('resources');
                    }}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
