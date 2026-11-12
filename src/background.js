// 3D background: floating chocolate, cocoa beans, hazelnuts and gold foil over
// a lake of molten chocolate. Bundled to /background.js with `npm run build`.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const canvas = document.getElementById("bg");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = Math.min(window.innerWidth, window.innerHeight) < 700;
const density = small ? 0.55 : 1;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (err) {
  // no WebGL: the CSS gradient on <body> stays as the background
  canvas.remove();
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.78;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const BG = new THREE.Color("#0a0402");
const scene = new THREE.Scene();
// no scene.background: the depth-of-field pass would read it as near depth;
// the colour is the RenderPass clear colour instead
const fxScene = new THREE.Scene(); // dust, drawn after the blur (it defocuses itself)
scene.fog = new THREE.FogExp2(BG, 0.04);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;
scene.environmentIntensity = 0.3;

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 0.6, 14);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight("#ffd9b0", "#1a0a04", 0.32));
const key = new THREE.DirectionalLight("#ffd2a1", 1.9);
key.position.set(6, 10, 8);
scene.add(key);
const rim = new THREE.DirectionalLight("#ff7a2e", 1.7);
rim.position.set(-8, 3, -10);
scene.add(rim);
const glowLight = new THREE.PointLight("#ff9a4a", 38, 40, 1.6);
glowLight.position.set(0, 1, -2);
scene.add(glowLight);

// ---------- soft sun glow far behind everything ----------
function radialTexture(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) grd.addColorStop(o, col);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const sun = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: radialTexture([[0, "rgba(255,150,80,0.55)"], [0.25, "rgba(220,90,30,0.2)"], [1, "rgba(0,0,0,0)"]]),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  })
);
sun.position.set(0, 2.5, -60);
sun.scale.setScalar(70);
scene.add(sun);

// ---------- molten chocolate lake (waves displaced in the vertex shader) ----------
const lakeUniforms = { uTime: { value: 0 } };
const lakeMat = new THREE.MeshPhysicalMaterial({
  color: "#24100a",
  roughness: 0.3, // no clearcoat: it mirrored the studio lights as white rings
  // own envMap so envMapIntensity applies (scene.environment ignores it)
  envMap: envTex,
  envMapIntensity: 0.12,
  specularColor: new THREE.Color("#d08850"),
  sheen: 0.4,
  sheenColor: new THREE.Color("#a0552a"),
});
lakeMat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = lakeUniforms.uTime;
  const waves = /* glsl */ `
    uniform float uTime;
    float lakeH(vec2 p) {
      float t = uTime;
      return 0.32 * sin(p.x * 0.35 + t * 0.6)
           + 0.22 * sin(p.y * 0.42 - t * 0.5 + p.x * 0.12)
           + 0.12 * sin((p.x + p.y) * 0.9 + t * 1.1)
           + 0.05 * sin(p.x * 2.1 - p.y * 1.7 + t * 1.7);
    }
    vec3 lakeN(vec2 p) {
      float e = 0.05;
      float dx = (lakeH(p + vec2(e, 0.0)) - lakeH(p - vec2(e, 0.0))) / (2.0 * e);
      float dy = (lakeH(p + vec2(0.0, e)) - lakeH(p - vec2(0.0, e))) / (2.0 * e);
      return normalize(vec3(-dx, -dy, 1.0));
    }
  `;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\n" + waves)
    .replace("#include <beginnormal_vertex>", "vec3 objectNormal = lakeN(position.xy);")
    .replace(
      "#include <begin_vertex>",
      "vec3 transformed = vec3(position.xy, position.z + lakeH(position.xy));"
    );
};
const lake = new THREE.Mesh(
  new THREE.PlaneGeometry(140, 90, small ? 120 : 200, small ? 80 : 130),
  lakeMat
);
lake.rotation.x = -Math.PI / 2;
lake.position.set(0, -6.5, -25);
scene.add(lake);

// ---------- geometries ----------
function chocolateSquareGeometry() {
  const base = new RoundedBoxGeometry(1.5, 1.5, 0.42, 3, 0.1);
  const plateau = new RoundedBoxGeometry(1.0, 1.0, 0.2, 3, 0.07);
  plateau.translate(0, 0, 0.22);
  return mergeGeometries([base, plateau]);
}

function cocoaBeanGeometry() {
  const g = new THREE.SphereGeometry(1, 40, 24);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // groove along the length of the bean
    if (v.y > 0) v.y -= 0.12 * Math.exp(-((v.z / 0.12) ** 2));
    // slightly pointed ends
    v.x *= 1 + 0.12 * Math.abs(v.x) ** 3;
    p.setXYZ(i, v.x * 0.62, v.y * 0.36, v.z * 0.4);
  }
  g.computeVertexNormals();
  return g;
}

function hazelnutGeometry() {
  const g = new THREE.SphereGeometry(0.42, 32, 24);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // pointed tip on top, flatter base
    const k = y > 0 ? 1 + (y / 0.42) ** 4 * 0.35 : 1 - (-y / 0.42) ** 3 * 0.15;
    p.setY(i, y * k);
  }
  g.computeVertexNormals();
  return g;
}

function chunkGeometry() {
  const g = new THREE.IcosahedronGeometry(0.55, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * 0.55);
  g.computeVertexNormals();
  return g;
}

function foilGeometry() {
  const g = new THREE.PlaneGeometry(0.55, 0.42, 5, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, (Math.random() - 0.5) * 0.12);
  g.computeVertexNormals();
  return g;
}

// ---------- materials ----------
const chocolateMat = new THREE.MeshPhysicalMaterial({
  color: "#4a2412",
  roughness: 0.38,
  clearcoat: 0.6,
  clearcoatRoughness: 0.3,
  sheen: 0.5,
  sheenColor: new THREE.Color("#c27a4a"),
});
const milkMat = chocolateMat.clone();
milkMat.color.set("#7a4426");
const beanMat = new THREE.MeshStandardMaterial({ color: "#5b2a17", roughness: 0.55 });
const nutMat = new THREE.MeshStandardMaterial({ color: "#8a5530", roughness: 0.45 });
const foilMat = new THREE.MeshStandardMaterial({
  color: "#ffcf73",
  metalness: 1,
  roughness: 0.22,
  side: THREE.DoubleSide,
  envMapIntensity: 1.6,
});

// ---------- floating instanced objects ----------
const rand = (a, b) => a + Math.random() * (b - a);

function makeField(geometry, material, count, opts) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const items = [];
  for (let i = 0; i < count; i++) {
    const z = rand(-38, 5);
    // keep near objects out of the middle so they never sit behind the bar
    const minX = z > -4 ? 5.5 : 0;
    const spread = 9 + (6 - z) * 0.45;
    const side = Math.random() < 0.5 ? -1 : 1;
    items.push({
      pos: new THREE.Vector3(side * rand(minX, spread), rand(-4.5, 8 + (-z) * 0.12), z),
      rot: new THREE.Euler(rand(0, 6.3), rand(0, 6.3), rand(0, 6.3)),
      spin: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(opts.spin),
      bob: rand(0.2, 0.6),
      phase: rand(0, 6.3),
      scale: rand(opts.scale[0], opts.scale[1]),
    });
  }
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  return { mesh, items };
}

const fields = [
  makeField(chocolateSquareGeometry(), chocolateMat, Math.round(26 * density), { spin: 0.25, scale: [0.7, 1.25] }),
  makeField(chocolateSquareGeometry(), milkMat, Math.round(14 * density), { spin: 0.25, scale: [0.6, 1.1] }),
  makeField(chunkGeometry(), chocolateMat, Math.round(24 * density), { spin: 0.4, scale: [0.6, 1.3] }),
  makeField(cocoaBeanGeometry(), beanMat, Math.round(26 * density), { spin: 0.35, scale: [0.6, 1.0] }),
  makeField(hazelnutGeometry(), nutMat, Math.round(18 * density), { spin: 0.35, scale: [0.8, 1.3] }),
  makeField(foilGeometry(), foilMat, Math.round(70 * density), { spin: 1.2, scale: [0.6, 1.4] }),
];

// ---------- glowing dust ----------
const DUST = Math.round(900 * density);
const dustGeo = new THREE.BufferGeometry();
const dPos = new Float32Array(DUST * 3);
const dSeed = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) {
  dPos[i * 3] = rand(-30, 30);
  dPos[i * 3 + 1] = rand(-6, 14);
  dPos[i * 3 + 2] = rand(-45, 8);
  dSeed[i] = Math.random();
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
dustGeo.setAttribute("seed", new THREE.BufferAttribute(dSeed, 1));
const dustMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uScale;
    attribute float seed;
    varying float vAlpha;
    varying float vSeed;
    varying float vBlur;
    void main() {
      vec3 p = position;
      p.y += mod(uTime * (0.15 + seed * 0.35) + seed * 20.0, 20.0) - 10.0 + 4.0;
      p.x += sin(uTime * 0.3 + seed * 30.0) * 0.6;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      // dust isn't in the depth-of-field pass, so it defocuses itself:
      // distant motes grow into soft, dim bokeh discs
      vBlur = clamp((-mv.z - 10.0) / 30.0, 0.0, 1.0);
      gl_PointSize = (2.0 + seed * 5.0) * uScale * (30.0 / -mv.z) * (1.0 + vBlur * 3.0);
      vAlpha = (0.35 + 0.65 * abs(sin(uTime * (0.6 + seed) + seed * 50.0)))
             * smoothstep(60.0, 8.0, -mv.z) / (1.0 + vBlur * 4.0);
      vSeed = seed;
    }
  `,
  fragmentShader: /* glsl */ `
    varying float vAlpha;
    varying float vSeed;
    varying float vBlur;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, mix(0.0, 0.3, vBlur), d);
      vec3 col = mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.8, 0.5), vSeed);
      gl_FragColor = vec4(col, a * vAlpha * 0.6);
    }
  `,
});
fxScene.add(new THREE.Points(dustGeo, dustMat));

// ---------- loop ----------
const dummy = new THREE.Object3D();
const pointer = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  pointer.x = e.clientX / window.innerWidth - 0.5;
  pointer.y = e.clientY / window.innerHeight - 0.5;
}, { passive: true });

// ---------- depth of field: the further away, the more frosted ----------
// Custom pass rather than BokehPass: its fixed sample pattern turns bright
// specks into spiky stars. Here every pixel rotates its sample spiral by a
// random angle, which reads as a soft frosted-glass grain instead.
class FrostedDepthPass extends Pass {
  constructor(cam) {
    super();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        uNear: { value: cam.near },
        uFar: { value: cam.far },
        uFocus: { value: 11 }, // nearer than this stays sharp
        uRange: { value: 28 }, // distance over which blur ramps to full
        uMaxRadius: { value: 14 }, // px
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        #include <packing>
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform float uNear, uFar, uFocus, uRange, uMaxRadius;
        uniform vec2 uResolution;
        varying vec2 vUv;

        float blurAt(vec2 uv) {
          float dist = -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar);
          return clamp((dist - uFocus) / uRange, 0.0, 1.0) * uMaxRadius;
        }
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec4 base = texture2D(tColor, vUv);
          float radius = blurAt(vUv);
          if (radius < 0.5) { gl_FragColor = base; return; }
          float rot = hash(gl_FragCoord.xy) * 6.2831853;
          vec3 acc = base.rgb;
          float wsum = 1.0;
          const int N = 28;
          for (int i = 0; i < N; i++) {
            float fi = float(i);
            float r = sqrt((fi + 0.5) / float(N)) * radius;
            float a = fi * 2.39996323 + rot; // golden-angle spiral
            vec2 suv = vUv + vec2(cos(a), sin(a)) * r / uResolution;
            // a sharper (nearer) sample may not spill into this pixel's blur
            float w = clamp(blurAt(suv) - r + 1.0, 0.0, 1.0);
            acc += texture2D(tColor, suv).rgb * w;
            wsum += w;
          }
          gl_FragColor = vec4(acc / wsum, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });
    this.fsQuad = new FullScreenQuad(this.material);
  }
  setSize(w, h) {
    this.material.uniforms.uResolution.value.set(w, h);
  }
  render(renderer, writeBuffer, readBuffer) {
    this.material.uniforms.tColor.value = readBuffer.texture;
    this.material.uniforms.tDepth.value = readBuffer.depthTexture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (this.clear) renderer.clear();
    this.fsQuad.render(renderer);
  }
}

const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
  type: THREE.HalfFloatType,
  depthTexture: new THREE.DepthTexture(1, 1),
});
const composer = new EffectComposer(renderer, sceneTarget);
composer.addPass(new RenderPass(scene, camera, null, BG, 1));
const frosted = new FrostedDepthPass(camera);
composer.addPass(frosted);
const fxPass = new RenderPass(fxScene, camera);
fxPass.clear = false;
composer.addPass(fxPass);
composer.addPass(new OutputPass());

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  camera.aspect = w / h;
  // narrow screens: pull back so the scene still fills the sides
  camera.fov = w / h < 0.8 ? 60 : 45;
  camera.updateProjectionMatrix();
  frosted.material.uniforms.uMaxRadius.value = 14 * renderer.getPixelRatio() * Math.min(1.4, h / 900);
  dustMat.uniforms.uScale.value = renderer.getPixelRatio() * (h / 900);
}
window.addEventListener("resize", () => {
  resize();
  if (reduceMotion) frame(performance.now());
});
resize();

const start = performance.now();

// the depth-of-field pass is the costly part; on slow devices render the
// background at a lower resolution (it's blurred anyway) instead of stuttering
let lastFrame = 0;
let slowFrames = 0;
let sampled = 0;
function adaptQuality() {
  const now = performance.now();
  const dt = now - lastFrame;
  lastFrame = now;
  if (dt > 200) return; // tab was hidden or first frame
  sampled++;
  if (dt > 28) slowFrames++;
  if (sampled < 90) return;
  const ratio = renderer.getPixelRatio();
  if (slowFrames > 45 && ratio > 0.6) {
    renderer.setPixelRatio(Math.max(0.6, ratio * 0.75));
    resize();
  }
  sampled = slowFrames = 0;
}

function frame() {
  const t = reduceMotion ? 12 : (performance.now() - start) / 1000;
  lakeUniforms.uTime.value = t;
  dustMat.uniforms.uTime.value = t;

  for (const { mesh, items } of fields) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      dummy.position.set(
        it.pos.x + Math.sin(t * 0.2 + it.phase) * 0.4,
        it.pos.y + Math.sin(t * it.bob + it.phase) * 0.6,
        it.pos.z
      );
      dummy.rotation.set(it.rot.x + t * it.spin.x, it.rot.y + t * it.spin.y, it.rot.z + t * it.spin.z);
      dummy.scale.setScalar(it.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  // gentle parallax towards the pointer
  camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.03;
  camera.position.y += (0.6 - pointer.y * 1.4 - camera.position.y) * 0.03;
  camera.lookAt(0, 0.4, -6);
  glowLight.intensity = 34 + Math.sin(t * 1.4) * 6;

  composer.render();
  adaptQuality();
}

if (reduceMotion) {
  frame();
} else {
  renderer.setAnimationLoop(frame);
}
canvas.classList.add("ready");
