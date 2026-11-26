import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createStegosaurusScene,
  type StegosaurusAction,
  type StegosaurusScene,
  type StegosaurusView,
} from '@/game/safari/StegosaurusRealtimeScene';
import './SafariPreview.css';
import './StegosaurusRealtimePage.css';

const motions = [
  ['idle', '대기'],
  ['turn', '몸 돌리기'],
  ['attack', '꼬리 반격'],
] as const;

const views = [
  ['overview', '기본 배율'],
  ['close', '확대'],
] as const;

type Status = 'loading' | 'ready' | 'model' | 'graphics';

export default function StegosaurusRealtimePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<HTMLImageElement>(null);
  const sceneRef = useRef<StegosaurusScene>();
  const [status, setStatus] = useState<Status>('loading');
  const [action, setAction] = useState<StegosaurusAction>('idle');
  const [view, setView] = useState<StegosaurusView>('overview');
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas || !field) return;
    try {
      const scene = createStegosaurusScene({
        canvas,
        field,
        onReady: () => setStatus('ready'),
        onAction: setAction,
        onError: setStatus,
      });
      sceneRef.current = scene;
      return () => {
        sceneRef.current = undefined;
        scene.dispose();
      };
    } catch {
      setStatus('graphics');
    }
  }, [loadAttempt]);

  useEffect(() => {
    sceneRef.current?.setPaused(paused);
    sceneRef.current?.setView(view);
  }, [paused, view, loadAttempt]);

  const ready = status === 'ready';
  const error = status === 'model' || status === 'graphics';

  function playMotion(motion: StegosaurusAction) {
    sceneRef.current?.play(motion);
    setPaused(false);
  }

  function retry() {
    setAction('idle');
    setStatus('loading');
    setLoadAttempt((attempt) => attempt + 1);
  }

  return (
    <section
      className="safari-preview stegosaurus-realtime"
      aria-labelledby="stegosaurus-realtime-title"
      data-testid="stegosaurus-realtime"
      data-view={view}
      data-action={action}
      data-ready={ready}
      data-paused={paused}
    >
      <img
        ref={fieldRef}
        className="stegosaurus-realtime__field"
        src="/assets/safari-encounter/field.webp"
        alt=""
      />
      <canvas
        ref={canvasRef}
        className="safari-preview__canvas"
        role="img"
        aria-label="파크에서 움직이는 3D 스테고사우루스"
      />
      <header className="safari-preview__top">
        <div className="safari-preview__identity">
          <Link className="safari-preview__control safari-preview__back" to="/park">
            파크로
          </Link>
          <h1 id="stegosaurus-realtime-title">스테고사우루스</h1>
        </div>
        <div className="stegosaurus-realtime__controls" role="group" aria-label="카메라 배율">
          {views.map(([mode, label]) => (
            <button
              type="button"
              key={mode}
              aria-pressed={view === mode}
              className="safari-preview__control"
              onClick={() => setView(mode)}
              disabled={!ready}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {!ready ? (
        <div className="safari-preview__loading" role={error ? 'alert' : 'status'}>
          <div className="stegosaurus-realtime__notice">
            <p>
              {status === 'graphics'
                ? '이 기기에서 3D 화면을 열지 못했어요.'
                : status === 'model'
                  ? '스테고사우루스를 불러오지 못했어요.'
                  : '스테고사우루스를 불러오는 중…'}
            </p>
            {error && (
              <button type="button" className="safari-preview__control" onClick={retry}>
                다시 시도
              </button>
            )}
          </div>
        </div>
      ) : (
        <footer className="safari-preview__bottom stegosaurus-realtime__bottom">
          <button
            type="button"
            className="safari-preview__control"
            onClick={() => setPaused((current) => !current)}
          >
            {paused ? '재개' : '일시정지'}
          </button>
          <div className="stegosaurus-realtime__controls" role="group" aria-label="공룡 동작">
            {motions.map(([motion, label]) => (
              <button
                type="button"
                key={motion}
                className="safari-preview__control"
                aria-pressed={action === motion}
                disabled={action !== 'idle'}
                onClick={() => playMotion(motion)}
              >
                {label}
              </button>
            ))}
          </div>
        </footer>
      )}
    </section>
  );
}
