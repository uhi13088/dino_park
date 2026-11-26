import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  DinosaurResponse,
  ParkOperationsResponse,
  FirstExpeditionStateResponse,
} from '@dino-park/shared';
import { BuildingStatus } from '@dino-park/shared';
import ParkOperationsPanel from './ParkOperationsPanel';
import ParkExhibitManagement from './ParkExhibitManagement';

const dinosaur: DinosaurResponse = {
  id: 'para',
  speciesId: 'parasaurolophus',
  nickname: '파라',
  level: 1,
  exp: 0,
  happiness: 95,
  hunger: 0,
  intimacy: 10,
  positionX: 9,
  positionY: 9,
  isInPark: true,
};
const operations: ParkOperationsResponse = {
  isOpen: false,
  canOpen: true,
  openingRequirements: [],
  ticketPrice: 20,
  visitorsPerMinute: 12,
  demandPerMinute: 19.5,
  capacity: 12,
  totalVisitors: 0,
  totalAdmissionGold: 0,
  hourlyMaintenance: 95,
  gold: 10000,
  parkLevel: 1,
  firstVisitorsGoal: { current: 0, target: 10, rewarded: false },
  pathTiles: [],
  entrance: { id: 'gate', x: 11, y: 16, width: 4, height: 4, onBoundary: true },
  suggestedEntrance: { x: 11, y: 16 },
  viewingPlatform: null,
};
function props(overrides: Partial<ParkOperationsResponse> = {}) {
  return {
    operations: { ...operations, ...overrides },
    dinosaurs: [dinosaur],
    busy: false,
    onOpenChange: vi.fn(),
    onPlaceDinosaur: vi.fn(),
    onCareDinosaur: vi.fn(),
    onMoveEntrance: vi.fn(),
    onBuildPlatform: vi.fn(),
    onCompletePlatform: vi.fn(),
    onShowBuildings: vi.fn(),
  };
}
const activePlatform: NonNullable<ParkOperationsResponse['viewingPlatform']> = {
  id: 'platform',
  level: 2,
  status: 'ACTIVE',
  completesAt: null,
};
const admission: NonNullable<ParkOperationsResponse['admission']> = {
  gatePerMinute: 20,
  exhibitPerMinute: 22,
  exhibitCount: 2,
  bottlenecks: ['demand', 'entrance'],
  entranceResearchCompleted: false,
  exhibitedDinosaurIds: [dinosaur.id],
  exhibits: [],
  platformImpact: {
    buildingId: activePlatform.id,
    fromLevel: 2,
    toLevel: 3,
    exhibitId: 'grassland',
    before: { crowdingPercent: 20, satisfactionPercent: 79 },
    after: { crowdingPercent: 0, satisfactionPercent: 90 },
  },
};
afterEach(() => vi.useRealTimers());

describe('first park operation goals', () => {
  it('routes an unplaced starter to placement and prevents opening before readiness', () => {
    const callbacks = props({ canOpen: false, openingRequirements: ['공룡을 배치해주세요.'] });
    callbacks.dinosaurs = [{ ...dinosaur, isInPark: false }];
    render(<ParkOperationsPanel {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: '공룡 배치하기' }));
    expect(callbacks.onPlaceDinosaur).toHaveBeenCalledWith(callbacks.dinosaurs[0]);
    expect(screen.getByRole('button', { name: '파크 개장' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '관람대 짓기' })).not.toBeInTheDocument();
  });

  it('offers a free entrance move for an existing interior gate', () => {
    const callbacks = props({
      canOpen: false,
      entrance: { ...operations.entrance!, onBoundary: false },
    });
    render(<ParkOperationsPanel {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: '입구 옮기기 · 무료' }));
    expect(callbacks.onMoveEntrance).toHaveBeenCalledOnce();
    expect(callbacks.onOpenChange).not.toHaveBeenCalled();
  });

  it('explains how to retry when an older park has no space for its entrance', () => {
    const callbacks = props({ canOpen: false, entrance: null });
    const onRecoverEntrance = vi.fn();
    render(<ParkOperationsPanel {...callbacks} onRecoverEntrance={onRecoverEntrance} />);
    expect(
      screen.getByText('입구를 복구하려면 파크 테두리에 빈 공간이 필요해요.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '입구 다시 찾기 · 무료' }));
    expect(onRecoverEntrance).toHaveBeenCalledOnce();
    expect(callbacks.onMoveEntrance).not.toHaveBeenCalled();
  });

  it('prioritizes the interior entrance when a previously cared-for dinosaur is already full', () => {
    const callbacks = props({
      canOpen: false,
      entrance: { ...operations.entrance!, onBoundary: false },
    });
    callbacks.dinosaurs = [{ ...dinosaur, happiness: 40, hunger: 0, intimacy: 5 }];
    render(<ParkOperationsPanel {...callbacks} />);
    expect(screen.getByRole('button', { name: '입구 옮기기 · 무료' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '공룡 돌보기' })).not.toBeInTheDocument();
  });

  it('waits for actual paid visitors and enough gold before offering construction', () => {
    const callbacks = props({
      isOpen: true,
      totalVisitors: 9,
      totalAdmissionGold: 180,
      firstVisitorsGoal: { current: 9, target: 10, rewarded: false },
    });
    const { rerender } = render(<ParkOperationsPanel {...callbacks} />);
    expect(screen.getByText('첫 손님 맞이 · 9/10명')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관람대 짓기' })).not.toBeInTheDocument();
    const unlocked = {
      ...callbacks.operations,
      gold: 1499,
      parkLevel: 2,
      firstVisitorsGoal: { current: 10, target: 10, rewarded: true },
    };
    rerender(<ParkOperationsPanel {...callbacks} operations={unlocked} />);
    expect(screen.getByRole('button', { name: '관람대 짓기' })).toBeDisabled();
    rerender(<ParkOperationsPanel {...callbacks} operations={{ ...unlocked, gold: 1500 }} />);
    fireEvent.click(screen.getByRole('button', { name: '관람대 짓기' }));
    expect(callbacks.onBuildPlatform).toHaveBeenCalledOnce();
  });

  it('does not force a waiting reserve dinosaur into the park before building', () => {
    const callbacks = props({ firstVisitorsGoal: { current: 10, target: 10, rewarded: true } });
    callbacks.dinosaurs.push({ ...dinosaur, id: 'reserve', isInPark: false });
    render(<ParkOperationsPanel {...callbacks} />);
    expect(screen.getByRole('button', { name: '관람대 짓기' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '공룡 배치하기' })).not.toBeInTheDocument();
  });

  it('keeps completion disabled until the construction deadline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
    const callbacks = props({
      viewingPlatform: {
        id: 'platform',
        level: 1,
        status: 'CONSTRUCTING',
        completesAt: '2026-11-16T12:00:30Z',
      },
    });
    render(<ParkOperationsPanel {...callbacks} />);
    expect(screen.getByRole('button', { name: '완공 확인' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(30000));
    // Timers update the countdown, never award or charge anything locally.
    expect(callbacks.onCompletePlatform).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '완공 확인' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '완공 확인' }));
    expect(callbacks.onCompletePlatform).toHaveBeenCalledWith('platform');
  });

  it('shows a local viewing improvement after the first platform completes', () => {
    const callbacks = props({
      capacity: 32,
      viewingPlatform: { id: 'platform', level: 1, status: 'ACTIVE', completesAt: null },
    });
    render(<ParkOperationsPanel {...callbacks} />);
    expect(screen.getByText('첫 관람대가 완공됐어요')).toBeInTheDocument();
    expect(screen.getByText(/가까운 전시에서 손님들이 편하게/)).toBeInTheDocument();
    expect(screen.getByText(/파크 입장 한도 32명\/분/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관람대 짓기' })).not.toBeInTheDocument();
  });
  it('continues from the first platform to the first scout dispatch', () => {
    const onExplore = vi.fn();
    const first: FirstExpeditionStateResponse = {
      stage: 'available',
      tutorialStep: 5,
      unlocked: true,
      requirements: [],
      gold: 8400,
      mission: null,
      egg: null,
      dinosaur: null,
      hatchingSlots: { used: 0, total: 1 },
      reusedExisting: false,
    };
    render(
      <ParkOperationsPanel
        {...props({
          viewingPlatform: { id: 'platform', level: 1, status: 'ACTIVE', completesAt: null },
        })}
        firstExpedition={first}
        onExplore={onExplore}
      />,
    );
    expect(screen.getByText(/탐험가를 고용해 파크 뒤 초원에 보내요/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '첫 탐험가 파견' }));
    expect(onExplore).toHaveBeenCalledOnce();
  });

  it('suggests basic production during hatching without automatically claiming the baby', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
    const onClaimHatch = vi.fn(),
      onShowResources = vi.fn();
    const first: FirstExpeditionStateResponse = {
      stage: 'hatching',
      tutorialStep: 8,
      unlocked: true,
      requirements: [],
      gold: 8000,
      mission: null,
      egg: {
        id: 'egg',
        speciesId: 'iguanodon',
        status: 'hatching',
        completesAt: '2026-11-16T12:01:00Z',
        remainingSeconds: 60,
        dinosaurId: null,
      },
      dinosaur: null,
      hatchingSlots: { used: 1, total: 1 },
      reusedExisting: false,
    };
    render(
      <ParkOperationsPanel
        {...props({
          viewingPlatform: { id: 'platform', level: 1, status: 'ACTIVE', completesAt: null },
        })}
        firstExpedition={first}
        onClaimHatch={onClaimHatch}
        onShowResources={onShowResources}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '자원 시설 보기' }));
    expect(onShowResources).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(60000));
    expect(onClaimHatch).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '이구아노돈 만나기' })).not.toBeInTheDocument();
  });

  it('places the healthy new dinosaur without a forced extra feeding', () => {
    const callbacks = props({
      viewingPlatform: { id: 'platform', level: 1, status: 'ACTIVE', completesAt: null },
    });
    const baby = {
      ...dinosaur,
      id: 'igua',
      speciesId: 'iguanodon',
      happiness: 100,
      hunger: 0,
      isInPark: false,
    };
    const first: FirstExpeditionStateResponse = {
      stage: 'placement',
      tutorialStep: 9,
      unlocked: true,
      requirements: [],
      gold: 8000,
      mission: null,
      egg: null,
      dinosaur: baby,
      hatchingSlots: { used: 0, total: 1 },
      reusedExisting: false,
    };
    render(<ParkOperationsPanel {...callbacks} firstExpedition={first} />);
    fireEvent.click(screen.getByRole('button', { name: '이구아노돈 배치하기' }));
    expect(callbacks.onPlaceDinosaur).toHaveBeenCalledWith(baby);
    expect(callbacks.onCareDinosaur).not.toHaveBeenCalled();
  });

  it('uses the operations snapshot for both upgrade guidance and effective capacity', () => {
    const first: FirstExpeditionStateResponse = {
      stage: 'complete',
      tutorialStep: 10,
      unlocked: true,
      requirements: [],
      gold: 5000,
      mission: null,
      egg: null,
      dinosaur: { ...dinosaur, id: 'igua', speciesId: 'iguanodon' },
      hatchingSlots: { used: 0, total: 1 },
      reusedExisting: true,
    };
    const { rerender } = render(
      <ParkOperationsPanel
        {...props({
          capacity: 32,
          viewingPlatform: {
            id: 'platform',
            level: 2,
            status: 'UPGRADING',
            completesAt: new Date(Date.now() + 120000).toISOString(),
          },
        })}
        firstExpedition={first}
      />,
    );
    expect(screen.getByRole('heading', { name: /관람대 확장 중/ })).toBeInTheDocument();
    expect(screen.getByText(/파크 입장 한도 32명\/분/)).toBeInTheDocument();
    expect(screen.queryByText(/관람대 확장도 마쳤어요/)).not.toBeInTheDocument();
    rerender(
      <ParkOperationsPanel
        {...props({
          capacity: 32,
          viewingPlatform: { id: 'platform', level: 2, status: 'ACTIVE', completesAt: null },
        })}
        firstExpedition={first}
      />,
    );
    expect(screen.getByText(/관람대 확장도 마쳤어요/)).toBeInTheDocument();
    expect(screen.getByText(/파크 입장 한도 32명\/분/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '이구아노돈이 파크에 왔어요' })).toBeInTheDocument();
  });
});

describe('operating the park after the first hybrid exhibit', () => {
  it('limits admission diagnosis to parks that have opened their first exhibit', () => {
    render(
      <ParkOperationsPanel
        {...props({ isOpen: true, viewingPlatform: activePlatform, admission })}
      />,
    );
    expect(screen.queryByRole('region', { name: '입장 진단' })).not.toBeInTheDocument();
  });

  it('explains tied limits and opens care, entrance research, and the upgrade forecast', () => {
    const onManageDemand = vi.fn();
    const onManageEntrance = vi.fn();
    const onViewPlatformUpgrade = vi.fn();
    const onShowGrowth = vi.fn();
    render(
      <ParkOperationsPanel
        {...props({
          isOpen: true,
          visitorsPerMinute: 20,
          demandPerMinute: 20,
          viewingPlatform: activePlatform,
          admission,
        })}
        firstHybridExhibited
        onManageDemand={onManageDemand}
        onManageEntrance={onManageEntrance}
        onViewPlatformUpgrade={onViewPlatformUpgrade}
        onShowGrowth={onShowGrowth}
      />,
    );
    const diagnosis = screen.getByRole('region', { name: '입장 진단' });
    expect(diagnosis).toHaveTextContent('현재 입장 제한 · 관람 수요 · 입구 처리량');
    expect(diagnosis).toHaveTextContent('전시 구역 수용량22명/분운영 중 2곳');
    expect(diagnosis).toHaveTextContent('관람대 Lv.2 → Lv.3');
    expect(diagnosis).toHaveTextContent('혼잡도 20% → 0%');
    expect(diagnosis).toHaveTextContent('만족도 79% → 90%');
    fireEvent.click(screen.getByRole('button', { name: '전시·돌봄 보기' }));
    fireEvent.click(screen.getByRole('button', { name: '입장 수속 연구 보기' }));
    fireEvent.click(screen.getByRole('button', { name: '관람대 강화 보기' }));
    fireEvent.click(screen.getByRole('button', { name: '성장 목표' }));
    expect(onManageDemand).toHaveBeenCalledOnce();
    expect(onManageEntrance).toHaveBeenCalledOnce();
    expect(onViewPlatformUpgrade).toHaveBeenCalledOnce();
    expect(onShowGrowth).toHaveBeenCalledOnce();
  });

  it('opens exhibit management for the capacity limit and keeps the deck upgrade forecast local', () => {
    const onViewPlatformUpgrade = vi.fn();
    const onManageExhibits = vi.fn();
    render(
      <ParkOperationsPanel
        {...props({
          isOpen: true,
          visitorsPerMinute: 22,
          demandPerMinute: 80.5,
          viewingPlatform: {
            ...activePlatform,
            level: 3,
            status: 'UPGRADING',
            completesAt: new Date(Date.now() + 120000).toISOString(),
          },
          admission: {
            ...admission,
            gatePerMinute: 100,
            bottlenecks: ['exhibit'],
          },
        })}
        firstHybridExhibited
        onViewPlatformUpgrade={onViewPlatformUpgrade}
        onManageExhibits={onManageExhibits}
        platformExhibitName="초원 서식지"
      />,
    );
    const diagnosis = screen.getByRole('region', { name: '입장 진단' });
    expect(diagnosis).toHaveTextContent('현재 입장 제한 · 전시 구역 수용량');
    expect(diagnosis).toHaveTextContent('관람 수요80.5명/분');
    expect(diagnosis).toHaveTextContent('초원 서식지 관람 효과');
    expect(diagnosis).toHaveTextContent('혼잡도 20% → 0%');
    expect(diagnosis).not.toHaveTextContent(/\d+ → \d+명\/분/);
    expect(screen.getByRole('button', { name: '완공 확인' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '관람대 완공 보기' }));
    fireEvent.click(screen.getByRole('button', { name: '전시 구역 관리' }));
    expect(onViewPlatformUpgrade).toHaveBeenCalledOnce();
    expect(onManageExhibits).toHaveBeenCalledOnce();
  });

  it('shows a full vault as paused billing and labels the upgrade estimate for resumed admission', () => {
    const callbacks = props({
      isOpen: true,
      gold: 25_000,
      visitorsPerMinute: 22,
      viewingPlatform: activePlatform,
      admission: {
        ...admission,
        bottlenecks: ['exhibit'],
      },
      goldVault: { capacity: 25_000, admissionPaused: true },
    });
    const onPurchaseResources = vi.fn();
    const { rerender } = render(
      <ParkOperationsPanel
        {...callbacks}
        firstHybridExhibited
        onPurchaseResources={onPurchaseResources}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('금고가 찼어요 · 한도 25,000골드');
    expect(screen.getByRole('status')).toHaveTextContent('유료 입장이 멈췄어요.');
    expect(screen.getByRole('status')).toHaveTextContent('자동으로 재개돼요.');
    fireEvent.click(
      within(screen.getByRole('status')).getByRole('button', { name: '기본 자원 구매' }),
    );
    expect(onPurchaseResources).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '파크 휴장' })).toBeEnabled();
    const diagnosis = screen.getByRole('region', { name: '입장 진단' });
    expect(diagnosis).toHaveTextContent('재개 시 입장 제한 · 전시 구역 수용량');
    expect(diagnosis).toHaveTextContent('재개 시 예상 입장 22명/분');
    expect(diagnosis).toHaveTextContent('관람 효과 · 입장 재개 시');
    expect(diagnosis).toHaveTextContent('만족도 79% → 90%');

    rerender(
      <ParkOperationsPanel
        {...callbacks}
        operations={{
          ...callbacks.operations,
          gold: 24_980,
          goldVault: { capacity: 25_000, admissionPaused: false },
        }}
        firstHybridExhibited
      />,
    );
    expect(screen.queryByText('금고가 찼어요')).not.toBeInTheDocument();
    expect(diagnosis).toHaveTextContent('현재 입장 제한 · 전시 구역 수용량');
  });

  it('explains an unopened park and leaves the opening requirements accessible', () => {
    const onMoveEntrance = vi.fn();
    render(
      <ParkOperationsPanel
        {...props({
          canOpen: false,
          openingRequirements: ['입구와 서식지 사이에 방문객 길이 필요해요.'],
          visitorsPerMinute: 0,
          goldVault: { capacity: 25_000, admissionPaused: true },
          viewingPlatform: activePlatform,
          admission: {
            ...admission,
            bottlenecks: [],
            exhibitedDinosaurIds: [],
            platformImpact: {
              ...admission.platformImpact!,
              exhibitId: null,
              before: null,
              after: null,
            },
          },
        })}
        firstHybridExhibited
        onMoveEntrance={onMoveEntrance}
        onManageDemand={vi.fn()}
        onManageEntrance={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '파크 개장' })).toHaveAccessibleDescription(
      '입구와 서식지 사이에 방문객 길이 필요해요.',
    );
    expect(screen.getByRole('region', { name: '입장 진단' })).toHaveTextContent('개장 조건');
    expect(screen.getByRole('region', { name: '입장 진단' })).toHaveTextContent('관람길로 연결');
    expect(screen.queryByText(/현재 입장 제한/)).not.toBeInTheDocument();
    expect(screen.queryByText('금고가 찼어요')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '전시·돌봄 보기' })).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('region', { name: '입장 진단' })).getByRole('button', {
        name: '입구 옮기기 · 무료',
      }),
    );
    expect(onMoveEntrance).toHaveBeenCalledOnce();
  });

  it('explains weak demand and sends care to a hungry dinosaur in the exhibit', () => {
    const iguanodon = {
      ...dinosaur,
      id: 'igua',
      nickname: '이구아노돈',
      speciesId: 'iguanodon',
      hunger: 95,
      happiness: 45,
    };
    const callbacks = props({
      isOpen: true,
      parkLevel: 6,
      demandPerMinute: 10,
      admission: {
        ...admission,
        bottlenecks: ['demand'],
        exhibitedDinosaurIds: [dinosaur.id, iguanodon.id],
      },
    });
    render(
      <ParkOperationsPanel
        {...callbacks}
        firstHybridExhibited
        dinosaurs={[
          dinosaur,
          iguanodon,
          { ...iguanodon, id: 'reserve', hunger: 100, happiness: 0, isInPark: false },
        ]}
      />,
    );
    const diagnosis = within(screen.getByRole('region', { name: '입장 진단' }));
    expect(diagnosis.getByText('이구아노돈의 행복도 45 · 허기 95')).toBeInTheDocument();
    fireEvent.click(diagnosis.getByRole('button', { name: '이구아노돈 돌보기' }));
    expect(callbacks.onCareDinosaur).toHaveBeenCalledWith(iguanodon);
  });

  it('puts the first post-exhibition growth goal and its benefit on the park entry', () => {
    const onShowGrowth = vi.fn();
    render(
      <ParkOperationsPanel
        {...props({ isOpen: true, parkLevel: 5, admission })}
        firstHybridExhibited
        onShowGrowth={onShowGrowth}
      />,
    );
    const action = screen.getByRole('button', { name: 'Lv.6 성장 목표 보기' });
    expect(action).toHaveAccessibleDescription(/전시 확장과 재료 원정/);
    fireEvent.click(action);
    expect(onShowGrowth).toHaveBeenCalledOnce();
  });

  it('shows simultaneous occupancy and the departure rule separately from throughput', () => {
    const callbacks = props({
      isOpen: true,
      visitorsPerMinute: 22,
      viewingPlatform: activePlatform,
      admission: { ...admission, bottlenecks: ['exhibit'] },
      occupancy: { current: 44, capacity: 44, visitSeconds: 120 },
    });
    const { rerender } = render(<ParkOperationsPanel {...callbacks} firstHybridExhibited />);
    const diagnosis = screen.getByRole('region', { name: '입장 진단' });
    expect(diagnosis).toHaveTextContent('파크 안 44 / 44명');
    expect(diagnosis).toHaveTextContent('예상 입장 22명/분');
    expect(diagnosis).toHaveTextContent('관람 2분');
    expect(diagnosis).toHaveTextContent('관람을 마친 손님이 나가면 다음 손님을 받아요.');

    rerender(
      <ParkOperationsPanel
        {...callbacks}
        operations={{
          ...callbacks.operations,
          occupancy: { current: 40, capacity: 44, visitSeconds: 120 },
        }}
        firstHybridExhibited
      />,
    );
    expect(diagnosis).toHaveTextContent('파크 안 40 / 44명');
    expect(diagnosis).not.toHaveTextContent('관람을 마친 손님이 나가면 다음 손님을 받아요.');
  });

  it('opens the entrance once research is complete and shows the platform ceiling', () => {
    const onManageEntrance = vi.fn();
    render(
      <ParkOperationsPanel
        {...props({
          isOpen: true,
          viewingPlatform: { ...activePlatform, level: 5 },
          admission: {
            ...admission,
            bottlenecks: ['entrance'],
            entranceResearchCompleted: true,
            platformImpact: null,
          },
        })}
        firstHybridExhibited
        onManageEntrance={onManageEntrance}
        onViewPlatformUpgrade={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '입구 관리 보기' }));
    expect(onManageEntrance).toHaveBeenCalledOnce();
    expect(screen.getByText(/관람대는 현재 최고 단계인 Lv.5/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관람대 강화 보기' })).not.toBeInTheDocument();
  });
});

describe('exhibit management', () => {
  it('shows the live metrics for occupied zones and routes to regular placement', () => {
    const onShowDinosaurs = vi.fn();
    const onBuild = vi.fn();
    render(
      <ParkExhibitManagement
        operations={{
          ...operations,
          parkLevel: 5,
          gold: 6000,
          admission: {
            ...admission,
            exhibits: [
              {
                id: 'grassland',
                dinosaurIds: ['para'],
                crowdingPercent: 25,
                satisfactionPercent: 69,
              },
            ],
          },
        }}
        dinosaurs={[dinosaur]}
        buildings={[
          {
            id: 'grassland',
            typeId: 'habitat-grassland',
            level: 1,
            positionX: 8,
            positionY: 8,
            status: BuildingStatus.ACTIVE,
            assignedGreatFigureId: null,
          },
          {
            id: 'forest',
            typeId: 'habitat-forest',
            level: 1,
            positionX: 4,
            positionY: 4,
            status: BuildingStatus.CONSTRUCTING,
            assignedGreatFigureId: null,
          },
        ]}
        onShowDinosaurs={onShowDinosaurs}
        onBuild={onBuild}
      />,
    );
    const habitats = screen.getByRole('list', { name: '보유 서식지' });
    expect(habitats).toHaveTextContent('초원 서식지 (8, 8)파라혼잡도 25% · 만족도 69%');
    expect(habitats).toHaveTextContent('숲 서식지 (4, 4)건설 중');
    fireEvent.click(screen.getByRole('button', { name: '공룡 배치 관리' }));
    fireEvent.click(screen.getByRole('button', { name: '초원 서식지 건설 위치 선택' }));
    expect(screen.getByRole('button', { name: '숲 서식지 건설 위치 선택' })).toBeDisabled();
    expect(onShowDinosaurs).toHaveBeenCalledOnce();
    expect(onBuild).toHaveBeenCalledWith('habitat-grassland');
  });
});
