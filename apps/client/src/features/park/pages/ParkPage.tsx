import { useCallback, useEffect, useRef, useState } from 'react';
import { getBuildingById, SECURITY_CENTER_TYPE_ID } from '@dino-park/game-data';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FIRST_HYBRID_LAB_ID,
  FIRST_HYBRID_SPECIES_ID,
  getParkLevelExperience,
  MAX_PARK_LEVEL,
  PARK_ADMISSION,
  PARK_SAFARI,
  PARK_SHUTTLE,
  type DinosaurResponse,
  type ParkGrowthStage,
} from '@dino-park/shared';
import { useGameEngine } from '@/hooks';
import { useAuthStore, useGameStore, useUIStore } from '@/stores';
import {
  useClaimStarterPark,
  useSetParkOpen,
  useCompleteBuilding,
  useFirstExpedition,
  useClaimHatchingEgg,
  useParkMe,
} from '@/api';
import { useFirstSynthesis } from '@/api/queries/hybridMilestone';
import { useParkShuttleAction } from '@/api/queries';
import { useResources } from '@/api/queries/resources';
import { useParkSafari } from '@/api/queries/safari';
import { Button } from '@/components/ui';
import { createRequestId } from '@/utils/requestId';
import {
  currentParkGrowthStage,
  isMidgameGrowthStage,
  parseParkGrowthStage,
  storyReturnHref,
} from '@/utils/parkGrowthNavigation';
import ParkPanel from '../components/ParkPanel';
import ParkOperationsPanel from '../components/ParkOperationsPanel';
import ParkShuttlePanel from '../components/ParkShuttlePanel';
import ResourcePanel from '../components/ResourcePanel';
import ParkGrowthPanel from '../components/ParkGrowthPanel';
import ParkMidgameGrowthPanel from '../components/ParkMidgameGrowthPanel';
import ExhibitPlacementPreview from '../components/ExhibitPlacementPreview';
import ParkHud, { ParkIcon, type ParkHudPanel } from '../components/ParkHud';
import ParkMeadowLink, { firstMeadowHref } from '../components/ParkMeadowLink';
import ParkHarvestMarkers from '../components/ParkHarvestMarkers';
import './ParkHud.css';
import './ParkPlacement.css';

const entranceDirections = {
  bottom: { arrow: '↙', label: '왼쪽 아래' },
  right: { arrow: '↘', label: '오른쪽 아래' },
  top: { arrow: '↗', label: '오른쪽 위' },
  left: { arrow: '↖', label: '왼쪽 위' },
};

export default function ParkPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const compareHybrid = params.get('compareHybrid');
  const returnToGrowth = params.get('panel') === 'growth';
  const requestedResourceTab = params.get('panel') === 'resources' ? params.get('tab') : null;
  const requestedFuelMission = requestedResourceTab === 'fuel' ? params.get('mission') : null;
  const requestedFuelSpot = requestedResourceTab === 'fuel' ? params.get('spot') : null;
  const [resourceTabFocus, setResourceTabFocus] = useState<'quality' | 'fuel'>();
  const [scoutReturnPath, setScoutReturnPath] = useState<string>();
  const requestedGrowthStage = parseParkGrowthStage(params.get('stage'));
  const returnChapter = params.get('returnChapter');
  const requestedFacility = returnChapter ? params.get('facility') : null;
  const requestedOperations = !!returnChapter && params.get('panel') === 'operations';
  const growthTrigger = useRef<HTMLButtonElement>(null);
  const shuttleTrigger = useRef<HTMLButtonElement>(null);
  const shuttlePurchase = useRef<string>();
  const [hudPanel, setHudPanel] = useState<ParkHudPanel | null>(null);
  const [showShuttle, setShowShuttle] = useState(false);
  const [showingIsland, setShowingIsland] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [productionFocus, setProductionFocus] = useState<string>();
  const { data: parkData } = useParkMe();
  const { data: safari } = useParkSafari((parkData?.level ?? 0) >= PARK_SAFARI.unlockParkLevel);
  const { data: resources } = useResources();
  const [growthStage, setGrowthStage] = useState<ParkGrowthStage>(5);
  const [admissionFocus, setAdmissionFocus] = useState<'research' | 'platform' | 'purchase' | null>(
    null,
  );
  const firstExpedition = useFirstExpedition();
  const firstSynthesis = useFirstSynthesis(firstExpedition.data?.stage === 'complete');
  const claimHatch = useClaimHatchingEgg();
  const {
    containerRef,
    placementPanelRef,
    isReady,
    error,
    engine,
    handleMapKeyDown,
    isPlacing,
    isSavingPlacement,
    isPlacementReady,
    targetTile,
    relocatingFacility,
    confirmPlacement,
    canConfirmPlacement,
    placementIssue,
    rotateEntrance,
    rotateBuilding,
    regularBuildingPlacement,
    isBuildingMirrored,
    dinosaursQuery,
    buildingsQuery,
    operationsQuery,
  } = useGameEngine(safari);
  const { cancelPlacement, startPlacement, placementData, showGrid, toggleGrid } = useGameStore();
  const {
    sidePanel,
    activeModal,
    openSidePanel,
    closeSidePanel,
    openModal,
    closeModal,
    showToast,
  } = useUIStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const parkIdentity = useAuthStore((state) => state.park);
  const operator = useAuthStore((state) => state.user);
  const currency = useAuthStore((state) => state.currency);
  const {
    mutate: claimStarter,
    isPending,
    isSuccess: starterReady,
    error: starterError,
  } = useClaimStarterPark();
  const setParkOpen = useSetParkOpen();
  const shuttleAction = useParkShuttleAction();
  const focusShuttleDestination = useCallback(
    (exhibitId: string | null) => engine.setShuttleFocus(exhibitId),
    [engine],
  );
  const completeBuilding = useCompleteBuilding();
  const loadedParkLevel = operationsQuery.data?.parkLevel ?? parkData?.level;
  const returnGrowthStage =
    requestedGrowthStage ??
    (loadedParkLevel === undefined ? undefined : currentParkGrowthStage(loadedParkLevel));
  const openGrowth = useCallback(
    (stage?: ParkGrowthStage) => {
      if (stage) setGrowthStage(stage);
      setAdmissionFocus(null);
      setHudPanel(null);
      cancelPlacement();
      closeModal();
      openSidePanel('growth');
    },
    [cancelPlacement, closeModal, openSidePanel],
  );
  useEffect(() => {
    if (isAuthenticated) claimStarter();
  }, [isAuthenticated, claimStarter]);

  useEffect(() => {
    if (!isAuthenticated || (requestedResourceTab !== 'quality' && requestedResourceTab !== 'fuel'))
      return;
    setResourceTabFocus(requestedResourceTab);
    setScoutReturnPath(
      requestedFuelMission && requestedFuelSpot
        ? `/exploration?${new URLSearchParams({ mission: requestedFuelMission, spot: requestedFuelSpot })}`
        : undefined,
    );
    setProductionFocus(undefined);
    setAdmissionFocus(null);
    setHudPanel(null);
    closeModal();
    cancelPlacement();
    openSidePanel('resources');
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('panel');
        next.delete('tab');
        if (requestedResourceTab === 'fuel') {
          next.delete('mission');
          next.delete('spot');
        }
        return next;
      },
      { replace: true },
    );
  }, [
    isAuthenticated,
    requestedResourceTab,
    requestedFuelMission,
    requestedFuelSpot,
    closeModal,
    cancelPlacement,
    openSidePanel,
    setParams,
  ]);

  useEffect(() => {
    if (isPlacing) {
      closeSidePanel();
      setHudPanel(null);
    }
    if (activeModal) setHudPanel(null);
  }, [activeModal, isPlacing, closeSidePanel]);

  useEffect(() => {
    if (!isAuthenticated || !returnToGrowth || compareHybrid || returnGrowthStage === undefined)
      return;
    openGrowth(returnGrowthStage);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('panel');
        next.delete('stage');
        return next;
      },
      { replace: true },
    );
  }, [isAuthenticated, returnToGrowth, returnGrowthStage, compareHybrid, openGrowth, setParams]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !buildingsQuery.data ||
      !operationsQuery.data ||
      (!requestedFacility && !requestedOperations)
    )
      return;
    cancelPlacement();
    closeModal();
    closeSidePanel();
    if (requestedFacility && getBuildingById(requestedFacility)) {
      const owned = buildingsQuery.data.buildings
        .filter(({ typeId }) => typeId === requestedFacility)
        .sort((a, b) => b.level - a.level)[0];
      setHudPanel(null);
      if (owned) openModal('building_detail', { buildingId: owned.id });
      else startPlacement({ type: 'building', typeId: requestedFacility });
    } else {
      setHudPanel('operations');
    }
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('facility');
        next.delete('panel');
        return next;
      },
      { replace: true },
    );
  }, [
    isAuthenticated,
    buildingsQuery.data,
    operationsQuery.data,
    requestedFacility,
    requestedOperations,
    cancelPlacement,
    closeModal,
    closeSidePanel,
    openModal,
    setParams,
    startPlacement,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !compareHybrid || !dinosaursQuery.data) return;
    const dinosaur = dinosaursQuery.data.dinosaurs.find(
      ({ id, speciesId }) => id === compareHybrid && speciesId === FIRST_HYBRID_SPECIES_ID,
    );
    if (dinosaur) {
      cancelPlacement();
      setHudPanel(null);
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
  const firstHybridExhibited = !!firstSynthesis.data?.job?.exhibitedAt;
  const dataError =
    starterError ||
    dinosaursQuery.error ||
    buildingsQuery.error ||
    operationsQuery.error ||
    firstExpedition.error;
  const openPanel = (type: 'dinosaur_list' | 'building_list' | 'exhibit_list') => {
    cancelPlacement();
    closeModal();
    setHudPanel(null);
    openSidePanel(type);
  };
  const preparePlacement = () => {
    if (showingIsland) {
      engine.fitPark();
      setShowingIsland(false);
    }
    setHudPanel(null);
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
    setResourceTabFocus(undefined);
    setScoutReturnPath(undefined);
    setHudPanel(null);
    setAdmissionFocus(null);
    setProductionFocus(undefined);
    cancelPlacement();
    closeModal();
    openSidePanel('resources');
  };
  const openExhibitCare = () => {
    const exhibitedIds = operations?.admission?.exhibitedDinosaurIds ?? [];
    const exhibits = dinosaurs.filter(({ id, isInPark }) => isInPark && exhibitedIds.includes(id));
    const exhibit =
      exhibits.find(({ speciesId }) => speciesId === FIRST_HYBRID_SPECIES_ID) ?? exhibits[0];
    if (!exhibit) {
      openPanel('dinosaur_list');
      return;
    }
    cancelPlacement();
    closeSidePanel();
    openModal('dinosaur_detail', { dinosaurId: exhibit.id });
  };
  const openAdmissionResearch = () => {
    if (operations?.admission?.entranceResearchCompleted && operations.entrance) {
      cancelPlacement();
      closeSidePanel();
      openModal('building_detail', { buildingId: operations.entrance.id });
      return;
    }
    openGrowth(5);
    setAdmissionFocus('research');
  };
  const openPlatformUpgrade = () => {
    openResources();
    setAdmissionFocus('platform');
  };
  const closeGrowth = () => {
    closeSidePanel();
    if (growthTrigger.current) growthTrigger.current.focus();
    else setHudPanel('operations');
  };
  const selectGrowthStage = (stage: ParkGrowthStage) => {
    setAdmissionFocus(null);
    setGrowthStage(stage);
  };
  const manageGrowthBuilding = (typeId: string) => {
    if (typeId === PARK_ADMISSION.platformTypeId && operations?.viewingPlatform) {
      openPlatformUpgrade();
      return;
    }

    const building = buildings
      .filter((item) => item.typeId === typeId)
      .sort((a, b) => b.level - a.level)[0];
    preparePlacement();
    if (building) openModal('building_detail', { buildingId: building.id });
    else startPlacement({ type: 'building', typeId });
  };
  const openGrowthFacility = () => {
    if (growthStage === 5) {
      openPanel('building_list');
      return;
    }
    if (growthStage === 6) {
      if (!operations || operations.viewingPlatform) openPlatformUpgrade();
      else {
        preparePlacement();
        startPlacement({ type: 'building', typeId: PARK_ADMISSION.platformTypeId });
      }
      return;
    }

    const securityCenter = buildings
      .filter((item) => item.typeId === SECURITY_CENTER_TYPE_ID)
      .sort((a, b) => b.level - a.level)[0];
    preparePlacement();
    if (securityCenter) {
      cancelPlacement();
      openModal('building_detail', { buildingId: securityCenter.id });
    } else {
      startPlacement({ type: 'building', typeId: SECURITY_CENTER_TYPE_ID });
    }
  };
  const buildingPlacement = placementData?.type === 'building';
  const placementBuilding = buildingPlacement
    ? getBuildingById(placementData.typeId ?? '')
    : undefined;
  const placementCost =
    placementBuilding?.baseCost ?? placementBuilding?.unlockCondition.cost.gold ?? 0;
  const firstHybridPlacement = placementData?.speciesId === FIRST_HYBRID_SPECIES_ID;
  const canAffordPlacement = !buildingPlacement || (operations?.gold ?? 0) >= placementCost;
  const placementTone =
    !isPlacementReady || isSavingPlacement
      ? 'pending'
      : canConfirmPlacement && canAffordPlacement
        ? 'available'
        : 'blocked';
  const platformImpact = operations?.admission?.platformImpact;
  const platformHabitat = buildings.find(({ id }) => id === platformImpact?.exhibitId);
  const habitatName = platformHabitat && getBuildingById(platformHabitat.typeId)?.nameKo;
  const platformExhibitName =
    platformHabitat &&
    buildings.some(
      ({ id, typeId }) => id !== platformHabitat.id && typeId === platformHabitat.typeId,
    )
      ? `${habitatName ?? '전시 구역'} (${platformHabitat.positionX}, ${platformHabitat.positionY})`
      : habitatName;
  const level = operations?.parkLevel ?? parkData?.level ?? parkIdentity?.level ?? 1;
  const expPercent =
    level >= MAX_PARK_LEVEL
      ? 100
      : parkData?.level === level
        ? Math.min(100, Math.max(0, (parkData.exp / getParkLevelExperience(level)) * 100))
        : 0;
  const builderTotal = firstSynthesis.data?.builderSlots ?? 1;
  const busyCount = buildings.filter(({ status }) =>
    ['CONSTRUCTING', 'UPGRADING'].includes(status.toUpperCase()),
  ).length;
  const showGuide =
    !!firstExpedition.data &&
    !firstHybridExhibited &&
    !guideDismissed &&
    !sidePanel &&
    !activeModal;
  const visiblePanel = isPlacing ? null : (hudPanel ?? (showGuide ? 'operations' : null));
  const showMapControls = !activeModal && !sidePanel && !visiblePanel;
  const expeditionStage = firstExpedition.data?.stage;
  const firstMeadowRelevant =
    expeditionStage === 'locked' || expeditionStage === 'available' || expeditionStage === 'reward';
  const toggleHudPanel = (panel: ParkHudPanel) => {
    closeSidePanel();
    closeModal();
    setGuideDismissed(true);
    setShowShuttle(false);
    setHudPanel(visiblePanel === panel ? null : panel);
  };
  const startPlatform = () => {
    preparePlacement();
    startPlacement({ type: 'building', typeId: PARK_ADMISSION.platformTypeId });
  };
  const entranceDirection = entranceDirections[targetTile.side ?? 'bottom'];
  const buildingRotationControl = regularBuildingPlacement && (
    <Button
      className="park-move__rotate min-h-11 text-sm"
      variant="secondary"
      aria-label="시설 방향 회전"
      aria-pressed={isBuildingMirrored}
      disabled={!isPlacementReady || isSavingPlacement}
      onClick={rotateBuilding}
    >
      <span className="park-move__arrow" aria-hidden="true">
        ↔
      </span>
      회전
    </Button>
  );

  return (
    <div className="park-world">
      {returnChapter && !isPlacing && !activeModal && sidePanel === null && (
        <Link
          className="park-hud__plate park-world__story-return"
          to={storyReturnHref(returnChapter, requestedGrowthStage)}
        >
          ← 스토리
        </Link>
      )}
      {isPlacing && relocatingFacility ? (
        <section aria-label="시설 이동">
          <button
            type="button"
            className="park-hud__plate park-move__cancel"
            aria-label="이동 취소"
            disabled={isSavingPlacement}
            onClick={cancelPlacement}
          >
            <ParkIcon name="close" />
          </button>
          <p id="placement-help" className="sr-only" role="status">
            {placementIssue ?? '시설을 새 위치까지 끌어 놓으세요.'}
          </p>
          <div className="park-move__actions">
            {placementData?.type === 'entrance' ? (
              <Button
                className="park-move__rotate min-h-11 text-sm"
                variant="secondary"
                aria-label="입구 방향 회전"
                aria-description={`현재 ${entranceDirection.label} 방향`}
                disabled={!isPlacementReady || isSavingPlacement}
                onClick={rotateEntrance}
              >
                <span className="park-move__arrow" aria-hidden="true">
                  {entranceDirection.arrow}
                </span>
                회전
              </Button>
            ) : (
              buildingRotationControl
            )}
            <Button
              className="park-move__confirm min-h-11 text-sm"
              disabled={!canConfirmPlacement}
              isLoading={isSavingPlacement}
              onClick={() => void confirmPlacement()}
            >
              이동
            </Button>
          </div>
        </section>
      ) : isPlacing ? (
        <section
          ref={placementPanelRef}
          id="placement-help"
          className="park-page__placement park-placement"
          aria-label="배치 안내"
          data-tone={placementTone}
        >
          <header className="park-placement__heading">
            <h1>
              {buildingPlacement
                ? `${placementBuilding?.nameKo ?? '시설'} 건설`
                : firstHybridPlacement
                  ? '스테고케라톱스 전시'
                  : '공룡 배치'}
            </h1>
            <button
              type="button"
              className="park-placement__close"
              aria-label="배치 취소"
              disabled={isSavingPlacement}
              onClick={cancelPlacement}
            >
              <ParkIcon name="close" />
            </button>
          </header>
          <div className="park-placement__body">
            <p className="park-placement__position">
              선택 ({targetTile.x}, {targetTile.y})
            </p>
            <p className="park-placement__instruction">
              {buildingPlacement
                ? '지도에서 시설을 놓을 위치를 고르세요.'
                : firstHybridPlacement
                  ? '관람길과 연결된 초식 하이브리드 서식지를 고르세요.'
                  : '지도에서 공룡을 놓을 칸을 고르세요.'}
            </p>
            <p className="park-placement__keys">방향키로 이동 · Enter로 확정 · Esc로 취소</p>
            {firstHybridExhibited && (
              <ExhibitPlacementPreview
                placement={isPlacementReady ? placementData : null}
                tile={targetTile}
                dinosaurs={dinosaurs}
                admissionPaused={!!operations?.isOpen && operations.goldVault?.admissionPaused}
              />
            )}
          </div>
          <footer className="park-placement__footer">
            <p className="park-placement__status" role="status">
              {isSavingPlacement
                ? '배치를 저장하고 있어요…'
                : !isPlacementReady
                  ? '지도를 준비하고 있어요…'
                  : !canAffordPlacement
                    ? '건설에 필요한 골드를 더 모아주세요.'
                    : canConfirmPlacement
                      ? '이 위치에 배치할 수 있어요.'
                      : (placementIssue ?? '겹치지 않는 위치와 길·테두리 연결을 확인해주세요.')}
            </p>
            <div className="park-placement__actions">
              {buildingRotationControl}
              <Button
                className="park-placement__confirm min-h-11 text-sm"
                disabled={isSavingPlacement || !canConfirmPlacement || !canAffordPlacement}
                isLoading={isSavingPlacement}
                onClick={() => void confirmPlacement()}
              >
                {buildingPlacement
                  ? `${placementBuilding?.nameKo ?? '시설'} 건설 · ${placementCost.toLocaleString()}골드`
                  : '공룡 배치 확정'}
              </Button>
            </div>
          </footer>
        </section>
      ) : operations && visiblePanel === 'operations' ? (
        <div
          className={`park-world__drawer park-world__drawer--operations park-panel-surface${showShuttle ? ' park-world__drawer--shuttle' : ''}`}
        >
          {showShuttle && operations.shuttle ? (
            <ParkShuttlePanel
              operations={{ ...operations, shuttle: operations.shuttle }}
              buildings={buildings}
              dinosaurs={dinosaurs}
              busy={shuttleAction.isPending || !!dataError}
              onBuy={async () => {
                // Retain the request key if the response is lost after the purchase commits.
                const requestId = (shuttlePurchase.current ??= createRequestId());
                await shuttleAction.mutateAsync({ kind: 'buy', request: { requestId } });
                shuttlePurchase.current = undefined;
              }}
              onRouteChange={(exhibitId, request) =>
                shuttleAction.mutateAsync({ kind: 'route', exhibitId, request })
              }
              onDestinationFocus={focusShuttleDestination}
              onBack={() => {
                setShowShuttle(false);
                requestAnimationFrame(() => shuttleTrigger.current?.focus());
              }}
              onClose={() => toggleHudPanel('operations')}
            />
          ) : (
            <ParkOperationsPanel
              operations={operations}
              dinosaurs={dinosaurs}
              onClose={() => toggleHudPanel('operations')}
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
              onRecoverEntrance={
                starterReady && !operationsQuery.isFetching && !operations.entrance
                  ? () => claimStarter()
                  : undefined
              }
              onBuildPlatform={startPlatform}
              onCompletePlatform={(id) => {
                void completeBuilding.mutateAsync(id).catch(reportFailure);
              }}
              onShowBuildings={() => openPanel('building_list')}
              firstExpedition={firstExpedition.data}
              onExplore={() => {
                preparePlacement();
                navigate(firstMeadowRelevant ? firstMeadowHref : '/exploration');
              }}
              onClaimHatch={(id) => {
                void claimHatch.mutateAsync(id).catch(reportFailure);
              }}
              onShowResources={openResources}
              onPurchaseResources={() => {
                openResources();
                setAdmissionFocus('purchase');
              }}
              firstHybridExhibited={firstHybridExhibited}
              onManageDemand={openExhibitCare}
              onManageEntrance={openAdmissionResearch}
              onManageExhibits={() => openPanel('exhibit_list')}
              onViewPlatformUpgrade={openPlatformUpgrade}
              platformExhibitName={platformExhibitName}
              onShowGrowth={() => openGrowth(currentParkGrowthStage(operations.parkLevel))}
              growthTrigger={growthTrigger}
              onShowShuttle={
                operations.shuttle &&
                (operations.parkLevel >= PARK_SHUTTLE.minimumParkLevel - 1 ||
                  operations.shuttle.ownedBusCount > 0)
                  ? () => setShowShuttle(true)
                  : undefined
              }
              shuttleTrigger={shuttleTrigger}
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
          )}
        </div>
      ) : null}
      {dataError && (
        <div
          role="alert"
          className="park-world__error flex items-center justify-between gap-3 bg-red-50 px-3 py-2 text-sm text-red-800"
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
        aria-describedby={
          isPlacing ? 'placement-help' : operations?.isOpen ? 'park-map-visitors' : undefined
        }
        aria-busy={isPlacing && (!isPlacementReady || isSavingPlacement)}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget) handleMapKeyDown(event);
        }}
        data-testid="park-map"
        className="park-page__map absolute inset-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-900"
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
          <p id="park-map-visitors" className="sr-only">
            {operations.admission?.exhibits.some(({ visitors }) => visitors !== undefined)
              ? '전시 앞에 손님이 모여요. 주황색 느낌표는 대기 줄이에요.'
              : '지도 속 방문객은 관람 연출이에요'}
          </p>
        )}
        {showMapControls && isReady && firstMeadowRelevant && !isPlacing && (
          <ParkMeadowLink engine={engine} mapRef={containerRef} />
        )}
        {showMapControls && isReady && !isPlacing && resources && (
          <ParkHarvestMarkers
            engine={engine}
            mapRef={containerRef}
            buildings={buildings}
            facilities={resources.facilities}
          />
        )}
        {showMapControls && (
          <div className="park-hud__plate park-hud__zoom" aria-label="지도 확대와 축소">
            <button
              type="button"
              disabled={!isReady}
              aria-label="지도 확대"
              onClick={() => engine.setZoom(engine.getCameraState().zoom * 1.25)}
            >
              <ParkIcon name="plus" />
            </button>
            <button
              type="button"
              disabled={!isReady}
              aria-label="지도 축소"
              onClick={() => engine.setZoom(engine.getCameraState().zoom * 0.8)}
            >
              <ParkIcon name="minus" />
            </button>
            <button
              type="button"
              disabled={!isReady || isPlacing}
              aria-label={showingIsland ? '내 파크로 돌아가기' : '섬 전체 보기'}
              title={showingIsland ? '내 파크로 돌아가기' : '섬 전체 보기'}
              onClick={() => {
                if (showingIsland) engine.fitPark();
                else engine.fitIsland();
                setShowingIsland(!showingIsland);
              }}
            >
              <ParkIcon name={showingIsland ? 'home' : 'fit'} />
            </button>
          </div>
        )}
        <ParkPanel
          dinosaurs={dinosaurs}
          buildings={buildings}
          operations={operations}
          resources={resources}
          onShowResources={openResources}
          onShowPlatformUpgrade={openPlatformUpgrade}
          onShowProduction={(id) => {
            openResources();
            setProductionFocus(id);
          }}
          onReturnToGrowth={growthStage === 5 ? undefined : () => openGrowth(growthStage)}
        />
        {!isPlacing && sidePanel === 'resources' && (
          <ResourcePanel
            onClose={closeSidePanel}
            focusPlatformUpgrade={admissionFocus === 'platform'}
            focusPurchase={admissionFocus === 'purchase'}
            focusQuality={resourceTabFocus === 'quality'}
            focusFuel={resourceTabFocus === 'fuel'}
            scoutReturnPath={scoutReturnPath}
            focusProduction={productionFocus}
            admissionImpact={firstHybridExhibited ? platformImpact : null}
            platformExhibitName={platformExhibitName}
            isParkOpen={!!operations?.isOpen}
            admissionPaused={operations?.goldVault?.admissionPaused}
            onPlaceBuilding={(typeId) => {
              preparePlacement();
              startPlacement({ type: 'building', typeId });
            }}
          />
        )}
      </div>
      {!relocatingFacility && (
        <ParkHud
          level={level}
          expPercent={expPercent}
          isOpen={operations?.isOpen}
          operationAlerts={
            operations
              ? (operations.canOpen ? 0 : Math.max(1, operations.openingRequirements.length)) +
                Number(!!operations.goldVault?.admissionPaused)
              : 0
          }
          gold={operations?.gold ?? resources?.gold ?? currency?.gold}
          goldCapacity={operations?.goldVault?.capacity}
          inventory={resources?.inventory}
          builders={{ available: Math.max(0, builderTotal - busyCount), total: builderTotal }}
          panel={visiblePanel}
          isPlacing={isPlacing}
          onPanel={toggleHudPanel}
          onResources={openResources}
        />
      )}
      {visiblePanel === 'leader' && (
        <section
          className="park-world__drawer park-world__drawer--leader park-hud__plate"
          aria-label="파크 리더 정보"
        >
          <h2>파크 리더</h2>
          <button
            type="button"
            className="park-world__close"
            aria-label="파크 리더 닫기"
            onClick={() => toggleHudPanel('leader')}
          >
            <ParkIcon name="close" />
          </button>
          <dl className="park-hud__leader-info">
            <div>
              <dt>운영 책임자</dt>
              <dd>{operator?.nickname ?? '사육사'}</dd>
            </div>
            <div>
              <dt>파크</dt>
              <dd>{parkData?.name ?? parkIdentity?.name ?? '다이노 파크'}</dd>
            </div>
            <div>
              <dt>파크 레벨</dt>
              <dd>Lv.{level}</dd>
            </div>
          </dl>
        </section>
      )}
      {(visiblePanel === 'build' || visiblePanel === 'menu') && (
        <section
          className="park-world__drawer park-world__drawer--quick park-hud__plate"
          aria-label={visiblePanel === 'build' ? '건설 메뉴' : '파크 메뉴'}
        >
          <h2>{visiblePanel === 'build' ? '건설' : '파크 메뉴'}</h2>
          <button
            type="button"
            className="park-world__close"
            aria-label="파크 메뉴 닫기"
            onClick={() => toggleHudPanel(visiblePanel)}
          >
            <ParkIcon name="close" />
          </button>
          <div className="park-hud__quick-items">
            {visiblePanel === 'build' ? (
              <>
                {firstHybridExhibited && (
                  <button type="button" onClick={() => openPanel('exhibit_list')}>
                    서식지 건설
                  </button>
                )}
                {operations?.firstVisitorsGoal.rewarded && !operations.viewingPlatform && (
                  <button type="button" onClick={startPlatform}>
                    관람대 짓기
                  </button>
                )}
                <button type="button" onClick={openResources}>
                  자원 시설
                </button>
                <button type="button" onClick={() => openPanel('building_list')}>
                  보유 시설
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => openPanel('dinosaur_list')}>
                  내 공룡
                </button>
                <Link to="/park/safari">사파리 관리</Link>
                <Link to="/park/safari-preview">사파리 시범 관람</Link>
                <Link to="/park/3d-preview">스테고사우루스 3D 관람</Link>
                <Link to="/story">스토리</Link>
                <Link to="/shop">상점</Link>
                <Link to="/">홈</Link>
                <button type="button" aria-pressed={showGrid} onClick={toggleGrid}>
                  격자
                </button>
              </>
            )}
          </div>
        </section>
      )}
      {!isPlacing &&
        sidePanel === 'growth' &&
        (isMidgameGrowthStage(growthStage) ? (
          <ParkMidgameGrowthPanel
            key={growthStage}
            stage={growthStage}
            onStageChange={selectGrowthStage}
            onClose={closeGrowth}
            onManageBuilding={manageGrowthBuilding}
            onShowOperations={() => toggleHudPanel('operations')}
          />
        ) : (
          <ParkGrowthPanel
            key={growthStage}
            isParkOpen={!!operations?.isOpen}
            canRepeatSynthesis={firstHybridExhibited}
            stage={growthStage}
            onStageChange={selectGrowthStage}
            focusEntranceResearch={growthStage === 5 && admissionFocus === 'research'}
            onClose={closeGrowth}
            onShowFacilities={openGrowthFacility}
            onShowExhibits={() => openPanel('exhibit_list')}
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
        ))}
    </div>
  );
}
