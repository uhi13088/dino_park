import { admissionSnapshot } from './park-admission.logic';
import { BuildingStatus } from '@prisma/client';
import { STEGO_BASE_COMPETITIVE_STATS } from '@dino-park/shared';
import { previewHybridExhibit } from '../dinosaur/hybrid-exhibit.logic';

import { AT, building, dinosaur, world } from './park-admission.fixtures';

describe('paid admission topology and demand', () => {
  it('earns only through reachable, compatible exhibited dinosaurs and caps admission', () => {
    const state = admissionSnapshot(world(), AT);
    expect(state.canOpen).toBe(true);
    expect(state.demand).toBeCloseTo(19.5);
    expect(state.visitorsPerMinute).toBe(12);
    expect(state.hourlyMaintenance).toBe(95);
    expect(state.pathTiles.length).toBeGreaterThan(0);
    expect(state.pathTiles.every((p) => !(p.x >= 8 && p.x <= 10 && p.y >= 8 && p.y <= 10))).toBe(
      true,
    );
    expect(admissionSnapshot({ ...world(), isOpen: false }, AT).visitorsPerMinute).toBe(0);
    expect(
      admissionSnapshot(
        { ...world(), dinosaurs: [{ ...dinosaur(), positionX: 2, positionY: 2 }] },
        AT,
      ).visitorsPerMinute,
    ).toBe(0);
    expect(
      admissionSnapshot(
        { ...world(), dinosaurs: [{ ...dinosaur(), speciesId: 'velociraptor' }] },
        AT,
      ).visitorsPerMinute,
    ).toBe(0);
  });
  it('requires boundary entrance, free interior exit and first care', () => {
    const w = world();
    w.buildings[1].positionY = 12;
    expect(admissionSnapshot(w, AT).canOpen).toBe(false);
    w.buildings[1].positionY = 16;
    w.buildings.push(building('obstacle', 'amenity-bench', 13, 15));
    expect(admissionSnapshot(w, AT).visitorsPerMinute).toBe(0);
    const uncared = {
      ...world(),
      admissionCareCompleted: false,
      dinosaurs: [{ ...dinosaur(), happiness: 75, hunger: 45, intimacy: 0 }],
    };
    expect(admissionSnapshot(uncared, AT).canOpen).toBe(false);
  });
  it.each([
    { happiness: 10, hunger: 0, intimacy: 5 },
    { happiness: 0, hunger: 100, intimacy: 5 },
    { happiness: 100, hunger: 0, intimacy: 0 },
  ])('recognizes legacy care or a healthy newborn without changing stored state: %p', (state) => {
    const w = {
      ...world(),
      admissionCareCompleted: false,
      dinosaurs: [{ ...dinosaur(), ...state }],
    };
    const before = structuredClone(w.dinosaurs);
    const snapshot = admissionSnapshot(w, AT);
    expect(snapshot.canOpen).toBe(true);
    expect(snapshot.requirements).toEqual([]);
    expect(w.dinosaurs).toEqual(before);
    expect(w.admissionCareCompleted).toBe(false);
  });

  it('adds capacity at real construction completion and includes no building-minted revenue', () => {
    const w = world();
    const deck = building('deck', 'visitor-viewing-platform', 11, 10);
    deck.status = BuildingStatus.CONSTRUCTING;
    deck.completesAt = new Date(AT + 30000);
    w.buildings.push(deck);
    expect(admissionSnapshot(w, AT + 29999).capacity).toBe(12);
    expect(admissionSnapshot(w, AT + 30000).capacity).toBe(32);
    expect(admissionSnapshot(w, AT + 30000).visitorsPerMinute).toBeCloseTo(19.5);
    expect(admissionSnapshot(w, AT + 30000).hourlyMaintenance).toBe(115);
    expect(admissionSnapshot({ ...w, dinosaurs: [] }, AT + 30000).visitorsPerMinute).toBe(0);
  });
  it('never activates an inactive facility from its old creation date', () => {
    const w = world();
    const deck = building('inactive', 'visitor-viewing-platform', 11, 10);
    Object.assign(deck, { status: 'INACTIVE' });
    w.buildings.push(deck);
    const snapshot = admissionSnapshot(w, AT + 3600000);
    expect(snapshot.capacity).toBe(12);
    expect(snapshot.hourlyMaintenance).toBe(95);
  });

  it('weights duplicate species by their best actual state and excludes a newborn before its creation', () => {
    const w = world();
    w.buildings.push(building('deck', 'visitor-viewing-platform', 11, 10));
    w.dinosaurs.push({ ...dinosaur('para2'), positionX: 10, happiness: 100 });
    const a = admissionSnapshot(w, AT),
      b = admissionSnapshot({ ...w, dinosaurs: [...w.dinosaurs].reverse() }, AT);
    expect(a.visitorsPerMinute).toBeCloseTo(b.visitorsPerMinute);
    expect(a.demand).toBeLessThan(24);
    expect(
      admissionSnapshot(
        { ...world(), dinosaurs: [{ ...dinosaur(), createdAt: new Date(AT + 1000) }] },
        AT,
      ).visitorsPerMinute,
    ).toBe(0);
  });
});

describe('viewing platform resource extension', () => {
  it('keeps the existing deck during its upgrade, then replaces capacity and upkeep once', () => {
    const w = world();
    const deck = building('deck', 'visitor-viewing-platform', 12, 10);
    deck.level = 2;
    deck.status = BuildingStatus.UPGRADING;
    deck.completesAt = new Date(AT + 120000);
    w.buildings.push(
      deck,
      building('lumber', 'production-lumberyard', 2, 2),
      building('quarry', 'production-quarry', 4, 2),
    );
    const before = admissionSnapshot(w, AT);
    expect(before.capacity).toBe(32);
    expect(before.hourlyMaintenance).toBe(115);
    expect(admissionSnapshot(w, AT + 119999).capacity).toBe(32);
    const after = admissionSnapshot(w, AT + 120000);
    expect(after.capacity).toBe(52);
    expect(after.hourlyMaintenance).toBe(130);
    expect(w.buildings.filter((item) => item.typeId === 'visitor-viewing-platform')).toHaveLength(
      1,
    );
  });
});

describe('Stegoceratops exhibit comparison', () => {
  function exhibitWorld() {
    const park = world();
    park.buildings.push(
      building('deck', 'visitor-viewing-platform', 12, 10),
      building('hybrid', 'habitat-hybrid-zone', 13, 5),
    );
    park.dinosaurs.push(
      { ...dinosaur('current', 'stegoceratops'), positionX: 13, positionY: 5 },
      {
        ...dinosaur('candidate', 'stegoceratops'),
        isInPark: false,
        competitiveStats: { ...STEGO_BASE_COMPETITIVE_STATS, appeal: 32 },
      },
    );
    return park;
  }
  const pair = { currentId: 'current', candidateId: 'candidate' };

  it('continues to count an existing first hybrid at its original popularity', () => {
    const park = exhibitWorld();
    const before = admissionSnapshot(park, AT);
    park.dinosaurs[1].competitiveStats = { ...STEGO_BASE_COMPETITIVE_STATS };
    expect(admissionSnapshot(park, AT)).toEqual(before);
  });

  it('previews the demand from individual appeal and observes the actual entry limit', () => {
    const park = exhibitWorld();
    const before = structuredClone(park);
    const change = previewHybridExhibit(park, pair, AT);
    expect(change.destination).toEqual({ x: 13, y: 5 });
    expect(change.preview.proposed!.demandPerMinute).toBeGreaterThan(
      change.preview.current.demandPerMinute,
    );
    expect(change.preview.proposed!.visitorsPerMinute).toBe(
      change.preview.current.visitorsPerMinute,
    );
    expect(park).toEqual(before);
  });

  it('keeps projected admissions unchanged for two displayed animals and rejects unavailable tiles', () => {
    const park = exhibitWorld();
    park.dinosaurs[2].isInPark = true;
    Object.assign(park.dinosaurs[2], { positionX: 14, positionY: 5 });
    const change = previewHybridExhibit(park, pair, AT);
    expect(change.destination).toBeNull();
    expect(change.preview.proposed).toEqual(change.preview.current);

    park.dinosaurs[2].isInPark = false;
    park.isOpen = false;
    expect(previewHybridExhibit(park, pair, AT).destination).toBeNull();
    expect(() => previewHybridExhibit(park, { ...pair, candidateId: 'elsewhere' }, AT)).toThrow(
      '보유 중인 스테고케라톱스 두 마리를 찾을 수 없어요.',
    );
  });
});
