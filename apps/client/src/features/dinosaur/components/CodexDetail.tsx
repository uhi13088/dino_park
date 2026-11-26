import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import {
  CODEX_CATEGORY_LABELS,
  CODEX_ORIGIN_LABELS,
  CODEX_RARITY_LABELS,
  CODEX_SIZE_LABELS,
  DinosaurOrigin,
  MATERIAL_QUALITY_LABELS,
  RESEARCH_MATERIAL_LABELS,
  type DinosaurCodexEntry,
} from '@dino-park/shared';
import { CodexArtwork } from './CodexArtwork';

function durationLabel(milliseconds: number | null): string {
  if (milliseconds === null) return '미정';
  const minutes = milliseconds / 60000;
  return minutes >= 60 ? `${minutes / 60}시간` : `${minutes}분`;
}

export function CodexDetail({
  entry,
  entries,
  onSelect,
  onBack,
  headingRef,
  paneRef,
  growthReturnPath,
}: {
  entry: DinosaurCodexEntry;
  entries: DinosaurCodexEntry[];
  onSelect: (speciesId: string) => void;
  onBack: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
  paneRef: RefObject<HTMLElement>;
  growthReturnPath?: string;
}) {
  const recipe = entry.recipe;
  return (
    <aside
      ref={paneRef}
      className="codex-detail"
      aria-labelledby="codex-detail-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onBack();
      }}
    >
      <button className="codex-back" onClick={onBack}>
        ← 목록으로
      </button>
      {growthReturnPath && (
        <Link className="codex-growth-return" to={growthReturnPath}>
          ← 성장 목표
        </Link>
      )}
      <div className={`codex-detail-portrait origin-${entry.origin}`}>
        <CodexArtwork entry={entry} />
        <span className="codex-collection-label">
          {entry.collection.ownedCount
            ? `${entry.collection.ownedCount}마리 보유 중`
            : entry.collection.collected
              ? '수집 완료 · 현재 미보유'
              : '아직 만나지 못한 공룡'}
        </span>
      </div>
      <div className="codex-detail-body">
        <div className="codex-badges">
          <span className={`codex-rarity rarity-${entry.rarity}`}>
            {CODEX_RARITY_LABELS[entry.rarity]}
          </span>
          <span className="codex-origin">{CODEX_ORIGIN_LABELS[entry.origin]}</span>
        </div>
        <h2 id="codex-detail-title" ref={headingRef} tabIndex={-1}>
          {entry.nameKo}
        </h2>
        <p className="codex-english-name" lang="en">
          {entry.name}
        </p>
        <p className="codex-description">{entry.description}</p>
        <dl className="codex-facts">
          <div>
            <dt>분류</dt>
            <dd>{CODEX_CATEGORY_LABELS[entry.category]}</dd>
          </div>
          <div>
            <dt>크기</dt>
            <dd>{CODEX_SIZE_LABELS[entry.size]}</dd>
          </div>
          <div>
            <dt>인기도</dt>
            <dd>{entry.popularity}</dd>
          </div>
          <div>
            <dt>유지비</dt>
            <dd>{entry.maintenanceCost.toLocaleString()}골드/시간</dd>
          </div>
        </dl>
        <section className="codex-detail-section">
          <h3>지낼 수 있는 곳</h3>
          <p>{entry.habitatNames.join(' · ')}</p>
        </section>
        <section className="codex-detail-section">
          <h3>획득 방법</h3>
          <p>
            <strong>{entry.acquisition.title}</strong>
          </p>
          <p>{entry.acquisition.description}</p>
          {entry.origin === DinosaurOrigin.NATURAL && (
            <p className="codex-muted">
              일반 알 부화 시간 {durationLabel(entry.hatchTimeMs)} · 첫 튜토리얼 시간은 별도예요.
            </p>
          )}
        </section>
        <section className="codex-detail-section" aria-label="합성 레시피">
          <div className="codex-section-heading">
            <h3>합성 레시피</h3>
            <span className="codex-muted">
              {recipe ? (entry.experimental ? '실험 연구자료' : '연구 개방 예정') : ''}
            </span>
          </div>
          {recipe ? (
            <>
              <p className="codex-muted">원종을 실제 보유해야 해요. 합성 후에도 원종은 남습니다.</p>
              {recipe.firstSynthesisRule && (
                <p className="codex-planned-note">
                  첫 지정 합성은 {Math.round(recipe.firstSynthesisRule.successRate * 100)}% 성공해{' '}
                  {entry.nameKo} 1마리를 얻어요. 파크당 한 번 적용하며, 이후 반복 연구는 아래 기본
                  확률을 따릅니다.
                </p>
              )}
              <ul className="codex-parent-list" aria-label="필요한 원종">
                {recipe.parentSpeciesIds.map((speciesId) => {
                  const parent = entries.find((candidate) => candidate.speciesId === speciesId);
                  return (
                    <li key={speciesId}>
                      <button className="codex-parent-link" onClick={() => onSelect(speciesId)}>
                        {parent?.nameKo ?? speciesId} <span aria-hidden="true">↗</span>
                      </button>
                      <span
                        className={
                          parent?.collection.ownedCount ? 'codex-owned-text' : 'codex-muted'
                        }
                      >
                        {parent?.collection.ownedCount
                          ? `${parent.collection.ownedCount}마리 보유`
                          : '현재 미보유'}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <table className="codex-ingredients">
                <caption>필요한 탐험 재료</caption>
                <thead>
                  <tr>
                    <th scope="col">재료</th>
                    <th scope="col">최소 품질</th>
                    <th scope="col">수량</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ingredient) => (
                    <tr key={ingredient.material}>
                      <th scope="row">{RESEARCH_MATERIAL_LABELS[ingredient.material]}</th>
                      <td>{MATERIAL_QUALITY_LABELS[ingredient.quality]}</td>
                      <td>{ingredient.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="codex-facts codex-research-facts">
                <div>
                  <dt>연구비</dt>
                  <dd>
                    {recipe.goldCost === null ? '미정' : `${recipe.goldCost.toLocaleString()}골드`}
                  </dd>
                </div>
                <div>
                  <dt>연구 시간</dt>
                  <dd>{durationLabel(recipe.durationMs)}</dd>
                </div>
                <div>
                  <dt>반복 합성 성공률</dt>
                  <dd>{Math.round(recipe.successRate * 100)}%</dd>
                </div>
                <div>
                  <dt>반복 합성 실패율</dt>
                  <dd>{Math.round((1 - recipe.successRate) * 100)}%</dd>
                </div>
              </dl>
              <p className="codex-muted">
                일반 연구에서 연속 실패 시 최대 {recipe.guaranteedAttempt}번째에 성공해요.
              </p>
              <p className="codex-muted">
                실패하면 필수 재료의 80%를 내림해 돌려줘요.
                {recipe.status !== 'first_available' &&
                  ' 선택 재료인 안정제를 쓰면 다른 필수 재료를 보호할 수 있어요.'}
              </p>
              <p className="codex-planned-note">
                {recipe.status === 'first_available'
                  ? '파크의 첫 합성 목표에서 시작해요. 첫 전시를 마치면 탐험 기지에서 성향을 골라 반복 합성할 수 있어요.'
                  : '아직 연구가 개방되지 않았어요. 원종과 재료를 미리 확인할 수 있어요.'}
                {recipe.status === 'draft' ? ' 연구비와 시간은 정해지면 안내할게요.' : ''}
              </p>
            </>
          ) : (
            <p className="codex-muted">
              {entry.origin === DinosaurOrigin.NATURAL
                ? '탐험·부화나 스토리로 만나는 자연종입니다. 공개된 합성 레시피는 없어요.'
                : '상세 원종·재료·비용을 정리하고 있어요. 레시피가 공개되면 이곳에서 확인할 수 있습니다.'}
            </p>
          )}
        </section>
        {entry.collection.firstCollectedAt && (
          <p className="codex-registration-date">
            첫 수집{' '}
            {new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'long' }).format(
              new Date(entry.collection.firstCollectedAt),
            )}{' '}
            · 등록은 방생 후에도 남아요.
          </p>
        )}
      </div>
    </aside>
  );
}
