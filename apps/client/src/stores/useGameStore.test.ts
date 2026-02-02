import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 리셋
    useGameStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useGameStore.getState();

      expect(state.mode).toBe('view');
      expect(state.selectedEntity).toBeNull();
      expect(state.placementData).toBeNull();
      expect(state.cameraPosition).toEqual({ x: 0, y: 0 });
      expect(state.cameraZoom).toBe(1);
      expect(state.showGrid).toBe(false);
      expect(state.gold).toBe(10000);
      expect(state.diamond).toBe(100);
      expect(state.explorationEnergy).toBe(30);
    });
  });

  describe('setMode', () => {
    it('should change game mode', () => {
      useGameStore.getState().setMode('build');

      expect(useGameStore.getState().mode).toBe('build');
    });

    it('should clear selection when mode changes to view', () => {
      // 먼저 엔티티 선택
      useGameStore.getState().selectEntity({ type: 'dinosaur', id: 'dino-1' });
      expect(useGameStore.getState().selectedEntity).not.toBeNull();

      // 모드 변경
      useGameStore.getState().setMode('view');

      expect(useGameStore.getState().selectedEntity).toBeNull();
    });
  });

  describe('selectEntity', () => {
    it('should select an entity', () => {
      const entity = { type: 'dinosaur' as const, id: 'dino-1' };

      useGameStore.getState().selectEntity(entity);

      expect(useGameStore.getState().selectedEntity).toEqual(entity);
    });

    it('should clear selection when null is passed', () => {
      useGameStore.getState().selectEntity({ type: 'dinosaur', id: 'dino-1' });
      useGameStore.getState().selectEntity(null);

      expect(useGameStore.getState().selectedEntity).toBeNull();
    });
  });

  describe('placement', () => {
    it('should start dinosaur placement', () => {
      useGameStore.getState().startPlacement({
        type: 'dinosaur',
        speciesId: 'trex',
      });

      const state = useGameStore.getState();
      expect(state.mode).toBe('place_dinosaur');
      expect(state.placementData).toEqual({
        type: 'dinosaur',
        speciesId: 'trex',
      });
      expect(state.selectedEntity).toBeNull();
    });

    it('should start building placement', () => {
      useGameStore.getState().startPlacement({
        type: 'building',
        typeId: 'entrance',
      });

      const state = useGameStore.getState();
      expect(state.mode).toBe('place_building');
      expect(state.placementData).toEqual({
        type: 'building',
        typeId: 'entrance',
      });
    });

    it('should cancel placement', () => {
      useGameStore.getState().startPlacement({
        type: 'dinosaur',
        speciesId: 'trex',
      });
      useGameStore.getState().cancelPlacement();

      const state = useGameStore.getState();
      expect(state.mode).toBe('view');
      expect(state.placementData).toBeNull();
    });
  });

  describe('camera', () => {
    it('should set camera position', () => {
      useGameStore.getState().setCameraPosition(100, 200);

      expect(useGameStore.getState().cameraPosition).toEqual({ x: 100, y: 200 });
    });

    it('should set camera zoom within bounds', () => {
      useGameStore.getState().setCameraZoom(1.5);
      expect(useGameStore.getState().cameraZoom).toBe(1.5);

      useGameStore.getState().setCameraZoom(0.3); // Below minimum
      expect(useGameStore.getState().cameraZoom).toBe(0.5);

      useGameStore.getState().setCameraZoom(3); // Above maximum
      expect(useGameStore.getState().cameraZoom).toBe(2);
    });
  });

  describe('grid', () => {
    it('should toggle grid visibility', () => {
      expect(useGameStore.getState().showGrid).toBe(false);

      useGameStore.getState().toggleGrid();
      expect(useGameStore.getState().showGrid).toBe(true);

      useGameStore.getState().toggleGrid();
      expect(useGameStore.getState().showGrid).toBe(false);
    });
  });

  describe('currency', () => {
    it('should set gold', () => {
      useGameStore.getState().setGold(50000);
      expect(useGameStore.getState().gold).toBe(50000);
    });

    it('should set diamond', () => {
      useGameStore.getState().setDiamond(500);
      expect(useGameStore.getState().diamond).toBe(500);
    });

    it('should set exploration energy', () => {
      useGameStore.getState().setExplorationEnergy(25);
      expect(useGameStore.getState().explorationEnergy).toBe(25);
    });
  });

  describe('lastActiveTime', () => {
    it('should update last active time', () => {
      const before = useGameStore.getState().lastActiveTime;

      // 약간의 지연 후 업데이트
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          useGameStore.getState().updateLastActiveTime();
          const after = useGameStore.getState().lastActiveTime;
          expect(after).toBeGreaterThanOrEqual(before);
          resolve();
        }, 10);
      });
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // 상태 변경
      useGameStore.getState().setMode('build');
      useGameStore.getState().setGold(50000);
      useGameStore.getState().setCameraZoom(1.5);
      useGameStore.getState().toggleGrid();

      // 리셋
      useGameStore.getState().reset();

      const state = useGameStore.getState();
      expect(state.mode).toBe('view');
      expect(state.gold).toBe(10000);
      expect(state.cameraZoom).toBe(1);
      expect(state.showGrid).toBe(false);
    });
  });
});
