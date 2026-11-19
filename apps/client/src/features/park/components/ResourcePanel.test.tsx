import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourcesResponse } from '@dino-park/shared';
import ResourcePanel from './ResourcePanel';

const mocks = vi.hoisted(() => ({
  state: undefined as ResourcesResponse | undefined,
  purchase: vi.fn(),
  start: vi.fn(),
  claim: vi.fn(),
  upgrade: vi.fn(),
  cancel: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock('@/api', () => ({ useUpgradeBuilding: () => ({ mutateAsync: mocks.upgrade }) }));
vi.mock('@/api/queries/resources', () => ({
  cancelResourceReads: mocks.cancel,
  useResources: () => ({
    data: mocks.state,
    isPending: false,
    error: null,
    refetch: mocks.refetch,
  }),
  usePurchaseResource: () => ({ mutateAsync: mocks.purchase }),
  useStartResourceProduction: () => ({ mutateAsync: mocks.start }),
  useClaimResourceProduction: () => ({ mutateAsync: mocks.claim }),
}));

function data(): ResourcesResponse {
  return {
    gold: 10000,
    parkLevel: 2,
    capacityPerMaterial: 100,
    inventory: [
      { material: 'wood', name: '목재', amount: 0, buyPrice: 20 },
      { material: 'stone', name: '석재', amount: 0, buyPrice: 30 },
    ],
    facilities: [
      {
        typeId: 'production-lumberyard',
        name: '벌목장',
        unlockLevel: 2,
        cost: 1500,
        constructionSeconds: 60,
        building: null,
        recipe: {
          material: 'wood',
          batchQuantity: 20,
          batchCost: 200,
          batchSeconds: 300,
          maxLots: 3,
        },
        job: null,
      },
    ],
    platformUpgrade: {
      buildingId: 'deck',
      level: 1,
      targetLevel: 2,
      completesAt: null,
      available: false,
      reason: '파크 Lv.3부터 확장할 수 있어요.',
      cost: { gold: 3000, wood: 20, stone: 10 },
      seconds: 120,
      targetCapacity: 40,
    },
  };
}
function openPanel(onPlaceBuilding = vi.fn()) {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <ResourcePanel onPlaceBuilding={onPlaceBuilding} />
    </QueryClientProvider>,
  );
  return onPlaceBuilding;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state = data();
  mocks.cancel.mockResolvedValue(undefined);
  mocks.refetch.mockResolvedValue(undefined);
  mocks.purchase.mockResolvedValue(undefined);
  mocks.upgrade.mockResolvedValue(undefined);
});

describe('early ordinary resource panel', () => {
  it('starts a building preview without purchasing or creating duplicate resource inputs', () => {
    const place = openPanel();
    expect(screen.getByRole('region', { name: '기본 자원' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '벌목장 배치 · 1,500골드' }));
    expect(place).toHaveBeenCalledWith('production-lumberyard');
    expect(mocks.purchase).not.toHaveBeenCalled();
    expect(screen.queryByText('금속')).not.toBeInTheDocument();
    expect(screen.queryByText('사료')).not.toBeInTheDocument();
  });
  it('buys the selected exact units after cancelling older reads', async () => {
    openPanel();
    fireEvent.change(screen.getByRole('spinbutton', { name: '목재 구매 수량' }), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: '목재 구매 · 40골드' }));
    await waitFor(() =>
      expect(mocks.purchase).toHaveBeenCalledWith({
        material: 'wood',
        quantity: 2,
        requestId: expect.any(String),
      }),
    );
    expect(mocks.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.purchase.mock.invocationCallOrder[0],
    );
    expect(await screen.findByRole('status')).toHaveTextContent('목재 2개를 구매했어요.');
  });
  it('preserves the selected complete batch and disables a claim that cannot fit', () => {
    mocks.state!.facilities[0].building = { id: 'lumber', status: 'ACTIVE', completesAt: null };
    mocks.state!.facilities[0].job = {
      id: 'job',
      lots: 3,
      quantity: 60,
      readyAt: new Date().toISOString(),
      ready: true,
      claimBlocked: true,
    };
    openPanel();
    expect(screen.getByRole('button', { name: '목재 60개 수령' })).toBeDisabled();
    expect(screen.getByText(/완료된 생산품을 보관 중/)).toBeVisible();
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it('uses the existing building upgrade endpoint after the server confirms all costs', async () => {
    mocks.state!.parkLevel = 3;
    mocks.state!.platformUpgrade!.available = true;
    mocks.state!.platformUpgrade!.reason = null;
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: '관람대 Lv.2로 확장' }));
    await waitFor(() => expect(mocks.upgrade).toHaveBeenCalledWith({ id: 'deck', targetLevel: 2 }));
    expect(mocks.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.upgrade.mock.invocationCallOrder[0],
    );
  });
  it('previews the next capacity and buys missing metal through the same inventory', async () => {
    const state = mocks.state!;
    state.parkLevel = 5;
    state.inventory.push({ material: 'metal', name: '금속', amount: 2, buyPrice: 80 });
    Object.assign(state.platformUpgrade!, {
      level: 2,
      targetLevel: 3,
      targetCapacity: 60,
      reason: '확장에 필요한 금속을 준비해주세요.',
      cost: { gold: 4000, wood: 30, stone: 20, metal: 10 },
    });
    openPanel();
    expect(screen.getByRole('heading', { name: '관람대 Lv.2' })).toBeVisible();
    expect(screen.getByText(/완공 후 관람대 정원 40명 → 60명/)).toBeVisible();
    expect(screen.getByText(/시간당 유지비 35 → 50골드/)).toBeVisible();
    expect(screen.getByRole('button', { name: '관람대 Lv.3로 확장' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: '금속 구매 수량' })).toHaveValue(8);

    const buy = screen.getByRole('button', { name: '금속 구매 · 640골드' });
    mocks.purchase.mockRejectedValueOnce(new Error('연결이 끊겼어요.'));
    fireEvent.click(buy);
    expect(await screen.findByRole('alert')).toHaveTextContent('연결이 끊겼어요.');
    fireEvent.click(buy);
    expect(await screen.findByRole('status')).toHaveTextContent('금속 8개를 구매했어요.');
    expect(mocks.purchase).toHaveBeenLastCalledWith({
      material: 'metal',
      quantity: 8,
      requestId: mocks.purchase.mock.calls[0][0].requestId,
    });
  });
  it('shows completed capacity while the Lv.5 appearance is still under construction', () => {
    Object.assign(mocks.state!.platformUpgrade!, {
      level: 4,
      targetLevel: 5,
      completesAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      targetCapacity: 100,
    });
    openPanel();
    expect(screen.getByRole('heading', { name: '관람대 Lv.4' })).toBeVisible();
    expect(screen.getByText(/Lv.5 확장 중.*10분 00초/)).toBeVisible();
    expect(screen.getByText(/현재 정원 80명 · 완공 후 100명/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /확장$/ })).not.toBeInTheDocument();
  });
});
