/**
 * 포맷 관련 유틸리티
 */

/**
 * 숫자를 한국어 단위로 포맷팅
 * 예: 12345 -> "1.2만", 1234567 -> "123.4만"
 */
export function formatKoreanNumber(num: number): string {
  if (num < 10000) {
    return num.toLocaleString('ko-KR');
  }
  if (num < 100000000) {
    const man = num / 10000;
    return man >= 10 ? `${Math.floor(man)}만` : `${man.toFixed(1)}만`;
  }
  const eok = num / 100000000;
  return eok >= 10 ? `${Math.floor(eok)}억` : `${eok.toFixed(1)}억`;
}

/**
 * 골드 포맷팅 (아이콘 포함)
 */
export function formatGold(amount: number): string {
  return `🪙 ${formatKoreanNumber(amount)}`;
}

/**
 * 다이아 포맷팅 (아이콘 포함)
 */
export function formatDiamond(amount: number): string {
  return `💎 ${formatKoreanNumber(amount)}`;
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 레벨 포맷팅
 */
export function formatLevel(level: number): string {
  return `Lv.${level}`;
}
