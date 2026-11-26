import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResearchStateResponse } from '@dino-park/shared';
import ResearchPage from './ResearchPage';

const mocks = vi.hoisted(() => ({ state: vi.fn(), start: vi.fn(), upgrade: vi.fn() }));
vi.mock('@/api/queries/research', () => ({
  useResearch: mocks.state,
  useStartTechnologyResearch: () => ({ mutateAsync: mocks.start }),
}));
vi.mock('@/api', () => ({
  useCompleteBuilding: () => ({}),
  useUpgradeBuilding: () => ({ mutateAsync: mocks.upgrade }),
}));
vi.mock('@/stores', () => ({
  useAuthStore: (select: (state: { isAuthenticated: boolean }) => boolean) =>
    select({ isAuthenticated: true }),
  useGameStore: () => ({}),
  useUIStore: () => ({}),
}));

const costs = { gold: 400, wood: 5, stone: 5, metal: 0 };
const initial: ResearchStateResponse = {
  serverNow: '2026-11-23T12:00:00Z',
  parkLevel: 8,
  gold: 5000,
  goldCapacity: 25000,
  capacityPerMaterial: 250,
  stock: { wood: 60, stone: 60, metal: 20 },
  queue: { capacity: 1, jobs: [] },
  technologies: [
    {
      id: 'exp-field-mapping',
      name: '현장 지도화',
      family: 'exp',
      connected: true,
      completedLevel: 0,
      maxLevel: 3,
      prerequisites: [],
      next: {
        level: 1,
        labLevel: 1,
        afterFirstHero: true,
        costs,
        durationSeconds: 60,
        minimumDurationSeconds: 0,
      },
    },
  ],
  facilities: [
    {
      typeId: 'research-dna-lab',
      name: 'DNA 연구소',
      completedLevel: 1,
      effect: 0,
      cap: 25,
      building: { id: 'lab', level: 1, status: 'ACTIVE', completesAt: null },
      next: {
        level: 2,
        parkLevel: 4,
        effect: 1,
        costs,
        durationSeconds: 100,
        minimumDurationSeconds: 0,
      },
    },
  ],
};

function open(state = initial) {
  mocks.state.mockReturnValue({ data: state, dataUpdatedAt: Date.now() });
  render(
    <MemoryRouter
      initialEntries={[
        '/research?mission=repeat-rim-survey&spot=foothill-fossil-bed&technology=exp-field-mapping&level=1',
      ]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ResearchPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('scout-gate research', () => {
  it('starts only the shown rank and keeps the exact scout destination as the return link', () => {
    mocks.start.mockResolvedValue(initial);
    open();
    expect(screen.getByRole('heading', { name: '현장 지도화' })).toBeVisible();
    expect(screen.getByText('400골드 · 목재 5개 · 석재 5개')).toBeVisible();
    expect(screen.getByRole('link', { name: /탐험으로/ })).toHaveAttribute(
      'href',
      '/exploration?mission=repeat-rim-survey&spot=foothill-fossil-bed',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Lv.1 연구 시작' }));
    expect(mocks.start).toHaveBeenCalledWith({ id: 'exp-field-mapping', level: 1 });
  });

  it('sends a lab-blocked rank to a quoted building upgrade without starting research', () => {
    const technology = initial.technologies[0];
    mocks.upgrade.mockResolvedValue(undefined);
    open({
      ...initial,
      technologies: [
        {
          ...technology,
          next: {
            ...technology.next!,
            labLevel: 2,
            unavailableReason: 'DNA 연구소 Lv.2가 필요해요.',
          },
        },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: '연구소 Lv.2 준비' }));
    expect(screen.getByText('파크 Lv.4 · 기술 연구 시간 1% 단축')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Lv.2 강화' }));
    expect(mocks.upgrade).toHaveBeenCalledWith({ id: 'lab', targetLevel: 2 });
    expect(mocks.start).not.toHaveBeenCalled();
  });
});
