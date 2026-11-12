// ===== Edit your links and email here =====
const CONFIG = {
  email: "hello@example.com",
  links: [
    { id: "tiktok",    label: "TikTok",    url: "https://www.tiktok.com/@your_username" },
    { id: "instagram", label: "Instagram", url: "https://www.instagram.com/your_username" },
    { id: "github",    label: "GitHub",    url: "https://github.com/your_username" },
    { id: "vk",        label: "VK",        url: "https://vk.com/your_username" },
    { id: "telegram",  label: "Telegram",  url: "https://t.me/your_username" },
  ],
};
// ==========================================

const EMAIL_ICON =
  "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.3V17h16V7.3l-8 5.6-8-5.6zM5.4 7 12 11.6 18.6 7H5.4z";

const dialog = document.getElementById("emailDialog");

// --- the bar: 2 × 3 chocolate pieces, one link each ---
const stage = document.getElementById("stage");
const bar = document.getElementById("bar");
const COLS = 2;
const ROWS = 3;
const linkItems = [
  ...CONFIG.links.map((l) => ({ ...l, path: window.ICONS[l.id] })),
  { id: "email", label: "Email", url: `mailto:${CONFIG.email}`, path: EMAIL_ICON },
];

// seeded, so the broken pieces always land in the same tidy scatter
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1112);
const spread = (n) => (rand() * 2 - 1) * n;

const chunks = linkItems.map((item, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const outer = { t: r === 0, r: c === COLS - 1, b: r === ROWS - 1, l: c === 0 };

  const a = document.createElement("a");
  a.className = `chunk ${item.id}`;
  a.href = item.url;
  a.title = item.label;
  a.setAttribute("aria-label", item.id === "email" ? "Send me an email" : item.label);
  a.draggable = false;
  if (item.id === "email") {
    a.addEventListener("click", (e) => {
      if (typeof dialog.showModal !== "function") return; // plain mailto fallback
      e.preventDefault();
      dialog.showModal();
    });
  } else {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  a.style.setProperty("--c", c);
  a.style.setProperty("--r", r);
  // flat lip along the bar's outer rim, half a groove where it snapped
  a.style.setProperty("--pad", ["t", "r", "b", "l"].map((s) => (outer[s] ? "12px" : "4px")).join(" "));
  a.style.setProperty(
    "--rad",
    [outer.t && outer.l, outer.t && outer.r, outer.b && outer.r, outer.b && outer.l]
      .map((o) => (o ? "10px" : "2px"))
      .join(" ")
  );
  a.innerHTML =
    `<span class="cf"><span class="tile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${item.path}"/></svg></span></span>` +
    `<span class="cb"></span>` +
    ["l", "r", "t", "b"].map((s) => `<span class="ce ${s}${outer[s] ? "" : " broke"}"></span>`).join("");
  bar.appendChild(a);

  return {
    el: a,
    // where the piece comes to rest: pushed apart, tilted so the broken edges show
    rest: {
      x: (c === 0 ? -1 : 1) * 22 + spread(5),
      y: (r - 1) * 36 + spread(5),
      rx: (r === 0 ? 8 : r === ROWS - 1 ? -8 : 0) + spread(2),
      ry: (c === 0 ? -10 : 10) + spread(2),
      rz: spread(6),
    },
    tumble: { x: spread(35), y: spread(35), z: spread(25) },
    delay: i * 30,
    phase: rand() * Math.PI * 2,
    lift: 0,
  };
});

const cracks = ["v", "h1", "h2"].map((k) => {
  const s = document.createElement("span");
  s.className = `crack ${k}`;
  bar.appendChild(s);
  return s;
});

// --- wrapper details: guilloché, foil crimp, barcode ---
(function drawWrapper() {
  const NS = "http://www.w3.org/2000/svg";
  const svgPath = (parent, d, attrs = {}) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v);
    document.getElementById(parent).appendChild(p);
  };
  const f = (n) => n.toFixed(2);

  // rosette: interleaved sine rings around the emblem
  for (let k = 0; k < 14; k++) {
    let d = "";
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * Math.PI * 2;
      const r = 59 + 10 * Math.sin(16 * t + (k * Math.PI) / 7) + 2 * Math.sin(48 * t + k);
      d += `${i ? "L" : "M"}${f(126 + r * Math.cos(t))} ${f(158 + r * Math.sin(t))}`;
    }
    svgPath("rosette", d + "Z");
  }

  // wave band
  for (let k = 0; k < 12; k++) {
    let d = "";
    for (let x = 18; x <= 234; x += 1.5) {
      const y = 385 + 9 * Math.sin(x * 0.085 + (k * Math.PI) / 6) * Math.cos(x * 0.018 - 0.4);
      d += `${x === 18 ? "M" : "L"}${f(x)} ${f(y)}`;
    }
    svgPath("waves", d);
  }

  // foil: crimped strip with a pinked bottom edge
  let foil = "M0 0H252V31";
  for (let x = 252; x > 0; x -= 4) foil += `L${x - 2} 35L${x - 4} 31`;
  document.getElementById("foilShape").setAttribute("d", foil + "Z");
  for (let x = 1; x < 252; x += 2.5) {
    svgPath("foilCrimp", `M${f(x)} 0V${x % 5 < 2.5 ? 31 : 33}`, {
      stroke: x % 5 < 2.5 ? "#000" : "#fff",
      "stroke-width": ".6",
      opacity: x % 5 < 2.5 ? ".14" : ".22",
    });
  }

  // barcode (deterministic widths)
  let seed = 7;
  let x = 50;
  while (x < 104) {
    seed = (seed * 9301 + 49297) % 233280;
    const w = 0.5 + (seed % 3) * 0.5;
    const guard = x < 52 || x > 101 || Math.abs(x - 77) < 1.5;
    svgPath("barcode", `M${f(x)} 410h${w}v${guard ? 22 : 19}h-${w}z`);
    x += w + 0.6 + ((seed >> 3) % 3) * 0.45;
  }
})();

// --- email dialog ---
const form = document.getElementById("emailForm");
const addr = document.getElementById("emailAddress");
addr.textContent = CONFIG.email;
addr.href = `mailto:${CONFIG.email}`;

document.getElementById("emailCancel").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
form.addEventListener("submit", () => {
  const data = new FormData(form);
  const params = [];
  for (const key of ["subject", "body"]) {
    const v = String(data.get(key) || "").trim();
    if (v) params.push(`${key}=${encodeURIComponent(v)}`);
  }
  location.href = `mailto:${CONFIG.email}${params.length ? "?" + params.join("&") : ""}`;
  form.reset();
});

// --- entrance: the wrapped bar turns over, cracks and breaks into its six pieces ---
const wrapperEl = bar.querySelector(".back");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hoverable = window.matchMedia("(hover: hover)");
const FOCUS = window.CSS && CSS.supports("selector(:focus-visible)") ? ":focus-visible" : ":focus";
const D = parseFloat(getComputedStyle(bar).getPropertyValue("--d")) || 26;

// ms after the first frame
const T = { appear: 600, flip: 750, flipEnd: 1500, burst: 1820, end: 2800 };
const POSE = {
  start: { x: 0, y: -60, z: -520, rx: 30, ry: 115, rz: -10 },
  wrapped: { x: 0, y: 0, z: 0, rx: -8, ry: 162, rz: 2 },
  front: { x: 0, y: 0, z: 0, rx: -5, ry: 360, rz: 0 },
  flat: { x: 0, y: 0, z: 0, rx: 0, ry: 360, rz: 0 },
};
const LOOSEN = 0.06; // how far the pieces part while the bar cracks

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutBack = (t) => 1 + 2.6 * (t - 1) ** 3 + 1.6 * (t - 1) ** 2;
const mix = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], t)]));
const toCss = (p, s = 1) =>
  `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px) ` +
  `rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg)` +
  (s !== 1 ? ` scale(${s.toFixed(3)})` : "");

function barPose(e) {
  if (e < T.appear) return mix(POSE.start, POSE.wrapped, easeOutCubic(e / T.appear));
  if (e < T.flip) return POSE.wrapped;
  if (e < T.flipEnd) return mix(POSE.wrapped, POSE.front, easeInOutCubic((e - T.flip) / (T.flipEnd - T.flip)));
  if (e < T.burst) {
    // the crack: a short, fading shudder
    const k = (e - T.flipEnd) / (T.burst - T.flipEnd);
    return { ...POSE.front, rz: Math.sin(k * Math.PI * 12) * 1.6 * (1 - 0.6 * k) };
  }
  return mix(POSE.front, POSE.flat, easeOutCubic(clamp01((e - T.burst) / (T.end - T.burst))));
}

function chunkPose(ch, e) {
  const { rest, tumble } = ch;
  if (e < T.burst) {
    const k = e < T.flipEnd ? 0 : LOOSEN * easeOutCubic((e - T.flipEnd) / (T.burst - T.flipEnd));
    return { x: rest.x * k, y: rest.y * k, z: 0, rx: 0, ry: 0, rz: 0 };
  }
  // fly apart with a little overshoot, popping towards the viewer and tumbling on the way
  const t = clamp01((e - T.burst - ch.delay) / (T.end - T.burst - 150));
  const p = lerp(LOOSEN, 1, easeOutBack(t));
  const q = easeOutCubic(t);
  const arc = Math.sin(Math.PI * t);
  return {
    x: rest.x * p,
    y: rest.y * p,
    z: 90 * arc,
    rx: rest.rx * q + tumble.x * arc,
    ry: rest.ry * q + tumble.y * arc,
    rz: rest.rz * q + tumble.z * arc,
  };
}

function spawnCrumbs() {
  const W = bar.offsetWidth;
  const H = bar.offsetHeight;
  for (let i = 0; i < 34; i++) {
    const s = document.createElement("span");
    s.className = "crumb";
    // along the three break lines
    const k = i % 3;
    const x = k === 0 ? W / 2 : Math.random() * W;
    const y = k === 0 ? Math.random() * H : (H / 3) * k;
    const size = 2 + Math.random() * 5;
    s.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size * (0.6 + Math.random() * 0.6)}px`;
    bar.appendChild(s);
    const dx = (x - W / 2) * 0.5 + (Math.random() - 0.5) * 140;
    const up = -30 - Math.random() * 90;
    const fall = 220 + Math.random() * 260;
    const dz = 40 + Math.random() * 160;
    const spin = (Math.random() - 0.5) * 900;
    s.animate(
      [
        { transform: `translate3d(0, 0, ${D / 2 + 1}px) rotate(0deg)`, opacity: 1 },
        { transform: `translate3d(${dx / 2}px, ${up}px, ${dz * 0.6}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate3d(${dx}px, ${fall}px, ${dz}px) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.3,.6,.5,1)" }
    ).finished.then(() => s.remove(), () => s.remove());
  }
}

let start = null;
let elapsed = 0;
let broken = false;
let skipPending = false;

function breakApart() {
  broken = true;
  stage.classList.add("broken");
  wrapperEl.style.visibility = "hidden";
  if (!reduceMotion) spawnCrumbs();
}

function skipIntro() {
  if (start === null) skipPending = true;
  else if (elapsed < T.burst) start = performance.now() - T.burst;
}

// during the entrance a tap just skips ahead; the links work once the pieces fly apart
stage.addEventListener(
  "click",
  (e) => {
    if (elapsed >= T.burst + 250) return;
    e.preventDefault();
    e.stopPropagation();
    skipIntro();
  },
  true
);
stage.addEventListener("focusin", skipIntro);

function frame(now) {
  if (start === null) start = skipPending ? now - T.burst : now;
  elapsed = reduceMotion ? T.end + 1 : now - start;
  const e = elapsed;

  if (!broken && e >= T.burst) breakApart();
  stage.style.opacity = e < 450 ? easeOutCubic(e / 450).toFixed(3) : "1";

  const bp = barPose(e);
  bar.style.transform = toCss(bp);
  const sheen = 50 + Math.sin((bp.ry * Math.PI) / 180) * 70 + Math.sin((bp.rx * Math.PI) / 180) * 30;
  bar.style.setProperty("--sheen", `${sheen.toFixed(1)}%`);

  // crack lines run out along the grooves, glow, then fade as the pieces fly
  const grow = clamp01((e - T.flipEnd) / 160);
  const shine =
    e < T.burst
      ? clamp01((e - T.flipEnd) / 90) * (0.85 + 0.15 * Math.sin(e / 11))
      : 1 - clamp01((e - T.burst) / 260);
  cracks.forEach((s, i) => {
    s.style.opacity = shine.toFixed(3);
    s.style.transform = `translateZ(${D / 2 + 1}px) ${i === 0 ? "scaleY" : "scaleX"}(${grow.toFixed(3)})`;
  });

  // once settled the pieces only bob gently; hover or focus lifts one towards you
  const bob = reduceMotion ? 0 : clamp01((e - T.end) / 800);
  for (const ch of chunks) {
    const want = broken && ((hoverable.matches && ch.el.matches(":hover")) || ch.el.matches(FOCUS)) ? 1 : 0;
    ch.lift += (want - ch.lift) * 0.2;
    const p = chunkPose(ch, e);
    p.y += Math.sin(now / 900 + ch.phase) * 3 * bob;
    p.rz += Math.sin(now / 1300 + ch.phase) * 0.6 * bob;
    p.z += ch.lift * 28;
    ch.el.style.transform = toCss(p, 1 + ch.lift * 0.04);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
