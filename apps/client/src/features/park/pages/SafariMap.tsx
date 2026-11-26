import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  getSafariGate,
  type BuildingResponse,
  type ParkSafariResponse,
  type SafariTile,
  type SafariZoneKind,
} from '@dino-park/shared';
import { gridToScreen, screenToGrid } from '@game/engine/IsometricGrid';
import { getBuildingRasterArtwork, getCompletedBuildingArtworkLevel } from '@game/parkArtwork';
import {
  drawSafariPark,
  safariDinosaurArt,
  safariMapArt,
  type SafariCamera,
} from './drawSafariPark';
import {
  sameSafariTile,
  safariDraftLayout,
  safariTileKey,
  type SafariDraft,
  type SafariTool,
} from './safariEditor';

type Point = { x: number; y: number };
type Viewport = { width: number; height: number };
type JeepMotion = { position: SafariTile; flipped: boolean; pathProgress: number };
type Gesture = {
  id: number;
  start: Point;
  startCamera: SafariCamera;
  startTile: SafariTile;
  lastTile: SafariTile;
  edit: boolean;
  remove: boolean;
  moved: boolean;
  painted: Set<string>;
};
type SafariMapProps = {
  safari: ParkSafariResponse;
  draft: SafariDraft;
  buildings: readonly BuildingResponse[];
  pathTiles: readonly SafariTile[];
  zone: SafariZoneKind;
  tool: SafariTool | null;
  canEdit: boolean;
  stage?: 0 | 1;
  traveling: boolean;
  route: SafariTile[];
  onArrive: () => void;
  onApply: (tile: SafariTile, remove: boolean) => void;
};

const MIN_ZOOM = 0.18;
const MAX_ZOOM = 1.6;
const GATE_APPROACH_TILES = 1.95;
const GATE_SWING_TILES = 0.7;
const constrain = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
const zoomLimit = (value: number) => constrain(value, MIN_ZOOM, MAX_ZOOM);
const movesLeft = (from?: SafariTile, to?: SafariTile) =>
  !!from && !!to && to.x - from.x < to.y - from.y;

function centerOn(tiles: SafariTile[], size: Viewport, maxZoom = 0.96): SafariCamera {
  const points = tiles.map(({ x, y }) => gridToScreen(x, y));
  const xList = points.map(({ x }) => x);
  const yList = points.map(({ y }) => y);
  const left = Math.min(...xList);
  const right = Math.max(...xList);
  const top = Math.min(...yList);
  const bottom = Math.max(...yList);
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2 - 15,
    zoom: Math.min(
      maxZoom,
      zoomLimit(Math.min(size.width / (right - left + 125), size.height / (bottom - top + 142))),
    ),
  };
}

function plotCorners({ width, height }: Viewport) {
  return [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
  ];
}

function selectPlotFocus(draft: SafariDraft, bounds: Viewport) {
  const tiles = [...draft.zones.herbivore.tiles, ...draft.zones.carnivore.tiles];
  return tiles.length > 0 ? tiles : plotCorners(bounds);
}

function visibleTile(point: Point, camera: SafariCamera, size: Viewport) {
  return screenToGrid(
    camera.x + (point.x - size.width / 2) / camera.zoom,
    camera.y + (point.y - size.height / 2) / camera.zoom,
  );
}

function canPaintRemove(
  draft: SafariDraft,
  zone: SafariZoneKind,
  tool: SafariTool | null,
  tile: SafariTile,
) {
  if (!tool || tool === 'stop') return false;
  return draft.zones[zone][tool === 'fence' ? 'tiles' : tool].some(
    (entry) => safariTileKey(entry) === safariTileKey(tile),
  );
}

function edgeCamera(camera: SafariCamera, bounds: Viewport): SafariCamera {
  const left = gridToScreen(0, bounds.height - 1).x;
  const right = gridToScreen(bounds.width - 1, 0).x;
  const bottom = gridToScreen(bounds.width - 1, bounds.height - 1).y;
  return {
    ...camera,
    x: constrain(camera.x, left - 70, right + 70),
    y: constrain(camera.y, -70, bottom + 70),
  };
}

function drawCursorPath(gesture: Gesture, tile: SafariTile, paint: (tile: SafariTile) => void) {
  // Interpolate drag samples along cardinal grid steps. A diagonal by itself only touches a corner.
  let { x, y } = gesture.lastTile;
  while (x !== tile.x || y !== tile.y) {
    if (Math.abs(tile.x - x) >= Math.abs(tile.y - y)) x += Math.sign(tile.x - x);
    else y += Math.sign(tile.y - y);
    paint({ x, y });
  }
  gesture.lastTile = tile;
}

export default function SafariMap({
  safari,
  draft,
  buildings,
  pathTiles,
  zone,
  tool,
  canEdit,
  stage,
  traveling,
  route,
  onArrive,
  onApply,
}: SafariMapProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const firstFit = useRef(false);
  const [size, setSize] = useState<Viewport>({ width: 0, height: 0 });
  const [camera, setCamera] = useState<SafariCamera>({ x: 0, y: 390, zoom: MIN_ZOOM });
  const [focused, setFocused] = useState(false);
  const [tile, setTile] = useState<SafariTile>();
  const [jeepMotion, setJeepMotion] = useState<JeepMotion>();
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const editing = stage === undefined;
  const tour = safari.tour;
  const view = stage !== undefined && !traveling ? tour?.views[stage] : undefined;
  const gate = useMemo(
    () => (editing ? getSafariGate(safariDraftLayout(draft), route) : tour?.gate),
    [draft, editing, route, tour?.gate],
  );
  const paths = useMemo(() => {
    const used = new Set(Object.values(safariMapArt));
    for (const dino of safari.dinosaurs) {
      const path = safariDinosaurArt(dino.speciesId);
      if (path) used.add(path);
    }
    for (const building of buildings) {
      const path = getBuildingRasterArtwork(
        building.typeId,
        getCompletedBuildingArtworkLevel(building),
      )?.path;
      if (path) used.add(path);
    }
    return [...used].sort().join('|');
  }, [safari.dinosaurs, buildings]);
  const jeep = traveling ? (jeepMotion?.position ?? tour?.path[0]) : view?.tile;
  const jeepFlipped = traveling
    ? (jeepMotion?.flipped ?? movesLeft(tour?.path[0], tour?.path[1]))
    : stage === 1
      ? movesLeft(tour?.path.at(-2), tour?.path.at(-1))
      : movesLeft(tour?.path[0], tour?.path[1]);
  const gateEntry = gate
    ? (tour?.path.findIndex((tile) => sameSafariTile(tile, gate.inside)) ?? -1)
    : -1;
  const gateCrossing = gateEntry - 0.5;
  const gateOpening =
    traveling && gateEntry > 0
      ? constrain(
          (GATE_APPROACH_TILES - Math.abs((jeepMotion?.pathProgress ?? 0) - gateCrossing)) /
            GATE_SWING_TILES,
          0,
          1,
        )
      : 0;

  useEffect(() => {
    let current = true;
    for (const src of paths.split('|')) {
      const image = new Image();
      image.src = src;
      void image
        .decode()
        .then(() => {
          if (!current) return;
          setImages((loaded) => (loaded.has(src) ? loaded : new Map(loaded).set(src, image)));
        })
        .catch(() => undefined);
    }
    return () => {
      current = false;
    };
  }, [paths]);

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const resize = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (size.width === 0 || firstFit.current) return;
    firstFit.current = true;
    setCamera(centerOn(selectPlotFocus(draft, safari.bounds), size));
  }, [draft, safari.bounds, size]);

  useEffect(() => {
    if (!view || !size.width) return;
    const visiblePen = draft.zones[view.zoneKind].tiles;
    const approach = view.zoneKind === 'carnivore' && gate ? [gate.outside] : [];
    setCamera(centerOn([view.tile, ...visiblePen, ...approach], size, 1.25));
  }, [draft.zones, gate, size, view]);

  useEffect(() => {
    if (!traveling || !tour || tour.path.length < 2) {
      setJeepMotion(undefined);
      return;
    }
    const path = tour.path;
    const duration = Math.min(7600, Math.max(1500, (path.length - 1) * 380));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let beginning: number | undefined;
    const follow = (now: number) => {
      beginning ??= now;
      const fraction = Math.min(1, (now - beginning) / duration);
      const index = fraction * (path.length - 1);
      const tileIndex = Math.min(path.length - 2, Math.floor(index));
      const a = path[tileIndex]!;
      const b = path[tileIndex + 1]!;
      const tween = index - tileIndex;
      const position = { x: a.x + (b.x - a.x) * tween, y: a.y + (b.y - a.y) * tween };
      const center = gridToScreen(position.x, position.y);
      setJeepMotion({ position, flipped: movesLeft(a, b), pathProgress: index });
      setCamera((previous) => ({ ...previous, x: center.x, y: center.y - 20 }));
      if (fraction < 1) frame = requestAnimationFrame(follow);
      else onArrive();
    };
    if (reducedMotion) onArrive();
    else frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [traveling, tour, onArrive]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx || !size.width || !size.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(size.width * dpr);
    const height = Math.round(size.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSafariPark(ctx, {
      viewport: size,
      camera,
      safari,
      draft,
      buildings,
      pathTiles,
      images,
      activeZone: zone,
      selectedTile: editing && focused ? tile : undefined,
      route: editing ? route : tour?.path,
      tourView: view,
      gate: gate ?? undefined,
      gateOpening,
      jeep,
      jeepFlipped,
      edit: editing && canEdit,
    });
  }, [
    buildings,
    camera,
    canEdit,
    draft,
    editing,
    focused,
    gate,
    gateOpening,
    images,
    jeep,
    jeepFlipped,
    pathTiles,
    safari,
    route,
    size,
    tile,
    tour,
    view,
    zone,
  ]);

  const inBounds = (p: SafariTile) =>
    p.x >= 0 && p.x < safari.bounds.width && p.y >= 0 && p.y < safari.bounds.height;
  const pointerPosition = ({
    clientX,
    clientY,
    currentTarget,
  }: PointerEvent<HTMLCanvasElement>) => {
    const rect = currentTarget.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const paint = (action: Gesture, position: SafariTile) => {
    const key = safariTileKey(position);
    if (!inBounds(position) || action.painted.has(key)) return;
    action.painted.add(key);
    onApply(position, action.remove);
  };
  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (gesture.current || event.button > 0) return;
    const point = pointerPosition(event);
    const nextTile = visibleTile(point, camera, size);
    gesture.current = {
      id: event.pointerId,
      edit: editing && canEdit && tool !== null,
      start: point,
      startCamera: camera,
      startTile: nextTile,
      lastTile: nextTile,
      remove: canPaintRemove(draft, zone, tool, nextTile),
      moved: false,
      painted: new Set(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPosition(event);
    const nextTile = visibleTile(point, camera, size);
    const action = gesture.current;
    if (!action) {
      if (event.pointerType === 'mouse' && inBounds(nextTile)) setTile(nextTile);
      return;
    }
    if (action.id !== event.pointerId) return;
    const dx = point.x - action.start.x;
    const dy = point.y - action.start.y;
    const moved = Math.hypot(dx, dy) > 6;
    if (!moved && !action.moved) return;
    if (action.edit) {
      if (!action.moved && tool !== 'stop') paint(action, action.startTile);
      if (tool !== 'stop') drawCursorPath(action, nextTile, (p) => paint(action, p));
      if (inBounds(nextTile)) setTile(nextTile);
    } else if (!traveling) {
      setCamera(
        edgeCamera(
          {
            ...action.startCamera,
            x: action.startCamera.x - dx / action.startCamera.zoom,
            y: action.startCamera.y - dy / action.startCamera.zoom,
          },
          safari.bounds,
        ),
      );
    }
    action.moved = true;
  };
  const pointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const action = gesture.current;
    if (!action || action.id !== event.pointerId) return;
    gesture.current = null;
    const nextTile = visibleTile(pointerPosition(event), camera, size);
    if (action.edit && (!action.moved || tool === 'stop')) paint(action, nextTile);
    if (inBounds(nextTile)) setTile(nextTile);
  };
  const mapKeys = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!editing || traveling) return;
    const current = tile ?? screenToGrid(camera.x, camera.y);
    if (canEdit && tool && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      if (inBounds(current)) onApply(current, canPaintRemove(draft, zone, tool, current));
      return;
    }
    const directions: Record<string, Point> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const next = {
      x: constrain(current.x + direction.x, 0, safari.bounds.width - 1),
      y: constrain(current.y + direction.y, 0, safari.bounds.height - 1),
    };
    const p = gridToScreen(next.x, next.y);
    setTile(next);
    if (
      Math.abs(p.x - camera.x) * camera.zoom > size.width / 2 - 48 ||
      Math.abs(p.y - camera.y) * camera.zoom > size.height / 2 - 48
    )
      setCamera((currentCamera) => ({ ...currentCamera, x: p.x, y: p.y - 8 }));
  };

  return (
    <div className="safari-map" ref={frameRef}>
      <canvas
        ref={canvasRef}
        role="application"
        tabIndex={0}
        aria-label={editing ? '사파리 지도. 방향키로 칸 선택, Enter로 편집' : '지프 관람 지도'}
        data-camera-x={camera.x}
        data-camera-y={camera.y}
        data-camera-zoom={camera.zoom}
        data-gate-open={gateOpening >= 0.95}
        data-jeep-x={jeep?.x}
        data-jeep-y={jeep?.y}
        data-map-action={editing ? (tool ?? 'pan') : 'watch'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerLeave={() => {
          if (!focused && !gesture.current) setTile(undefined);
        }}
        onPointerUp={pointerUp}
        onPointerCancel={() => {
          gesture.current = null;
        }}
        onLostPointerCapture={() => {
          gesture.current = null;
        }}
        onKeyDown={mapKeys}
      />
      {!traveling && (
        <div className="safari-map__camera" aria-label="지도 보기">
          <button
            type="button"
            aria-label="지도 축소"
            onClick={() =>
              setCamera((current) => ({ ...current, zoom: zoomLimit(current.zoom / 1.28) }))
            }
          >
            −
          </button>
          <button
            type="button"
            aria-label={view ? '정차 지점에 맞추기' : '사파리 전체 보기'}
            onClick={() =>
              setCamera(
                centerOn(
                  view
                    ? [view.tile, ...draft.zones[view.zoneKind].tiles]
                    : selectPlotFocus(draft, safari.bounds),
                  size,
                ),
              )
            }
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 5H5v4m10-4h4v4M5 15v4h4m10-4v4h-4M9 12h6m-3-3v6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="지도 확대"
            onClick={() =>
              setCamera((current) => ({ ...current, zoom: zoomLimit(current.zoom * 1.28) }))
            }
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
