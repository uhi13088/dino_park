import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { FIRST_EXPEDITION, SCOUT_REGIONS } from '@dino-park/game-data';
import type { GameEngine } from '@/game/engine/GameEngine';
import { PARK_MEADOW_SITE } from '@/game/engine/IslandWorld';
import { gridToScreen } from '@/game/engine/IsometricGrid';
import { ParkHudArt } from './ParkHud';
import { useParkMapPin } from './useParkMapPin';

const firstMeadow = SCOUT_REGIONS.find(({ id }) => id === FIRST_EXPEDITION.regionId)?.spots.find(
  ({ missionIds }) => missionIds.includes(FIRST_EXPEDITION.id),
);
export const firstMeadowHref = firstMeadow
  ? `/exploration?${new URLSearchParams({ mission: FIRST_EXPEDITION.id, spot: firstMeadow.id })}`
  : '/exploration';

const position = gridToScreen(PARK_MEADOW_SITE.x, PARK_MEADOW_SITE.y);

export default function ParkMeadowLink({
  engine,
  mapRef,
}: {
  engine: GameEngine;
  mapRef: RefObject<HTMLDivElement>;
}) {
  const linkRef = useParkMapPin<HTMLAnchorElement>(engine, mapRef, position.x, position.y);

  if (!firstMeadow) return null;
  return (
    <Link ref={linkRef} to={firstMeadowHref} className="park-hud__plate park-meadow-link" hidden>
      <ParkHudArt name="explore" />
      {firstMeadow.name}
    </Link>
  );
}
