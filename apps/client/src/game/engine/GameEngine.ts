import * as PIXI from 'pixi.js';
import { IsometricGrid, ISO_CONFIG, gridToScreen, screenToGrid } from './IsometricGrid';
import { ParkScenery } from './ParkScenery';
import { buildingArtwork, dinosaurArtwork, parkTexturePaths } from '../parkArtwork';
import {
  getBuildingById,
  getDinosaurById,
  getViewingPlatformCompletedLevel,
} from '@dino-park/game-data';
import { PARK_ADMISSION } from '@dino-park/shared';
import type { BuildingResponse, DinosaurResponse, ParkOperationsResponse } from '@dino-park/shared';

// 이벤트 타입
export interface GameEngineEvents {
  'tile:click': { gridX: number; gridY: number };
  'entity:click': { type: 'dinosaur' | 'building'; id: string };
  'camera:move': { x: number; y: number };
  'camera:zoom': { zoom: number };
}

type EventCallback<T> = (data: T) => void;

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
  private placementPreview: PIXI.Sprite | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private hasPresentedPark = false;
  private parkIsOpen = false;

  // 카메라
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 1;
  private isDragging = false;
  private didDrag = false;
  private pointerStart = { x: 0, y: 0 };
  private isPlacing = false;
  private parkTextures: Record<string, PIXI.Texture> = {};
  private lastPointerPosition = { x: 0, y: 0 };

  // 엔티티 맵
  private dinosaurs: Map<string, PIXI.Container> = new Map();
  private buildings: Map<string, PIXI.Container> = new Map();

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
        backgroundColor: 0x87ceeb,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
      textures = await PIXI.Assets.load(parkTexturePaths);
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
    this.scenery = new ParkScenery();
    this.grid.attachScenery(this.scenery);

    // 초기 카메라 위치 (그리드 중앙)
    this.centerCamera();

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

    // 엔티티 정리
    this.dinosaurs.clear();
    this.buildings.clear();

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
    this.placementPreview = null;
    this.hasPresentedPark = false;
    this.parkIsOpen = false;
    this.container = null;

    this.isInitialized = false;
    this.isDragging = false;
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
    this.app.stage.on('pointerupoutside', this.onPointerUp);
    this.app.stage.on('pointermove', this.onPointerMove);

    // 휠 이벤트 (줌)
    this.app.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  /**
   * 포인터 다운
   */
  private onPointerDown = (event: PIXI.FederatedPointerEvent): void => {
    this.isDragging = true;
    this.didDrag = false;
    this.pointerStart = { x: event.globalX, y: event.globalY };
    this.lastPointerPosition = { x: event.globalX, y: event.globalY };
  };

  /**
   * 포인터 업
   */
  private onPointerUp = (event: PIXI.FederatedPointerEvent): void => {
    if (this.isDragging && !this.didDrag) {
      this.handleClick(event.globalX, event.globalY);
    }

    this.isDragging = false;
  };

  /**
   * 포인터 이동
   */
  private onPointerMove = (event: PIXI.FederatedPointerEvent): void => {
    if (!this.isDragging) return;

    if (Math.hypot(event.globalX - this.pointerStart.x, event.globalY - this.pointerStart.y) > 5) {
      this.didDrag = true;
    }
    if (!this.didDrag) return;
    const dx = event.globalX - this.lastPointerPosition.x;
    const dy = event.globalY - this.lastPointerPosition.y;

    this.moveCamera(this.cameraX - dx / this.cameraZoom, this.cameraY - dy / this.cameraZoom);

    this.lastPointerPosition = { x: event.globalX, y: event.globalY };
  };

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
    if (!this.worldContainer) return;

    // 화면 좌표를 월드 좌표로 변환
    const worldX = (screenX - this.worldContainer.x) / this.cameraZoom;
    const worldY = (screenY - this.worldContainer.y) / this.cameraZoom;

    // 그리드 좌표로 변환
    const { x: gridX, y: gridY } = screenToGrid(worldX, worldY);

    this.emit('tile:click', { gridX, gridY });
  }

  /**
   * 리사이즈 핸들러
   */
  private handleResize = (): void => {
    if (!this.app || !this.container) return;

    const { clientWidth, clientHeight } = this.container;
    this.app.renderer.resize(clientWidth, clientHeight);
    this.updateCamera();
  };

  /**
   * 게임 루프 업데이트
   */
  private update = (ticker: PIXI.Ticker): void => {
    if (this.isPaused) return;

    // 엔티티 정렬 (z-index)
    this.grid?.sortEntities();
    this.scenery?.update(ticker.deltaMS);
  };

  /**
   * 카메라 이동
   */
  moveCamera(x: number, y: number): void {
    this.cameraX = x;
    this.cameraY = y;
    this.updateCamera();
    this.emit('camera:move', { x, y });
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
    this.cameraZoom = Math.max(0.2, Math.min(2, zoom));
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

  setPlacementMode(active: boolean): void {
    this.isPlacing = active;
    if (!active) {
      this.grid?.highlightTile(null);
      this.placementPreview?.destroy();
      this.placementPreview = null;
    }
  }

  highlightTile(x: number, y: number): void {
    this.grid?.highlightTile({ x, y });
  }

  setShowGrid(show: boolean): void {
    this.grid?.setShowGrid(show);
  }

  syncPark(width: number, height: number, operations: ParkOperationsResponse): void {
    if (!this.isInitialized || !this.grid) return;
    this.grid.setGridSize(width, height);
    this.parkIsOpen = operations.isOpen;
    for (const building of this.buildings.values()) this.updateGateAppearance(building);
    this.scenery?.sync(width, height, operations);
    if (!this.hasPresentedPark) {
      this.hasPresentedPark = true;
      this.fitPark();
    }
  }

  fitPark(): void {
    if (!this.grid || !this.container) return;
    const { width, height } = this.grid.getGridSize();
    this.setZoom(
      Math.min(
        1,
        (this.container.clientWidth - 32) / ((width + height) * 32),
        (this.container.clientHeight - 56) / ((width + height) * 16),
      ),
    );
    this.centerCamera();
  }

  focusTile(x: number, y: number): void {
    const point = gridToScreen(x, y);
    this.setZoom(1);
    this.moveCamera(point.x, point.y);
  }

  previewBuilding(typeId: string, position: { x: number; y: number }, valid: boolean): void {
    if (!this.grid || !this.isInitialized) return;
    const type = getBuildingById(typeId);
    const width = type?.size.width ?? 1,
      height = type?.size.height ?? 1;
    this.grid.highlightArea(position, width, height, valid);
    if (!this.placementPreview) {
      this.placementPreview = new PIXI.Sprite();
      this.placementPreview.alpha = 0.55;
      this.placementPreview.eventMode = 'none';
      this.grid.addEntity(this.placementPreview, position.x, position.y);
    }
    this.setBuildingArtwork(this.placementPreview, typeId, width * ISO_CONFIG.TILE_WIDTH);
    const point = gridToScreen(position.x + (width - 1) / 2, position.y + (height - 1) / 2);
    this.placementPreview.position.set(point.x, point.y);
    this.placementPreview.tint = valid ? 0xffffff : 0xff7777;
  }

  syncDinosaurs(dinosaurs: DinosaurResponse[]): void {
    if (!this.isInitialized || !this.grid) return;
    const visible = dinosaurs.filter((dinosaur) => dinosaur.isInPark);
    const ids = new Set(visible.map((dinosaur) => dinosaur.id));
    for (const id of this.dinosaurs.keys()) {
      if (!ids.has(id)) this.removeDinosaur(id);
    }
    for (const dinosaur of visible) {
      this.addDinosaur(
        dinosaur.id,
        dinosaur.positionX,
        dinosaur.positionY,
        0x4caf50,
        dinosaur.nickname || getDinosaurById(dinosaur.speciesId)?.nameKo || dinosaur.speciesId,
        dinosaur.speciesId,
      );
    }
  }

  syncBuildings(buildings: BuildingResponse[]): void {
    if (!this.isInitialized || !this.grid) return;
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
      );
      sprite.alpha = building.status.toLowerCase() === 'constructing' ? 0.5 : 1;
      if (building.typeId === PARK_ADMISSION.platformTypeId) {
        const upgrading = building.status.toLowerCase() === 'upgrading';
        const level = getViewingPlatformCompletedLevel(building.level, upgrading);
        this.setBuildingArtwork(
          sprite.children[0] as PIXI.Sprite,
          building.typeId,
          ISO_CONFIG.TILE_WIDTH,
          level,
        );
        const label = sprite.children[1] as PIXI.Text;
        label.y = ISO_CONFIG.TILE_HEIGHT / 2 + 3;
        label.text = `${getBuildingById(building.typeId)?.nameKo ?? '관람대'}${level > 1 ? ` Lv.${level}` : ''}${upgrading ? ' · 확장 중' : ''}`;
      }
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
      existing.position.set(x, y);
      return existing;
    }
    const dinosaur = new PIXI.Container();
    const shadow = new PIXI.Graphics().ellipse(0, 1, 25, 10).fill({ color: 0x33542a, alpha: 0.2 });
    const sprite = new PIXI.Sprite(this.parkTextures[dinosaurArtwork(speciesId)]);
    sprite.anchor.set(0.5, 0.94);
    sprite.width = 86;
    sprite.height = 78;
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

  removeDinosaur(id: string): void {
    this.dinosaurs.get(id)?.destroy({ children: true });
    this.dinosaurs.delete(id);
  }

  addBuilding(
    id: string,
    gridX: number,
    gridY: number,
    typeId = 'habitat-grassland',
  ): PIXI.Container {
    const type = getBuildingById(typeId);
    const centerX = gridX + ((type?.size.width ?? 1) - 1) / 2;
    const centerY = gridY + ((type?.size.height ?? 1) - 1) / 2;
    const existing = this.buildings.get(id);
    if (existing) {
      const point = gridToScreen(centerX, centerY);
      existing.position.set(point.x, point.y);
      if (typeId === 'operation-entrance-gate') this.updateGateAppearance(existing);
      return existing;
    }
    const building = new PIXI.Container();
    building.zIndex = type?.category === 'dinosaur' ? -1 : 0;
    const sprite = new PIXI.Sprite();
    this.setBuildingArtwork(sprite, typeId, (type?.size.width ?? 3) * ISO_CONFIG.TILE_WIDTH);
    building.addChild(sprite, this.makeLabel(type?.nameKo ?? typeId, sprite.height * 0.45));
    if (typeId === 'operation-entrance-gate') {
      building.label = 'entrance-gate';
      this.updateGateAppearance(building);
    }
    building.eventMode = 'static';
    building.cursor = 'pointer';
    building.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      if (this.isPlacing) return;
      event.stopPropagation();
      this.emit('entity:click', { type: 'building', id });
    });
    this.grid?.addEntity(building, centerX, centerY);
    this.buildings.set(id, building);
    return building;
  }

  private setBuildingArtwork(
    sprite: PIXI.Sprite,
    typeId: string,
    width: number,
    completedLevel = 1,
  ): void {
    const texture = this.parkTextures[buildingArtwork(typeId, completedLevel)];
    if (sprite.texture !== texture) sprite.texture = texture;
    sprite.width = width;
    if (typeId === PARK_ADMISSION.platformTypeId) {
      sprite.height = width * (texture.height / texture.width);
      // Align the cropped sprite's near corner with the front point of its ground tile.
      sprite.anchor.set(0.5, 1 - ISO_CONFIG.TILE_HEIGHT / 2 / sprite.height);
      return;
    }
    const isGate = typeId === 'operation-entrance-gate';
    sprite.height = width * (isGate ? 152 / 192 : 128 / 192);
    sprite.anchor.set(0.5, isGate ? 106 / 152 : 63 / 128);
  }

  private updateGateAppearance(building: PIXI.Container): void {
    if (building.label !== 'entrance-gate') return;
    const sprite = building.children[0] as PIXI.Sprite;
    const label = building.children[1] as PIXI.Text;
    sprite.texture =
      this.parkTextures[
        `/assets/placeholders/operation-entrance-gate${this.parkIsOpen ? '-open' : ''}.svg`
      ];
    label.text = `입구 게이트 · ${this.parkIsOpen ? '개장' : '휴장'}`;
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
