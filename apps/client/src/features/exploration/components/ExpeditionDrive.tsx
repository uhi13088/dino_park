import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import {
  applyDriveEvent,
  DRIVE_MAX_DAMAGE,
  DRIVE_MAX_X,
  DRIVE_SECTOR_COUNT,
  DRIVE_SECTOR_MS,
  DRIVE_TICK_MS,
  DRIVE_TICKS_PER_SECTOR,
  getDriveEvents,
  stepDriveX,
  type DriveEvent,
  type DriveExpeditionRun,
} from '@dino-park/shared';
import { Button } from '@/components/ui';
import { createExpeditionDriveScene, type ExpeditionDriveMarker } from './expeditionDriveScene';
import './ExpeditionDrive.css';

interface ExpeditionDriveProps {
  run: DriveExpeditionRun;
  title: string;
  isEgg: boolean;
  onCheckpoint: (sector: number, positions: number[]) => Promise<unknown>;
  onLeave: () => void;
}

type Phase = 'ready' | 'driving' | 'paused' | 'saving' | 'save-error';

const sectorSpeed = [1, 1.45, 1.95];
const normalizeX = (x: number) => (x / DRIVE_MAX_X) * 2 - 1;
const clampX = (x: number) => Math.min(DRIVE_MAX_X, Math.max(0, x));
const markerKinds: Record<DriveEvent['kind'], ExpeditionDriveMarker['kind']> = {
  pickup: 'sample',
  rock: 'rock',
  crossing: 'dino',
  poacher: 'rival',
};
const obstacleNames = {
  rock: '바위',
  crossing: '야생 공룡',
  poacher: '밀렵꾼 차량',
};

function DriveSector({
  run,
  title,
  isEgg,
  onCheckpoint,
  onLeave,
  alreadyStarted,
  rememberStart,
}: ExpeditionDriveProps & { alreadyStarted: boolean; rememberStart: () => void }) {
  const headingId = useId();
  const controlsId = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);
  const drawScene = useRef<ReturnType<typeof createExpeditionDriveScene>>();
  const pressedKeys = useRef(new Set<string>());
  const pointer = useRef<{ id: number; x: number } | null>(null);
  const saveCheckpoint = useRef(onCheckpoint);
  const motion = useRef({
    elapsed: 0,
    distance: 0,
    positions: [] as number[],
    x: run.x,
    targetX: run.x,
    visualX: run.x,
    collected: run.collected,
    damage: run.damage,
    damagedAt: -1000,
  });
  const [phase, setPhase] = useState<Phase>(alreadyStarted ? 'driving' : 'ready');
  const [timeLeft, setTimeLeft] = useState(DRIVE_SECTOR_MS / 1000);
  const [collected, setCollected] = useState(run.collected);
  const [damage, setDamage] = useState(run.damage);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const events = useMemo(() => getDriveEvents(run.seed, run.sector), [run.seed, run.sector]);
  const byTick = useMemo(() => new Map(events.map((event) => [event.tick, event])), [events]);
  const speed = sectorSpeed[run.sector] ?? 1;
  const drawDistanceMs = 4_800 / speed;
  const nextRemaining = (DRIVE_SECTOR_COUNT - run.sector - 1) * (DRIVE_SECTOR_MS / 1000);

  useEffect(() => {
    saveCheckpoint.current = onCheckpoint;
  }, [onCheckpoint]);

  const submitSector = useCallback(async () => {
    setError('');
    setPhase('saving');
    try {
      await saveCheckpoint.current(run.sector, [...motion.current.positions]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '주행 결과를 저장하지 못했어요.');
      setPhase('save-error');
    }
  }, [run.sector]);

  useEffect(() => {
    if (phase === 'paused' || phase === 'save-error') {
      resumeButton.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    drawScene.current = createExpeditionDriveScene(element);
    return () => {
      drawScene.current = undefined;
    };
  }, []);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    const draw = () => {
      const current = motion.current;
      const markers: ExpeditionDriveMarker[] = [];
      for (const event of events) {
        const timeToContact = (event.tick + 1) * DRIVE_TICK_MS - current.elapsed;
        if (timeToContact <= 0 || timeToContact >= drawDistanceMs) continue;
        const approach = 1 - timeToContact / drawDistanceMs;
        const position = event.approachX + (event.x - event.approachX) * approach;
        markers.unshift({
          kind: event.kind === 'pickup' && isEgg ? 'egg' : markerKinds[event.kind],
          position: normalizeX(position),
          approach,
        });
      }
      drawScene.current?.({
        playerPosition: normalizeX(current.visualX),
        distance: current.distance,
        markers,
        damaged: current.elapsed - current.damagedAt < 400,
        finishApproach:
          run.sector === DRIVE_SECTOR_COUNT - 1
            ? Math.max(0, 1 - (DRIVE_SECTOR_MS - current.elapsed) / drawDistanceMs)
            : 0,
      });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    if (phase !== 'driving') return () => observer.disconnect();

    element.focus({ preventScroll: true });
    let previous = 0;
    let frameId = 0;
    const play = (timestamp: number) => {
      const current = motion.current;
      const delta = previous === 0 ? 0 : Math.min(timestamp - previous, DRIVE_TICK_MS);
      previous = timestamp;
      current.elapsed = Math.min(DRIVE_SECTOR_MS, current.elapsed + delta);
      if (current.damage < DRIVE_MAX_DAMAGE) current.distance += (delta / 1000) * 0.47 * speed;
      const tickCount = Math.floor(current.elapsed / DRIVE_TICK_MS);
      while (current.positions.length < tickCount) {
        const tick = current.positions.length;
        const direction =
          Number(pressedKeys.current.has('ArrowRight')) -
          Number(pressedKeys.current.has('ArrowLeft'));
        if (current.damage < DRIVE_MAX_DAMAGE) {
          if (direction !== 0) current.targetX = direction > 0 ? DRIVE_MAX_X : 0;
          current.x = stepDriveX(current.x, current.targetX);
        }
        current.positions.push(current.x);
        const event = byTick.get(tick);
        if (event) {
          const result = applyDriveEvent(
            { collected: current.collected, damage: current.damage },
            event,
            current.x,
          );
          if (result.collected !== current.collected) {
            current.collected = result.collected;
            setCollected(result.collected);
            setFeedback(isEgg ? '알 보관함을 회수했어요.' : `표본 ${event.amount}개를 회수했어요.`);
          }
          if (event.kind !== 'pickup' && result.damage !== current.damage) {
            current.damage = result.damage;
            current.damagedAt = current.elapsed;
            setDamage(result.damage);
            setFeedback(
              result.damage === DRIVE_MAX_DAMAGE
                ? '차량이 멈췄어요. 이번 원정을 정리하고 있어요.'
                : `${obstacleNames[event.kind]}에 부딪혔어요.`,
            );
          }
        }
      }
      current.visualX += (current.x - current.visualX) * (1 - Math.exp(-delta / 32));
      setTimeLeft(Math.ceil((DRIVE_SECTOR_MS - current.elapsed) / 1000));
      draw();
      if (current.positions.length === DRIVE_TICKS_PER_SECTOR) {
        void submitSector();
      } else {
        frameId = requestAnimationFrame(play);
      }
    };
    frameId = requestAnimationFrame(play);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [byTick, drawDistanceMs, events, isEgg, phase, run.sector, speed, submitSector]);

  useEffect(() => {
    function clearInput() {
      pressedKeys.current.clear();
      pointer.current = null;
      motion.current.targetX = motion.current.x;
    }
    function pauseWhenHidden() {
      if (!document.hidden) return;
      clearInput();
      setPhase((current) => (current === 'driving' ? 'paused' : current));
    }
    window.addEventListener('blur', clearInput);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      window.removeEventListener('blur', clearInput);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, []);

  const stopInput = () => {
    const activePointer = pointer.current;
    if (activePointer && canvas.current?.hasPointerCapture(activePointer.id)) {
      canvas.current.releasePointerCapture(activePointer.id);
    }
    pointer.current = null;
    pressedKeys.current.clear();
    motion.current.targetX = motion.current.x;
  };
  const pause = () => {
    stopInput();
    setPhase('paused');
  };
  const start = () => {
    rememberStart();
    setPhase('driving');
  };
  const keyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (phase !== 'driving') return;
    if (event.key === 'Escape') {
      pause();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      pressedKeys.current.add(event.key);
    }
  };
  const keyUp = (event: KeyboardEvent<HTMLElement>) => {
    if (!pressedKeys.current.delete(event.key)) return;
    if (pressedKeys.current.size === 0) motion.current.targetX = motion.current.x;
  };
  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'driving' || event.button !== 0 || pointer.current) return;
    event.currentTarget.focus({ preventScroll: true });
    pointer.current = { id: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const activePointer = pointer.current;
    if (!activePointer || activePointer.id !== event.pointerId) return;
    const width = Math.max(1, event.currentTarget.getBoundingClientRect().width);
    const delta = ((event.clientX - activePointer.x) / width) * DRIVE_MAX_X * 1.45;
    activePointer.x = event.clientX;
    motion.current.targetX = clampX(motion.current.targetX + delta);
  };
  const pointerReleased = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current?.id === event.pointerId) pointer.current = null;
  };

  return (
    <section
      className="expedition-drive"
      aria-labelledby={headingId}
      onKeyDown={keyDown}
      onKeyUp={keyUp}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) stopInput();
      }}
    >
      <header className="expedition-drive__header">
        <div>
          <h2 id={headingId}>{title}</h2>
          <p>
            {run.sector + 1} / {DRIVE_SECTOR_COUNT}구간 · 속도 {speed.toFixed(2)}배
          </p>
        </div>
        <div className="expedition-drive__actions">
          {phase === 'driving' && (
            <Button type="button" variant="outline" onClick={pause}>
              일시 정지
            </Button>
          )}
          <Button type="button" variant="ghost" disabled={phase === 'saving'} onClick={onLeave}>
            목록으로
          </Button>
        </div>
      </header>

      <dl className="expedition-drive__hud">
        <div>
          <dt>{isEgg ? '알 보관함 점수' : '표본 회수'}</dt>
          <dd>
            {collected} <span>/ {run.required}</span>
          </dd>
        </div>
        <div>
          <dt>차량 내구도</dt>
          <dd>
            {DRIVE_MAX_DAMAGE - damage} <span>/ {DRIVE_MAX_DAMAGE}</span>
          </dd>
        </div>
        <div>
          <dt>귀환까지</dt>
          <dd>
            {nextRemaining + timeLeft}
            <span>초</span>
          </dd>
        </div>
      </dl>

      <div className="expedition-drive__viewport">
        <canvas
          ref={canvas}
          tabIndex={phase === 'driving' ? 0 : -1}
          aria-label="지프 주행 화면"
          aria-describedby={controlsId}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerReleased}
          onPointerCancel={pointerReleased}
          onLostPointerCapture={pointerReleased}
        />
        {phase !== 'driving' && (
          <div className="expedition-drive__overlay">
            <div className="expedition-drive__card">
              {phase === 'saving' ? (
                <p role="status">이번 구간의 주행을 저장하고 있어요.</p>
              ) : phase === 'save-error' ? (
                <>
                  <p role="alert">{error}</p>
                  <Button ref={resumeButton} type="button" onClick={() => void submitSector()}>
                    다시 저장
                  </Button>
                </>
              ) : (
                <>
                  <p>{phase === 'paused' ? '일시 정지' : '회수물을 모아 귀환하세요'}</p>
                  <Button ref={resumeButton} type="button" onClick={start}>
                    {phase === 'paused' || run.sector > 0 ? '계속 주행' : '주행 시작'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="expedition-drive__footer">
        <p id={controlsId}>화면을 좌우로 끌거나 방향키를 눌러 지프를 움직이세요.</p>
      </div>
      <p className="expedition-drive__feedback" role="status">
        {feedback}
      </p>
    </section>
  );
}

export default function ExpeditionDrive(props: ExpeditionDriveProps) {
  const startedRun = useRef<string | null>(null);
  if (props.run.status !== 'running') return null;
  return (
    <DriveSector
      key={`${props.run.id}:${props.run.sector}`}
      alreadyStarted={startedRun.current === props.run.id}
      rememberStart={() => {
        startedRun.current = props.run.id;
      }}
      {...props}
    />
  );
}
