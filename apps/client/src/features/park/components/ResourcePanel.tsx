import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getViewingPlatformStats } from '@dino-park/game-data';
import type { EarlyResourceMaterial } from '@dino-park/shared';
import { Button } from '@/components/ui';
import { useUpgradeBuilding } from '@/api';
import {
  cancelResourceReads,
  useClaimResourceProduction,
  usePurchaseResource,
  useResources,
  useStartResourceProduction,
} from '@/api/queries/resources';
import { createRequestId } from '@/utils/requestId';
import './ResourcePanel.css';

interface Props {
  onPlaceBuilding: (typeId: string) => void;
  onClose?: () => void;
}

function countdown(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}분 ${String(seconds % 60).padStart(2, '0')}초`;
}

export default function ResourcePanel({ onPlaceBuilding, onClose }: Props) {
  const client = useQueryClient();
  const resources = useResources();
  const purchase = usePurchaseResource();
  const start = useStartResourceProduction();
  const claim = useClaimResourceProduction();
  const upgrade = useUpgradeBuilding();
  const [quantities, setQuantities] = useState<Partial<Record<EarlyResourceMaterial, number>>>({});
  const [lots, setLots] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now);
  const [working, setWorking] = useState(false);
  const inFlight = useRef(false);
  const pendingPurchase = useRef<{
    material: EarlyResourceMaterial;
    quantity: number;
    id: string;
  }>();
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const state = resources.data;
  const platform = state?.platformUpgrade;
  const platformStats = platform ? getViewingPlatformStats(platform.level) : null;
  const targetPlatformStats = platform?.targetLevel
    ? getViewingPlatformStats(platform.targetLevel)
    : null;
  const platformTimeLeft = platform?.completesAt ? Date.parse(platform.completesAt) - now : 0;
  const run = async (action: () => Promise<unknown>, message: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setWorking(true);
    setNotice(null);
    setFailure(null);
    try {
      await cancelResourceReads(client);
      await action();
      await resources.refetch();
      setNotice(message);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : '저장하지 못했어요. 다시 시도해주세요.');
    } finally {
      inFlight.current = false;
      setWorking(false);
    }
  };

  const buyMaterial = async (material: EarlyResourceMaterial, quantity: number) => {
    let request = pendingPurchase.current;
    if (request?.material !== material || request.quantity !== quantity) {
      request = { material, quantity, id: createRequestId() };
      pendingPurchase.current = request;
    }
    await purchase.mutateAsync({ material, quantity, requestId: request.id });
    pendingPurchase.current = undefined;
  };

  return (
    <section className="resource-panel" role="region" aria-label="기본 자원">
      <header className="resource-panel__header">
        <div>
          <h2>기본 자원</h2>
          <p>필요한 만큼 구매하거나, 시설에서 생산해요.</p>
        </div>
        {onClose && (
          <button
            type="button"
            className="resource-panel__close"
            aria-label="기본 자원 닫기"
            disabled={working}
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </header>
      {notice && (
        <p className="resource-panel__notice" role="status">
          {notice}
        </p>
      )}
      {failure && (
        <p className="resource-panel__failure" role="alert">
          {failure}
        </p>
      )}
      <div className="resource-panel__body">
        {resources.isPending ? (
          <p role="status">자원을 확인하고 있어요…</p>
        ) : resources.error ? (
          <div role="alert">
            <p>자원을 불러오지 못했어요.</p>
            <Button variant="outline" onClick={() => void resources.refetch()}>
              다시 시도
            </Button>
          </div>
        ) : state ? (
          <>
            <p className="resource-panel__balance">
              보유 골드 <strong>{state.gold.toLocaleString()}</strong> · 종류별 보관 한도{' '}
              {state.capacityPerMaterial}개
            </p>
            {platform && platformStats && (
              <section className="resource-panel__upgrade" aria-label="관람대 확장">
                <h3>관람대 Lv.{platform.level}</h3>
                {platform.completesAt ? (
                  <>
                    <p className="resource-panel__hint">
                      {platform.targetLevel
                        ? `Lv.${platform.targetLevel} 확장 중`
                        : '관람대 건설 중'}
                      {' · '}
                      {platformTimeLeft > 0 ? countdown(platformTimeLeft) : '완공 상태 확인 중'}
                    </p>
                    {platform.targetLevel && (
                      <p>
                        현재 정원 {platformStats.capacity}명 · 완공 후 {platform.targetCapacity}명
                      </p>
                    )}
                  </>
                ) : platform.targetLevel ? (
                  <>
                    <p>
                      완공 후 관람대 정원 {platformStats.capacity}명 → {platform.targetCapacity}명
                      {platform.targetLevel === 5 && ' · 지붕·안내 표지 확장'}
                    </p>
                    {targetPlatformStats && (
                      <p>
                        시간당 유지비 {platformStats.maintenanceCost} →{' '}
                        {targetPlatformStats.maintenanceCost}골드
                      </p>
                    )}
                    <p>
                      {platform.cost.gold.toLocaleString()}골드 · 목재 {platform.cost.wood}개 · 석재{' '}
                      {platform.cost.stone}개
                      {platform.cost.metal ? ` · 금속 ${platform.cost.metal}개` : ''}
                      {platform.seconds > 0 && ` · ${Math.ceil(platform.seconds / 60)}분`}
                    </p>
                    {platform.reason && <p className="resource-panel__hint">{platform.reason}</p>}
                    <Button
                      isLoading={upgrade.isPending}
                      disabled={working || !platform.available}
                      onClick={() => {
                        const { buildingId, targetLevel } = platform;
                        if (targetLevel === null) return;
                        void run(
                          () => upgrade.mutateAsync({ id: buildingId, targetLevel }),
                          `관람대 Lv.${targetLevel} 확장을 시작했어요.`,
                        );
                      }}
                    >
                      관람대 Lv.{platform.targetLevel}로 확장
                    </Button>
                  </>
                ) : (
                  <p>
                    관람대 정원 {platformStats.capacity}명
                    {platform.reason && ` · ${platform.reason}`}
                  </p>
                )}
              </section>
            )}
            <h3>재료함</h3>
            <div className="resource-panel__inventory">
              {state.inventory.map((item) => {
                const quantity =
                  quantities[item.material] ??
                  Math.max(1, (state.platformUpgrade?.cost[item.material] ?? 1) - item.amount);
                const total = quantity * item.buyPrice;
                const valid =
                  Number.isInteger(quantity) &&
                  quantity > 0 &&
                  quantity + item.amount <= state.capacityPerMaterial;
                return (
                  <div className="resource-panel__material" key={item.material}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.amount} / {state.capacityPerMaterial}개
                      </span>
                      <small>1개 {item.buyPrice}골드</small>
                    </div>
                    <label>
                      <span className="sr-only">{item.name} 구매 수량</span>
                      <input
                        type="number"
                        min="1"
                        max={state.capacityPerMaterial - item.amount}
                        step="1"
                        value={quantity}
                        onChange={(event) =>
                          setQuantities((current) => ({
                            ...current,
                            [item.material]: Number(event.target.value),
                          }))
                        }
                        disabled={working}
                      />
                    </label>
                    <Button
                      variant="outline"
                      disabled={working || !valid || state.parkLevel < 2 || state.gold < total}
                      onClick={() =>
                        void run(
                          () => buyMaterial(item.material, quantity),
                          `${item.name} ${quantity}개를 구매했어요.`,
                        )
                      }
                    >
                      {item.name} 구매 · {Number.isFinite(total) ? total.toLocaleString() : 0}골드
                    </Button>
                  </div>
                );
              })}
            </div>
            <h3>생산 시설</h3>
            <p className="resource-panel__hint">
              작업비에 운영비가 포함돼요. 자동으로 다음 작업을 시작하지 않아요.
            </p>
            <div className="resource-panel__facilities">
              {state.facilities.map((facility) => {
                const selectedLots = lots[facility.typeId] ?? 1;
                const quantity = facility.recipe.batchQuantity * selectedLots;
                const cost = facility.recipe.batchCost * selectedLots;
                const material = state.inventory.find(
                  (item) => item.material === facility.recipe.material,
                )!;
                const room = material.amount + quantity <= state.capacityPerMaterial;
                const building = facility.building;
                return (
                  <article className="resource-panel__facility" key={facility.typeId}>
                    <div className="resource-panel__facility-title">
                      <img
                        src={`/assets/placeholders/${facility.typeId}.svg`}
                        alt=""
                        width="60"
                        height="48"
                      />
                      <div>
                        <h4>{facility.name}</h4>
                        <p>{material.name} 생산 · 대기 유지비 없음</p>
                      </div>
                    </div>
                    {!building ? (
                      <>
                        <p>
                          {facility.cost.toLocaleString()}골드 · 건설{' '}
                          {Math.ceil(facility.constructionSeconds / 60)}분 · 파크 Lv.
                          {facility.unlockLevel}
                        </p>
                        <Button
                          disabled={
                            working ||
                            state.parkLevel < facility.unlockLevel ||
                            state.gold < facility.cost
                          }
                          onClick={() => onPlaceBuilding(facility.typeId)}
                        >
                          {facility.name} 배치 · {facility.cost.toLocaleString()}골드
                        </Button>
                      </>
                    ) : building.status.toUpperCase() !== 'ACTIVE' ? (
                      <p role="status">
                        건설 중 ·{' '}
                        {building.completesAt
                          ? countdown(Date.parse(building.completesAt) - now)
                          : '완공 확인 중'}
                      </p>
                    ) : facility.job ? (
                      <>
                        <p role="status">
                          {facility.job.ready ? '생산 완료' : '생산 중'} · {material.name}{' '}
                          {facility.job.quantity}개
                          {!facility.job.ready &&
                            ` · ${countdown(Date.parse(facility.job.readyAt) - now)}`}
                        </p>
                        {facility.job.claimBlocked && (
                          <p className="resource-panel__hint">
                            완료된 생산품을 보관 중이에요. 자재를 사용해 공간을 만든 뒤 수령하세요.
                          </p>
                        )}
                        <Button
                          disabled={working || !facility.job.ready || facility.job.claimBlocked}
                          onClick={() =>
                            void run(
                              () => claim.mutateAsync(facility.job!.id),
                              `${material.name} 생산품을 수령했어요.`,
                            )
                          }
                        >
                          {material.name} {facility.job.quantity}개 수령
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="resource-panel__production-choice">
                          <label htmlFor={`production-lots-${facility.typeId}`}>생산량</label>
                          <select
                            id={`production-lots-${facility.typeId}`}
                            disabled={working}
                            value={selectedLots}
                            onChange={(event) =>
                              setLots((current) => ({
                                ...current,
                                [facility.typeId]: Number(event.target.value),
                              }))
                            }
                          >
                            {Array.from({ length: facility.recipe.maxLots }, (_, i) => i + 1).map(
                              (value) => (
                                <option key={value} value={value}>
                                  {value}회분 · {facility.recipe.batchQuantity * value}개
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                        <p>
                          {cost.toLocaleString()}골드 · 생산{' '}
                          {Math.ceil((facility.recipe.batchSeconds * selectedLots) / 60)}분
                        </p>
                        {!room && (
                          <p className="resource-panel__hint">
                            보관할 공간이 부족해요. 생산량을 줄이거나 자재를 사용해주세요.
                          </p>
                        )}
                        <Button
                          disabled={working || !room || state.gold < cost}
                          onClick={() =>
                            void run(
                              () =>
                                start.mutateAsync({ buildingId: building.id, lots: selectedLots }),
                              `${facility.name} 생산을 시작했어요.`,
                            )
                          }
                        >
                          {material.name} {quantity}개 생산 시작
                        </Button>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
