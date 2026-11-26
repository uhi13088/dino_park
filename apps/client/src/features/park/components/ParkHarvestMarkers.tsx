import type { RefObject } from 'react';
import { getBuildingById } from '@dino-park/game-data';
import type { BuildingResponse, EarlyResourceMaterial, ResourcesResponse } from '@dino-park/shared';
import type { GameEngine } from '@/game/engine/GameEngine';
import { ISO_CONFIG, gridToScreen } from '@/game/engine/IsometricGrid';
import { useUIStore } from '@/stores';
import { ParkHudArt } from './ParkHud';
import { useParkHarvest } from './useParkHarvest';
import { useParkMapPin } from './useParkMapPin';

type MarkerProps = {
  engine: GameEngine;
  mapRef: RefObject<HTMLDivElement>;
};

const quantities = new Intl.NumberFormat('ko-KR');

function HarvestMarker({
  engine,
  mapRef,
  x,
  y,
  name,
  material,
  quantity,
  blocked,
  pending,
  onCollect,
}: MarkerProps & {
  x: number;
  y: number;
  name: string;
  material: EarlyResourceMaterial;
  quantity: number;
  blocked: boolean;
  pending: boolean;
  onCollect: (button: HTMLButtonElement) => void;
}) {
  const ref = useParkMapPin<HTMLButtonElement>(engine, mapRef, x, y, 76);
  const label = blocked
    ? `${name} 수확 · 보관 공간 부족`
    : `${name} ${quantities.format(quantity)}개 수확`;

  return (
    <button
      ref={ref}
      type="button"
      className="park-hud__harvest"
      aria-label={label}
      title={label}
      disabled={blocked || pending}
      onClick={({ currentTarget }) => onCollect(currentTarget)}
      hidden
    >
      <ParkHudArt name={material} />
      <span>{quantities.format(quantity)}</span>
    </button>
  );
}

export default function ParkHarvestMarkers({
  engine,
  mapRef,
  buildings,
  facilities,
}: MarkerProps & {
  buildings: BuildingResponse[];
  facilities: ResourcesResponse['facilities'];
}) {
  const harvest = useParkHarvest();
  const showToast = useUIStore((state) => state.showToast);

  const markers = facilities.map(({ building, job, recipe, name, typeId }) => {
    if (!job?.ready || !building || recipe.material === 'fuel') return null;
    const placed = buildings.find(({ id }) => id === building.id);
    const type = getBuildingById(typeId);
    if (!placed || !type) return null;
    const { width, height } = type.size;
    const position = gridToScreen(
      placed.positionX + (width - 1) / 2,
      placed.positionY + (height - 1) / 2,
    );

    return (
      <HarvestMarker
        key={job.id}
        engine={engine}
        mapRef={mapRef}
        x={position.x}
        y={position.y - ISO_CONFIG.TILE_HEIGHT * width}
        name={name}
        material={recipe.material}
        quantity={job.quantity}
        blocked={job.claimBlocked}
        pending={harvest.isPending}
        onCollect={(button) => {
          void harvest
            .collect(job, recipe.material, button.getBoundingClientRect())
            .catch((cause) =>
              showToast({
                type: 'error',
                message: cause instanceof Error ? cause.message : '생산품을 수확하지 못했어요.',
              }),
            );
        }}
      />
    );
  });

  return (
    <>
      {markers}
      {harvest.feedback}
    </>
  );
}
