import { useEffect, useState } from 'react';
import { formatFacilityCountdown } from '@/utils/facilityCountdown';

export default function FacilityCountdown({ completesAt }: { completesAt: string }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.ceil((Date.parse(completesAt) - now) / 1000));
  return Number.isFinite(seconds) ? (
    <time
      className="park-context__time"
      aria-label={`남은 시간 ${seconds}초`}
      dateTime={`PT${seconds}S`}
    >
      {formatFacilityCountdown(seconds)}
    </time>
  ) : null;
}
