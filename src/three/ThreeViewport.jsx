import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildPC, IMPORTABLE } from './pcBuilders';
import { loadImportedModels } from './models';
import { buildSetup } from './setupBuilders';
import { SHOWCASE } from '@/lib/showcaseRig';
import { appParams } from '@/lib/app-params';

const PC_KEYS = ['case', 'cpu', 'motherboard', 'gpu', 'ram', 'cooler', 'storage', 'psu', 'fan'];

const VIEWS = {
  pc: { pos: [0.66, 0.44, 0.86], target: [0, 0.24, 0] },
  setup: { pos: [1.7, 1.7, 3.1], target: [0.35, 0.7, 0] },
};

const baseRatio = () => (window.innerWidth > 1024 ? Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2) : Math.min(window.devicePixelRatio || 1, 2));
const fourKRatio = (renderer, width, height) => {
  const maxSize = renderer.capabilities.maxTextureSize;
  return Math.min(3840 / width, maxSize / width, maxSize / height);
};

function disposeTree(o) {
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach((x) => x.dispose());
  });
}

const ThreeViewport = forwardRef(function ThreeViewport({ resolved, settings, mode, active = true, hq = false }, ref) {
  const host = useRef(null);
  const S = useRef({ views: { pc: null, setup: null }, prevMode: null });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = host.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    // supersample on desktop: fine port, plug and fin detail stays crisp instead of aliasing
    renderer.setPixelRatio(baseRatio());
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x0a0a0c, 1);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);
    scene.fog = new THREE.Fog(0x0a0a0c, 3.5, 10);
    // image based lighting: without it metal surfaces (case, cooler, brackets) render pure black
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 1.05;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 100);
    camera.position.set(...VIEWS.pc.pos);
    const controls = new OrbitControls(camera, renderer.domElement);
    Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.8, zoomSpeed: 0.9, panSpeed: 0.8, minDistance: 0.25, maxDistance: 12, maxPolarAngle: Math.PI * 0.495 });
    controls.target.set(...VIEWS.pc.target);

    const grid = new THREE.GridHelper(8, 80, 0x3a3a46, 0x1c1c24);
    scene.add(grid);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.34 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    floor.receiveShadow = true;
    scene.add(floor);

    // soft studio key with a wide penumbra, lifted by a cool fill and a rim so shadow
    // edges stay gentle instead of punching black holes into the metal
    scene.add(new THREE.AmbientLight(0xffffff, 0.36));
    scene.add(new THREE.HemisphereLight(0x9aa6c0, 0x14141a, 0.95));
    const key = new THREE.DirectionalLight(0xfff4ea, 2.3);
    key.position.set(-1.6, 2.6, 1.8);
    key.castShadow = true;
    key.shadow.mapSize.set(window.innerWidth > 1024 ? 4096 : 2048, window.innerWidth > 1024 ? 4096 : 2048);
    key.shadow.intensity = 0.62;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.025;
    Object.assign(key.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 0.1, far: 10 });
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd0ff, 0.72);
    fill.position.set(2.2, 1.1, 1.6);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x9ec5ff, 1.3);
    rim.position.set(-0.4, 1.6, -2.6);
    scene.add(rim);
    const bounce = new THREE.DirectionalLight(0xffffff, 0.42);
    bounce.position.set(0.6, 0.4, 3);
    scene.add(bounce);
    const interior = new THREE.PointLight(0xff2a85, 0.6, 1.2);
    scene.add(interior);

    Object.assign(S.current, { renderer, scene, camera, controls, grid, interior, pmrem, envTex, tween: null });

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const clock = new THREE.Clock();
    const col = new THREE.Color();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!activeRef.current) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const st = settingsRef.current;
      const sc = S.current;
      if (sc.tween) {
        sc.tween.t = Math.min(1, sc.tween.t + dt * 2.2);
        const k = 1 - Math.pow(1 - sc.tween.t, 3);
        camera.position.lerpVectors(sc.tween.p0, sc.tween.p1, k);
        controls.target.lerpVectors(sc.tween.t0, sc.tween.t1, k);
        if (sc.tween.t >= 1) sc.tween = null;
      }
      const omega = st.fansOn ? ((st.rpm * 2 * Math.PI) / 60) * 0.06 : 0;
      if (omega) sc.fans?.forEach((f) => { f.blades.rotation.z -= omega * dt; });
      const all = [...(sc.rgb || []), ...(sc.setupRgb || [])];
      let main = null;
      all.forEach((e, i) => {
        if (st.rgbMode === 'off') { e.mat.emissiveIntensity = 0; return; }
        if (st.rgbMode === 'rainbow') col.setHSL((t * 0.12 + e.phase) % 1, 1, 0.5);
        else col.set(st.rgbMode === 'red' ? '#ff0000' : st.rgbColor);
        e.mat.emissive.copy(col);
        // the pulse stays inside the tone-mapped range, so the low point really dims out
        e.mat.emissiveIntensity = st.rgbMode === 'breathing' ? 0.04 + 0.52 * (0.5 + 0.5 * Math.sin(t * 1.9)) : 0.68;
        if (i === 0) main = col.clone();
      });
      if (sc.interior) {
        // the interior light breathes with the strips instead of staying at one level
        sc.interior.intensity = st.rgbMode === 'off' || !main ? 0 : st.rgbMode === 'breathing' ? 0.04 + 0.16 * (0.5 + 0.5 * Math.sin(t * 1.9)) : 0.2;
        if (main) sc.interior.color.copy(main);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      [S.current.pc, S.current.setup].forEach((g) => g && disposeTree(g));
      S.current.envTex?.dispose();
      S.current.pmrem?.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  // repainting a component changes materials, so it rebuilds like a part change does
  const colorSig = JSON.stringify(settings?.componentColors || {});

  // rebuild scene content whenever parts or mode-relevant data change
  useEffect(() => {
    const sc = S.current;
    if (!sc.scene) return;
    [sc.pc, sc.setup].forEach((g) => { if (g) { sc.scene.remove(g); disposeTree(g); } });
    // nothing picked yet: draw the demo rig so the viewport is never empty
    const hasParts = PC_KEYS.some((k) => resolved[k]?.length);
    const localPreview = !/^[a-f0-9]{24}$/i.test(appParams.appId || '');
    const view = !hasParts
      ? SHOWCASE
      : localPreview
        ? Object.fromEntries(PC_KEYS.map((key) => [key, resolved[key]?.length ? resolved[key] : SHOWCASE[key] || []]))
        : resolved;
    const imported = IMPORTABLE.filter((k) => view[k]?.[0]?.part?.model_url);
    const pc = buildPC(view, settingsRef.current, { skip: new Set(imported) });
    const su = buildSetup(view, settingsRef.current);
    sc.pc = pc.group;
    sc.setup = su.group;
    sc.fans = pc.fans;
    sc.rgb = pc.rgb;
    sc.setupRgb = su.rgb;
    sc.glass = pc.glass;
    sc.pcOffset = su.pcOffset;
    sc.interior.position.set(0, pc.interiorY / 1000, 0.05);
    sc.scene.add(pc.group, su.group);
    applyMode(sc, mode);
    if (pc.glass) pc.glass.visible = settingsRef.current.showGlass;
    if (!sc.initialViewFitted) {
      fitTo(sc, 1, 1.12);
      sc.initialViewFitted = true;
    }

    // real product models (Blender exports) take the place of the provisional ones
    let cancelled = false;
    if (imported.length) {
      const targets = imported.map((k) => ({ part: view[k][0].part, box: pc.boxes[k] })).filter((t) => t.box);
      loadImportedModels(targets).then((group) => {
        if (cancelled) { disposeTree(group); return; }
        sc.imported = group;
        pc.group.add(group);
      }).catch(() => null);
    }
    return () => { cancelled = true; };
  }, [resolved, colorSig]);

  useEffect(() => {
    const sc = S.current;
    if (!sc.scene) return;
    sc.grid.visible = settings.showGrid;
    if (sc.glass) sc.glass.visible = settings.showGlass;
  }, [settings.showGrid, settings.showGlass]);

  // 4K mode: the drawing buffer is pushed until the frame is 3840 px wide, so ports,
  // fins and cable braiding stay sharp when the user zooms in on the hardware
  useEffect(() => {
    const sc = S.current;
    const el = host.current;
    if (!sc.renderer || !el) return;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    sc.renderer.setPixelRatio(hq ? fourKRatio(sc.renderer, w, h) : baseRatio());
    sc.renderer.setSize(w, h, false);
  }, [hq]);

  useEffect(() => {
    const sc = S.current;
    if (!sc.scene) return;
    const prev = sc.prevMode;
    if (prev && prev !== mode) sc.views[prev] = { pos: sc.camera.position.toArray(), target: sc.controls.target.toArray() };
    applyMode(sc, mode);
    if (prev !== mode) {
      const v = sc.views[mode] || VIEWS[mode];
      flyTo(sc, v.pos, v.target, !!prev);
    }
    sc.prevMode = mode;
  }, [mode]);

  useImperativeHandle(ref, () => ({
    fit: () => fitTo(S.current, 1, 1.12),
    reset: () => { const v = VIEWS[mode]; flyTo(S.current, v.pos, v.target, true); },
    iso: () => fitTo(S.current, 2, 1.15),
    zoom: (f) => {
      const { camera, controls } = S.current;
      const dir = camera.position.clone().sub(controls.target);
      const d = THREE.MathUtils.clamp(dir.length() * f, 0.25, 12);
      flyTo(S.current, dir.setLength(d).add(controls.target).toArray(), controls.target.toArray(), true);
    },
    capture: ({ grid = true, transparent = false, resolution = 'screen' } = {}) => {
      const { renderer, scene, camera, grid: gr } = S.current;
      const el = renderer.domElement;
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      const ratio = renderer.getPixelRatio();
      const bg = scene.background;
      const fog = scene.fog;
      const gv = gr.visible;
      gr.visible = grid;
      if (transparent) { scene.background = null; scene.fog = null; renderer.setClearColor(0x000000, 0); }
      if (resolution === '4k') {
        renderer.setPixelRatio(fourKRatio(renderer, w, h));
        renderer.setSize(w, h, false);
      }
      renderer.render(scene, camera);
      const url = el.toDataURL('image/png');
      if (resolution === '4k') {
        renderer.setPixelRatio(ratio);
        renderer.setSize(w, h, false);
      }
      scene.background = bg; scene.fog = fog; gr.visible = gv;
      renderer.setClearColor(0x0a0a0c, 1);
      return url;
    },
  }));

  return <div ref={host} className="absolute inset-0" />;
});

function applyMode(sc, mode) {
  if (!sc.pc) return;
  sc.setup.visible = mode === 'setup';
  sc.pc.visible = true;
  if (mode === 'setup') {
    const hasCase = sc.pc.children.length > 0;
    sc.pc.visible = hasCase;
    sc.pc.position.set(sc.pcOffset[0], 0, sc.pcOffset[1]);
  } else sc.pc.position.set(0, 0, 0);
}

function flyTo(sc, pos, target, animate) {
  const p1 = new THREE.Vector3(...pos);
  const t1 = new THREE.Vector3(...target);
  if (!animate) { sc.camera.position.copy(p1); sc.controls.target.copy(t1); return; }
  sc.tween = { t: 0, p0: sc.camera.position.clone(), t0: sc.controls.target.clone(), p1, t1 };
}

function fitTo(sc, variant, margin) {
  const vis = [sc.pc, sc.setup].filter((g) => g && g.visible);
  const b = new THREE.Box3();
  vis.forEach((g) => g.children.forEach((c) => { if (!c.userData.noFit) b.expandByObject(c); }));
  if (b.isEmpty()) return;
  const sphere = b.getBoundingSphere(new THREE.Sphere());
  const verticalHalfFov = (sc.camera.fov * Math.PI) / 360;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * sc.camera.aspect);
  const dist = (sphere.radius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov))) * margin;
  const dir = variant === 2 ? new THREE.Vector3(1, 0.85, 1) : sc.camera.position.clone().sub(sc.controls.target);
  dir.normalize().multiplyScalar(dist);
  flyTo(sc, dir.add(sphere.center).toArray(), sphere.center.toArray(), true);
}

export default ThreeViewport;