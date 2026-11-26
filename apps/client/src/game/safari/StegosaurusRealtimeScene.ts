import {
  AnimationMixer,
  DirectionalLight,
  Group,
  HemisphereLight,
  LoopOnce,
  MathUtils,
  Mesh,
  NeutralToneMapping,
  OrthographicCamera,
  PCFShadowMap,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
  type AnimationAction,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type StegosaurusAction = 'idle' | 'turn' | 'attack';
export type StegosaurusView = 'overview' | 'close';

const modelUrl = '/assets/safari-encounter/stegosaurus-realtime.glb';
const clipNames = { idle: 'Idle', turn: 'Turn', attack: 'TailStrike' } as const;

function zoomForView(view: StegosaurusView, height: number) {
  if (view === 'overview') return 1;
  // Reserve room for the lifted tail and planted paws beside the landscape controls.
  return MathUtils.clamp(1.36 + (height - 296) * 0.002, 1.22, 1.55);
}

interface SceneOptions {
  canvas: HTMLCanvasElement;
  field: HTMLImageElement;
  onReady: () => void;
  onAction: (action: StegosaurusAction) => void;
  onError: (reason: 'model' | 'graphics') => void;
}

export interface StegosaurusScene {
  play(action: StegosaurusAction): void;
  setPaused(paused: boolean): void;
  setView(view: StegosaurusView): void;
  dispose(): void;
}

function disposeModel(model: Object3D) {
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  model.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    if ((node as SkinnedMesh).isSkinnedMesh) (node as SkinnedMesh).skeleton.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
    }
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof Texture) textures.add(value);
    }
    material.dispose();
  }
  for (const texture of textures) {
    texture.dispose();
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) {
      texture.image.close();
    }
  }
}

export function createStegosaurusScene({
  canvas,
  field,
  onReady,
  onAction,
  onError,
}: SceneOptions): StegosaurusScene {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.09;
  renderer.setClearColor(0, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const facing = new Group();
  facing.rotation.y = 0.23;
  scene.add(facing, new HemisphereLight('#e5f1ff', '#d2b682', 1.37));

  // The north-west sun projects to the upper left of the park's isometric camera.
  const sun = new DirectionalLight('#fff2d6', 3.52);
  sun.position.set(-5.8, 9.3, 7.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5 });
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 25;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.014;
  sun.shadow.radius = 5.15;
  const bounce = new DirectionalLight('#fff1df', 0.95);
  bounce.position.set(6, 4.5, 7);
  const rim = new DirectionalLight('#fff3ca', 1.58);
  rim.position.set(-3, 6, -8.6);
  scene.add(sun, bounce, rim);

  const ground = new Mesh(
    new PlaneGeometry(32, 32),
    new ShadowMaterial({ color: '#654a28', opacity: 0.375, depthWrite: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.018;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new OrthographicCamera(0, 0, 0, 0, 0.1, 70);
  camera.position.set(15.68, 14.54, 16.32);
  camera.lookAt(-0.32, 1.48, 0.32);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selectedView: StegosaurusView = 'overview';
  let targetZoom = 1;
  let disposed = false;
  let paused = false;
  let contextLost = false;
  let frame = 0;
  let lastFrame = 0;
  let model: Object3D | undefined;
  let mixer: AnimationMixer | undefined;
  let playing: StegosaurusAction = 'idle';
  let finished: AnimationAction | undefined;
  const actions: Partial<Record<StegosaurusAction, AnimationAction>> = {};

  function draw() {
    renderer.render(scene, camera);
  }

  function scheduleDraw() {
    if (!frame && !disposed && !contextLost) frame = window.requestAnimationFrame(step);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return;
    const aspect = width / height;
    const worldWidth = Math.max(15.4, 8.5 * aspect);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    camera.left = -worldWidth / 2;
    camera.right = worldWidth / 2;
    camera.top = worldWidth / (aspect * 2);
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    draw();
    targetZoom = zoomForView(selectedView, height);
    scheduleDraw();
  }

  function step(now: number) {
    frame = 0;
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;
    const beforeZoom = camera.zoom;
    if (Math.abs(targetZoom - beforeZoom) > 0.001) {
      camera.zoom = reduceMotion ? targetZoom : MathUtils.damp(beforeZoom, targetZoom, 14, dt);
      camera.updateProjectionMatrix();
      field.style.transform = `scale(${camera.zoom})`;
    }
    if (mixer && !paused) {
      mixer.update(dt);
      if (finished) {
        if (playing === 'turn') facing.rotateY(Math.PI);
        finished.stop();
        finished = undefined;
        actions.idle?.reset().play();
        mixer.update(0);
        playing = 'idle';
        onAction(playing);
      }
    }
    if ((mixer && !paused) || beforeZoom !== camera.zoom) draw();
    if ((mixer && !paused) || Math.abs(targetZoom - camera.zoom) > 0.001) scheduleDraw();
    else lastFrame = 0;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    window.cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    onError('graphics');
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  void new GLTFLoader()
    .loadAsync(modelUrl)
    .then((gltf) => {
      if (disposed || contextLost) {
        disposeModel(gltf.scene);
        return;
      }
      model = gltf.scene;
      mixer = new AnimationMixer(model);
      for (const action of Object.keys(clipNames) as StegosaurusAction[]) {
        const clip = gltf.animations.find((animation) => animation.name === clipNames[action]);
        if (!clip) throw new Error(`Missing ${clipNames[action]} animation`);
        const playback = mixer.clipAction(clip);
        if (action !== 'idle') {
          playback.setLoop(LoopOnce, 1);
          playback.clampWhenFinished = true;
        }
        actions[action] = playback;
      }
      model.traverse((node) => {
        if (node instanceof Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          // Keep moving tails and plates in the shadow pass as they leave their resting bounds.
          if ((node as SkinnedMesh).isSkinnedMesh) node.frustumCulled = false;
        }
      });
      facing.add(model);
      mixer.addEventListener('finished', ({ action }) => {
        if (action === actions[playing] && playing !== 'idle') finished = action;
      });
      actions.idle?.play();
      mixer.update(0);
      resize();
      onReady();
    })
    .catch(() => {
      if (!disposed && !contextLost) onError('model');
    });

  return {
    play(action) {
      const next = actions[action];
      if (!next || playing !== 'idle' || action === 'idle') return;
      next.reset().play();
      actions.idle?.crossFadeTo(next, 0.12, false);
      playing = action;
      onAction(playing);
      scheduleDraw();
    },
    setPaused(next) {
      paused = next;
      if (!paused) scheduleDraw();
    },
    setView(view) {
      selectedView = view;
      targetZoom = zoomForView(view, canvas.clientHeight);
      scheduleDraw();
    },
    dispose() {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      field.style.transform = '';
      mixer?.stopAllAction();
      if (model) {
        mixer?.uncacheRoot(model);
        disposeModel(model);
      }
      ground.geometry.dispose();
      ground.material.dispose();
      sun.shadow.dispose();
      renderer.dispose();
    },
  };
}
