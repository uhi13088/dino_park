import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCOUT_MISSIONS, SCOUT_REGIONS } from '@dino-park/game-data';
import type { ScoutExpeditionState } from '@dino-park/shared';
import ScoutDispatchPanel from './ScoutDispatchPanel';

const mocks = vi.hoisted(() => ({ query: vi.fn(), mutate: vi.fn() }));
vi.mock('@/api/queries/scoutExpedition', () => ({
  useScoutExpedition: mocks.query,
  useScoutAction: () => ({ isPending: false, mutate: mocks.mutate }),
}));

const initial: ScoutExpeditionState = {
  serverNow: '2026-11-22T12:00:00Z',
  gold: 12_000,
  fuel: 30,
  fuelMax: 30,
  diamond: 0,
  scouts: [
    {
      id: 'scout-a',
      name: '정찰대원',
      experience: 0,
      searchLevel: 1,
      mobilityLevel: 1,
      responseLevel: 1,
      assignment: null,
    },
  ],
  hireDiamondCost: null,
  missions: Object.fromEntries(
    SCOUT_MISSIONS.map(({ id }) => [id, { blockedReason: '조사 조건이 필요해요.' }]),
  ),
};

function openMap(
  state: Partial<ScoutExpeditionState> = {},
  requestedMission?: string,
  stage?: string,
  requestedSpot?: string,
) {
  mocks.query.mockReturnValue({ data: { ...initial, ...state }, dataUpdatedAt: Date.now() });
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScoutDispatchPanel
        requestedMission={requestedMission}
        requestedSpot={requestedSpot}
        stage={stage}
        growthReturnPath={stage ? `/park?panel=growth&stage=${stage}` : undefined}
      />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('scout dispatch map', () => {
  it.each([
    ['first-iguanodon-v1', 'park-meadow'],
    ['repeat-rim-survey', 'foothill-fossil-bed'],
    ['natural-target-plesiosaurus', 'quiet-bay'],
  ])('dispatches %s at %s with zero fuel', (missionId, spotId) => {
    const mission = SCOUT_MISSIONS.find(({ id }) => id === missionId)!;
    openMap(
      {
        gold: mission.gold,
        fuel: 0,
        missions: { [missionId]: {} },
        scouts: [{ ...initial.scouts[0], responseLevel: mission.gate?.responseLevel ?? 1 }],
      },
      missionId,
      undefined,
      spotId,
    );
    expect(screen.queryByRole('link', { name: /보급소/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/연료/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '탐험가 파견' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'dispatch', request: { scoutId: 'scout-a', spotId, missionId } },
      expect.anything(),
    );
  });

  it.each([4, 5])(
    'requires 5 fuel for the same plesiosaur goal in the deep sea at fuel %s',
    (fuel) => {
      const missionId = 'natural-target-plesiosaurus';
      const spotId = 'continental-shelf';
      const mission = SCOUT_MISSIONS.find(({ id }) => id === missionId)!;
      openMap(
        {
          gold: mission.gold,
          fuel,
          missions: { [missionId]: {} },
          scouts: [{ ...initial.scouts[0], responseLevel: mission.gate?.responseLevel ?? 1 }],
        },
        missionId,
        undefined,
        spotId,
      );
      expect(screen.getByText(/골드 · 연료 5/)).toBeVisible();
      expect(screen.getByRole('link', { name: `연료 ${fuel}/30 · 보급소 열기` })).toHaveAttribute(
        'href',
        '/park?panel=resources&tab=fuel&mission=natural-target-plesiosaurus&spot=continental-shelf',
      );
      const dispatch = screen.getByRole('button', { name: '탐험가 파견' });
      if (fuel < 5) {
        expect(dispatch).toBeDisabled();
        expect(screen.getByText('연료가 부족해요.')).toBeVisible();
        return;
      }
      fireEvent.click(dispatch);
      expect(mocks.mutate).toHaveBeenCalledWith(
        { kind: 'dispatch', request: { scoutId: 'scout-a', spotId, missionId } },
        expect.anything(),
      );
    },
  );

  it('shows a ten-fuel cost on a named long-range land mission', () => {
    const missionId = 'mission.mineral-cave.crystal-core.v1';
    openMap(
      {
        fuel: 9,
        missions: { [missionId]: {} },
        scouts: [{ ...initial.scouts[0], responseLevel: 2 }],
      },
      missionId,
      undefined,
      'collapse-crystal',
    );
    expect(screen.getByText(/골드 · 연료 10/)).toBeVisible();
    expect(screen.getByText('연료가 부족해요.')).toBeVisible();
    expect(screen.getByRole('button', { name: '탐험가 파견' })).toBeDisabled();
  });

  it('opens the whole map and returns to the selected region with its eight spots', () => {
    openMap();
    fireEvent.click(screen.getByRole('button', { name: '전체 지도' }));
    expect(document.querySelector('img.scout-terrain')).toHaveAttribute(
      'src',
      '/assets/exploration/maps/overworld.webp',
    );
    const world = screen.getByRole('group', { name: '탐험 지역 지도' });
    expect(within(world).getAllByRole('button')).toHaveLength(10);
    expect(within(world).getByRole('button', { name: '초원' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    fireEvent.click(within(world).getByRole('button', { name: '깊은 바다' }));
    expect(
      within(screen.getByRole('group', { name: '깊은 바다 스팟' })).getAllByRole('button'),
    ).toHaveLength(8);
    expect(screen.getByRole('combobox', { name: '탐험 지역' })).toHaveValue('deep-sea');
    expect(document.querySelector('img.scout-terrain')).toHaveAttribute(
      'src',
      '/assets/exploration/maps/deep-sea.webp',
    );
    expect(screen.getByRole('button', { name: '전체 지도' })).toHaveFocus();
  });

  it('opens the specific locked rank and retains the chosen spot for the return trip', () => {
    const id = 'repeat-rim-survey';
    openMap(
      {
        missions: {
          ...initial.missions,
          [id]: {
            blockedReason: '현장 지도화 Lv.1 연구를 완료하세요.',
            blocker: { kind: 'research', technologyId: 'exp-field-mapping', level: 1 },
          },
        },
      },
      id,
    );
    expect(screen.getByRole('link', { name: '현장 지도화 보기' })).toHaveAttribute(
      'href',
      '/research?mission=repeat-rim-survey&spot=foothill-fossil-bed&technology=exp-field-mapping&level=1',
    );
  });

  it('allows inspecting all eight pins in every region, even when dispatch is locked', () => {
    openMap();
    const regions = screen.getByRole('combobox', { name: '탐험 지역' });
    expect(within(regions).getAllByRole('option')).toHaveLength(10);
    for (const { id, name, spots } of SCOUT_REGIONS) {
      fireEvent.change(regions, { target: { value: id } });
      const pins = within(screen.getByRole('group', { name: `${name} 스팟` })).getAllByRole(
        'button',
      );
      expect(pins).toHaveLength(8);
      fireEvent.click(pins[7]);
      expect(screen.getByRole('heading', { name: spots[7].name })).toBeVisible();
      expect(screen.getByRole('button', { name: '탐험가 파견' })).toBeDisabled();
    }
  });

  it('selects the specific growth destination and starts it without earlier pins', () => {
    const id = 'repeat-rim-survey';
    openMap({ missions: { ...initial.missions, [id]: {} } }, id);
    expect(screen.getByRole('combobox', { name: '탐험 지역' })).toHaveValue('fossil-valley');
    expect(screen.getByRole('heading', { name: '기슭 화석층' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '탐험가 파견' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        kind: 'dispatch',
        request: { scoutId: 'scout-a', spotId: 'foothill-fossil-bed', missionId: id },
      },
      expect.anything(),
    );
  });

  it('opens the actual assigned spot and allows claiming a due report', () => {
    const mission = SCOUT_MISSIONS.find(({ id }) => id === 'natural-target-ichthyosaurus')!;
    openMap({
      scouts: [
        {
          ...initial.scouts[0],
          assignment: {
            id: 'finished',
            spotId: 'seagrass-forest',
            missionId: mission.id,
            readyAt: '2026-11-22T11:59:00Z',
            reward: mission.reward,
          },
        },
      ],
    });
    expect(screen.getByRole('heading', { name: '해초 숲' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '보고서 수령' }));
    expect(mocks.mutate).toHaveBeenCalledWith({ kind: 'claim', id: 'finished' }, expect.anything());
  });

  it.each([
    ['mission.mineral-cave.basic-stabilizer.v1', '8', true],
    ['mission.mutation-crater.basic-mutation-cell.v1', '14', false],
  ])('marks report %s as growth evidence only for its actual goal', (id, stage, tracked) => {
    const mission = SCOUT_MISSIONS.find((item) => item.id === id)!;
    const spot = SCOUT_REGIONS.flatMap((region) => region.spots).find((item) =>
      item.missionIds.includes(id),
    )!;
    openMap(
      {
        lastReport: {
          id: 'reported',
          spotId: spot.id,
          missionId: id,
          readyAt: initial.serverNow,
          reward: mission.reward,
        },
      },
      id,
      stage,
    );

    expect(screen.getByRole('status').textContent?.includes('성장 목표 반영')).toBe(tracked);
  });
});
