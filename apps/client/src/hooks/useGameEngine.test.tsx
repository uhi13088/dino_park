import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PARK_ADMISSION,
  type BuildingResponse,
  type DinosaurResponse,
  type ParkEntranceSide,
  type ParkOperationsResponse,
} from '@dino-park/shared';
import { gameEngine, type GameEngineEvents } from '@/game';
import { useGameEngine } from './useGameEngine';

const state = vi.hoisted(() => ({
  mode: 'view',
  placementData: null as
    | { type: 'dinosaur'; id: string; speciesId: string }
    | { type: 'entrance'; id: string }
    | { type: 'building'; typeId: string; id?: string }
    | null,
  dinosaurs: undefined as { dinosaurs: DinosaurResponse[] } | undefined,
  buildings: undefined as { buildings: BuildingResponse[] } | undefined,
  park: undefined as { gridSizeX: number; gridSizeY: number } | undefined,
  operations: undefined as Pick<ParkOperationsResponse, 'isOpen' | 'entrance'> | undefined,
  placeDinosaur: vi.fn(),
  createBuilding: vi.fn(),
  moveBuilding: vi.fn(),
  moveEntrance: vi.fn(),
  cancelPlacement: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/game', () => ({
  gridToScreen: (x: number, y: number) => ({ x: (x - y) * 32, y: (x + y) * 16 }),
  gameEngine: {
    initialize: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    setPlacementMode: vi.fn(),
    setShowGrid: vi.fn(),
    highlightTile: vi.fn(),
    focusTile: vi.fn(),
    moveCamera: vi.fn(),
    previewBuilding: vi.fn(),
    syncDinosaurs: vi.fn(),
    syncBuildings: vi.fn(),
    syncPark: vi.fn(),
  },
}));

vi.mock('@/stores', () => ({
  useGameStore: () => ({ ...state, selectEntity: vi.fn() }),
  useUIStore: () => ({ openModal: vi.fn(), showToast: state.showToast }),
}));

vi.mock('@/api', () => ({
  useDinosaurs: () => ({ data: state.dinosaurs }),
  useBuildings: () => ({ data: state.buildings }),
  useParkMe: () => ({ data: state.park }),
  useParkOperations: () => ({ data: state.operations }),
  useCreateBuilding: () => ({ mutateAsync: state.createBuilding, isPending: false }),
  useMoveBuilding: () => ({ mutateAsync: state.moveBuilding, isPending: false }),
  useMoveParkEntrance: () => ({ mutateAsync: state.moveEntrance, isPending: false }),
  usePlaceDinosaur: () => ({ mutateAsync: state.placeDinosaur, isPending: false }),
}));

function deferredInitialization() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function EngineHarness() {
  const { containerRef, isReady, error } = useGameEngine();
  return <div ref={containerRef}>{error ? error.message : isReady ? 'ready' : 'loading'}</div>;
}

function seedPlacementPark() {
  const para: DinosaurResponse = {
    id: 'para',
    speciesId: 'parasaurolophus',
    nickname: '파라',
    level: 1,
    exp: 0,
    happiness: 100,
    hunger: 0,
    intimacy: 0,
    positionX: 9,
    positionY: 9,
    isInPark: true,
  };
  const igua = { ...para, id: 'igua', speciesId: 'iguanodon', isInPark: false };
  state.dinosaurs = { dinosaurs: [para, igua] };
  state.buildings = {
    buildings: [
      {
        id: 'grass',
        typeId: 'habitat-grassland',
        level: 1,
        positionX: 8,
        positionY: 8,
        status: 'active' as BuildingResponse['status'],
        assignedGreatFigureId: null,
      },
    ],
  };
  state.park = { gridSizeX: 20, gridSizeY: 20 };
  return { para, igua };
}

function selectPointerTile(
  gridX: number,
  gridY: number,
  eventKind: 'tile:click' | 'placement:move' = 'tile:click',
) {
  const subscription = vi
    .mocked(gameEngine.on)
    .mock.calls.filter(([event]) => event === eventKind)
    .at(-1);
  expect(subscription).toBeDefined();
  const listener = subscription![1] as (event: GameEngineEvents['tile:click']) => void;
  act(() => listener({ gridX, gridY }));
}

function seedEntrance(x: number, y: number, side?: ParkEntranceSide) {
  seedPlacementPark();
  state.mode = 'place_entrance';
  state.placementData = { type: 'entrance', id: 'entrance' };
  state.operations = {
    isOpen: false,
    entrance: { id: 'entrance', x, y, width: 4, height: 4, onBoundary: true, side },
  };
}

const lumberyardId = 'production-lumberyard';
function seedBuilding(isMirrored: boolean) {
  seedPlacementPark();
  const building = {
    ...state.buildings!.buildings[0],
    id: 'lumberyard',
    typeId: lumberyardId,
    positionX: 4,
    positionY: 5,
    isMirrored,
  };
  state.buildings!.buildings.push(building);
  state.mode = 'place_building';
  state.placementData = { type: 'building', id: building.id, typeId: building.typeId };
  return building;
}

function PlacementHarness() {
  const {
    containerRef,
    canConfirmPlacement,
    confirmPlacement,
    handleMapKeyDown,
    isPlacementReady,
    placementData,
    rotateEntrance,
    rotateBuilding,
    regularBuildingPlacement,
  } = useGameEngine();
  return (
    <div ref={containerRef} role="region" aria-label="지도" onKeyDown={handleMapKeyDown}>
      {placementData?.type === 'entrance' && (
        <button disabled={!isPlacementReady} onClick={rotateEntrance}>
          입구 방향 회전
        </button>
      )}
      {regularBuildingPlacement && (
        <button disabled={!isPlacementReady} onClick={rotateBuilding}>
          시설 방향 회전
        </button>
      )}
      <button disabled={!canConfirmPlacement} onClick={() => void confirmPlacement()}>
        배치 확정
      </button>
    </div>
  );
}

describe('useGameEngine mount ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.mode = 'view';
    state.placementData = null;
    state.dinosaurs = undefined;
    state.buildings = undefined;
    state.park = undefined;
    state.operations = undefined;
  });

  it('ignores a previous StrictMode initialization until the current mount is ready', async () => {
    const stale = deferredInitialization();
    const current = deferredInitialization();
    vi.mocked(gameEngine.initialize)
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(current.promise);

    const { unmount } = render(
      <StrictMode>
        <EngineHarness />
      </StrictMode>,
    );
    expect(gameEngine.initialize).toHaveBeenCalledTimes(2);

    await act(async () => stale.resolve());
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(gameEngine.on).not.toHaveBeenCalled();

    await act(async () => current.resolve());
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(vi.mocked(gameEngine.on).mock.calls.map(([event]) => event)).toEqual([
      'tile:click',
      'placement:move',
      'entity:click',
    ]);
    unmount();
    expect(gameEngine.destroy).toHaveBeenCalledTimes(2);
  });

  it('ignores errors from the cleaned-up mount after the current mount succeeds', async () => {
    const stale = deferredInitialization();
    const current = deferredInitialization();
    vi.mocked(gameEngine.initialize)
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(current.promise);

    const { unmount } = render(
      <StrictMode>
        <EngineHarness />
      </StrictMode>,
    );

    await act(async () => current.resolve());
    await act(async () => stale.reject(new Error('Stale renderer failed')));

    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.queryByText('Stale renderer failed')).not.toBeInTheDocument();
    unmount();
  });

  it('waits for the map and saved lists before Enter can place a new dinosaur', async () => {
    const initialization = deferredInitialization();
    vi.mocked(gameEngine.initialize).mockReturnValueOnce(initialization.promise);
    state.mode = 'place_dinosaur';
    state.placementData = { type: 'dinosaur', id: 'igua', speciesId: 'iguanodon' };
    const { rerender, unmount } = render(<PlacementHarness />);
    const map = screen.getByRole('region', { name: '지도' });

    fireEvent.keyDown(map, { key: 'Enter' });
    expect(state.placeDinosaur).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '배치 확정' })).toBeDisabled();

    await act(async () => initialization.resolve());
    fireEvent.keyDown(map, { key: 'Enter' });
    expect(state.placeDinosaur).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '배치 확정' })).toBeDisabled();

    const { igua } = seedPlacementPark();
    state.placeDinosaur.mockResolvedValue({ ...igua, isInPark: true, positionX: 10, positionY: 8 });
    rerender(<PlacementHarness />);
    expect(screen.getByRole('button', { name: '배치 확정' })).toBeEnabled();
    await act(async () => fireEvent.keyDown(map, { key: 'Enter' }));
    expect(state.placeDinosaur).toHaveBeenCalledExactlyOnceWith({
      id: 'igua',
      positionX: 10,
      positionY: 8,
    });
    expect(state.cancelPlacement).toHaveBeenCalledOnce();
    unmount();
  });

  it('only previews a pointer selection and preserves saved coordinates until explicit confirmation', async () => {
    const initialization = deferredInitialization();
    vi.mocked(gameEngine.initialize).mockReturnValueOnce(initialization.promise);
    const { para } = seedPlacementPark();
    state.mode = 'place_dinosaur';
    state.placementData = { type: 'dinosaur', id: para.id, speciesId: para.speciesId };
    const { rerender, unmount } = render(<PlacementHarness />);
    await act(async () => initialization.resolve());

    selectPointerTile(8, 10);
    expect(gameEngine.highlightTile).toHaveBeenLastCalledWith(8, 10);
    expect(state.placeDinosaur).not.toHaveBeenCalled();
    expect(para).toMatchObject({ positionX: 9, positionY: 9, isInPark: true });
    fireEvent.keyDown(screen.getByRole('region', { name: '지도' }), { key: 'Escape' });
    expect(state.cancelPlacement).toHaveBeenCalledOnce();
    expect(state.placeDinosaur).not.toHaveBeenCalled();
    expect(para).toMatchObject({ positionX: 9, positionY: 9, isInPark: true });

    state.mode = 'view';
    state.placementData = null;
    rerender(<PlacementHarness />);
    state.mode = 'place_dinosaur';
    state.placementData = { type: 'dinosaur', id: para.id, speciesId: para.speciesId };
    rerender(<PlacementHarness />);
    selectPointerTile(10, 9);
    expect(state.placeDinosaur).not.toHaveBeenCalled();
    expect(para).toMatchObject({ positionX: 9, positionY: 9, isInPark: true });

    state.placeDinosaur.mockResolvedValue({ ...para, positionX: 10, positionY: 9 });
    const confirm = screen.getByRole('button', { name: '배치 확정' });
    expect(confirm).toBeEnabled();
    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    expect(state.placeDinosaur).toHaveBeenCalledExactlyOnceWith({
      id: para.id,
      positionX: 10,
      positionY: 9,
    });
    expect(state.cancelPlacement).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('previews a corner rotation on the same tiles and commits the side only on confirmation', async () => {
    vi.mocked(gameEngine.initialize).mockResolvedValueOnce(undefined);
    seedEntrance(16, 16, 'bottom');
    const { unmount } = render(<PlacementHarness />);
    const confirm = screen.getByRole('button', { name: '배치 확정' });
    await act(async () => {});
    expect(confirm).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '입구 방향 회전' }));
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      PARK_ADMISSION.entranceTypeId,
      { x: 16, y: 16, side: 'right' },
      true,
      'right',
    );
    expect(state.moveEntrance).not.toHaveBeenCalled();
    expect(confirm).toBeEnabled();
    await act(async () => fireEvent.click(confirm));
    expect(state.moveEntrance).toHaveBeenCalledExactlyOnceWith({
      positionX: 16,
      positionY: 16,
      side: 'right',
    });
    unmount();
  });

  it('rotates to the nearest unobstructed tile and infers a compatible side while dragging', async () => {
    vi.mocked(gameEngine.initialize).mockResolvedValueOnce(undefined);
    seedEntrance(11, 16);
    state.buildings!.buildings.push({
      ...state.buildings!.buildings[0],
      id: 'obstruction',
      positionX: 16,
      positionY: 16,
    });
    const { unmount } = render(<PlacementHarness />);
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: '입구 방향 회전' }));
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      PARK_ADMISSION.entranceTypeId,
      { x: 16, y: 12, side: 'right' },
      true,
      'right',
    );
    expect(gameEngine.moveCamera).toHaveBeenLastCalledWith(128, 496);

    selectPointerTile(16, 16, 'placement:move');
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      PARK_ADMISSION.entranceTypeId,
      { x: 16, y: 16, side: 'right' },
      false,
      'right',
    );
    selectPointerTile(12, 16, 'placement:move');
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      PARK_ADMISSION.entranceTypeId,
      { x: 12, y: 16, side: 'bottom' },
      true,
      'bottom',
    );
    expect(state.moveEntrance).not.toHaveBeenCalled();
    unmount();
  });

  it('leaves the entrance preview in place when the other edge is occupied', async () => {
    vi.mocked(gameEngine.initialize).mockResolvedValueOnce(undefined);
    seedEntrance(11, 16, 'bottom');
    const building = state.buildings!.buildings[0];
    state.buildings!.buildings.push(
      ...Array.from({ length: 7 }, (_, index) => ({
        ...building,
        id: `obstruction-${index}`,
        positionX: 16,
        positionY: index * 3,
      })),
    );
    const { unmount } = render(<PlacementHarness />);
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: '입구 방향 회전' }));
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      PARK_ADMISSION.entranceTypeId,
      { x: 11, y: 16, side: 'bottom' },
      true,
      'bottom',
    );
    expect(state.showToast).toHaveBeenCalledWith({
      type: 'info',
      message: '오른쪽 테두리에 입구를 놓을 빈자리가 없어요.',
    });
    expect(screen.getByRole('button', { name: '배치 확정' })).toBeDisabled();
    expect(state.moveEntrance).not.toHaveBeenCalled();
    unmount();
  });

  it.each([false, true])(
    'only sends a changed direction after confirming construction (isMirrored %s)',
    async (mirrored) => {
      vi.mocked(gameEngine.initialize).mockResolvedValueOnce(undefined);
      seedPlacementPark();
      state.mode = 'place_building';
      state.placementData = { type: 'building', typeId: lumberyardId };
      const { unmount } = render(<PlacementHarness />);
      await act(async () => {});
      if (mirrored) fireEvent.click(screen.getByRole('button', { name: '시설 방향 회전' }));
      selectPointerTile(14, 10);
      expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
        lumberyardId,
        { x: 14, y: 10 },
        true,
        undefined,
        mirrored,
      );
      expect(state.createBuilding).not.toHaveBeenCalled();

      await act(async () => fireEvent.click(screen.getByRole('button', { name: '배치 확정' })));
      expect(state.createBuilding).toHaveBeenCalledExactlyOnceWith({
        typeId: lumberyardId,
        positionX: 14,
        positionY: 10,
        ...(mirrored && { isMirrored: true }),
      });
      unmount();
    },
  );

  it('discards an unsaved mirror toggle and preserves the saved facing during a position-only move', async () => {
    vi.mocked(gameEngine.initialize).mockResolvedValueOnce(undefined);
    const saved = seedBuilding(true);
    const { rerender, unmount } = render(<PlacementHarness />);
    await act(async () => {});
    const map = screen.getByRole('region', { name: '지도' });
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      lumberyardId,
      { x: 4, y: 5 },
      true,
      undefined,
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: '시설 방향 회전' }));
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      lumberyardId,
      { x: 4, y: 5 },
      true,
      undefined,
      false,
    );
    fireEvent.keyDown(map, { key: 'Escape' });
    expect(state.cancelPlacement).toHaveBeenCalledOnce();
    expect(state.moveBuilding).not.toHaveBeenCalled();

    state.mode = 'view';
    state.placementData = null;
    rerender(<PlacementHarness />);
    state.mode = 'place_building';
    state.placementData = { type: 'building', id: saved.id, typeId: saved.typeId };
    rerender(<PlacementHarness />);
    selectPointerTile(5, 5, 'placement:move');
    expect(gameEngine.previewBuilding).toHaveBeenLastCalledWith(
      lumberyardId,
      { x: 5, y: 5 },
      true,
      undefined,
      true,
    );
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '배치 확정' })));
    expect(state.moveBuilding).toHaveBeenCalledExactlyOnceWith({
      id: saved.id,
      positionX: 5,
      positionY: 5,
    });
    unmount();
  });

  it('permits a facing-only update and sends false to restore a saved mirror to its original direction', async () => {
    vi.mocked(gameEngine.initialize).mockResolvedValueOnce(undefined);
    const saved = seedBuilding(true);
    const { unmount } = render(<PlacementHarness />);
    await act(async () => {});
    const confirm = screen.getByRole('button', { name: '배치 확정' });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '시설 방향 회전' }));
    expect(confirm).toBeEnabled();
    expect(state.moveBuilding).not.toHaveBeenCalled();

    await act(async () => fireEvent.click(confirm));
    expect(state.moveBuilding).toHaveBeenCalledExactlyOnceWith({
      id: saved.id,
      positionX: 4,
      positionY: 5,
      isMirrored: false,
    });
    expect(state.showToast).toHaveBeenCalledWith({
      type: 'success',
      message: '벌목장 방향을 바꿨어요.',
    });
    unmount();
  });
});
