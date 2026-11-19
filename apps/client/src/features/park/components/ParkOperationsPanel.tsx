import { useEffect, useState, type Ref } from 'react';
import {
  FIRST_EXPEDITION,
  getBuildingById,
  MAX_VIEWING_PLATFORM_LEVEL,
} from '@dino-park/game-data';
import {
  PARK_ADMISSION,
  type DinosaurResponse,
  type ParkOperationsResponse,
  type FirstExpeditionStateResponse,
} from '@dino-park/shared';
import { Button } from '@/components/ui';
import './ParkOperations.css';

const platformType = getBuildingById(PARK_ADMISSION.platformTypeId)!;
const platformCost = platformType.baseCost ?? platformType.unlockCondition.cost.gold;

interface Props {
  operations: ParkOperationsResponse;
  dinosaurs: DinosaurResponse[];
  busy: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPlaceDinosaur: (dinosaur: DinosaurResponse) => void;
  onCareDinosaur: (dinosaur: DinosaurResponse) => void;
  onMoveEntrance: () => void;
  onBuildPlatform: () => void;
  onCompletePlatform: (id: string) => void;
  onShowBuildings: () => void;
  firstExpedition?: FirstExpeditionStateResponse;
  onExplore?: () => void;
  onClaimHatch?: (id: string) => void;
  onShowResources?: () => void;
  onShowGrowth?: () => void;
  growthTrigger?: Ref<HTMLButtonElement>;
  onFirstHybrid?: () => void;
  firstHybridExhibited?: boolean;
}

export default function ParkOperationsPanel({
  operations,
  dinosaurs,
  busy,
  onOpenChange,
  onPlaceDinosaur,
  onCareDinosaur,
  onMoveEntrance,
  onBuildPlatform,
  onCompletePlatform,
  onShowBuildings,
  firstExpedition,
  onExplore,
  onClaimHatch,
  onShowResources,
  onShowGrowth,
  growthTrigger,
  onFirstHybrid,
  firstHybridExhibited,
}: Props) {
  const [now, setNow] = useState(Date.now);
  const platform = operations.viewingPlatform;
  const constructing = platform && platform.status.toUpperCase() !== 'ACTIVE';
  const hatching = firstExpedition?.stage === 'hatching';
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

  if (waiting) {
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
      detail = `닥터 진: 발자국과 먹이 흔적을 따라 이구아노돈 알을 찾아봐요. 준비비 ${FIRST_EXPEDITION.goldCost}골드 · 에너지 ${FIRST_EXPEDITION.energyCost}`;
      action = exploreButton('첫 탐험 시작');
    } else if (first.stage === 'exploring') {
      title = `첫 조사 중 · 단서 ${first.mission?.step ?? 0}/${first.mission?.totalSteps ?? FIRST_EXPEDITION.clues.length}`;
      detail = '발견한 단서를 보고 다음 경로를 골라주세요. 앱을 닫아도 찾은 흔적은 남아요.';
      action = exploreButton('조사 이어하기');
    } else if (first.stage === 'reward') {
      title = '이구아노돈 알을 찾았어요';
      detail = '조사한 둥지에서 알을 가져오면 기본 부화 슬롯을 사용할 수 있어요.';
      action = exploreButton('알 가져오러 가기');
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
    const upgrading = platform.status.toUpperCase() === 'UPGRADING';
    title =
      secondsLeft > 0
        ? `관람대 ${upgrading ? '확장' : '건설'} 중 · ${secondsLeft}초`
        : '관람대 완공을 확인해주세요';
    detail = upgrading
      ? '확장이 끝나면 기존 관람대를 넓게 사용할 수 있어요. 현재 관람은 계속돼요.'
      : operations.isOpen
        ? `완공되면 관람 정원이 ${platformType.baseStats.capacity}명 늘어나요. 기다리는 동안에도 입장료가 쌓여요.`
        : `완공되면 관람 정원이 ${platformType.baseStats.capacity}명 늘어나요. 파크를 개장하면 기다리는 동안에도 손님을 맞이해요.`;
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
      title = '스테고케라톱스 첫 전시를 열었어요';
      const platformCanExpand = platform.level < MAX_VIEWING_PLATFORM_LEVEL;
      detail = platformCanExpand
        ? '관람대 정원을 늘려 더 많은 손님을 맞이해보세요.'
        : '도감에 등록한 영웅을 관람객이 파크에서 만나고 있어요.';
      action = onShowResources ? (
        <Button className="park-operations__primary" onClick={onShowResources}>
          {platformCanExpand ? '관람대 확장 보기' : '자원 시설 보기'}
        </Button>
      ) : null;
    } else if (firstExpedition?.stage === 'complete') {
      title = firstExpedition.dinosaur
        ? dinosaurs.filter((dinosaur) => dinosaur.isInPark).length >= 2
          ? '두 친구가 파크에 모였어요'
          : '이구아노돈이 파크에 왔어요'
        : '기존 수집 기록을 이어가요';
      detail =
        platform.level >= 2
          ? '관람대 확장도 마쳤어요. 자원 생산과 새로운 연구를 준비할 수 있어요.'
          : '목재·석재를 모아 관람대를 확장해보세요. 첫 탐험과 부화 진행은 저장돼 있어요.';
      action = onShowResources ? (
        <Button className="park-operations__primary" onClick={onShowResources}>
          자원 시설 보기
        </Button>
      ) : null;
    } else {
      title = '첫 관람대가 완공됐어요';
      detail = `관람 정원이 ${operations.capacity}명으로 늘었어요. 더 많은 손님을 맞이해보세요.`;
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
        : `${platformCost.toLocaleString()}골드 · 건설 ${platformType.constructionTime}초 · 관람 정원 +${platformType.baseStats.capacity}명`;
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

  return (
    <section className="park-operations" aria-label="파크 운영">
      <div className="park-operations__heading">
        <div className="park-operations__name">
          <h1>파크 운영</h1>
          <span className={operations.isOpen ? 'park-operations__open' : ''}>
            {operations.isOpen ? '개장 중' : '휴장 중'}
          </span>
        </div>
        <Button
          variant={operations.isOpen ? 'outline' : 'primary'}
          className={operations.isOpen ? 'park-operations__secondary' : 'park-operations__primary'}
          disabled={busy || (!operations.isOpen && !operations.canOpen)}
          aria-describedby={
            !operations.canOpen && !operations.isOpen ? 'park-opening-requirements' : undefined
          }
          onClick={() => onOpenChange(!operations.isOpen)}
        >
          {operations.isOpen ? '파크 휴장' : '파크 개장'}
        </Button>
      </div>
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
      <div className="park-operations__goal">
        <div>
          <h2>{title}</h2>
          <p>{detail}</p>
          {!operations.canOpen &&
            !operations.isOpen &&
            operations.openingRequirements.length > 0 && (
              <p id="park-opening-requirements" className="park-operations__requirements">
                {operations.openingRequirements.join(' · ')}
              </p>
            )}
        </div>
        {action && <div className="park-operations__action">{action}</div>}
      </div>
      <div className="park-operations__shortcuts">
        {firstHybridExhibited && onShowGrowth && (
          <Button
            ref={growthTrigger}
            variant="outline"
            size="sm"
            className="park-operations__growth"
            onClick={onShowGrowth}
          >
            성장 목표
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
      <p className="park-operations__capacity">
        관람 정원 {operations.capacity}명 · 예상 입장{' '}
        {operations.visitorsPerMinute.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}명/분 ·
        유지비 {operations.hourlyMaintenance.toLocaleString()}골드/시간
      </p>
    </section>
  );
}
