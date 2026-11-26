import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DinosaurCategory,
  DinosaurOrigin,
  DinosaurSize,
  MaterialQuality,
  Rarity,
  ResearchMaterial,
  type ExperimentalHybridIdentity,
  type ExperimentalHybridSelection,
  type ExperimentalHybridState,
} from '@dino-park/shared';
import ExperimentalHybridPage from './ExperimentalHybridPage';

const mock = vi.hoisted(() => ({
  state: vi.fn(),
  quote: vi.fn(),
  action: vi.fn(),
  placement: vi.fn(),
}));
vi.mock('@/api/queries/experimentalHybrid', () => ({
  useExperimentalHybridState: mock.state,
  useExperimentalHybridQuote: mock.quote,
  useExperimentalHybridAction: () => ({ mutate: mock.action, isPending: false }),
}));
vi.mock('@/stores', () => ({
  useAuthStore: (read: (state: { isAuthenticated: boolean }) => boolean) =>
    read({ isAuthenticated: true }),
  useGameStore: (read: (state: { startPlacement: typeof mock.placement }) => unknown) =>
    read({ startPlacement: mock.placement }),
  useUIStore: (read: (state: { closeModal: () => void; closeSidePanel: () => void }) => unknown) =>
    read({ closeModal: () => {}, closeSidePanel: () => {} }),
}));

const lineage: ExperimentalHybridIdentity = {
  species: {
    id: 'hybrid-demo',
    name: 'Experimental hybrid',
    nameKo: '이구아케라스',
    category: DinosaurCategory.HYBRID,
    origin: DinosaurOrigin.HYBRID,
    rarity: Rarity.EPIC,
    size: DinosaurSize.LARGE,
    stats: { baseRevenue: 0, popularity: 45, maintenanceCost: 9, space: 2 },
    habitat: ['grassland'],
    hatchTime: 0,
    unlockCondition: { type: 'dna', value: 'hybrid-demo', description: '실험 합성' },
    description: '이구아노돈과 트리케라톱스의 조합',
  },
  parentSpeciesIds: ['iguanodon', 'triceratops'],
  focus: 'sprint',
  artwork: { idleUrl: '/api/experimental-hybrids/art/hybrid-demo', width: 88 },
};
const mission = 'mission.abandoned-lab.repeat-wall-store-survey.v1';
const initial: ExperimentalHybridState = {
  serverTime: '2026-11-23T12:00:00Z',
  unlocked: true,
  lockReasons: [],
  gold: 8000,
  artEnabled: true,
  parents: [
    {
      id: 'a',
      speciesId: 'iguanodon',
      name: '이구아노돈',
      nameKo: '이구아노돈',
      rarity: Rarity.COMMON,
      happiness: 70,
      hunger: 40,
    },
    {
      id: 'b',
      speciesId: 'triceratops',
      name: '트리케라톱스',
      nameKo: '트리케라톱스',
      rarity: Rarity.UNCOMMON,
      happiness: 65,
      hunger: 32,
    },
  ],
  job: null,
  documents: [],
  archive: { missionId: mission, reportReceived: false, recovered: false },
  market: [],
  pendingProceeds: 0,
};

function open(overrides: Partial<ExperimentalHybridState> = {}, tab = '') {
  mock.state.mockReturnValue({ data: { ...initial, ...overrides }, dataUpdatedAt: Date.now() });
  mock.quote.mockImplementation((selection: ExperimentalHybridSelection | null) => ({
    data: selection && {
      selection,
      design: lineage,
      registered: false,
      artReady: false,
      gold: 6000,
      durationSeconds: 7200,
      successChance: 0.5,
      attempt: 1,
      guaranteedAttempt: 5,
      blockers: [],
      reasons: ['부모의 등급에 따라 DNA 샘플 수량이 달라요.'],
      estimatedStats: null,
      ingredients: [
        {
          material: ResearchMaterial.DNA,
          quality: MaterialQuality.MIDDLE,
          amount: 20,
          available: 26,
          failureRefund: selection.stabilizer ? 20 : 16,
          allocations: [
            { quality: MaterialQuality.MIDDLE, amount: 18, failureRefund: 14 },
            { quality: MaterialQuality.HIGH, amount: 2, failureRefund: 1 },
          ],
        },
      ],
    },
    error: null,
    isFetching: false,
  }));
  render(
    <MemoryRouter
      initialEntries={[`/research/hybrids${tab}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/research/hybrids" element={<ExperimentalHybridPage />} />
        <Route path="/park" element={<p>파크</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('실험 합성 연구소', () => {
  it('quotes the two owned individuals including higher-quality allocations and stable start id', () => {
    open();
    fireEvent.change(screen.getByLabelText('첫 번째 원종'), { target: { value: 'a' } });
    expect(
      within(screen.getByLabelText('두 번째 원종')).getByRole('option', { name: /이구아노돈/ }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText('두 번째 원종'), { target: { value: 'b' } });
    fireEvent.change(screen.getByLabelText('성향'), { target: { value: 'sprint' } });
    expect(screen.getByText('실패 시 4개 소모 · 중급 18개 + 상급 2개 사용')).toBeVisible();
    fireEvent.click(screen.getByLabelText('안정제 1개 사용'));
    expect(screen.getByText('실패 시 0개 소모 · 중급 18개 + 상급 2개 사용')).toBeVisible();
    const start = screen.getByRole('button', { name: '합성 시작' });
    fireEvent.click(start);
    fireEvent.click(start);
    expect(mock.action).toHaveBeenCalledTimes(2);
    const request = mock.action.mock.calls[0][0].request;
    expect(request).toEqual({
      parentIds: ['a', 'b'],
      focus: 'sprint',
      tier: Rarity.EPIC,
      stabilizer: true,
      requestId: expect.any(String),
    });
    expect(mock.action.mock.calls[1][0].request.requestId).toBe(request.requestId);
  });

  it('offers claim only once the server marks the experiment ready', () => {
    open({
      job: {
        id: 'job',
        design: lineage,
        status: 'ready',
        readyAt: initial.serverTime,
        dinosaurId: null,
        refunds: [],
      },
    });
    expect(screen.queryByRole('button', { name: '합성 시작' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '합성 결과 수령' }));
    expect(mock.action).toHaveBeenCalledWith({ kind: 'claim', id: 'job' }, expect.any(Object));
  });

  it('opens normal placement and the exact collected codex entry', () => {
    open({
      job: {
        id: 'job',
        design: lineage,
        status: 'succeeded',
        readyAt: initial.serverTime,
        dinosaurId: 'baby',
        stats: { appeal: 38, speed: 75, stamina: 48, aggression: 26 },
        refunds: [],
      },
    });
    expect(screen.getByRole('link', { name: '도감 보기' })).toHaveAttribute(
      'href',
      '/dinosaur?species=hybrid-demo',
    );
    expect(screen.getByText(/매력도 38 · 속도 75/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '파크에 배치' }));
    expect(mock.placement).toHaveBeenCalledWith({
      type: 'dinosaur',
      id: 'baby',
      speciesId: 'hybrid-demo',
    });
    expect(screen.getByText('파크')).toBeVisible();
  });

  it('routes to the exact ruin and returns the claimed record to the research notebook', () => {
    open({}, '?tab=notes');
    expect(screen.getByRole('link', { name: '외벽 보관동으로' })).toHaveAttribute(
      'href',
      `/exploration?mission=${mission}&spot=wall-store&returnTo=hybrid-notebook`,
    );
    cleanup();
    open({ archive: { ...initial.archive, reportReceived: true } }, '?tab=notes');
    fireEvent.click(screen.getByRole('button', { name: '조합법 복원' }));
    expect(mock.action).toHaveBeenCalledWith({ kind: 'recover' }, expect.any(Object));
  });

  it('allows the actual owner to list the document and another park to buy a listing', () => {
    open(
      {
        documents: [
          {
            id: lineage.species.id,
            lineage,
            tier: Rarity.EPIC,
            author: '기록자',
            source: 'discovered',
            canPublish: true,
            activeListingId: null,
          },
        ],
        market: [
          {
            id: 'listed',
            lineage,
            tier: Rarity.EPIC,
            seller: '다른 파크',
            price: 2700,
            mine: false,
            registered: false,
          },
        ],
      },
      '?tab=market',
    );
    fireEvent.change(screen.getByLabelText('판매가 (골드)'), { target: { value: '3500' } });
    fireEvent.click(screen.getByRole('button', { name: '문서 판매 등록' }));
    expect(mock.action).toHaveBeenCalledWith(
      {
        kind: 'list',
        request: { lineageId: 'hybrid-demo', price: 3500, requestId: expect.any(String) },
      },
      expect.any(Object),
    );
    const materialCost = screen.getByText(/중급 DNA 샘플 20개 · 중급 합성 촉매 1개/);
    expect(materialCost).not.toBeVisible();
    fireEvent.click(screen.getByText('조합법 보기'));
    expect(materialCost).toBeVisible();
    expect(screen.getByText('재현 · 4,000골드 · 1시간')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '2,700골드에 구매' }));
    expect(mock.action).toHaveBeenCalledWith({ kind: 'buy', id: 'listed' }, expect.any(Object));
  });

  it('shows uncollected market proceeds and starts an explicit vault transfer', () => {
    open({ pendingProceeds: 2400 }, '?tab=market');
    expect(screen.getByRole('heading', { name: '받을 판매 대금 · 2,400골드' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '판매 대금 수령' }));
    expect(mock.action).toHaveBeenCalledWith({ kind: 'collect' }, expect.any(Object));
  });
});
