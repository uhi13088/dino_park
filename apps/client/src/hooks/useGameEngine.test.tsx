import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildingResponse, DinosaurResponse } from '@dino-park/shared';
import { gameEngine, type GameEngineEvents } from '@/game';
import { useGameEngine } from './useGameEngine';

const state = vi.hoisted(() => ({
  mode: 'view',
  placementData: null as { type: 'dinosaur'; id: string; speciesId: string } | null,
  dinosaurs: undefined as { dinosaurs: DinosaurResponse[] } | undefined,
  buildings: undefined as { buildings: BuildingResponse[] } | undefined,
  park: undefined as { gridSizeX: number; gridSizeY: number } | undefined,
  placeDinosaur: vi.fn(),
  cancelPlacement: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/game', () => ({
  gameEngine: {
    initialize: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    setPlacementMode: vi.fn(),
    setShowGrid: vi.fn(),
    highlightTile: vi.fn(),
    focusTile: vi.fn(),
    syncDinosaurs: vi.fn(),
    syncBuildings: vi.fn(),
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
  useParkOperations: () => ({ data: undefined }),
  useCreateBuilding: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMoveParkEntrance: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

function selectPointerTile(gridX: number, gridY: number) {
  const subscription = vi
    .mocked(gameEngine.on)
    .mock.calls.filter(([event]) => event === 'tile:click')
    .at(-1);
  expect(subscription).toBeDefined();
  const listener = subscription![1] as (event: GameEngineEvents['tile:click']) => void;
  act(() => listener({ gridX, gridY }));
}

function PlacementHarness() {
  const { containerRef, canConfirmPlacement, confirmPlacement, handleMapKeyDown } = useGameEngine();
  return (
    <div ref={containerRef} role="region" aria-label="지도" onKeyDown={handleMapKeyDown}>
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
    expect(gameEngine.on).toHaveBeenCalledTimes(2);
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
});
