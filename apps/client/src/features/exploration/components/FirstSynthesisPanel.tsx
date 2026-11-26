import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBuildingById, getDinosaurById } from '@dino-park/game-data';
import {
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_LAB_ID,
  FIRST_HYBRID_SPECIES_ID,
  MATERIAL_QUALITY_LABELS,
  RESEARCH_MATERIAL_LABELS,
  type FirstSynthesisParent,
} from '@dino-park/shared';
import { useBuildings, useCompleteBuilding, useParkMe } from '@/api';
import { useFirstSynthesis, useFirstSynthesisAction } from '@/api/queries/hybridMilestone';
import { Button } from '@/components/ui';
import { useGameStore, useUIStore } from '@/stores';
import { currentParkGrowthStage, parkGrowthHref } from '@/utils/parkGrowthNavigation';

const FACILITIES = [
  'research-hatchery',
  'habitat-carnivore',
  'operation-security-center',
  FIRST_HYBRID_LAB_ID,
  FIRST_HYBRID_HABITAT_ID,
];

const healthy = (parent: FirstSynthesisParent) => parent.happiness >= 30 && parent.hunger <= 80;
const timeLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function FirstSynthesisPanel() {
  const query = useFirstSynthesis(true);
  const synthesis = useFirstSynthesisAction();
  const buildings = useBuildings();
  const park = useParkMe();
  const completeBuilding = useCompleteBuilding();
  const navigate = useNavigate();
  const { startPlacement } = useGameStore();
  const { closeSidePanel, closeModal } = useUIStore();
  const [selectedParents, setSelectedParents] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const perform = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '진행을 저장하지 못했어요.');
    }
  };
  const state = query.data;
  if (!state)
    return (
      <section className="hybrid-panel" aria-label="첫 합성">
        <p role={query.isError ? 'alert' : 'status'}>
          {query.isError ? query.error.message : '연구 기록을 불러오고 있어요…'}
        </p>
        {query.isError && <Button onClick={() => void query.refetch()}>다시 불러오기</Button>}
      </section>
    );

  const navigateToPark = (placement: Parameters<typeof startPlacement>[0]) => {
    closeSidePanel();
    closeModal();
    startPlacement(placement);
    navigate('/park');
  };
  const ownedBuildings = buildings.data?.buildings ?? [];
  const parkLevel = park.data?.level ?? 0;
  const growthStage = currentParkGrowthStage(parkLevel);
  const job = state.job;
  const clock = Date.parse(state.serverTime) + Math.max(0, now - query.dataUpdatedAt);
  const remaining = job ? Math.max(0, Math.ceil((Date.parse(job.readyAt) - clock) / 1000)) : 0;
  const busy = synthesis.isPending || completeBuilding.isPending;
  const parentGroups = state.recipe.parentSpeciesIds.map((speciesId) => {
    const options = state.parents.filter((parent) => parent.speciesId === speciesId);
    const selected =
      options.find((parent) => parent.id === selectedParents[speciesId]) ??
      options.find(healthy) ??
      options[0];
    return { speciesId, options, selected };
  });
  const validParents = parentGroups.every(({ selected }) => selected && healthy(selected));
  const ingredientsReady = state.ingredients.every((item) => item.amount <= item.available);
  const habitatReady = ownedBuildings.some(
    (building) =>
      building.typeId === FIRST_HYBRID_HABITAT_ID && building.status.toUpperCase() === 'ACTIVE',
  );

  return (
    <section className="hybrid-panel" aria-labelledby="synthesis-panel-title">
      <header className="hybrid-section-heading">
        <div>
          <h2 id="synthesis-panel-title">첫 스테고케라톱스</h2>
          <p>
            첫 지정 합성 · 성공률{' '}
            {Math.round((state.recipe.firstSynthesisRule?.successRate ?? 1) * 100)}%
          </p>
        </div>
        <span className="hybrid-balance">{state.gold.toLocaleString()}골드</span>
      </header>
      {(error || query.error || buildings.error || park.error) && (
        <p className="hybrid-error" role="alert">
          {error ?? query.error?.message ?? buildings.error?.message ?? park.error?.message}
        </p>
      )}
      {job?.status === 'claimed' && (
        <div className="hybrid-feature">
          <img src="/assets/placeholders/stegoceratops.svg" width="136" height="108" alt="" />
          <div>
            <h3>
              {job.exhibitedAt ? '스테고케라톱스를 전시했어요' : '스테고케라톱스가 태어났어요'}
            </h3>
            <p>
              영웅 스테고케라톱스가 도감에 등록됐어요. 건설자 {state.builderSlots}명이 작업할 수
              있어요.
            </p>
            {!job.exhibitedAt && (
              <p>입구에서 관람할 수 있는 초식 하이브리드 서식지에 배치하세요.</p>
            )}
            <div className="hybrid-actions">
              {!job.exhibitedAt && job.resultDinosaurId && (
                <Button
                  disabled={!habitatReady}
                  onClick={() =>
                    navigateToPark({
                      type: 'dinosaur',
                      id: job.resultDinosaurId!,
                      speciesId: FIRST_HYBRID_SPECIES_ID,
                    })
                  }
                >
                  파크에 전시
                </Button>
              )}
              <Link
                className="hybrid-text-link"
                to={`/dinosaur?species=${FIRST_HYBRID_SPECIES_ID}`}
              >
                도감에서 보기
              </Link>
              {job.exhibitedAt && (
                <>
                  {parkLevel >= 5 && (
                    <Link className="hybrid-text-link" to={parkGrowthHref(growthStage)}>
                      성장 목표 보기
                    </Link>
                  )}
                  <Link className="hybrid-text-link" to="/exploration?tab=repeat">
                    반복 합성 준비
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {!state.available && <p>이구아노돈 부화 보상을 받은 뒤 첫 합성을 준비할 수 있어요.</p>}
      {state.available && !state.safetyComplete && (
        <div className="hybrid-callout">
          <div>
            <h3>2장 · 안전 점검</h3>
            <p>마르코가 새 우리와 관람 동선을 점검합니다.</p>
            {!!state.safetyRequirements.length && (
              <ul className="hybrid-checklist">
                {state.safetyRequirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <Button
            isLoading={busy}
            disabled={state.safetyRequirements.length > 0}
            onClick={() => void perform(() => synthesis.mutateAsync({ kind: 'safety' }))}
          >
            안전 점검 완료
          </Button>
        </div>
      )}
      {state.available && !job && (
        <>
          <div className="hybrid-recipe">
            <div>
              <h3>원종 선택</h3>
              {parentGroups.map(({ speciesId, options, selected }) => {
                const name = getDinosaurById(speciesId)?.nameKo ?? speciesId;
                return (
                  <label key={speciesId} className="hybrid-parent">
                    <span>{name}</span>
                    {options.length ? (
                      <select
                        value={selected?.id ?? ''}
                        onChange={(event) =>
                          setSelectedParents({
                            ...selectedParents,
                            [speciesId]: event.target.value,
                          })
                        }
                      >
                        {options.map((parent) => (
                          <option key={parent.id} value={parent.id}>
                            {parent.nickname ?? name} · 행복 {parent.happiness} · 허기{' '}
                            {parent.hunger}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="hybrid-detail">알을 부화해 개체를 받아주세요</span>
                    )}
                  </label>
                );
              })}
              <p className="hybrid-detail">
                행복 30 이상 · 허기 80 이하. 합성 후에도 두 원종은 함께 지낼 수 있어요.
              </p>
            </div>
            <div>
              <h3>합성 재료</h3>
              <dl className="hybrid-materials">
                {state.ingredients.map((item) => (
                  <div key={item.material}>
                    <dt>
                      {MATERIAL_QUALITY_LABELS[item.quality]}{' '}
                      {RESEARCH_MATERIAL_LABELS[item.material]}
                    </dt>
                    <dd>
                      {item.available}/{item.amount}개
                    </dd>
                  </div>
                ))}
                <div>
                  <dt>합성비</dt>
                  <dd>{state.recipe.goldCost?.toLocaleString()}골드</dd>
                </div>
              </dl>
              {!ingredientsReady && (
                <Link className="hybrid-text-link" to="/exploration">
                  원정에서 재료 모으기
                </Link>
              )}
            </div>
          </div>
          <div className="hybrid-callout">
            <div>
              <h3>3장 · 첫 실험</h3>
              <p>
                {state.prepared
                  ? '진이 배양을 시작할 준비를 마쳤어요.'
                  : '닥터 진이 두 원종을 지키며 새로운 생명을 맞을 방법을 제안합니다.'}
              </p>
              {!!state.missing.length && (
                <ul className="hybrid-checklist">
                  {state.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            {state.prepared ? (
              <Button
                isLoading={busy}
                disabled={!validParents || state.missing.length > 0}
                onClick={() =>
                  void perform(() =>
                    synthesis.mutateAsync({
                      kind: 'start',
                      parentIds: parentGroups.flatMap(({ selected }) =>
                        selected ? [selected.id] : [],
                      ),
                    }),
                  )
                }
              >
                첫 합성 시작 · 30분
              </Button>
            ) : (
              <Button
                isLoading={busy}
                disabled={!state.safetyComplete || !state.labReady || !ingredientsReady}
                onClick={() => void perform(() => synthesis.mutateAsync({ kind: 'prepare' }))}
              >
                진과 실험 준비
              </Button>
            )}
          </div>
        </>
      )}
      {job && job.status !== 'claimed' && (
        <div className="hybrid-callout">
          <div>
            <h3>
              {job.status === 'ready' || remaining === 0
                ? '배양을 마쳤어요'
                : `배양 중 · ${timeLabel(remaining)}`}
            </h3>
            <p>파크를 돌보거나 다른 화면으로 이동해도 예정된 시간에 배양이 끝나요.</p>
          </div>
          <Button
            isLoading={busy}
            disabled={job.status !== 'ready' && remaining > 0}
            onClick={() => void perform(() => synthesis.mutateAsync({ kind: 'claim' }))}
          >
            스테고케라톱스 만나기
          </Button>
        </div>
      )}
      {state.available && !job?.exhibitedAt && (
        <div className="hybrid-facilities">
          <h3>준비할 시설</h3>
          <ul className="hybrid-task-list">
            {FACILITIES.map((typeId) => {
              const definition = getBuildingById(typeId);
              if (!definition) return null;
              const existing = ownedBuildings.find((building) => building.typeId === typeId);
              const active = existing?.status.toUpperCase() === 'ACTIVE';
              const seconds = existing?.completesAt
                ? Math.max(0, Math.ceil((Date.parse(existing.completesAt) - clock) / 1000))
                : 0;
              const cost = definition.baseCost ?? definition.unlockCondition.cost.gold ?? 0;
              return (
                <li key={typeId} className="hybrid-task">
                  <div>
                    <h4>{definition.nameKo}</h4>
                    <p className="hybrid-detail">
                      {active
                        ? '완공'
                        : existing
                          ? `공사 중 · ${timeLabel(seconds)}`
                          : `파크 Lv.${definition.unlockCondition.parkLevel} · ${cost.toLocaleString()}골드`}
                      {!existing &&
                        definition.unlockCondition.cost.materials &&
                        Object.entries(definition.unlockCondition.cost.materials)
                          .filter(([, amount]) => amount > 0)
                          .map(
                            ([material, amount]) =>
                              ` · ${({ wood: '목재', stone: '석재', metal: '금속' } as Record<string, string>)[material] ?? material} ${amount}`,
                          )}
                    </p>
                  </div>
                  {!existing && (
                    <Button
                      variant="outline"
                      disabled={
                        busy ||
                        !buildings.data ||
                        parkLevel < definition.unlockCondition.parkLevel ||
                        state.gold < cost
                      }
                      onClick={() => navigateToPark({ type: 'building', typeId })}
                    >
                      건설 위치 고르기
                    </Button>
                  )}
                  {existing && !active && (
                    <Button
                      variant="outline"
                      disabled={busy || seconds > 0}
                      onClick={() =>
                        void perform(async () => {
                          await completeBuilding.mutateAsync(existing.id);
                          await query.refetch();
                        })
                      }
                    >
                      완공 확인
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
