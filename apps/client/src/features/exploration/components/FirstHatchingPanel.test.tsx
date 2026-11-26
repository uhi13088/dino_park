import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DinosaurResponse, FirstExpeditionStateResponse } from '@dino-park/shared';
import FirstHatchingPanel from './FirstHatchingPanel';

const dinosaur: DinosaurResponse = {
  id: 'igua',
  speciesId: 'iguanodon',
  nickname: null,
  level: 1,
  exp: 0,
  happiness: 100,
  hunger: 0,
  intimacy: 0,
  positionX: 9,
  positionY: 9,
  isInPark: false,
};
const initial: FirstExpeditionStateResponse = {
  stage: 'available',
  tutorialStep: 3,
  unlocked: true,
  requirements: [],
  gold: 1000,
  mission: null,
  egg: null,
  dinosaur: null,
  hatchingSlots: { used: 0, total: 1 },
  reusedExisting: false,
};
const mission = {
  id: 'mission',
  regionId: 'grassland',
  status: 'COMPLETED',
  step: 3,
  totalSteps: 3,
  clue: null,
};
const egg = {
  id: 'egg',
  speciesId: 'iguanodon',
  status: 'stored' as const,
  completesAt: null,
  remainingSeconds: 0,
  dinosaurId: null,
};
function props(overrides: Partial<FirstExpeditionStateResponse> = {}) {
  return {
    state: { ...initial, ...overrides },
    busy: false,
    onClaimEgg: vi.fn(),
    onStartHatch: vi.fn(),
    onClaimHatch: vi.fn(),
    onPlace: vi.fn(),
    onRefresh: vi.fn(),
  };
}
const view = (p: ReturnType<typeof props>) => <FirstHatchingPanel {...p} />;
afterEach(() => vi.useRealTimers());

describe('first hatching actions', () => {
  it('requires the discovered egg to be claimed before hatching can begin', () => {
    const p = props({ stage: 'reward', mission });
    render(view(p));
    fireEvent.click(screen.getByRole('button', { name: '알 가져오기' }));
    expect(p.onClaimEgg).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /부화 시작/ })).not.toBeInTheDocument();
  });
  it('keeps a stored egg while all hatching slots are occupied', () => {
    const p = props({ stage: 'egg', egg, hatchingSlots: { used: 1, total: 1 } });
    const { rerender } = render(view(p));
    expect(screen.getByRole('button', { name: '부화 시작 · 60초' })).toBeDisabled();
    expect(screen.getByText('부화 자리가 가득 찼어요.')).toBeVisible();
    const free = { ...p, state: { ...p.state, hatchingSlots: { used: 0, total: 1 } } };
    rerender(view(free));
    fireEvent.click(screen.getByRole('button', { name: '부화 시작 · 60초' }));
    expect(p.onStartHatch).toHaveBeenCalledOnce();
  });
  it('does not award a dinosaur when a local countdown ends', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
    const p = props({
      stage: 'hatching',
      egg: {
        ...egg,
        status: 'hatching',
        completesAt: '2026-11-16T12:01:00Z',
        remainingSeconds: 60,
      },
      hatchingSlots: { used: 1, total: 1 },
    });
    const { rerender } = render(view(p));
    expect(screen.getByRole('button', { name: '알을 따뜻하게 품고 있어요' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(61000));
    fireEvent.click(screen.getByRole('button', { name: '부화 상태 확인' }));
    expect(p.onRefresh).toHaveBeenCalledOnce();
    expect(p.onClaimHatch).not.toHaveBeenCalled();
    rerender(
      view({ ...p, state: { ...p.state, stage: 'hatch_ready', egg: { ...egg, status: 'ready' } } }),
    );
    fireEvent.click(screen.getByRole('button', { name: '이구아노돈 만나기' }));
    expect(p.onClaimHatch).toHaveBeenCalledOnce();
  });
  it('places a received dinosaur and recognizes a prior collection without offering another reward', () => {
    const p = props({ stage: 'placement', dinosaur });
    const { rerender } = render(view(p));
    fireEvent.click(screen.getByRole('button', { name: '파크에 배치하기' }));
    expect(p.onPlace).toHaveBeenCalledOnce();
    rerender(
      view({
        ...p,
        state: { ...p.state, stage: 'complete', dinosaur: null, reusedExisting: true },
      }),
    );
    expect(screen.queryByRole('button', { name: '알 가져오기' })).not.toBeInTheDocument();
  });
});
