import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  defaultSafariCamera,
  drawSafariFrame,
  loadSafariAssets,
  SAFARI_SOUND_URLS,
  type SafariAssets,
} from '@/game/safari/drawSafariEncounter';
import {
  getSafariSnapshot,
  SAFARI_DURATION,
  SAFARI_EVENTS,
  type SafariSnapshot,
} from '@/game/safari/safariEncounter';
import './SafariPreview.css';

type Playback = 'ready' | 'playing' | 'paused' | 'finished';
type Cue = keyof typeof SAFARI_SOUND_URLS;

const stageCaption: Record<SafariSnapshot['stage'], string> = {
  approach: '두 공룡이 물가로 접근 중',
  threat: '스테고사우루스가 꼬리를 들어 경계 중',
  turn: '스테고사우루스가 몸을 돌립니다',
  'robot-entry': '관리 로봇이 두 공룡 사이로 이동 중',
  intervention: '로봇이 두 개체를 분리했습니다',
  charge: '티렉스가 돌진합니다',
  strike: '스테고사우루스의 꼬리 반격',
  retreat: '두 공룡이 서로 멀어집니다',
  complete: '',
};

export default function SafariPreviewPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext>();
  const audioBuffers = useRef<Partial<Record<Cue, AudioBuffer>>>({});
  const playhead = useRef(0);
  const cameraRef = useRef(defaultSafariCamera());
  const [assets, setAssets] = useState<SafariAssets>();
  const [assetError, setAssetError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [playback, setPlayback] = useState<Playback>('ready');
  const [robotOn, setRobotOn] = useState(true);
  const [follow, setFollow] = useState(false);
  const [sound, setSound] = useState(true);
  const [stage, setStage] = useState<SafariSnapshot['stage']>('approach');
  const [outcome, setOutcome] = useState<SafariSnapshot['outcome']>('pending');
  const [wholeSecond, setWholeSecond] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadSafariAssets()
      .then((loaded) => {
        if (!cancelled) setAssets(loaded);
      })
      .catch(() => {
        if (!cancelled) setAssetError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  useEffect(
    () => () => {
      const audio = audioRef.current;
      if (audio && audio.state !== 'closed') void audio.close().catch(() => undefined);
      audioRef.current = undefined;
    },
    [],
  );

  // Decode once after a user gesture so the playback cues also work in mobile browsers.
  function enableAudio() {
    let audio = audioRef.current;
    if (!audio) {
      if (typeof AudioContext === 'undefined') return;
      audio = new AudioContext();
      audioRef.current = audio;
      const decoder = audio;
      for (const [name, url] of Object.entries(SAFARI_SOUND_URLS)) {
        void fetch(url)
          .then((result) => {
            if (!result.ok) throw new Error('Unable to load safari sound');
            return result.arrayBuffer();
          })
          .then((bytes) => decoder.decodeAudioData(bytes))
          .then((buffer) => {
            audioBuffers.current[name as Cue] = buffer;
          })
          .catch(() => undefined);
      }
    }
    if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!assets || !canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      setAssetError(true);
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let lastFrame = 0;
    let staticFrames = 0;
    const resetFrameTime = () => {
      lastFrame = 0;
    };

    const playCue = (name: Cue) => {
      const buffer = audioBuffers.current[name];
      const audio = audioRef.current;
      if (!sound || !buffer || !audio || audio.state !== 'running') return;
      const source = audio.createBufferSource();
      source.buffer = buffer;
      source.connect(audio.destination);
      source.start();
    };
    const paint = () =>
      drawSafariFrame(
        canvas,
        ctx,
        assets,
        getSafariSnapshot(playhead.current, robotOn),
        cameraRef.current,
        follow,
        reducedMotion,
      );
    const frame = (now: number) => {
      if (playback === 'playing') {
        const before = playhead.current;
        const delta = lastFrame ? (now - lastFrame) / 1000 : 0;
        playhead.current = Math.min(SAFARI_DURATION, before + delta);
        const {
          time,
          stage: current,
          outcome: result,
        } = getSafariSnapshot(playhead.current, robotOn);
        if (before < SAFARI_EVENTS.threat && time >= SAFARI_EVENTS.threat) playCue('warning');
        const event = robotOn ? SAFARI_EVENTS.intervention : SAFARI_EVENTS.strike;
        if (before < event && time >= event) playCue(robotOn ? 'intervene' : 'impact');
        setWholeSecond(Math.floor(time));
        setStage(current);
        setOutcome(result);
        if (time === SAFARI_DURATION) setPlayback('finished');
      }
      paint();
      lastFrame = now;
      staticFrames++;
      if (
        (playback === 'playing' && playhead.current < SAFARI_DURATION) ||
        staticFrames < (reducedMotion ? 1 : 26)
      )
        raf = requestAnimationFrame(frame);
    };
    const resize = new ResizeObserver(paint);
    resize.observe(canvas);
    document.addEventListener('visibilitychange', resetFrameTime);
    raf = requestAnimationFrame(frame);
    return () => {
      resize.disconnect();
      document.removeEventListener('visibilitychange', resetFrameTime);
      cancelAnimationFrame(raf);
    };
  }, [assets, follow, playback, robotOn, sound]);

  function togglePlayback() {
    if (playback === 'playing') {
      setPlayback('paused');
      return;
    }
    if (playback === 'ready' || playback === 'finished') {
      playhead.current = 0;
      setStage('approach');
      setOutcome('pending');
      setWholeSecond(0);
    }
    if (sound) enableAudio();
    setPlayback('playing');
  }

  function toggleRobot() {
    setRobotOn((previous) => !previous);
    playhead.current = 0;
    setStage('approach');
    setOutcome('pending');
    setWholeSecond(0);
    setPlayback('ready');
  }

  const sceneName = '티렉스와 스테고사우루스의 물가 대치';
  const collisionResolved = playback === 'finished' && outcome === 'repelled';
  const caption =
    playback === 'ready'
      ? '물가 관찰 지점'
      : playback === 'paused'
        ? '관람 일시정지'
        : playback === 'finished'
          ? collisionResolved
            ? '꼬리 반격으로 티렉스가 물러났습니다'
            : '로봇 개입으로 두 공룡이 물러났습니다'
          : stageCaption[stage];
  const playText: Record<Playback, string> = {
    ready: '재생',
    playing: '일시정지',
    paused: '이어 보기',
    finished: '다시 보기',
  };

  return (
    <section
      className="safari-preview"
      aria-labelledby="safari-title"
      data-testid="safari-scene"
      data-stage={playback === 'ready' ? 'ready' : stage}
      data-playback={playback}
      data-robot={robotOn ? 'on' : 'off'}
      data-camera={follow ? 'jeep' : 'overview'}
      data-outcome={outcome}
    >
      <canvas
        ref={canvasRef}
        className="safari-preview__canvas"
        role="img"
        aria-label={sceneName}
      />
      <header className="safari-preview__top">
        <div className="safari-preview__identity">
          <Link className="safari-preview__control safari-preview__back" to="/park">
            파크로
          </Link>
          <h1 id="safari-title">사파리 시범 관람</h1>
        </div>
        <button
          type="button"
          className="safari-preview__control safari-preview__robot"
          role="switch"
          aria-label="로봇 중재"
          aria-checked={robotOn}
          disabled={playback === 'playing' || playback === 'paused'}
          onClick={toggleRobot}
        >
          로봇 중재 <span aria-hidden="true">{robotOn ? '켜짐' : '꺼짐'}</span>
        </button>
      </header>
      {!assets || assetError ? (
        <div className="safari-preview__loading" role={assetError ? 'alert' : 'status'}>
          <p>
            {assetError ? '관람 에셋을 불러오지 못했습니다.' : '사파리 관람을 준비하고 있어요.'}
          </p>
          {assetError && (
            <button
              className="safari-preview__control"
              type="button"
              onClick={() => {
                setAssets(undefined);
                setAssetError(false);
                setLoadAttempt((attempt) => attempt + 1);
              }}
            >
              다시 불러오기
            </button>
          )}
        </div>
      ) : (
        <footer className="safari-preview__bottom">
          <div className="safari-preview__status">
            <p role="status">{caption}</p>
            <progress value={wholeSecond} max={SAFARI_DURATION} aria-label="관람 진행" />
          </div>
          <div className="safari-preview__actions">
            <button
              type="button"
              className="safari-preview__control"
              aria-pressed={follow}
              onClick={() => setFollow((value) => !value)}
            >
              지프 따라가기
            </button>
            <button
              type="button"
              className="safari-preview__control safari-preview__sound"
              aria-label="소리"
              aria-pressed={sound}
              onClick={() => {
                if (!sound) enableAudio();
                setSound((value) => !value);
              }}
            >
              소리 <span aria-hidden="true">{sound ? '켜짐' : '꺼짐'}</span>
            </button>
            <button
              type="button"
              className="safari-preview__control safari-preview__play"
              onClick={togglePlayback}
            >
              {playText[playback]}
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}
