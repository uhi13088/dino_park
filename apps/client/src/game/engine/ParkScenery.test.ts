import { describe, expect, it, vi } from 'vitest';
import { Graphics } from 'pixi.js';
import type { ParkOperationsResponse } from '@dino-park/shared';
import { gridToScreen, IsometricGrid } from './IsometricGrid';
import { containsIslandLand, getIslandCoastClearance, getIslandScreenBounds } from './IslandWorld';
import { getVisitorRoute, ParkScenery } from './ParkScenery';
import {
  drawParkBoundary,
  getEntranceApproachOutline,
  getEntranceThresholdOutline,
  getParkEntranceFrame,
} from './ParkExterior';

const entrance = { id: 'gate', x: 2, y: 6, width: 2, height: 2, onBoundary: true };
const closedPark: ParkOperationsResponse = {
  isOpen: false,
  canOpen: true,
  openingRequirements: [],
  ticketPrice: 20,
  visitorsPerMinute: 0,
  demandPerMinute: 19.5,
  capacity: 12,
  totalVisitors: 100,
  totalAdmissionGold: 2000,
  hourlyMaintenance: 95,
  gold: 9000,
  parkLevel: 5,
  firstVisitorsGoal: { current: 10, target: 10, rewarded: true },
  pathTiles: [
    { x: 2, y: 5 },
    { x: 2, y: 4 },
  ],
  entrance,
  suggestedEntrance: null,
  viewingPlatform: null,
  occupancy: { current: 8, capacity: 24, visitSeconds: 120 },
};

describe('park exterior', () => {
  it.each([
    { side: 'top', x: 2, y: 0, normal: 'y', limit: -0.5, sign: -1, egress: { x: 3, y: 2 } },
    { side: 'left', x: 0, y: 2, normal: 'x', limit: -0.5, sign: -1, egress: { x: 2, y: 3 } },
    { side: 'bottom', x: 2, y: 6, normal: 'y', limit: 7.5, sign: 1, egress: { x: 3, y: 5 } },
    { side: 'right', x: 6, y: 2, normal: 'x', limit: 7.5, sign: 1, egress: { x: 5, y: 3 } },
  ] as const)('connects the rail opening and both directions of road on the $side edge', (test) => {
    const gate = { ...entrance, x: test.x, y: test.y };
    const frame = getParkEntranceFrame(8, 8, gate)!;
    const along = test.normal === 'x' ? 'y' : 'x';
    const endpoint = (tile: number) =>
      test.normal === 'x' ? gridToScreen(test.limit, tile) : gridToScreen(tile, test.limit);
    expect(frame).toEqual({
      side: test.side,
      from: 2,
      to: 4,
      start: endpoint(1.5),
      end: endpoint(3.5),
      center: endpoint(2.5),
    });
    const outline = getEntranceApproachOutline(8, 8, frame);
    const start = outline[0];
    const end = outline[outline.length - 1];
    expect(start[test.normal]).toBe(test.limit);
    expect(end[test.normal]).toBe(test.limit);
    expect((start[along] + end[along]) / 2).toBe(2.5);
    expect(outline.every((point) => (point[test.normal] - test.limit) * test.sign >= 0)).toBe(true);

    const throat = getEntranceThresholdOutline(8, 8, frame, gate, [test.egress]);
    expect(throat[0]).toEqual(start);
    expect(throat[3]).toEqual(end);
    expect(throat[1][test.normal]).toBe(test.egress[test.normal]);
    expect(throat[2][test.normal]).toBe(test.egress[test.normal]);
    expect((throat[1][along] + throat[2][along]) / 2).toBe(test.egress[along]);
  });

  it('keeps just one fence opening at a corner and skips an interior gate', () => {
    const backFence = new Graphics();
    const frontFence = new Graphics();
    const frame = getParkEntranceFrame(8, 8, { ...entrance, x: 6, y: 6 })!;
    expect(frame.side).toBe('bottom');
    drawParkBoundary(backFence, frontFence, 8, 8, frame);
    const rightRail = gridToScreen(7.5, 6.5);
    expect(frontFence.containsPoint({ x: rightRail.x, y: rightRail.y - 3 })).toBe(true);
    expect(frontFence.containsPoint({ x: frame.center.x, y: frame.center.y - 3 })).toBe(false);
    expect(getParkEntranceFrame(8, 8, { ...entrance, x: 6, y: 0 })?.side).toBe('right');
    expect(getParkEntranceFrame(8, 8, { ...entrance, x: 0, y: 0 })?.side).toBe('top');
    expect(getParkEntranceFrame(8, 8, { ...entrance, onBoundary: false })).toBeNull();
    backFence.destroy();
    frontFence.destroy();
  });

  it('meets the server path when it starts on a different edge of the corner gate footprint', () => {
    const gate = { ...entrance, x: 0, y: 0, width: 4, height: 4, side: 'left' as const };
    const frame = getParkEntranceFrame(20, 20, gate)!;
    const throat = getEntranceThresholdOutline(20, 20, frame, gate, [
      { x: 2, y: 4 },
      { x: 2, y: 5 },
    ]);
    expect(frame.side).toBe('left');
    expect(throat[1].x).toBe(2);
    expect(throat[2].x).toBe(2);
    expect((throat[1].y + throat[2].y) / 2).toBe(4);
  });

  it('moves a corner gate opening to the selected edge while previewing and restores it on cancel', () => {
    const scene = new ParkScenery();
    const gate = { ...entrance, x: 6, y: 6, side: 'bottom' as const };
    const bottom = getParkEntranceFrame(8, 8, gate)!;
    const right = getParkEntranceFrame(8, 8, { ...gate, side: 'right' })!;
    const hasRail = ({ center }: typeof bottom) =>
      scene.frontFence.containsPoint({ x: center.x, y: center.y - 3 });
    scene.sync(8, 8, { ...closedPark, entrance: gate, pathTiles: [] });
    expect([hasRail(bottom), hasRail(right)]).toEqual([false, true]);

    scene.previewEntrance(8, 8, right);
    expect([hasRail(bottom), hasRail(right)]).toEqual([true, false]);

    scene.previewEntrance(8, 8, null);
    expect([hasRail(bottom), hasRail(right)]).toEqual([false, true]);
    scene.frontFence.destroy();
    scene.backFence.destroy();
    scene.ground.destroy();
    scene.exterior.destroy({ children: true });
  });

  it('keeps a fixed coast near the starting park and every supported lot corner on land', () => {
    const coast = getIslandCoastClearance({ x: -0.5, y: 20 }, 'x', -1);
    expect(coast).toBeGreaterThan(1);
    expect(coast).toBeLessThan(4);
    expect(containsIslandLand({ x: -0.6 - coast, y: 20 })).toBe(false);
    const points = Array.from({ length: 101 * 101 }, (_, index) => ({
      x: (index % 101) - 0.5,
      y: Math.floor(index / 101) - 0.5,
    }));
    expect(points.every(containsIslandLand)).toBe(true);
    const bounds = getIslandScreenBounds();
    expect(bounds.right - bounds.left).toBeGreaterThan(7400);
    expect(bounds.bottom - bounds.top).toBeGreaterThan(4000);
  });

  it.each([20, 40, 100])('keeps gate approaches dry for a %s-tile plot', (size) => {
    for (const place of [
      { side: 'top', x: 9, y: 0 },
      { side: 'left', x: 0, y: 16 },
      { side: 'bottom', x: 11, y: size - 4 },
      { side: 'right', x: size - 4, y: 12 },
    ] as const) {
      const gate = getParkEntranceFrame(size, size, {
        ...entrance,
        ...place,
        width: 4,
        height: 4,
      })!;
      const outline = getEntranceApproachOutline(size, size, gate, 0.16);
      expect(outline.every(containsIslandLand)).toBe(true);
    }
  });

  it('draws the outside behind playable ground and leaves map input to the grid', () => {
    const grid = new IsometricGrid(8, 8);
    const scenery = new ParkScenery();
    grid.attachScenery(scenery);
    expect(grid.getChildIndex(scenery.exterior)).toBe(0);
    expect(grid.getChildIndex(scenery.ground)).toBeGreaterThan(0);
    expect(grid.getChildIndex(scenery.frontFence)).toBeGreaterThan(
      grid.getChildIndex(scenery.backFence),
    );
    expect(scenery.exterior.eventMode).toBe('none');
    grid.destroy({ children: true });
  });
});

describe('visitor road walk', () => {
  it('keeps an ordered route inside the connected road, including a branching union', () => {
    const tiles = [
      { x: 2, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 3 },
      { x: 9, y: 9 }, // A disconnected tile must never teleport the walker.
    ];
    const route = getVisitorRoute(tiles, entrance);
    expect(route[0]).toEqual({ x: 2, y: 5 });
    expect(route.length).toBeGreaterThan(3);
    expect(route).not.toContainEqual({ x: 9, y: 9 });
    for (let i = 1; i < route.length; i++) {
      expect(tiles).toContainEqual(route[i]);
      expect(Math.abs(route[i].x - route[i - 1].x) + Math.abs(route[i].y - route[i - 1].y)).toBe(1);
    }
  });
  it('draws no walk when there is no gate or road', () => {
    expect(getVisitorRoute([], entrance)).toEqual([]);
    expect(getVisitorRoute([{ x: 1, y: 1 }], null)).toEqual([]);
  });

  it('keeps remaining visitors visible after closing and clears them when they depart', () => {
    const scenery = new ParkScenery();
    scenery.sync(8, 8, closedPark);
    expect(scenery.visitors.children).toHaveLength(2);
    scenery.sync(8, 8, {
      ...closedPark,
      occupancy: { current: 0, capacity: 24, visitSeconds: 120 },
    });
    expect(scenery.visitors.children).toHaveLength(0);
  });

  it('shows the larger exhibit group at its destination and clears its queue after an upgrade', () => {
    const hybridRoute = [...closedPark.pathTiles, { x: 2, y: 3 }, { x: 2, y: 2 }];
    const grasslandRoute = [...closedPark.pathTiles, { x: 3, y: 4 }, { x: 4, y: 4 }];
    const hybrid = {
      id: 'hybrid',
      dinosaurIds: ['stegoceratops'],
      visitorPath: hybridRoute,
      visitors: 41,
      viewingCapacity: 20,
      crowdingPercent: 51,
      satisfactionPercent: 65,
    };
    const grassland = {
      id: 'grassland',
      dinosaurIds: ['iguanodon'],
      visitorPath: grasslandRoute,
      visitors: 3,
      viewingCapacity: 12,
      crowdingPercent: 0,
      satisfactionPercent: 75,
    };
    const admission = {
      gatePerMinute: 100,
      exhibitPerMinute: 22,
      exhibitCount: 2,
      bottlenecks: ['exhibit' as const],
      entranceResearchCompleted: false,
      exhibitedDinosaurIds: ['stegoceratops', 'iguanodon'],
      exhibits: [hybrid, grassland],
      platformImpact: null,
    };
    const state = {
      ...closedPark,
      isOpen: true,
      occupancy: { current: 44, capacity: 44, visitSeconds: 120 },
      pathTiles: [...hybridRoute, ...grasslandRoute.slice(2)],
      admission,
    };
    const scenery = new ParkScenery();
    scenery.sync(8, 8, state);
    const people = scenery.visitors.children.slice();
    const near = (tile: { x: number; y: number }) => {
      const position = gridToScreen(tile.x, tile.y);
      return people.filter(
        (person) => Math.hypot(person.x - position.x, person.y - position.y) < 35,
      );
    };
    expect(near({ x: 2, y: 2 }).length).toBeGreaterThan(near({ x: 4, y: 4 }).length);
    expect(near({ x: 4, y: 4 })).toHaveLength(1);
    expect(scenery.crowdMarkers.children).toHaveLength(1);

    scenery.sync(8, 8, {
      ...state,
      admission: {
        ...admission,
        exhibits: [
          { ...hybrid, viewingCapacity: 40, crowdingPercent: 2, satisfactionPercent: 84 },
          grassland,
        ],
      },
    });
    expect(scenery.crowdMarkers.children).toHaveLength(0);
    expect(scenery.visitors.children).toHaveLength(people.length);
    expect(scenery.visitors.children[0]).toBe(people[0]);
    expect(near({ x: 2, y: 2 })).not.toHaveLength(0);

    scenery.sync(8, 8, {
      ...state,
      occupancy: { current: 0, capacity: 44, visitSeconds: 120 },
      admission: {
        ...admission,
        exhibits: [
          { ...hybrid, visitors: 0 },
          { ...grassland, visitors: 0 },
        ],
      },
    });
    expect(scenery.visitors.children).toHaveLength(0);
  });

  it('freezes legacy walkers with reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    try {
      const scenery = new ParkScenery();
      scenery.sync(8, 8, closedPark);
      const before = scenery.visitors.children.map(({ x, y }) => ({ x, y }));
      scenery.update(2000);
      expect(scenery.visitors.children.map(({ x, y }) => ({ x, y }))).toEqual(before);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
