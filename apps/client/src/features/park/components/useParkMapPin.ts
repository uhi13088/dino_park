import { useEffect, useRef, type RefObject } from 'react';
import type { GameEngine } from '@/game/engine/GameEngine';

export function useParkMapPin<T extends HTMLElement>(
  engine: GameEngine,
  mapRef: RefObject<HTMLDivElement>,
  x: number,
  y: number,
  minTop = 54,
) {
  const pinRef = useRef<T>(null);

  useEffect(() => {
    const map = mapRef.current;
    const pin = pinRef.current;
    if (!map || !pin) return;

    const placePin = () => {
      const camera = engine.getCameraState();
      const { clientWidth: width, clientHeight: height } = map;
      const left = width / 2 + (x - camera.x) * camera.zoom;
      const top = height / 2 + (y - camera.y) * camera.zoom;
      pin.hidden =
        camera.zoom < 0.2 || left < 66 || left > width - 66 || top < minTop || top > height - 54;
      pin.style.left = `${left}px`;
      pin.style.top = `${top}px`;
    };

    placePin();
    engine.on('camera:move', placePin);
    engine.on('camera:zoom', placePin);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(placePin);
    observer?.observe(map);
    window.addEventListener('resize', placePin);
    return () => {
      engine.off('camera:move', placePin);
      engine.off('camera:zoom', placePin);
      observer?.disconnect();
      window.removeEventListener('resize', placePin);
    };
  }, [engine, mapRef, x, y, minTop]);

  return pinRef;
}
