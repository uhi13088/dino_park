import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExplorationPage from './ExplorationPage';

const mocks = vi.hoisted(() => ({
  drive: vi.fn(),
  claim: vi.fn(),
  startPlacement: vi.fn(),
}));

vi.mock('@/api', () => ({
  useFirstExpedition: () => ({
    data: { stage: 'available', mission: null, egg: null, hatchingSlots: { used: 0, total: 1 } },
  }),
  useExplorations: () => ({
    data: { explorations: [{ id: 'unfinished', status: 'IN_PROGRESS' }] },
  }),
  useHatchingQueue: () => ({ data: { queue: [] } }),
  useClaimFirstExpedition: () => ({}),
  useStartHatchingEgg: () => ({}),
  useClaimHatchingEgg: () => ({}),
  useClaimExploration: () => ({}),
}));

vi.mock('@/api/queries/hybridMilestone', () => ({
  useLegacyDriveReward: mocks.drive,
  useClaimLegacyDriveReward: () => ({ mutateAsync: mocks.claim }),
  useFirstSynthesis: () => ({}),
}));

vi.mock('@/api/queries/scoutExpedition', () => ({
  useScoutExpedition: () => ({
    dataUpdatedAt: Date.now(),
    data: {
      serverNow: '2026-11-22T12:00:00Z',
      gold: 500,
      fuel: 30,
      fuelMax: 30,
      diamond: 0,
      scouts: [],
      hireDiamondCost: null,
      missions: {},
    },
  }),
  useScoutAction: () => ({ isPending: false }),
}));

vi.mock('@/stores', () => ({
  useAuthStore: (select: (state: { isAuthenticated: boolean }) => boolean) =>
    select({ isAuthenticated: true }),
  useGameStore: () => ({ startPlacement: mocks.startPlacement }),
  useUIStore: () => ({ closeModal: vi.fn(), closeSidePanel: vi.fn(), showToast: vi.fn() }),
}));

function openOldBookmark() {
  return render(
    <MemoryRouter
      initialEntries={['/exploration?tab=drive&mission=trike']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ExplorationPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('retired exploration links', () => {
  it('opens the bookmarked scout spot and never starts an unfinished legacy run', () => {
    mocks.drive.mockReturnValue({ data: { run: null } });
    const { container } = openOldBookmark();
    expect(screen.getByRole('combobox', { name: '탐험 지역' })).toHaveValue('fossil-valley');
    expect(screen.getByRole('heading', { name: '입구 초원 둥지' })).toBeVisible();
    expect(screen.getByRole('button', { name: '탐험가 파견' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /주행|탐험 완료 확인|이전 보상 수령/ }),
    ).not.toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('lets a player claim a completed legacy reward from the same scout screen', async () => {
    mocks.drive.mockReturnValue({
      data: {
        run: {
          id: 'completed',
          title: '이전 트리케라톱스 조사',
          reward: { type: 'egg', speciesId: 'triceratops', hatchSeconds: 3600 },
        },
      },
    });
    mocks.claim.mockResolvedValue({ run: null });
    openOldBookmark();
    expect(screen.getByText('이전 트리케라톱스 조사')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '이전 보상 수령' }));
    await waitFor(() => expect(mocks.claim).toHaveBeenCalledWith('completed'));
  });
});
