import { useEffect, useState, type ReactNode } from 'react';
import { FIRST_EXPEDITION } from '@dino-park/game-data';
import type { FirstExpeditionStateResponse } from '@dino-park/shared';
import { Button } from '@/components/ui';

interface Props {
  state: FirstExpeditionStateResponse;
  busy: boolean;
  onClaimEgg: () => void;
  onStartHatch: () => void;
  onClaimHatch: () => void;
  onPlace: () => void;
  onRefresh: () => void;
}

export default function FirstHatchingPanel({
  state,
  busy,
  onClaimEgg,
  onStartHatch,
  onClaimHatch,
  onPlace,
  onRefresh,
}: Props) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (state.stage !== 'hatching') return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.stage, state.egg?.completesAt]);
  const seconds = state.egg?.completesAt
    ? Math.max(0, Math.ceil((Date.parse(state.egg.completesAt) - now) / 1000))
    : (state.egg?.remainingSeconds ?? 0);
  const { used, total } = state.hatchingSlots;
  const canHatch = used < total;
  let title: string;
  let description: string;
  let action: ReactNode;

  switch (state.stage) {
    case 'reward':
      if (!state.mission) return null;
      title = '이구아노돈 알을 찾았어요';
      description = '완료한 초원 탐험의 알을 수령하세요.';
      action = (
        <Button disabled={busy} onClick={onClaimEgg}>
          알 가져오기
        </Button>
      );
      break;
    case 'egg':
      title = '이구아노돈 알 부화';
      description = canHatch ? `부화 자리 ${used}/${total} 사용 중` : '부화 자리가 가득 찼어요.';
      action = (
        <Button disabled={busy || !canHatch} onClick={onStartHatch}>
          부화 시작 · {FIRST_EXPEDITION.hatchSeconds}초
        </Button>
      );
      break;
    case 'hatching': {
      const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
      title = `부화 중 · ${time}`;
      description = '다른 화면으로 가도 부화는 계속돼요.';
      action = (
        <Button variant="outline" disabled={busy || seconds > 0} onClick={onRefresh}>
          {seconds > 0 ? '알을 따뜻하게 품고 있어요' : '부화 상태 확인'}
        </Button>
      );
      break;
    }
    case 'hatch_ready':
      title = '이구아노돈이 깨어났어요';
      description = '부화한 공룡을 받으면 도감에 등록돼요.';
      action = (
        <Button disabled={busy} onClick={onClaimHatch}>
          이구아노돈 만나기
        </Button>
      );
      break;
    case 'placement':
      title = '이구아노돈을 초원에 배치해요';
      description = '파크에서 초원 서식지의 빈칸을 골라주세요.';
      action = (
        <Button disabled={busy} onClick={onPlace}>
          파크에 배치하기
        </Button>
      );
      break;
    default:
      return null;
  }

  const isDinosaur = state.stage === 'placement';
  return (
    <section className="first-expedition__discovery" aria-label="이구아노돈 부화">
      <div className="first-expedition__discovery-body">
        <figure>
          <img
            src={
              isDinosaur
                ? '/assets/dinosaurs/iguanodon/idle.webp'
                : '/assets/placeholders/iguanodon-egg.svg'
            }
            width="180"
            height="162"
            alt={isDinosaur ? '이구아노돈' : '이구아노돈 알'}
          />
        </figure>
        <div>
          <h2>{title}</h2>
          <p className="first-expedition__lead">{description}</p>
          <div className="first-expedition__actions">{action}</div>
        </div>
      </div>
    </section>
  );
}
