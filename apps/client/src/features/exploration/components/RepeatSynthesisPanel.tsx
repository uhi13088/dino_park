import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDinosaurById } from '@dino-park/game-data';
import {
  DINOSAUR_COMPETITIVE_STAT_LABELS,
  MATERIAL_QUALITY_LABELS,
  RESEARCH_MATERIAL_LABELS,
  type DinosaurCompetitiveStats,
  type FirstSynthesisParent,
  type RepeatSynthesisFocus,
} from '@dino-park/shared';
import { useRepeatSynthesis, useRepeatSynthesisAction } from '@/api/queries/repeatSynthesis';
import { Button } from '@/components/ui';

const traits = Object.entries(DINOSAUR_COMPETITIVE_STAT_LABELS) as [
  keyof DinosaurCompetitiveStats,
  string,
][];
const healthy = ({ happiness, hunger }: FirstSynthesisParent) => happiness >= 30 && hunger <= 80;
const timeLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function RepeatSynthesisPanel() {
  const query = useRepeatSynthesis();
  const synthesis = useRepeatSynthesisAction();
  const [focus, setFocus] = useState<RepeatSynthesisFocus>('balanced');
  const [selectedParents, setSelectedParents] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now);
  const pendingRequest = useRef<{ signature: string; id: string }>();
  const state = query.data;
  const job = state?.job;
  const pending = job?.status === 'incubating' || job?.status === 'ready';

  useEffect(() => {
    if (job?.status !== 'incubating') return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [job?.status]);

  if (!state)
    return (
      <section className="hybrid-panel" aria-label="스테고케라톱스 반복 합성">
        <p role={query.isError ? 'alert' : 'status'}>
          {query.isError ? query.error.message : '반복 합성을 준비하고 있어요…'}
        </p>
        {query.isError && <Button onClick={() => void query.refetch()}>다시 불러오기</Button>}
      </section>
    );
  if (!state.unlocked) return null;

  const selected = state.focuses.find((option) => option.id === focus) ?? state.focuses[0];
  const groups = state.recipe.parentSpeciesIds.map((id) => {
    const parents = state.parents.filter((parent) => parent.speciesId === id);
    const parent =
      parents.find((item) => item.id === selectedParents[id]) ??
      parents.find(healthy) ??
      parents[0];
    return { id, parents, parent };
  });
  const parentIds = groups.flatMap(({ parent }) => (parent ? [parent.id] : []));
  const eligible = groups.every(({ parent }) => parent && healthy(parent));
  const clock = Date.parse(state.serverTime) + Math.max(0, now - query.dataUpdatedAt);
  const seconds = job ? Math.max(0, Math.ceil((Date.parse(job.readyAt) - clock) / 1000)) : 0;
  const requestSynthesis = () => {
    const signature = JSON.stringify([focus, parentIds]);
    if (signature !== pendingRequest.current?.signature)
      pendingRequest.current = { signature, id: crypto.randomUUID() };
    synthesis.mutate(
      { kind: 'start', request: { focus, parentIds, requestId: pendingRequest.current.id } },
      {
        onSuccess: () => {
          pendingRequest.current = undefined;
        },
      },
    );
  };

  return (
    <section className="hybrid-panel" aria-labelledby="repeat-synthesis-title">
      <header className="hybrid-section-heading">
        <div>
          <h2 id="repeat-synthesis-title">스테고케라톱스 반복 합성</h2>
          <p>성향을 고르고, 새 개체의 매력도와 경기 능력치를 확인하세요.</p>
        </div>
        <span className="hybrid-balance">{state.gold.toLocaleString()}골드</span>
      </header>
      {(synthesis.error || query.error) && (
        <p className="hybrid-error" role="alert">
          {synthesis.error?.message ?? query.error?.message}
        </p>
      )}

      {job?.status === 'succeeded' && job.result && (
        <div className="hybrid-callout">
          <div>
            <h3>새 스테고케라톱스가 태어났어요</h3>
            <p>{traits.map(([key, label]) => `${label} ${job.result?.stats[key]}`).join(' · ')}</p>
          </div>
          {job.result.owned && (
            <Link
              className="hybrid-text-link"
              to={`/park?compareHybrid=${encodeURIComponent(job.result.dinosaurId)}`}
            >
              새 공룡 비교하기
            </Link>
          )}
        </div>
      )}
      {job?.status === 'failed' && (
        <div className="hybrid-callout" role="status">
          <div>
            <h3>배양에 실패했어요</h3>
            <p>
              {job.refunded
                .map((item) => `${RESEARCH_MATERIAL_LABELS[item.material]} ${item.amount}개`)
                .join(' · ')}{' '}
              반환
            </p>
          </div>
        </div>
      )}
      {job && pending ? (
        <div className="hybrid-callout">
          <div>
            <h3>
              {job.status === 'ready' || seconds === 0
                ? '배양이 끝났어요'
                : `배양 중 · ${timeLabel(seconds)}`}
            </h3>
            <p>
              {state.focuses.find((option) => option.id === job.focus)?.label} · 성공률{' '}
              {Math.round(state.successChance * 100)}%
            </p>
          </div>
          <Button
            disabled={job.status !== 'ready' && seconds > 0}
            isLoading={synthesis.isPending}
            onClick={() => synthesis.mutate({ kind: 'claim', id: job.id })}
          >
            합성 결과 수령
          </Button>
        </div>
      ) : (
        <>
          <div className="hybrid-recipe">
            <fieldset>
              <legend className="font-bold">합성 성향</legend>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                {state.focuses.map((option) => (
                  <label
                    key={option.id}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-green-200 px-3 text-sm"
                  >
                    <input
                      type="radio"
                      name="repeat-synthesis-focus"
                      checked={focus === option.id}
                      onChange={() => setFocus(option.id)}
                      disabled={synthesis.isPending}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <div className="mt-3" aria-label="합성 성공 시 능력치별 확률">
                <h3>{selected.label} · 능력치별 확률</h3>
                <dl className="hybrid-materials">
                  {traits.map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {selected.outcomes[key]
                          .map(({ value, chance }) => `${value} (${chance}%)`)
                          .join(' · ')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </fieldset>
            <div>
              <h3>원종 선택</h3>
              {groups.map(({ id, parents, parent }) => {
                const name = getDinosaurById(id)?.nameKo ?? id;
                return (
                  <label className="hybrid-parent" key={id}>
                    {name}
                    {parents.length ? (
                      <select
                        value={parent?.id ?? ''}
                        disabled={synthesis.isPending}
                        onChange={({ target }) =>
                          setSelectedParents({ ...selectedParents, [id]: target.value })
                        }
                      >
                        {parents.map((item, index) => (
                          <option key={item.id} value={item.id}>
                            {item.nickname ?? `개체 ${index + 1}`} · 행복 {item.happiness} · 허기{' '}
                            {item.hunger}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="hybrid-detail">알을 부화해 개체를 받아주세요.</span>
                    )}
                  </label>
                );
              })}
              <p className="hybrid-detail">
                행복 30 이상 · 허기 80 이하. 합성 후에도 두 원종이 남아요.
              </p>
            </div>
          </div>
          <div className="hybrid-recipe">
            <div>
              <h3>합성에 쓰는 재료</h3>
              <dl className="hybrid-materials">
                {state.ingredients.map((item) => (
                  <div key={item.material}>
                    <dt>
                      {MATERIAL_QUALITY_LABELS[item.quality]}{' '}
                      {RESEARCH_MATERIAL_LABELS[item.material]}
                    </dt>
                    <dd>
                      {item.available}/{item.amount}개
                    </dd>
                  </div>
                ))}
              </dl>
              <Link className="hybrid-text-link" to="/exploration">
                주행 탐험에서 재료 모으기
              </Link>
            </div>
            <div>
              <h3>실패 시 되돌려 받는 재료</h3>
              <dl className="hybrid-materials">
                {state.ingredients.map((item) => (
                  <div key={item.material}>
                    <dt>{RESEARCH_MATERIAL_LABELS[item.material]}</dt>
                    <dd>{item.failureRefund}개</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="hybrid-callout">
            <div>
              <h3>
                {state.attempt}번째 시도 · 성공률 {Math.round(state.successChance * 100)}%
              </h3>
              <p>
                {state.guaranteedAttempt}번째 시도까지 성공 보장 ·{' '}
                {state.recipe.goldCost?.toLocaleString()}골드 ·{' '}
                {(state.recipe.durationMs ?? 0) / 60_000}분
              </p>
              {!!state.missing.length && (
                <ul className="hybrid-checklist">
                  {state.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <Button
              disabled={state.missing.length > 0 || !eligible}
              isLoading={synthesis.isPending}
              onClick={requestSynthesis}
            >
              반복 합성 시작
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
