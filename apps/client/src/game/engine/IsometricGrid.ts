import * as PIXI from 'pixi.js';

/**
 * 2.5D 아이소메트릭 그리드 시스템
 * Phase 3에서 상세 구현 예정
 */

// 아이소메트릭 설정
export const ISO_CONFIG = {
  TILE_WIDTH: 64, // 타일 가로 크기
  TILE_HEIGHT: 32, // 타일 세로 크기 (2:1 비율)
  ORIGIN_X: 0, // 원점 X (화면 중앙으로 조정됨)
  ORIGIN_Y: 0, // 원점 Y
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

  const gridX = Math.round(
    (adjustedX / (ISO_CONFIG.TILE_WIDTH / 2) + adjustedY / (ISO_CONFIG.TILE_HEIGHT / 2)) / 2,
  );
  const gridY = Math.round(
    (adjustedY / (ISO_CONFIG.TILE_HEIGHT / 2) - adjustedX / (ISO_CONFIG.TILE_WIDTH / 2)) / 2,
  );

  return { x: gridX, y: gridY };
}

/**
 * 아이소메트릭 그리드 컨테이너
 */
export class IsometricGrid extends PIXI.Container {
  private gridWidth: number;
  private gridHeight: number;
  private baseGround = new PIXI.Graphics();
  private entities: PIXI.Container;
  private gridLines = new PIXI.Graphics();
  private highlight = new PIXI.Graphics();

  constructor(width: number, height: number) {
    super();

    this.gridWidth = width;
    this.gridHeight = height;

    // 레이어 구조
    this.entities = new PIXI.Container(); // 공룡, 건물 등

    this.addChild(this.baseGround, this.gridLines, this.entities, this.highlight);
    this.gridLines.visible = false;

    // 기본 그리드 생성
    this.drawGridGround();
  }

  private drawGridGround(): void {
    const start = -0.5;
    const right = this.gridWidth + start;
    const bottom = this.gridHeight + start;
    const corners = [
      gridToScreen(start, start),
      gridToScreen(right, start),
      gridToScreen(right, bottom),
      gridToScreen(start, bottom),
    ];
    this.baseGround
      .clear()
      .poly(corners.flatMap(({ x, y }) => [x, y]))
      .fill(0x97ab61);
    this.gridLines.clear();
    for (let x = start; x <= right; x++) {
      const from = gridToScreen(x, start);
      const to = gridToScreen(x, bottom);
      this.gridLines.moveTo(from.x, from.y).lineTo(to.x, to.y);
    }
    for (let y = start; y <= bottom; y++) {
      const from = gridToScreen(start, y);
      const to = gridToScreen(right, y);
      this.gridLines.moveTo(from.x, from.y).lineTo(to.x, to.y);
    }
    this.gridLines.stroke({ width: 1, color: 0x33592c, alpha: 0.62 });
  }

  setShowGrid(show: boolean): void {
    this.gridLines.visible = show;
  }

  attachScenery(scenery: {
    exterior: PIXI.Container;
    ground: PIXI.Container;
    backFence: PIXI.Container;
    frontFence: PIXI.Container;
    visitors: PIXI.Container;
    crowdMarkers: PIXI.Container;
    shuttlePath: PIXI.Container;
    shuttleTraffic: PIXI.Container;
  }): void {
    // Scenery supplies one continuous meadow on both sides of the fence.
    this.baseGround.visible = false;
    this.addChildAt(scenery.ground, 1);
    this.addChildAt(scenery.backFence, 3);
    this.addChildAt(scenery.frontFence, this.children.length - 1);
    this.entities.addChild(scenery.visitors, scenery.shuttleTraffic);
    this.addChildAt(scenery.crowdMarkers, this.children.length - 1);
    this.addChildAt(scenery.exterior, 0);
    this.addChildAt(scenery.shuttlePath, this.children.indexOf(scenery.ground) + 1);
  }

  attachSafariGround(ground: PIXI.Container): void {
    this.addChildAt(ground, this.getChildIndex(this.gridLines));
  }

  setGridSize(width: number, height: number): void {
    if (this.gridWidth === width && this.gridHeight === height) return;
    this.gridWidth = width;
    this.gridHeight = height;
    this.drawGridGround();
  }

  highlightArea(
    position: { x: number; y: number },
    width: number,
    height: number,
    valid: boolean,
  ): void {
    this.highlight.clear();
    const edgeColor = valid ? 0xffdda1 : 0xffb9aa;

    const left = position.x - 0.5;
    const top = position.y - 0.5;
    const right = left + width;
    const bottom = top + height;
    const perimeter = [
      gridToScreen(left, top),
      gridToScreen(right, top),
      gridToScreen(right, bottom),
      gridToScreen(left, bottom),
    ].flatMap(({ x, y }) => [x, y]);
    this.highlight
      .poly(perimeter)
      .fill({ color: valid ? 0xffdf96 : 0xf06355, alpha: 0.12 })
      .stroke({ color: edgeColor, width: 2.5 });
  }

  highlightTile(position: { x: number; y: number } | null): void {
    this.highlight.clear();
    if (!position) return;
    const point = gridToScreen(position.x, position.y);
    const hw = ISO_CONFIG.TILE_WIDTH / 2;
    const hh = ISO_CONFIG.TILE_HEIGHT / 2;
    this.highlight.poly([
      point.x,
      point.y - hh,
      point.x + hw,
      point.y,
      point.x,
      point.y + hh,
      point.x - hw,
      point.y,
    ]);
    this.highlight.fill({ color: 0xffeb9a, alpha: 0.65 }).stroke({ color: 0xffffff, width: 3 });
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
   * 엔티티 Z-정렬 (public으로 변경하여 GameEngine에서 호출 가능)
   */
  sortEntities(): void {
    this.entities.children.sort((a, b) => a.zIndex - b.zIndex || a.y - b.y);
  }

  /**
   * 그리드 크기 getter
   */
  getGridSize(): { width: number; height: number } {
    return { width: this.gridWidth, height: this.gridHeight };
  }
}
