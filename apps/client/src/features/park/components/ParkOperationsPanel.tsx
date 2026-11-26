import { useEffect, useState, type Ref } from 'react';
import {
  ENTRANCE_RESEARCH,
  FIRST_EXPEDITION,
  getBuildingById,
  resolveDinosaurSpecies,
  MAX_VIEWING_PLATFORM_LEVEL,
} from '@dino-park/game-data';
import {
  PARK_ADMISSION,
  type DinosaurResponse,
  type ParkOperationsResponse,
  type FirstExpeditionStateResponse,
} from '@dino-park/shared';
import { Button } from '@/components/ui';
import { ParkIcon } from './ParkHud';
import PlatformAdmissionPreview from './PlatformAdmissionPreview';
import './ParkOperations.css';

const platformType = getBuildingById(PARK_ADMISSION.platformTypeId)!;
const platformCost = platformType.baseCost ?? platformType.unlockCondition.cost.gold;
const admissionFactorLabels = {
  demand: '관람 수요',
  entrance: '입구 처리량',
  exhibit: '전시 구역 수용량',
};
const admissionRate = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });

interface Props {
  operations: ParkOperationsResponse;
  dinosaurs: DinosaurResponse[];
  busy: boolean;
  onClose?: () => void;
  onOpenChange: (isOpen: boolean) => void;
  onPlaceDinosaur: (dinosaur: DinosaurResponse) => void;
  onCareDinosaur: (dinosaur: DinosaurResponse) => void;
  onMoveEntrance: () => void;
  onRecoverEntrance?: () => void;
  onBuildPlatform: () => void;
  onCompletePlatform: (id: string) => void;
  onShowBuildings: () => void;
  firstExpedition?: FirstExpeditionStateResponse;
  onExplore?: () => void;
  onClaimHatch?: (id: string) => void;
  onShowResources?: () => void;
  onPurchaseResources?: () => void;
  onShowGrowth?: () => void;
  onShowShuttle?: () => void;
  onManageDemand?: () => void;
  onManageEntrance?: () => void;
  onManageExhibits?: () => void;
  onViewPlatformUpgrade?: () => void;
  platformExhibitName?: string;
  growthTrigger?: Ref<HTMLButtonElement>;
  shuttleTrigger?: Ref<HTMLButtonElement>;
  onFirstHybrid?: () => void;
  firstHybridExhibited?: boolean;
}

export default function ParkOperationsPanel({
  operations,
  dinosaurs,
  busy,
  onClose,
  onOpenChange,
  onPlaceDinosaur,
  onCareDinosaur,
  onMoveEntrance,
  onRecoverEntrance,
  onBuildPlatform,
  onCompletePlatform,
  onShowBuildings,
  firstExpedition,
  onExplore,
  onClaimHatch,
  onShowResources,
  onPurchaseResources,
  onShowGrowth,
  onShowShuttle,
  onManageDemand,
  onManageEntrance,
  onManageExhibits,
  onViewPlatformUpgrade,
  platformExhibitName,
  growthTrigger,
  shuttleTrigger,
  onFirstHybrid,
  firstHybridExhibited,
}: Props) {
  const [now, setNow] = useState(Date.now);
  const platform = operations.viewingPlatform;
  const constructing = platform && platform.status.toUpperCase() !== 'ACTIVE';
  const upgrading = platform?.status.toUpperCase() === 'UPGRADING';
  const admission =
    firstHybridExhibited && operations.admission?.exhibitCount !== undefined
      ? operations.admission
      : undefined;
  const bottlenecks = admission?.bottlenecks ?? [];
  const bottleneckActionClass = bottlenecks.length === 1 ? 'park-panel-action--primary' : undefined;
  const platformImpact = admission?.platformImpact;
  const fullVault =
    operations.isOpen && operations.goldVault?.admissionPaused ? operations.goldVault : undefined;
  const admissionEstimateLabel = fullVault ? '재개 시 예상 입장' : '예상 입장';
  const occupancy = operations.occupancy;
  const parkIsFull = occupancy && occupancy.capacity > 0 && occupancy.current >= occupancy.capacity;
  const visitDuration =
    occupancy &&
    (occupancy.visitSeconds % 60 === 0
      ? `${occupancy.visitSeconds / 60}분`
      : `${occupancy.visitSeconds}초`);
  const parkLimitLabel = occupancy
    ? `파크 안 ${admissionRate.format(occupancy.current)} / ${admissionRate.format(occupancy.capacity)}명`
    : `파크 입장 한도 ${admissionRate.format(operations.capacity)}명/분`;
  const hasOpeningRequirements = !operations.canOpen && operations.openingRequirements.length > 0;
  const hatching = firstExpedition?.stage === 'hatching';
  const demandLimited = bottlenecks.includes('demand');
  const entranceLimited = bottlenecks.includes('entrance');
  const exhibitLimited = bottlenecks.includes('exhibit');
  const blockedRoute = !!admission && !operations.canOpen && !admission.exhibitedDinosaurIds.length;
  const manageLimits = !!admission && operations.isOpen && !fullVault && operations.canOpen;
  const careTarget =
    manageLimits && demandLimited
      ? dinosaurs
          .filter(
            ({ id, isInPark, hunger, happiness }) =>
              isInPark &&
              admission.exhibitedDinosaurIds.includes(id) &&
              hunger > 0 &&
              (hunger > 20 || happiness < 80),
          )
          .sort(
            (a, b) =>
              Number(b.hunger > 80) - Number(a.hunger > 80) ||
              a.happiness - b.happiness ||
              b.hunger - a.hunger,
          )[0]
      : undefined;
  const careName = careTarget
    ? careTarget.nickname || resolveDinosaurSpecies(careTarget)?.nameKo || '공룡'
    : undefined;
  const firstGrowth = !!firstHybridExhibited && operations.parkLevel === 5;
  useEffect(() => {
    if (!constructing && !hatching) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [constructing, hatching]);
  const secondsLeft = platform?.completesAt
    ? Math.max(0, Math.ceil((Date.parse(platform.completesAt) - now) / 1000))
    : 0;
  const waiting = dinosaurs.some((dinosaur) => dinosaur.isInPark)
    ? undefined
    : dinosaurs.find((dinosaur) => !dinosaur.isInPark);
  const needsCare = dinosaurs.find(
    (dinosaur) => dinosaur.isInPark && (dinosaur.hunger > 20 || dinosaur.happiness < 80),
  );
  const goldShortage = Math.max(0, platformCost - operations.gold);
  const goal = operations.firstVisitorsGoal;
  let title = '손님을 맞이할 준비를 해요';
  let detail = '입구와 관람길이 준비되면 파크를 개장할 수 있어요.';
  let action: React.ReactNode = null;

  if (!operations.entrance && onRecoverEntrance) {
    title = '입구를 놓을 자리를 비워주세요';
    detail = '입구를 복구하려면 파크 테두리에 빈 공간이 필요해요.';
    action = (
      <Button className="park-operations__primary" disabled={busy} onClick={onRecoverEntrance}>
        입구 다시 찾기 · 무료
      </Button>
    );
  } else if (waiting) {
    title = '첫 공룡의 집을 정해주세요';
    detail = `${waiting.nickname || '공룡'}를 배치하고 먹이를 주세요.`;
    action = (
      <Button className="park-operations__primary" onClick={() => onPlaceDinosaur(waiting)}>
        공룡 배치하기
      </Button>
    );
  } else if (operations.entrance && !operations.entrance.onBoundary) {
    title = '입구를 파크 테두리에 연결해주세요';
    detail = '기존 시설은 그대로 두고 입구만 무료로 옮길 수 있어요.';
    action = (
      <Button className="park-operations__primary" onClick={onMoveEntrance}>
        입구 옮기기 · 무료
      </Button>
    );
  } else if (needsCare && !operations.canOpen) {
    title = '공룡을 돌봐주세요';
    detail = '행복하고 배부른 공룡이 손님을 맞이할 준비가 됐는지 확인해요.';
    action = (
      <Button className="park-operations__primary" onClick={() => onCareDinosaur(needsCare)}>
        공룡 돌보기
      </Button>
    );
  } else if (
    platform &&
    firstExpedition &&
    firstExpedition.stage !== 'locked' &&
    firstExpedition.stage !== 'complete'
  ) {
    const first = firstExpedition;
    const exploreButton = (label: string) =>
      onExplore ? (
        <Button className="park-operations__primary" disabled={busy} onClick={onExplore}>
          {label}
        </Button>
      ) : null;
    if (first.stage === 'available') {
      title = '초원에서 두 번째 친구를 찾아요';
      detail = `탐험가를 고용해 파크 뒤 초원에 보내요. 준비비 ${FIRST_EXPEDITION.goldCost}골드`;
      action = exploreButton('첫 탐험가 파견');
    } else if (first.stage === 'reward') {
      title = '탐험가가 돌아왔어요';
      detail = '귀환 보고서에서 이구아노돈 알을 수령해 부화시켜봐요.';
      action = exploreButton('귀환 보고서 보기');
    } else if (first.stage === 'egg') {
      title = '첫 알을 부화시켜봐요';
      detail = `별도 부화장을 사지 않아도 기본 슬롯에서 ${FIRST_EXPEDITION.hatchSeconds}초 동안 부화할 수 있어요.`;
      action = exploreButton('알 부화하러 가기');
    } else if (first.stage === 'hatching') {
      const remaining = first.egg?.completesAt
        ? Math.max(0, Math.ceil((Date.parse(first.egg.completesAt) - now) / 1000))
        : (first.egg?.remainingSeconds ?? 0);
      title = remaining > 0 ? `이구아노돈 부화 중 · ${remaining}초` : '부화 상태를 확인하고 있어요';
      detail = '기다리는 동안 자원 시설에서 벌목장·채석장을 배치하고 첫 생산을 준비해보세요.';
      action = onShowResources ? (
        <Button className="park-operations__primary" onClick={onShowResources}>
          자원 시설 보기
        </Button>
      ) : (
        exploreButton('부화 상태 보기')
      );
    } else if (first.stage === 'hatch_ready') {
      title = '새 친구가 태어날 준비를 마쳤어요';
      detail = '부화한 이구아노돈을 직접 수령하면 도감에 등록돼요. 파크의 빈 초원에 배치해봐요.';
      action =
        first.egg && onClaimHatch ? (
          <Button
            className="park-operations__primary"
            disabled={busy}
            onClick={() => onClaimHatch(first.egg!.id)}
          >
            이구아노돈 만나기
          </Button>
        ) : (
          exploreButton('이구아노돈 만나러 가기')
        );
    } else if (first.stage === 'placement' && first.dinosaur) {
      title = '이구아노돈을 파크에 배치해요';
      detail =
        '건강하게 태어난 새 친구예요. 추천된 초원 빈칸에 배치하면 손님이 두 종을 관람할 수 있어요.';
      action = (
        <Button
          className="park-operations__primary"
          onClick={() => onPlaceDinosaur(first.dinosaur!)}
        >
          이구아노돈 배치하기
        </Button>
      );
    }
  } else if (platform && constructing) {
    title =
      secondsLeft > 0
        ? `관람대 ${upgrading ? '확장' : '건설'} 중 · ${secondsLeft}초`
        : '관람대 완공을 확인해주세요';
    detail = upgrading
      ? '완공되면 연결된 전시를 더 쾌적하게 볼 수 있어요. 공사 중에도 관람은 계속돼요.'
      : '완공되면 가까운 전시에서 손님들이 편하게 공룡을 볼 수 있어요.';
    action = (
      <Button
        className="park-operations__primary"
        disabled={secondsLeft > 0 || busy}
        onClick={() => onCompletePlatform(platform.id)}
      >
        완공 확인
      </Button>
    );
  } else if (platform && !constructing) {
    if (firstHybridExhibited) {
      title = admission ? '' : '스테고케라톱스 첫 전시를 열었어요';
      detail = '도감에 등록한 영웅을 관람객이 파크에서 만나고 있어요.';
    } else if (firstExpedition?.stage === 'complete') {
      title = firstExpedition.dinosaur
        ? dinosaurs.filter((dinosaur) => dinosaur.isInPark).length >= 2
          ? '두 친구가 파크에 모였어요'
          : '이구아노돈이 파크에 왔어요'
        : '기존 수집 기록을 이어가요';
      detail =
        platform.level >= 2
          ? '관람대 확장도 마쳤어요. 자원 생산과 새로운 연구를 준비할 수 있어요.'
          : '목재·석재로 관람대를 확장하면 연결된 전시를 더 쾌적하게 볼 수 있어요.';
      action = onShowResources ? (
        <Button className="park-operations__primary" onClick={onShowResources}>
          자원 시설 보기
        </Button>
      ) : null;
    } else {
      title = '첫 관람대가 완공됐어요';
      detail = '가까운 전시에서 손님들이 편하게 공룡을 볼 수 있어요.';
      action = (
        <Button variant="ghost" onClick={onShowBuildings}>
          시설 보기
        </Button>
      );
    }
  } else if (goal.rewarded) {
    title = '입장료로 첫 관람대를 지어요';
    detail =
      goldShortage > 0
        ? `${platformCost.toLocaleString()}골드 중 ${goldShortage.toLocaleString()}골드를 더 모으면 지을 수 있어요.`
        : `${platformCost.toLocaleString()}골드 · 건설 ${platformType.constructionTime}초 · 가까운 전시의 관람 환경 개선`;
    action = (
      <Button
        className="park-operations__primary"
        disabled={goldShortage > 0 || busy}
        onClick={onBuildPlatform}
      >
        관람대 짓기
      </Button>
    );
  } else if (operations.isOpen) {
    title = `첫 손님 맞이 · ${goal.current}/${goal.target}명`;
    detail = `${goal.target}명의 유료 입장을 달성하면 경험치 ${PARK_ADMISSION.firstVisitorsXp}를 받고 관람대가 열려요.`;
  } else if (operations.canOpen) {
    title = '재개장 준비가 끝났어요';
    detail = '파크를 개장하면 손님이 입장료를 내고 공룡을 관람해요.';
  }

  let admissionReason = '';
  if (admission) {
    if (!operations.isOpen || !operations.canOpen) {
      admissionReason = hasOpeningRequirements
        ? '개장 조건을 먼저 확인해주세요.'
        : '파크를 개장하면 입장 제한 요인을 확인할 수 있어요.';
    } else if (bottlenecks.length) {
      const restriction = fullVault ? '재개 시 입장 제한' : '현재 입장 제한';
      admissionReason = `${restriction} · ${bottlenecks.map((factor) => admissionFactorLabels[factor]).join(' · ')}`;
    } else {
      admissionReason =
        operations.openingRequirements.join(' ') || '입구와 관람 가능한 전시를 연결해주세요.';
    }
  }

  return (
    <section className="park-operations" aria-label="파크 운영">
      <header className="park-operations__heading park-panel-header">
        <div className="park-operations__name">
          <h1>파크 운영</h1>
          <span className={operations.isOpen ? 'park-operations__open' : ''}>
            {operations.isOpen ? '개장 중' : '휴장 중'}
          </span>
        </div>
        <div className="park-operations__header-controls">
          {onShowShuttle && (
            <Button
              ref={shuttleTrigger}
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={onShowShuttle}
            >
              셔틀버스
            </Button>
          )}
          <Button
            variant={operations.isOpen ? 'outline' : 'primary'}
            className={
              operations.isOpen ? 'park-operations__secondary' : 'park-operations__primary'
            }
            disabled={busy || (!operations.isOpen && !operations.canOpen)}
            aria-describedby={hasOpeningRequirements ? 'park-opening-requirements' : undefined}
            onClick={() => onOpenChange(!operations.isOpen)}
          >
            {operations.isOpen ? '파크 휴장' : '파크 개장'}
          </Button>
          {onClose && (
            <button
              type="button"
              className="park-panel-close"
              aria-label="운영 패널 닫기"
              onClick={onClose}
            >
              <ParkIcon name="close" />
            </button>
          )}
        </div>
      </header>
      <div className="park-panel-body">
        <dl className="park-operations__numbers">
          <div>
            <dt>입장료</dt>
            <dd>{operations.ticketPrice.toLocaleString()}골드</dd>
          </div>
          <div>
            <dt>유료 입장객</dt>
            <dd>{operations.totalVisitors.toLocaleString()}명</dd>
          </div>
          <div>
            <dt>누적 입장료</dt>
            <dd>{operations.totalAdmissionGold.toLocaleString()}골드</dd>
          </div>
        </dl>
        {fullVault && (
          <div className="park-operations__vault" role="status">
            <div>
              <p>
                <strong>금고가 찼어요</strong> · 한도 {fullVault.capacity.toLocaleString()}골드
              </p>
              <p>
                유료 입장이 멈췄어요. 금고에 {operations.ticketPrice}골드 이상 여유가 생기면
                자동으로 재개돼요.
              </p>
            </div>
            {onPurchaseResources && (
              <Button variant="outline" size="sm" onClick={onPurchaseResources} disabled={busy}>
                기본 자원 구매
              </Button>
            )}
          </div>
        )}
        {(title || (hasOpeningRequirements && !admission)) && (
          <div className="park-operations__goal">
            <div>
              {title && (
                <>
                  <h2>{title}</h2>
                  <p>{detail}</p>
                </>
              )}
              {hasOpeningRequirements && !admission && (
                <p id="park-opening-requirements" className="park-operations__requirements">
                  {operations.openingRequirements.join(' · ')}
                </p>
              )}
            </div>
            {action && <div className="park-operations__action">{action}</div>}
          </div>
        )}
        {admission && (
          <section className="park-operations__admission" aria-labelledby="park-admission-title">
            <div className="park-operations__admission-heading">
              <div>
                <h2 id="park-admission-title">입장 진단</h2>
                <p>{admissionReason}</p>
                {hasOpeningRequirements && (
                  <p id="park-opening-requirements" className="park-operations__requirements">
                    {operations.openingRequirements.join(' · ')}
                  </p>
                )}
              </div>
              <div className="park-operations__admission-rates">
                {occupancy && (
                  <p className="park-operations__admission-rate">
                    파크 안{' '}
                    <strong>
                      {admissionRate.format(occupancy.current)} /{' '}
                      {admissionRate.format(occupancy.capacity)}명
                    </strong>
                  </p>
                )}
                <p className="park-operations__admission-rate">
                  {admissionEstimateLabel}{' '}
                  <strong>{admissionRate.format(operations.visitorsPerMinute)}명/분</strong>
                </p>
              </div>
            </div>
            {occupancy && (
              <p className="park-operations__visit-duration">
                관람 {visitDuration}
                {parkIsFull &&
                  operations.isOpen &&
                  !fullVault &&
                  ' · 관람을 마친 손님이 나가면 다음 손님을 받아요.'}
              </p>
            )}
            <div className="park-operations__admission-detail">
              <dl className="park-operations__admission-factors">
                {(
                  [
                    ['demand', operations.demandPerMinute],
                    ['entrance', admission.gatePerMinute],
                    ['exhibit', admission.exhibitPerMinute],
                  ] as const
                ).map(([factor, rate]) => (
                  <div key={factor} data-limiting={bottlenecks.includes(factor)}>
                    <dt>{admissionFactorLabels[factor]}</dt>
                    <dd>
                      {admissionRate.format(rate)}명/분
                      {factor === 'exhibit' && <span>운영 중 {admission.exhibitCount}곳</span>}
                    </dd>
                  </div>
                ))}
              </dl>
              {blockedRoute && (
                <div className="park-operations__admission-actions">
                  <div>
                    {operations.entrance?.onBoundary && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={onMoveEntrance}>
                        입구 옮기기 · 무료
                      </Button>
                    )}
                    {onManageExhibits && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={onManageExhibits}
                      >
                        전시 구역 관리
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {manageLimits && bottlenecks.length > 0 && (
                <div className="park-operations__admission-actions">
                  {bottlenecks.length > 1 && (
                    <p>같은 수치로 제한된 항목은 함께 개선해야 입장이 늘어요.</p>
                  )}
                  {demandLimited && careTarget && (
                    <div>
                      <p>
                        {careName}의 행복도 {careTarget.happiness} · 허기 {careTarget.hunger}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className={bottleneckActionClass}
                        disabled={busy}
                        onClick={() => onCareDinosaur(careTarget)}
                      >
                        {careName} 돌보기
                      </Button>
                    </div>
                  )}
                  {demandLimited && !careTarget && (
                    <div>
                      <p>매력도가 높거나 종류가 다른 공룡을 전시하면 관람 수요를 높일 수 있어요.</p>
                      {(onManageDemand || onManageExhibits) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={bottleneckActionClass}
                          disabled={busy}
                          onClick={onManageExhibits ?? onManageDemand}
                        >
                          전시·돌봄 보기
                        </Button>
                      )}
                    </div>
                  )}
                  {entranceLimited && onManageEntrance && (
                    <div>
                      <p>
                        {admission.entranceResearchCompleted
                          ? '입장 수속 연구 효과가 적용 중이에요.'
                          : `입구 처리량을 ${ENTRANCE_RESEARCH.bonusPercent}% 늘리는 연구예요.`}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className={bottleneckActionClass}
                        disabled={busy}
                        onClick={onManageEntrance}
                      >
                        {admission.entranceResearchCompleted
                          ? '입구 관리 보기'
                          : '입장 수속 연구 보기'}
                      </Button>
                    </div>
                  )}
                  {exhibitLimited && onManageExhibits && (
                    <div>
                      <p>관람길이 닿는 서식지에 공룡을 전시하면 파크 정원이 늘어요.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className={bottleneckActionClass}
                        disabled={busy}
                        onClick={onManageExhibits}
                      >
                        전시 구역 관리
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {platformImpact ? (
                <div className="park-operations__platform-impact">
                  <div>
                    <h3>
                      관람대 Lv.{platformImpact.fromLevel} → Lv.{platformImpact.toLevel}
                    </h3>
                    <PlatformAdmissionPreview
                      impact={platformImpact}
                      exhibitName={platformExhibitName}
                      isParkOpen={operations.isOpen}
                      admissionPaused={!!fullVault}
                    />
                  </div>
                  {onViewPlatformUpgrade && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={onViewPlatformUpgrade}
                    >
                      {upgrading ? '관람대 완공 보기' : '관람대 강화 보기'}
                    </Button>
                  )}
                </div>
              ) : (
                platform &&
                !constructing &&
                platform.level >= MAX_VIEWING_PLATFORM_LEVEL && (
                  <p className="park-operations__platform-limit">
                    관람대는 현재 최고 단계인 Lv.{platform.level}에 도달했어요.
                  </p>
                )
              )}
            </div>
          </section>
        )}
        <div className="park-operations__shortcuts">
          {admission && !blockedRoute && !(manageLimits && exhibitLimited) && onManageExhibits && (
            <Button variant="outline" size="sm" disabled={busy} onClick={onManageExhibits}>
              전시 구역 관리
            </Button>
          )}
          {firstHybridExhibited && onShowGrowth && (
            <Button
              ref={growthTrigger}
              variant={firstGrowth ? 'primary' : 'outline'}
              size="sm"
              className={firstGrowth ? 'park-operations__primary' : 'park-operations__growth'}
              aria-describedby={firstGrowth ? 'park-first-growth-benefit' : undefined}
              onClick={onShowGrowth}
            >
              {firstGrowth ? 'Lv.6 성장 목표 보기' : '성장 목표'}
            </Button>
          )}
          {firstExpedition?.stage === 'complete' && onFirstHybrid && (
            <Button
              variant="ghost"
              size="sm"
              className="park-operations__secondary"
              onClick={onFirstHybrid}
            >
              {firstHybridExhibited ? '반복 합성 준비' : '첫 스테고케라톱스 준비'}
            </Button>
          )}
        </div>
        {firstGrowth && onShowGrowth && (
          <p className="park-operations__capacity" id="park-first-growth-benefit">
            입장 수속을 익히고 Lv.6에서 전시 확장과 재료 원정 중 먼저 할 일을 골라요.
          </p>
        )}
        <p className="park-operations__capacity">
          {!admission &&
            `${parkLimitLabel} · ${admissionEstimateLabel} ${admissionRate.format(operations.visitorsPerMinute)}명/분 · `}
          유지비 {operations.hourlyMaintenance.toLocaleString()}골드/시간
        </p>
      </div>
    </section>
  );
}
