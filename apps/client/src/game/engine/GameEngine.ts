import * as PIXI from 'pixi.js';
import { IsometricGrid, ISO_CONFIG, gridToScreen } from './IsometricGrid';

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
  private isPaused = false;

  // 레이어
  private worldContainer: PIXI.Container | null = null;
  private grid: IsometricGrid | null = null;
  private uiContainer: PIXI.Container | null = null;

  // 카메라
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 1;
  private isDragging = false;
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

    this.container = container;

    // PIXI Application 생성
    this.app = new PIXI.Application();

    await this.app.init({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0x87CEEB,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    // DOM에 캔버스 추가
    container.appendChild(this.app.canvas);

    // 레이어 구조 생성
    this.worldContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.uiContainer);

    // 아이소메트릭 그리드 생성
    this.grid = new IsometricGrid(gridSize, gridSize);
    this.worldContainer.addChild(this.grid);

    // 초기 카메라 위치 (그리드 중앙)
    this.centerCamera();

    // 입력 핸들러 설정
    this.setupInputHandlers();

    // 리사이즈 핸들러
    window.addEventListener('resize', this.handleResize);

    // 게임 루프 시작
    this.app.ticker.add(this.update);

    this.isInitialized = true;
    console.log('🎮 GameEngine initialized');
  }

  /**
   * 게임 엔진 정리
   */
  destroy(): void {
    if (!this.isInitialized) return;

    window.removeEventListener('resize', this.handleResize);

    // 엔티티 정리
    this.dinosaurs.clear();
    this.buildings.clear();

    // 이벤트 리스너 정리
    this.eventListeners.clear();

    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }

    this.worldContainer = null;
    this.grid = null;
    this.uiContainer = null;

    this.isInitialized = false;
    console.log('🎮 GameEngine destroyed');
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
    this.container?.addEventListener('wheel', this.onWheel, { passive: false });
  }

  /**
   * 포인터 다운
   */
  private onPointerDown = (event: PIXI.FederatedPointerEvent): void => {
    this.isDragging = true;
    this.lastPointerPosition = { x: event.globalX, y: event.globalY };
  };

  /**
   * 포인터 업
   */
  private onPointerUp = (event: PIXI.FederatedPointerEvent): void => {
    // 클릭 감지 (드래그가 아닌 경우)
    if (this.isDragging) {
      const dx = Math.abs(event.globalX - this.lastPointerPosition.x);
      const dy = Math.abs(event.globalY - this.lastPointerPosition.y);

      if (dx < 5 && dy < 5) {
        this.handleClick(event.globalX, event.globalY);
      }
    }

    this.isDragging = false;
  };

  /**
   * 포인터 이동
   */
  private onPointerMove = (event: PIXI.FederatedPointerEvent): void => {
    if (!this.isDragging) return;

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
    const { x: gridX, y: gridY } = this.screenToGrid(worldX, worldY);

    this.emit('tile:click', { gridX, gridY });
  }

  /**
   * 화면 좌표를 그리드 좌표로 변환
   */
  private screenToGrid(worldX: number, worldY: number): { x: number; y: number } {
    const hw = ISO_CONFIG.TILE_WIDTH / 2;
    const hh = ISO_CONFIG.TILE_HEIGHT / 2;

    const gridX = Math.floor((worldX / hw + worldY / hh) / 2);
    const gridY = Math.floor((worldY / hh - worldX / hw) / 2);

    return { x: gridX, y: gridY };
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

    const delta = ticker.deltaTime;

    // 엔티티 정렬 (z-index)
    this.grid?.sortEntities();

    void delta; // 임시
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
    this.cameraZoom = Math.max(0.5, Math.min(2, zoom));
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

  /**
   * 공룡 추가
   */
  addDinosaur(id: string, gridX: number, gridY: number, color = 0x4CAF50): PIXI.Container {
    if (this.dinosaurs.has(id)) {
      return this.dinosaurs.get(id)!;
    }

    // Placeholder 공룡 (사각형)
    const dino = new PIXI.Container();
    const graphics = new PIXI.Graphics();

    graphics.rect(-20, -40, 40, 40);
    graphics.fill(color);
    graphics.rect(-15, -45, 10, 10); // 머리
    graphics.fill(color);

    dino.addChild(graphics);

    // 클릭 이벤트
    dino.eventMode = 'static';
    dino.cursor = 'pointer';
    dino.on('pointerdown', (e) => {
      e.stopPropagation();
      this.emit('entity:click', { type: 'dinosaur', id });
    });

    // 그리드에 추가
    this.grid?.addEntity(dino, gridX, gridY);
    this.dinosaurs.set(id, dino);

    return dino;
  }

  /**
   * 공룡 제거
   */
  removeDinosaur(id: string): void {
    const dino = this.dinosaurs.get(id);
    if (dino) {
      dino.destroy();
      this.dinosaurs.delete(id);
    }
  }

  /**
   * 건물 추가
   */
  addBuilding(id: string, gridX: number, gridY: number, color = 0x795548): PIXI.Container {
    if (this.buildings.has(id)) {
      return this.buildings.get(id)!;
    }

    // Placeholder 건물 (큐브)
    const building = new PIXI.Container();
    const graphics = new PIXI.Graphics();

    // 건물 본체 (아이소메트릭 큐브)
    const hw = ISO_CONFIG.TILE_WIDTH / 2;
    const hh = ISO_CONFIG.TILE_HEIGHT / 2;
    const height = 60;

    // 윗면
    graphics.poly([0, -height, hw, -height + hh, 0, -height + hh * 2, -hw, -height + hh]);
    graphics.fill(color + 0x202020);

    // 왼쪽 면
    graphics.poly([-hw, -height + hh, 0, -height + hh * 2, 0, hh * 2, -hw, hh]);
    graphics.fill(color - 0x101010);

    // 오른쪽 면
    graphics.poly([hw, -height + hh, 0, -height + hh * 2, 0, hh * 2, hw, hh]);
    graphics.fill(color);

    building.addChild(graphics);

    // 클릭 이벤트
    building.eventMode = 'static';
    building.cursor = 'pointer';
    building.on('pointerdown', (e) => {
      e.stopPropagation();
      this.emit('entity:click', { type: 'building', id });
    });

    // 그리드에 추가
    this.grid?.addEntity(building, gridX, gridY);
    this.buildings.set(id, building);

    return building;
  }

  /**
   * 건물 제거
   */
  removeBuilding(id: string): void {
    const building = this.buildings.get(id);
    if (building) {
      building.destroy();
      this.buildings.delete(id);
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  on<K extends keyof GameEngineEvents>(event: K, callback: EventCallback<GameEngineEvents[K]>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  /**
   * 이벤트 리스너 제거
   */
  off<K extends keyof GameEngineEvents>(event: K, callback: EventCallback<GameEngineEvents[K]>): void {
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
