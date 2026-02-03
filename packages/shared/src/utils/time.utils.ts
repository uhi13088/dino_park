/**
 * 시간 관련 유틸리티
 */

import { SECOND, MINUTE, HOUR, DAY } from '../constants/game.constants';

/**
 * 밀리초를 사람이 읽기 쉬운 형태로 변환
 */
export function formatDuration(ms: number): string {
  if (ms < MINUTE) {
    return `${Math.floor(ms / SECOND)}초`;
  }
  if (ms < HOUR) {
    const minutes = Math.floor(ms / MINUTE);
    const seconds = Math.floor((ms % MINUTE) / SECOND);
    return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
  }
  if (ms < DAY) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`;
}

/**
 * 오프라인 시간 계산 (최대 제한 적용)
 */
export function calculateOfflineTime(lastLoginAt: Date, maxHours: number): number {
  const now = Date.now();
  const elapsed = now - lastLoginAt.getTime();
  const maxMs = maxHours * HOUR;
  return Math.min(elapsed, maxMs);
}

/**
 * 에너지 충전량 계산
 */
export function calculateEnergyRecharge(
  lastRechargeAt: Date,
  rechargeMinutes: number,
  maxEnergy: number,
  currentEnergy: number,
): number {
  const elapsed = Date.now() - lastRechargeAt.getTime();
  const rechargeMs = rechargeMinutes * MINUTE;
  const rechargedUnits = Math.floor(elapsed / rechargeMs);
  return Math.min(currentEnergy + rechargedUnits, maxEnergy);
}
