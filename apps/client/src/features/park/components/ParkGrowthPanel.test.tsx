import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ParkGrowthResponse } from '@dino-park/shared';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ParkGrowthPanel from './ParkGrowthPanel';

const mocks = vi.hoisted(() => ({
  state: undefined as ParkGrowthResponse | undefined,
  mutate: vi.fn(),
}));

vi.mock('@/api/queries/parkGrowth', () => ({
  useParkGrowth: () => ({ data: mocks.state, isPending: false, error: null }),
  useParkGrowthAction: () => ({ mutate: mocks.mutate, isPending: false, error: null }),
}));

function data(): ParkGrowthResponse {
  return {
    unlocked: true,
    level: 5,
    exp: 35,
    expForNextLevel: 3623,
    targetLevel: 6,
    goals: [
      { id: 'facility', status: 'claimable', xp: 897, progress: 1, target: 1 },
      { id: 'research', status: 'incomplete', xp: 897, progress: 0, target: 1 },
      { id: 'field', status: 'incomplete', xp: 897, progress: 0, target: 1 },
      { id: 'operation', status: 'incomplete', xp: 897, progress: 18, target: 100 },
    ],
    research: {
      status: 'available',
      completesAt: null,
      costs: { gold: 500, wood: 5, stone: 5 },
      durationSeconds: 60,
      entranceBonusPercent: 4,
      unavailableReason: null,
    },
  };
}

function panel(onClose = vi.fn(), onShowResources = vi.fn(), onPrepareLab = vi.fn()) {
  return (
    <MemoryRouter>
      <ParkGrowthPanel
        isParkOpen
        onClose={onClose}
        onShowFacilities={vi.fn()}
        onShowResources={onShowResources}
        onPrepareLab={onPrepareLab}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.state = data();
  mocks.mutate.mockReset();
});

describe('park level 5 growth goals', () => {
  it('shows the server’s existing completion, actual visitors and specific field route', () => {
    render(panel());
    expect(screen.getByRole('progressbar', { name: '파크 레벨 경험치' })).toHaveAttribute(
      'value',
      '35',
    );
    const facility = within(screen.getByRole('article', { name: '시설 준비' }));
    fireEvent.click(facility.getByRole('button', { name: '897 XP 받기' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'claim', goalId: 'facility' },
      expect.any(Object),
    );
    const operation = within(screen.getByRole('article', { name: '입장 실적' }));
    expect(operation.getByText('누적 유료 입장객 18 / 100명')).toBeVisible();
    expect(operation.queryByRole('button', { name: '897 XP 받기' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '폐연구소로 가기' })).toHaveAttribute(
      'href',
      '/exploration?tab=drive&mission=basic-catalyst',
    );
  });

  it('recovers research prerequisites and resumes using the server clock', () => {
    const state = data();
    state.research.unavailableReason = '목재 5개가 필요해요.';
    mocks.state = state;
    const resources = vi.fn();
    const prepareLab = vi.fn();
    const { rerender } = render(panel(vi.fn(), resources));
    expect(screen.getByText('목재 5개가 필요해요.')).toBeVisible();
    expect(screen.queryByRole('button', { name: '연구 시작' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '자원 시설 보기' }));
    expect(resources).toHaveBeenCalledOnce();

    mocks.state = {
      ...state,
      research: {
        ...state.research,
        status: 'running',
        unavailableReason: null,
        completesAt: new Date(Date.now() + 30000).toISOString(),
      },
    };
    rerender(panel(vi.fn(), resources));
    expect(screen.getByText(/연구 중 · \d+초 남음/)).toBeVisible();
    expect(screen.queryByRole('button', { name: '연구 시작' })).not.toBeInTheDocument();

    mocks.state = {
      ...state,
      research: {
        ...state.research,
        status: 'locked',
        unavailableReason: 'DNA 연구소 Lv.1을 완공하면 연구할 수 있어요.',
      },
    };
    rerender(panel(vi.fn(), resources, prepareLab));
    expect(screen.getByText('DNA 연구소 Lv.1을 완공하면 연구할 수 있어요.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '연구소 확인' }));
    expect(prepareLab).toHaveBeenCalledOnce();
  });

  it('shows Lv.6 and claimed states after the final server-confirmed award', () => {
    const state = data();
    const fourth = { ...state.goals[3], status: 'claimable' as const, progress: 100 };
    state.goals = [
      ...state.goals.slice(0, 3).map((goal) => ({ ...goal, status: 'claimed' as const })),
      fourth,
    ];
    state.exp = 2726;
    mocks.state = state;
    const { rerender } = render(panel());
    fireEvent.click(screen.getByRole('button', { name: '897 XP 받기' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'claim', goalId: 'operation' },
      expect.any(Object),
    );
    mocks.state = {
      ...state,
      level: 6,
      exp: 0,
      expForNextLevel: 5031,
      goals: state.goals.map((goal) => ({
        ...goal,
        status: 'claimed' as const,
        progress: goal.target,
      })),
    };
    rerender(panel());
    expect(screen.getByRole('heading', { name: '파크 Lv.6 달성!' })).toBeVisible();
    expect(screen.getAllByText('보상 받음')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: '897 XP 받기' })).not.toBeInTheDocument();
  });
});
