import type { AdmissionWorld } from './park-admission.logic';
import { BuildingStatus, type Building, type Dinosaur } from '@prisma/client';

export const AT = Date.parse('2026-11-16T00:00:00Z');
export function building(id: string, typeId: string, x: number, y: number): Building {
  return {
    id,
    parkId: 'park',
    typeId,
    level: 1,
    positionX: x,
    positionY: y,
    status: BuildingStatus.ACTIVE,
    assignedGreatFigureId: null,
    completesAt: null,
    createdAt: new Date(AT),
    updatedAt: new Date(AT),
  };
}
export function dinosaur(id = 'para', speciesId = 'parasaurolophus'): Dinosaur {
  return {
    id,
    parkId: 'park',
    speciesId,
    nickname: null,
    level: 1,
    exp: 0,
    happiness: 95,
    hunger: 0,
    intimacy: 5,
    positionX: 9,
    positionY: 9,
    isInPark: true,
    competitiveStats: null,
    lastFedAt: new Date(AT),
    createdAt: new Date(AT),
    updatedAt: new Date(AT),
  };
}
export function world(): AdmissionWorld {
  return {
    gridSizeX: 20,
    gridSizeY: 20,
    isOpen: true,
    admissionCareCompleted: true,
    buildings: [
      building('grass', 'habitat-grassland', 8, 8),
      building('gate', 'operation-entrance-gate', 11, 16),
    ],
    dinosaurs: [dinosaur()],
  };
}
