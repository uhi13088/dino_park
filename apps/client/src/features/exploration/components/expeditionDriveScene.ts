export interface ExpeditionDriveMarker {
  kind: 'egg' | 'sample' | 'rock' | 'dino' | 'rival';
  position: number;
  approach: number;
}

interface ExpeditionDriveFrame {
  playerPosition: number;
  distance: number;
  finishApproach: number;
  markers: ExpeditionDriveMarker[];
  damaged: boolean;
}

const cliff = [
  [
    [0, 0.07],
    [0.12, 0.13],
    [0.17, 0.2],
    [0.27, 0.23],
    [0.32, 0.42],
    [0.38, 0.54],
    [0.3, 0.71],
    [0.16, 1],
    [0, 1],
  ],
  [
    [0, 0.24],
    [0.14, 0.28],
    [0.25, 0.3],
    [0.33, 0.45],
    [0.27, 0.41],
    [0.16, 0.37],
    [0, 0.35],
  ],
  [
    [0, 0.43],
    [0.12, 0.44],
    [0.27, 0.49],
    [0.37, 0.54],
    [0.32, 0.6],
    [0.22, 0.56],
    [0, 0.52],
  ],
  [
    [0, 0.62],
    [0.1, 0.62],
    [0.23, 0.68],
    [0.29, 0.74],
    [0.19, 0.8],
    [0, 0.76],
  ],
  [
    [0, 0.82],
    [0.08, 0.81],
    [0.18, 0.84],
    [0.2, 0.89],
    [0.16, 0.98],
    [0, 0.96],
  ],
];
const cliffColors = ['#ac7351', '#dba779', '#87583f', '#ce9366', '#87583f'];
const gravel = Array.from({ length: 26 }, (_, index) => ({
  offset: ((index * 43 + 4) % 103) / 103,
  across: ((index * 53 + 19) % 101) / 50 - 1,
  size: 0.5 + ((index * 31) % 67) / 55,
}));

export function createExpeditionDriveScene(canvas: HTMLCanvasElement) {
  const renderingContext = canvas.getContext('2d');
  if (!renderingContext) return () => undefined;
  const context = renderingContext;

  const wildlife = new Image();
  wildlife.src = `${import.meta.env.BASE_URL}assets/placeholders/iguanodon.svg`;
  const egg = new Image();
  egg.src = `${import.meta.env.BASE_URL}assets/placeholders/iguanodon-egg.svg`;

  function polygon(points: number[][], fill: string | CanvasGradient) {
    context.beginPath();
    for (const [index, [x, y]] of points.entries()) {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fillStyle = fill;
    context.fill();
  }

  function rect(x: number, y: number, width: number, height: number, fill: string) {
    context.fillStyle = fill;
    context.fillRect(x, y, width, height);
  }

  function ellipse(x: number, y: number, rx: number, ry: number, fill: string) {
    context.beginPath();
    context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();
  }

  function drawJeep(size: number, body: string, inMotion: boolean) {
    const trim = inMotion ? '#846033' : '#61392d';
    ellipse(0, 0, size * 0.55, size * 0.13, '#292e2780');
    rect(-0.5 * size, -0.27 * size, 0.18 * size, 0.25 * size, '#202b28');
    rect(0.32 * size, -0.27 * size, 0.18 * size, 0.25 * size, '#202b28');
    polygon(
      [
        [-0.45, -0.3],
        [-0.34, -0.67],
        [0.34, -0.67],
        [0.45, -0.3],
      ].map(([x, y]) => [x * size, y * size]),
      trim,
    );
    polygon(
      [
        [-0.39, -0.33],
        [-0.3, -0.61],
        [0.3, -0.61],
        [0.39, -0.33],
      ].map(([x, y]) => [x * size, y * size]),
      body,
    );
    rect(-0.27 * size, -0.53 * size, 0.54 * size, 0.19 * size, '#27474b');
    polygon(
      [
        [-0.26, -0.51],
        [0.1, -0.51],
        [0.24, -0.37],
        [-0.26, -0.37],
      ].map(([x, y]) => [x * size, y * size]),
      '#7da5a0',
    );
    rect(-0.44 * size, -0.32 * size, 0.88 * size, 0.23 * size, body);
    rect(-0.41 * size, -0.25 * size, 0.16 * size, 0.055 * size, '#b43e31');
    rect(0.25 * size, -0.25 * size, 0.16 * size, 0.055 * size, '#b43e31');
    rect(-0.47 * size, -0.12 * size, 0.94 * size, 0.08 * size, '#30413a');
    if (inMotion) {
      ellipse(0, -0.19 * size, 0.15 * size, 0.15 * size, '#263431');
      ellipse(0, -0.19 * size, 0.08 * size, 0.08 * size, '#697971');
    }
  }

  function drawMarker(marker: ExpeditionDriveMarker, size: number) {
    switch (marker.kind) {
      case 'egg': {
        ellipse(0, -size * 0.32, size * 0.46, size * 0.44, '#d7c88292');
        if (egg.naturalWidth) context.drawImage(egg, -size * 0.55, -size * 0.86, size * 1.1, size);
        else ellipse(0, -size * 0.36, size * 0.25, size * 0.34, '#f5e6ad');
        break;
      }
      case 'sample': {
        ellipse(0, -size * 0.22, size * 0.47, size * 0.29, '#b9edbd8c');
        rect(-0.29 * size, -0.56 * size, 0.58 * size, 0.51 * size, '#16424a');
        rect(-0.22 * size, -0.48 * size, 0.44 * size, 0.34 * size, '#a2eee1');
        rect(-0.2 * size, -0.34 * size, 0.4 * size, 0.08 * size, '#438e8a');
        break;
      }
      case 'rock': {
        polygon(
          [
            [-0.55, -0.04],
            [-0.39, -0.43],
            [-0.08, -0.58],
            [0.32, -0.44],
            [0.52, -0.03],
          ].map(([x, y]) => [x * size, y * size]),
          '#53453a',
        );
        polygon(
          [
            [-0.43, -0.23],
            [-0.26, -0.45],
            [-0.07, -0.51],
            [0.27, -0.4],
            [0.17, -0.23],
          ].map(([x, y]) => [x * size, y * size]),
          '#ad8c72',
        );
        break;
      }
      case 'dino': {
        if (wildlife.naturalWidth)
          context.drawImage(wildlife, -size * 0.65, -size * 0.98, size * 1.3, size * 1.1);
        else {
          ellipse(0, -size * 0.36, size * 0.42, size * 0.23, '#687b49');
          ellipse(size * 0.37, -size * 0.53, size * 0.16, size * 0.14, '#a9b882');
        }
        break;
      }
      case 'rival':
        drawJeep(size, '#ac5d42', false);
        break;
    }
  }

  return ({ playerPosition, distance, markers, damaged, finishApproach }: ExpeditionDriveFrame) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    const dpi = Math.min(2, window.devicePixelRatio || 1);
    const physicalWidth = Math.round(width * dpi);
    const physicalHeight = Math.round(height * dpi);
    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;
    }
    context.setTransform(dpi, 0, 0, dpi, 0, 0);

    const horizon = height * 0.24;
    const center = width / 2;
    const contactDepth = 0.77;
    const depthAt = (approach: number) => contactDepth * approach ** 1.4;
    const spread = (depth: number) => width * (0.038 + depth * 0.42);
    const xAt = (position: number, depth: number) => center + position * spread(depth);
    const yAt = (depth: number) => horizon + (height - horizon) * depth;

    const sky = context.createLinearGradient(0, 0, 0, horizon * 1.25);
    sky.addColorStop(0, '#96c7d1');
    sky.addColorStop(1, '#f1dfb6');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);
    ellipse(width * 0.7, height * 0.12, height * 0.042, height * 0.042, '#f8e5ac');
    polygon(
      [
        [0, 0.26],
        [0.11, 0.22],
        [0.21, 0.225],
        [0.32, 0.18],
        [0.43, 0.21],
        [0.54, 0.23],
        [0.66, 0.2],
        [0.8, 0.23],
        [1, 0.16],
        [1, 0.3],
        [0, 0.3],
      ].map(([x, y]) => [x * width, y * height]),
      '#a57d64',
    );
    rect(0, horizon, width, height - horizon, '#8f6d51');
    for (const side of [false, true]) {
      for (const [index, shape] of cliff.entries()) {
        polygon(
          shape.map(([x, y]) => [
            (side ? 1 - x * 0.9 : x) * width,
            (side ? y * 0.97 + 0.025 : y) * height,
          ]),
          cliffColors[index],
        );
      }
    }

    const surface = context.createLinearGradient(0, horizon, 0, height);
    surface.addColorStop(0, '#b29b83');
    surface.addColorStop(1, '#7a7062');
    polygon(
      [
        [xAt(-1, 0) - 2, horizon],
        [xAt(1, 0) + 2, horizon],
        [xAt(1, 1) + 8, height],
        [xAt(-1, 1) - 8, height],
      ],
      '#d5a76b',
    );
    polygon(
      [
        [xAt(-1, 0), horizon],
        [xAt(1, 0), horizon],
        [xAt(1, 1), height],
        [xAt(-1, 1), height],
      ],
      surface,
    );
    for (const mark of gravel) {
      const depth = ((mark.offset + distance) % 1) ** 1.8;
      const x = xAt(mark.across, depth);
      const y = yAt(depth);
      const span = Math.max(0.7, depth * height * 0.013 * mark.size);
      rect(x, y, span * 0.52, span, '#dfc6a867');
    }
    for (const side of [-1, 1]) {
      for (let index = 0; index < 5; index += 1) {
        const depth = ((index / 5 + distance) % 1) ** 1.6;
        const x = xAt(side * 1.05, depth);
        const y = yAt(depth);
        const size = 2 + depth * height * 0.065;
        rect(x, y - size, size * 0.17, size, '#5a5544');
        rect(x, y - size, size * 0.17, size * 0.27, '#f3cf87');
      }
    }
    if (finishApproach > 0) {
      const depth = depthAt(finishApproach);
      const tile = spread(depth) / 4;
      const row = Math.max(1, depth * height * 0.014);
      const y = yAt(depth) - row;
      for (let index = 0; index < 8; index += 1) {
        const x = xAt(-1, depth) + index * tile;
        rect(x, y, tile, row, index % 2 === 0 ? '#ecdfc1' : '#574e41');
        rect(x, y + row, tile, row, index % 2 === 0 ? '#574e41' : '#ecdfc1');
      }
    }

    const vehicleSize = Math.min(height * 0.245, width * 0.19);
    for (const marker of markers) {
      const depth = depthAt(marker.approach);
      context.save();
      context.translate(xAt(marker.position, depth), yAt(depth));
      ellipse(0, 0, vehicleSize * depth * 0.48, vehicleSize * depth * 0.09, '#272e274d');
      drawMarker(marker, vehicleSize * (0.15 + (0.85 * depth) / contactDepth));
      context.restore();
    }
    context.save();
    context.translate(xAt(playerPosition, contactDepth), yAt(contactDepth));
    drawJeep(vehicleSize, damaged ? '#eb9c79' : '#f3c573', true);
    context.restore();
  };
}
