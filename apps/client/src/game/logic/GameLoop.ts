/**
 * 게임 루프 - 틱 기반 업데이트
 * 참조: docs/dino_park_balance_simulation.md
 */
import {
  GAME_TICK_INTERVAL,
  HAPPINESS_DECAY_PER_HOUR,
  HUNGER_INCREASE_PER_HOUR,
  MAX_HAPPINESS,
  MAX_HUNGER,
  MAX_EXPLORATION_ENERGY,
  ENERGY_RECHARGE_MINUTES,
  HOUR,
  MINUTE,
} from '@dino-park/shared';
import type { DinosaurResponse, BuildingResponse, CurrencyResponse } from '@dino-park/shared';
import { revenueCalculator, type ParkRevenueResult } from './RevenueCalculator';

/**
 * 게임 상태
 */
export interface GameState {
  dinosaurs: DinosaurResponse[];
  buildings: BuildingResponse[];
  currency: CurrencyResponse;
  lastTickTime: number;
  accumulatedGold: number;
  greatFigureBonus: number;
}

/**
 * 틱 결과
 */
export interface TickResult {
  dinosaurUpdates: Array<{
    id: string;
    happiness: number;
    hunger: number;
  }>;
  revenueResult: ParkRevenueResult;
  currencyUpdate: {
    gold: number;
    explorationEnergy: number;
    energyRechargeAt: string | null;
  };
}

/**
 * 이벤트 타입
 */
export interface GameLoopEvents {
  tick: TickResult;
  dinosaurDanger: { dinosaurId: string; reason: 'happiness' | 'hunger' };
  energyFull: void;
}

type EventCallback<T> = (data: T) => void;

/**
 * 게임 루프 클래스
 */
export class GameLoop {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: GameState | null = null;
  private isRunning = false;
  private eventListeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  // 시간 추적
  private lastStateDecayTime = 0;
  private lastEnergyRechargeTime = 0;

  /**
   * 게임 상태 설정
   */
  setState(state: Partial<GameState>): void {
    if (!this.state) {
      this.state = {
        dinosaurs: [],
        buildings: [],
        currency: {
          gold: 0,
          diamond: 0,
          dna: 0,
          explorationEnergy: 0,
          maxEnergy: MAX_EXPLORATION_ENERGY,
          energyRechargeAt: null,
        },
        lastTickTime: Date.now(),
        accumulatedGold: 0,
        greatFigureBonus: 0,
      };
    }

    this.state = { ...this.state, ...state };
  }

  /**
   * 게임 상태 반환
   */
  getState(): GameState | null {
    return this.state;
  }

  /**
   * 게임 루프 시작
   */
  start(): void {
    if (this.isRunning) {
      console.warn('GameLoop already running');
      return;
    }

    if (!this.state) {
      console.error('GameLoop: No state set');
      return;
    }

    this.isRunning = true;
    this.lastStateDecayTime = Date.now();
    this.lastEnergyRechargeTime = Date.now();

    // 틱 인터벌 시작
    this.intervalId = setInterval(() => {
      this.tick();
    }, GAME_TICK_INTERVAL);

    console.log('🎮 GameLoop started');
  }

  /**
   * 게임 루프 정지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🎮 GameLoop stopped');
  }

  /**
   * 매 틱 실행
   */
  private tick(): void {
    if (!this.state) return;

    const now = Date.now();
    const deltaTime = now - this.state.lastTickTime;

    // 공룡 상태 업데이트 (1시간마다 상태 변화, 여기선 비율로 계산)
    const dinosaurUpdates = this.updateDinosaurStates(deltaTime);

    // 수익 계산
    const revenueResult = revenueCalculator.calculateParkRevenue(
      this.state.dinosaurs,
      this.state.buildings,
      this.state.greatFigureBonus,
    );

    // 골드 누적 (1초당 수익)
    const goldEarned = revenueResult.netRevenue;
    this.state.accumulatedGold += goldEarned;

    // 에너지 충전 체크
    const energyUpdate = this.updateEnergy(now);

    // 상태 업데이트
    this.state.lastTickTime = now;
    this.state.currency = {
      ...this.state.currency,
      gold: this.state.currency.gold + goldEarned,
      ...energyUpdate,
    };

    // 틱 결과
    const tickResult: TickResult = {
      dinosaurUpdates,
      revenueResult,
      currencyUpdate: {
        gold: this.state.currency.gold,
        explorationEnergy: energyUpdate.explorationEnergy,
        energyRechargeAt: energyUpdate.energyRechargeAt,
      },
    };

    this.emit('tick', tickResult);
  }

  /**
   * 공룡 상태 업데이트
   */
  private updateDinosaurStates(_deltaTime: number): TickResult['dinosaurUpdates'] {
    if (!this.state) return [];

    const now = Date.now();
    const hoursSinceLastDecay = (now - this.lastStateDecayTime) / HOUR;

    // 1분마다 상태 업데이트 (성능 고려)
    if (now - this.lastStateDecayTime < MINUTE) {
      return [];
    }

    this.lastStateDecayTime = now;

    const updates: TickResult['dinosaurUpdates'] = [];

    this.state.dinosaurs = this.state.dinosaurs.map((dino) => {
      if (!dino.isInPark) return dino;

      // 행복도 감소
      const happinessDecay = HAPPINESS_DECAY_PER_HOUR * hoursSinceLastDecay;
      const newHappiness = Math.max(0, dino.happiness - happinessDecay);

      // 배고픔 증가
      const hungerIncrease = HUNGER_INCREASE_PER_HOUR * hoursSinceLastDecay;
      const newHunger = Math.min(MAX_HUNGER, dino.hunger + hungerIncrease);

      // 위험 상태 체크
      if (newHappiness < 30) {
        this.emit('dinosaurDanger', { dinosaurId: dino.id, reason: 'happiness' });
      }
      if (newHunger > 80) {
        this.emit('dinosaurDanger', { dinosaurId: dino.id, reason: 'hunger' });
      }

      updates.push({
        id: dino.id,
        happiness: newHappiness,
        hunger: newHunger,
      });

      return {
        ...dino,
        happiness: newHappiness,
        hunger: newHunger,
      };
    });

    return updates;
  }

  /**
   * 에너지 충전 업데이트
   */
  private updateEnergy(now: number): {
    explorationEnergy: number;
    energyRechargeAt: string | null;
  } {
    if (!this.state) {
      return { explorationEnergy: 0, energyRechargeAt: null };
    }

    let { explorationEnergy, energyRechargeAt } = this.state.currency;

    // 이미 최대치면 충전 불필요
    if (explorationEnergy >= MAX_EXPLORATION_ENERGY) {
      return { explorationEnergy: MAX_EXPLORATION_ENERGY, energyRechargeAt: null };
    }

    // 충전 시간 계산 (10분마다 1 충전)
    const rechargeIntervalMs = ENERGY_RECHARGE_MINUTES * MINUTE;
    const timeSinceLastRecharge = now - this.lastEnergyRechargeTime;

    if (timeSinceLastRecharge >= rechargeIntervalMs) {
      const energyGained = Math.floor(timeSinceLastRecharge / rechargeIntervalMs);
      explorationEnergy = Math.min(MAX_EXPLORATION_ENERGY, explorationEnergy + energyGained);
      this.lastEnergyRechargeTime = now;

      if (explorationEnergy >= MAX_EXPLORATION_ENERGY) {
        this.emit('energyFull', undefined);
        energyRechargeAt = null;
      } else {
        // 다음 충전 시간
        energyRechargeAt = new Date(now + rechargeIntervalMs).toISOString();
      }
    } else if (!energyRechargeAt) {
      // 충전 시간 설정
      energyRechargeAt = new Date(this.lastEnergyRechargeTime + rechargeIntervalMs).toISOString();
    }

    return { explorationEnergy, energyRechargeAt };
  }

  /**
   * 오프라인 진행 처리
   */
  processOfflineProgress(lastLoginAt: Date): {
    offlineHours: number;
    goldEarned: number;
    dinosaurUpdates: Array<{ id: string; happiness: number; hunger: number }>;
  } {
    if (!this.state) {
      return { offlineHours: 0, goldEarned: 0, dinosaurUpdates: [] };
    }

    const now = Date.now();
    const offlineMs = now - lastLoginAt.getTime();
    const offlineHours = Math.min(8, offlineMs / HOUR); // 최대 8시간

    // 수익 계산
    const revenueResult = revenueCalculator.calculateParkRevenue(
      this.state.dinosaurs,
      this.state.buildings,
      this.state.greatFigureBonus,
    );

    const hourlyRevenue = revenueCalculator.calculateHourlyRevenue(revenueResult.netRevenue);
    const offlineGold = revenueCalculator.calculateOfflineRevenue(
      hourlyRevenue,
      offlineHours,
      8,
      0.5,
    );

    // 공룡 상태 업데이트
    const dinosaurUpdates = this.state.dinosaurs
      .filter((d) => d.isInPark)
      .map((dino) => {
        const happinessDecay = HAPPINESS_DECAY_PER_HOUR * offlineHours;
        const hungerIncrease = HUNGER_INCREASE_PER_HOUR * offlineHours;

        return {
          id: dino.id,
          happiness: Math.max(0, dino.happiness - happinessDecay),
          hunger: Math.min(MAX_HUNGER, dino.hunger + hungerIncrease),
        };
      });

    return {
      offlineHours,
      goldEarned: offlineGold,
      dinosaurUpdates,
    };
  }

  /**
   * 공룡 먹이주기
   */
  feedDinosaur(dinosaurId: string, happinessGain: number, hungerReduce: number): void {
    if (!this.state) return;

    this.state.dinosaurs = this.state.dinosaurs.map((dino) => {
      if (dino.id !== dinosaurId) return dino;

      return {
        ...dino,
        happiness: Math.min(MAX_HAPPINESS, dino.happiness + happinessGain),
        hunger: Math.max(0, dino.hunger - hungerReduce),
      };
    });
  }

  /**
   * 공룡 추가
   */
  addDinosaur(dinosaur: DinosaurResponse): void {
    if (!this.state) return;
    this.state.dinosaurs.push(dinosaur);
  }

  /**
   * 공룡 제거
   */
  removeDinosaur(dinosaurId: string): void {
    if (!this.state) return;
    this.state.dinosaurs = this.state.dinosaurs.filter((d) => d.id !== dinosaurId);
  }

  /**
   * 이벤트 리스너 등록
   */
  on<K extends keyof GameLoopEvents>(event: K, callback: EventCallback<GameLoopEvents[K]>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  /**
   * 이벤트 리스너 제거
   */
  off<K extends keyof GameLoopEvents>(event: K, callback: EventCallback<GameLoopEvents[K]>): void {
    this.eventListeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  /**
   * 이벤트 발생
   */
  private emit<K extends keyof GameLoopEvents>(event: K, data: GameLoopEvents[K]): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }

  /**
   * 실행 상태 확인
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// 싱글톤 인스턴스
export const gameLoop = new GameLoop();
