import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FIRST_EXPEDITION } from '@dino-park/game-data';
import type { DinosaurResponse, FirstExpeditionStateResponse } from '@dino-park/shared';
import FirstExpeditionPanel from './FirstExpeditionPanel';

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
  energy: 30,
  mission: null,
  egg: null,
  dinosaur: null,
  hatchingSlots: { used: 0, total: 1 },
  reusedExisting: false,
};
const mission = {
  id: 'mission',
  regionId: 'grassland',
  status: 'IN_PROGRESS',
  step: 0,
  totalSteps: 3,
  clue: FIRST_EXPEDITION.clues[0],
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
    onStart: vi.fn(),
    onChoice: vi.fn(),
    onClaimEgg: vi.fn(),
    onStartHatch: vi.fn(),
    onClaimHatch: vi.fn(),
    onPlace: vi.fn(),
    onRefresh: vi.fn(),
  };
}
const view = (p: ReturnType<typeof props>) => (
  <MemoryRouter>
    <FirstExpeditionPanel {...p} />
  </MemoryRouter>
);
afterEach(() => vi.useRealTimers());

describe('first expedition and hatching actions', () => {
  it('guides a locked park back to preparation without allowing a paid departure', () => {
    const p = props({
      stage: 'locked',
      unlocked: false,
      requirements: ['첫 관람대를 완공해주세요.'],
    });
    render(view(p));
    expect(screen.getByRole('link', { name: '파크에서 준비하기' })).toHaveAttribute(
      'href',
      '/park',
    );
    expect(screen.getByText('첫 관람대를 완공해주세요.')).toBeVisible();
    expect(screen.queryByRole('button', { name: '초원 정찰 시작' })).not.toBeInTheDocument();
    expect(p.onStart).not.toHaveBeenCalled();
  });
  it('shows the paid inputs before departure and prevents a gold or energy shortage', () => {
    const p = props({ gold: 50, energy: 4 });
    const { rerender } = render(view(p));
    expect(screen.getByRole('button', { name: '초원 정찰 시작' })).toBeDisabled();
    expect(screen.getByText('더 필요해요: 50골드 · 에너지 1')).toBeVisible();
    const funded = props();
    rerender(view(funded));
    fireEvent.click(screen.getByRole('button', { name: '초원 정찰 시작' }));
    expect(funded.onStart).toHaveBeenCalledOnce();
  });
  it('sends a selected clue and keeps the current server step until a response arrives', () => {
    const p = props({ stage: 'exploring', mission });
    const { rerender } = render(view(p));
    fireEvent.click(screen.getByRole('button', { name: /흔들리는 갈대/ }));
    expect(p.onChoice).toHaveBeenCalledWith('reeds');
    expect(screen.getByText('단서 1/3')).toBeVisible();
    rerender(
      view({
        ...p,
        state: {
          ...p.state,
          feedback: { correct: false, message: '같은 모양의 발자국을 찾아봐요.' },
        },
        busy: true,
      }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('같은 모양의 발자국을 찾아봐요.');
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(
      true,
    );
    expect(p.onClaimEgg).not.toHaveBeenCalled();
  });
  it('requires the discovered egg to be claimed before hatching can begin', () => {
    const p = props({ stage: 'reward', mission: { ...mission, step: 3, clue: null } });
    render(view(p));
    fireEvent.click(screen.getByRole('button', { name: '알 가져오기' }));
    expect(p.onClaimEgg).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /부화 시작/ })).not.toBeInTheDocument();
  });
  it('keeps a stored egg while all hatching slots are occupied', () => {
    const p = props({ stage: 'egg', egg, hatchingSlots: { used: 1, total: 1 } });
    const { rerender } = render(view(p));
    expect(screen.getByRole('button', { name: '부화 시작 · 60초' })).toBeDisabled();
    expect(screen.getByText('먼저 부화 중인 알을 확인해 빈자리를 만들어주세요.')).toBeVisible();
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
    expect(screen.getByRole('link', { name: '파크로 돌아가기' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '알 가져오기' })).not.toBeInTheDocument();
    expect(screen.getByText('이전에 만난 이구아노돈 기록으로 이 안내를 마쳤어요.')).toBeVisible();
  });
});
