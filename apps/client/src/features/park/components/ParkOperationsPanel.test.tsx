import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  DinosaurResponse,
  ParkOperationsResponse,
  FirstExpeditionStateResponse,
} from '@dino-park/shared';
import ParkOperationsPanel from './ParkOperationsPanel';

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

  it('shows the server capacity after completion without offering a second platform', () => {
    const callbacks = props({
      capacity: 32,
      viewingPlatform: { id: 'platform', level: 1, status: 'ACTIVE', completesAt: null },
    });
    render(<ParkOperationsPanel {...callbacks} />);
    expect(screen.getByText('첫 관람대가 완공됐어요')).toBeInTheDocument();
    expect(screen.getByText(/관람 정원이 32명/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관람대 짓기' })).not.toBeInTheDocument();
  });
  it('continues from the first platform to the active investigation', () => {
    const onExplore = vi.fn();
    const first: FirstExpeditionStateResponse = {
      stage: 'available',
      tutorialStep: 5,
      unlocked: true,
      requirements: [],
      gold: 8400,
      energy: 30,
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
    fireEvent.click(screen.getByRole('button', { name: '첫 탐험 시작' }));
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
      energy: 25,
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
      energy: 25,
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
      energy: 25,
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
    expect(screen.getByText(/관람 정원 32명/)).toBeInTheDocument();
    expect(screen.queryByText(/관람대 확장도 마쳤어요/)).not.toBeInTheDocument();
    rerender(
      <ParkOperationsPanel
        {...props({
          capacity: 52,
          viewingPlatform: { id: 'platform', level: 2, status: 'ACTIVE', completesAt: null },
        })}
        firstExpedition={first}
      />,
    );
    expect(screen.getByText(/관람대 확장도 마쳤어요/)).toBeInTheDocument();
    expect(screen.getByText(/관람 정원 52명/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '이구아노돈이 파크에 왔어요' })).toBeInTheDocument();
  });
});
