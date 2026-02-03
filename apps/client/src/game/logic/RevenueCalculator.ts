/**
 * 수익 계산기
 * 참조: docs/dino_park_balance_simulation.md
 */
import {
  REVENUE_LEVEL_MULTIPLIER,
  DANGER_HAPPINESS_THRESHOLD,
  DANGER_HUNGER_THRESHOLD,
  DANGER_STATE_REVENUE_PENALTY,
  RARITY_REVENUE_MULTIPLIER,
  MAX_HAPPINESS,
} from '@dino-park/shared';
import type { DinosaurResponse, BuildingResponse } from '@dino-park/shared';

/**
 * 공룡 수익 계산 결과
 */
export interface DinosaurRevenueResult {
  dinosaurId: string;
  baseRevenue: number;
  levelMultiplier: number;
  stateMultiplier: number;
  finalRevenue: number;
}

/**
 * 파크 수익 계산 결과
 */
export interface ParkRevenueResult {
  dinosaurRevenues: DinosaurRevenueResult[];
  totalDinosaurRevenue: number;
  buildingBonus: number;
  greatFigureBonus: number;
  totalRevenue: number;
  maintenanceCost: number;
  netRevenue: number;
}

/**
 * 공룡 기본 수익 데이터 (game-data에서 가져올 예정)
 */
interface DinosaurSpeciesData {
  baseRevenue: number;
  maintenanceCost: number;
  rarity: keyof typeof RARITY_REVENUE_MULTIPLIER;
}

/**
 * 수익 계산기 클래스
 */
export class RevenueCalculator {
  private speciesDataCache: Map<string, DinosaurSpeciesData> = new Map();

  /**
   * 공룡 종 데이터 설정 (외부에서 주입)
   */
  setSpeciesData(speciesId: string, data: DinosaurSpeciesData): void {
    this.speciesDataCache.set(speciesId, data);
  }

  /**
   * 공룡 종 데이터 일괄 설정
   */
  setSpeciesDataBatch(dataMap: Record<string, DinosaurSpeciesData>): void {
    Object.entries(dataMap).forEach(([id, data]) => {
      this.speciesDataCache.set(id, data);
    });
  }

  /**
   * 단일 공룡 수익 계산
   * 공식: 기본 수익 × (1 + (레벨-1) × 0.1) × 상태 보정
   */
  calculateDinosaurRevenue(dinosaur: DinosaurResponse): DinosaurRevenueResult {
    const speciesData = this.speciesDataCache.get(dinosaur.speciesId);

    // 종 데이터가 없으면 기본값 사용
    const baseRevenue = speciesData?.baseRevenue ?? 100;
    const rarity = speciesData?.rarity ?? 'common';

    // 레벨 배율: 1 + (레벨-1) × 0.1
    const levelMultiplier = 1 + (dinosaur.level - 1) * REVENUE_LEVEL_MULTIPLIER;

    // 상태 보정
    const stateMultiplier = this.calculateStateMultiplier(dinosaur.happiness, dinosaur.hunger);

    // 등급 배율
    const rarityMultiplier = RARITY_REVENUE_MULTIPLIER[rarity];

    // 최종 수익
    const finalRevenue = Math.floor(
      baseRevenue * levelMultiplier * stateMultiplier * rarityMultiplier,
    );

    return {
      dinosaurId: dinosaur.id,
      baseRevenue,
      levelMultiplier,
      stateMultiplier,
      finalRevenue,
    };
  }

  /**
   * 상태 보정 계산
   * 공식: (행복도/100) × (배고픔 > 80 ? 0.5 : 1.0)
   */
  calculateStateMultiplier(happiness: number, hunger: number): number {
    // 행복도 기반 배율
    const happinessMultiplier = happiness / MAX_HAPPINESS;

    // 위험 상태 체크
    const isInDanger = happiness < DANGER_HAPPINESS_THRESHOLD || hunger > DANGER_HUNGER_THRESHOLD;

    // 위험 상태면 추가 페널티
    const dangerPenalty = isInDanger ? DANGER_STATE_REVENUE_PENALTY : 1;

    return happinessMultiplier * dangerPenalty;
  }

  /**
   * 파크 전체 수익 계산
   */
  calculateParkRevenue(
    dinosaurs: DinosaurResponse[],
    buildings: BuildingResponse[],
    greatFigureBonus: number = 0,
  ): ParkRevenueResult {
    // 공룡별 수익 계산
    const dinosaurRevenues = dinosaurs
      .filter((d) => d.isInPark)
      .map((d) => this.calculateDinosaurRevenue(d));

    const totalDinosaurRevenue = dinosaurRevenues.reduce((sum, r) => sum + r.finalRevenue, 0);

    // 건물 보너스 계산
    const buildingBonus = this.calculateBuildingBonus(buildings);

    // 최종 수익 (모든 보너스 적용)
    const totalRevenue = Math.floor(
      totalDinosaurRevenue * (1 + buildingBonus) * (1 + greatFigureBonus),
    );

    // 유지비 계산
    const maintenanceCost = this.calculateMaintenanceCost(dinosaurs, buildings);

    // 순수익
    const netRevenue = totalRevenue - maintenanceCost;

    return {
      dinosaurRevenues,
      totalDinosaurRevenue,
      buildingBonus,
      greatFigureBonus,
      totalRevenue,
      maintenanceCost,
      netRevenue,
    };
  }

  /**
   * 건물 보너스 계산
   */
  private calculateBuildingBonus(buildings: BuildingResponse[]): number {
    // 활성 건물의 보너스 합산 (간단한 로직, 추후 확장)
    const activeBuildings = buildings.filter((b) => b.status === 'active');

    // 레벨당 1% 보너스 (가정)
    const bonusPerLevel = 0.01;

    return activeBuildings.reduce((sum, b) => sum + b.level * bonusPerLevel, 0);
  }

  /**
   * 유지비 계산
   */
  private calculateMaintenanceCost(
    dinosaurs: DinosaurResponse[],
    buildings: BuildingResponse[],
  ): number {
    // 공룡 유지비
    const dinoMaintenance = dinosaurs
      .filter((d) => d.isInPark)
      .reduce((sum, d) => {
        const speciesData = this.speciesDataCache.get(d.speciesId);
        return sum + (speciesData?.maintenanceCost ?? 10);
      }, 0);

    // 건물 유지비 (레벨당 5 가정)
    const buildingMaintenance = buildings
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + b.level * 5, 0);

    return dinoMaintenance + buildingMaintenance;
  }

  /**
   * 시간당 수익 계산
   */
  calculateHourlyRevenue(netRevenue: number): number {
    // netRevenue는 틱당(1초) 수익이므로 시간당으로 변환
    return netRevenue * 3600;
  }

  /**
   * 오프라인 수익 계산
   */
  calculateOfflineRevenue(
    hourlyRevenue: number,
    offlineHours: number,
    maxOfflineHours: number,
    offlineRate: number,
  ): number {
    const cappedHours = Math.min(offlineHours, maxOfflineHours);
    return Math.floor(hourlyRevenue * cappedHours * offlineRate);
  }
}

// 싱글톤 인스턴스
export const revenueCalculator = new RevenueCalculator();
