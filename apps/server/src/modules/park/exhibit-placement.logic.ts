import {
  PARK_ADMISSION,
  type ExhibitPlacementEstimate,
  type ExhibitPlacementRates,
} from '@dino-park/shared';
import type { Dinosaur } from '@prisma/client';
import {
  admissionDiagnosis,
  admissionSnapshot,
  dinosaurCareCheckpoint,
  type AdmissionWorld,
  type Tile,
} from './park-admission.logic';

type Snapshot = ReturnType<typeof admissionSnapshot>;

export function projectedExhibitDinosaur(
  dinosaur: Dinosaur,
  world: AdmissionWorld,
  tile: Tile,
  at: number,
): Dinosaur {
  return {
    ...dinosaur,
    careProgress: dinosaurCareCheckpoint(dinosaur, world, at) ?? dinosaur.careProgress,
    positionX: tile.x,
    positionY: tile.y,
    isInPark: true,
  };
}

function rates(snapshot: Snapshot): ExhibitPlacementRates {
  return {
    demandPerMinute: snapshot.demand,
    visitorsPerMinute: snapshot.visitorsPerMinute,
    occupancyCapacity: snapshot.occupancyCapacity,
    exhibitCount: snapshot.exhibits.size,
  };
}

export function describeExhibitPlacement(
  before: Snapshot,
  after: Snapshot | null,
  explanation: string | null = null,
): ExhibitPlacementEstimate {
  if (after && !explanation) {
    if (after.exhibits.size < before.exhibits.size) {
      explanation = '이 배치에서는 운영하는 전시가 줄어요.';
    } else if (
      after.demand > before.demand &&
      after.visitorsPerMinute <= before.visitorsPerMinute
    ) {
      if (!after.admittingVisitors) explanation = '파크를 개장하면 손님이 들어와요.';
      else if (after.gateCapacity <= after.exhibitCapacity)
        explanation = '관람 수요가 늘어도 입구 처리량이 같으면 입장 속도는 늘지 않아요.';
      else explanation = '관람 수요가 늘어도 동시 수용 인원이 같으면 입장 속도는 늘지 않아요.';
    }
  }
  return {
    current: rates(before),
    proposed: after ? rates(after) : null,
    explanation,
  };
}

export function projectExhibitCrowd(
  before: Snapshot,
  after: Snapshot,
  exhibitId: string,
  at: number,
): ExhibitPlacementEstimate['exhibit'] {
  if (!after.exhibits.has(exhibitId)) return;
  const crowd = (snapshot: Snapshot) =>
    admissionDiagnosis(
      snapshot,
      undefined,
      at,
      Math.round((snapshot.visitorsPerMinute * PARK_ADMISSION.visitSeconds) / 60),
    ).exhibits.find(({ id }) => id === exhibitId);
  const proposed = crowd(after);
  if (!proposed) return;
  return {
    currentVisitors: crowd(before)?.visitors ?? 0,
    proposedVisitors: proposed.visitors ?? 0,
    proposedCrowdingPercent: proposed.crowdingPercent,
  };
}
