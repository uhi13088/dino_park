import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { BuildingStatus } from '@dino-park/shared';
import * as PIXI from 'pixi.js';
import { GameEngine } from './GameEngine';

vi.mock('pixi.js', () => {
  class Container {
    x = 0;
    y = 0;
    scale = { set: vi.fn() };
    addChild = vi.fn();
    on = vi.fn();
    destroy = vi.fn();
  }

  class Application {
    static instances: Application[] = [];
    stage = new Container();
    ticker = { add: vi.fn() };
    renderer?: { canvas: HTMLCanvasElement };
    screen = {};
    finishInit!: () => void;
    failInit!: (error: Error) => void;

    constructor() {
      Application.instances.push(this);
    }

    init() {
      return new Promise<void>((resolve, reject) => {
        this.finishInit = () => {
          this.renderer = { canvas: document.createElement('canvas') };
          resolve();
        };
        this.failInit = reject;
      });
    }

    get canvas() {
      // Reproduce Pixi's failure if code reads another pending application's canvas.
      return this.renderer!.canvas;
    }

    destroy = vi.fn(() => {
      this.canvas.remove();
      this.stage.destroy();
    });
  }

  return { Application, Container, Assets: { load: vi.fn().mockResolvedValue({}) } };
});

vi.mock('./IsometricGrid', () => ({
  ISO_CONFIG: { TILE_WIDTH: 64, TILE_HEIGHT: 32 },
  gridToScreen: () => ({ x: 0, y: 320 }),
  IsometricGrid: class {
    attachScenery = vi.fn();
    getGridSize() {
      return { width: 20, height: 20 };
    }
  },
}));

vi.mock('./ParkScenery', () => ({ ParkScenery: class {} }));

interface TestApplication {
  finishInit: () => void;
  failInit: (error: Error) => void;
  canvas: HTMLCanvasElement;
  destroy: Mock;
  stage: { destroy: Mock };
  ticker: { add: Mock };
}

const applicationClass = PIXI.Application as unknown as { instances: TestApplication[] };

describe('GameEngine asynchronous lifecycle', () => {
  beforeEach(() => {
    applicationClass.instances.length = 0;
  });

  it('defers data synchronization until the renderer has an attached grid', () => {
    const engine = new GameEngine();
    // HMR can retain isReady in React briefly while the replacement engine initializes.
    expect(() =>
      engine.syncBuildings([
        {
          id: 'building-1',
          typeId: 'habitat-grassland',
          level: 1,
          positionX: 8,
          positionY: 8,
          status: BuildingStatus.ACTIVE,
          assignedGreatFigureId: null,
        },
      ]),
    ).not.toThrow();
    expect(() =>
      engine.syncDinosaurs([
        {
          id: 'dinosaur-1',
          speciesId: 'parasaurolophus',
          nickname: '파라',
          level: 1,
          exp: 0,
          happiness: 75,
          hunger: 45,
          intimacy: 0,
          positionX: 9,
          positionY: 9,
          isInPark: true,
        },
      ]),
    ).not.toThrow();
    expect(engine.getGrid()).toBeNull();
  });

  it.each(['stale-first', 'current-first'])(
    'keeps only the remounted canvas when initialization finishes %s',
    async (completionOrder) => {
      const engine = new GameEngine();
      const container = document.createElement('div');
      const staleInitialization = engine.initialize(container);
      const staleApp = applicationClass.instances[0];

      engine.destroy();
      const currentInitialization = engine.initialize(container);
      const currentApp = applicationClass.instances[1];

      if (completionOrder === 'stale-first') {
        staleApp.finishInit();
        await staleInitialization;
        expect(container.querySelector('canvas')).toBeNull();
        expect(engine.getApp()).toBeNull();
        currentApp.finishInit();
        await currentInitialization;
      } else {
        currentApp.finishInit();
        await currentInitialization;
        staleApp.finishInit();
        await staleInitialization;
      }

      expect(staleApp.destroy).toHaveBeenCalledOnce();
      expect(staleApp.ticker.add).not.toHaveBeenCalled();
      expect(currentApp.destroy).not.toHaveBeenCalled();
      expect(engine.getApp()).toBe(currentApp);
      expect(container.querySelectorAll('canvas')).toHaveLength(1);
      expect(container.firstChild).toBe(currentApp.canvas);

      engine.destroy();
    },
  );

  it('disposes initialization completed after unmount without attaching its canvas', async () => {
    const engine = new GameEngine();
    const container = document.createElement('div');
    const initialization = engine.initialize(container);
    const app = applicationClass.instances[0];

    engine.destroy();
    expect(app.destroy).not.toHaveBeenCalled();
    app.finishInit();
    await initialization;

    expect(app.destroy).toHaveBeenCalledWith(true, { children: true });
    expect(container.childElementCount).toBe(0);
    expect(engine.getApp()).toBeNull();
  });

  it('removes canvas, wheel and resize listeners before another mount', async () => {
    const engine = new GameEngine();
    const container = document.createElement('div');
    const removeResize = vi.spyOn(window, 'removeEventListener');
    const initialization = engine.initialize(container);
    const app = applicationClass.instances[0];
    app.finishInit();
    await initialization;

    const removeWheel = vi.spyOn(app.canvas, 'removeEventListener');

    engine.destroy();

    expect(removeWheel).toHaveBeenCalledWith('wheel', expect.any(Function));
    expect(removeResize).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(app.destroy).toHaveBeenCalledWith(true, { children: true });
    expect(container.childElementCount).toBe(0);
    expect(engine.getGrid()).toBeNull();

    const remount = engine.initialize(container);
    applicationClass.instances[1].finishInit();
    await remount;
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    engine.destroy();
    removeWheel.mockRestore();
    removeResize.mockRestore();
  });

  it('leaves overlay wheel input native while only canvas wheel input changes the camera', async () => {
    const engine = new GameEngine();
    const container = document.createElement('div');
    const initialization = engine.initialize(container);
    const app = applicationClass.instances[0];
    app.finishInit();
    await initialization;
    const overlay = document.createElement('section');
    container.appendChild(overlay);
    const before = engine.getCameraState().zoom;
    const overlayWheel = new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true });
    overlay.dispatchEvent(overlayWheel);
    expect(overlayWheel.defaultPrevented).toBe(false);
    expect(engine.getCameraState().zoom).toBe(before);
    const mapWheel = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    app.canvas.dispatchEvent(mapWheel);
    expect(mapWheel.defaultPrevented).toBe(true);
    expect(engine.getCameraState().zoom).toBeGreaterThan(before);
    engine.destroy();
  });

  it('releases the stage when renderer initialization fails and permits retry', async () => {
    const engine = new GameEngine();
    const container = document.createElement('div');
    const initialization = engine.initialize(container);
    const app = applicationClass.instances[0];
    app.failInit(new Error('Renderer unavailable'));

    await expect(initialization).rejects.toThrow('Renderer unavailable');
    expect(app.stage.destroy).toHaveBeenCalledWith({ children: true });
    expect(app.destroy).not.toHaveBeenCalled();
    expect(engine.getApp()).toBeNull();

    const retry = engine.initialize(container);
    applicationClass.instances[1].finishInit();
    await retry;
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    engine.destroy();
  });
});
