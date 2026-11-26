import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EarlyResourceMaterial, ResourcesResponse } from '@dino-park/shared';
import type { ReactNode } from 'react';

export type ParkHudPanel = 'leader' | 'operations' | 'build' | 'menu';

const icons: Record<string, ReactNode> = {
  book: (
    <>
      <path d="M12 6.5C9 4 5.4 3.5 3 4.5v14c3-1 6.8-.3 9 2 2.2-2.3 6-3 9-2v-14c-2.4-1-6-.5-9 2v14" />
      <path d="M6.5 8.5c1 .1 2 .5 2.7 1m-2.7 3c1 .1 2 .5 2.7 1m5.6-4c.7-.5 1.7-.9 2.7-1" />
    </>
  ),
  figures: (
    <>
      <circle cx="12" cy="8.5" r="4.5" />
      <path d="m9.3 12.1-2.6 7 3.2-1.1 1.6 3 1.6-5.6 2 4.1 1.2-2.8 3 .6-3.4-6.7M10.1 8.4l1.2 1.4 2.5-2.6" />
    </>
  ),
  explore: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.8 7.8-2 6-6 2.4 2.2-6z" fill="currentColor" />
    </>
  ),
  operations: (
    <>
      <path d="M4 19h16M6 15v-3m6 3V6m6 9v-6" strokeWidth="2.8" />
      <path d="M4 4h16" opacity=".45" />
    </>
  ),
  build: (
    <>
      <path d="m4 20 8.5-8.5m-.7-6.8 2.7-.7 6 6-3 3-3-3-2 2-3-3 2-2-2-2 1.4-.3Z" />
      <path d="m4 20 1 1" />
    </>
  ),
  menu: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  fit: (
    <>
      <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </>
  ),
  home: <path d="m3 11 9-7 9 7M5 10v10h14V10m-9 10v-6h4v6" />,
  fuel: (
    <>
      <path d="M6 8h9l2 3v8H6zM8 8V5h5v3" fill="#b78946" stroke="#f0cd87" />
      <path d="m10 12 4 4m0-4-4 4" stroke="#54381d" />
    </>
  ),
  gold: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="#efb95f" stroke="#f9dc95" />
      <path
        d="M12 7v10m-2.5-2.4h3.2a1.4 1.4 0 1 0 0-2.8h-1.4a1.4 1.4 0 1 1 0-2.8h3"
        stroke="#694222"
      />
    </>
  ),
  wood: (
    <>
      <path d="m5 10 9.4-5 5.1 3v5.7L10 19l-5-3z" fill="#b97b4f" stroke="#e5b083" />
      <path d="m10 12.6 9.4-4.6M10 12.6V19m-2.2-5.9v2.3" stroke="#f1c59b" />
    </>
  ),
  stone: (
    <>
      <path d="m4 15 3-7 7-3 5 4 1.3 7-5 3.2-8-.5z" fill="#9c9d93" stroke="#dfe2d5" />
      <path d="m8 9 3.7 4.1 4.5-1.2m-4.5 1.2-1 5.2" stroke="#eef0e1" />
    </>
  ),
  metal: (
    <>
      <path d="m4 15 4-7 10-2 3 5-3.4 6L8 19z" fill="#a2919a" stroke="#e6d4da" />
      <path d="m4 15 4.2.3 2.6-5.2L18 6m-7.2 4.1 9.7.9" stroke="#f1e6e9" />
    </>
  ),
};

export function ParkIcon({ name }: { name: keyof typeof icons }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

type HudArtwork =
  | EarlyResourceMaterial
  | 'gold'
  | 'build'
  | 'book'
  | 'figures'
  | 'explore'
  | 'operations';

export function ParkHudArt({ name }: { name: HudArtwork }) {
  const [missing, setMissing] = useState(false);
  if (missing) return <ParkIcon name={name} />;

  return (
    <img
      className="park-hud__art"
      src={`/assets/ui/park-hud/${name}.webp`}
      alt=""
      width={96}
      height={96}
      draggable={false}
      onError={() => setMissing(true)}
    />
  );
}

const materialNames: Record<EarlyResourceMaterial, string> = {
  wood: '목재',
  stone: '석재',
  metal: '금속',
};
const number = new Intl.NumberFormat('ko-KR');

interface Props {
  level: number;
  expPercent: number;
  isOpen?: boolean;
  operationAlerts: number;
  gold?: number;
  goldCapacity?: number;
  inventory?: ResourcesResponse['inventory'];
  builders: { available: number; total: number };
  panel: ParkHudPanel | null;
  isPlacing: boolean;
  onPanel: (panel: ParkHudPanel) => void;
  onResources: () => void;
}

export default function ParkHud({
  level,
  expPercent,
  isOpen,
  operationAlerts,
  gold,
  goldCapacity,
  inventory,
  builders,
  panel,
  isPlacing,
  onPanel,
  onResources,
}: Props) {
  const descriptionId = useId();
  const goldLabel =
    gold === undefined
      ? '골드 확인 중'
      : goldCapacity
        ? `골드 ${number.format(gold)} · 보관 한도 ${number.format(goldCapacity)}`
        : `골드 ${number.format(gold)}`;
  const builderLabel = `건설자 ${builders.total}명 중 ${builders.available}명 사용 가능`;

  return (
    <>
      <header className="park-hud__top" aria-label="파크 상태">
        <button
          type="button"
          className="park-hud__plate park-hud__leader"
          onClick={() => onPanel('leader')}
          disabled={isPlacing}
          aria-label="파크 리더"
          aria-expanded={panel === 'leader'}
          aria-describedby={descriptionId}
        >
          <span className="park-hud__portrait" aria-hidden="true">
            <img
              src="/assets/ui/park-hud/alex.webp"
              alt=""
              width={144}
              height={144}
              draggable={false}
            />
            <span className="park-hud__badge">
              <svg viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="none" stroke="#7b6649" strokeWidth="2" />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="#f1c473"
                  strokeWidth="2.4"
                  pathLength="100"
                  strokeDasharray={`${expPercent} 100`}
                  transform="rotate(-90 20 20)"
                />
              </svg>
              <span>Lv.{level}</span>
              <i className="park-hud__light" data-open={isOpen} />
            </span>
          </span>
          <span className="park-hud__name">
            <strong>알렉스</strong>
            <small>사육 리더</small>
          </span>
        </button>
        <span className="sr-only" id={descriptionId}>
          파크 레벨 {level} ·{' '}
          {isOpen === undefined ? '개장 상태 확인 중' : isOpen ? '개장 중' : '휴장 중'}
        </span>
        <div className="park-hud__economy">
          <button
            type="button"
            className="park-hud__builders"
            onClick={() => onPanel('build')}
            disabled={isPlacing}
            aria-label={builderLabel}
            aria-expanded={panel === 'build'}
            title={builderLabel}
          >
            <ParkHudArt name="build" />
            <span>
              {builders.available}/{builders.total}
            </span>
          </button>
          <ul className="park-hud__resources" aria-label="건설 자원">
            <li>
              <button
                type="button"
                onClick={onResources}
                disabled={isPlacing}
                aria-label={goldLabel}
                title={goldLabel}
              >
                <ParkHudArt name="gold" />
                <span>{gold === undefined ? '–' : number.format(gold)}</span>
                {gold !== undefined && goldCapacity && (
                  <span className="park-hud__gold-gauge" aria-hidden="true">
                    <i
                      style={{
                        inlineSize: `${Math.min(100, Math.max(0, (gold / goldCapacity) * 100))}%`,
                      }}
                    />
                  </span>
                )}
              </button>
            </li>
            {(['wood', 'stone', 'metal'] as const).map((material) => {
              const name = materialNames[material];
              const amount = inventory?.find((item) => item.material === material)?.amount;
              const label =
                amount === undefined ? `${name} 확인 중` : `${name} ${number.format(amount)}개`;
              return (
                <li key={material}>
                  <button
                    type="button"
                    onClick={onResources}
                    disabled={isPlacing}
                    aria-label={label}
                    title={label}
                  >
                    <ParkHudArt name={material} />
                    <span>{amount === undefined ? '–' : number.format(amount)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </header>
      {!isPlacing && (
        <nav className="park-hud__nav" aria-label="파크 조작">
          <div className="park-hud__cluster">
            <div className="park-hud__plate park-hud__actions park-hud__actions--collection">
              <Link to="/dinosaur">
                <ParkHudArt name="book" />
                <span>도감</span>
              </Link>
              <Link to="/great-figures">
                <ParkHudArt name="figures" />
                <span>위인</span>
              </Link>
            </div>
            <Link to="/exploration" className="park-hud__secondary" aria-label="탐험" title="탐험">
              <ParkHudArt name="explore" />
            </Link>
          </div>
          <div className="park-hud__cluster">
            <button
              type="button"
              className="park-hud__secondary"
              onClick={() => onPanel('menu')}
              aria-label="더 보기"
              title="더 보기"
              aria-expanded={panel === 'menu'}
            >
              <ParkIcon name="menu" />
            </button>
            <div className="park-hud__plate park-hud__actions park-hud__actions--management">
              <button
                type="button"
                onClick={() => onPanel('operations')}
                aria-expanded={panel === 'operations'}
              >
                <ParkHudArt name="operations" />
                <span>운영</span>
                {operationAlerts > 0 && (
                  <>
                    <span className="park-hud__notice" aria-hidden="true">
                      {operationAlerts}
                    </span>
                    <span className="sr-only"> 점검 필요 {operationAlerts}건</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="park-hud__build"
                onClick={() => onPanel('build')}
                aria-expanded={panel === 'build'}
              >
                <ParkHudArt name="build" />
                <span>건설</span>
              </button>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
