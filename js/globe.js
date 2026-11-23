import * as THREE from '../vendor/three.module.js';
import { cities } from './cities.js';
import { createCanvasGlobe, loadGeography, geographyCanvas } from './globe-canvas.js';
import { translate, isLanguage } from './i18n.js';

const RAD = Math.PI / 180;
const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
const position = (lat, lon, radius = 1) => new THREE.Vector3(
  radius * Math.cos(lat * RAD) * Math.cos(lon * RAD),
  radius * Math.sin(lat * RAD),
  -radius * Math.cos(lat * RAD) * Math.sin(lon * RAD),
);

// The sun is tied to the selected UTC instant, not to the globe's rotation.
function solarDirection(time) {
  const date = new Date(time);
  const day = (time - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000 + 1;
  const gamma = (2 * Math.PI / 365.2422) * (day - 1);
  const declination = 0.006918 - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma)
    + 0.00148 * Math.sin(3 * gamma);
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma));
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return position(declination / RAD, 180 - 15 * utcHour - equation / 4);
}

function geographyTexture(topology) {
  const texture = new THREE.CanvasTexture(geographyCanvas(topology));
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function element(tag, attrs, style, parent) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  });
  Object.assign(node.style, style || {});
  parent?.appendChild(node);
  return node;
}


export async function createGlobe(container, { onSelect } = {}) {
  let renderer;
  try {
    // Use the canvas fallback directly when WebGL is unavailable.
    const surface = document.createElement('canvas');
    const options = { antialias: true, alpha: true, powerPreference: 'low-power' };
    const context = surface.getContext('webgl2', options);
    if (!context) return createCanvasGlobe(container, { onSelect });
    renderer = new THREE.WebGLRenderer({ ...options, canvas: surface, context });
  } catch {
    return createCanvasGlobe(container, { onSelect });
  }
  const previousStyle = container.getAttribute('style');
  // Respect a parent layout using an absolute full-screen globe container.
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.style.overflow = 'hidden';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x020710, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('tabindex', '0');
  canvas.className = 'globe-canvas';
  canvas.dataset.renderer = 'webgl';
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab', outlineOffset: '-3px' });
  container.appendChild(canvas);
  const labels = element('div', { class: 'globe-labels' }, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' }, container);
  const controls = element('div', { class: 'globe-controls' }, { position: 'absolute', right: '24px', bottom: '28px', display: 'flex', gap: '6px' }, container);
  const controlStyle = {
    appearance: 'none', border: '1px solid #91bcce24', color: '#bed4df', background: '#0a1524cc',
    width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', padding: '0', backdropFilter: 'blur(12px)',
  };
  const rotate = element('button', { type: 'button' }, { ...controlStyle, fontSize: '12px' }, controls);
  const zoomIn = element('button', { type: 'button', text: '+' }, controlStyle, controls);
  const zoomOut = element('button', { type: 'button', text: '−' }, controlStyle, controls);
  const reset = element('button', { type: 'button', text: '↺' }, controlStyle, controls);
  const hint = element('div', { class: 'globe-hint' }, {
    position: 'absolute', left: '25px', bottom: '40px', color: '#718a9f', fontSize: '10px', letterSpacing: '1.4px', pointerEvents: 'none',
  }, container);

  let topology;
  try {
    topology = await loadGeography();
  } catch {
    renderer.dispose();
    canvas.remove(); labels.remove(); controls.remove(); hint.remove();
    if (previousStyle === null) container.removeAttribute('style'); else container.setAttribute('style', previousStyle);
    return createCanvasGlobe(container, { onSelect });
  }
  const texture = geographyTexture(topology);
  const sun = solarDirection(Date.now());
  const material = new THREE.ShaderMaterial({
    uniforms: { globeMap: { value: texture }, sunDirection: { value: sun } },
    vertexShader: `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() {vUv=uv; vNormal=normalize(mat3(modelMatrix)*normal);
      vec4 world=modelMatrix*vec4(position,1.); vView=cameraPosition-world.xyz;
      gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader: `uniform sampler2D globeMap; uniform vec3 sunDirection;
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() {vec3 color=texture2D(globeMap,vUv).rgb;
      float solar=dot(normalize(vNormal),sunDirection);
      float day=smoothstep(-.12,.24,solar);
      color*=mix(vec3(.34,.49,.66),vec3(1.03,1.13,1.14),day);
      float dawn=exp(-pow(solar/.11,2.));
      color+=vec3(.043,.029,.012)*dawn;
      float rim=pow(1.-max(0.,dot(normalize(vNormal),normalize(vView))),3.5);
      color+=vec3(.04,.17,.22)*rim;
      gl_FragColor=vec4(color,1.);}`,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), material);
  scene.add(sphere);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.055, 64, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vP; void main(){vN=normalize(normalMatrix*normal); vec4 p=modelViewMatrix*vec4(position,1.); vP=p.xyz; gl_Position=projectionMatrix*p;}`,
    fragmentShader: `varying vec3 vN; varying vec3 vP; void main(){float rim=pow(clamp(1.-abs(dot(normalize(vN),normalize(-vP))),0.,1.),3.); gl_FragColor=vec4(.10,.42,.62,rim*.52);}`,
  }));
  scene.add(atmosphere);

  let seed = 41;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const starPositions = [];
  for (let i = 0; i < 950; i++) {
    const point = position(Math.asin(random() * 2 - 1) / RAD, random() * 360 - 180, 18 + random() * 7);
    starPositions.push(point.x, point.y, point.z);
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x9bbfd8, size: 0.020, transparent: true, opacity: 0.55, depthWrite: false })));

  // A restrained set of known city lights makes the night side legible.
  const lights = new THREE.BufferGeometry().setFromPoints(cities.map(city => position(city.lat, city.lon, 1.006)));
  const lightMaterial = new THREE.ShaderMaterial({
    uniforms: { sunDirection: { value: sun }, pixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: `uniform vec3 sunDirection; uniform float pixelRatio; varying float glow;
      void main(){glow=1.-smoothstep(-.12,.18,dot(normalize(position),sunDirection));
      vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
      gl_PointSize=clamp(5.*pixelRatio/(-p.z),1.5,4.5*pixelRatio);}`,
    fragmentShader: `varying float glow; void main(){float d=length(gl_PointCoord-.5)*2.;
      float a=pow(max(0.,1.-d),1.6)*glow*.75;gl_FragColor=vec4(.97,.76,.40,a);}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(lights, lightMaterial));

  const pinGroup = new THREE.Group(), arcGroup = new THREE.Group();
  scene.add(pinGroup, arcGroup);
  const pinGeometry = new THREE.SphereGeometry(0.009, 12, 8);
  const ringGeometry = new THREE.RingGeometry(0.018, 0.020, 32);
  let pinMaterials = [];
  let pins = [], members = [], selectedId = null, time = Date.now();
  let width = 0, height = 0, visible = true, dead = false, raf = 0, lastFrame = 0, resumeTimer = 0;
  let dragging = false, moved = false, pointer = null, language = 'en', pausedUntil = 0;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  let autoRotate = !reducedMotion;
  const view = { lon: 35, lat: 20, distance: 3.3 };
  const target = { ...view };

  function requestRender() {
    if (!raf && !dead && visible && !document.hidden) raf = requestAnimationFrame(render);
  }
  function updateControlText() {
    const t = text => translate(text, language);
    rotate.textContent = autoRotate ? 'Ⅱ' : '▶';
    rotate.setAttribute('aria-label', t(autoRotate ? 'Pause rotation' : 'Start rotation'));
    rotate.setAttribute('aria-pressed', String(autoRotate));
    rotate.title = rotate.getAttribute('aria-label');
    zoomIn.setAttribute('aria-label', t('Zoom in'));
    zoomOut.setAttribute('aria-label', t('Zoom out'));
    reset.setAttribute('aria-label', t('Reset globe view'));
    [zoomIn, zoomOut, reset].forEach(button => { button.title = button.getAttribute('aria-label'); });
    canvas.setAttribute('aria-label', t('Drag to explore · scroll to zoom'));
    hint.textContent = t(topology ? 'Drag to explore · scroll to zoom' : 'Map unavailable. Retry to load it.');
  }
  function pauseForInteraction(milliseconds = 10000) {
    pausedUntil = performance.now() + milliseconds;
    clearTimeout(resumeTimer);
    if (autoRotate) resumeTimer = setTimeout(() => { lastFrame = 0; requestRender(); }, milliseconds + 20);
  }
  function setAutoRotate(value) {
    autoRotate = Boolean(value);
    clearTimeout(resumeTimer);
    pausedUntil = 0;
    lastFrame = 0;
    updateControlText();
    requestRender();
  }
  function setLanguage(value) {
    language = isLanguage(value) ? value : 'en';
    updateControlText();
  }
  function updateLabels() {
    const occupied = [];
    camera.updateMatrixWorld();
    const cameraDirection = camera.position.clone().normalize();
    const actualDistance = camera.position.length();
    const order = [...pins].sort((a, b) => Number(b.member.id === selectedId) - Number(a.member.id === selectedId));
    let shown = 0;
    for (const pin of order) {
      const facing = pin.vector.clone().normalize().dot(cameraDirection);
      const projected = pin.vector.clone().project(camera);
      const x = (projected.x * .5 + .5) * width, y = (-projected.y * .5 + .5) * height;
      const labelWidth = pin.button.offsetWidth || 150;
      const labelX = clamp(x, labelWidth / 2 + 10, width - labelWidth / 2 - 10);
      const labelY = clamp(y - 17, 42, height - 62);
      const rectangle = { left: labelX - labelWidth / 2, right: labelX + labelWidth / 2, top: labelY - 35, bottom: labelY + 1 };
      const clashes = occupied.some(r => rectangle.left < r.right + 8 && rectangle.right > r.left - 8 && rectangle.top < r.bottom + 8 && rectangle.bottom > r.top - 8);
      const show = facing > 1.018 / actualDistance + .025 && projected.z < 1 && x > 0 && x < width && y > 0 && y < height && !clashes && shown < 8;
      pin.button.style.visibility = show ? 'visible' : 'hidden';
      if (show) {
        shown++;
        occupied.push(rectangle);
        pin.button.style.left = `${labelX}px`;
        pin.button.style.top = `${labelY}px`;
      }
    }
  }
  function render(timestamp) {
    raf = 0;
    if (dead || !visible || document.hidden) return;
    const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, .06) : 0;
    lastFrame = timestamp;
    const rotating = autoRotate && !dragging && timestamp >= pausedUntil;
    if (rotating) target.lon += delta * .6;
    const ease = reducedMotion ? 1 : dragging ? .7 : .14;
    view.lon += (target.lon - view.lon) * ease;
    view.lat += (target.lat - view.lat) * ease;
    view.distance += (target.distance - view.distance) * ease;
    // Fit the full globe in portrait containers without cropping its sides.
    const actualDistance = 1 + (view.distance - 1) / Math.min(1, Math.max(.25, camera.aspect));
    camera.position.copy(position(view.lat, view.lon, actualDistance));
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    canvas.dataset.longitude = view.lon.toFixed(3);
    canvas.dataset.mapReady = 'true';
    updateLabels();
    if (rotating || Math.abs(target.lon - view.lon) > .008 || Math.abs(target.lat - view.lat) > .008 || Math.abs(target.distance - view.distance) > .002) requestRender();
  }
  function resize() {
    width = container.clientWidth;
    height = container.clientHeight || 360;
    if (!width) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const intersection = new IntersectionObserver(entries => {
    visible = !!entries[0]?.isIntersecting;
    lastFrame = 0;
    if (visible) requestRender();
  });
  intersection.observe(container);
  const onVisibility = () => { lastFrame = 0; if (!document.hidden) requestRender(); };
  const onMotion = event => { reducedMotion = event.matches; if (reducedMotion) setAutoRotate(false); };
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', onMotion);

  const onDown = event => {
    if (event.button !== 0) return;
    pauseForInteraction();
    dragging = true; moved = false;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onMove = event => {
    if (!dragging || pointer?.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    moved ||= Math.abs(dx) + Math.abs(dy) > 2;
    target.lon -= dx * .3;
    target.lat = clamp(target.lat + dy * .28, -72, 72);
    pointer.x = event.clientX; pointer.y = event.clientY;
    requestRender();
  };
  const onUp = event => {
    if (pointer?.id !== event.pointerId) return;
    if (!moved) {
      const bounds = canvas.getBoundingClientRect();
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / width * 2 - 1, -(event.clientY - bounds.top) / height * 2 + 1), camera);
      const globeHit = raycaster.intersectObject(sphere)[0];
      const hit = raycaster.intersectObjects(pinGroup.children).find(h => h.object.userData.memberId && (!globeHit || h.distance < globeHit.distance + .02));
      if (hit) {
        const member = members.find(m => m.id === hit.object.userData.memberId);
        focus(member); onSelect?.(member.id);
      }
    }
    dragging = false; pointer = null; canvas.style.cursor = 'grab';
    pauseForInteraction(); requestRender();
  };
  const onCancel = () => { dragging = false; pointer = null; canvas.style.cursor = 'grab'; pauseForInteraction(); requestRender(); };
  const onWheel = event => {
    event.preventDefault(); pauseForInteraction();
    target.distance = clamp(target.distance + event.deltaY * .002, 2.2, 5.0);
    requestRender();
  };
  const onKey = event => {
    const actions = {
      ArrowLeft: () => { target.lon -= 12; }, ArrowRight: () => { target.lon += 12; },
      ArrowUp: () => { target.lat = clamp(target.lat + 9, -72, 72); }, ArrowDown: () => { target.lat = clamp(target.lat - 9, -72, 72); },
      '+': () => { target.distance = Math.max(2.2, target.distance - .25); }, '=': () => { target.distance = Math.max(2.2, target.distance - .25); },
      '-': () => { target.distance = Math.min(5, target.distance + .25); },
    };
    if (actions[event.key]) { event.preventDefault(); pauseForInteraction(); actions[event.key](); requestRender(); }
  };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('keydown', onKey);
  rotate.onclick = () => setAutoRotate(!autoRotate);
  zoomIn.onclick = () => { pauseForInteraction(); target.distance = Math.max(2.2, target.distance - .35); requestRender(); };
  zoomOut.onclick = () => { pauseForInteraction(); target.distance = Math.min(5, target.distance + .35); requestRender(); };
  reset.onclick = () => { pauseForInteraction(); Object.assign(target, { lon: 35, lat: 20, distance: 3.3 }); requestRender(); };

  function focus(member) {
    if (!member || !Number.isFinite(Number(member.lon)) || !Number.isFinite(Number(member.lat))) return;
    selectedId = member.id;
    pauseForInteraction(16000);
    let delta = (Number(member.lon) - view.lon) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    target.lon = view.lon + delta;
    target.lat = clamp(Number(member.lat), -65, 65);
    for (const pin of pins) {
      const selected = pin.member.id === selectedId;
      pin.mesh.scale.setScalar(selected ? 1.5 : 1);
      pin.button.style.borderColor = selected ? '#a9e6d1aa' : '#7ab5c63d';
      pin.button.style.boxShadow = selected ? '0 0 25px #5bceb21c' : 'none';
    }
    requestRender();
  }
  function clearArcs() {
    arcGroup.children.forEach(arc => { arc.geometry.dispose(); arc.material.dispose(); });
    arcGroup.clear();
  }
  function buildArcs() {
    clearArcs();
    if (members.length < 2) return;
    const origin = position(members[0].lat, members[0].lon);
    const visited = new Set();
    for (const member of members.slice(1, 9)) {
      const key = `${member.lat},${member.lon}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const destination = position(member.lat, member.lon);
      const angle = Math.acos(clamp(origin.dot(destination), -1, 1));
      if (angle < .02) continue;
      const axis = new THREE.Vector3().crossVectors(origin, destination);
      if (axis.lengthSq() < 1e-8) axis.crossVectors(origin, new THREE.Vector3(0, 1, 0));
      if (axis.lengthSq() < 1e-8) axis.set(1, 0, 0);
      axis.normalize();
      const points = [];
      for (let index = 0; index <= 80; index++) {
        const t = index / 80;
        const radius = 1.016 + Math.sin(Math.PI * t) * Math.min(.28, angle * .1);
        points.push(origin.clone().applyAxisAngle(axis, angle * t).multiplyScalar(radius));
      }
      const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x73d9c5, transparent: true, opacity: .38, depthWrite: false }));
      arcGroup.add(arc);
    }
  }
  function update(nextMembers, instantMs = Date.now()) {
    members = nextMembers.filter(m => Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lon)));
    time = Number.isFinite(Number(instantMs)) ? Number(instantMs) : Date.now();
    sun.copy(solarDirection(time));
    labels.replaceChildren(); pinGroup.clear();
    pinMaterials.forEach(item => item.dispose()); pinMaterials = []; pins = [];
    for (const member of members) {
      const color = typeof member.color === 'string' && /^#[\da-f]{6}$/i.test(member.color) ? member.color : '#91e8d0';
      const pinMaterial = new THREE.MeshBasicMaterial({ color });
      const ringMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: .65, depthWrite: false });
      pinMaterials.push(pinMaterial, ringMaterial);
      const vector = position(Number(member.lat), Number(member.lon), 1.018);
      const mesh = new THREE.Mesh(pinGeometry, pinMaterial);
      mesh.position.copy(vector); mesh.userData.memberId = member.id;
      if (member.id === selectedId) mesh.scale.setScalar(1.5);
      pinGroup.add(mesh);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position(Number(member.lat), Number(member.lon), 1.012));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vector.clone().normalize());
      ring.userData.memberId = member.id; pinGroup.add(ring);
      const city = member.displayCity || member.city || member.name;
      const button = element('button', { type: 'button', class: 'globe-city-label', title: member.name || city, 'aria-label': `${member.name || city} · ${city}` }, {
        position: 'absolute', transform: 'translate(-50%, -100%)', pointerEvents: 'auto', visibility: 'hidden',
        display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', maxWidth: '220px',
        padding: '9px 12px', border: `1px solid ${member.id === selectedId ? '#a9e6d1aa' : '#7ab5c63d'}`, borderRadius: '24px',
        background: 'rgba(6, 18, 30, .86)', backdropFilter: 'blur(10px)', color: '#dcecef', fontFamily: 'inherit',
        fontSize: '12px', fontWeight: '500', lineHeight: '1.2', cursor: 'pointer',
      }, labels);
      element('span', {}, { width: '5px', height: '5px', borderRadius: '50%', background: color, boxShadow: `0 0 9px ${color}`, flexShrink: '0' }, button);
      element('span', { text: city }, { overflow: 'hidden', textOverflow: 'ellipsis' }, button);
      const clock = globalThis.moment?.tz(time, member.zone);
      if (clock) element('span', { text: clock.format('HH:mm'), dir: 'ltr' }, { fontVariantNumeric: 'tabular-nums', color: '#9cb1c2', fontSize: '11px', unicodeBidi: 'isolate' }, button);
      button.onclick = () => { focus(member); onSelect?.(member.id); };
      pins.push({ member, vector, mesh, button });
    }
    buildArcs(); requestRender();
  }
  setLanguage('en'); resize(); update([], Date.now());
  const webglAPI = {
    update, focus, setAutoRotate, setLanguage,
    destroy() {
      dead = true; cancelAnimationFrame(raf); clearTimeout(resumeTimer);
      observer.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility); motionQuery.removeEventListener('change', onMotion);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('keydown', onKey);
      const materials = new Set(pinMaterials), geometries = new Set([pinGeometry, ringGeometry]);
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); texture.dispose(); renderer.dispose();
      canvas.remove(); labels.remove(); controls.remove(); hint.remove();
      if (previousStyle === null) container.removeAttribute('style'); else container.setAttribute('style', previousStyle);
    },
  };
  // Keep the public object stable while recovering a lost GPU context.
  // The app can continue updating meeting times during the switch.
  let software = null, switching = false, disposed = false;
  const latest = { members, time, language, autoRotate, focus: null };
  const onContextLost = event => {
    event?.preventDefault();
    if (switching || disposed) return;
    switching = true;
    latest.members = members; latest.time = time;
    latest.language = language; latest.autoRotate = autoRotate;
    latest.focus = members.find(member => member.id === selectedId) || null;
    const initialView = { lon: view.lon, lat: view.lat, zoom: Math.max(.65, Math.min(1.5, 3.3 / view.distance)) };
    canvas.removeEventListener('webglcontextlost', onContextLost);
    webglAPI.destroy();
    createCanvasGlobe(container, { onSelect, topology, initialView }).then(instance => {
      if (disposed) { instance.destroy(); return; }
      software = instance;
      software.setLanguage(latest.language);
      software.setAutoRotate(latest.autoRotate);
      software.update(latest.members, latest.time);
      if (latest.focus) software.focus(latest.focus);
    });
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  const api = {
    update(nextMembers, instantMs = Date.now()) {
      latest.members = nextMembers; latest.time = instantMs;
      if (software) software.update(nextMembers, instantMs);
      else if (!dead) update(nextMembers, instantMs);
    },
    focus(member) {
      latest.focus = member;
      if (software) software.focus(member);
      else if (!dead) focus(member);
    },
    setLanguage(value) {
      latest.language = value;
      if (software) software.setLanguage(value);
      else if (!dead) setLanguage(value);
    },
    setAutoRotate(value) {
      latest.autoRotate = value;
      if (software) software.setAutoRotate(value);
      else if (!dead) setAutoRotate(value);
    },
    destroy() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (software) software.destroy();
      else if (!dead) webglAPI.destroy();
    },
  };
  if (renderer.getContext().isContextLost()) onContextLost();
  return api;
}
