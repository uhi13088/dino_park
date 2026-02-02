/**
 * PixiJS 게임 엔진 모듈 내보내기
 */

export { GameEngine, gameEngine, type GameEngineEvents } from './engine/GameEngine';
export {
  IsometricGrid,
  gridToScreen,
  screenToGrid,
  ISO_CONFIG,
} from './engine/IsometricGrid';

// 게임 로직
export {
  GameLoop,
  gameLoop,
  type GameState,
  type TickResult,
  type GameLoopEvents,
  RevenueCalculator,
  revenueCalculator,
  type DinosaurRevenueResult,
  type ParkRevenueResult,
} from './logic';
