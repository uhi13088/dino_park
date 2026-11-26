import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParkMidgameGrowthResponse, ParkMidgameGrowthStage } from '@dino-park/shared';
import ParkMidgameGrowthPanel from './ParkMidgameGrowthPanel';

const mocks = vi.hoisted(() => ({
  state: undefined as ParkMidgameGrowthResponse | undefined,
  mutate: vi.fn(),
  eggs: [] as Array<{ speciesId: string }>,
}));

vi.mock('@/api', () => ({
  useHatchingQueue: () => ({ data: { queue: mocks.eggs } }),
}));
vi.mock('@/api/queries/parkGrowth', () => ({
  useParkGrowth: () => ({ data: mocks.state, isPending: false, error: null }),
  useParkGrowthAction: () => ({ mutate: mocks.mutate, isPending: false, error: null }),
}));

function setup(stage: ParkMidgameGrowthStage) {
  const onShowOperations = vi.fn();
  const onStageChange = vi.fn();
  render(
    <MemoryRouter>
      <ParkMidgameGrowthPanel
        stage={stage}
        onStageChange={onStageChange}
        onClose={vi.fn()}
        onManageBuilding={vi.fn()}
        onShowOperations={onShowOperations}
      />
    </MemoryRouter>,
  );
  return { onShowOperations, onStageChange };
}

beforeEach(() => {
  mocks.mutate.mockReset();
  mocks.eggs = [];
  mocks.state = {
    stage: 8,
    unlocked: true,
    level: 8,
    exp: 0,
    expForNextLevel: 8000,
    targetLevel: 9,
    goals: [
      {
        id: 'facility',
        status: 'incomplete',
        xp: 1600,
        progress: 0,
        target: 1,
        alternatives: [
          {
            kind: 'building',
            typeId: 'research-dna-lab',
            name: 'DNA 연구소',
            level: 4,
            label: 'DNA 연구소 Lv.4',
            status: 'incomplete',
          },
          {
            kind: 'building',
            typeId: 'production-feed-factory',
            name: '사료 공장',
            level: 2,
            label: '사료 공장 Lv.2',
            status: 'unavailable',
          },
        ],
      },
      {
        id: 'research',
        status: 'incomplete',
        xp: 1600,
        progress: 0,
        target: 1,
        alternatives: [
          {
            kind: 'research',
            technologyId: 'exp-field-mapping',
            level: 1,
            label: '현장 지도화 Lv.1',
            status: 'incomplete',
          },
        ],
      },
      {
        id: 'field',
        status: 'claimable',
        xp: 2400,
        progress: 1,
        target: 1,
        alternatives: [
          {
            kind: 'dispatch',
            missionId: 'repeat-rim-survey',
            reward: 'material',
            label: '화석 계곡 조사',
            status: 'complete',
          },
        ],
      },
      {
        id: 'operation',
        status: 'incomplete',
        xp: 2400,
        progress: 900,
        target: 1500,
        alternatives: [
          { kind: 'paid', amount: 1500, label: '누적 유료 입장객 1,500명', status: 'incomplete' },
        ],
      },
    ],
  };
});

describe('midgame growth', () => {
  it('links the exact lab and technology, shows receipt progress and claims the intended level', () => {
    const { onShowOperations } = setup(8);
    const facility = screen.getByRole('article', { name: '시설 준비' });
    expect(within(facility).getByRole('link', { name: '시설 관리' })).toHaveAttribute(
      'href',
      '/research?stage=8&from=growth&facility=research-dna-lab&level=4',
    );
    expect(within(facility).getByText('준비 중')).toBeVisible();
    expect(within(facility).getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '연구 보기' })).toHaveAttribute(
      'href',
      '/research?stage=8&from=growth&technology=exp-field-mapping&level=1',
    );
    expect(screen.getByText('900 / 1,500명')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '입장 운영 보기' }));
    expect(onShowOperations).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: '2,400 XP 받기' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'claim', goalId: 'field', stage: 8 },
      expect.anything(),
    );
  });

  it('sends a known stock egg directly to its hatching row', () => {
    if (!mocks.state) throw new Error('missing growth fixture');
    mocks.state = {
      ...mocks.state,
      stage: 10,
      targetLevel: 11,
      level: 10,
      goals: [
        {
          id: 'field',
          status: 'incomplete',
          xp: 1000,
          progress: 0,
          target: 1,
          alternatives: [
            {
              kind: 'owned',
              speciesId: 'gallimimus',
              label: '갈리미무스 보유',
              status: 'incomplete',
            },
          ],
        },
      ],
    };
    mocks.eggs = [{ speciesId: 'gallimimus' }];
    setup(10);
    expect(screen.getByRole('link', { name: '알 부화 보기' })).toHaveAttribute(
      'href',
      '/exploration?stage=10&from=growth&hatch=gallimimus',
    );
  });

  it('takes the Lv.15 player to chapter 4 and keeps earlier stages available', () => {
    if (!mocks.state) throw new Error('missing growth fixture');
    mocks.state = { ...mocks.state, stage: 14, level: 15, targetLevel: 15, goals: [] };
    const { onStageChange } = setup(14);
    expect(screen.getByRole('heading', { name: '파크 Lv.15 달성!' })).toBeVisible();
    expect(screen.getByRole('link', { name: '4장 심연의 비밀' })).toHaveAttribute(
      'href',
      '/story?chapter=chapter-4&stage=14&from=growth',
    );
    expect(screen.queryByText('Lv.16 성장 목표')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: '성장 목표 단계' }), {
      target: { value: '8' },
    });
    expect(onStageChange).toHaveBeenCalledWith(8);
  });
});
