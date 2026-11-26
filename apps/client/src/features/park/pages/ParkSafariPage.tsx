import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getSafariCarnivoreSizeIssue,
  getSafariExpansionGold,
  inspectSafariLayout,
  isSafariRouteUsable,
  PARK_SAFARI,
  type SafariTile,
  type SafariZoneKind,
} from '@dino-park/shared';
import { ApiError, useBuildings, useParkOperations } from '@/api';
import { useParkSafari, useSaveParkSafari } from '@/api/queries/safari';
import SafariMap from './SafariMap';
import { safariDinosaurArt } from './drawSafariPark';
import {
  applySafariTool,
  createSafariDraft,
  safariDraftLayout,
  safariTileKey,
  safariZoneLabels,
  safariZones,
  type SafariDraft,
  type SafariTool,
} from './safariEditor';
import './ParkSafariPage.css';

const tools: { key: SafariTool | 'pan'; label: string; icon: string }[] = [
  {
    key: 'pan',
    label: '이동',
    icon: 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3',
  },
  {
    key: 'fence',
    label: '울타리',
    icon: 'M3 20V8l2-3 2 3v12m3 0V8l2-3 2 3v12m3 0V8l2-3 2 3v12M3 10h18M3 16h18',
  },
  {
    key: 'water',
    label: '물가',
    icon: 'M12 3C9.2 7.2 6 10.5 6 14.7a6 6 0 0 0 12 0c0-4.2-3.2-7.5-6-11.7ZM9 15c0 1.8 1 2.8 2.5 3',
  },
  {
    key: 'brush',
    label: '수풀',
    icon: 'M12 21v-6m-5 1a4 4 0 0 1-2-7.5 4.5 4.5 0 0 1 7-3.8 4.5 4.5 0 0 1 7 3.8A4 4 0 0 1 17 16H7Z',
  },
  {
    key: 'stop',
    label: '정차 지점',
    icon: 'M19 10c0 4.9-7 9.8-7 9.8S5 14.9 5 10a7 7 0 0 1 14 0ZM14.2 10a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0Z',
  },
];

const descriptions: Record<Exclude<SafariTool, 'stop'>, string> = {
  fence: '빈 땅을 누르거나 쓸어 우리를 넓혀요. 울타리 안에서 시작하면 그 칸을 빼요.',
  water: '우리 안을 눌러 물가를 놓거나 옮겨요.',
  brush: '수풀은 공룡이 숨는 곳이에요. 정차 지점에서 물가까지의 시야를 가릴 수 있어요.',
};

const stopDescriptions: Record<SafariZoneKind, string> = {
  herbivore: '초식 우리 바깥에서 울타리에 붙은 빈 곳을 눌러요.',
  carnivore: '육식 우리 안에서 물가와 수풀이 없는 곳을 눌러요. 출입문은 코스에 맞춰 생겨요.',
};

const stopLabels: Record<SafariZoneKind, string> = {
  herbivore: '초식 우리 바깥',
  carnivore: '육식 우리 안',
};

const gold = (count: number) => count.toLocaleString('ko-KR');
const goldIcon = '/assets/ui/park-hud/gold.webp';
const jeepArt = '/assets/safari-encounter/jeep.webp';
const emptyObjects: [] = [];

type EditState = { revision: number; draft: SafariDraft };
type EditorStage = 0 | 1 | undefined;

function BackLink() {
  return (
    <Link to="/park" className="park-safari__back" aria-label="파크로 돌아가기">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m14 6-6 6 6 6" />
      </svg>
    </Link>
  );
}

function SafariStatus({ children }: { children: ReactNode }) {
  return (
    <main className="park-safari park-safari--status">
      <header className="park-safari__header">
        <BackLink />
        <h1>사파리 관리</h1>
      </header>
      <div className="park-safari__status">{children}</div>
    </main>
  );
}

export default function ParkSafariPage() {
  const safariRead = useParkSafari();
  const buildingRead = useBuildings();
  const operationsRead = useParkOperations();
  const save = useSaveParkSafari();
  const [edit, setEdit] = useState<EditState | null>(null);
  const liveEdit = useRef<EditState | null>(null);
  const [selectedZone, setSelectedZone] = useState<SafariZoneKind>('herbivore');
  const [tool, setTool] = useState<SafariTool | null>('fence');
  const [notice, setNotice] = useState('');
  const [stage, setStage] = useState<EditorStage>();
  const [traveling, setTraveling] = useState(false);
  const arrive = useCallback(() => {
    setStage(1);
    setTraveling(false);
  }, []);
  const safari = safariRead.data;
  const blocked = useMemo(
    () => new Set(safari?.blockedTiles.map(safariTileKey)),
    [safari?.blockedTiles],
  );
  const savedDraft = useMemo(() => safari && createSafariDraft(safari.layout), [safari]);
  const draft = edit?.draft ?? savedDraft;

  if (!safari || !draft) {
    return (
      <SafariStatus>
        {safariRead.isError ? (
          <>
            <p>사파리 정보를 불러오지 못했어요.</p>
            <button type="button" onClick={() => void safariRead.refetch()}>
              다시 불러오기
            </button>
          </>
        ) : (
          <p role="status">사파리 지도를 불러오는 중이에요.</p>
        )}
      </SafariStatus>
    );
  }

  const canEdit = safari.parkLevel >= PARK_SAFARI.unlockParkLevel;
  const zone = draft.zones[selectedZone];
  const activeTour = stage !== undefined;
  const viewing = stage === undefined || traveling ? undefined : safari.tour?.views[stage];
  const layout = safariDraftLayout(draft);
  const changed = edit !== null && JSON.stringify(layout) !== JSON.stringify(safari.layout);
  const stopCount = layout.stops.length;
  const cost = getSafariExpansionGold(layout, safari.purchasedTiles);
  const conflict = save.error instanceof ApiError && save.error.status === 409;
  const existingCarnivoreTiles = safari.layout.zones.carnivore.tiles;
  const preview = inspectSafariLayout(layout, safari.bounds, safari.blockedTiles, {
    existingCarnivoreTiles,
  });
  const savedRoute = safari.tour?.path;
  const route =
    savedRoute &&
    !preview.issue &&
    isSafariRouteUsable(layout, safari.bounds, safari.blockedTiles, savedRoute)
      ? savedRoute
      : preview.path;
  const layoutIssue =
    stopCount === 1
      ? '초식 우리 바깥과 육식 우리 안에 정차 지점을 한 곳씩 놓아주세요.'
      : preview.issue;
  const zoneIssue = selectedZone === 'carnivore' ? safari.carnivoreUnavailableReason : null;
  const eligible = safari.dinosaurs.filter((dino) => dino.zoneKind === selectedZone);
  const unavailable = !canEdit || save.isPending;

  function changeDraft(next: SafariDraft) {
    const row = { revision: liveEdit.current?.revision ?? safari!.revision, draft: next };
    liveEdit.current = row;
    setEdit(row);
  }

  function resetEdit() {
    liveEdit.current = null;
    setEdit(null);
    setNotice('');
    save.reset();
  }

  function applyTool(tile: SafariTile, remove: boolean) {
    if (unavailable || !tool) return;
    if (save.error && !conflict) save.reset();
    const before = liveEdit.current?.draft ?? draft!;
    const result = applySafariTool(
      before,
      selectedZone,
      tool,
      tile,
      remove,
      blocked,
      existingCarnivoreTiles,
    );
    if (result.draft !== before) changeDraft(result.draft);
    setNotice(result.message ?? '');
  }

  function assignDinosaur(id: string, remove = false) {
    if (unavailable) return;
    const before = liveEdit.current?.draft ?? draft!;
    const pen = before.zones[selectedZone];
    if (save.error && !conflict) save.reset();
    const dinosaurIds = remove
      ? pen.dinosaurIds.filter((chosen) => chosen !== id)
      : [...pen.dinosaurIds, id];
    changeDraft({ ...before, zones: { ...before.zones, [selectedZone]: { ...pen, dinosaurIds } } });
    setNotice('');
  }

  function saveDraft() {
    if (!edit || layoutIssue || cost > safari!.gold || unavailable) return;
    save.mutate(
      { revision: edit.revision, layout },
      {
        onSuccess: () => {
          resetEdit();
          setNotice('사파리 배치를 저장했어요.');
        },
      },
    );
  }

  const availableDinos = eligible.filter((dino) => !zone.dinosaurIds.includes(dino.id));
  const assigned = eligible.filter((dino) => zone.dinosaurIds.includes(dino.id));
  const minimum = PARK_SAFARI.minTiles[selectedZone];
  const penReady =
    selectedZone === 'carnivore'
      ? zone.tiles.length > 0 && !getSafariCarnivoreSizeIssue(zone.tiles, existingCarnivoreTiles)
      : zone.tiles.length >= minimum;
  const assignmentPossible =
    penReady && !zoneIssue && (selectedZone === 'herbivore' || assigned.length === 0);
  const issue =
    save.error?.message ??
    (changed ? layoutIssue : null) ??
    (changed && cost > safari.gold ? '골드가 부족해요.' : null);
  const guide = !canEdit
    ? `파크 Lv.${PARK_SAFARI.unlockParkLevel}에 열려요.`
    : tool === 'stop'
      ? stopDescriptions[selectedZone]
      : tool && descriptions[tool];

  return (
    <main className="park-safari">
      <div className="park-safari__world">
        <SafariMap
          safari={safari}
          draft={draft}
          buildings={buildingRead.data?.buildings ?? emptyObjects}
          pathTiles={operationsRead.data?.pathTiles ?? emptyObjects}
          zone={selectedZone}
          tool={tool}
          stage={stage}
          traveling={traveling}
          route={route}
          canEdit={canEdit && !save.isPending}
          onArrive={arrive}
          onApply={applyTool}
        />
        <header className="park-safari__header">
          <BackLink />
          <h1>{activeTour ? '사파리 지프 투어' : '사파리 관리'}</h1>
        </header>
        {!activeTour && (
          <div className="park-safari__gold" aria-label={`보유 골드 ${gold(safari.gold)}`}>
            <img alt="" src={goldIcon} />
            <strong>{gold(safari.gold)}</strong>
          </div>
        )}
        {!activeTour && canEdit && (
          <div className="park-safari__tools" aria-label="사파리 편집 도구">
            {tools.map(({ key, label, icon }) => {
              const selected = (tool ?? 'pan') === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  disabled={save.isPending}
                  onClick={() => {
                    setTool(key === 'pan' ? null : key);
                    setNotice('');
                  }}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d={icon} />
                  </svg>
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <aside
        className="park-safari__rail"
        aria-label={activeTour ? '지프 투어 정보' : '사파리 구역 설정'}
      >
        {activeTour ? (
          <>
            <div className="park-safari__rail-body">
              <div className="park-safari__tour-stops" aria-label="지프 코스">
                <span aria-current={stage === 0 && !traveling ? 'step' : undefined}>1 초식</span>
                <i aria-hidden="true" />
                <span aria-current={stage === 1 ? 'step' : undefined}>2 육식</span>
              </div>
              <h2>
                {traveling ? '육식 우리로 이동 중' : stopLabels[viewing?.zoneKind ?? 'herbivore']}
              </h2>
              {viewing && (
                <>
                  {viewing.sightings.length > 0 ? (
                    <ul
                      className="park-safari__observations"
                      aria-label="이 정차 지점에서 보이는 공룡"
                    >
                      {viewing.sightings.map(({ dinosaurId, behavior }) => {
                        const dinosaur = safari.dinosaurs.find((entry) => entry.id === dinosaurId);
                        const image = dinosaur && safariDinosaurArt(dinosaur.speciesId);
                        return (
                          <li key={dinosaurId}>
                            {image && <img alt="" src={image} />}
                            <div>
                              <strong>{dinosaur?.name ?? '공룡'}</strong>
                              <span>{behavior === 'drinking' ? '물 마시는 중' : '쉬는 중'}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p>이 정차 지점에서 보이는 공룡이 없어요.</p>
                  )}
                  {viewing.hiddenCount > 0 && (
                    <p className="park-safari__hidden">
                      {viewing.hiddenCount}마리가 시야 밖에 있어요.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="park-safari__rail-footer">
              {stage === 0 && (
                <button
                  className="park-safari__primary"
                  type="button"
                  disabled={traveling}
                  onClick={() => setTraveling(true)}
                >
                  {traveling ? '지프 이동 중' : '다음 정차'}
                </button>
              )}
              <button
                className={stage === 1 ? 'park-safari__primary' : 'park-safari__secondary'}
                type="button"
                onClick={() => {
                  setTraveling(false);
                  setStage(undefined);
                }}
              >
                편집으로 돌아가기
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="park-safari__zones" aria-label="사육 구역 선택">
              {safariZones.map((kind) => (
                <button
                  type="button"
                  key={kind}
                  aria-pressed={selectedZone === kind}
                  onClick={() => {
                    setSelectedZone(kind);
                    setNotice('');
                  }}
                >
                  {safariZoneLabels[kind]}
                </button>
              ))}
            </div>
            <div className="park-safari__rail-body">
              {guide && <p className="park-safari__tool-help">{guide}</p>}
              {canEdit && selectedZone === 'carnivore' && tool === 'fence' && (
                <p className="park-safari__pen-size">
                  <strong>{zone.tiles.length}칸</strong> 확보. 새 우리는 최소 {minimum}칸, 가로와
                  세로가 각각 {PARK_SAFARI.carnivoreMinSpan}칸 이상이어야 해요.
                </p>
              )}
              {tool === 'stop' && canEdit && (
                <div className="park-safari__route-steps">
                  <span>정차 지점 {stopCount} / 2</span>
                  {stopCount > 0 && (
                    <button
                      type="button"
                      disabled={save.isPending}
                      onClick={() => {
                        changeDraft({ ...draft, stops: [null, null] });
                        setNotice('');
                      }}
                    >
                      지우기
                    </button>
                  )}
                </div>
              )}
              {zoneIssue && canEdit && <p className="park-safari__hidden">{zoneIssue}</p>}
              <section className="park-safari__assign">
                <h2>공룡 배치</h2>
                {assigned.length > 0 && (
                  <ul aria-label="우리 안의 공룡">
                    {assigned.map((dino) => (
                      <li key={dino.id}>
                        <span>{dino.name}</span>
                        <button
                          type="button"
                          disabled={unavailable}
                          onClick={() => assignDinosaur(dino.id, true)}
                          aria-label={`${dino.name} 빼기`}
                        >
                          빼기
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!assignmentPossible && assigned.length === 0 && !penReady && canEdit && (
                  <p>공룡을 들이려면 우리를 조금 더 넓혀주세요.</p>
                )}
                {assignmentPossible &&
                  (availableDinos.length ? (
                    <select
                      aria-label="공룡 배치"
                      value=""
                      disabled={unavailable}
                      onChange={(event) => assignDinosaur(event.target.value)}
                    >
                      <option value="" disabled>
                        보유 공룡 선택
                      </option>
                      {availableDinos.map((dino) => (
                        <option key={dino.id} value={dino.id}>
                          {dino.name}
                          {dino.isInPark ? ' · 전시 중' : ''}
                        </option>
                      ))}
                    </select>
                  ) : assigned.length === 0 ? (
                    <p>
                      보유한 {selectedZone === 'herbivore' ? '스테고사우루스' : '티라노사우루스'}가
                      있어야 배치할 수 있어요.
                    </p>
                  ) : null)}
              </section>
            </div>
            <div className="park-safari__rail-footer">
              {(notice || issue) && (
                <p
                  className={issue ? 'park-safari__message is-issue' : 'park-safari__message'}
                  role={issue ? 'alert' : 'status'}
                >
                  {issue ?? notice}
                </p>
              )}
              {changed && (
                <div className="park-safari__save">
                  <button
                    type="button"
                    className="park-safari__secondary"
                    disabled={save.isPending}
                    onClick={() => {
                      resetEdit();
                      if (conflict) void safariRead.refetch();
                    }}
                  >
                    {conflict ? '다시 불러오기' : '취소'}
                  </button>
                  <button
                    type="button"
                    className="park-safari__primary"
                    disabled={unavailable || !!layoutIssue || cost > safari.gold || conflict}
                    onClick={saveDraft}
                  >
                    <span>{save.isPending ? '저장 중' : '저장'}</span>
                    {cost > 0 && (
                      <span className="park-safari__cost">
                        <img alt="" src={goldIcon} />
                        {gold(cost)}
                      </span>
                    )}
                  </button>
                </div>
              )}
              <button
                className={changed ? 'park-safari__secondary' : 'park-safari__primary'}
                type="button"
                disabled={!canEdit || changed || !safari.tour}
                onClick={() => {
                  setStage(0);
                  setNotice('');
                }}
              >
                <img alt="" className="park-safari__jeep" src={jeepArt} />
                지프 탑승
              </button>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
