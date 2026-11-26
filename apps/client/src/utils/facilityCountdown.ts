export function formatFacilityCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const secondsText = String(seconds % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes % 60).padStart(2, '0')}:${secondsText}`
    : `${minutes}:${secondsText}`;
}
