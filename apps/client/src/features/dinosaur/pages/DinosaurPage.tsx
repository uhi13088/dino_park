import { useEffect, useMemo, useRef } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  CODEX_ORIGIN_LABELS,
  CODEX_RARITY_LABELS,
  DinosaurOrigin,
  Rarity,
} from '@dino-park/shared';
import { tokenManager, useDinosaurCodex } from '@/api';
import {
  growthOriginParams,
  parkGrowthHref,
  parseParkGrowthStage,
} from '@/utils/parkGrowthNavigation';
import { CodexArtwork } from '../components/CodexArtwork';
import { CodexDetail } from '../components/CodexDetail';
import './DinosaurCodex.css';

const RARITIES = Object.values(Rarity);
const ORIGINS = Object.values(DinosaurOrigin);

/** Existing park palette and type; a searchable collection with a persistent reading pane.
 * Mobile opens the same detail as a full reading view. Collection figures come only from the API.
 */
export default function DinosaurPage() {
  const { data, isPending, isError, isFetching, refetch } = useDinosaurCodex();
  const [params, setParams] = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const detailPaneRef = useRef<HTMLElement>(null);
  const lastCardRef = useRef<HTMLButtonElement | null>(null);
  const returnCardFocus = useRef(false);
  const search = params.get('q') ?? '';
  const rarity = params.get('rarity') ?? '';
  const origin = params.get('origin') ?? '';
  const collection = params.get('collection') ?? '';
  const requestedSpecies = params.get('species');
  const originStage =
    params.get('from') === 'growth' ? parseParkGrowthStage(params.get('stage')) : undefined;
  const selectedEntry = data?.entries.find((entry) => entry.speciesId === requestedSpecies);
  const selectedSpeciesId = selectedEntry?.speciesId ?? null;

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ko');
    return (data?.entries ?? [])
      .filter((entry) => {
        if (RARITIES.includes(rarity as Rarity) && entry.rarity !== rarity) return false;
        if (ORIGINS.includes(origin as DinosaurOrigin) && entry.origin !== origin) return false;
        if (collection === 'owned' && !entry.collection.ownedCount) return false;
        if (collection === 'collected' && !entry.collection.collected) return false;
        if (collection === 'missing' && entry.collection.collected) return false;
        return !query || (entry.nameKo + ' ' + entry.name).toLocaleLowerCase('ko').includes(query);
      })
      .sort(
        (a, b) =>
          Number(b.collection.collected) - Number(a.collection.collected) ||
          RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) ||
          a.nameKo.localeCompare(b.nameKo, 'ko'),
      );
  }, [data, search, rarity, origin, collection]);

  const detail = selectedEntry ?? filtered[0];
  const detailSpeciesId = detail?.speciesId ?? null;
  useEffect(() => {
    if (detailPaneRef.current) detailPaneRef.current.scrollTop = 0;
    if (selectedSpeciesId) {
      headingRef.current?.focus({ preventScroll: true });
    } else if (returnCardFocus.current) {
      if (lastCardRef.current?.isConnected) lastCardRef.current.focus();
      returnCardFocus.current = false;
    }
  }, [detailSpeciesId, selectedSpeciesId]);

  function setFilter(name: string, value: string) {
    if (name !== 'species' || value) returnCardFocus.current = false;
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(name, value);
        else next.delete(name);
        if (name !== 'species') next.delete('species');
        return next;
      },
      { replace: name !== 'species', preventScrollReset: true },
    );
  }

  function clearFilters() {
    returnCardFocus.current = false;
    setParams(originStage === undefined ? {} : growthOriginParams(originStage), {
      replace: true,
      preventScrollReset: true,
    });
  }

  function closeDetail() {
    if (!selectedSpeciesId) return;
    returnCardFocus.current = true;
    setFilter('species', '');
  }

  if (!tokenManager.isAuthenticated()) return <Navigate to="/" replace />;
  if (isPending)
    return (
      <div className="codex-state" role="status">
        <h1>공룡 도감</h1>
        <p>도감을 불러오고 있어요…</p>
      </div>
    );
  if (isError || !data)
    return (
      <div className="codex-state" role="alert">
        <h1>도감을 불러오지 못했어요</h1>
        <p>연결 상태를 확인한 뒤 다시 시도해 주세요.</p>
        <button className="codex-action" onClick={() => void refetch()}>
          다시 불러오기
        </button>
      </div>
    );

  const summary = data.summary;
  return (
    <div className={'codex-page' + (selectedEntry ? ' has-selection' : '')}>
      <header className="codex-heading">
        <div>
          <h1>공룡 도감</h1>
          <p data-testid="codex-summary">
            수집{' '}
            <strong>
              {summary.collectedSpecies}/{summary.totalSpecies}종
            </strong>{' '}
            · 현재 {summary.ownedDinosaurs}마리 보유
          </p>
          <progress
            aria-label="도감 수집 진행"
            max={summary.totalSpecies || 1}
            value={summary.collectedSpecies}
          />
        </div>
        {originStage !== undefined && !selectedEntry && (
          <Link className="codex-growth-return" to={parkGrowthHref(originStage)}>
            ← 성장 목표
          </Link>
        )}
        <button
          className="codex-refresh"
          aria-label="도감 새로고침"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>
      <div className="codex-toolbar">
        <label className="codex-search">
          <span className="sr-only">공룡 이름 검색</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="6" />
            <path d="m15 15 5 5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            maxLength={100}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="이름으로 공룡 찾기"
          />
        </label>
        <div className="codex-select-row">
          <label>
            공룡 등급
            <select
              value={RARITIES.includes(rarity as Rarity) ? rarity : ''}
              onChange={(event) => setFilter('rarity', event.target.value)}
            >
              <option value="">모든 등급</option>
              {RARITIES.map((value) => (
                <option key={value} value={value}>
                  {CODEX_RARITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            수집 상태
            <select
              value={['owned', 'collected', 'missing'].includes(collection) ? collection : ''}
              onChange={(event) => setFilter('collection', event.target.value)}
            >
              <option value="">전체 공룡</option>
              <option value="owned">현재 보유 중</option>
              <option value="collected">수집 완료</option>
              <option value="missing">아직 미수집</option>
            </select>
          </label>
        </div>
        <div className="codex-origin-filters" role="group" aria-label="공룡 계보">
          <button
            aria-pressed={!ORIGINS.includes(origin as DinosaurOrigin)}
            onClick={() => setFilter('origin', '')}
          >
            전체
          </button>
          {ORIGINS.map((value) => (
            <button
              key={value}
              aria-pressed={origin === value}
              onClick={() => setFilter('origin', value)}
            >
              {CODEX_ORIGIN_LABELS[value]}
            </button>
          ))}
        </div>
      </div>
      <div className="codex-workspace">
        <section className="codex-list" aria-label="공룡 목록">
          <div className="codex-list-heading">
            <p role="status">{filtered.length}종 표시</p>
            {(search || rarity || origin || collection) && (
              <button onClick={clearFilters}>필터 초기화</button>
            )}
          </div>
          {requestedSpecies && !selectedEntry && (
            <p className="codex-muted">
              선택한 공룡을 찾을 수 없어요. 목록에서 다시 선택해 주세요.
            </p>
          )}
          {filtered.length ? (
            <div className="codex-grid">
              {filtered.map((entry) => (
                <button
                  key={entry.speciesId}
                  className={
                    'codex-card' +
                    (entry.collection.collected ? ' is-collected' : '') +
                    (detail?.speciesId === entry.speciesId ? ' is-selected' : '')
                  }
                  data-testid={'codex-entry-' + entry.speciesId}
                  data-collected={entry.collection.collected}
                  aria-label={entry.nameKo + ' 상세 보기'}
                  aria-describedby={
                    entry.speciesId +
                    '-rarity ' +
                    entry.speciesId +
                    '-origin ' +
                    entry.speciesId +
                    '-status'
                  }
                  onClick={(event) => {
                    lastCardRef.current = event.currentTarget;
                    setFilter('species', entry.speciesId);
                  }}
                >
                  <div className="codex-card-badges">
                    <span
                      id={entry.speciesId + '-rarity'}
                      className={'codex-rarity rarity-' + entry.rarity}
                    >
                      {CODEX_RARITY_LABELS[entry.rarity]}
                    </span>
                    <span id={entry.speciesId + '-origin'} className="codex-card-origin">
                      {CODEX_ORIGIN_LABELS[entry.origin]}
                    </span>
                  </div>
                  <CodexArtwork entry={entry} silhouette={!entry.collection.collected} />
                  <strong className="codex-card-name">{entry.nameKo}</strong>
                  <span
                    id={entry.speciesId + '-status'}
                    className={
                      'codex-card-status' + (entry.collection.ownedCount ? ' codex-owned-text' : '')
                    }
                  >
                    {entry.collection.ownedCount
                      ? entry.collection.ownedCount + '마리 보유'
                      : entry.collection.collected
                        ? '수집 완료'
                        : '미수집'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="codex-empty">
              <h2>조건에 맞는 공룡이 없어요</h2>
              <p>다른 이름이나 등급으로 찾아보세요.</p>
              <button className="codex-action" onClick={clearFilters}>
                전체 공룡 보기
              </button>
            </div>
          )}
          {summary.unlistedOwnedCount > 0 && (
            <p className="codex-muted">
              현재 도감에 등록되지 않은 보유 공룡이 {summary.unlistedOwnedCount}마리 있어요.
            </p>
          )}
        </section>
        {detail && (
          <CodexDetail
            entry={detail}
            entries={data.entries}
            onSelect={(speciesId) => setFilter('species', speciesId)}
            onBack={closeDetail}
            headingRef={headingRef}
            paneRef={detailPaneRef}
            growthReturnPath={
              originStage === undefined || !selectedEntry ? undefined : parkGrowthHref(originStage)
            }
          />
        )}
      </div>
    </div>
  );
}
