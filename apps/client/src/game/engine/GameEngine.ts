import * as PIXI from 'pixi.js';

/**
 * PixiJS 게임 엔진 코어
 * Phase 3에서 상세 구현 예정
 */
export class GameEngine {
  private app: PIXI.Application | null = null;
  private container: HTMLElement | null = null;

  // 게임 상태
  private isInitialized = false;
  private isPaused = false;

  constructor() {
    // 생성자
  }

  /**
   * 게임 엔진 초기화
   */
  async initialize(container: HTMLElement): Promise<void> {
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
      backgroundColor: 0x87CEEB, // 하늘색 배경
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    // DOM에 캔버스 추가
    container.appendChild(this.app.canvas);

    // 리사이즈 핸들러
    window.addEventListener('resize', this.handleResize.bind(this));

    // 게임 루프 시작
    this.app.ticker.add(this.update.bind(this));

    this.isInitialized = true;
    console.log('🎮 GameEngine initialized');
  }

  /**
   * 게임 엔진 정리
   */
  destroy(): void {
    if (!this.isInitialized) return;

    window.removeEventListener('resize', this.handleResize.bind(this));

    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }

    this.isInitialized = false;
    console.log('🎮 GameEngine destroyed');
  }

  /**
   * 리사이즈 핸들러
   */
  private handleResize(): void {
    if (!this.app || !this.container) return;

    const { clientWidth, clientHeight } = this.container;
    this.app.renderer.resize(clientWidth, clientHeight);
  }

  /**
   * 게임 루프 업데이트
   */
  private update(ticker: PIXI.Ticker): void {
    if (this.isPaused) return;

    const delta = ticker.deltaTime;

    // TODO: Phase 3에서 구현
    // - 공룡 애니메이션 업데이트
    // - 건물 상태 업데이트
    // - 방문객 이동 업데이트
    // - 파티클 효과 업데이트
    void delta; // 임시로 사용 표시
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
   * 스테이지 접근자
   */
  getStage(): PIXI.Container | null {
    return this.app?.stage ?? null;
  }
}

// 싱글톤 인스턴스
export const gameEngine = new GameEngine();
