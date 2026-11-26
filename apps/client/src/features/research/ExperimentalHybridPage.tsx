import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  EXPERIMENTAL_HYBRID_ACCESS,
  experimentalHybridStatOutcomes,
  getDinosaurById,
  getExperimentalHybridDesign,
} from '@dino-park/game-data';
import {
  CODEX_RARITY_LABELS,
  DINOSAUR_COMPETITIVE_STAT_LABELS,
  EXPERIMENTAL_HYBRID_LISTING_MAX_GOLD,
  EXPERIMENTAL_HYBRID_LISTING_MIN_GOLD,
  formatDuration,
  MATERIAL_QUALITY_LABELS,
  Rarity,
  RESEARCH_MATERIAL_LABELS,
  type DinosaurCompetitiveStats,
  type ExperimentalHybridDocument,
  type ExperimentalHybridIdentity,
  type ExperimentalHybridJobState,
  type ExperimentalHybridListing,
  type ExperimentalHybridParent,
  type ExperimentalHybridQuote,
  type ExperimentalHybridSelection,
  type ExperimentalHybridState,
  type ExperimentalHybridTier,
  type RepeatSynthesisFocus,
} from '@dino-park/shared';
import {
  useExperimentalHybridAction,
  useExperimentalHybridQuote,
  useExperimentalHybridState,
  type ExperimentalHybridAction,
} from '@/api/queries/experimentalHybrid';
import { hybridArtworkUrl } from '@/game/parkArtwork';
import { useAuthStore, useGameStore, useUIStore } from '@/stores';
import { createRequestId } from '@/utils/requestId';
import { formatFacilityCountdown } from '@/utils/facilityCountdown';
import './ExperimentalHybridPage.css';

const labPath = '/research/hybrids';
const tabs = { experiment: '실험 합성', notes: '연구 노트', market: '부두 야시장' };
type Tab = keyof typeof tabs;
const focuses = { balanced: '균형형', audience: '전시형', sprint: '질주형' };
const number = new Intl.NumberFormat('ko-KR');
const statLabels = Object.entries(DINOSAUR_COMPETITIVE_STAT_LABELS) as [
  keyof DinosaurCompetitiveStats,
  string,
][];
type Action = (action: ExperimentalHybridAction, onSuccess?: () => void) => void;

function parentLabel(parent: ExperimentalHybridParent, instance: number) {
  const needsCare = parent.happiness < 30 || parent.hunger > 80;
  const name = parent.nickname ? `${parent.nickname} (${parent.nameKo})` : parent.nameKo;
  return [
    name,
    CODEX_RARITY_LABELS[parent.rarity],
    instance > 0 ? `개체 ${instance}` : '',
    needsCare ? '돌봄 필요' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function ParentSelect({
  label,
  parents,
  selected,
  other,
  onChange,
}: {
  label: string;
  parents: ExperimentalHybridParent[];
  selected: string;
  other: string;
  onChange: (id: string) => void;
}) {
  const otherSpecies = parents.find(({ id }) => id === other)?.speciesId;
  const counts = new Map<string, number>();
  const shown = new Map<string, number>();
  for (const { speciesId } of parents) {
    counts.set(speciesId, (counts.get(speciesId) ?? 0) + 1);
  }
  return (
    <label className="hybrid-lab__field">
      {label}
      <select value={selected} onChange={({ target }) => onChange(target.value)}>
        <option value="">원종 선택</option>
        {parents.map((parent) => {
          const count = (shown.get(parent.speciesId) ?? 0) + 1;
          shown.set(parent.speciesId, count);
          return (
            <option key={parent.id} value={parent.id} disabled={parent.speciesId === otherSpecies}>
              {parentLabel(parent, (counts.get(parent.speciesId) ?? 0) > 1 ? count : 0)}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function LineageInfo({ lineage }: { lineage: ExperimentalHybridIdentity }) {
  return (
    <div>
      <h3>{lineage.species.nameKo}</h3>
      <p className="hybrid-lab__muted">
        {lineage.parentSpeciesIds.map((id) => getDinosaurById(id)?.nameKo ?? id).join(' × ')}
        {' · '}
        {CODEX_RARITY_LABELS[lineage.species.rarity]} · {focuses[lineage.focus]}
      </p>
    </div>
  );
}

function RecipeDisclosure({
  lineage,
  tier,
}: {
  lineage: ExperimentalHybridIdentity;
  tier: ExperimentalHybridTier;
}) {
  const [left, right] = lineage.parentSpeciesIds.map(getDinosaurById);
  if (!left || !right) return null;
  const design = getExperimentalHybridDesign(left, right, lineage.focus, tier, true);
  if (!design) return null;
  const { labLevel, geneAnalysis } =
    tier === Rarity.LEGENDARY
      ? EXPERIMENTAL_HYBRID_ACCESS.legendary
      : EXPERIMENTAL_HYBRID_ACCESS.basic;
  const { ingredients, gold, durationSeconds } = design.cost;
  const outcomes = experimentalHybridStatOutcomes(design);

  return (
    <details className="hybrid-lab__recipe">
      <summary>조합법 보기</summary>
      <p>
        재현 · {number.format(gold)}골드 · {formatDuration(durationSeconds * 1000)}
      </p>
      <p>
        {ingredients
          .map(
            ({ material, quality, amount }) =>
              `${MATERIAL_QUALITY_LABELS[quality]} ${RESEARCH_MATERIAL_LABELS[material]} ${amount}개`,
          )
          .join(' · ')}
      </p>
      <p>
        파크 Lv.{EXPERIMENTAL_HYBRID_ACCESS.parkLevel} · DNA 연구소 Lv.{labLevel} · 고급 유전자 분석
        Lv.{geneAnalysis}
      </p>
      <p>
        예상 범위 ·{' '}
        {statLabels
          .map(([key, label]) => {
            const values = outcomes[key].map(({ value }) => value);
            return `${label} ${Math.min(...values)}–${Math.max(...values)}`;
          })
          .join(' · ')}
      </p>
    </details>
  );
}

function Quote({
  quote,
  error,
  loading,
  busy,
  onStart,
  onRetry,
}: {
  quote?: ExperimentalHybridQuote;
  error: Error | null;
  loading: boolean;
  busy: boolean;
  onStart: () => void;
  onRetry: () => void;
}) {
  const stats = quote?.estimatedStats;
  const missingMaterials = quote?.ingredients.some(({ available, amount }) => available < amount);
  return (
    <section className="hybrid-lab__quote" aria-labelledby="experiment-quote">
      <div className="hybrid-lab__quote-heading">
        <h2 id="experiment-quote">합성 견적</h2>
        {quote?.design && !error && (
          <button
            className="hybrid-lab__action"
            type="button"
            onClick={onStart}
            disabled={busy || loading || !!quote.blockers.length}
          >
            {busy ? '합성 요청 중…' : '합성 시작'}
          </button>
        )}
      </div>
      {loading && <p role="status">재료와 성공 확률을 확인하고 있어요…</p>}
      {error && (
        <>
          <p role="alert" className="hybrid-lab__muted">
            {error.message}
          </p>
          <button className="hybrid-lab__secondary" type="button" onClick={onRetry}>
            다시 확인
          </button>
        </>
      )}
      {!quote && !loading && !error && (
        <p className="hybrid-lab__muted">
          원종 두 마리를 고르면 필요한 재료와 예상 결과를 확인할 수 있어요.
        </p>
      )}
      {quote && !error && (
        <>
          {quote.design && (
            <>
              <div className="hybrid-lab__identity">
                {quote.design.artwork && (
                  <img src={hybridArtworkUrl(quote.design.artwork.idleUrl)} alt="" />
                )}
                <LineageInfo lineage={quote.design} />
              </div>
              <p className="hybrid-lab__stats">
                {quote.registered ? '조합 재현' : '새 조합 실험'} · {number.format(quote.gold)}골드
                · {formatDuration(quote.durationSeconds * 1000)}
              </p>
            </>
          )}
          {quote.ingredients.length > 0 && (
            <dl className="hybrid-lab__ingredients">
              {quote.ingredients.map((item) => (
                <div key={item.material}>
                  <dt>
                    {MATERIAL_QUALITY_LABELS[item.quality]}{' '}
                    {RESEARCH_MATERIAL_LABELS[item.material]}
                  </dt>
                  <dd className={item.available < item.amount ? 'hybrid-lab__shortage' : undefined}>
                    {item.amount}개 필요 · {item.available}개 보유
                  </dd>
                  <dd className="hybrid-lab__consumption">
                    실패 시 {item.amount - item.failureRefund}개 소모
                    {item.allocations.some(({ quality }) => quality !== item.quality) &&
                      ` · ${item.allocations.map(({ quality, amount }) => `${MATERIAL_QUALITY_LABELS[quality]} ${amount}개`).join(' + ')} 사용`}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {quote.design && (
            <p className="hybrid-lab__stats">
              {quote.attempt}번째 시도 · 성공률 {Math.round(quote.successChance * 100)}% ·{' '}
              {quote.guaranteedAttempt}번째 확정
            </p>
          )}
          {stats && (
            <details>
              <summary>예상 능력치와 확률</summary>
              <dl className="hybrid-lab__ingredients">
                {statLabels.map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>
                      {stats[key].map(({ value, chance }) => `${value} (${chance}%)`).join(' · ')}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
          {!!quote.reasons.length && (
            <details>
              <summary>재료가 달라진 이유</summary>
              <ul className="hybrid-lab__notes">
                {quote.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </details>
          )}
          {!!quote.blockers.length && (
            <ul className="hybrid-lab__notes" aria-label="합성에 필요한 준비">
              {quote.blockers.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
          {missingMaterials && (
            <div className="hybrid-lab__actions">
              <Link className="hybrid-lab__secondary" to="/exploration">
                재료를 모으러 탐험으로
              </Link>
              <Link className="hybrid-lab__secondary" to="/park?panel=resources&tab=quality">
                재료 등급 올리기
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ExperimentJob({
  job,
  serverTime,
  updatedAt,
  busy,
  onClaim,
  onPlace,
}: {
  job: ExperimentalHybridJobState;
  serverTime: string;
  updatedAt: number;
  busy: boolean;
  onClaim: () => void;
  onPlace: (id: string, speciesId: string) => void;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (job.status !== 'incubating') return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [job.status]);
  const clock = Date.parse(serverTime) + Math.max(0, now - updatedAt);
  const remaining = Math.max(0, Math.ceil((Date.parse(job.readyAt) - clock) / 1000));
  const { species, artwork } = job.design;
  const { stats, dinosaurId } = job;
  if (job.status === 'succeeded') {
    return (
      <section className="hybrid-lab__notice hybrid-lab__result" aria-label="합성 결과">
        {artwork && <img src={hybridArtworkUrl(artwork.idleUrl)} alt="" />}
        <div>
          <h2>{species.nameKo} 탄생</h2>
          <p className="hybrid-lab__muted" role="status">
            연구 노트와 도감에 기록했어요.
          </p>
          {stats && (
            <p className="hybrid-lab__stats">
              {statLabels.map(([key, label]) => `${label} ${stats[key]}`).join(' · ')}
            </p>
          )}
          <div className="hybrid-lab__actions">
            <Link
              className="hybrid-lab__secondary"
              to={`/dinosaur?species=${encodeURIComponent(species.id)}`}
            >
              도감 보기
            </Link>
            <Link className="hybrid-lab__secondary" to={`${labPath}?tab=notes`}>
              연구 노트
            </Link>
          </div>
        </div>
        {dinosaurId && (
          <button
            className="hybrid-lab__action"
            type="button"
            onClick={() => onPlace(dinosaurId, species.id)}
          >
            파크에 배치
          </button>
        )}
      </section>
    );
  }
  if (job.status === 'failed' || job.status === 'refunded') {
    return (
      <section className="hybrid-lab__notice" role="status">
        <div>
          <h2>
            {job.status === 'failed'
              ? '배양에 실패했어요'
              : '외형 생성이 지연되어 비용을 돌려드렸어요'}
          </h2>
          <p className="hybrid-lab__muted">
            {job.refunds.length
              ? `돌려받은 재료 · ${job.refunds.map(({ quality, material, amount }) => `${MATERIAL_QUALITY_LABELS[quality]} ${RESEARCH_MATERIAL_LABELS[material]} ${amount}개`).join(' · ')}`
              : '실험 기록에서 다음 시도를 시작할 수 있어요.'}
          </p>
        </div>
      </section>
    );
  }
  return (
    <section className="hybrid-lab__notice" aria-label="진행 중인 실험">
      <div>
        <h2>
          {job.status === 'ready'
            ? '결과를 수령할 수 있어요'
            : job.status === 'generating'
              ? '계통 외형을 만들고 있어요'
              : '배양 중'}
        </h2>
        <p className="hybrid-lab__muted">
          {species.nameKo}{' '}
          {job.status === 'incubating' && remaining > 0 && (
            <time dateTime={job.readyAt}>· {formatFacilityCountdown(remaining)} 남음</time>
          )}
        </p>
      </div>
      {job.status === 'ready' && (
        <button className="hybrid-lab__action" type="button" disabled={busy} onClick={onClaim}>
          {busy ? '확인 중…' : '합성 결과 수령'}
        </button>
      )}
    </section>
  );
}

function SellForm({
  document,
  busy,
  run,
}: {
  document: ExperimentalHybridDocument;
  busy: boolean;
  run: Action;
}) {
  const [price, setPrice] = useState('');
  const pending = useRef<{ price: number; requestId: string }>();
  const value = Number(price);
  const priceAccepted =
    Number.isSafeInteger(value) &&
    value >= EXPERIMENTAL_HYBRID_LISTING_MIN_GOLD &&
    value <= EXPERIMENTAL_HYBRID_LISTING_MAX_GOLD;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!priceAccepted) return;
    if (pending.current?.price !== value)
      pending.current = { price: value, requestId: createRequestId() };
    run(
      {
        kind: 'list',
        request: {
          price: value,
          requestId: pending.current.requestId,
          lineageId: document.lineage.species.id,
        },
      },
      () => {
        pending.current = undefined;
        setPrice('');
      },
    );
  }
  if (!document.canPublish) return null;
  return (
    <form onSubmit={submit}>
      <label className="hybrid-lab__field">
        판매가 (골드)
        <input
          type="number"
          min={EXPERIMENTAL_HYBRID_LISTING_MIN_GOLD}
          max={EXPERIMENTAL_HYBRID_LISTING_MAX_GOLD}
          step="1"
          inputMode="numeric"
          value={price}
          onChange={({ target }) => setPrice(target.value)}
          required
        />
      </label>
      <button className="hybrid-lab__action" type="submit" disabled={busy || !priceAccepted}>
        문서 판매 등록
      </button>
    </form>
  );
}

function Notebook({
  state,
  busy,
  run,
  onUse,
}: {
  state: ExperimentalHybridState;
  busy: boolean;
  run: Action;
  onUse: (lineage: ExperimentalHybridIdentity) => void;
}) {
  const archivePath = `/exploration?${new URLSearchParams({
    mission: state.archive.missionId,
    spot: 'wall-store',
    returnTo: 'hybrid-notebook',
  })}`;
  const sourceLabels = {
    discovered: '직접 발견',
    archive: '폐허에서 복원',
    market: '야시장에서 구매',
  };
  return (
    <div className="hybrid-lab__split">
      <section>
        <h2>내 조합법</h2>
        {!state.documents.length && (
          <p className="hybrid-lab__muted">
            실험에 성공하거나 폐허에서 문서를 복원하면 조합법이 여기에 기록돼요.
          </p>
        )}
        {state.documents.map((document) => (
          <article key={document.id} className="hybrid-lab__record">
            {document.lineage.artwork && (
              <img src={hybridArtworkUrl(document.lineage.artwork.idleUrl)} alt="" />
            )}
            <div>
              <LineageInfo lineage={document.lineage} />
              <p className="hybrid-lab__muted">
                {sourceLabels[document.source]}
                {document.author ? ` · 기록 ${document.author}` : ''}
                {document.activeListingId ? ' · 판매 중' : ''}
              </p>
            </div>
            <button
              className="hybrid-lab__secondary"
              type="button"
              onClick={() => onUse(document.lineage)}
            >
              조합 고르기
            </button>
            <RecipeDisclosure lineage={document.lineage} tier={document.tier} />
          </article>
        ))}
      </section>
      <aside className="hybrid-lab__quote">
        <h2>버려진 연구소 기록</h2>
        {state.archive.recovered ? (
          <p className="hybrid-lab__muted">
            폐허의 조합법을 복원했어요. 내 조합법에서 확인할 수 있어요.
          </p>
        ) : state.archive.reportReceived ? (
          <>
            <p className="hybrid-lab__muted">
              귀환 보고서에서 건진 기록을 연구 노트에 옮길 수 있어요.
            </p>
            <div className="hybrid-lab__actions">
              <button
                className="hybrid-lab__action"
                type="button"
                disabled={busy}
                onClick={() => run({ kind: 'recover' })}
              >
                조합법 복원
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="hybrid-lab__muted">
              외벽 보관동을 조사하고 탐험가의 귀환 보고서를 받으세요.
            </p>
            <Link className="hybrid-lab__secondary" to={archivePath}>
              외벽 보관동으로
            </Link>
          </>
        )}
      </aside>
    </div>
  );
}

function Listing({
  item,
  gold,
  busy,
  run,
}: {
  item: ExperimentalHybridListing;
  gold: number;
  busy: boolean;
  run: Action;
}) {
  return (
    <article className="hybrid-lab__record">
      {item.lineage.artwork && <img src={hybridArtworkUrl(item.lineage.artwork.idleUrl)} alt="" />}
      <div>
        <LineageInfo lineage={item.lineage} />
        <p className="hybrid-lab__muted">
          {item.seller} · {number.format(item.price)}골드
        </p>
      </div>
      {item.mine ? (
        <button
          className="hybrid-lab__secondary"
          type="button"
          disabled={busy}
          onClick={() => run({ kind: 'cancel', id: item.id })}
        >
          판매 취소
        </button>
      ) : (
        <button
          className="hybrid-lab__action"
          type="button"
          disabled={busy || item.registered || gold < item.price}
          onClick={() => run({ kind: 'buy', id: item.id })}
        >
          {item.registered
            ? '등록한 조합'
            : gold < item.price
              ? '골드 부족'
              : `${number.format(item.price)}골드에 구매`}
        </button>
      )}
      <RecipeDisclosure lineage={item.lineage} tier={item.tier} />
    </article>
  );
}

function Market({
  state,
  busy,
  run,
}: {
  state: ExperimentalHybridState;
  busy: boolean;
  run: Action;
}) {
  const publishable = state.documents.filter(({ canPublish }) => canPublish);
  return (
    <div className="hybrid-lab__split">
      <section>
        <h2>조합 연구자료</h2>
        <p className="hybrid-lab__muted">자료를 구매하면 내 연구 노트에 조합법이 등록돼요.</p>
        {!state.market.length && <p className="hybrid-lab__muted">아직 등록된 매물이 없어요.</p>}
        {state.market.map((item) => (
          <Listing key={item.id} item={item} gold={state.gold} busy={busy} run={run} />
        ))}
      </section>
      <section>
        <h2>내 자료 판매</h2>
        {state.pendingProceeds > 0 && (
          <div className="hybrid-lab__proceeds">
            <div>
              <h3>받을 판매 대금 · {number.format(state.pendingProceeds)}골드</h3>
              <p className="hybrid-lab__muted">금고의 빈 공간만큼 받을 수 있어요.</p>
            </div>
            <button
              className="hybrid-lab__action"
              type="button"
              disabled={busy}
              onClick={() => run({ kind: 'collect' })}
            >
              판매 대금 수령
            </button>
          </div>
        )}
        {!publishable.length && (
          <p className="hybrid-lab__muted">
            {state.documents.some(({ source }) => source !== 'market')
              ? '현재 올릴 수 있는 사본이 없어요. 등록한 매물은 매물 목록에서 확인할 수 있어요.'
              : '직접 발견하거나 복원한 조합법의 사본을 올릴 수 있어요.'}
          </p>
        )}
        {publishable.map((document) => (
          <article key={document.id} className="hybrid-lab__record">
            <LineageInfo lineage={document.lineage} />
            <SellForm document={document} busy={busy} run={run} />
          </article>
        ))}
      </section>
    </div>
  );
}

export default function ExperimentalHybridPage() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: Tab =
    requestedTab === 'notes' || requestedTab === 'market' ? requestedTab : 'experiment';
  const query = useExperimentalHybridState();
  const action = useExperimentalHybridAction();
  const state = query.data;
  const [parentIds, setParentIds] = useState<[string, string]>(['', '']);
  const [focus, setFocus] = useState<RepeatSynthesisFocus>('balanced');
  const [tier, setTier] = useState<ExperimentalHybridTier>(Rarity.EPIC);
  const [stabilizer, setStabilizer] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const pending = useRef<{ signature: string; id: string }>();
  const startPlacement = useGameStore((state) => state.startPlacement);
  const closeModal = useUIStore((state) => state.closeModal);
  const closeSidePanel = useUIStore((state) => state.closeSidePanel);
  const job = state?.job;
  const hasParents = !!state && new Set(state.parents.map(({ speciesId }) => speciesId)).size >= 2;
  const active =
    job?.status === 'incubating' || job?.status === 'generating' || job?.status === 'ready';
  const selection: ExperimentalHybridSelection | null =
    state?.unlocked && tab === 'experiment' && !active && parentIds.every(Boolean)
      ? { parentIds, focus, tier, stabilizer }
      : null;
  const quote = useExperimentalHybridQuote(selection);

  if (!authenticated) return <Navigate to="/" replace />;
  function run(request: ExperimentalHybridAction, onSuccess?: () => void) {
    setFeedback(undefined);
    action.mutate(request, {
      onSuccess: () => {
        onSuccess?.();
        if (request.kind === 'buy')
          setFeedback({ message: '구매한 조합법을 연구 노트에 등록했어요.' });
        if (request.kind === 'list') setFeedback({ message: '부두 야시장에 연구자료를 올렸어요.' });
        if (request.kind === 'collect')
          setFeedback({ message: '받은 판매 대금을 금고에 넣었어요.' });
        if (request.kind === 'cancel') setFeedback({ message: '매물을 거뒀어요.' });
      },
      onError: (error) => setFeedback({ message: error.message, error: true }),
    });
  }
  function start() {
    if (!selection) return;
    const signature = JSON.stringify(selection);
    if (pending.current?.signature !== signature)
      pending.current = { signature, id: createRequestId() };
    run({ kind: 'start', request: { ...selection, requestId: pending.current.id } }, () => {
      pending.current = undefined;
    });
  }
  function useDocument(lineage: ExperimentalHybridIdentity) {
    const parents = lineage.parentSpeciesIds.map(
      (id) =>
        state?.parents.find(
          (parent) => parent.speciesId === id && parent.happiness >= 30 && parent.hunger <= 80,
        )?.id ??
        state?.parents.find((parent) => parent.speciesId === id)?.id ??
        '',
    );
    setFocus(lineage.focus);
    setTier(lineage.species.rarity === Rarity.LEGENDARY ? Rarity.LEGENDARY : Rarity.EPIC);
    setParentIds([parents[0] ?? '', parents[1] ?? '']);
    if (parents.some((id) => !id))
      setFeedback({ message: '재현에 필요한 원종을 파크에 보유해야 해요.' });
    else setFeedback(undefined);
    setParams({});
  }
  function place(id: string, speciesId: string) {
    closeModal();
    closeSidePanel();
    startPlacement({ type: 'dinosaur', id, speciesId });
    navigate('/park');
  }
  return (
    <div className="hybrid-lab">
      <header className="hybrid-lab__header">
        <Link to="/research">← DNA 연구소</Link>
        <h1>{tabs[tab]}</h1>
        {state && <span className="hybrid-lab__balance">{number.format(state.gold)}골드</span>}
      </header>
      <nav className="hybrid-lab__nav" aria-label="하이브리드 연구 메뉴">
        {Object.entries(tabs).map(([id, label]) => (
          <Link
            key={id}
            to={id === 'experiment' ? labPath : `${labPath}?tab=${id}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setFeedback(undefined)}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="hybrid-lab__outer">
        {feedback && (
          <p
            className={feedback.error ? 'hybrid-lab__alert' : 'hybrid-lab__muted'}
            role={feedback.error ? 'alert' : 'status'}
          >
            {feedback.message}
          </p>
        )}
        {query.error && (
          <div className="hybrid-lab__alert" role="alert">
            <p>{query.error.message}</p>
            <button
              className="hybrid-lab__secondary"
              type="button"
              onClick={() => void query.refetch()}
            >
              다시 불러오기
            </button>
          </div>
        )}
        {query.isPending && <p role="status">연구 노트를 불러오고 있어요…</p>}
        {state && !state.unlocked && (
          <section className="hybrid-lab__quote">
            <h2>실험 합성 준비</h2>
            <ul className="hybrid-lab__notes">
              {state.lockReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div className="hybrid-lab__actions">
              <Link
                className="hybrid-lab__secondary"
                to="/research?technology=gene-analysis&level=2"
              >
                유전자 분석 연구
              </Link>
              <Link
                className="hybrid-lab__secondary"
                to="/research?facility=research-dna-lab&level=5"
              >
                DNA 연구소 시설
              </Link>
              <Link className="hybrid-lab__secondary" to="/park?panel=growth">
                파크 성장 목표
              </Link>
            </div>
          </section>
        )}
        {state?.unlocked && tab === 'notes' && (
          <Notebook state={state} busy={action.isPending} run={run} onUse={useDocument} />
        )}
        {state?.unlocked && tab === 'market' && (
          <Market state={state} busy={action.isPending} run={run} />
        )}
        {state?.unlocked && tab === 'experiment' && (
          <>
            {job && (
              <ExperimentJob
                job={job}
                serverTime={state.serverTime}
                updatedAt={query.dataUpdatedAt}
                busy={action.isPending}
                onClaim={() => run({ kind: 'claim', id: job.id })}
                onPlace={place}
              />
            )}
            {!active && (
              <div className="hybrid-lab__split">
                <section>
                  <h2>원종과 성향 선택</h2>
                  <fieldset disabled={action.isPending || !hasParents}>
                    <ParentSelect
                      label="첫 번째 원종"
                      parents={state.parents}
                      selected={parentIds[0]}
                      other={parentIds[1]}
                      onChange={(id) => setParentIds([id, parentIds[1]])}
                    />
                    <ParentSelect
                      label="두 번째 원종"
                      parents={state.parents}
                      selected={parentIds[1]}
                      other={parentIds[0]}
                      onChange={(id) => setParentIds([parentIds[0], id])}
                    />
                    <div className="hybrid-lab__choices">
                      <label className="hybrid-lab__field">
                        성향
                        <select
                          value={focus}
                          onChange={({ target }) => setFocus(target.value as RepeatSynthesisFocus)}
                        >
                          {Object.entries(focuses).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="hybrid-lab__field">
                        결과 등급
                        <select
                          value={tier}
                          onChange={({ target }) => setTier(target.value as ExperimentalHybridTier)}
                        >
                          <option value={Rarity.EPIC}>영웅 · 중급 이상</option>
                          <option value={Rarity.LEGENDARY}>전설 · 상급</option>
                        </select>
                      </label>
                    </div>
                    <label className="hybrid-lab__check">
                      <input
                        type="checkbox"
                        checked={stabilizer}
                        onChange={({ target }) => setStabilizer(target.checked)}
                      />
                      안정제 1개 사용
                    </label>
                  </fieldset>
                  {!hasParents && (
                    <Link className="hybrid-lab__secondary" to="/exploration">
                      원종을 찾으러 탐험으로
                    </Link>
                  )}
                </section>
                <Quote
                  quote={quote.data}
                  error={quote.error}
                  loading={!!selection && quote.isFetching}
                  busy={action.isPending}
                  onStart={start}
                  onRetry={() => void quote.refetch()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
