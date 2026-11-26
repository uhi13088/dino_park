import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { BUILDING_DATA } from '@dino-park/game-data';
import { BuildingCategory, BuildingStatus, type ParkOperationsResponse } from '@dino-park/shared';
import * as PIXI from 'pixi.js';
import { GameEngine } from './GameEngine';
import { getIslandScreenBounds } from './IslandWorld';
import {
  buildingArtwork,
  buildingRasterArtwork,
  entranceGateId,
  getCompletedBuildingArtworkLevel,
  parasaurolophusArtwork,
} from '../parkArtwork';

vi.mock('../buildingRasterManifest.json', () => ({
  buildingIds: [
    'habitat-hybrid-zone',
    'operation-vet-hospital',
    'decoration-flower-bed',
    'unknown',
  ],
}));

vi.mock('pixi.js', () => {
  class Container {
    x = 0;
    y = 0;
    pivot = { y: 0 };
    children: Container[] = [];
    position = {
      set: (x: number, y: number) => {
        this.x = x;
        this.y = y;
      },
    };
    scale = { set: vi.fn(), x: 1 };
    skew = {
      y: 0,
      set: vi.fn((_x: number, y = 0) => {
        this.skew.y = y;
      }),
    };
    addChild = vi.fn((...children: Container[]) => this.children.push(...children));
    getBounds = vi.fn(() => ({
      containsPoint: (x: number) => x >= 250 && x <= 380,
    }));
    on = vi.fn();
    destroy = vi.fn();
  }

  class Graphics extends Container {
    clear() {
      return this;
    }

    poly() {
      return this;
    }

    rect() {
      return this;
    }

    roundRect() {
      return this;
    }

    ellipse() {
      return this;
    }

    moveTo() {
      return this;
    }

    lineTo() {
      return this;
    }

    stroke() {
      return this;
    }

    fill() {
      return this;
    }
  }

  class Sprite extends Container {
    anchor = {
      y: 0,
      set: vi.fn((_x: number, y: number) => {
        this.anchor.y = y;
      }),
    };

    constructor(public texture?: { width: number; height: number }) {
      super();
    }
  }

  class Text extends Container {
    anchor = { set: vi.fn() };
    width = 52;
  }

  class Application {
    static instances: Application[] = [];
    stage = new Container();
    ticker = { add: vi.fn() };
    renderer?: { canvas: HTMLCanvasElement; resize: Mock };
    screen = {};
    finishInit!: () => void;
    failInit!: (error: Error) => void;

    constructor() {
      Application.instances.push(this);
    }

    init() {
      return new Promise<void>((resolve, reject) => {
        this.finishInit = () => {
          this.renderer = { canvas: document.createElement('canvas'), resize: vi.fn() };
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

  return {
    Application,
    Container,
    Graphics,
    Sprite,
    Text,
    Assets: {
      load: vi.fn(async (paths: string[]) =>
        Object.fromEntries(paths.map((path) => [path, { width: 384, height: 256, path }])),
      ),
    },
  };
});

vi.mock('./IsometricGrid', () => ({
  ISO_CONFIG: { TILE_WIDTH: 64, TILE_HEIGHT: 32 },
  gridToScreen: (x: number, y: number) => ({ x: (x - y) * 32, y: (x + y) * 16 }),
  screenToGrid: (x: number, y: number) => ({
    x: Math.round((x / 32 + y / 16) / 2),
    y: Math.round((y / 16 - x / 32) / 2),
  }),
  IsometricGrid: class {
    attachScenery = vi.fn();
    sortEntities = vi.fn();
    setGridSize = vi.fn();
    highlightTile = vi.fn();
    highlightArea = vi.fn();
    addEntity = vi.fn((item: { position: { set: (x: number, y: number) => void } }, x, y) =>
      item.position.set((x - y) * 32, (x + y) * 16),
    );

    getGridSize() {
      return { width: 20, height: 20 };
    }
  },
}));

vi.mock('./ParkScenery', () => ({
  PARK_MEADOW_COLOR: 0x97ab61,
  parkEnvironmentTexturePaths: [],
  ParkScenery: class {
    previewEntrance = vi.fn();
    sync = vi.fn();
    update = vi.fn();
  },
}));

interface TestApplication {
  finishInit: () => void;
  failInit: (error: Error) => void;
  canvas: HTMLCanvasElement;
  destroy: Mock;
  stage: { destroy: Mock; on: Mock };
  ticker: { add: Mock };
}

const applicationClass = PIXI.Application as unknown as { instances: TestApplication[] };

describe('GameEngine asynchronous lifecycle', () => {
  beforeEach(() => {
    applicationClass.instances.length = 0;
    vi.mocked(PIXI.Assets.load).mockClear();
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

  it.each([
    ['stegoceratops', '스테고케라톱스', 86],
    ['triceratops', '트리케라톱스', 78],
    ['iguanodon', '이구아노돈', 76],
  ])(
    'places the %s raster at its foot baseline without stretching it',
    async (species, name, width) => {
      const engine = new GameEngine();
      const initialization = engine.initialize(document.createElement('div'));
      applicationClass.instances[0].finishInit();
      await initialization;

      const entity = engine.addDinosaur(species, 9, 9, undefined, name, species);
      const sprite = entity.children[1] as PIXI.Sprite;

      expect(sprite.texture).toMatchObject({ path: `/assets/dinosaurs/${species}/idle.webp` });
      expect(sprite.anchor.set).toHaveBeenCalledWith(0.5, 228 / 256);
      expect(sprite.width).toBe(width);
      expect(sprite.height).toBeCloseTo((width * 256) / 384);
      engine.destroy();
    },
  );

  it.each([
    { x: 11, y: 16, center: [-224, 512], mirrored: true },
    { x: 16, y: 11, center: [224, 512], mirrored: false },
  ])(
    'keeps the gate aligned at $x, $y when the park opens and closes',
    async ({ x, y, center, mirrored }) => {
      const engine = new GameEngine();
      const initialization = engine.initialize(document.createElement('div'));
      applicationClass.instances[0].finishInit();
      await initialization;

      const entrance = { id: 'park-gate', x, y, width: 4, height: 4, onBoundary: true };
      engine.syncPark(20, 20, { isOpen: false, entrance } as ParkOperationsResponse);
      const gate = engine.addBuilding('park-gate', x, y, entranceGateId);
      const sprite = gate.children[0] as PIXI.Sprite;
      const scale = 128 / 337.25;
      expect(sprite.texture).toMatchObject({
        path: '/assets/buildings/entrance-isometric-up.webp',
      });
      expect(sprite.skew.set).not.toHaveBeenCalled();
      expect(sprite.scale.set).toHaveBeenLastCalledWith(mirrored ? -scale : scale, scale);
      const anchor = (sprite.anchor.set as Mock).mock.lastCall;
      expect([gate.x, gate.y]).toEqual(center);

      engine.syncPark(20, 20, { isOpen: true, entrance } as ParkOperationsResponse);
      expect(sprite.texture).toMatchObject({
        path: '/assets/buildings/entrance-isometric-up-open.webp',
      });
      expect(sprite.skew.set).not.toHaveBeenCalled();
      expect(sprite.scale.set).toHaveBeenLastCalledWith(mirrored ? -scale : scale, scale);
      expect((sprite.anchor.set as Mock).mock.lastCall).toEqual(anchor);
      expect([gate.x, gate.y]).toEqual(center);
      engine.destroy();
    },
  );

  it('opens a tapped facility only after the native canvas click', async () => {
    const engine = new GameEngine();
    const initialization = engine.initialize(document.createElement('div'));
    const app = applicationClass.instances[0];
    app.finishInit();
    await initialization;
    const gate = engine.addBuilding('gate', 11, 16, entranceGateId);
    const selected = vi.fn();
    engine.on('entity:click', selected);
    const tap = (gate.on as Mock).mock.calls.find(([event]) => event === 'pointertap')?.[1];

    tap({ stopPropagation: vi.fn() });
    expect(selected).not.toHaveBeenCalled();
    app.canvas.dispatchEvent(new MouseEvent('click'));
    app.canvas.dispatchEvent(new MouseEvent('click'));

    expect(selected).toHaveBeenCalledExactlyOnceWith({ type: 'building', id: 'gate' });
    engine.destroy();
  });

  it('drags a facility by its sprite while empty space still pans the camera', async () => {
    const engine = new GameEngine();
    const container = document.createElement('div');
    Object.defineProperties(container, {
      clientWidth: { value: 640 },
      clientHeight: { value: 296 },
    });
    const initialization = engine.initialize(container);
    const app = applicationClass.instances[0];
    app.finishInit();
    await initialization;
    const gate = engine.addBuilding('moving-gate', 5, 16, entranceGateId);
    engine.focusTile(6.5, 17.5);
    engine.setPlacementMode(true, 'moving-gate');
    engine.previewBuilding(entranceGateId, { x: 5, y: 16 }, true);
    expect(gate.visible).toBe(false);

    const move = vi.fn();
    engine.on('placement:move', move);
    const pointer = (event: string, x: number, y: number) =>
      app.stage.on.mock.calls.find(([name]) => name === event)?.[1]({
        button: 0,
        pointerId: 1,
        globalX: x,
        globalY: y,
      });

    const camera = engine.getCameraState();
    // Grabbing the roof offsets the finger from the grid origin.
    pointer('pointerdown', 320, 110);
    pointer('pointermove', 384, 142);
    pointer('pointerup', 384, 142);
    expect(move).toHaveBeenCalledOnce();
    expect(move).toHaveBeenCalledWith({ gridX: 7, gridY: 16 });
    expect(engine.getCameraState()).toEqual(camera);

    pointer('pointerdown', 140, 120);
    pointer('pointermove', 172, 120);
    pointer('pointerup', 172, 120);
    expect(move).toHaveBeenCalledOnce();
    expect(engine.getCameraState().x).toEqual(camera.x - 32);
    engine.setPlacementMode(false);
    expect(gate.visible).toBe(true);
    engine.destroy();
  });

  it('keeps the front habitat fence with its facility through placement and removal', async () => {
    const engine = new GameEngine();
    const initialization = engine.initialize(document.createElement('div'));
    applicationClass.instances[0].finishInit();
    await initialization;
    const grid = engine.getGrid() as unknown as { addEntity: Mock };
    const habitat = engine.addBuilding('habitat', 8, 8, 'habitat-grassland');
    const frontFence = grid.addEntity.mock.calls[1][0] as PIXI.Container;

    expect(frontFence.eventMode).toBe('none');
    expect(frontFence.y - frontFence.pivot.y).toBe(habitat.y);
    expect(frontFence.y).toBeGreaterThan(habitat.y);
    expect(habitat.children[0]).toBeInstanceOf(PIXI.Graphics);

    engine.setPlacementMode(true, 'habitat');
    expect(frontFence.visible).toBe(false);
    engine.setPlacementMode(false);
    expect(frontFence.visible).toBe(true);

    engine.addBuilding('habitat', 7, 10, 'habitat-grassland');
    expect(frontFence.x).toBe(habitat.x);
    expect(frontFence.y - frontFence.pivot.y).toBe(habitat.y);
    engine.removeBuilding('habitat');
    expect(frontFence.destroy).toHaveBeenCalledOnce();
    engine.destroy();
  });

  it('registers only delivered functional rasters and fetches a new type once on demand', async () => {
    const functionalBuildings = BUILDING_DATA.filter(
      ({ category }) => category !== BuildingCategory.DECORATION,
    );
    for (const id of buildingRasterArtwork.keys()) {
      expect(functionalBuildings.some((building) => building.id === id)).toBe(true);
      expect(buildingArtwork(id)).toMatch(/^\/assets\/buildings\/.+\.webp$/);
    }
    expect(buildingArtwork('research-hatchery')).toContain('/assets/placeholders/');
    expect(buildingRasterArtwork.has('decoration-flower-bed')).toBe(false);
    expect(buildingRasterArtwork.has('unknown')).toBe(false);

    const engine = new GameEngine();
    const initialization = engine.initialize(document.createElement('div'));
    applicationClass.instances[0].finishInit();
    await initialization;
    const typeId = 'operation-vet-hospital';
    const path = `/assets/buildings/${typeId}.webp`;
    const assetCalls = () =>
      vi
        .mocked(PIXI.Assets.load)
        .mock.calls.filter(
          ([input]) => Array.isArray(input) && input.some((entry) => entry === path),
        );
    expect(assetCalls()).toHaveLength(0);
    const hybrid = engine.addBuilding('habitat', 8, 8, 'habitat-hybrid-zone');
    expect(hybrid.children[0]).toMatchObject({
      texture: { path: '/assets/buildings/habitat-hybrid-zone.webp' },
      width: 192,
    });
    const first = engine.addBuilding('first', 3, 3, typeId);
    engine.addBuilding('second', 5, 5, typeId);
    engine.setPlacementMode(true, 'first');
    engine.previewBuilding(typeId, { x: 3, y: 3 }, true, undefined, true);
    const grid = engine.getGrid() as unknown as { addEntity: Mock };
    const preview = grid.addEntity.mock.lastCall?.[0] as PIXI.Container;
    await vi.waitFor(() => {
      expect(first.children[0]).toMatchObject({
        texture: { path },
        width: 128,
        anchor: { y: 0.625 },
      });
      expect(preview.children[0]).toMatchObject({
        texture: { path },
        width: 128,
        scale: { x: -1 },
      });
    });
    expect(assetCalls()).toHaveLength(1);
    engine.destroy();
  });

  it.each([
    'habitat-grassland',
    'habitat-forest',
    'habitat-carnivore',
    'habitat-hybrid-zone',
    'habitat-desert',
    'habitat-volcanic',
    'habitat-glacier',
  ])('selects the reinforced %s artwork from completed Lv.5 onward', (typeId) => {
    const unfinished = getCompletedBuildingArtworkLevel({
      level: 5,
      status: BuildingStatus.UPGRADING,
    });
    expect(buildingArtwork(typeId, unfinished)).toBe(buildingArtwork(typeId, 1));
    const path = `/assets/buildings/${typeId}-lv5.webp`;
    expect(buildingArtwork(typeId, 5)).toBe(path);
    expect(buildingArtwork(typeId, 25)).toBe(path);
  });

  it('keeps the electric fence during work and shows the reinforced fence when moved after completion', async () => {
    const engine = new GameEngine();
    const initialization = engine.initialize(document.createElement('div'));
    applicationClass.instances[0].finishInit();
    await initialization;
    const habitat = {
      id: 'carnivore',
      typeId: 'habitat-carnivore',
      level: 5,
      status: BuildingStatus.UPGRADING,
      positionX: 8,
      positionY: 8,
      isMirrored: true,
      assignedGreatFigureId: null,
      completesAt: new Date(Date.now() + 30_000).toISOString(),
    };
    const basePath = '/assets/buildings/habitat-carnivore-electric.webp';
    const reinforcedPath = '/assets/buildings/habitat-carnivore-lv5.webp';
    engine.syncBuildings([habitat]);
    const grid = engine.getGrid() as unknown as { addEntity: Mock };
    const facility = grid.addEntity.mock.lastCall?.[0] as PIXI.Container;
    const art = facility.children[0] as PIXI.Sprite;
    const name = facility.children[1] as PIXI.Text;
    const countdown = facility.children[2];
    const position = [facility.x, facility.y];
    expect(art).toMatchObject({ texture: { path: basePath }, width: 192, scale: { x: -1 } });
    expect(name.visible).toBe(false);
    expect(countdown.children[0]).toBeInstanceOf(PIXI.Graphics);
    expect(countdown.children[1]).toMatchObject({ text: expect.stringMatching(/^0:\d{2}$/) });
    expect(PIXI.Assets.load).not.toHaveBeenCalledWith([reinforcedPath]);

    engine.syncBuildings([{ ...habitat, status: BuildingStatus.ACTIVE, completesAt: null }]);
    expect(countdown.destroy).toHaveBeenCalledWith({ children: true });
    expect(name.visible).toBe(true);
    expect(art.texture).toMatchObject({ path: basePath });
    await vi.waitFor(() => expect(art.texture).toMatchObject({ path: reinforcedPath }));
    expect([facility.x, facility.y]).toEqual(position);

    engine.setPlacementMode(true, habitat.id);
    engine.previewBuilding(habitat.typeId, { x: 8, y: 8 }, true, undefined, true);
    const preview = grid.addEntity.mock.lastCall?.[0] as PIXI.Container;
    expect(preview.children[0]).toMatchObject({
      texture: { path: reinforcedPath },
      width: 192,
      scale: { x: -1 },
    });
    engine.destroy();
  });

  it('mirrors the current platform artwork around its tile without mirroring its label', async () => {
    const engine = new GameEngine();
    const initialization = engine.initialize(document.createElement('div'));
    applicationClass.instances[0].finishInit();
    await initialization;
    const grid = engine.getGrid() as unknown as { addEntity: Mock };
    const platform = {
      id: 'deck',
      typeId: 'visitor-viewing-platform',
      level: 5,
      positionX: 6,
      positionY: 6,
      status: BuildingStatus.ACTIVE,
      assignedGreatFigureId: null,
    };
    engine.syncBuildings([platform]);
    const building = grid.addEntity.mock.lastCall?.[0] as PIXI.Container;
    const [artwork, label] = building.children as [PIXI.Sprite, PIXI.Text];
    const position = [building.x, building.y];
    const texture = artwork.texture;
    const width = artwork.width;
    const height = artwork.height;

    engine.setPlacementMode(true, platform.id);
    engine.previewBuilding(platform.typeId, { x: 6, y: 6 }, true, undefined, true);
    const preview = grid.addEntity.mock.lastCall?.[0] as PIXI.Container;
    expect(preview.children[0]).toMatchObject({ texture, width, height, scale: { x: -1 } });
    expect([preview.x, preview.y]).toEqual(position);

    engine.setPlacementMode(false);
    engine.syncBuildings([{ ...platform, isMirrored: true }]);
    expect(artwork).toMatchObject({ texture, width, height, scale: { x: -1 } });
    expect(label.scale.x).toBe(1);
    expect([building.x, building.y]).toEqual(position);
    engine.syncBuildings([{ ...platform, isMirrored: false }]);
    expect(artwork.scale.x).toBe(1);
    engine.destroy();
  });

  it('keeps the visual Para position on refresh and returns to its saved tile for placement or habitat removal', async () => {
    const engine = new GameEngine();
    const initialization = engine.initialize(document.createElement('div'));
    const app = applicationClass.instances[0];
    app.finishInit();
    await initialization;
    const tick = app.ticker.add.mock.calls[0][0];
    const para = {
      id: 'para',
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
    };
    engine.syncDinosaurs([para]);
    engine.syncBuildings([
      {
        id: 'grassland',
        typeId: 'habitat-grassland',
        level: 1,
        positionX: 8,
        positionY: 8,
        status: BuildingStatus.ACTIVE,
        assignedGreatFigureId: null,
      },
    ]);
    const grid = engine.getGrid() as unknown as { addEntity: Mock };
    const entity = grid.addEntity.mock.calls[0][0];
    const sprite = entity.children[1];
    expect(sprite.texture.path).toBe(parasaurolophusArtwork.idle);
    tick({ deltaMS: 1250 });
    const walkingX = entity.x;
    expect(walkingX).toBeGreaterThan(0);
    expect(sprite.texture.path).toBe(parasaurolophusArtwork.walk[1]);
    engine.syncDinosaurs([{ ...para, hunger: 46 }]);
    expect(entity.x).toBe(walkingX);

    engine.setPlacementMode(true);
    expect(entity.x).toBe(0);
    expect(sprite.texture.path).toBe(parasaurolophusArtwork.idle);
    tick({ deltaMS: 1250 });
    expect(entity.x).toBe(0);
    engine.setPlacementMode(false);
    tick({ deltaMS: 1250 });
    expect(entity.x).toBeGreaterThan(0);
    engine.syncBuildings([]);
    expect(entity.x).toBe(0);
    expect(sprite.texture.path).toBe(parasaurolophusArtwork.idle);

    engine.destroy();
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

  it('refits the overview after layout settles and preserves a deliberate camera across resize', async () => {
    let height = 120;
    const container = document.createElement('div');
    Object.defineProperties(container, {
      clientWidth: { value: 930 },
      clientHeight: { get: () => height },
    });
    const engine = new GameEngine();
    const initialization = engine.initialize(container);
    applicationClass.instances[0].finishInit();
    await initialization;

    engine.syncPark(20, 20, { isOpen: true } as ParkOperationsResponse);
    expect(engine.getCameraState().zoom).toBe(0.2);
    height = 342;
    window.dispatchEvent(new Event('resize'));
    expect(engine.getCameraState().zoom).toBeCloseTo((342 - 56) / 640);

    engine.setZoom(1.25);
    engine.moveCamera(40, 80);
    height = 398;
    window.dispatchEvent(new Event('resize'));
    expect(engine.getCameraState()).toEqual({ x: 40, y: 80, zoom: 1.25 });

    engine.fitPark();
    height = 366;
    window.dispatchEvent(new Event('resize'));
    expect(engine.getCameraState()).toEqual({ x: 0, y: 320, zoom: (366 - 56) / 640 });

    engine.setPlacementMode(true);
    height = 400;
    window.dispatchEvent(new Event('resize'));
    expect(engine.getCameraState().zoom).toBe((366 - 56) / 640);
    engine.destroy();
  });

  it('fits the whole island, keeps its camera inside the world and returns to the park', async () => {
    let height = 390;
    const width = 844;
    const container = document.createElement('div');
    Object.defineProperties(container, {
      clientWidth: { value: width },
      clientHeight: { get: () => height },
    });
    const engine = new GameEngine();
    const initialization = engine.initialize(container);
    applicationClass.instances[0].finishInit();
    await initialization;
    engine.syncPark(20, 20, { isOpen: true } as ParkOperationsResponse);

    const { left, top, right, bottom } = getIslandScreenBounds();
    engine.fitIsland();
    const island = engine.getCameraState();
    expect(island.x).toBe((left + right) / 2);
    expect(island.y).toBe((top + bottom) / 2);
    expect((right - left) * island.zoom).toBeLessThan(width);
    expect((bottom - top) * island.zoom).toBeLessThan(height);
    expect(island.zoom).toBeLessThan(0.2);

    height = 296;
    window.dispatchEvent(new Event('resize'));
    const smaller = engine.getCameraState();
    expect(smaller.zoom).toBeLessThan(island.zoom);
    expect(smaller.x).toBe(island.x);
    expect(smaller.y).toBe(island.y);

    engine.setZoom(0.001);
    engine.moveCamera(right + 1000, top - 1000);
    expect(engine.getCameraState()).toEqual({ x: right, y: top, zoom: smaller.zoom });

    engine.setPlacementMode(true);
    const park = { x: 0, y: 320, zoom: (height - 56) / 640 };
    expect(engine.getCameraState()).toEqual(park);
    engine.fitIsland();
    expect(engine.getCameraState()).toEqual(park);
    engine.setPlacementMode(false);
    engine.fitIsland();
    engine.fitPark();
    expect(engine.getCameraState()).toEqual(park);
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
