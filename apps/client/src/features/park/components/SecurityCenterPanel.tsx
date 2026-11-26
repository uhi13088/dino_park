import { useEffect, useState } from 'react';
import {
  SECURITY_CENTER_LEVEL_ONE_STATS,
  SECURITY_CENTER_LEVEL_TWO_UPGRADE,
} from '@dino-park/game-data';
import type { BuildingResponse } from '@dino-park/shared';
import { useCompleteBuilding, useUpgradeBuilding } from '@/api';
import { useResources } from '@/api/queries/resources';
import { Button } from '@/components/ui';

interface Props {
  building: BuildingResponse;
  onShowResources: () => void;
  onReturnToGrowth?: () => void;
}

export default function SecurityCenterPanel({
  building,
  onShowResources,
  onReturnToGrowth,
}: Props) {
  const resources = useResources();
  const upgrade = useUpgradeBuilding();
  const complete = useCompleteBuilding();
  const status = building.status.toUpperCase();
  const isWorking = status === 'CONSTRUCTING' || status === 'UPGRADING';
  const completedLevel = status === 'UPGRADING' ? building.level - 1 : building.level;
  const plan = SECURITY_CENTER_LEVEL_TWO_UPGRADE;
  const canUpgrade = status === 'ACTIVE' && building.level === plan.targetLevel - 1;
  const remaining = (now: number) =>
    Math.max(0, Math.ceil((Date.parse(building.completesAt ?? '') - now) / 1000));
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!isWorking || !building.completesAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [building.completesAt, isWorking]);

  const remainingSeconds = building.completesAt ? remaining(now) : undefined;
  const stock = resources.data?.inventory ?? [];
  const needsMaterials = Object.entries(plan.materials).some(
    ([material, required]) =>
      (stock.find((item) => item.material === material)?.amount ?? 0) < required,
  );
  const canAfford = resources.data !== undefined && resources.data.gold >= plan.gold;
  const error = upgrade.error ?? complete.error;
  const stats = completedLevel === 1 ? SECURITY_CENTER_LEVEL_ONE_STATS : plan;

  return (
    <section
      className="w-full space-y-2 border-t border-slate-200 pt-3 text-sm"
      aria-label="보안센터 강화"
    >
      {status !== 'CONSTRUCTING' && completedLevel <= plan.targetLevel && (
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">Lv.{completedLevel}</span>
          <p className="text-green-800">
            위험 수용량 {stats.riskCapacity}점 · 유지비 {stats.maintenanceCost}골드/시간
          </p>
        </div>
      )}
      {canUpgrade && (
        <>
          <p>
            {plan.gold.toLocaleString('ko-KR')}골드 · 목재 {plan.materials.wood}개 · 석재{' '}
            {plan.materials.stone}개 · {Math.floor(plan.seconds / 60)}분 {plan.seconds % 60}초
          </p>
          <p className="text-slate-600">
            완공 시 유지비 {plan.maintenanceCost}골드/시간 · 위험종 유지비{' '}
            {plan.hazardousUpkeepReductionPercent}% 절감
          </p>
          {resources.error ? (
            <Button variant="outline" className="min-h-11" onClick={() => void resources.refetch()}>
              자원 정보 다시 확인
            </Button>
          ) : resources.data && needsMaterials ? (
            <Button variant="outline" className="min-h-11" onClick={onShowResources}>
              강화 자재 마련
            </Button>
          ) : (
            <Button
              className="min-h-11"
              disabled={!canAfford}
              isLoading={upgrade.isPending}
              onClick={() => upgrade.mutate({ id: building.id, targetLevel: plan.targetLevel })}
            >
              보안센터 Lv.2 강화
            </Button>
          )}
          {resources.data && !canAfford && (
            <p className="text-slate-600">강화에 필요한 골드가 부족해요.</p>
          )}
        </>
      )}
      {isWorking && (
        <>
          {remainingSeconds !== undefined && remainingSeconds > 0 && (
            <p>완공까지 {remainingSeconds}초</p>
          )}
          <Button
            variant="outline"
            className="min-h-11"
            disabled={(remainingSeconds ?? 0) > 0}
            isLoading={complete.isPending}
            onClick={() => complete.mutate(building.id)}
          >
            완공 확인
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error.message}
        </p>
      )}
      {onReturnToGrowth && (
        <Button
          variant="outline"
          className="inline-flex min-h-11 w-full justify-center"
          onClick={onReturnToGrowth}
        >
          성장 목표로 돌아가기
        </Button>
      )}
    </section>
  );
}
