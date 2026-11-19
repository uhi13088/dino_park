import { useCallback, useEffect, useRef } from 'react';
import { getBuildingById } from '@dino-park/game-data';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FIRST_HYBRID_LAB_ID,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
  type DinosaurResponse,
} from '@dino-park/shared';
import { useGameEngine } from '@/hooks';
import { useAuthStore, useGameStore, useUIStore } from '@/stores';
import {
  useClaimStarterPark,
  useSetParkOpen,
  useCompleteBuilding,
  useFirstExpedition,
  useClaimHatchingEgg,
} from '@/api';
import { useFirstSynthesis } from '@/api/queries/hybridMilestone';
import { Button } from '@/components/ui';
import ParkPanel from '../components/ParkPanel';
import ParkOperationsPanel from '../components/ParkOperationsPanel';
import ResourcePanel from '../components/ResourcePanel';
import ParkGrowthPanel from '../components/ParkGrowthPanel';

export default function ParkPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const compareHybrid = params.get('compareHybrid');
  const returnToGrowth = params.get('panel') === 'growth';
  const growthTrigger = useRef<HTMLButtonElement>(null);
  const firstExpedition = useFirstExpedition();
  const firstSynthesis = useFirstSynthesis(firstExpedition.data?.stage === 'complete');
  const claimHatch = useClaimHatchingEgg();
  const {
    containerRef,
    isReady,
    error,
    engine,
    handleMapKeyDown,
    isPlacing,
    isSavingPlacement,
    isPlacementReady,
    targetTile,
    confirmPlacement,
    canConfirmPlacement,
    placementIssue,
    dinosaursQuery,
    buildingsQuery,
    operationsQuery,
  } = useGameEngine();
  const { cancelPlacement, startPlacement, placementData, showGrid, toggleGrid } = useGameStore();
  const { sidePanel, openSidePanel, closeSidePanel, openModal, closeModal, showToast } =
    useUIStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mutate: claimStarter, isPending, error: starterError } = useClaimStarterPark();
  const setParkOpen = useSetParkOpen();
  const completeBuilding = useCompleteBuilding();
  const openGrowth = useCallback(() => {
    cancelPlacement();
    closeModal();
    openSidePanel('growth');
  }, [cancelPlacement, closeModal, openSidePanel]);
  useEffect(() => {
    if (isAuthenticated) claimStarter();
  }, [isAuthenticated, claimStarter]);

  useEffect(() => {
    if (isPlacing) closeSidePanel();
  }, [isPlacing, closeSidePanel]);

  useEffect(() => {
    if (!isAuthenticated || !returnToGrowth || compareHybrid) return;
    openGrowth();
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('panel');
        return next;
      },
      { replace: true },
    );
  }, [isAuthenticated, returnToGrowth, compareHybrid, openGrowth, setParams]);

  useEffect(() => {
    if (!isAuthenticated || !compareHybrid || !dinosaursQuery.data) return;
    const dinosaur = dinosaursQuery.data.dinosaurs.find(
      ({ id, speciesId }) => id === compareHybrid && speciesId === FIRST_HYBRID_SPECIES_ID,
    );
    if (dinosaur) {
      cancelPlacement();
      closeSidePanel();
      openModal('dinosaur_detail', { dinosaurId: dinosaur.id });
    } else {
      if (dinosaursQuery.isFetching) return;
      if (!dinosaursQuery.isFetchedAfterMount) {
        void dinosaursQuery.refetch();
        return;
      }
    }
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('compareHybrid');
        return next;
      },
      { replace: true },
    );
  }, [
    isAuthenticated,
    compareHybrid,
    dinosaursQuery.data,
    dinosaursQuery.isFetching,
    dinosaursQuery.isFetchedAfterMount,
    dinosaursQuery.refetch,
    cancelPlacement,
    closeSidePanel,
    openModal,
    setParams,
  ]);

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (error)
    return (
      <div
        role="alert"
        className="flex h-full items-center justify-center bg-red-50 p-6 text-center text-red-800"
      >
        파크를 열지 못했어요. {error.message}
      </div>
    );
  const dinosaurs = dinosaursQuery.data?.dinosaurs ?? [];
  const buildings = buildingsQuery.data?.buildings ?? [];
  const operations = operationsQuery.data;
  const dataError =
    starterError ||
    dinosaursQuery.error ||
    buildingsQuery.error ||
    operationsQuery.error ||
    firstExpedition.error;
  const openPanel = (type: 'dinosaur_list' | 'building_list') => {
    cancelPlacement();
    closeModal();
    openSidePanel(type);
  };
  const preparePlacement = () => {
    closeModal();
    closeSidePanel();
  };
  const placeDinosaur = (dinosaur: DinosaurResponse) => {
    preparePlacement();
    startPlacement({ type: 'dinosaur', id: dinosaur.id, speciesId: dinosaur.speciesId });
  };
  const reportFailure = (cause: unknown) => {
    showToast({
      type: 'error',
      message: cause instanceof Error ? cause.message : '저장하지 못했어요. 다시 시도해주세요.',
    });
  };
  const openResources = () => {
    cancelPlacement();
    closeModal();
    openSidePanel('resources');
  };
  const buildingPlacement = placementData?.type === 'building';
  const placementBuilding = buildingPlacement
    ? getBuildingById(placementData.typeId ?? '')
    : undefined;
  const placementCost =
    placementBuilding?.baseCost ?? placementBuilding?.unlockCondition.cost.gold ?? 0;
  const entrancePlacement = placementData?.type === 'entrance';
  const firstHybridPlacement = placementData?.speciesId === FIRST_HYBRID_SPECIES_ID;
  const canAffordPlacement = !buildingPlacement || (operations?.gold ?? 0) >= placementCost;

  return (
    <div className="relative flex h-full flex-col">
      {isPlacing ? (
        <section
          id="placement-help"
          className="shrink-0 border-b border-green-200 bg-white px-3 py-3 text-slate-800"
          aria-label="배치 안내"
        >
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-sm font-bold">
                  {isSavingPlacement
                    ? '배치를 저장하고 있어요…'
                    : buildingPlacement
                      ? `${placementBuilding?.nameKo ?? '시설'} 건설 위치를 골라주세요`
                      : entrancePlacement
                        ? '입구를 놓을 테두리를 골라주세요'
                        : firstHybridPlacement
                          ? '스테고케라톱스 전시 위치를 골라주세요'
                          : '공룡이 지낼 칸을 골라주세요'}
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {buildingPlacement
                    ? '빈칸에서 위치를 미리 보고 건설을 확정하세요. 취소하면 골드는 나가지 않아요.'
                    : entrancePlacement
                      ? '기존 시설과 겹치지 않는 파크 테두리로 무료로 옮겨요.'
                      : firstHybridPlacement
                        ? '개장한 파크의 관람길과 이어진 초식 하이브리드 서식지에 배치하세요.'
                        : '초원의 빈칸을 눌러 미리 본 뒤 확정하세요. 취소하면 기존 위치를 유지해요.'}
                </p>
              </div>
              <Button
                variant="ghost"
                className="min-h-11 shrink-0 text-sm"
                disabled={isSavingPlacement}
                onClick={cancelPlacement}
              >
                취소
              </Button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              선택 ({targetTile.x}, {targetTile.y}) · 방향키로 이동 · Enter로{' '}
              {buildingPlacement ? '건설' : '배치'} · Esc로 취소
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p
                className={
                  canConfirmPlacement && canAffordPlacement
                    ? 'text-xs text-green-800'
                    : 'text-xs text-red-800'
                }
                role="status"
              >
                {!isPlacementReady
                  ? '지도와 배치 위치를 준비하고 있어요…'
                  : !canAffordPlacement
                    ? '건설에 필요한 골드를 더 모아주세요.'
                    : canConfirmPlacement
                      ? '이 위치에 배치할 수 있어요.'
                      : (placementIssue ?? '겹치지 않는 위치와 길·테두리 연결을 확인해주세요.')}
              </p>
              <Button
                className="min-h-11 bg-green-800 text-sm hover:bg-green-900"
                disabled={isSavingPlacement || !canConfirmPlacement || !canAffordPlacement}
                isLoading={isSavingPlacement}
                onClick={() => void confirmPlacement()}
              >
                {buildingPlacement
                  ? `${placementBuilding?.nameKo ?? '시설'} 건설 · ${placementCost.toLocaleString()}골드`
                  : entrancePlacement
                    ? '입구 옮기기 · 무료'
                    : '공룡 배치 확정'}
              </Button>
            </div>
          </div>
        </section>
      ) : operations ? (
        <ParkOperationsPanel
          operations={operations}
          dinosaurs={dinosaurs}
          busy={
            setParkOpen.isPending ||
            completeBuilding.isPending ||
            claimHatch.isPending ||
            !!dataError
          }
          onOpenChange={(isOpen) => {
            void setParkOpen.mutateAsync(isOpen).catch(reportFailure);
          }}
          onPlaceDinosaur={placeDinosaur}
          onCareDinosaur={(dinosaur) => {
            preparePlacement();
            openModal('dinosaur_detail', { dinosaurId: dinosaur.id });
          }}
          onMoveEntrance={() => {
            if (!operations.entrance) return;
            preparePlacement();
            startPlacement({ type: 'entrance', id: operations.entrance.id });
          }}
          onBuildPlatform={() => {
            preparePlacement();
            startPlacement({ type: 'building', typeId: PARK_ADMISSION.platformTypeId });
          }}
          onCompletePlatform={(id) => {
            void completeBuilding.mutateAsync(id).catch(reportFailure);
          }}
          onShowBuildings={() => openPanel('building_list')}
          firstExpedition={firstExpedition.data}
          onExplore={() => {
            preparePlacement();
            navigate('/exploration');
          }}
          onClaimHatch={(id) => {
            void claimHatch.mutateAsync(id).catch(reportFailure);
          }}
          onShowResources={openResources}
          firstHybridExhibited={!!firstSynthesis.data?.job?.exhibitedAt}
          onShowGrowth={openGrowth}
          growthTrigger={growthTrigger}
          onFirstHybrid={() => {
            preparePlacement();
            navigate(
              firstSynthesis.data?.job?.exhibitedAt
                ? '/exploration?tab=repeat'
                : firstSynthesis.data?.job
                  ? '/exploration?tab=synthesis'
                  : '/exploration',
            );
          }}
        />
      ) : (
        <p role="status" className="shrink-0 bg-white p-3 text-sm text-green-900">
          운영 정보를 확인하고 있어요…
        </p>
      )}
      {dataError && (
        <div
          role="alert"
          className="flex shrink-0 items-center justify-between gap-3 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <p>파크 정보를 갱신하지 못했어요. {dataError.message}</p>
          <Button
            variant="ghost"
            className="min-h-11 shrink-0 text-sm"
            onClick={() => {
              claimStarter();
              void dinosaursQuery.refetch();
              void buildingsQuery.refetch();
              void operationsQuery.refetch();
              void firstExpedition.refetch();
            }}
          >
            다시 시도
          </Button>
        </div>
      )}
      <div
        ref={containerRef}
        role="region"
        aria-label="파크 지도"
        tabIndex={0}
        aria-describedby={isPlacing ? 'placement-help' : undefined}
        aria-busy={isPlacing && (!isPlacementReady || isSavingPlacement)}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget) handleMapKeyDown(event);
        }}
        data-testid="park-map"
        className="relative min-h-0 flex-1 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-900"
      >
        {(!isReady || isPending) && (
          <div
            role="status"
            className="absolute inset-0 z-30 flex items-center justify-center bg-sky-300 text-lg font-semibold text-sky-950"
          >
            파크를 준비하고 있어요…
          </div>
        )}
        {!isPlacing && operations?.isOpen && (
          <p className="pointer-events-none absolute bottom-2 left-3 z-10 rounded bg-white/90 px-2 py-1 text-[10px] text-green-950">
            지도 속 방문객은 관람 연출이에요
          </p>
        )}
        <div
          className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 rounded-xl bg-white p-1 text-green-950"
          aria-label="지도 확대와 축소"
        >
          <Button
            variant="ghost"
            className="min-h-11 min-w-11 text-xs"
            disabled={!isReady}
            aria-label="지도 확대"
            onClick={() => engine.setZoom(engine.getCameraState().zoom * 1.25)}
          >
            확대
          </Button>
          <Button
            variant="ghost"
            className="min-h-11 min-w-11 text-xs"
            disabled={!isReady}
            aria-label="지도 축소"
            onClick={() => engine.setZoom(engine.getCameraState().zoom * 0.8)}
          >
            축소
          </Button>
        </div>
        <ParkPanel dinosaurs={dinosaurs} buildings={buildings} onShowResources={openResources} />
        {!isPlacing && sidePanel === 'resources' && (
          <ResourcePanel
            onClose={closeSidePanel}
            onPlaceBuilding={(typeId) => {
              preparePlacement();
              startPlacement({ type: 'building', typeId });
            }}
          />
        )}
      </div>
      <div className="grid grid-cols-5 gap-1 border-t border-green-100 bg-white p-2 text-xs text-slate-700">
        <Button
          variant="ghost"
          className="min-h-11 min-w-0 px-1 text-xs sm:text-sm"
          onClick={() => openPanel('dinosaur_list')}
        >
          공룡 {dinosaurs.length}
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 min-w-0 px-1 text-xs sm:text-sm"
          onClick={() => openPanel('building_list')}
        >
          시설 {buildings.length}
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 min-w-0 px-1 text-xs sm:text-sm"
          onClick={openResources}
        >
          자원 시설
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 min-w-0 px-1 text-xs sm:text-sm"
          aria-pressed={showGrid}
          onClick={toggleGrid}
        >
          격자
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 min-w-0 px-1 text-xs sm:text-sm"
          onClick={() => {
            engine.fitPark();
          }}
        >
          전체 보기
        </Button>
      </div>
      {!isPlacing && sidePanel === 'growth' && (
        <ParkGrowthPanel
          isParkOpen={!!operations?.isOpen}
          onClose={() => {
            closeSidePanel();
            growthTrigger.current?.focus();
          }}
          onShowFacilities={() => openPanel('building_list')}
          onShowResources={openResources}
          onPrepareLab={() => {
            if (buildings.some((building) => building.typeId === FIRST_HYBRID_LAB_ID)) {
              openPanel('building_list');
            } else {
              preparePlacement();
              startPlacement({ type: 'building', typeId: FIRST_HYBRID_LAB_ID });
            }
          }}
        />
      )}
    </div>
  );
}
