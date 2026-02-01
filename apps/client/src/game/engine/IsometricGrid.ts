import * as PIXI from 'pixi.js';

/**
 * 2.5D 아이소메트릭 그리드 시스템
 * Phase 3에서 상세 구현 예정
 */

// 아이소메트릭 설정
export const ISO_CONFIG = {
  TILE_WIDTH: 64,   // 타일 가로 크기
  TILE_HEIGHT: 32,  // 타일 세로 크기 (2:1 비율)
  ORIGIN_X: 0,      // 원점 X (화면 중앙으로 조정됨)
  ORIGIN_Y: 0,      // 원점 Y
};

/**
 * 그리드 좌표를 화면 좌표로 변환
 */
export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  const screenX = (gridX - gridY) * (ISO_CONFIG.TILE_WIDTH / 2) + ISO_CONFIG.ORIGIN_X;
  const screenY = (gridX + gridY) * (ISO_CONFIG.TILE_HEIGHT / 2) + ISO_CONFIG.ORIGIN_Y;
  return { x: screenX, y: screenY };
}

/**
 * 화면 좌표를 그리드 좌표로 변환
 */
export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const adjustedX = screenX - ISO_CONFIG.ORIGIN_X;
  const adjustedY = screenY - ISO_CONFIG.ORIGIN_Y;

  const gridX = Math.floor(
    (adjustedX / (ISO_CONFIG.TILE_WIDTH / 2) + adjustedY / (ISO_CONFIG.TILE_HEIGHT / 2)) / 2
  );
  const gridY = Math.floor(
    (adjustedY / (ISO_CONFIG.TILE_HEIGHT / 2) - adjustedX / (ISO_CONFIG.TILE_WIDTH / 2)) / 2
  );

  return { x: gridX, y: gridY };
}

/**
 * 아이소메트릭 그리드 컨테이너
 */
export class IsometricGrid extends PIXI.Container {
  private gridWidth: number;
  private gridHeight: number;
  private tiles: PIXI.Container;
  private entities: PIXI.Container;

  constructor(width: number, height: number) {
    super();

    this.gridWidth = width;
    this.gridHeight = height;

    // 레이어 구조
    this.tiles = new PIXI.Container();     // 바닥 타일
    this.entities = new PIXI.Container();  // 공룡, 건물 등

    this.addChild(this.tiles);
    this.addChild(this.entities);

    // 기본 그리드 생성
    this.createBaseTiles();
  }

  /**
   * 기본 바닥 타일 생성
   */
  private createBaseTiles(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tile = this.createTile(x, y);
        this.tiles.addChild(tile);
      }
    }
  }

  /**
   * 단일 타일 생성
   */
  private createTile(gridX: number, gridY: number): PIXI.Graphics {
    const { x, y } = gridToScreen(gridX, gridY);

    const tile = new PIXI.Graphics();

    // 다이아몬드 형태 그리기
    const hw = ISO_CONFIG.TILE_WIDTH / 2;  // half width
    const hh = ISO_CONFIG.TILE_HEIGHT / 2; // half height

    // 잔디 색상 (약간의 변화)
    const baseColor = 0x7CB342;
    const variation = ((gridX + gridY) % 2 === 0) ? 0x050505 : 0;
    const color = baseColor - variation;

    tile.poly([
      x, y - hh,          // 상단
      x + hw, y,          // 우측
      x, y + hh,          // 하단
      x - hw, y,          // 좌측
    ]);
    tile.fill(color);
    tile.stroke({ width: 1, color: 0x689F38, alpha: 0.5 });

    return tile;
  }

  /**
   * 엔티티 추가 (공룡, 건물 등)
   */
  addEntity(entity: PIXI.Container, gridX: number, gridY: number): void {
    const { x, y } = gridToScreen(gridX, gridY);
    entity.position.set(x, y);
    this.entities.addChild(entity);

    // Z-인덱스 정렬 (아래쪽이 위에 렌더링)
    this.sortEntities();
  }

  /**
   * 엔티티 Z-정렬
   */
  private sortEntities(): void {
    this.entities.children.sort((a, b) => a.y - b.y);
  }

  /**
   * 그리드 크기 getter
   */
  getGridSize(): { width: number; height: number } {
    return { width: this.gridWidth, height: this.gridHeight };
  }
}
