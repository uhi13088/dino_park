import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getBuildingById, resolveDinosaurSpecies } from '@dino-park/game-data';
import {
  PARK_SHUTTLE,
  estimateShuttleRoute,
  parkTravelSatisfactionPenalty,
  type BuildingResponse,
  type DinosaurResponse,
  type ParkOperationsResponse,
  type ParkShuttleDestination,
  type SetShuttleRouteRequest,
  type ShuttleDepartureInterval,
} from '@dino-park/shared';
import { Button } from '@/components/ui';
import { ParkIcon } from './ParkHud';
import './ParkShuttlePanel.css';

const number = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });
const routeStatus = {
  running: '운행 중',
  closed: '휴장 · 운행 중지',
  disconnected: '운행 조건 미충족',
};

function formatTime(seconds: number) {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return minutes > 0 ? `${minutes}분${remainder ? ` ${remainder}초` : ''}` : `${remainder}초`;
}

type Operations = ParkOperationsResponse & {
  shuttle: NonNullable<ParkOperationsResponse['shuttle']>;
};

interface Props {
  operations: Operations;
  buildings: BuildingResponse[];
  dinosaurs: DinosaurResponse[];
  busy: boolean;
  onBuy: () => Promise<unknown>;
  onRouteChange: (exhibitId: string, changes: SetShuttleRouteRequest) => Promise<unknown>;
  onDestinationFocus: (exhibitId: string | null) => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ParkShuttlePanel({
  operations,
  buildings,
  dinosaurs,
  busy,
  onBuy,
  onRouteChange,
  onDestinationFocus,
  onBack,
  onClose,
}: Props) {
  const { shuttle, isOpen, gold } = operations;
  const destinations = shuttle.destinations.filter(
    (destination) =>
      destination.route || (destination.distance ?? 0) >= PARK_SHUTTLE.minimumDistance,
  );
  const [destinationId, setDestinationId] = useState(
    () => destinations.find((item) => item.route)?.exhibitId ?? destinations[0]?.exhibitId ?? '',
  );
  const [notice, setNotice] = useState<{
    kind: 'buy' | 'route';
    message: string;
    error?: boolean;
  }>();
  const [pending, setPending] = useState<'buy' | 'route' | null>(null);
  const requestInFlight = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const destination =
    destinations.find(({ exhibitId }) => exhibitId === destinationId) ?? destinations[0];
  const currentRouteCount = destinations.filter(({ route }) => route !== null).length;
  const limitReached = shuttle.ownedBusCount >= PARK_SHUTTLE.maxBuses;
  const shortfall = Math.max(0, PARK_SHUTTLE.purchaseGold - gold);
  const isBusy = busy || pending !== null;

  useEffect(() => titleRef.current?.focus({ preventScroll: true }), []);
  const focusedExhibit = destination?.exhibitId ?? null;
  useEffect(() => {
    onDestinationFocus(focusedExhibit);
    return () => onDestinationFocus(null);
  }, [focusedExhibit, onDestinationFocus]);

  const run = async (kind: 'buy' | 'route', submit: () => Promise<unknown>, message: string) => {
    if (isBusy || requestInFlight.current) return;
    requestInFlight.current = true;
    setNotice(undefined);
    setPending(kind);
    try {
      await submit();
      setNotice({ kind, message });
    } catch (error) {
      setNotice({
        kind,
        message: error instanceof Error ? error.message : '다시 시도해주세요.',
        error: true,
      });
    } finally {
      requestInFlight.current = false;
      setPending(null);
    }
  };

  const feedback = notice && (
    <p
      className={notice.error ? 'park-shuttle__error' : 'park-shuttle__notice'}
      role={notice.error ? 'alert' : 'status'}
    >
      {notice.message}
    </p>
  );

  const destinationName = (item: ParkShuttleDestination) => {
    const building = buildings.find(({ id }) => id === item.exhibitId);
    const typeId = building?.typeId ?? item.typeId;
    const name = (typeId ? getBuildingById(typeId)?.nameKo : null) ?? '전시 구역';
    const dinosaurIds = operations.admission?.exhibits.find(
      ({ id }) => id === item.exhibitId,
    )?.dinosaurIds;
    const dinosaur = dinosaurs.find(({ id }) => dinosaurIds?.includes(id));
    const example = dinosaur && (dinosaur.nickname || resolveDinosaurSpecies(dinosaur)?.nameKo);
    const sameType = destinations.filter((destination) => destination.typeId === item.typeId);
    const suffix = sameType.length > 1 ? ` ${sameType.indexOf(item) + 1}` : '';
    return example ? `${name}${suffix} · ${example}` : `${name}${suffix}`;
  };

  return (
    <section className="park-shuttle" aria-labelledby="park-shuttle-title" aria-busy={isBusy}>
      <header className="park-panel-header park-shuttle__header">
        <button
          type="button"
          className="park-panel-close park-shuttle__back"
          aria-label="운영으로 돌아가기"
          onClick={onBack}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m14.5 6-6 6 6 6" />
          </svg>
        </button>
        <h2 id="park-shuttle-title" ref={titleRef} tabIndex={-1}>
          셔틀버스
        </h2>
        <button
          type="button"
          className="park-panel-close"
          aria-label="셔틀버스 패널 닫기"
          onClick={onClose}
        >
          <ParkIcon name="close" />
        </button>
      </header>
      <div className="park-panel-body park-shuttle__body">
        <div className="park-shuttle__fleet">
          <img src="/assets/vehicles/shuttle-front.webp" alt="" width={44} height={42} />
          <div>
            <h3>
              보유 차량{' '}
              <strong>
                {shuttle.ownedBusCount} / {PARK_SHUTTLE.maxBuses}대
              </strong>
            </h3>
            <p>배정 가능 {shuttle.unassignedBusCount}대</p>
          </div>
          {shuttle.unlocked && (
            <Button
              type="button"
              variant={shuttle.ownedBusCount === 0 ? 'primary' : 'outline'}
              disabled={isBusy || limitReached || shortfall > 0}
              isLoading={pending === 'buy'}
              onClick={() => void run('buy', onBuy, '셔틀버스 1대를 구매했어요.')}
            >
              버스 구매 · {number.format(PARK_SHUTTLE.purchaseGold)}골드
            </Button>
          )}
        </div>
        {!shuttle.unlocked && shuttle.unavailableReason && (
          <p className="park-shuttle__hint" role="status">
            {shuttle.unavailableReason}
          </p>
        )}
        {shuttle.unlocked && limitReached && (
          <p className="park-shuttle__hint">보유 한도에 도달했어요.</p>
        )}
        {shuttle.unlocked && !limitReached && shortfall > 0 && (
          <p className="park-shuttle__hint">구매에 {number.format(shortfall)}골드가 더 필요해요.</p>
        )}
        {notice?.kind === 'buy' && feedback}
        {destination ? (
          <section className="park-shuttle__routes" aria-label="정문에서 전시로 가는 노선">
            <label className="park-shuttle__field">
              노선 목적지
              <select
                value={destination.exhibitId}
                onChange={(event) => {
                  setDestinationId(event.target.value);
                  setNotice(undefined);
                }}
                disabled={isBusy}
              >
                {destinations.map((item) => (
                  <option key={item.exhibitId} value={item.exhibitId}>
                    {destinationName(item)}
                    {item.route ? ' · 배정됨' : ''}
                  </option>
                ))}
              </select>
            </label>
            <ShuttleRouteEditor
              key={`${destination.exhibitId}:${destination.route?.busCount ?? 0}:${destination.route?.departureIntervalSeconds ?? 60}`}
              destination={destination}
              availableBuses={shuttle.unassignedBusCount + (destination.route?.busCount ?? 0)}
              allowDispatch={shuttle.unlocked}
              routeLimitReached={!destination.route && currentRouteCount >= PARK_SHUTTLE.maxRoutes}
              isOpen={isOpen}
              busy={isBusy}
              saving={pending === 'route'}
              onSave={(changes) => {
                void run(
                  'route',
                  () => onRouteChange(destination.exhibitId, changes),
                  changes.busCount > 0 ? '노선을 저장했어요.' : '배정한 버스를 회수했어요.',
                );
              }}
            />
            {notice?.kind === 'route' && feedback}
          </section>
        ) : (
          shuttle.unlocked && (
            <p className="park-shuttle__hint">
              정문에서 도보{' '}
              {formatTime(PARK_SHUTTLE.minimumDistance * PARK_SHUTTLE.secondsPerWalkingTile)} 이상
              걸리는 전시를 관람길에 연결하면 노선을 만들 수 있어요.
            </p>
          )
        )}
      </div>
    </section>
  );
}

interface EditorProps {
  destination: ParkShuttleDestination;
  availableBuses: number;
  allowDispatch: boolean;
  routeLimitReached: boolean;
  isOpen: boolean;
  busy: boolean;
  saving: boolean;
  onSave: (changes: SetShuttleRouteRequest) => void;
}

function ShuttleRouteEditor({
  destination,
  availableBuses,
  allowDispatch,
  routeLimitReached,
  isOpen,
  busy,
  saving,
  onSave,
}: EditorProps) {
  const { route, distance, demandPerMinute } = destination;
  const [draftBusCount, setDraftBusCount] = useState(route?.busCount ?? 1);
  const [interval, setInterval] = useState<ShuttleDepartureInterval>(
    route?.departureIntervalSeconds ?? 60,
  );
  const busCount = Math.min(draftBusCount, availableBuses);
  const routeReady = distance !== null && distance >= PARK_SHUTTLE.minimumDistance;
  const editable = allowDispatch && routeReady && busCount > 0 && !routeLimitReached;
  const unchanged = route?.busCount === busCount && route.departureIntervalSeconds === interval;
  const estimate =
    routeReady && busCount > 0
      ? estimateShuttleRoute(distance, demandPerMinute, busCount, interval)
      : null;
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editable && !busy && !unchanged) onSave({ busCount, departureIntervalSeconds: interval });
  };

  return (
    <form onSubmit={save}>
      <p className="park-shuttle__route-status" data-running={route?.status === 'running'}>
        <span aria-hidden="true" />
        {route ? routeStatus[route.status] : '미배정'}
        {routeReady && (
          <small>정문에서 도보 {formatTime(distance * PARK_SHUTTLE.secondsPerWalkingTile)}</small>
        )}
      </p>
      <div className="park-shuttle__form-fields">
        <label className="park-shuttle__field">
          배정 차량
          <select
            value={busCount}
            disabled={busy || !editable}
            onChange={(event) => setDraftBusCount(Number(event.target.value))}
          >
            {availableBuses === 0 && <option value={0}>배정 가능 차량 없음</option>}
            {Array.from({ length: availableBuses }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}대
              </option>
            ))}
          </select>
        </label>
        <label className="park-shuttle__field">
          배차 간격
          <select
            value={interval}
            disabled={busy || !editable}
            onChange={(event) =>
              setInterval(Number(event.target.value) as ShuttleDepartureInterval)
            }
          >
            {PARK_SHUTTLE.departureIntervals.map((seconds) => (
              <option key={seconds} value={seconds}>
                {formatTime(seconds)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {routeLimitReached && (
        <p className="park-shuttle__hint">노선 {PARK_SHUTTLE.maxRoutes}개를 모두 사용 중이에요.</p>
      )}
      {allowDispatch && routeReady && availableBuses === 0 && !routeLimitReached && (
        <p className="park-shuttle__hint">버스를 사거나 다른 노선의 배정을 줄여주세요.</p>
      )}
      {estimate && editable && (
        <div className="park-shuttle__forecast" aria-label="노선 예상 효과">
          <h3>{isOpen ? '예상 운행 효과' : '개장 시 운행 효과'}</h3>
          <dl>
            <div>
              <dt>평균 이동</dt>
              <dd>
                도보 {formatTime(estimate.walkingSeconds)} →{' '}
                {formatTime(estimate.averageTravelSeconds)}
              </dd>
            </div>
            <div>
              <dt>실제 배차 · 대기</dt>
              <dd>
                {formatTime(estimate.departureIntervalSeconds)} 간격 · 약{' '}
                {formatTime(estimate.averageWaitSeconds)}
              </dd>
            </div>
            <div>
              <dt>예상 승차 · 도보</dt>
              <dd>
                {number.format(estimate.ridersPerMinute)}명 ·{' '}
                {number.format(estimate.walkingPerMinute)}명/분
              </dd>
            </div>
            <div>
              <dt>수송 정원 · 운행비</dt>
              <dd>
                {number.format(estimate.capacityPerMinute)}명/분 ·{' '}
                {number.format(estimate.hourlyGold)}골드/시간
              </dd>
            </div>
            <div>
              <dt>전시 이동 감점</dt>
              <dd>
                {parkTravelSatisfactionPenalty(estimate.walkingSeconds)}%p →{' '}
                {parkTravelSatisfactionPenalty(estimate.averageTravelSeconds)}%p
              </dd>
            </div>
          </dl>
          {estimate.ridingSeconds + estimate.averageWaitSeconds >= estimate.walkingSeconds && (
            <p className="park-shuttle__hint">이 배차로는 걷는 편이 빨라 손님이 도보로 이동해요.</p>
          )}
        </div>
      )}
      <div className="park-shuttle__actions">
        {route && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onSave({ busCount: 0, departureIntervalSeconds: interval })}
            disabled={busy}
          >
            배차 해제
          </Button>
        )}
        <Button type="submit" disabled={!editable || busy || unchanged} isLoading={saving}>
          노선 저장
        </Button>
      </div>
    </form>
  );
}
