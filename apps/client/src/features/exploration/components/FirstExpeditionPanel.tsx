import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FIRST_EXPEDITION } from '@dino-park/game-data';
import type { FirstExpeditionStateResponse } from '@dino-park/shared';
import { Button } from '@/components/ui';

interface Props {
  state: FirstExpeditionStateResponse;
  busy: boolean;
  onStart: () => void;
  onChoice: (choiceId: string) => void;
  onClaimEgg: () => void;
  onStartHatch: () => void;
  onClaimHatch: () => void;
  onPlace: () => void;
  onRefresh: () => void;
}

export function TrailSymbol({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 72 52" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {kind === 'footprints' ? (
        <>
          <ellipse cx="23" cy="32" rx="6" ry="9" transform="rotate(-25 23 32)" />
          <ellipse cx="45" cy="17" rx="6" ry="9" transform="rotate(-25 45 17)" />
          <path d="m16 21 2-4m5 3 2-4m12-10 2-4m5 4 2-4" />
        </>
      ) : kind === 'leaves' ? (
        <>
          <path
            d="M14 39C13 16 25 9 35 9c3 15-4 27-21 30Zm44 0c1-23-11-30-21-30-3 15 4 27 21 30Z"
            fill="#dcebc5"
          />
          <path d="m14 39 15-21m29 21L43 18" />
        </>
      ) : kind === 'nest' ? (
        <>
          <ellipse cx="36" cy="36" rx="25" ry="10" fill="#d6bd8b" />
          <path d="m12 34 12 6 15-5 14 5 8-6M18 30l15 4 17-6" />
          <ellipse cx="37" cy="24" rx="11" ry="15" fill="#f6edcd" />
          <path d="m32 18 5-3 3 5m-10 8 5 3m6-7 4 2" />
        </>
      ) : kind === 'reeds' ? (
        <>
          <path d="M19 44V12m16 32V6m16 38V14M18 32 9 23m27 4 11-9m3 20 12-9" />
          <path d="M16 13h6V4h-6Zm16-7h6V1h-6Zm16 9h6V6h-6Z" fill="#c6b48a" />
        </>
      ) : kind === 'water' ? (
        <>
          <ellipse cx="36" cy="29" rx="27" ry="13" fill="#d4e9e8" />
          <path d="M18 25h15m-5 9h24m-9-11h9" />
        </>
      ) : kind === 'flowers' ? (
        <>
          <path d="M36 43V26m0 10 11-5m-11 2-9-7" />
          <circle cx="36" cy="18" r="5" fill="#e4bf75" />
          <circle cx="26" cy="18" r="5" />
          <circle cx="46" cy="18" r="5" />
          <circle cx="36" cy="8" r="5" />
          <circle cx="36" cy="28" r="5" />
        </>
      ) : kind === 'shells' ? (
        <>
          <path
            d="m12 35 5-12 6 5 5-6 6 16a17 17 0 0 1-22-3Zm29-2 6-13 7 5 6-4 2 13a17 17 0 0 1-21-1Z"
            fill="#f6edcd"
          />
        </>
      ) : (
        <>
          <path d="m12 32 9-14 14 2 7 16-16 7Zm28-6 9-15 13 5 3 17-18 5Z" fill="#dce0d4" />
          <path d="m21 18 4 13 17 5m7-25 4 14 12 8" />
        </>
      )}
    </svg>
  );
}

function InvestigationTrail({ step, finished }: { step: number; finished: boolean }) {
  const names = ['발자국', '먹이 흔적', '둥지'];
  return (
    <ol className="first-expedition__trail" aria-label="조사 진행">
      {names.map((name, index) => (
        <li
          key={name}
          aria-current={!finished && index === step ? 'step' : undefined}
          className={finished || index < step ? 'is-found' : index === step ? 'is-current' : ''}
        >
          <span aria-hidden="true">
            {finished || index < step ? (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m4 10 4 4 8-8" />
              </svg>
            ) : (
              index + 1
            )}
          </span>
          <span>{name}</span>
        </li>
      ))}
    </ol>
  );
}

export default function FirstExpeditionPanel({
  state,
  busy,
  onStart,
  onChoice,
  onClaimEgg,
  onStartHatch,
  onClaimHatch,
  onPlace,
  onRefresh,
}: Props) {
  const [now, setNow] = useState(Date.now);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [state.stage, state.mission?.step]);
  useEffect(() => {
    if (state.stage !== 'hatching') return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.stage, state.egg?.completesAt]);
  const seconds = state.egg?.completesAt
    ? Math.max(0, Math.ceil((Date.parse(state.egg.completesAt) - now) / 1000))
    : (state.egg?.remainingSeconds ?? 0);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const goldShort = Math.max(0, FIRST_EXPEDITION.goldCost - state.gold);
  const energyShort = Math.max(0, FIRST_EXPEDITION.energyCost - state.energy);
  const canStart = state.unlocked && !goldShort && !energyShort && !state.requirements.length;
  const canHatch = state.hatchingSlots.used < state.hatchingSlots.total;
  const clue = state.mission?.clue;

  if (state.stage === 'locked' || state.stage === 'available')
    return (
      <section className="first-expedition__location" aria-label="초원 정찰 장소">
        <div className="first-expedition__location-art">
          <TrailSymbol kind="footprints" />
          <span>초원</span>
        </div>
        <div className="first-expedition__location-content">
          <h2>{FIRST_EXPEDITION.name}</h2>
          <p className="first-expedition__lead">단서를 따라가며 이구아노돈의 알을 찾아요.</p>
          <p className="first-expedition__guide">
            닥터 진: 흔적을 살펴보고 어느 길로 갈지 골라봐요. 길을 잘못 골라도 다시 조사할 수
            있어요.
          </p>
          <dl className="first-expedition__cost">
            <div>
              <dt>준비비</dt>
              <dd>{FIRST_EXPEDITION.goldCost.toLocaleString()}골드</dd>
            </div>
            <div>
              <dt>탐험 에너지</dt>
              <dd>{FIRST_EXPEDITION.energyCost}</dd>
            </div>
            <div>
              <dt>확정 보상</dt>
              <dd>이구아노돈 알 1개</dd>
            </div>
          </dl>
          {state.requirements.length > 0 && (
            <p className="first-expedition__notice" id="expedition-requirements">
              {state.requirements.join(' ')}
            </p>
          )}
          {!!(goldShort || energyShort) && (
            <p className="first-expedition__notice">
              더 필요해요:{' '}
              {[
                goldShort ? `${goldShort.toLocaleString()}골드` : '',
                energyShort ? `에너지 ${energyShort}` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <div className="first-expedition__actions">
            {state.stage === 'locked' ? (
              <Link to="/park" className="first-expedition__link-button">
                파크에서 준비하기
              </Link>
            ) : (
              <Button
                disabled={busy || !canStart}
                isLoading={busy}
                onClick={onStart}
                aria-describedby={state.requirements.length ? 'expedition-requirements' : undefined}
              >
                초원 정찰 시작
              </Button>
            )}
          </div>
          <p className="first-expedition__small">준비비와 에너지는 출발할 때 한 번만 사용해요.</p>
        </div>
      </section>
    );

  if (state.stage === 'exploring' && clue && state.mission)
    return (
      <section className="first-expedition__investigation" aria-label="초원 조사 미션">
        <InvestigationTrail step={state.mission.step} finished={false} />
        <div className="first-expedition__clue-heading">
          <h2 ref={headingRef} tabIndex={-1}>
            {clue.title}
          </h2>
          <span>
            단서 {state.mission.step + 1}/{state.mission.totalSteps}
          </span>
        </div>
        <p className="first-expedition__guide">{clue.hint}</p>
        {state.feedback && (
          <p
            role="status"
            className={
              state.feedback.correct ? 'first-expedition__feedback' : 'first-expedition__notice'
            }
          >
            {state.feedback.message}
          </p>
        )}
        <div className="first-expedition__choices" aria-label="조사할 흔적 선택">
          {clue.options.map((option) => (
            <button
              key={option.id}
              disabled={busy}
              onClick={() => onChoice(option.id)}
              className="first-expedition__choice"
            >
              <TrailSymbol kind={option.kind} />
              <strong>{option.label}</strong>
              <span>{option.description}</span>
              <span className="first-expedition__choice-action">이 흔적 조사하기</span>
            </button>
          ))}
        </div>
        <p className="first-expedition__small">
          맞는 흔적을 선택해야 다음 단서로 이동해요. 조사는 저장되며 다시 접속해 이어할 수 있어요.
        </p>
      </section>
    );

  const isDinosaur = state.stage === 'placement' || state.stage === 'complete';
  let title = '이구아노돈 알을 찾았어요';
  let description = '알을 파크로 가져가서 첫 부화를 시작해봐요.';
  let action = (
    <Button disabled={busy} isLoading={busy} onClick={onClaimEgg}>
      알 가져오기
    </Button>
  );
  if (state.stage === 'egg') {
    title = '알을 따뜻하게 품어주세요';
    description = '기본 부화 자리를 사용할 수 있어요. 부화장을 새로 지을 필요는 없어요.';
    action = (
      <Button disabled={busy || !canHatch} isLoading={busy} onClick={onStartHatch}>
        부화 시작 · {FIRST_EXPEDITION.hatchSeconds}초
      </Button>
    );
  } else if (state.stage === 'hatching') {
    title = `부화 중 · ${time}`;
    description = '다른 화면으로 가도 부화는 계속돼요. 시간이 끝나면 이곳에서 새 친구를 만나세요.';
    action = (
      <Button variant="outline" disabled={busy || seconds > 0} onClick={onRefresh}>
        {seconds > 0 ? '알을 따뜻하게 품고 있어요' : '부화 상태 확인'}
      </Button>
    );
  } else if (state.stage === 'hatch_ready') {
    title = '새 친구가 깨어날 준비를 마쳤어요';
    description = '알 속의 이구아노돈을 직접 만나볼까요?';
    action = (
      <Button disabled={busy} isLoading={busy} onClick={onClaimHatch}>
        이구아노돈 만나기
      </Button>
    );
  } else if (state.stage === 'placement') {
    title = '새 친구를 초원에 배치해요';
    description = '파크에서 초원 서식지의 빈칸을 골라주세요. 기존 파라와 함께 지낼 수 있어요.';
    action = (
      <Button disabled={busy} onClick={onPlace}>
        파크에 배치하기
      </Button>
    );
  } else if (state.stage === 'complete') {
    title = '첫 탐험을 마쳤어요';
    description = state.dinosaur
      ? '이구아노돈의 배치까지 마쳤어요. 파크에서 입장객과 관람 환경을 살펴보세요.'
      : '이전에 만난 이구아노돈 기록으로 이 안내를 마쳤어요.';
    action = (
      <Link to="/park" className="first-expedition__link-button">
        파크로 돌아가기
      </Link>
    );
  }
  return (
    <section className="first-expedition__discovery" aria-label="발견한 공룡 알과 부화">
      {state.stage === 'reward' && (
        <InvestigationTrail step={state.mission?.totalSteps ?? 3} finished />
      )}
      <div className="first-expedition__discovery-body">
        <figure>
          <img
            src={`/assets/placeholders/${isDinosaur ? 'iguanodon' : 'iguanodon-egg'}.svg`}
            width="180"
            height="162"
            alt={isDinosaur ? '이구아노돈' : '이구아노돈 알'}
          />
        </figure>
        <div>
          <h2 ref={headingRef} tabIndex={-1}>
            {title}
          </h2>
          <p className="first-expedition__lead">{description}</p>
          {state.stage !== 'complete' &&
            state.stage !== 'placement' &&
            state.stage !== 'reward' && (
              <p className="first-expedition__small">
                부화 자리 {state.hatchingSlots.used}/{state.hatchingSlots.total} 사용 중
              </p>
            )}
          {state.stage === 'egg' && !canHatch && (
            <p className="first-expedition__notice">
              먼저 부화 중인 알을 확인해 빈자리를 만들어주세요.
            </p>
          )}
          {state.feedback && (
            <p className="first-expedition__feedback" role="status">
              {state.feedback.message}
            </p>
          )}
          <div className="first-expedition__actions">{action}</div>
          {state.reusedExisting && (
            <p className="first-expedition__small">이미 만난 이구아노돈의 기록을 인정했어요.</p>
          )}
        </div>
      </div>
    </section>
  );
}
