import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { gameEngine, type GameEngineEvents } from '@/game';
import { useGameStore, useUIStore } from '@/stores';
import { getBuildingById } from '@dino-park/game-data';
import { suggestDinosaurPlacement } from '@/game/logic/placement';
import {
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
} from '@dino-park/shared';
import {
  useDinosaurs,
  useBuildings,
  usePlaceDinosaur,
  useParkMe,
  useParkOperations,
  useCreateBuilding,
  useMoveParkEntrance,
} from '@/api';

type Tile = { x: number; y: number };

/** The API owns park state; the renderer only mirrors successful server responses. */
export function useGameEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [targetTile, setTargetTile] = useState<Tile>({ x: 9, y: 9 });
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
  const { mutateAsync: moveEntrance, isPending: movingEntrance } = useMoveParkEntrance();
  const isPlacing = ['place_dinosaur', 'place_building', 'place_entrance'].includes(mode);
  const isSavingPlacement = placingDinosaur || creatingBuilding || movingEntrance;
  const gridWidth = park?.gridSizeX ?? 20,
    gridHeight = park?.gridSizeY ?? 20;
  const typeId =
    placementData?.type === 'entrance' ? PARK_ADMISSION.entranceTypeId : placementData?.typeId;
  const footprint = getBuildingById(typeId ?? '')?.size ?? { width: 1, height: 1 };

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
      if (
        placementData?.type === 'entrance' &&
        position.x !== 0 &&
        position.y !== 0 &&
        position.x + width !== gridWidth &&
        position.y + height !== gridHeight
      ) {
        return '입구의 한쪽 면을 파크 테두리에 붙여주세요.';
      }
      const overlaps = (x: number, y: number, w: number, h: number) =>
        position.x < x + w &&
        position.x + width > x &&
        position.y < y + h &&
        position.y + height > y;
      for (const building of buildingsQuery.data?.buildings ?? []) {
        if (placementData?.type === 'entrance' && building.id === placementData.id) continue;
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
      buildingsQuery.data,
      dinosaursQuery.data,
      operations?.isOpen,
    ],
  );
  const placementIssue = placementProblem(targetTile);
  const isPlacementReady = isReady && isPlacing && preparedPlacement === placementData;
  const canConfirmPlacement = isPlacementReady && !placementIssue && !isSavingPlacement;

  const savePlacement = useCallback(
    async (position: Tile) => {
      if (!placementData || placementInFlight.current) return;
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
          await createBuilding({
            typeId: placementData.typeId,
            positionX: position.x,
            positionY: position.y,
          });
          if (!mounted.current) return;
          cancelPlacement();
          showToast({
            type: 'success',
            message: `${getBuildingById(placementData.typeId)?.nameKo ?? '시설'} 공사를 시작했어요.`,
          });
        } else if (placementData.type === 'entrance') {
          await moveEntrance({ positionX: position.x, positionY: position.y });
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
      placeDinosaur,
      createBuilding,
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
  const handleTileClick = useCallback(
    ({ gridX, gridY }: GameEngineEvents['tile:click']) => {
      if (!isPlacing) {
        selectEntity(null);
        return;
      }
      if (placementInFlight.current) return;
      const position = { x: gridX, y: gridY };
      setTargetTile(position);
    },
    [isPlacing, selectEntity],
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
    gameEngine.on('entity:click', handleEntityClick);
    return () => {
      gameEngine.off('tile:click', handleTileClick);
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
    if (!placementData) {
      setPreparedPlacement(null);
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
    if (placementData.type === 'entrance' && operations?.suggestedEntrance)
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
    setTargetTile(initialTarget);
    setPreparedPlacement(placementData);
    const width = placementData.type === 'dinosaur' ? 1 : footprint.width;
    const height = placementData.type === 'dinosaur' ? 1 : footprint.height;
    gameEngine.focusTile(initialTarget.x + (width - 1) / 2, initialTarget.y + (height - 1) / 2);
  }, [
    isReady,
    placementData,
    preparedPlacement,
    park,
    operations,
    dinosaursQuery.data,
    buildingsQuery.data,
    gridWidth,
    gridHeight,
    footprint.width,
    footprint.height,
    placementProblem,
  ]);

  useEffect(() => {
    if (!isReady) return;
    gameEngine.setPlacementMode(isPlacing);
    gameEngine.setShowGrid(showGrid || isPlacing);
    if (isPlacing && typeId) gameEngine.previewBuilding(typeId, targetTile, !placementIssue);
    else if (isPlacing) gameEngine.highlightTile(targetTile.x, targetTile.y);
  }, [isReady, isPlacing, targetTile, typeId, placementIssue, showGrid]);
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
      setTargetTile(({ x, y }) => ({
        x: Math.max(0, Math.min(gridWidth - 1, x + offset[0])),
        y: Math.max(0, Math.min(gridHeight - 1, y + offset[1])),
      }));
  };

  return {
    containerRef,
    isReady,
    error,
    engine: gameEngine,
    handleMapKeyDown,
    isPlacing,
    isSavingPlacement,
    isPlacementReady,
    targetTile,
    placementData,
    canConfirmPlacement,
    placementIssue,
    confirmPlacement,
    dinosaursQuery,
    buildingsQuery,
    operationsQuery,
  };
}
