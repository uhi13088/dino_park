import {
  getBuildingById,
  getDinosaurById,
  getViewingPlatformCompletedLevel,
  getViewingPlatformStats,
  MAX_VIEWING_PLATFORM_LEVEL,
} from '@dino-park/game-data';
import {
  FEEDING_GOLD_COST,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
  type BuildingResponse,
  type DinosaurResponse,
} from '@dino-park/shared';
import { Button } from '@/components/ui';
import { buildingArtwork, dinosaurArtwork } from '@/game/parkArtwork';
import { useCurrency, useFeedDinosaur } from '@/api';
import { useGameStore, useUIStore } from '@/stores';
import HybridExhibitPanel from './HybridExhibitPanel';

interface ParkPanelProps {
  dinosaurs: DinosaurResponse[];
  buildings: BuildingResponse[];
  onShowResources: () => void;
}

export default function ParkPanel({ dinosaurs, buildings, onShowResources }: ParkPanelProps) {
  const { sidePanel, activeModal, modalData, openModal, closeSidePanel, closeModal, showToast } =
    useUIStore();
  const { startPlacement, selectEntity } = useGameStore();
  const { data: currency } = useCurrency();
  const feed = useFeedDinosaur();
  const dinosaur = dinosaurs.find((item) => item.id === modalData?.dinosaurId);
  const building = buildings.find((item) => item.id === modalData?.buildingId);
  const showDinosaur = activeModal === 'dinosaur_detail' && dinosaur;
  const showBuilding = activeModal === 'building_detail' && building;
  if (
    !['dinosaur_list', 'building_list'].includes(sidePanel ?? '') &&
    !showDinosaur &&
    !showBuilding
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
  const name = dinosaur ? (getDinosaurById(dinosaur.speciesId)?.nameKo ?? dinosaur.speciesId) : '';
  const buildingType = building ? getBuildingById(building.typeId) : undefined;
  const isPlatform = building?.typeId === PARK_ADMISSION.platformTypeId;
  const isUpgrading = building?.status.toUpperCase() === 'UPGRADING';
  const isConstructing = building?.status.toUpperCase() === 'CONSTRUCTING';
  const platformLevel =
    isPlatform && building ? getViewingPlatformCompletedLevel(building.level, isUpgrading) : null;
  const platformStats = platformLevel === null ? null : getViewingPlatformStats(platformLevel);
  const title = showDinosaur
    ? dinosaur.nickname || name
    : showBuilding
      ? (buildingType?.nameKo ?? '시설 정보')
      : sidePanel === 'dinosaur_list'
        ? '내 공룡'
        : '기본 시설';
  const result = dinosaur && feed.variables === dinosaur.id ? feed.data : undefined;

  return (
    <section
      aria-label={title}
      className="absolute inset-x-3 bottom-3 z-20 mx-auto flex max-h-[65%] max-w-sm flex-col rounded-2xl bg-white text-slate-800 shadow-xl"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <button
          aria-label="관리 패널 닫기"
          onClick={close}
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"
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
      </div>
      {/* Keep the scroll surface inside the floating panel above the WebGL map. */}
      <div className="min-h-0 overflow-auto px-4 pb-4">
        {showDinosaur ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={dinosaurArtwork(dinosaur.speciesId)} alt="" width="76" height="70" />
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  {name} · Lv.{dinosaur.level}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {dinosaur.isInPark
                    ? `배치 위치 (${dinosaur.positionX}, ${dinosaur.positionY})`
                    : '파크에 배치할 준비가 됐어요'}
                </p>
              </div>
            </div>
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
                disabled={feed.isPending}
                onClick={() => place(dinosaur)}
              >
                {dinosaur.isInPark ? '위치 옮기기' : '배치하기'}
              </Button>
              <Button
                className="min-h-11 flex-1 bg-green-700 text-sm hover:bg-green-800"
                isLoading={feed.isPending}
                disabled={
                  !dinosaur.isInPark ||
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
          <div className="flex items-center gap-4">
            <img
              className="shrink-0 object-contain"
              src={buildingArtwork(building.typeId, platformLevel ?? building.level)}
              alt=""
              width="104"
              height="90"
            />
            <div className="min-w-0">
              <p className="text-sm">{buildingType?.description}</p>
              <p className="mt-2 text-xs text-slate-600">
                Lv.{platformLevel ?? building.level} · ({building.positionX}, {building.positionY})
                {isConstructing && ' · 건설 중'}
                {isUpgrading && ` · Lv.${building.level} 확장 중`}
              </p>
              {platformStats && (
                <p className="mt-2 text-sm text-green-800">
                  {isConstructing ? '완공 시 관람 정원' : '이 관람대 정원'} {platformStats.capacity}
                  명 · 유지비 {platformStats.maintenanceCost}골드/시간
                </p>
              )}
              {platformLevel !== null &&
                platformLevel < MAX_VIEWING_PLATFORM_LEVEL &&
                !isConstructing && (
                  <Button
                    variant="outline"
                    className="mt-3 min-h-11 text-sm"
                    onClick={onShowResources}
                  >
                    관람대 확장 보기
                  </Button>
                )}
              {building.typeId === PARK_ADMISSION.entranceTypeId && (
                <Button
                  variant="outline"
                  className="mt-3 min-h-11 text-sm"
                  onClick={() => {
                    close();
                    startPlacement({ type: 'entrance', id: building.id });
                  }}
                >
                  입구 옮기기 · 무료
                </Button>
              )}
            </div>
          </div>
        ) : sidePanel === 'dinosaur_list' ? (
          <ul className="space-y-3">
            {dinosaurs.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <img src={dinosaurArtwork(item.speciesId)} alt="" width="58" height="54" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {item.nickname || getDinosaurById(item.speciesId)?.nameKo}
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
              const level = isViewingPlatform
                ? getViewingPlatformCompletedLevel(
                    item.level,
                    item.status.toUpperCase() === 'UPGRADING',
                  )
                : item.level;
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <img
                    className="shrink-0 object-contain"
                    src={buildingArtwork(item.typeId, level)}
                    alt=""
                    width="70"
                    height="60"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {getBuildingById(item.typeId)?.nameKo ?? item.typeId}
                    </p>
                    <p className="text-sm text-slate-600">
                      Lv.{level} · ({item.positionX}, {item.positionY})
                    </p>
                  </div>
                  {isViewingPlatform && (
                    <Button
                      variant="outline"
                      className="min-h-11 text-sm"
                      onClick={() => {
                        closeSidePanel();
                        selectEntity({ type: 'building', id: item.id });
                        openModal('building_detail', { buildingId: item.id });
                      }}
                    >
                      관람대 상세
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
