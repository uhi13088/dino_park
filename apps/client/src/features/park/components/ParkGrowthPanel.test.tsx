import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ParkEarlyGrowthResponse } from '@dino-park/shared';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ParkGrowthPanel from './ParkGrowthPanel';

const mocks = vi.hoisted(() => ({
  state: undefined as ParkEarlyGrowthResponse | undefined,
  mutate: vi.fn(),
}));

vi.mock('@/api/queries/parkGrowth', () => ({
  useParkGrowth: () => ({ data: mocks.state, isPending: false, error: null }),
  useParkGrowthAction: () => ({ mutate: mocks.mutate, isPending: false, error: null }),
}));

function data(): ParkEarlyGrowthResponse {
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

function panel(
  onClose = vi.fn(),
  onShowResources = vi.fn(),
  onPrepareLab = vi.fn(),
  options: Pick<
    Partial<ComponentProps<typeof ParkGrowthPanel>>,
    'stage' | 'onStageChange' | 'onShowFacilities' | 'onShowExhibits' | 'canRepeatSynthesis'
  > = {},
) {
  return (
    <MemoryRouter>
      <ParkGrowthPanel
        isParkOpen
        onClose={onClose}
        onShowFacilities={vi.fn()}
        onShowExhibits={vi.fn()}
        onShowResources={onShowResources}
        onPrepareLab={onPrepareLab}
        {...options}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.state = data();
  mocks.mutate.mockReset();
});

describe('operation and exploration routes', () => {
  function routesState(stage: 6 | 7): ParkEarlyGrowthResponse {
    const earlier = data();
    return {
      ...earlier,
      stage,
      level: stage,
      targetLevel: stage === 6 ? 7 : 8,
      expForNextLevel: stage === 6 ? 5031 : 6640,
      goals:
        stage === 6
          ? [{ id: 'research', status: 'claimed', xp: 1257, progress: 1, target: 1 }]
          : [],
      routes: {
        rewardXp: stage === 6 ? 3774 : 6640,
        claimedRoute: null,
        operations: {
          status: 'incomplete',
          exhibits: stage === 6 ? 2 : 3,
          targetExhibits: stage === 6 ? 3 : 4,
          visitors: stage === 6 ? 44 : 64,
          targetVisitors: stage === 6 ? 50 : 70,
          achieved: false,
        },
        exploration: {
          status: 'incomplete',
          completedMissions: ['dna2'],
          researchCompleted: false,
        },
      },
    };
  }

  it('shows alternative requirements and claims the completed route at Lv.6 once research is received', () => {
    const state = routesState(6);
    state.routes!.operations.status = 'claimable';
    state.routes!.exploration.status = 'claimable';
    state.goals[0].status = 'claimable';
    mocks.state = state;
    const manage = vi.fn();
    const view = panel(vi.fn(), vi.fn(), vi.fn(), { stage: 6, onShowExhibits: manage });
    const { rerender } = render(view);
    expect(screen.getByRole('article', { name: '공통 연구' })).toBeVisible();
    const operations = within(screen.getByRole('article', { name: '운영 경로' }));
    expect(operations.getByText('2 / 3곳')).toBeVisible();
    expect(operations.getByText('44 / 50명')).toBeVisible();
    expect(operations.queryByRole('button', { name: /3,774 XP/ })).not.toBeInTheDocument();
    fireEvent.click(operations.getByRole('button', { name: '전시 구역 관리' }));
    expect(manage).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: '화석 계곡 DNA 조사 2' })).toHaveAttribute(
      'href',
      '/exploration?mission=dna2&stage=6',
    );
    expect(
      screen.getByRole('link', { name: '화석 계곡 DNA 조사 2' }).nextElementSibling,
    ).toHaveTextContent('수령 완료');
    expect(
      screen.getByRole('link', { name: '화석 계곡 DNA 조사 1' }).nextElementSibling,
    ).toBeNull();
    expect(screen.getByRole('link', { name: '원시 습지 배양 시료' })).toHaveAttribute(
      'href',
      '/exploration?mission=culture&stage=6',
    );

    state.goals[0].status = 'claimed';
    rerender(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 6, onShowExhibits: manage }));
    expect(operations.getByRole('button', { name: '운영 성과 3,774 XP 받기' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '탐험 성과 3,774 XP 받기' }));
    expect(mocks.mutate).toHaveBeenLastCalledWith(
      { kind: 'claim-route', routeId: 'exploration', stage: 6 },
      expect.any(Object),
    );
    state.routes!.claimedRoute = 'exploration';
    rerender(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 6, onShowExhibits: manage }));
    expect(screen.queryByRole('button', { name: /3,774 XP/ })).not.toBeInTheDocument();
    expect(operations.getByRole('button', { name: '전시 구역 관리' })).toBeEnabled();
  });

  it('starts mapping inside the Lv.7 exploration route and exposes the survey on completion', () => {
    const state = routesState(7);
    mocks.state = state;
    const { rerender } = render(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 7 }));
    const exploration = within(screen.getByRole('article', { name: '탐험 경로' }));
    expect(exploration.getByText('현장 지도화 Lv.1')).toBeVisible();
    expect(exploration.queryByRole('link', { name: '화석 계곡 재조사' })).not.toBeInTheDocument();
    expect(exploration.getByRole('link', { name: '버려진 연구소 촉매 회수' })).toHaveAttribute(
      'href',
      '/exploration?mission=catalyst&stage=7',
    );
    fireEvent.click(exploration.getByRole('button', { name: '연구 시작' }));
    expect(mocks.mutate).toHaveBeenLastCalledWith(
      { kind: 'start-research', stage: 7 },
      expect.any(Object),
    );
    state.research.status = 'completed';
    state.routes!.exploration.researchCompleted = true;
    state.routes!.operations.status = 'claimable';
    rerender(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 7 }));
    expect(exploration.getByRole('link', { name: '화석 계곡 재조사' })).toHaveAttribute(
      'href',
      '/exploration?mission=repeat-rim-survey&stage=7',
    );
    fireEvent.click(screen.getByRole('button', { name: '운영 성과 6,640 XP 받기' }));
    expect(mocks.mutate).toHaveBeenLastCalledWith(
      { kind: 'claim-route', routeId: 'operations', stage: 7 },
      expect.any(Object),
    );
  });
});

describe('park level 6 growth goals', () => {
  function levelSevenData(): ParkEarlyGrowthResponse {
    const before = data();
    return {
      ...before,
      stage: 6,
      level: 6,
      exp: 0,
      expForNextLevel: 5031,
      targetLevel: 7,
      goals: [
        { id: 'facility', status: 'incomplete', xp: 1257, progress: 0, target: 1 },
        { id: 'research', status: 'incomplete', xp: 1257, progress: 0, target: 1 },
        { id: 'field', status: 'incomplete', xp: 1257, progress: 0, target: 1 },
        { id: 'operation', status: 'claimable', xp: 1260, progress: 400, target: 400 },
      ],
      research: { ...before.research, entranceBonusPercent: 0, careDecayReductionPercent: 2 },
    };
  }

  it('opens the next stage from Lv.6 and can return to the earlier goals', () => {
    mocks.state = { ...data(), level: 6, exp: 0 };
    const onStageChange = vi.fn();
    const { rerender } = render(panel(vi.fn(), vi.fn(), vi.fn(), { onStageChange }));
    fireEvent.click(screen.getByRole('button', { name: 'Lv.7 성장 목표' }));
    expect(onStageChange).toHaveBeenCalledWith(6);

    mocks.state = levelSevenData();
    rerender(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 6, onStageChange }));
    expect(screen.getByRole('heading', { name: '파크 Lv.6 → Lv.7' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Lv.6 성장 목표' }));
    expect(onStageChange).toHaveBeenCalledWith(5);
  });

  it('shows the new targets and sends claims and research to stage 6', () => {
    mocks.state = levelSevenData();
    const onShowFacilities = vi.fn();
    render(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 6, onShowFacilities }));

    const facility = within(screen.getByRole('article', { name: '시설 준비' }));
    expect(facility.getByText('관람대 Lv.2 완공')).toBeVisible();
    fireEvent.click(facility.getByRole('button', { name: '관람대 확인' }));
    expect(onShowFacilities).toHaveBeenCalledOnce();

    const research = within(screen.getByRole('article', { name: '연구 적용' }));
    expect(research.getByText('환경 적응 Lv.1 완료')).toBeVisible();
    expect(research.getByText(/허기 증가 속도 2% 완화/)).toBeVisible();
    fireEvent.click(research.getByRole('button', { name: '연구 시작' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'start-research', stage: 6 },
      expect.any(Object),
    );

    expect(screen.getByRole('link', { name: '화석 계곡으로 가기' })).toHaveAttribute(
      'href',
      '/exploration?mission=basic-dna',
    );
    const operation = within(screen.getByRole('article', { name: '운영 실적' }));
    expect(operation.getByText('누적 유료 입장객 400 / 400명')).toBeVisible();
    fireEvent.click(operation.getByRole('button', { name: '1,260 XP 받기' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'claim', goalId: 'operation', stage: 6 },
      expect.any(Object),
    );
  });

  it('keeps earned rewards claimable at Lv.7 and distinguishes a busy researcher from missing resources', () => {
    const state = levelSevenData();
    state.level = 7;
    state.research.blockedByResearch = true;
    state.research.unavailableReason = '다른 연구를 마친 뒤에 시작할 수 있어요.';
    mocks.state = state;
    render(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 6 }));

    expect(screen.getByRole('heading', { name: '파크 Lv.7 달성!' })).toBeVisible();
    expect(screen.getByRole('button', { name: '1,260 XP 받기' })).toBeEnabled();
    expect(screen.getByText('다른 연구를 마친 뒤에 시작할 수 있어요.')).toBeVisible();
    expect(screen.queryByRole('button', { name: '자원 시설 보기' })).not.toBeInTheDocument();
  });
});

describe('park level 7 growth goals', () => {
  function levelEightData(): ParkEarlyGrowthResponse {
    const earlier = data();
    return {
      ...earlier,
      level: 7,
      stage: 7,
      exp: 0,
      expForNextLevel: 6640,
      targetLevel: 8,
      goals: earlier.goals.map((goal) => ({
        ...goal,
        xp: 1660,
        ...(goal.id === 'operation'
          ? { target: 900, progress: 900, status: 'claimable' as const }
          : { progress: 0, status: 'incomplete' as const }),
      })),
      research: {
        ...earlier.research,
        costs: { gold: 400, wood: 5, stone: 5 },
        entranceBonusPercent: 0,
      },
    };
  }

  it('offers both stage directions from the earned Lv.7 panel', () => {
    mocks.state = { ...levelEightData(), stage: 6, targetLevel: 7 };
    const onStageChange = vi.fn();
    render(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 6, onStageChange }));
    fireEvent.click(screen.getByRole('button', { name: 'Lv.6 성장 목표' }));
    expect(onStageChange).toHaveBeenLastCalledWith(5);
    const next = within(screen.getByRole('region', { name: 'Lv.7 달성 후 이어 할 일' }));
    expect(next.getByText(/화석 계곡의 새 조사 구간/)).toBeVisible();
    expect(next.getByText(/네 번째 전시/)).toBeVisible();
    fireEvent.click(next.getByRole('button', { name: 'Lv.8 성장 목표' }));
    expect(onStageChange).toHaveBeenLastCalledWith(7);
  });

  it('offers existing activities after Lv.8 and links to repeat synthesis only after the first exhibition', () => {
    const state = { ...levelEightData(), level: 8, goals: [] };
    mocks.state = state;
    const onShowExhibits = vi.fn();
    const onClose = vi.fn();
    const options = { stage: 7 as const, onShowExhibits, canRepeatSynthesis: true };
    const view = render(panel(onClose, vi.fn(), vi.fn(), options));

    expect(screen.getByRole('heading', { name: '파크 Lv.8 달성!' })).toHaveFocus();
    const next = within(screen.getByRole('region', { name: 'Lv.8 달성 후 이어 할 일' }));
    fireEvent.click(next.getByRole('button', { name: '전시 구역 관리' }));
    expect(onShowExhibits).toHaveBeenCalledOnce();
    const repeat = next.getByRole('link', { name: '반복 합성 보러 가기' });
    expect(repeat).toHaveAttribute('href', '/exploration?tab=repeat');
    fireEvent.click(repeat);
    expect(onClose).toHaveBeenCalledOnce();

    view.rerender(panel(onClose, vi.fn(), vi.fn(), { ...options, canRepeatSynthesis: false }));
    expect(next.queryByRole('link', { name: '반복 합성 보러 가기' })).not.toBeInTheDocument();
  });

  it('links the actual new facility, research and survey to the 900-visitor stage', () => {
    mocks.state = levelEightData();
    const onShowFacilities = vi.fn();
    render(panel(vi.fn(), vi.fn(), vi.fn(), { stage: 7, onShowFacilities }));

    expect(screen.getByRole('heading', { name: '파크 Lv.7 → Lv.8' })).toBeVisible();
    const facility = within(screen.getByRole('article', { name: '시설 준비' }));
    expect(facility.getByText('보안센터 Lv.2 완공')).toBeVisible();
    fireEvent.click(facility.getByRole('button', { name: '보안센터 확인' }));
    expect(onShowFacilities).toHaveBeenCalledOnce();

    const research = within(screen.getByRole('article', { name: '연구 적용' }));
    expect(research.getByText('현장 지도화 Lv.1 완료')).toBeVisible();
    fireEvent.click(research.getByRole('button', { name: '연구 시작' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'start-research', stage: 7 },
      expect.any(Object),
    );
    expect(screen.getByRole('link', { name: '화석 계곡 재조사로 가기' })).toHaveAttribute(
      'href',
      '/exploration?mission=repeat-rim-survey',
    );
    const operation = within(screen.getByRole('article', { name: '운영 실적' }));
    expect(operation.getByText('누적 유료 입장객 900 / 900명')).toBeVisible();
    fireEvent.click(operation.getByRole('button', { name: '1,660 XP 받기' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { kind: 'claim', goalId: 'operation', stage: 7 },
      expect.any(Object),
    );
  });
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
      '/exploration?mission=basic-catalyst',
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
    expect(screen.getByRole('heading', { name: '파크 Lv.6 달성!' })).toHaveFocus();
    const next = within(screen.getByRole('region', { name: 'Lv.6 달성 후 이어 할 일' }));
    expect(next.getByText(/다음 합성에 쓸 중급 재료/)).toBeVisible();
    expect(screen.getAllByText('보상 받음')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: '897 XP 받기' })).not.toBeInTheDocument();
  });
});
