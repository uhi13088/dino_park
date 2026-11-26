import {
  admissionDiagnosis,
  admissionSnapshot,
  currentDinosaurState,
  dinosaurCareBoundaries,
  dinosaurCareCheckpoint,
  exhibitSafetyIssue,
  parkExhibitRiskPoints,
} from './park-admission.logic';
import { BuildingStatus } from '@prisma/client';
import { Rarity, STEGO_BASE_COMPETITIVE_STATS } from '@dino-park/shared';
import {
  getDinosaurById,
  getExperimentalHybridDesign,
  SECURITY_CENTER_TYPE_ID,
} from '@dino-park/game-data';
import { previewHybridExhibit } from '../dinosaur/hybrid-exhibit.logic';

import { AT, building, dinosaur, world } from './park-admission.fixtures';

it('reserves security for a dangerous habitat in either placement order', () => {
  const park = world();
  const carnivore = building('carnivore', 'habitat-carnivore', 14, 9);
  park.buildings.push(carnivore, building('desert', 'habitat-desert', 4, 8));
  const natural = { ...dinosaur('natural', 'coelophysis'), positionX: 4, positionY: 8 };
  const design = getExperimentalHybridDesign(
    getDinosaurById('tyrannosaurus-rex')!,
    getDinosaurById('argentinosaurus')!,
    'balanced',
    Rarity.LEGENDARY,
    false,
  )!;
  const hybrid = {
    ...dinosaur('hybrid', design.species.id),
    hybridSpecies: { species: JSON.parse(JSON.stringify(design.species)) },
    positionX: 14,
    positionY: 9,
    isInPark: false,
  };
  const naturalTile = { x: 4, y: 8 };
  const hybridTile = { x: 14, y: 9 };
  expect(exhibitSafetyIssue(park, hybrid, hybridTile, AT)).toContain('보안센터');
  park.buildings.push(building('security', SECURITY_CENTER_TYPE_ID, 14, 13));
  carnivore.status = BuildingStatus.CONSTRUCTING;
  expect(exhibitSafetyIssue(park, hybrid, hybridTile, AT)).toContain('서식지');
  carnivore.status = BuildingStatus.ACTIVE;
  park.dinosaurs.push(natural);
  // When the park has no entrance, habitats still reserve their security allotment.
  park.buildings.splice(1, 1);
  expect(admissionSnapshot(park, AT).exhibitedDinosaurIds).toEqual([]);
  expect(exhibitSafetyIssue(park, hybrid, hybridTile, AT)).toContain('보안 여유');
  natural.isInPark = false;
  expect(exhibitSafetyIssue(park, hybrid, hybridTile, AT)).toBeNull();
  hybrid.isInPark = true;
  park.dinosaurs.push(hybrid);
  expect(parkExhibitRiskPoints(park, AT)).toBe(3);
  expect(exhibitSafetyIssue(park, natural, naturalTile, AT)).toContain('보안 여유');
  expect(exhibitSafetyIssue(park, hybrid, { x: 15, y: 9 }, AT)).toBeNull();
});

it('keeps the security center operating during expansion and applies the new upkeep once', () => {
  const park = world();
  const center = {
    ...building('security', SECURITY_CENTER_TYPE_ID, 15, 9),
    level: 2,
    status: BuildingStatus.UPGRADING,
    completesAt: new Date(AT + 150_000),
  };
  park.buildings.push(center, building('desert', 'habitat-desert', 4, 8));
  park.dinosaurs.push(
    { ...dinosaur('exhibited', 'coelophysis'), positionX: 4, positionY: 8 },
    { ...dinosaur('waiting', 'coelophysis'), isInPark: false },
  );
  const before = admissionSnapshot(park, AT + 149_999);
  const after = admissionSnapshot(park, AT + 150_000);
  expect(after.exhibitedDinosaurIds).toContain('exhibited');
  expect(after.exhibitedDinosaurIds).not.toContain('waiting');
  expect(after.hourlyMaintenance - before.hourlyMaintenance).toBeCloseTo(7 - 10 * 0.005);
  expect(after.visitorsPerMinute).toBe(before.visitorsPerMinute);
  park.buildings.push({ ...center, id: 'another', positionX: 16, positionY: 4 });
  expect(admissionSnapshot(park, AT + 150_000).hourlyMaintenance).toBeCloseTo(
    after.hourlyMaintenance + 87,
  );
});

describe('environment adaptation', () => {
  const hour = 3_600_000;

  it('slows both rates only from research completion in an active compatible habitat', () => {
    const park = world();
    const para = park.dinosaurs[0];
    park.technologyResearch = [
      { technologyId: 'care-adaptation', completesAt: new Date(AT + hour) },
    ];
    expect(currentDinosaurState(para, AT + hour, park)).toEqual({ happiness: 93, hunger: 5 });
    expect(currentDinosaurState(para, AT + 2 * hour, park)).toEqual({ happiness: 92, hunger: 9 });
    const baseline = { happiness: 91, hunger: 10 };
    expect(currentDinosaurState(para, AT + 2 * hour)).toEqual(baseline);
    expect(currentDinosaurState({ ...para, isInPark: false }, AT + 2 * hour, park)).toEqual(
      baseline,
    );
    expect(currentDinosaurState({ ...para, positionX: 3 }, AT + 2 * hour, park)).toEqual(baseline);
    expect(
      currentDinosaurState({ ...para, speciesId: 'stegoceratops' }, AT + 2 * hour, park),
    ).toEqual(baseline);
    expect(admissionSnapshot(park, AT + 2 * hour).entranceResearchCompleted).toBe(false);
  });

  it('preserves already accrued slowdown on exit, and starts it prospectively on reentry', () => {
    const park = world();
    const para = park.dinosaurs[0];
    park.technologyResearch = [{ technologyId: 'care-adaptation', completesAt: new Date(AT) }];
    const leave = AT + hour;
    const careProgress = dinosaurCareCheckpoint(para, park, leave);
    expect(careProgress).toEqual({ at: leave, savedMs: 72_000 });
    const outside = { ...para, positionX: 3, careProgress };
    expect(currentDinosaurState(outside, leave + hour, park)).toEqual({ happiness: 92, hunger: 9 });
    const returned = {
      ...para,
      careProgress: dinosaurCareCheckpoint(outside, park, leave + hour),
    };
    expect(currentDinosaurState(returned, leave + hour + 36_000, park).hunger).toBe(9);
    expect(currentDinosaurState(returned, leave + hour + 74_000, park).hunger).toBe(10);
  });

  it('uses the same shifted point for state reads and admission settlement', () => {
    const park = world();
    park.technologyResearch = [{ technologyId: 'care-adaptation', completesAt: new Date(AT) }];
    const para = park.dinosaurs[0];
    const boundary = dinosaurCareBoundaries(para, park, AT, AT + 800_000)[0];
    expect(boundary - AT).toBeCloseTo(720_000 / 0.98, 2);
    expect(currentDinosaurState(para, boundary - 1, park).hunger).toBe(0);
    expect(currentDinosaurState(para, boundary, park).hunger).toBe(1);
  });

  it('accrues 2%, 4% and 6% from each completed adaptation level', () => {
    const park = world();
    const para = park.dinosaurs[0];
    park.technologyResearch = [
      { technologyId: 'care-adaptation', level: 3, completesAt: new Date(AT + 2 * hour) },
      { technologyId: 'care-adaptation', level: 1, completesAt: new Date(AT) },
      { technologyId: 'care-adaptation', level: 2, completesAt: new Date(AT + hour) },
    ];
    expect(dinosaurCareCheckpoint(para, park, AT + 2 * hour)?.savedMs).toBe(216_000);
    expect(dinosaurCareCheckpoint(para, park, AT + 3 * hour)?.savedMs).toBe(432_000);
    const hungerBoundary = AT + 2 * hour + 216_000 / 0.94;
    const points = dinosaurCareBoundaries(para, park, AT + 2 * hour, AT + 3 * hour);
    expect(points).toContain(hungerBoundary);
    expect(currentDinosaurState(para, hungerBoundary - 1, park).hunger).toBe(9);
    expect(currentDinosaurState(para, hungerBoundary, park).hunger).toBe(10);
  });
});

describe('paid admission topology and demand', () => {
  it('applies only the highest completed entrance research rank to gate capacity', () => {
    const park = world();
    park.technologyResearch = [
      { technologyId: 'ops-entry', level: 1, completesAt: new Date(AT) },
      { technologyId: 'ops-entry', level: 2, completesAt: new Date(AT + 3600) },
    ];
    expect(admissionSnapshot(park, AT - 1).entranceResearchCompleted).toBe(false);
    expect(admissionSnapshot(park, AT + 3599).gateCapacity).toBe(104);
    expect(admissionSnapshot(park, AT + 3600).gateCapacity).toBe(108);
  });

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

  it('applies viewing comfort and upkeep when the deck completes without raising park capacity', () => {
    const w = world();
    const deck = building('deck', 'visitor-viewing-platform', 11, 10);
    deck.status = BuildingStatus.CONSTRUCTING;
    deck.completesAt = new Date(AT + 30000);
    w.buildings.push(deck);
    const before = admissionSnapshot(w, AT + 29999);
    const after = admissionSnapshot(w, AT + 30000);
    expect(before).toMatchObject({ capacity: 12, visitorsPerMinute: 12, hourlyMaintenance: 95 });
    expect(after).toMatchObject({ capacity: 12, visitorsPerMinute: 12, hourlyMaintenance: 115 });
    expect(admissionDiagnosis(before, deck, AT + 29999).exhibits[0].satisfactionPercent).toBe(75);
    expect(admissionDiagnosis(after, deck, AT + 30000).exhibits[0].satisfactionPercent).toBe(80);
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
  it('keeps the existing deck during construction and applies the local upgrade at completion', () => {
    const w = world();
    const deck = building('deck', 'visitor-viewing-platform', 12, 10);
    deck.level = 2;
    deck.status = BuildingStatus.UPGRADING;
    const completesAt = AT + 120000;
    deck.completesAt = new Date(completesAt);
    w.buildings.push(
      deck,
      building('lumber', 'production-lumberyard', 2, 2),
      building('quarry', 'production-quarry', 4, 2),
    );
    const before = admissionSnapshot(w, AT);
    expect(before.capacity).toBe(12);
    expect(before.hourlyMaintenance).toBe(115);
    const almostDone = admissionSnapshot(w, completesAt - 1);
    expect(almostDone.capacity).toBe(12);
    expect(admissionDiagnosis(almostDone, deck, completesAt - 1).platformImpact).toMatchObject({
      fromLevel: 1,
      toLevel: 2,
    });
    const after = admissionSnapshot(w, completesAt);
    expect(after.capacity).toBe(12);
    expect(after.hourlyMaintenance).toBe(130);
    expect(admissionDiagnosis(after, deck, completesAt).platformImpact).toBeNull();
    deck.status = BuildingStatus.ACTIVE;
    expect(admissionDiagnosis(after, deck, completesAt).platformImpact).toMatchObject({
      fromLevel: 2,
      toLevel: 3,
    });
    expect(w.buildings.filter((item) => item.typeId === 'visitor-viewing-platform')).toHaveLength(
      1,
    );
  });
});

describe('admission bottlenecks and platform impact', () => {
  it('counts occupied, compatible, completed and connected exhibits, with a fixed gain per zone', () => {
    const park = world();
    const second = building('second', 'habitat-grassland', 2, 3);
    const third = building('third', 'habitat-grassland', 13, 6);
    park.buildings.push(second, third);
    expect(admissionSnapshot(park, AT).capacity).toBe(12);
    park.dinosaurs.push({ ...dinosaur('second-dino'), positionX: 3, positionY: 4 });
    park.dinosaurs.push({ ...dinosaur('other-first-dino'), positionX: 10, positionY: 10 });
    expect(admissionSnapshot(park, AT)).toMatchObject({ capacity: 22, occupancyCapacity: 44 });
    park.dinosaurs.push({
      ...dinosaur('third-dino', 'velociraptor'),
      positionX: 14,
      positionY: 7,
    });
    expect(admissionSnapshot(park, AT).capacity).toBe(22);
    park.dinosaurs.at(-1)!.speciesId = 'parasaurolophus';
    third.status = BuildingStatus.CONSTRUCTING;
    third.completesAt = new Date(AT + 30000);
    expect(admissionSnapshot(park, AT + 29999).capacity).toBe(22);
    expect(admissionSnapshot(park, AT + 30000)).toMatchObject({
      capacity: 32,
      occupancyCapacity: 64,
    });
    for (let offset = 0; offset < 3; offset++) {
      park.buildings.push(
        building(`north-${offset}`, 'amenity-bench', 13 + offset, 5),
        building(`south-${offset}`, 'amenity-bench', 13 + offset, 9),
        building(`west-${offset}`, 'amenity-bench', 12, 6 + offset),
        building(`east-${offset}`, 'amenity-bench', 16, 6 + offset),
      );
    }
    const snapshot = admissionSnapshot(park, AT + 30000);
    expect(admissionDiagnosis(snapshot, undefined, AT + 30000)).toMatchObject({
      exhibitCount: 2,
      exhibitPerMinute: 22,
    });
    expect(snapshot.visitorPaths.has(third.id)).toBe(false);
  });

  function busyExhibitPark() {
    const park = world();
    const deck = building('deck', 'visitor-viewing-platform', 13, 8);
    park.buildings.push(deck, building('hybrid', 'habitat-hybrid-zone', 13, 5));
    Object.assign(park.dinosaurs[0], {
      happiness: 100,
      competitiveStats: { ...STEGO_BASE_COMPETITIVE_STATS, appeal: 3 },
    });
    park.dinosaurs.push({
      ...dinosaur('stego', 'stegoceratops'),
      positionX: 13,
      positionY: 5,
      happiness: 100,
      competitiveStats: { ...STEGO_BASE_COMPETITIVE_STATS, appeal: 30 },
    });
    return { park, deck };
  }

  it('routes the current occupants by exhibit appeal to separate accessible perimeters', () => {
    const { park, deck } = busyExhibitPark();
    const snapshot = admissionSnapshot(park, AT);
    const { exhibits } = admissionDiagnosis(snapshot, deck, AT, 43);
    expect(exhibits).toMatchObject([
      { id: 'grass', visitors: 4, viewingCapacity: 12 },
      { id: 'hybrid', visitors: 39, viewingCapacity: 20 },
    ]);
    expect(exhibits.map(({ visitorPath }) => visitorPath?.at(-1))).toEqual([
      { x: 11, y: 10 },
      { x: 14, y: 8 },
    ]);
    for (const { visitorPath } of exhibits) {
      expect(visitorPath?.[0]).toEqual({ x: 13, y: 15 });
      for (const [i, tile] of (visitorPath ?? []).entries()) {
        expect(snapshot.pathTiles).toContainEqual(tile);
        const previous = visitorPath?.[i - 1];
        if (previous) {
          expect(Math.abs(tile.x - previous.x) + Math.abs(tile.y - previous.y)).toBe(1);
        }
      }
    }
  });

  it('predicts the actual local congestion and satisfaction after upgrade at the same admission rate', () => {
    const { park, deck } = busyExhibitPark();
    const original = structuredClone(park);
    const snapshot = admissionSnapshot(park, AT);
    const diagnosis = admissionDiagnosis(snapshot, deck, AT, 44);
    const upgraded = { ...deck, level: 2 };
    const nextPark = {
      ...park,
      buildings: [upgraded, ...park.buildings.filter((b) => b.id !== deck.id)],
    };
    const after = admissionSnapshot(nextPark, AT);
    expect(diagnosis.bottlenecks).toEqual(['exhibit']);
    expect(diagnosis.exhibitedDinosaurIds).toEqual(['para', 'stego']);
    expect(diagnosis.platformImpact).toEqual({
      buildingId: deck.id,
      fromLevel: 1,
      toLevel: 2,
      exhibitId: 'hybrid',
      before: { crowdingPercent: 50, satisfactionPercent: 65 },
      after: { crowdingPercent: 0, satisfactionPercent: 85 },
    });
    expect(admissionDiagnosis(after, upgraded, AT, 44).exhibits).toContainEqual(
      expect.objectContaining({
        id: 'hybrid',
        dinosaurIds: ['stego'],
        visitors: 40,
        viewingCapacity: 40,
        ...diagnosis.platformImpact!.after,
      }),
    );
    expect([snapshot.visitorsPerMinute, after.visitorsPerMinute]).toEqual([22, 22]);
    expect(park).toEqual(original);
  });

  it('picks the closest traversable perimeter and resolves equally short routes by stable ID', () => {
    const park = world();
    const west = building('aaaa-west', 'habitat-grassland', 4, 4);
    const east = building('zzzz-east', 'habitat-grassland', 12, 4);
    const deck = building('deck', 'visitor-viewing-platform', 9, 5);
    park.buildings = [park.buildings[1], east, west, deck];
    park.dinosaurs = [
      { ...dinosaur('east'), positionX: 13, positionY: 5 },
      { ...dinosaur('west'), positionX: 5, positionY: 5 },
    ];
    expect(
      admissionDiagnosis(admissionSnapshot(park, AT), deck, AT).platformImpact?.exhibitId,
    ).toBe(west.id);
    for (let y = 0; y < 11; y++) park.buildings.push(building(`wall-${y}`, 'amenity-bench', 8, y));
    expect(
      admissionDiagnosis(admissionSnapshot(park, AT), deck, AT).platformImpact?.exhibitId,
    ).toBe(east.id);
  });

  it('uses the highest usable deck when multiple decks serve the same exhibit', () => {
    const { park, deck } = busyExhibitPark();
    park.buildings.push({ ...building('existing', 'visitor-viewing-platform', 16, 6), level: 4 });
    const forecast = admissionDiagnosis(admissionSnapshot(park, AT), deck, AT).platformImpact;
    expect(forecast?.before).toEqual({ crowdingPercent: 0, satisfactionPercent: 95 });
    expect(forecast?.after).toEqual(forecast?.before);
  });

  it('retains a tied demand and exhibit limit', () => {
    const park = world();
    park.technologyResearch = [{ technologyId: 'ops-entry', completesAt: new Date(AT) }];
    Object.assign(park.dinosaurs[0], {
      happiness: 100,
      competitiveStats: { ...STEGO_BASE_COMPETITIVE_STATS, appeal: 1 },
    });
    const diagnosis = admissionDiagnosis(admissionSnapshot(park, AT), undefined, AT);
    expect(diagnosis).toMatchObject({
      gatePerMinute: 104,
      exhibitPerMinute: 12,
      bottlenecks: ['demand', 'exhibit'],
      entranceResearchCompleted: true,
    });
  });

  it('uses current occupants after closure and preserves the open-operation forecast', () => {
    const { park, deck } = busyExhibitPark();
    const open = admissionDiagnosis(admissionSnapshot(park, AT), deck, AT, 44);
    park.isOpen = false;
    const closed = admissionDiagnosis(admissionSnapshot(park, AT), deck, AT, 44);
    expect(closed.bottlenecks).toEqual([]);
    expect(closed.exhibits).toEqual(open.exhibits);
    expect(closed.platformImpact).toMatchObject({ before: { crowdingPercent: 50 } });
    const empty = admissionDiagnosis(admissionSnapshot(park, AT), deck, AT);
    expect(empty.exhibits.map(({ crowdingPercent }) => crowdingPercent)).toEqual([0, 0]);
    expect(closed.platformImpact).toEqual(empty.platformImpact);
  });

  it('has no effect on an unreachable deck and no projection past the supported maximum', () => {
    const park = world();
    const deck = building('deck', 'visitor-viewing-platform', 5, 5);
    park.buildings.push(
      deck,
      building('north', 'amenity-bench', 5, 4),
      building('east', 'amenity-bench', 6, 5),
      building('south', 'amenity-bench', 5, 6),
      building('west', 'amenity-bench', 4, 5),
    );
    expect(admissionDiagnosis(admissionSnapshot(park, AT), deck, AT).platformImpact).toMatchObject({
      exhibitId: null,
      before: null,
      after: null,
    });
    deck.level = 5;
    expect(admissionDiagnosis(admissionSnapshot(park, AT), deck, AT).platformImpact).toBeNull();
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
