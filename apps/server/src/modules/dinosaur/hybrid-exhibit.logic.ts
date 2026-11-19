import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getBuildingById } from '@dino-park/game-data';
import {
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
  type HybridExhibitPreview,
  type HybridExhibitRate,
  type HybridExhibitSelection,
} from '@dino-park/shared';
import {
  activeAt,
  admissionSnapshot,
  contains,
  type AdmissionWorld,
  type Tile,
} from '../park/park-admission.logic';

export function hybridPlacementIssue(
  world: AdmissionWorld,
  dinosaurId: string,
  tile: Tile,
  at: number,
): string | null {
  const habitat = world.buildings.find(
    (building) => building.typeId === FIRST_HYBRID_HABITAT_ID && contains(building, tile),
  );
  if (!habitat || !activeAt(habitat, at)) return '완공된 초식 하이브리드 서식지 안에 배치해주세요.';
  const onDisplay = world.dinosaurs.filter(
    (dinosaur) =>
      dinosaur.isInPark &&
      dinosaur.id !== dinosaurId &&
      contains(habitat, { x: dinosaur.positionX, y: dinosaur.positionY }),
  ).length;
  if (onDisplay >= (getBuildingById(habitat.typeId)?.baseStats.capacity ?? 0))
    return '이 서식지의 관람 공간이 가득 찼어요.';
  if (!world.isOpen) return '파크를 개장한 뒤 관람객에게 소개해주세요.';
  const snapshot = admissionSnapshot(world, at);
  if (!snapshot.connectedPlatformIds.length || !snapshot.connectedHabitatIds.includes(habitat.id))
    return '입구에서 관람대와 서식지까지 길을 이어주세요.';
  return null;
}

function rates(snapshot: ReturnType<typeof admissionSnapshot>): HybridExhibitRate {
  return {
    demandPerMinute: snapshot.demand,
    visitorsPerMinute: snapshot.visitorsPerMinute,
    capacityPerMinute: (snapshot.capacity * 60) / PARK_ADMISSION.visitSeconds,
  };
}

export function previewHybridExhibit(
  world: AdmissionWorld,
  { currentId, candidateId }: HybridExhibitSelection,
  at: number,
): { preview: HybridExhibitPreview; destination: Tile | null } {
  if (currentId === candidateId)
    throw new BadRequestException('서로 다른 스테고케라톱스 두 마리를 골라주세요.');
  const current = world.dinosaurs.find((dinosaur) => dinosaur.id === currentId);
  const candidate = world.dinosaurs.find((dinosaur) => dinosaur.id === candidateId);
  if (
    current?.speciesId !== FIRST_HYBRID_SPECIES_ID ||
    candidate?.speciesId !== FIRST_HYBRID_SPECIES_ID
  )
    throw new NotFoundException('보유 중인 스테고케라톱스 두 마리를 찾을 수 없어요.');

  const before = rates(admissionSnapshot(world, at));
  const unavailable = (reason: string, proposed: HybridExhibitRate | null = null) => ({
    preview: { current: before, proposed, unavailableReason: reason },
    destination: null,
  });
  if (!current.isInPark) return unavailable('전시 중인 개체를 먼저 골라주세요.');
  if (candidate.isInPark)
    return unavailable('두 개체가 모두 전시 중이에요. 현재 배치에서는 입장 예상이 같아요.', before);

  const destination = { x: current.positionX, y: current.positionY };
  const withdrawn = world.dinosaurs.map((dinosaur) =>
    dinosaur.id === currentId ? { ...dinosaur, isInPark: false } : dinosaur,
  );
  if (
    withdrawn.some(
      (dinosaur) =>
        dinosaur.isInPark &&
        dinosaur.positionX === destination.x &&
        dinosaur.positionY === destination.y,
    )
  )
    return unavailable('다른 공룡이 있는 칸이에요. 현재 전시 위치를 먼저 확인해주세요.');
  const issue = hybridPlacementIssue(
    { ...world, dinosaurs: withdrawn },
    candidateId,
    destination,
    at,
  );
  if (issue) return unavailable(issue);

  const dinosaurs = withdrawn.map((dinosaur) =>
    dinosaur.id === candidateId
      ? { ...dinosaur, positionX: destination.x, positionY: destination.y, isInPark: true }
      : dinosaur,
  );
  return {
    preview: {
      current: before,
      proposed: rates(admissionSnapshot({ ...world, dinosaurs }, at)),
      unavailableReason: null,
    },
    destination,
  };
}
