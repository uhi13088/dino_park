import { Link } from 'react-router-dom';
import {
  getBuildingById,
  getGenericBuildingUpgradeQuote,
  resolveDinosaurSpecies,
  getViewingPlatformStats,
  MAX_VIEWING_PLATFORM_LEVEL,
  RESEARCH_LAB_ID,
  RESEARCH_STORAGE_ID,
  GOLD_VAULT_ID,
  SECURITY_CENTER_TYPE_ID,
  FUEL_DEPOT_TYPE_ID,
} from '@dino-park/game-data';
import {
  FEEDING_GOLD_COST,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
  type BuildingResponse,
  type DinosaurResponse,
  type ParkOperationsResponse,
  type ResourcesResponse,
} from '@dino-park/shared';
import { Button } from '@/components/ui';
import { entranceGateThumbnail } from '@/game/engine/EntranceGateArtwork';
import {
  buildingArtwork,
  dinosaurArtwork,
  getCompletedBuildingArtworkLevel,
  HABITAT_FENCE_UPGRADE_LEVEL,
  hasHabitatFenceUpgrade,
} from '@/game/parkArtwork';
import { useCurrency, useFeedDinosaur, useRemoveDinosaurFromPark, useUpgradeBuilding } from '@/api';
import { useGameStore, useUIStore } from '@/stores';
import { formatFacilityCountdown } from '@/utils/facilityCountdown';
import HybridExhibitPanel from './HybridExhibitPanel';
import ParkExhibitManagement from './ParkExhibitManagement';
import SecurityCenterPanel from './SecurityCenterPanel';
import FacilityCountdown from './FacilityCountdown';
import { useParkHarvest } from './useParkHarvest';
import './ParkPanel.css';

interface ParkPanelProps {
  dinosaurs: DinosaurResponse[];
  buildings: BuildingResponse[];
  operations?: ParkOperationsResponse;
  resources?: ResourcesResponse;
  onShowResources: () => void;
  onShowPlatformUpgrade?: () => void;
  onShowProduction?: (buildingId: string) => void;
  onReturnToGrowth?: () => void;
}

export default function ParkPanel({
  dinosaurs,
  buildings,
  operations,
  resources,
  onShowResources,
  onShowPlatformUpgrade,
  onShowProduction,
  onReturnToGrowth,
}: ParkPanelProps) {
  const {
    sidePanel,
    activeModal,
    modalData,
    openModal,
    openSidePanel,
    closeSidePanel,
    closeModal,
    showToast,
  } = useUIStore();
  const { startPlacement, selectEntity } = useGameStore();
  const { data: currency } = useCurrency();
  const feed = useFeedDinosaur();
  const withdraw = useRemoveDinosaurFromPark();
  const harvest = useParkHarvest();
  const upgrade = useUpgradeBuilding();
  const dinosaur = dinosaurs.find((item) => item.id === modalData?.dinosaurId);
  const building = buildings.find((item) => item.id === modalData?.buildingId);
  const showDinosaur = activeModal === 'dinosaur_detail' && dinosaur;
  const showBuilding = activeModal === 'building_detail' && building;
  const showExhibits = sidePanel === 'exhibit_list' && operations;
  if (
    !['dinosaur_list', 'building_list'].includes(sidePanel ?? '') &&
    !showDinosaur &&
    !showBuilding &&
    !showExhibits
  )
    return null;

  const close = () => {
    closeSidePanel();
    closeModal();
    selectEntity(null);
  };
  const place = (item: DinosaurResponse) => {
    closeSidePanel();
    closeModal();
    startPlacement({ type: 'dinosaur', id: item.id, speciesId: item.speciesId });
  };
  const handleFeed = async (id: string) => {
    try {
      await feed.mutateAsync(id);
    } catch (cause) {
      showToast({
        type: 'error',
        message:
          cause instanceof Error ? cause.message : '먹이를 주지 못했어요. 다시 시도해주세요.',
      });
    }
  };
  const name = dinosaur ? (resolveDinosaurSpecies(dinosaur)?.nameKo ?? dinosaur.speciesId) : '';
  const buildingType = building ? getBuildingById(building.typeId) : undefined;
  const isPlatform = building?.typeId === PARK_ADMISSION.platformTypeId;
  const isFuelDepot = building?.typeId === FUEL_DEPOT_TYPE_ID;
  const isSecurityCenter = showBuilding && building.typeId === SECURITY_CENTER_TYPE_ID;
  const isUpgrading = building?.status.toUpperCase() === 'UPGRADING';
  const isConstructing = building?.status.toUpperCase() === 'CONSTRUCTING';
  const production = resources?.facilities.find(
    (facility) => facility.building?.id === building?.id,
  );
  const job = production?.job;
  const hasFenceUpgrade = building && hasHabitatFenceUpgrade(building.typeId);
  const artworkLevel = building ? getCompletedBuildingArtworkLevel(building) : 1;
  const shownLevel = isPlatform || hasFenceUpgrade ? artworkLevel : building?.level;
  const platformLevel = isPlatform ? artworkLevel : null;
  const platformStats = platformLevel === null ? null : getViewingPlatformStats(platformLevel);
  const habitatUpgrade =
    building &&
    buildingType &&
    hasFenceUpgrade &&
    !isConstructing &&
    !isUpgrading &&
    building.level < buildingType.maxLevel
      ? {
          targetLevel: building.level + 1,
          ...getGenericBuildingUpgradeQuote(building.typeId, building.level + 1),
        }
      : null;
  const gold = operations?.gold ?? resources?.gold ?? currency?.gold;
  const lacksHabitatUpgradeGold =
    habitatUpgrade && gold !== undefined && gold < habitatUpgrade.gold;
  const habitatUpgradeError =
    typeof upgrade.variables === 'object' && upgrade.variables.id === building?.id
      ? upgrade.error
      : null;
  const title = showDinosaur
    ? dinosaur.nickname || name
    : showBuilding
      ? (buildingType?.nameKo ?? '시설 정보')
      : showExhibits
        ? '전시 구역'
        : sidePanel === 'dinosaur_list'
          ? '내 공룡'
          : '기본 시설';
  const result = dinosaur?.isInPark && feed.variables === dinosaur.id ? feed.data : undefined;
  const withdrawing = withdraw.isPending && withdraw.variables === dinosaur?.id;
  const withdrawFailed = withdraw.isError && withdraw.variables === dinosaur?.id;
  const occupiedHabitat =
    building &&
    buildingType?.category === 'dinosaur' &&
    dinosaurs.some(
      ({ isInPark, positionX, positionY }) =>
        isInPark &&
        positionX >= building.positionX &&
        positionX < building.positionX + buildingType.size.width &&
        positionY >= building.positionY &&
        positionY < building.positionY + buildingType.size.height,
    );
  const collect = async (button: HTMLButtonElement) => {
    if (!job || !production) return;
    try {
      await harvest.collect(job, production.recipe.material, button.getBoundingClientRect());
    } catch (cause) {
      showToast({
        type: 'error',
        message: cause instanceof Error ? cause.message : '생산품을 수확하지 못했어요.',
      });
    }
  };

  return (
    <section aria-label={title} className="park-context park-panel-surface">
      {harvest.feedback}
      <header className="park-panel-header">
        <h2>{title}</h2>
        <button
          type="button"
          aria-label="관리 패널 닫기"
          onClick={close}
          className="park-panel-close"
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
      </header>
      <div className="park-panel-body">
        {showDinosaur ? (
          <div className="space-y-3">
            <div className="park-context__hero">
              <div className="park-context__art">
                <img
                  src={dinosaurArtwork(dinosaur.speciesId, dinosaur.hybrid)}
                  alt=""
                  width="104"
                  height="90"
                />
              </div>
              <div className="min-w-0">
                <p className="park-context__level">
                  {name} · Lv.{dinosaur.level}
                </p>
                <p className="park-context__muted" role="status">
                  {dinosaur.isInPark
                    ? `배치 위치 (${dinosaur.positionX}, ${dinosaur.positionY})`
                    : '배치 대기'}
                </p>
                {dinosaur.isInPark && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-1"
                    disabled={feed.isPending || withdraw.isPending}
                    aria-busy={withdrawing}
                    onClick={() => withdraw.mutate(dinosaur.id)}
                  >
                    {withdrawing ? '이동 중…' : '배치 대기로'}
                  </Button>
                )}
              </div>
            </div>
            {withdrawFailed && (
              <p role="alert" className="text-sm text-red-700">
                배치 대기로 옮기지 못했어요. 다시 시도해주세요.
              </p>
            )}
            {dinosaur.speciesId === FIRST_HYBRID_SPECIES_ID && (
              <HybridExhibitPanel key={dinosaur.id} selected={dinosaur} dinosaurs={dinosaurs} />
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <label htmlFor="dinosaur-hunger">
                배고픔 <strong>{dinosaur.hunger}%</strong>
              </label>
              <label htmlFor="dinosaur-happiness">
                행복도 <strong>{dinosaur.happiness}%</strong>
              </label>
              <meter
                id="dinosaur-hunger"
                className="park-meter w-full"
                min="0"
                max="100"
                value={dinosaur.hunger}
              />
              <meter
                id="dinosaur-happiness"
                className="park-meter w-full"
                min="0"
                max="100"
                value={dinosaur.happiness}
              />
            </div>
            <p className="text-sm text-slate-600">
              친밀도 {dinosaur.intimacy} · 먹이를 주면 배고픔이 줄고 행복도가 올라가요.
            </p>
            {result && (
              <p role="status" className="text-sm font-semibold text-green-800">
                잘 먹었어요! 행복도 +{result.happinessGain}, 친밀도 +{result.intimacyGain}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11 flex-1 text-sm"
                disabled={feed.isPending || withdrawing}
                onClick={() => place(dinosaur)}
              >
                {dinosaur.isInPark ? '위치 옮기기' : '배치하기'}
              </Button>
              <Button
                className="min-h-11 flex-1 bg-green-700 text-sm hover:bg-green-800"
                isLoading={feed.isPending}
                disabled={
                  !dinosaur.isInPark ||
                  withdrawing ||
                  dinosaur.hunger === 0 ||
                  !currency ||
                  currency.gold < FEEDING_GOLD_COST
                }
                onClick={() => void handleFeed(dinosaur.id)}
              >
                {dinosaur.hunger === 0 ? '배불러요' : `먹이 주기 · ${FEEDING_GOLD_COST}골드`}
              </Button>
            </div>
            {!dinosaur.isInPark && (
              <p className="text-xs text-slate-600">먼저 파크에 배치한 뒤 먹이를 주세요.</p>
            )}
            {currency && currency.gold < FEEDING_GOLD_COST && (
              <p className="text-sm text-red-700">
                먹이를 주려면 {FEEDING_GOLD_COST}골드가 필요해요.
              </p>
            )}
          </div>
        ) : showBuilding ? (
          <>
            <div className="park-context__hero">
              <div className="park-context__art">
                <img
                  src={
                    building.typeId === PARK_ADMISSION.entranceTypeId
                      ? entranceGateThumbnail(operations?.isOpen)
                      : buildingArtwork(building.typeId, artworkLevel)
                  }
                  alt=""
                  width="104"
                  height="90"
                />
              </div>
              <div className="park-context__details">
                <div className="park-context__facts">
                  <span className="park-context__level">Lv.{shownLevel}</span>
                  <span
                    className="park-context__muted"
                    aria-label={`지도 좌표 ${building.positionX}, ${building.positionY}`}
                  >
                    ({building.positionX}, {building.positionY})
                  </span>
                </div>
                <p>{buildingType?.description}</p>
                {isFuelDepot && resources?.fuel && (
                  <p className="park-context__capacity">
                    연료{' '}
                    <strong>
                      {resources.fuel.amount} / {resources.fuel.capacity}
                    </strong>
                  </p>
                )}
                {platformStats && (
                  <p className="park-context__capacity">
                    {isConstructing ? '완공 시 관람석' : '관람석'}{' '}
                    <strong>{platformStats.capacity}석</strong>
                    {' · '}유지비 <strong>{platformStats.maintenanceCost}골드/시간</strong>
                  </p>
                )}
              </div>
            </div>
            {isSecurityCenter && (
              <SecurityCenterPanel
                key={building.id}
                building={building}
                onShowResources={onShowResources}
                onReturnToGrowth={onReturnToGrowth}
              />
            )}
            {(isConstructing || isUpgrading) && building.completesAt && (
              <FacilityCountdown completesAt={building.completesAt} />
            )}
            {habitatUpgrade && (
              <p className="park-context__capacity mt-2">
                <strong>{habitatUpgrade.gold.toLocaleString('ko-KR')}골드</strong> · 공사{' '}
                <strong>{formatFacilityCountdown(habitatUpgrade.seconds)}</strong>
                {habitatUpgrade.targetLevel === HABITAT_FENCE_UPGRADE_LEVEL &&
                  ' · 완공 후 울타리 변경'}
              </p>
            )}
            {lacksHabitatUpgradeGold && (
              <p className="text-xs text-amber-900">강화할 골드가 부족해요.</p>
            )}
            {habitatUpgradeError && (
              <p className="text-xs text-red-800" role="alert">
                {habitatUpgradeError.message || '서식지를 강화하지 못했어요. 다시 시도해주세요.'}
              </p>
            )}
            {job && !job.ready && <FacilityCountdown completesAt={job.readyAt} />}
            {job?.claimBlocked && (
              <p className="text-xs text-amber-900">
                {isFuelDepot ? '탐험에서 연료를 쓴 뒤 수령하세요.' : '자원 보관 공간이 부족해요.'}
              </p>
            )}
            {occupiedHabitat && (
              <p className="text-xs text-amber-900">시설을 옮기려면 공룡을 먼저 옮겨주세요.</p>
            )}
          </>
        ) : showExhibits ? (
          <>
            <ParkExhibitManagement
              buildings={buildings}
              dinosaurs={dinosaurs}
              operations={showExhibits}
              onShowDinosaurs={() => openSidePanel('dinosaur_list')}
              onBuild={(typeId) => {
                close();
                startPlacement({ type: 'building', typeId });
              }}
            />
            {onReturnToGrowth && (
              <Button variant="outline" className="mt-3 min-h-11 w-full" onClick={onReturnToGrowth}>
                성장 목표로 돌아가기
              </Button>
            )}
          </>
        ) : sidePanel === 'dinosaur_list' ? (
          <ul className="space-y-3">
            {dinosaurs.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <img
                  src={dinosaurArtwork(item.speciesId, item.hybrid)}
                  alt=""
                  width="58"
                  height="54"
                  className="object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {item.nickname || resolveDinosaurSpecies(item)?.nameKo}
                  </p>
                  <p className="text-xs text-slate-600">
                    {item.isInPark ? '파크에서 지내는 중' : '배치 대기 중'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 text-sm"
                  onClick={() => {
                    closeSidePanel();
                    selectEntity({ type: 'dinosaur', id: item.id });
                    openModal('dinosaur_detail', { dinosaurId: item.id });
                  }}
                >
                  돌보기
                </Button>
                <Button className="min-h-11 text-sm" onClick={() => place(item)}>
                  {item.isInPark ? '옮기기' : '배치하기'}
                </Button>
              </li>
            ))}
            {!dinosaurs.length && (
              <li className="py-3 text-sm text-slate-600">아직 돌볼 공룡이 없어요.</li>
            )}
          </ul>
        ) : (
          <ul className="space-y-4">
            {buildings.map((item) => {
              const isViewingPlatform = item.typeId === PARK_ADMISSION.platformTypeId;
              const level =
                isViewingPlatform || hasHabitatFenceUpgrade(item.typeId)
                  ? getCompletedBuildingArtworkLevel(item)
                  : item.level;
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <img
                    className="shrink-0 object-contain"
                    src={
                      item.typeId === PARK_ADMISSION.entranceTypeId
                        ? entranceGateThumbnail(operations?.isOpen)
                        : buildingArtwork(item.typeId, level)
                    }
                    alt=""
                    width="70"
                    height="60"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {getBuildingById(item.typeId)?.nameKo ?? item.typeId}
                    </p>
                    <p className="text-sm text-slate-600">
                      Lv.{level} · ({item.positionX}, {item.positionY})
                    </p>
                  </div>
                  {(isViewingPlatform ||
                    item.typeId === SECURITY_CENTER_TYPE_ID ||
                    item.typeId === FUEL_DEPOT_TYPE_ID) && (
                    <Button
                      variant="outline"
                      className="min-h-11 text-sm"
                      onClick={() => {
                        closeSidePanel();
                        selectEntity({ type: 'building', id: item.id });
                        openModal('building_detail', { buildingId: item.id });
                      }}
                    >
                      {isViewingPlatform
                        ? '관람대 상세'
                        : item.typeId === SECURITY_CENTER_TYPE_ID
                          ? '보안센터 상세'
                          : '연료 보급소 상세'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {showBuilding && (
        <div className="park-context__actions">
          {habitatUpgrade && (
            <Button
              variant="gold"
              className="park-panel-action--primary"
              disabled={!!lacksHabitatUpgradeGold}
              isLoading={upgrade.isPending}
              onClick={() =>
                upgrade.mutate({ id: building.id, targetLevel: habitatUpgrade.targetLevel })
              }
            >
              Lv.{habitatUpgrade.targetLevel} 강화
            </Button>
          )}
          {[RESEARCH_LAB_ID, RESEARCH_STORAGE_ID, GOLD_VAULT_ID].some(
            (typeId) => typeId === building.typeId,
          ) && (
            <Link
              to={
                building.typeId === RESEARCH_LAB_ID
                  ? '/research'
                  : `/research?facility=${building.typeId}`
              }
              className="park-panel-action--primary inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-semibold"
              onClick={close}
            >
              {building.typeId === RESEARCH_LAB_ID ? '연구 보기' : '강화 보기'}
            </Link>
          )}
          {production && !isConstructing && (
            <Button
              variant={job?.ready ? 'gold' : 'outline'}
              className="park-panel-action--primary"
              isLoading={harvest.isPending}
              disabled={!!job && (!job.ready || job.claimBlocked)}
              onClick={({ currentTarget }) => {
                if (job?.ready) void collect(currentTarget);
                else if (onShowProduction) onShowProduction(building.id);
                else onShowResources();
              }}
            >
              {isFuelDepot && job
                ? job.ready
                  ? `연료 ${job.quantity}개 수령`
                  : '생산 중'
                : job
                  ? '수확'
                  : '생산 준비'}
            </Button>
          )}
          {isFuelDepot && !isConstructing && (
            <Link to="/exploration" className="resource-panel__scout-link" onClick={close}>
              탐험으로
            </Link>
          )}
          {platformLevel !== null &&
            platformLevel < MAX_VIEWING_PLATFORM_LEVEL &&
            !isConstructing && (
              <Button
                variant="outline"
                className="park-panel-action--primary"
                onClick={onShowPlatformUpgrade ?? onShowResources}
              >
                관람대 확장 보기
              </Button>
            )}
          {!isConstructing && !isUpgrading && (
            <Button
              variant="outline"
              disabled={!!occupiedHabitat}
              onClick={() => {
                close();
                startPlacement(
                  building.typeId === PARK_ADMISSION.entranceTypeId
                    ? { type: 'entrance', id: building.id }
                    : { type: 'building', id: building.id, typeId: building.typeId },
                );
              }}
            >
              {building.typeId === PARK_ADMISSION.entranceTypeId
                ? '입구 옮기기 · 무료'
                : '시설 옮기기'}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
