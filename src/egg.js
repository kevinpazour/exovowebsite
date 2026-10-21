import * as THREE from 'three';

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uExplode;
  uniform vec2 uPointer;
  uniform float uPointerActive;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute vec3 aDir;
  attribute float aRand;
  attribute float aYolk;
  varying float vAlpha;
  varying float vYolk;

  void main() {
    float e = uExplode * uExplode * (3.0 - 2.0 * uExplode);
    float pulse = pow(max(0.0, sin(uTime * 1.7)), 14.0) * 0.07;
    vec3 p = position * (1.0 + pulse) + aDir * e * 2.6;
    p += normalize(position + 0.0001) * sin(uTime * 2.0 + aRand * 6.2831) * 0.012;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 away = ndc - uPointer;
    float dist = length(away);
    float push = uPointerActive * smoothstep(0.38, 0.0, dist) * 0.42;
    mv.xy += normalize(away + 0.0001) * push * (-mv.z) * 0.5;

    gl_Position = projectionMatrix * mv;
    float size = uSize * mix(1.0, 1.7, aYolk) * (0.6 + aRand * 0.8);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);

    float depth = smoothstep(8.6, 5.6, -mv.z);
    vAlpha = mix(0.22, 1.0, depth) * (1.0 - e * 0.55);
    vYolk = aYolk;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorShell;
  uniform vec3 uColorYolk;
  varying float vAlpha;
  varying float vYolk;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.6);
    vec3 col = mix(uColorShell, uColorYolk, vYolk);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,214,10,0.9)');
  grad.addColorStop(0.35, 'rgba(255,214,10,0.25)');
  grad.addColorStop(1, 'rgba(255,214,10,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function buildParticles(count) {
  const pos = new Float32Array(count * 3);
  const dir = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const yolk = new Float32Array(count);
  const yolkCount = Math.floor(count * 0.15);
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (i < yolkCount) {
      // Dotter: gefüllte Kugel im unteren Teil des Eis
      v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      const r = Math.cbrt(Math.random()) * 0.45;
      x = v.x * r; y = v.y * r - 0.3; z = v.z * r;
      yolk[i] = 1;
    } else {
      // Schale: Eiform, oben schmaler
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const ring = Math.sqrt(1 - u * u);
      const k = 1 - 0.2 * u;
      const shell = 1 - Math.random() * 0.04;
      x = ring * Math.cos(th) * k * shell;
      z = ring * Math.sin(th) * k * shell;
      y = u * 1.25 * shell;
    }
    pos.set([x, y, z], i * 3);

    v.set(x, y + 0.3, z).normalize();
    const d = 0.6 + Math.random() * 1.8;
    dir.set([
      v.x * d + (Math.random() - 0.5) * 0.7,
      v.y * d + (Math.random() - 0.5) * 0.7 + 0.5,
      v.z * d + (Math.random() - 0.5) * 0.7,
    ], i * 3);
    rand[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.setAttribute('aYolk', new THREE.BufferAttribute(yolk, 1));
  return geo;
}

export function createEgg(canvas, { reduceMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  const small = window.innerWidth < 700;
  const count = small ? 6000 : 18000;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const group = new THREE.Group();
  group.rotation.x = 0.28;
  scene.add(group);

  const uniforms = {
    uTime: { value: 0 },
    uExplode: { value: 0 },
    uPointer: { value: new THREE.Vector2(9, 9) },
    uPointerActive: { value: 0 },
    uPixelRatio: { value: Math.min(2, window.devicePixelRatio || 1) },
    uSize: { value: small ? 7 : 5.5 },
    uColorShell: { value: new THREE.Color('#FFD60A') },
    uColorYolk: { value: new THREE.Color('#FF3D2E') },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const geometry = buildParticles(count);
  const points = new THREE.Points(geometry, material);
  group.add(points);

  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(3.4, 3.4, 1);
  glow.position.set(0, -0.3, 0);
  scene.add(glow);

  // Größe an den Container anpassen
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    uniforms.uPixelRatio.value = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(uniforms.uPixelRatio.value);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Zeiger und Explosion
  const target = new THREE.Vector2(9, 9);
  let pointerActive = 0;
  let explode = 0;

  function setPointer(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((clientY - r.top) / r.height) * 2 - 1);
    target.set(nx, ny);
    pointerActive = Math.abs(nx) < 1.2 && Math.abs(ny) < 1.2 ? 1 : 0;
  }
  function setExplode(p) { explode = Math.max(0, Math.min(1, p)); }

  // Renderschleife, pausiert außerhalb des Bildes
  const clock = new THREE.Clock();
  let visible = true;
  let frame = 0;

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value += dt;
    points.rotation.y += dt * 0.35;
    uniforms.uPointer.value.lerp(target, 0.15);
    uniforms.uPointerActive.value += (pointerActive - uniforms.uPointerActive.value) * 0.1;
    uniforms.uExplode.value += (explode - uniforms.uExplode.value) * 0.12;
    glowMat.opacity = 0.8 * (1 - uniforms.uExplode.value);
    renderer.render(scene, camera);
  }

  function loop() {
    if (!visible) { frame = 0; return; }
    render();
    frame = requestAnimationFrame(loop);
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame && !reduceMotion) { clock.getDelta(); frame = requestAnimationFrame(loop); }
  });
  io.observe(canvas);

  if (reduceMotion) {
    render();
  } else {
    frame = requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else if (visible && !frame && !reduceMotion) { clock.getDelta(); frame = requestAnimationFrame(loop); }
  });

  return {
    setPointer,
    setExplode,
    destroy() {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      glowMat.map.dispose();
      glowMat.dispose();
      renderer.dispose();
    },
  };
}
