import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FUEL_DEPOT_TYPE_ID, getGenericBuildingUpgradeQuote } from '@dino-park/game-data';
import {
  BuildingStatus,
  type BuildingResponse,
  type DinosaurResponse,
  type ResourcesResponse,
} from '@dino-park/shared';
import { afterEach, expect, it, vi } from 'vitest';
import { api, queryKeys, tokenManager, useDinosaurs } from '@/api';
import { useUIStore } from '@/stores';
import ParkPanel from './ParkPanel';

const dinosaur: DinosaurResponse = {
  id: 'rex-1',
  speciesId: 'tyrannosaurus-rex',
  nickname: '렉스',
  level: 3,
  exp: 0,
  happiness: 85,
  hunger: 20,
  intimacy: 10,
  positionX: 3,
  positionY: 4,
  isInPark: true,
};

function ParkDinosaurDetails() {
  const { data } = useDinosaurs();
  return <ParkPanel dinosaurs={data?.dinosaurs ?? []} buildings={[]} onShowResources={() => {}} />;
}

afterEach(() => {
  cleanup();
  useUIStore.getState().closeModal();
  useUIStore.getState().closeSidePanel();
  vi.restoreAllMocks();
});

it('keeps a dinosaur in place when removal fails and updates the occupied exhibit after retry', async () => {
  vi.spyOn(tokenManager, 'isAuthenticated').mockReturnValue(false);
  const client = new QueryClient();
  client.setQueryData(queryKeys.dinosaurList(), { dinosaurs: [dinosaur], total: 1 });
  client.setQueryData(queryKeys.parkOperations(), {});
  const previewKey = [...queryKeys.exhibitPlacementPreviews, 'park', 'estimate'];
  client.setQueryData(previewKey, {});
  let finish!: (value: DinosaurResponse) => void;
  const pending = new Promise<DinosaurResponse>((resolve) => {
    finish = resolve;
  });
  const post = vi
    .spyOn(api, 'post')
    .mockRejectedValueOnce(new Error())
    .mockReturnValueOnce(pending);
  useUIStore.getState().openModal('dinosaur_detail', { dinosaurId: dinosaur.id });
  render(
    <QueryClientProvider client={client}>
      <ParkDinosaurDetails />
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: '배치 대기로' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('다시 시도해주세요');
  expect(screen.getByText('배치 위치 (3, 4)')).toBeVisible();
  expect(client.getQueryData(queryKeys.dinosaurList())).toEqual({
    dinosaurs: [dinosaur],
    total: 1,
  });

  fireEvent.click(screen.getByRole('button', { name: '배치 대기로' }));
  expect(await screen.findByRole('button', { name: '이동 중…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '위치 옮기기' })).toBeDisabled();
  const waiting = { ...dinosaur, isInPark: false };
  await act(async () => finish(waiting));

  expect(await screen.findByText('배치 대기')).toBeVisible();
  expect(screen.getByRole('button', { name: '배치하기' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: '배치 대기로' })).not.toBeInTheDocument();
  expect(post).toHaveBeenNthCalledWith(2, '/dinosaurs/rex-1/remove');
  expect(client.getQueryData(queryKeys.dinosaurDetail(dinosaur.id))).toEqual(waiting);
  expect(client.getQueryData(queryKeys.dinosaurList())).toEqual({ dinosaurs: [waiting], total: 1 });
  expect(client.getQueryState(queryKeys.parkOperations())?.isInvalidated).toBe(true);
  expect(client.getQueryState(previewKey)?.isInvalidated).toBe(true);
  client.clear();
});

it('starts the quoted habitat upgrade and shows its new fence only after completion', async () => {
  vi.spyOn(tokenManager, 'isAuthenticated').mockReturnValue(false);
  const client = new QueryClient();
  const habitat: BuildingResponse = {
    id: 'carnivore',
    typeId: 'habitat-carnivore',
    level: 4,
    positionX: 3,
    positionY: 4,
    status: BuildingStatus.ACTIVE,
    assignedGreatFigureId: null,
  };
  const quote = getGenericBuildingUpgradeQuote(habitat.typeId, 5);
  const upgrading: BuildingResponse = {
    ...habitat,
    level: 5,
    status: BuildingStatus.UPGRADING,
    completesAt: new Date(Date.now() + quote.seconds * 1000).toISOString(),
  };
  const completed = { ...upgrading, status: BuildingStatus.ACTIVE, completesAt: null };
  const post = vi
    .spyOn(api, 'post')
    .mockRejectedValueOnce(new Error('진행 중인 공사를 먼저 마쳐주세요.'))
    .mockResolvedValueOnce(upgrading);
  client.setQueryData(queryKeys.currency(), { gold: quote.gold });
  useUIStore.getState().openModal('building_detail', { buildingId: habitat.id });
  const pane = (building: BuildingResponse) => (
    <QueryClientProvider client={client}>
      <ParkPanel dinosaurs={[]} buildings={[building]} onShowResources={() => {}} />
    </QueryClientProvider>
  );
  const { container, rerender } = render(pane(habitat));
  const art = () => container.querySelector('img');
  expect(art()).toHaveAttribute('src', '/assets/buildings/habitat-carnivore-electric.webp');
  expect(screen.getByText(`${quote.gold.toLocaleString('ko-KR')}골드`)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Lv.5 강화' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('공사를 먼저 마쳐주세요');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Lv.5 강화' })));
  expect(post).toHaveBeenNthCalledWith(2, '/buildings/carnivore/upgrade', { targetLevel: 5 });

  rerender(pane(upgrading));
  expect(art()).toHaveAttribute('src', '/assets/buildings/habitat-carnivore-electric.webp');
  expect(screen.getByText('Lv.4', { exact: true })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Lv.5 강화' })).not.toBeInTheDocument();

  act(() => {
    useUIStore.getState().closeModal();
    useUIStore.getState().openSidePanel('building_list');
  });
  expect(art()).toHaveAttribute('src', '/assets/buildings/habitat-carnivore-electric.webp');
  rerender(pane(completed));
  expect(art()).toHaveAttribute('src', '/assets/buildings/habitat-carnivore-lv5.webp');

  act(() => {
    useUIStore.getState().closeSidePanel();
    useUIStore.getState().openModal('building_detail', { buildingId: habitat.id });
  });
  expect(art()).toHaveAttribute('src', '/assets/buildings/habitat-carnivore-lv5.webp');
  expect(screen.getByRole('button', { name: 'Lv.6 강화' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '시설 옮기기' })).toBeEnabled();
  client.clear();
});

it('claims a ready fuel batch at the depot once the tank has room', async () => {
  vi.spyOn(tokenManager, 'isAuthenticated').mockReturnValue(false);
  const client = new QueryClient();
  const depot: BuildingResponse = {
    id: 'depot',
    typeId: FUEL_DEPOT_TYPE_ID,
    level: 1,
    positionX: 3,
    positionY: 4,
    status: BuildingStatus.ACTIVE,
    assignedGreatFigureId: null,
  };
  const base: ResourcesResponse = {
    gold: 5000,
    parkLevel: 2,
    capacityPerMaterial: 100,
    fuel: { amount: 30, capacity: 30, nextRechargeAt: null },
    inventory: [],
    platformUpgrade: null,
    facilities: [
      {
        typeId: FUEL_DEPOT_TYPE_ID,
        name: '탐험 연료 보급소',
        unlockLevel: 2,
        cost: 1000,
        constructionSeconds: 60,
        building: { id: depot.id, status: depot.status, completesAt: null },
        recipe: {
          material: 'fuel',
          batchQuantity: 5,
          batchCost: 300,
          batchSeconds: 600,
          maxLots: 3,
        },
        job: {
          id: 'fuel-job',
          lots: 1,
          quantity: 5,
          ready: true,
          readyAt: new Date().toISOString(),
          claimBlocked: true,
        },
      },
    ],
  };
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    ...base,
    facilities: [{ ...base.facilities[0], job: null }],
  });
  useUIStore.getState().openModal('building_detail', { buildingId: depot.id });
  const pane = (resources: ResourcesResponse) => (
    <QueryClientProvider client={client}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ParkPanel
          dinosaurs={[]}
          buildings={[depot]}
          resources={resources}
          onShowResources={() => {}}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
  const { rerender } = render(pane(base));
  expect(screen.getByRole('button', { name: '연료 5개 수령' })).toBeDisabled();
  expect(screen.getByText('탐험에서 연료를 쓴 뒤 수령하세요.')).toBeVisible();
  expect(screen.getByRole('link', { name: '탐험으로' })).toHaveAttribute('href', '/exploration');
  expect(post).not.toHaveBeenCalled();

  rerender(
    pane({
      ...base,
      fuel: { ...base.fuel, amount: 25 },
      facilities: [
        { ...base.facilities[0], job: { ...base.facilities[0].job!, claimBlocked: false } },
      ],
    }),
  );
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '연료 5개 수령' })));
  expect(post).toHaveBeenCalledWith('/resources/production/fuel-job/claim');
  expect(screen.getByRole('status', { name: '연료 5개 획득' })).toHaveTextContent('+5');
  expect(useUIStore.getState().toasts).toEqual([]);
  client.clear();
});
