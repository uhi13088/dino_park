import { fireEvent, render, screen } from '@testing-library/react';
import { BuildingStatus } from '@dino-park/shared';
import { beforeEach, expect, it, vi } from 'vitest';
import SecurityCenterPanel from './SecurityCenterPanel';

const mutations = vi.hoisted(() => ({ upgrade: vi.fn(), complete: vi.fn() }));

vi.mock('@/api', () => ({
  useUpgradeBuilding: () => ({ mutate: mutations.upgrade, isPending: false }),
  useCompleteBuilding: () => ({ mutate: mutations.complete, isPending: false }),
}));

vi.mock('@/api/queries/resources', () => ({
  useResources: () => ({
    data: {
      gold: 6000,
      inventory: [
        { material: 'wood', amount: 20 },
        { material: 'stone', amount: 40 },
      ],
    },
  }),
}));

const center = {
  id: 'center-1',
  typeId: 'operation-security-center',
  level: 1,
  positionX: 2,
  positionY: 3,
  status: BuildingStatus.ACTIVE,
  assignedGreatFigureId: null,
};

beforeEach(() => vi.clearAllMocks());

it('shows the authoritative upgrade costs and requests the specific level', () => {
  render(<SecurityCenterPanel building={center} onShowResources={vi.fn()} />);
  expect(screen.getByText('6,000골드 · 목재 20개 · 석재 40개 · 2분 30초')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '보안센터 Lv.2 강화' }));
  expect(mutations.upgrade).toHaveBeenCalledWith({ id: center.id, targetLevel: 2 });
});

it('keeps the completed level effective during construction and permits confirmation after the deadline', () => {
  const inProgress = { ...center, level: 2, status: BuildingStatus.UPGRADING };
  const onReturnToGrowth = vi.fn();
  const { rerender } = render(
    <SecurityCenterPanel
      building={{ ...inProgress, completesAt: new Date(Date.now() + 150000).toISOString() }}
      onShowResources={vi.fn()}
      onReturnToGrowth={onReturnToGrowth}
    />,
  );
  expect(screen.getByText('위험 수용량 3점 · 유지비 80골드/시간')).toBeVisible();
  expect(screen.getByRole('button', { name: '완공 확인' })).toBeDisabled();
  rerender(
    <SecurityCenterPanel
      building={{ ...inProgress, completesAt: new Date(Date.now() - 1000).toISOString() }}
      onShowResources={vi.fn()}
      onReturnToGrowth={onReturnToGrowth}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '완공 확인' }));
  expect(mutations.complete).toHaveBeenCalledWith(center.id);
  fireEvent.click(screen.getByRole('button', { name: '성장 목표로 돌아가기' }));
  expect(onReturnToGrowth).toHaveBeenCalledOnce();
});
