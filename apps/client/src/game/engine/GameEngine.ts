import * as PIXI from 'pixi.js';
import { IsometricGrid, ISO_CONFIG, gridToScreen, screenToGrid } from './IsometricGrid';
import { PARK_MEADOW_COLOR, parkEnvironmentTexturePaths, ParkScenery } from './ParkScenery';
import { shuttleTexturePaths } from './ParkShuttles';
import { ParkSafariScenery } from './ParkSafariScenery';
import { createDinosaurShadow } from './DinosaurShadow';
import { getParkEntranceFrame } from './ParkExterior';
import { getIslandScreenBounds } from './IslandWorld';
import { entranceGateTexturePaths, placeEntranceGateArtwork } from './EntranceGateArtwork';
import { createHabitatScenery, isHabitatWithScenery } from './HabitatScenery';
import {
  buildingArtwork,
  buildingRasterArtwork,
  dinosaurRasterArtwork,
  entranceGateId,
  fallbackBuildingArtwork,
  fallbackDinosaurArtwork,
  getBuildingRasterArtwork,
  getCompletedBuildingArtworkLevel,
  hasHabitatFenceUpgrade,
  hybridArtworkUrl,
  parkTexturePaths,
  parasaurolophusArtwork,
  safariGatePylonArtwork,
  starterHabitatTexturePaths,
  type BuildingRaster,
} from '../parkArtwork';
import {
  findParasaurolophusWalk,
  sampleParasaurolophusWalk,
  type ParasaurolophusWalkRoute,
} from '../logic/parasaurolophusWalk';
import { getBuildingById, getDinosaurById } from '@dino-park/game-data';
import { PARK_ADMISSION } from '@dino-park/shared';
import type {
  BuildingResponse,
  DinosaurResponse,
  ParkEntranceSide,
  ParkOperationsResponse,
  ParkSafariResponse,
} from '@dino-park/shared';
import { formatFacilityCountdown } from '@/utils/facilityCountdown';

// 이벤트 타입
export interface GameEngineEvents {
  'tile:click': { gridX: number; gridY: number };
  'placement:move': { gridX: number; gridY: number };
  'entity:click': { type: 'dinosaur' | 'building'; id: string };
  'camera:move': { x: number; y: number };
  'camera:zoom': { zoom: number };
}

type EventCallback<T> = (data: T) => void;

type ParasaurolophusMotion = {
  id: string;
  entity: PIXI.Container;
  sprite: PIXI.Sprite;
  route: ParasaurolophusWalkRoute;
  elapsedMs: number;
};

type BuildingCountdown = {
  completesAt: number;
  badge: PIXI.Container;
  plate: PIXI.Graphics;
  text: PIXI.Text;
  width: number;
};

function setBuildingArtworkMirrored(artwork: PIXI.Container, isMirrored: boolean): void {
  artwork.scale.x = Math.abs(artwork.scale.x) * (isMirrored ? -1 : 1);
}

const PARK_MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

/**
 * PixiJS 게임 엔진 코어
 */
export class GameEngine {
  private app: PIXI.Application | null = null;
  private container: HTMLElement | null = null;

  // 게임 상태
  private isInitialized = false;
  private initializationId = 0;
  private isPaused = false;

  // 레이어
  private worldContainer: PIXI.Container | null = null;
  private grid: IsometricGrid | null = null;
  private uiContainer: PIXI.Container | null = null;
  private scenery: ParkScenery | null = null;
  private safariScenery: ParkSafariScenery | null = null;
  private placementPreview: PIXI.Container | null = null;
  private placementTile: { x: number; y: number } | null = null;
  private movingBuildingId: string | null = null;
  private placementDragOffset: { x: number; y: number } | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private hasPresentedPark = false;
  private parkIsOpen = false;

  // 카메라
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 1;
  private cameraFit: 'park' | 'island' | null = 'park';
  private activePointerId: number | null = null;
  private didDrag = false;
  private pointerStart = { x: 0, y: 0 };
  private tappedBuildingId: string | null = null;
  private isPlacing = false;
  private parkTextures: Record<string, PIXI.Texture> = {};
  private buildingTextureRequests = new Map<string, Promise<PIXI.Texture | null>>();
  private lastPointerPosition = { x: 0, y: 0 };

  // 엔티티 맵
  private dinosaurs: Map<string, PIXI.Container> = new Map();
  private buildings: Map<string, PIXI.Container> = new Map();
  private habitatFences = new Map<string, PIXI.Graphics>();
  private buildingTimers = new Map<string, BuildingCountdown>();
  private lastTimerSecond = 0;
  private visibleDinosaurs: DinosaurResponse[] = [];
  private parkBuildings: BuildingResponse[] = [];
  private parasaurolophusMotion: ParasaurolophusMotion | null = null;

  // 이벤트 리스너
  private eventListeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  constructor() {
    // 생성자
  }

  /**
   * 게임 엔진 초기화
   */
  async initialize(container: HTMLElement, gridSize = 20): Promise<void> {
    if (this.isInitialized) {
      console.warn('GameEngine already initialized');
      return;
    }

    // Keep pending applications local: cleanup/remount can happen while Pixi initializes.
    const initializationId = ++this.initializationId;
    const app = new PIXI.Application();

    let textures: Record<string, PIXI.Texture>;
    try {
      await app.init({
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: PARK_MEADOW_COLOR,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
      const [baseTextures, paraWalkTextures, ...rasterTextures] = await Promise.all([
        PIXI.Assets.load([...parkTexturePaths, ...entranceGateTexturePaths]),
        PIXI.Assets.load(parasaurolophusArtwork.walk).catch(() => ({})),
        ...[...dinosaurRasterArtwork.values()].map((artwork) =>
          PIXI.Assets.load([artwork.path]).catch(() => ({})),
        ),
        ...starterHabitatTexturePaths.map((path) => PIXI.Assets.load([path]).catch(() => ({}))),
        ...parkEnvironmentTexturePaths.map((path) => PIXI.Assets.load([path]).catch(() => ({}))),
        ...shuttleTexturePaths.map((path) => PIXI.Assets.load([path]).catch(() => ({}))),
        PIXI.Assets.load([safariGatePylonArtwork.path]).catch(() => ({})),
      ]);
      textures = Object.assign({}, baseTextures, paraWalkTextures, ...rasterTextures);
    } catch (error) {
      if (app.renderer) {
        app.destroy(true, { children: true });
      } else {
        app.stage.destroy({ children: true });
      }
      throw error;
    }

    // Pixi must finish initializing before it can safely be destroyed.
    if (initializationId !== this.initializationId) {
      app.destroy(true, { children: true });
      return;
    }

    this.parkTextures = textures;
    this.app = app;
    this.container = container;

    // DOM에 캔버스 추가
    container.appendChild(app.canvas);

    // 레이어 구조 생성
    this.worldContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.uiContainer);

    // 아이소메트릭 그리드 생성
    this.grid = new IsometricGrid(gridSize, gridSize);
    this.worldContainer.addChild(this.grid);
    this.scenery = new ParkScenery(this.parkTextures);
    this.grid.attachScenery(this.scenery);

    // 초기 카메라 위치 (그리드 중앙)
    this.centerCamera();
    this.cameraFit = 'park';

    // 입력 핸들러 설정
    this.setupInputHandlers();

    // 리사이즈 핸들러
    window.addEventListener('resize', this.handleResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(container);
    }

    // 게임 루프 시작
    this.app.ticker.add(this.update);

    this.isInitialized = true;
  }

  /**
   * 게임 엔진 정리
   */
  destroy(): void {
    // Invalidate pending initialization even before there is an active renderer.
    this.initializationId++;

    window.removeEventListener('resize', this.handleResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.app?.canvas.removeEventListener('wheel', this.onWheel);
    this.app?.canvas.removeEventListener('click', this.onCanvasClick);

    // 엔티티 정리
    this.dinosaurs.clear();
    this.buildings.clear();
    this.buildingTextureRequests.clear();
    this.habitatFences.clear();
    this.buildingTimers.clear();
    this.lastTimerSecond = 0;
    this.visibleDinosaurs = [];
    this.parkBuildings = [];
    this.parasaurolophusMotion = null;

    // 이벤트 리스너 정리
    this.eventListeners.clear();

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }

    this.worldContainer = null;
    this.grid = null;
    this.uiContainer = null;
    this.scenery = null;
    this.safariScenery = null;
    this.placementPreview = null;
    this.placementTile = null;
    this.movingBuildingId = null;
    this.hasPresentedPark = false;
    this.parkIsOpen = false;
    this.container = null;

    this.isInitialized = false;
    this.activePointerId = null;
    this.placementDragOffset = null;
    this.tappedBuildingId = null;
    this.isPlacing = false;
  }

  /**
   * 입력 핸들러 설정
   */
  private setupInputHandlers(): void {
    if (!this.app || !this.worldContainer) return;

    // 스테이지를 인터랙티브로 설정
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // 포인터 이벤트
    this.app.stage.on('pointerdown', this.onPointerDown);
    this.app.stage.on('pointerup', this.onPointerUp);
    this.app.stage.on('pointerupoutside', this.onPointerCancel);
    this.app.stage.on('pointercancel', this.onPointerCancel);
    this.app.stage.on('pointermove', this.onPointerMove);

    // 휠 이벤트 (줌)
    this.app.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.app.canvas.addEventListener('click', this.onCanvasClick);
  }

  /**
   * 포인터 다운
   */
  private onPointerDown = (event: PIXI.FederatedPointerEvent): void => {
    if (this.activePointerId !== null || event.button !== 0) return;
    this.activePointerId = event.pointerId;
    this.tappedBuildingId = null;
    this.didDrag = false;
    this.pointerStart = { x: event.globalX, y: event.globalY };
    this.lastPointerPosition = { x: event.globalX, y: event.globalY };
    if (
      this.movingBuildingId &&
      this.placementTile &&
      this.placementPreview?.getBounds().containsPoint(event.globalX, event.globalY)
    ) {
      const pointer = this.toWorldPoint(event.globalX, event.globalY);
      const origin = gridToScreen(this.placementTile.x, this.placementTile.y);
      if (pointer) {
        this.placementDragOffset = { x: origin.x - pointer.x, y: origin.y - pointer.y };
      }
    }
  };

  /**
   * 포인터 업
   */
  private onPointerUp = (event: PIXI.FederatedPointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;
    if (this.didDrag && this.placementDragOffset) {
      this.dragPlacement(event.globalX, event.globalY);
    } else if (!this.didDrag && !this.movingBuildingId) {
      this.handleClick(event.globalX, event.globalY);
    }
    this.onPointerCancel(event);
  };

  private onPointerCancel = (event: PIXI.FederatedPointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    this.placementDragOffset = null;
  };

  /**
   * 포인터 이동
   */
  private onPointerMove = (event: PIXI.FederatedPointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;

    if (Math.hypot(event.globalX - this.pointerStart.x, event.globalY - this.pointerStart.y) > 5) {
      this.didDrag = true;
    }
    if (!this.didDrag) return;
    if (this.placementDragOffset) {
      this.dragPlacement(event.globalX, event.globalY);
      return;
    }
    const dx = event.globalX - this.lastPointerPosition.x;
    const dy = event.globalY - this.lastPointerPosition.y;

    this.moveCamera(this.cameraX - dx / this.cameraZoom, this.cameraY - dy / this.cameraZoom);

    this.lastPointerPosition = { x: event.globalX, y: event.globalY };
  };

  private onCanvasClick = (): void => {
    // Let the browser finish the canvas tap before mounting controls under the pointer.
    const id = this.tappedBuildingId;
    this.tappedBuildingId = null;
    if (!this.isPlacing && id && this.buildings.has(id)) {
      this.emit('entity:click', { type: 'building', id });
    }
  };

  private dragPlacement(screenX: number, screenY: number): void {
    const point = this.toWorldPoint(screenX, screenY);
    const offset = this.placementDragOffset;
    if (!point || !offset) return;
    const tile = screenToGrid(point.x + offset.x, point.y + offset.y);
    if (tile.x === this.placementTile?.x && tile.y === this.placementTile.y) return;
    this.placementTile = tile;
    this.emit('placement:move', { gridX: tile.x, gridY: tile.y });
  }

  /**
   * 휠 (줌)
   */
  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();

    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    this.setZoom(this.cameraZoom * zoomDelta);
  };

  /**
   * 클릭 핸들링
   */
  private handleClick(screenX: number, screenY: number): void {
    const point = this.toWorldPoint(screenX, screenY);
    if (!point) return;
    const { x: gridX, y: gridY } = screenToGrid(point.x, point.y);
    this.emit('tile:click', { gridX, gridY });
  }

  private toWorldPoint(screenX: number, screenY: number): { x: number; y: number } | null {
    if (!this.worldContainer) return null;
    return {
      x: (screenX - this.worldContainer.x) / this.cameraZoom,
      y: (screenY - this.worldContainer.y) / this.cameraZoom,
    };
  }

  /**
   * 리사이즈 핸들러
   */
  private handleResize = (): void => {
    if (!this.app || !this.container) return;

    const { clientWidth, clientHeight } = this.container;
    if (clientWidth === 0 || clientHeight === 0) return;
    this.app.renderer.resize(clientWidth, clientHeight);
    if (this.cameraFit === 'island') this.fitIsland();
    else if (this.hasPresentedPark && this.cameraFit === 'park') this.fitPark();
    else this.updateCamera();
  };

  /**
   * 게임 루프 업데이트
   */
  private update = (ticker: PIXI.Ticker): void => {
    if (this.isPaused) return;
    this.syncBuildingCountdowns();

    // 엔티티 정렬 (z-index)
    this.animateParasaurolophus(ticker.deltaMS);
    this.grid?.sortEntities();
    this.scenery?.update(ticker.deltaMS);
  };

  /**
   * 카메라 이동
   */
  moveCamera(x: number, y: number): void {
    this.cameraFit = null;
    const { left, top, right, bottom } = getIslandScreenBounds();
    this.cameraX = Math.max(left, Math.min(right, x));
    this.cameraY = Math.max(top, Math.min(bottom, y));
    this.updateCamera();
    this.emit('camera:move', { x: this.cameraX, y: this.cameraY });
  }

  /**
   * 카메라 중앙으로 이동
   */
  centerCamera(): void {
    if (!this.grid || !this.container) return;

    const gridSize = this.grid.getGridSize();
    const centerGrid = gridToScreen(gridSize.width / 2, gridSize.height / 2);

    this.moveCamera(centerGrid.x, centerGrid.y);
  }

  /**
   * 줌 설정
   */
  setZoom(zoom: number): void {
    this.cameraFit = null;
    const minZoom = this.isPlacing
      ? PARK_MIN_ZOOM
      : Math.min(PARK_MIN_ZOOM, this.getIslandFitZoom());
    this.cameraZoom = Math.max(minZoom, Math.min(MAX_ZOOM, zoom));
    this.updateCamera();
    this.emit('camera:zoom', { zoom: this.cameraZoom });
  }

  /**
   * 카메라 업데이트
   */
  private updateCamera(): void {
    if (!this.worldContainer || !this.container) return;

    const centerX = this.container.clientWidth / 2;
    const centerY = this.container.clientHeight / 2;

    this.worldContainer.x = centerX - this.cameraX * this.cameraZoom;
    this.worldContainer.y = centerY - this.cameraY * this.cameraZoom;
    this.worldContainer.scale.set(this.cameraZoom);
  }

  setPlacementMode(active: boolean, movingBuildingId: string | null = null): void {
    if (active && !this.isPlacing && this.parasaurolophusMotion)
      this.resetParasaurolophus(this.parasaurolophusMotion);
    if (active && !this.isPlacing && this.grid) {
      const { width, height } = this.grid.getGridSize();
      const { x, y } = screenToGrid(this.cameraX, this.cameraY);
      if (this.cameraZoom < PARK_MIN_ZOOM || x < 0 || x > width || y < 0 || y > height)
        this.fitPark();
      this.cameraFit = null;
    }
    this.isPlacing = active;
    if (this.movingBuildingId !== movingBuildingId) {
      if (this.movingBuildingId) this.setBuildingVisibility(this.movingBuildingId, true);
      if (movingBuildingId) this.setBuildingVisibility(movingBuildingId, false);
      this.movingBuildingId = movingBuildingId;
      this.placementDragOffset = null;
      this.activePointerId = null;
    }
    if (!active) {
      this.grid?.highlightTile(null);
      this.clearEntrancePreview();
      this.placementPreview?.destroy({ children: true });
      this.placementPreview = null;
      this.placementTile = null;
    }
  }

  highlightTile(x: number, y: number): void {
    this.grid?.highlightTile({ x, y });
  }

  setShowGrid(show: boolean): void {
    this.grid?.setShowGrid(show);
  }

  setShuttleFocus(exhibitId: string | null): void {
    this.scenery?.setShuttleFocus(exhibitId);
  }

  syncSafari(safari: ParkSafariResponse): void {
    if (!this.grid) return;
    if (!this.safariScenery) {
      this.safariScenery = new ParkSafariScenery(this.parkTextures);
      this.grid.attachSafariGround(this.safariScenery.ground);
    }
    this.safariScenery.sync(this.grid, safari);
  }

  syncPark(width: number, height: number, operations: ParkOperationsResponse): void {
    if (!this.isInitialized || !this.grid) return;
    const previousSize = this.grid.getGridSize();
    this.grid.setGridSize(width, height);
    const parkResized = previousSize.width !== width || previousSize.height !== height;
    if (parkResized) this.refreshParasaurolophusWalk();
    this.parkIsOpen = operations.isOpen;
    if (operations.entrance) {
      const { id, x, y, side } = operations.entrance;
      const gate = this.buildings.get(id);
      if (gate) this.placeGate(gate, x, y, side);
    }
    this.scenery?.sync(width, height, operations);
    if (!this.hasPresentedPark || parkResized) {
      this.hasPresentedPark = true;
      if (this.cameraFit === 'park') this.fitPark();
    }
  }

  fitPark(): void {
    if (!this.grid || !this.container) return;
    const { width, height } = this.grid.getGridSize();
    this.cameraZoom = Math.max(
      PARK_MIN_ZOOM,
      Math.min(
        1,
        (this.container.clientWidth - 32) / ((width + height) * 32),
        (this.container.clientHeight - 56) / ((width + height) * 16),
      ),
    );
    this.centerCamera();
    this.cameraFit = 'park';
    this.emit('camera:zoom', { zoom: this.cameraZoom });
  }

  private getIslandFitZoom(): number {
    if (!this.container) return PARK_MIN_ZOOM;
    const { left, top, right, bottom } = getIslandScreenBounds();
    const { clientWidth, clientHeight } = this.container;
    if (clientWidth === 0 || clientHeight === 0) return PARK_MIN_ZOOM;
    return Math.min(
      MAX_ZOOM,
      (clientWidth - Math.min(32, clientWidth / 4)) / (right - left),
      (clientHeight - Math.min(32, clientHeight / 4)) / (bottom - top),
    );
  }

  fitIsland(): void {
    if (!this.container || this.isPlacing) return;
    const { left, top, right, bottom } = getIslandScreenBounds();
    this.cameraZoom = this.getIslandFitZoom();
    this.moveCamera((left + right) / 2, (top + bottom) / 2);
    this.cameraFit = 'island';
    this.emit('camera:zoom', { zoom: this.cameraZoom });
  }

  focusTile(x: number, y: number): void {
    const point = gridToScreen(x, y);
    this.setZoom(1);
    this.moveCamera(point.x, point.y);
  }

  previewBuilding(
    typeId: string,
    position: { x: number; y: number },
    valid: boolean,
    side?: ParkEntranceSide | null,
    isMirrored = false,
  ): void {
    if (!this.grid || !this.isInitialized) return;
    const type = getBuildingById(typeId);
    const width = type?.size.width ?? 1,
      height = type?.size.height ?? 1;
    this.grid.highlightArea(position, width, height, valid);
    this.placementTile = position;
    if (this.placementPreview?.label !== typeId) {
      this.clearEntrancePreview();
      this.placementPreview?.destroy({ children: true });
      this.placementPreview = new PIXI.Container();
      this.placementPreview.label = typeId;
      this.placementPreview.eventMode = 'none';
      const habitat = this.fallbackHabitatScenery(typeId, width, height);
      if (habitat) {
        this.placementPreview.addChild(habitat.ground, habitat.front);
      } else {
        this.placementPreview.addChild(new PIXI.Sprite());
      }
      this.grid.addEntity(this.placementPreview, position.x, position.y);
    }
    const artwork = this.placementPreview.children[0];
    const gateFrame =
      typeId === entranceGateId
        ? this.gateFrame(position.x, position.y, width, height, side)
        : null;
    if (artwork instanceof PIXI.Sprite) {
      if (typeId === entranceGateId) {
        const grid = this.grid.getGridSize();
        this.scenery?.previewEntrance(grid.width, grid.height, valid ? gateFrame : null);
        placeEntranceGateArtwork(
          artwork,
          gateFrame,
          (width * ISO_CONFIG.TILE_WIDTH) / 2,
          this.parkTextures,
          this.parkIsOpen,
        );
      } else {
        const movingBuilding = this.movingBuildingId
          ? this.parkBuildings.find(({ id }) => id === this.movingBuildingId)
          : undefined;
        const level = movingBuilding ? getCompletedBuildingArtworkLevel(movingBuilding) : 1;
        this.setBuildingArtwork(artwork, typeId, width * ISO_CONFIG.TILE_WIDTH, level);
      }
    }
    if (typeId !== entranceGateId) {
      for (const piece of this.placementPreview.children) {
        setBuildingArtworkMirrored(piece, isMirrored);
      }
    }
    this.placementPreview.alpha = this.movingBuildingId ? 0.85 : 0.55;
    const point =
      gateFrame?.center ??
      gridToScreen(position.x + (width - 1) / 2, position.y + (height - 1) / 2);
    this.placementPreview.position.set(point.x, point.y);
    this.placementPreview.tint = valid ? 0xffffff : 0xff7777;
  }

  syncDinosaurs(dinosaurs: DinosaurResponse[]): void {
    if (!this.isInitialized || !this.grid) return;
    const visible = dinosaurs.filter((dinosaur) => dinosaur.isInPark);
    this.visibleDinosaurs = visible;
    const ids = new Set(visible.map((dinosaur) => dinosaur.id));
    for (const id of this.dinosaurs.keys()) {
      if (!ids.has(id)) this.removeDinosaur(id);
    }
    for (const dinosaur of visible) {
      const entity = this.addDinosaur(
        dinosaur.id,
        dinosaur.positionX,
        dinosaur.positionY,
        0x4caf50,
        dinosaur.nickname ||
          dinosaur.hybrid?.species.nameKo ||
          getDinosaurById(dinosaur.speciesId)?.nameKo ||
          dinosaur.speciesId,
        dinosaur.speciesId,
      );
      const art = dinosaur.hybrid?.artwork;
      if (art) this.loadExperimentalDinosaurArtwork(dinosaur.id, entity, art);
    }
    this.refreshParasaurolophusWalk();
  }

  syncBuildings(buildings: BuildingResponse[]): void {
    if (!this.isInitialized || !this.grid) return;
    this.parkBuildings = buildings;
    const ids = new Set(buildings.map((building) => building.id));
    for (const id of this.buildings.keys()) {
      if (!ids.has(id)) this.removeBuilding(id);
    }
    for (const building of buildings) {
      const sprite = this.addBuilding(
        building.id,
        building.positionX,
        building.positionY,
        building.typeId,
        building.entranceSide,
      );
      const status = building.status.toLowerCase();
      const constructing = status === 'constructing';
      const upgrading = status === 'upgrading';
      const isPlatform = building.typeId === PARK_ADMISSION.platformTypeId;
      const artwork = sprite.children[0];
      const label = sprite.children[1] as PIXI.Text;
      artwork.alpha = constructing ? 0.5 : 1;
      label.alpha = artwork.alpha;
      const habitatFence = this.habitatFences.get(building.id);
      if (habitatFence) habitatFence.alpha = artwork.alpha;
      const level = getCompletedBuildingArtworkLevel(building);
      if (
        (isPlatform || hasHabitatFenceUpgrade(building.typeId)) &&
        artwork instanceof PIXI.Sprite
      ) {
        const width = isPlatform ? 1 : (getBuildingById(building.typeId)?.size.width ?? 1);
        this.setBuildingArtwork(artwork, building.typeId, width * ISO_CONFIG.TILE_WIDTH, level);
      }
      if (building.typeId !== entranceGateId) {
        const isMirrored = building.isMirrored ?? false;
        setBuildingArtworkMirrored(artwork, isMirrored);
        if (habitatFence) setBuildingArtworkMirrored(habitatFence, isMirrored);
      }
      const completesAt = building.completesAt ? Date.parse(building.completesAt) : NaN;
      const showCountdown = (constructing || upgrading) && Number.isFinite(completesAt);
      label.visible = !showCountdown;
      if (showCountdown) {
        const countdown = this.buildingTimers.get(building.id) ?? this.addBuildingCountdown(sprite);
        countdown.completesAt = completesAt;
        countdown.badge.y = Math.min(-25, -artwork.height * 0.65);
        this.buildingTimers.set(building.id, countdown);
      } else {
        this.buildingTimers.get(building.id)?.badge.destroy({ children: true });
        this.buildingTimers.delete(building.id);
        label.y = this.buildingLabelY(building.typeId, artwork);
        const name = getBuildingById(building.typeId)?.nameKo ?? building.typeId;
        label.text = level > 1 ? `${name} Lv.${level}` : name;
      }
    }
    this.lastTimerSecond = 0;
    this.syncBuildingCountdowns();
    this.refreshParasaurolophusWalk();
  }

  private addBuildingCountdown(building: PIXI.Container): BuildingCountdown {
    const badge = new PIXI.Container({ eventMode: 'none' });
    const plate = new PIXI.Graphics();
    const text = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 25,
        fontWeight: '800',
        fill: 0xfff4dc,
      },
    });
    text.anchor.set(0.5);
    badge.addChild(plate, text);
    building.addChild(badge);
    return { completesAt: 0, badge, plate, text, width: 0 };
  }

  private syncBuildingCountdowns(): void {
    if (!this.buildingTimers.size) return;
    const now = Date.now();
    const second = Math.floor(now / 1000);
    if (this.lastTimerSecond === second) return;
    this.lastTimerSecond = second;
    for (const countdown of this.buildingTimers.values()) {
      countdown.text.text = formatFacilityCountdown(
        Math.max(0, Math.ceil((countdown.completesAt - now) / 1000)),
      );
      const width = Math.ceil(countdown.text.width) + 20;
      if (width === countdown.width) continue;
      countdown.width = width;
      countdown.plate
        .clear()
        .roundRect(-width / 2, -18, width, 36, 10)
        .fill({ color: 0x37361e, alpha: 0.83 });
    }
  }

  addDinosaur(
    id: string,
    gridX: number,
    gridY: number,
    color = 0x4caf50,
    name = '공룡',
    speciesId = 'parasaurolophus',
  ): PIXI.Container {
    const existing = this.dinosaurs.get(id);
    if (existing) {
      const { x, y } = gridToScreen(gridX, gridY);
      const motion = this.parasaurolophusMotion;
      if (motion?.id !== id || motion.route.home.x !== x || motion.route.home.y !== y)
        existing.position.set(x, y);
      return existing;
    }
    const dinosaur = new PIXI.Container();
    const artwork = dinosaurRasterArtwork.get(speciesId);
    const shadow = createDinosaurShadow(artwork?.width ?? 86);
    const texture = artwork && this.parkTextures[artwork.path];
    const sprite = new PIXI.Sprite(
      texture ?? this.parkTextures[fallbackDinosaurArtwork(speciesId)],
    );
    if (artwork && texture) {
      sprite.anchor.set(0.5, 228 / 256);
      sprite.width = artwork.width;
      sprite.height = (artwork.width * texture.height) / texture.width;
    } else {
      sprite.anchor.set(0.5, 0.94);
      sprite.width = 86;
      sprite.height = 78;
    }
    sprite.tint = color === 0x4caf50 ? 0xffffff : color;
    dinosaur.addChild(shadow, sprite, this.makeLabel(name, 18));
    dinosaur.eventMode = 'static';
    dinosaur.cursor = 'pointer';
    dinosaur.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      if (this.isPlacing) return;
      event.stopPropagation();
      this.emit('entity:click', { type: 'dinosaur', id });
    });
    this.grid?.addEntity(dinosaur, gridX, gridY);
    this.dinosaurs.set(id, dinosaur);
    return dinosaur;
  }

  private loadExperimentalDinosaurArtwork(
    id: string,
    entity: PIXI.Container,
    artwork: { idleUrl: string; width: number },
  ) {
    const sprite = entity.children[1] as PIXI.Sprite;
    const src = hybridArtworkUrl(artwork.idleUrl);
    if (sprite.label === src) return;
    sprite.label = src;
    void PIXI.Assets.load<PIXI.Texture>({ src, parser: 'texture' })
      .then((texture) => {
        if (!texture || this.dinosaurs.get(id) !== entity || sprite.label !== src) return;
        sprite.texture = texture;
        sprite.anchor.set(0.5, 228 / 256);
        sprite.width = artwork.width;
        sprite.height = (artwork.width * texture.height) / texture.width;
      })
      .catch(() => {
        if (this.dinosaurs.get(id) === entity && sprite.label === src) sprite.label = '';
      });
  }

  removeDinosaur(id: string): void {
    if (this.parasaurolophusMotion?.id === id) this.parasaurolophusMotion = null;
    this.dinosaurs.get(id)?.destroy({ children: true });
    this.dinosaurs.delete(id);
  }

  private refreshParasaurolophusWalk(): void {
    const current = this.parasaurolophusMotion;
    const grid = this.grid?.getGridSize();
    const candidate =
      this.visibleDinosaurs.find(({ id }) => id === current?.id) ??
      this.visibleDinosaurs.find(({ speciesId }) => speciesId === parasaurolophusArtwork.speciesId);
    const entity = candidate && this.dinosaurs.get(candidate.id);
    const canAnimate =
      !!this.parkTextures[parasaurolophusArtwork.idle] &&
      parasaurolophusArtwork.walk.every((path) => !!this.parkTextures[path]) &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const route =
      entity && candidate && grid && canAnimate
        ? findParasaurolophusWalk(candidate, this.parkBuildings, this.visibleDinosaurs, grid)
        : null;

    if (
      current?.id === candidate?.id &&
      current &&
      route &&
      current.route.home.x === route.home.x &&
      current.route.home.y === route.home.y &&
      current.route.destination.x === route.destination.x
    )
      return;

    if (current) {
      const saved = this.visibleDinosaurs.find(({ id }) => id === current.id);
      const home = saved && gridToScreen(saved.positionX, saved.positionY);
      this.resetParasaurolophus(current, home);
    }

    this.parasaurolophusMotion =
      candidate && entity && route
        ? {
            id: candidate.id,
            entity,
            sprite: entity.children[1] as PIXI.Sprite,
            route,
            elapsedMs: 0,
          }
        : null;
  }

  private resetParasaurolophus(motion: ParasaurolophusMotion, home = motion.route.home): void {
    motion.elapsedMs = 0;
    motion.entity.position.set(home.x, home.y);
    motion.sprite.texture = this.parkTextures[parasaurolophusArtwork.idle];
    motion.sprite.scale.x = Math.abs(motion.sprite.scale.x);
  }

  private animateParasaurolophus(deltaMs: number): void {
    const motion = this.parasaurolophusMotion;
    if (!motion || this.isPlacing || !Number.isFinite(deltaMs)) return;
    motion.elapsedMs += Math.max(0, deltaMs);
    const pose = sampleParasaurolophusWalk(
      motion.route,
      motion.elapsedMs,
      parasaurolophusArtwork.walk.length,
    );
    motion.entity.position.set(pose.position.x, pose.position.y);
    const path =
      pose.frame === null ? parasaurolophusArtwork.idle : parasaurolophusArtwork.walk[pose.frame];
    const texture = this.parkTextures[path];
    if (motion.sprite.texture !== texture) motion.sprite.texture = texture;
    motion.sprite.scale.x = Math.abs(motion.sprite.scale.x) * (pose.facingRight ? 1 : -1);
  }

  addBuilding(
    id: string,
    gridX: number,
    gridY: number,
    typeId = 'habitat-grassland',
    entranceSide?: ParkEntranceSide | null,
  ): PIXI.Container {
    const type = getBuildingById(typeId);
    const width = type?.size.width ?? 1;
    const height = type?.size.height ?? 1;
    const centerX = gridX + (width - 1) / 2;
    const centerY = gridY + (height - 1) / 2;
    const existing = this.buildings.get(id);
    if (existing) {
      if (typeId === entranceGateId) {
        this.placeGate(existing, gridX, gridY, entranceSide);
        return existing;
      }
      const point = gridToScreen(centerX, centerY);
      existing.position.set(point.x, point.y);
      const habitatFence = this.habitatFences.get(id);
      if (habitatFence) habitatFence.position.set(point.x, point.y + habitatFence.pivot.y);
      return existing;
    }
    const building = new PIXI.Container();
    building.visible = id !== this.movingBuildingId;
    building.zIndex = type?.category === 'dinosaur' ? -1 : 0;
    const habitat = this.fallbackHabitatScenery(typeId, width, height);
    const artwork = habitat?.ground ?? new PIXI.Sprite();
    const label = this.makeLabel(type?.nameKo ?? typeId, 0);
    if (artwork instanceof PIXI.Sprite && typeId !== entranceGateId) {
      this.setBuildingArtwork(
        artwork,
        typeId,
        (type?.size.width ?? 3) * ISO_CONFIG.TILE_WIDTH,
        1,
        () => {
          const countdown = this.buildingTimers.get(id);
          if (countdown) countdown.badge.y = Math.min(-25, -artwork.height * 0.65);
          else label.y = this.buildingLabelY(typeId, artwork);
        },
      );
    }
    label.y = this.buildingLabelY(typeId, artwork);
    building.addChild(artwork, label);
    building.eventMode = 'static';
    building.cursor = 'pointer';
    building.on('pointertap', (event: PIXI.FederatedPointerEvent) => {
      if (this.isPlacing || this.didDrag) return;
      event.stopPropagation();
      this.tappedBuildingId = id;
    });
    this.grid?.addEntity(building, centerX, centerY);
    if (typeId === entranceGateId) this.placeGate(building, gridX, gridY, entranceSide);
    if (habitat) {
      // Sort the low front fence at its near edge, while the ground stays behind animals.
      const frontDepth = ((width + height) * ISO_CONFIG.TILE_HEIGHT) / 4;
      habitat.front.pivot.y = frontDepth;
      habitat.front.visible = building.visible;
      this.grid?.addEntity(
        habitat.front,
        centerX + (width + height) / 4,
        centerY + (width + height) / 4,
      );
      this.habitatFences.set(id, habitat.front);
    }
    this.buildings.set(id, building);
    return building;
  }

  private setBuildingVisibility(id: string, visible: boolean): void {
    const building = this.buildings.get(id);
    if (building) building.visible = visible;
    const fence = this.habitatFences.get(id);
    if (fence) fence.visible = visible;
  }

  private setBuildingArtwork(
    sprite: PIXI.Sprite,
    typeId: string,
    width: number,
    completedLevel = 1,
    onReady?: () => void,
  ): void {
    const path = buildingArtwork(typeId, completedLevel, this.parkIsOpen);
    const texture = this.parkTextures[path];
    const alignPlatform = typeId === PARK_ADMISSION.platformTypeId;
    const raster = getBuildingRasterArtwork(typeId, completedLevel);
    if (texture) {
      sprite.label = path;
      this.applyBuildingTexture(sprite, texture, width, raster, alignPlatform);
      return;
    }
    if (sprite.label === path) return;
    if (!sprite.label) {
      this.applyBuildingTexture(sprite, this.parkTextures[fallbackBuildingArtwork(typeId)], width);
    }
    sprite.label = path;

    const initializationId = this.initializationId;
    let request = this.buildingTextureRequests.get(path);
    if (!request) {
      request = PIXI.Assets.load([path])
        .then((textures) => textures[path] ?? null)
        .catch(() => null);
      this.buildingTextureRequests.set(path, request);
    }
    void request.then((loaded) => {
      if (!loaded || this.initializationId !== initializationId) return;
      this.parkTextures[path] = loaded;
      if (sprite.destroyed || sprite.label !== path) return;
      this.applyBuildingTexture(sprite, loaded, width, raster, alignPlatform);
      onReady?.();
    });
  }

  private applyBuildingTexture(
    sprite: PIXI.Sprite,
    texture: PIXI.Texture,
    width: number,
    raster?: BuildingRaster,
    alignPlatform = false,
  ): void {
    const mirrored = sprite.scale.x < 0;
    if (sprite.texture !== texture) sprite.texture = texture;
    sprite.width = width;
    if (alignPlatform) {
      sprite.height = width * (texture.height / texture.width);
      // The existing platform is aligned by the near point of its tile.
      sprite.anchor.set(0.5, 1 - ISO_CONFIG.TILE_HEIGHT / 2 / sprite.height);
    } else if (raster) {
      sprite.height = width * (texture.height / texture.width);
      const groundAnchor =
        raster.groundAnchorY ?? Math.max(0.5, 1 - texture.width / (4 * texture.height));
      sprite.anchor.set(0.5, groundAnchor);
    } else {
      sprite.height = width * (128 / 192);
      sprite.anchor.set(0.5, 63 / 128);
    }
    setBuildingArtworkMirrored(sprite, mirrored);
  }

  private fallbackHabitatScenery(typeId: string, width: number, height: number) {
    if (!isHabitatWithScenery(typeId)) return null;
    const artwork = buildingRasterArtwork.get(typeId);
    return artwork && this.parkTextures[artwork.path]
      ? null
      : createHabitatScenery(typeId, width, height);
  }

  private buildingLabelY(typeId: string, artwork: PIXI.Container): number {
    if (isHabitatWithScenery(typeId)) {
      const size = getBuildingById(typeId)?.size;
      return size ? ((size.width + size.height) * ISO_CONFIG.TILE_HEIGHT) / 4 + 3 : 0;
    }
    if (typeId === entranceGateId) return 10;
    return artwork instanceof PIXI.Sprite &&
      (typeId === PARK_ADMISSION.platformTypeId || buildingRasterArtwork.has(typeId))
      ? artwork.height * (1 - artwork.anchor.y) + 3
      : artwork.height * 0.45;
  }

  private clearEntrancePreview(): void {
    if (this.placementPreview?.label !== entranceGateId || !this.grid) return;
    const { width, height } = this.grid.getGridSize();
    this.scenery?.previewEntrance(width, height, null);
  }

  private gateFrame(
    x: number,
    y: number,
    width: number,
    height: number,
    side?: ParkEntranceSide | null,
  ) {
    const grid = this.grid?.getGridSize();
    return grid
      ? getParkEntranceFrame(grid.width, grid.height, {
          x,
          y,
          width,
          height,
          onBoundary: true,
          side,
        })
      : null;
  }

  private placeGate(
    building: PIXI.Container,
    x: number,
    y: number,
    side?: ParkEntranceSide | null,
  ): void {
    const gate = getBuildingById(entranceGateId);
    if (!gate) return;
    const { width, height } = gate.size;
    const frame = this.gateFrame(x, y, width, height, side);
    const point = frame?.center ?? gridToScreen(x + (width - 1) / 2, y + (height - 1) / 2);
    building.position.set(point.x, point.y);
    const sprite = building.children[0] as PIXI.Sprite;
    placeEntranceGateArtwork(
      sprite,
      frame,
      (width * ISO_CONFIG.TILE_WIDTH) / 2,
      this.parkTextures,
      this.parkIsOpen,
    );
  }

  private makeLabel(text: string, y: number): PIXI.Text {
    const label = new PIXI.Text({
      text,
      style: {
        fontFamily: 'sans-serif',
        fontSize: 12,
        fontWeight: '600',
        fill: 0x24432e,
        stroke: { color: 0xffffff, width: 4 },
      },
    });
    label.anchor.set(0.5, 0);
    label.y = y;
    return label;
  }

  removeBuilding(id: string): void {
    this.buildings.get(id)?.destroy({ children: true });
    this.buildings.delete(id);
    this.buildingTimers.delete(id);
    this.habitatFences.get(id)?.destroy();
    this.habitatFences.delete(id);
  }

  /**
   * 이벤트 리스너 등록
   */
  on<K extends keyof GameEngineEvents>(
    event: K,
    callback: EventCallback<GameEngineEvents[K]>,
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  /**
   * 이벤트 리스너 제거
   */
  off<K extends keyof GameEngineEvents>(
    event: K,
    callback: EventCallback<GameEngineEvents[K]>,
  ): void {
    this.eventListeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  /**
   * 이벤트 발생
   */
  private emit<K extends keyof GameEngineEvents>(event: K, data: GameEngineEvents[K]): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }

  /**
   * 게임 일시정지
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 게임 재개
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * PIXI Application 접근자
   */
  getApp(): PIXI.Application | null {
    return this.app;
  }

  /**
   * 그리드 접근자
   */
  getGrid(): IsometricGrid | null {
    return this.grid;
  }

  /**
   * 카메라 상태
   */
  getCameraState(): { x: number; y: number; zoom: number } {
    return { x: this.cameraX, y: this.cameraY, zoom: this.cameraZoom };
  }
}

// 싱글톤 인스턴스
export const gameEngine = new GameEngine();
