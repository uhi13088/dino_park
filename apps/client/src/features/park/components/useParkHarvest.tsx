import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ResourceProductionJob, SupplyMaterial } from '@dino-park/shared';
import { useClaimResourceProduction } from '@/api/queries/resources';
import { ParkHudArt, ParkIcon } from './ParkHud';
import './ParkHarvestFeedback.css';

const materialNames: Record<SupplyMaterial, string> = {
  wood: '목재',
  stone: '석재',
  metal: '금속',
  fuel: '연료',
};

const feedbackMilliseconds = 1100;
const amounts = new Intl.NumberFormat('ko-KR');

type Gain = {
  id: number;
  material: SupplyMaterial;
  quantity: number;
  x: number;
  y: number;
};

export function useParkHarvest() {
  const mutation = useClaimResourceProduction();
  const [gains, setGains] = useState<Gain[]>([]);
  const active = useRef(false);
  const inFlight = useRef(false);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    const currentTimers = timers.current;
    active.current = true;
    return () => {
      active.current = false;
      currentTimers.forEach((timer) => window.clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const collect = async (
    job: Pick<ResourceProductionJob, 'id' | 'quantity'>,
    material: SupplyMaterial,
    anchor: DOMRectReadOnly,
  ) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await mutation.mutateAsync(job.id);
      if (!active.current) return;
      const gain: Gain = {
        id: ++nextId.current,
        material,
        quantity: job.quantity,
        x: anchor.left + anchor.width / 2,
        y: anchor.top,
      };
      setGains((current) => [...current, gain]);
      timers.current.set(
        gain.id,
        window.setTimeout(() => {
          timers.current.delete(gain.id);
          setGains((current) => current.filter(({ id }) => id !== gain.id));
        }, feedbackMilliseconds),
      );
    } finally {
      inFlight.current = false;
    }
  };

  const feedback = gains.length
    ? createPortal(
        gains.map(({ id, material, quantity, x, y }) => (
          <div
            key={id}
            className="park-harvest-feedback"
            role="status"
            aria-label={`${materialNames[material]} ${amounts.format(quantity)}개 획득`}
            style={{ left: x, top: y }}
          >
            {material === 'fuel' ? <ParkIcon name="fuel" /> : <ParkHudArt name={material} />}
            <span aria-hidden="true">+{amounts.format(quantity)}</span>
          </div>
        )),
        document.body,
      )
    : null;

  return { collect, feedback, isPending: mutation.isPending };
}
