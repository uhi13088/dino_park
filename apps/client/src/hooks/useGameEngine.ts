import { useEffect, useMemo, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { gameEngine, gridToScreen, ISO_CONFIG, type GameEngineEvents } from '@/game';
import { useGameStore, useUIStore } from '@/stores';
import { getBuildingById } from '@dino-park/game-data';
import { suggestDinosaurPlacement } from '@/game/logic/placement';
import {
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
  getSafariOccupiedTiles,
  resolveParkEntranceSide,
  type ParkEntranceSide,
  type ParkSafariResponse,
} from '@dino-park/shared';
import {
  useDinosaurs,
  useBuildings,
  usePlaceDinosaur,
  useParkMe,
  useParkOperations,
  useCreateBuilding,
  useMoveBuilding,
  useMoveParkEntrance,
} from '@/api';

type Tile = { x: number; y: number };
type PlacementTile = Tile & { side?: ParkEntranceSide };
type Footprint = { width: number; height: number };
const ONE_TILE: Footprint = { width: 1, height: 1 };

function nearestEntranceTile(
  side: 'bottom' | 'right',
  from: Tile,
  maxX: number,
  maxY: number,
  placementProblem: (tile: Tile) => string | null,
): Tile | null {
  let nearest: Tile | null = null;
  let bestDistance = Infinity;
  for (let index = 0; index <= (side === 'bottom' ? maxX : maxY); index++) {
    const tile = side === 'bottom' ? { x: index, y: maxY } : { x: maxX, y: index };
    const distance = Math.abs(tile.x - from.x) + Math.abs(tile.y - from.y);
    if (distance >= bestDistance || placementProblem(tile)) continue;
    nearest = tile;
    bestDistance = distance;
  }
  return nearest;
}

function keepPlacementInView(
  map: HTMLElement | null,
  panel: HTMLElement | null,
  tile: Tile,
  footprint: Footprint,
): void {
  if (!map || !panel || map.clientWidth <= map.clientHeight) return;

  const mapBounds = map.getBoundingClientRect();
  const left = panel.getBoundingClientRect().right - mapBounds.left + 12;
  const right = mapBounds.width - 56;
  const top = 56;
  const bottom = mapBounds.height - 12;
  const diagonal = (footprint.width + footprint.height) / 2;
  const halfWidth = (diagonal * ISO_CONFIG.TILE_WIDTH) / 2;
  const halfHeight = (diagonal * ISO_CONFIG.TILE_HEIGHT) / 2;
  const camera = gameEngine.getCameraState();
  const zoom = Math.min(
    camera.zoom,
    (right - left) / (2 * halfWidth),
    (bottom - top) / (2 * halfHeight),
  );
  if (zoom < 0.2) return;

  const center = gridToScreen(
    tile.x + (footprint.width - 1) / 2,
    tile.y + (footprint.height - 1) / 2,
  );
  const screenX = mapBounds.width / 2 + (center.x - camera.x) * zoom;
  const screenY = mapBounds.height / 2 + (center.y - camera.y) * zoom;
  const offsetX = Math.max(left + halfWidth * zoom, Math.min(right - halfWidth * zoom, screenX));
  const offsetY = Math.max(top + halfHeight * zoom, Math.min(bottom - halfHeight * zoom, screenY));

  if (zoom < camera.zoom) gameEngine.setZoom(zoom);
  if (Math.abs(screenX - offsetX) < 0.5 && Math.abs(screenY - offsetY) < 0.5) return;
  gameEngine.moveCamera(
    camera.x + (screenX - offsetX) / zoom,
    camera.y + (screenY - offsetY) / zoom,
  );
}

/** The API owns park state; the renderer only mirrors successful server responses. */
export function useGameEngine(safari?: ParkSafariResponse) {
  const containerRef = useRef<HTMLDivElement>(null);
  const placementPanelRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [targetTile, setTargetTile] = useState<PlacementTile>({ x: 9, y: 9 });
  const [isBuildingMirrored, setIsBuildingMirrored] = useState(false);
  const placementInFlight = useRef(false);
  const mounted = useRef(true);
  const [preparedPlacement, setPreparedPlacement] = useState<unknown>(null);
  const { selectEntity, mode, placementData, cancelPlacement, showGrid } = useGameStore();
  const { openModal, showToast } = useUIStore();
  const dinosaursQuery = useDinosaurs();
  const buildingsQuery = useBuildings();
  const { data: park } = useParkMe();
  const operationsQuery = useParkOperations();
  const { data: operations } = operationsQuery;
  const { mutateAsync: placeDinosaur, isPending: placingDinosaur } = usePlaceDinosaur();
  const { mutateAsync: createBuilding, isPending: creatingBuilding } = useCreateBuilding();
  const { mutateAsync: moveBuilding, isPending: movingBuilding } = useMoveBuilding();
  const { mutateAsync: moveEntrance, isPending: movingEntrance } = useMoveParkEntrance();
  const isPlacing = ['place_dinosaur', 'place_building', 'place_entrance'].includes(mode);
  const isSavingPlacement = placingDinosaur || creatingBuilding || movingBuilding || movingEntrance;
  const gridWidth = park?.gridSizeX ?? 20,
    gridHeight = park?.gridSizeY ?? 20;
  const movingParkEntrance = placementData?.type === 'entrance';
  const typeId = movingParkEntrance ? PARK_ADMISSION.entranceTypeId : placementData?.typeId;
  const regularBuildingPlacement =
    placementData?.type === 'building' && typeId !== PARK_ADMISSION.entranceTypeId;
  const relocatingFacility =
    movingParkEntrance || (placementData?.type === 'building' && !!placementData.id);
  const footprint = getBuildingById(typeId ?? '')?.size ?? ONE_TILE;
  const movedBuilding = relocatingFacility
    ? buildingsQuery.data?.buildings.find(({ id }) => id === placementData.id)
    : undefined;
  const savedBuildingMirrored = regularBuildingPlacement && !!movedBuilding?.isMirrored;
  const entrance = operations?.entrance;
  const safariTiles = useMemo(
    () => (safari ? getSafariOccupiedTiles(safari.layout, safari.tour?.path) : []),
    [safari],
  );
  const moveFromX = movingParkEntrance ? entrance?.x : movedBuilding?.positionX;
  const moveFromY = movingParkEntrance ? entrance?.y : movedBuilding?.positionY;
  const entranceSideAt = useCallback(
    (position: Tile, preferredSide?: ParkEntranceSide | null) =>
      resolveParkEntranceSide(
        gridWidth,
        gridHeight,
        { x: position.x, y: position.y, ...footprint },
        preferredSide,
      ),
    [gridWidth, gridHeight, footprint],
  );
  const moveFromSide =
    movingParkEntrance && entrance
      ? (entranceSideAt(entrance, entrance.side) ?? undefined)
      : undefined;
  const placementAt = useCallback(
    (position: Tile, previousSide?: ParkEntranceSide): PlacementTile => {
      if (!movingParkEntrance) return position;
      return { ...position, side: entranceSideAt(position, previousSide) ?? previousSide };
    },
    [movingParkEntrance, entranceSideAt],
  );

  const placementProblem = useCallback(
    (position: Tile): string | null => {
      const width = placementData?.type === 'dinosaur' ? 1 : footprint.width;
      const height = placementData?.type === 'dinosaur' ? 1 : footprint.height;
      if (
        !Number.isInteger(position.x) ||
        !Number.isInteger(position.y) ||
        position.x < 0 ||
        position.y < 0 ||
        position.x + width > gridWidth ||
        position.y + height > gridHeight
      ) {
        return '파크 테두리 안의 칸을 선택해주세요.';
      }
      if (
        safariTiles.some(
          ({ x, y }) =>
            x >= position.x && x < position.x + width && y >= position.y && y < position.y + height,
        )
      ) {
        return '사파리 우리나 지프길 밖의 빈칸을 선택해주세요.';
      }
      if (placementData?.type === 'dinosaur') {
        if (placementData.speciesId !== FIRST_HYBRID_SPECIES_ID) return null;
        const habitat = buildingsQuery.data?.buildings.find((building) => {
          const size = getBuildingById(building.typeId)?.size ?? { width: 1, height: 1 };
          return (
            building.typeId === FIRST_HYBRID_HABITAT_ID &&
            building.status.toUpperCase() === 'ACTIVE' &&
            position.x >= building.positionX &&
            position.x < building.positionX + size.width &&
            position.y >= building.positionY &&
            position.y < building.positionY + size.height
          );
        });
        if (!habitat) return '완공된 초식 하이브리드 서식지 안의 빈칸을 선택해주세요.';
        if (!operations?.isOpen) return '파크를 개장한 뒤 관람객에게 소개해주세요.';
        return null;
      }
      if (movingParkEntrance && !entranceSideAt(position)) {
        return '입구의 한쪽 면을 파크 테두리에 붙여주세요.';
      }
      const overlaps = (x: number, y: number, w: number, h: number) =>
        position.x < x + w &&
        position.x + width > x &&
        position.y < y + h &&
        position.y + height > y;
      for (const building of buildingsQuery.data?.buildings ?? []) {
        if (placementData?.id === building.id) continue;
        const size = getBuildingById(building.typeId)?.size ?? { width: 1, height: 1 };
        if (overlaps(building.positionX, building.positionY, size.width, size.height))
          return '다른 시설과 겹치지 않는 칸을 선택해주세요.';
      }
      for (const dinosaur of dinosaursQuery.data?.dinosaurs ?? []) {
        if (dinosaur.isInPark && overlaps(dinosaur.positionX, dinosaur.positionY, 1, 1))
          return '공룡이 없는 칸을 선택해주세요.';
      }
      return null;
    },
    [
      placementData,
      footprint.width,
      footprint.height,
      gridWidth,
      gridHeight,
      safariTiles,
      buildingsQuery.data,
      dinosaursQuery.data,
      operations?.isOpen,
      movingParkEntrance,
      entranceSideAt,
    ],
  );
  const placementIssue = placementProblem(targetTile);
  const isPlacementReady = isReady && isPlacing && preparedPlacement === placementData;
  const samePosition = targetTile.x === moveFromX && targetTile.y === moveFromY;
  const alreadyThere =
    samePosition &&
    (!movingParkEntrance || targetTile.side === moveFromSide) &&
    (!regularBuildingPlacement || isBuildingMirrored === savedBuildingMirrored);
  const canConfirmPlacement =
    isPlacementReady && !placementIssue && !isSavingPlacement && !alreadyThere;

  const savePlacement = useCallback(
    async (position: PlacementTile) => {
      if (!placementData || placementInFlight.current || alreadyThere) return;
      if (!isPlacementReady) {
        showToast({
          type: 'info',
          message: '지도와 배치 위치를 준비하고 있어요. 잠시 기다려주세요.',
        });
        return;
      }
      const issue = placementProblem(position);
      if (issue) {
        showToast({ type: 'error', message: issue });
        return;
      }
      placementInFlight.current = true;
      try {
        if (placementData.type === 'dinosaur' && placementData.id) {
          const dinosaur = await placeDinosaur({
            id: placementData.id,
            positionX: position.x,
            positionY: position.y,
          });
          if (!mounted.current) return;
          cancelPlacement();
          showToast({
            type: 'success',
            message:
              dinosaur.speciesId === FIRST_HYBRID_SPECIES_ID
                ? '스테고케라톱스를 파크에 전시했어요!'
                : dinosaur.hunger === 0 && dinosaur.happiness >= 80
                  ? '건강한 공룡을 배치했어요. 손님이 새 친구를 관람할 수 있어요!'
                  : '공룡을 배치했어요. 공룡을 눌러 먹이를 주세요!',
          });
          selectEntity({ type: 'dinosaur', id: dinosaur.id });
          openModal('dinosaur_detail', { dinosaurId: dinosaur.id });
        } else if (placementData.type === 'building' && placementData.typeId) {
          const coordinates = {
            positionX: position.x,
            positionY: position.y,
            ...(isBuildingMirrored !== savedBuildingMirrored && { isMirrored: isBuildingMirrored }),
          };
          if (placementData.id) await moveBuilding({ id: placementData.id, ...coordinates });
          else await createBuilding({ typeId: placementData.typeId, ...coordinates });
          if (!mounted.current) return;
          cancelPlacement();
          const name = getBuildingById(placementData.typeId)?.nameKo ?? '시설';
          showToast({
            type: 'success',
            message: placementData.id
              ? samePosition
                ? `${name} 방향을 바꿨어요.`
                : `${name} 위치를 옮겼어요.`
              : `${name} 공사를 시작했어요.`,
          });
        } else if (placementData.type === 'entrance') {
          await moveEntrance({
            positionX: position.x,
            positionY: position.y,
            side: position.side,
          });
          if (!mounted.current) return;
          cancelPlacement();
          showToast({
            type: 'success',
            message: '입구를 무료로 옮겼어요. 기본 관람길도 연결했어요.',
          });
        }
      } catch (cause) {
        if (mounted.current)
          showToast({
            type: 'error',
            message:
              cause instanceof Error ? cause.message : '배치하지 못했어요. 다시 시도해주세요.',
          });
      } finally {
        placementInFlight.current = false;
      }
    },
    [
      placementData,
      isPlacementReady,
      placementProblem,
      alreadyThere,
      samePosition,
      isBuildingMirrored,
      savedBuildingMirrored,
      placeDinosaur,
      createBuilding,
      moveBuilding,
      moveEntrance,
      cancelPlacement,
      selectEntity,
      openModal,
      showToast,
    ],
  );

  const confirmPlacement = useCallback(
    () => savePlacement(targetTile),
    [savePlacement, targetTile],
  );
  const rotateEntrance = () => {
    if (!movingParkEntrance || !isPlacementReady || placementInFlight.current) return;
    const nextSide = targetTile.side === 'right' || targetTile.side === 'left' ? 'bottom' : 'right';
    const tile = nearestEntranceTile(
      nextSide,
      targetTile,
      gridWidth - footprint.width,
      gridHeight - footprint.height,
      placementProblem,
    );
    if (!tile) {
      const edge = nextSide === 'bottom' ? '아래쪽' : '오른쪽';
      showToast({ type: 'info', message: `${edge} 테두리에 입구를 놓을 빈자리가 없어요.` });
      return;
    }
    setTargetTile({ ...tile, side: nextSide });
    const center = gridToScreen(
      tile.x + (footprint.width - 1) / 2,
      tile.y + (footprint.height - 1) / 2,
    );
    gameEngine.moveCamera(center.x, center.y);
  };
  const rotateBuilding = () => {
    if (!regularBuildingPlacement || !isPlacementReady || placementInFlight.current) return;
    setIsBuildingMirrored((previous) => !previous);
  };
  const handleTileClick = useCallback(
    ({ gridX, gridY }: GameEngineEvents['tile:click']) => {
      if (!isPlacing) {
        selectEntity(null);
        return;
      }
      if (placementInFlight.current) return;
      setTargetTile((previous) => placementAt({ x: gridX, y: gridY }, previous.side));
    },
    [isPlacing, selectEntity, placementAt],
  );

  const handleEntityClick = useCallback(
    ({ type, id }: GameEngineEvents['entity:click']) => {
      selectEntity({ type, id });
      openModal(
        type === 'dinosaur' ? 'dinosaur_detail' : 'building_detail',
        type === 'dinosaur' ? { dinosaurId: id } : { buildingId: id },
      );
    },
    [selectEntity, openModal],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    mounted.current = true;
    setIsReady(false);
    setError(null);
    gameEngine
      .initialize(container)
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause);
      });
    return () => {
      cancelled = true;
      mounted.current = false;
      gameEngine.destroy();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    gameEngine.on('tile:click', handleTileClick);
    gameEngine.on('placement:move', handleTileClick);
    gameEngine.on('entity:click', handleEntityClick);
    return () => {
      gameEngine.off('tile:click', handleTileClick);
      gameEngine.off('placement:move', handleTileClick);
      gameEngine.off('entity:click', handleEntityClick);
    };
  }, [handleTileClick, handleEntityClick, isReady]);

  useEffect(() => {
    if (isReady && dinosaursQuery.data) gameEngine.syncDinosaurs(dinosaursQuery.data.dinosaurs);
  }, [isReady, dinosaursQuery.data]);
  useEffect(() => {
    if (isReady && buildingsQuery.data) gameEngine.syncBuildings(buildingsQuery.data.buildings);
  }, [isReady, buildingsQuery.data]);
  useEffect(() => {
    if (isReady && operations) gameEngine.syncPark(gridWidth, gridHeight, operations);
  }, [isReady, operations, gridWidth, gridHeight]);
  useEffect(() => {
    if (isReady && safari) gameEngine.syncSafari(safari);
  }, [isReady, safari]);

  useEffect(() => {
    if (!placementData) {
      setPreparedPlacement(null);
      setIsBuildingMirrored(false);
      return;
    }
    if (
      !isReady ||
      !park ||
      !dinosaursQuery.data ||
      !buildingsQuery.data ||
      placementData === preparedPlacement
    )
      return;
    let initialTarget: Tile;
    if (moveFromX !== undefined && moveFromY !== undefined)
      initialTarget = { x: moveFromX, y: moveFromY };
    else if (placementData.type === 'entrance' && operations?.suggestedEntrance)
      initialTarget = operations.suggestedEntrance;
    else if (placementData.type === 'dinosaur') {
      const dinosaur = dinosaursQuery.data?.dinosaurs.find((dino) => dino.id === placementData.id);
      initialTarget = suggestDinosaurPlacement(
        dinosaur ?? {
          id: placementData.id ?? '',
          speciesId: placementData.speciesId ?? 'parasaurolophus',
          positionX: 9,
          positionY: 9,
          isInPark: false,
        },
        buildingsQuery.data?.buildings ?? [],
        dinosaursQuery.data?.dinosaurs ?? [],
        gridWidth,
        gridHeight,
      );
    } else if (placementData.type === 'building' && placementData.id) {
      initialTarget = { x: 12, y: 10 };
    } else {
      const candidates = Array.from({ length: gridWidth * gridHeight }, (_, i) => ({
        x: i % gridWidth,
        y: Math.floor(i / gridWidth),
      }));
      candidates.sort(
        (a, b) => Math.abs(a.x - 12) + Math.abs(a.y - 10) - Math.abs(b.x - 12) - Math.abs(b.y - 10),
      );
      initialTarget = candidates.find((tile) => !placementProblem(tile)) ?? { x: 12, y: 10 };
    }
    setTargetTile(placementAt(initialTarget, moveFromSide));
    setIsBuildingMirrored(savedBuildingMirrored);
    setPreparedPlacement(placementData);
    const width = placementData.type === 'dinosaur' ? 1 : footprint.width;
    const height = placementData.type === 'dinosaur' ? 1 : footprint.height;
    const x = initialTarget.x + (width - 1) / 2;
    const y = initialTarget.y + (height - 1) / 2;
    if (relocatingFacility) {
      const center = gridToScreen(x, y);
      gameEngine.moveCamera(center.x, center.y);
    } else {
      gameEngine.focusTile(x, y);
    }
  }, [
    isReady,
    placementData,
    preparedPlacement,
    park,
    operations,
    moveFromX,
    moveFromY,
    moveFromSide,
    savedBuildingMirrored,
    relocatingFacility,
    dinosaursQuery.data,
    buildingsQuery.data,
    gridWidth,
    gridHeight,
    footprint.width,
    footprint.height,
    placementProblem,
    placementAt,
  ]);

  useEffect(() => {
    if (!isReady) return;
    gameEngine.setPlacementMode(
      isPlacing,
      isPlacementReady && relocatingFacility ? (placementData.id ?? null) : null,
    );
    gameEngine.setShowGrid(!relocatingFacility && (showGrid || isPlacing));
    if (isPlacing) {
      if (typeId) {
        if (regularBuildingPlacement) {
          gameEngine.previewBuilding(
            typeId,
            targetTile,
            !placementIssue,
            undefined,
            isPlacementReady ? isBuildingMirrored : savedBuildingMirrored,
          );
        } else {
          gameEngine.previewBuilding(typeId, targetTile, !placementIssue, targetTile.side);
        }
        if (isPlacementReady && !relocatingFacility) {
          keepPlacementInView(
            containerRef.current,
            placementPanelRef.current,
            targetTile,
            footprint,
          );
        }
      } else {
        gameEngine.highlightTile(targetTile.x, targetTile.y);
      }
    }
  }, [
    isReady,
    isPlacing,
    isPlacementReady,
    targetTile,
    typeId,
    footprint,
    placementIssue,
    showGrid,
    relocatingFacility,
    placementData,
    regularBuildingPlacement,
    isBuildingMirrored,
    savedBuildingMirrored,
  ]);
  useEffect(() => {
    if (isPlacing) containerRef.current?.focus({ preventScroll: true });
  }, [isPlacing]);

  const handleMapKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isPlacing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!placementInFlight.current) cancelPlacement();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void confirmPlacement();
      return;
    }
    const offsets: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    if (!placementInFlight.current)
      setTargetTile(({ x, y, side }) =>
        placementAt(
          {
            x: Math.max(0, Math.min(gridWidth - 1, x + offset[0])),
            y: Math.max(0, Math.min(gridHeight - 1, y + offset[1])),
          },
          side,
        ),
      );
  };

  return {
    containerRef,
    placementPanelRef,
    isReady,
    error,
    engine: gameEngine,
    handleMapKeyDown,
    isPlacing,
    isSavingPlacement,
    isPlacementReady,
    targetTile,
    placementData,
    relocatingFacility,
    canConfirmPlacement,
    placementIssue,
    confirmPlacement,
    rotateEntrance,
    rotateBuilding,
    regularBuildingPlacement,
    isBuildingMirrored,
    dinosaursQuery,
    buildingsQuery,
    operationsQuery,
  };
}
