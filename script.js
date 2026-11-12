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
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// size of one "pixel" in CSS px, shared with style.css (--px) and the background
const PX = Math.max(1, Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--px")) || 3));
const ICON_GRID = 20;

// --- pixel art ---

// Rasterises a 24-unit icon onto a small grid and returns an SVG made of whole
// pixels: it looks pixelated, stays sharp at any zoom and takes its colour from CSS.
function pixelIcon(path, grid = ICON_GRID) {
  const size = grid * PX;
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = grid;
    const ctx = cv.getContext("2d");
    ctx.scale(grid / 24, grid / 24);
    ctx.fill(new Path2D(path));
    const px = ctx.getImageData(0, 0, grid, grid).data;
    let d = "";
    let on = 0;
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; ) {
        if (px[(y * grid + x) * 4 + 3] < 128) { x++; continue; }
        const x0 = x;
        while (x < grid && px[(y * grid + x) * 4 + 3] >= 128) x++;
        d += `M${x0} ${y}h${x - x0}v1h${x0 - x}z`;
        on += x - x0;
      }
    }
    // privacy modes can blank or fill canvas reads; use the smooth icon then
    if (on < grid * grid * 0.05 || on > grid * grid * 0.9) throw new Error("unreadable canvas");
    return `<svg viewBox="0 0 ${grid} ${grid}" width="${size}" height="${size}" aria-hidden="true"><path d="${d}"/></svg>`;
  } catch (err) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${path}"/></svg>`;
  }
}

// heading: drawn small, then scaled up with hard pixel edges; the text stays for screen readers
(function pixelTitle() {
  const h1 = document.querySelector("h1");
  const label = h1 && h1.querySelector(".title-text");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext && canvas.getContext("2d");
  if (!label || !ctx) return;
  canvas.className = "title-px";
  canvas.setAttribute("aria-hidden", "true");

  function draw() {
    const cs = getComputedStyle(h1);
    const size = parseFloat(cs.fontSize) / PX;
    const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const text = label.textContent.trim();
    ctx.font = font;
    const m = ctx.measureText(text);
    const left = m.actualBoundingBoxLeft || 0;
    const right = m.actualBoundingBoxRight || m.width;
    const asc = m.actualBoundingBoxAscent || size * 0.8;
    const desc = m.actualBoundingBoxDescent || size * 0.25;
    canvas.width = Math.ceil(left + right) + 2;
    canvas.height = Math.ceil(asc + desc) + 2;
    ctx.font = font; // resizing a canvas resets its state
    const g = ctx.createLinearGradient(0, 1, 0, canvas.height - 1);
    g.addColorStop(0, "#f0d4ad");
    g.addColorStop(1, "#a8693e");
    ctx.fillStyle = g;
    ctx.fillText(text, 1 + left, 1 + asc);
    canvas.style.width = `${canvas.width * PX}px`;
    canvas.style.height = `${canvas.height * PX}px`;
    if (!canvas.parentNode) {
      h1.appendChild(canvas);
      h1.classList.add("px");
    }
  }

  let queued = false;
  const redraw = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  };
  window.addEventListener("resize", redraw);

  // wait briefly for the heading font so the pixel version doesn't swap fonts
  const spec = 'italic 600 16px "Playfair Display"';
  if (!document.fonts || document.fonts.check(spec)) return draw();
  let drawn = false;
  const first = () => {
    if (drawn) return;
    drawn = true;
    draw();
  };
  document.fonts.load(spec).then(() => (drawn ? redraw() : first()), first);
  setTimeout(first, 1200);
})();

// --- the slab: 2 × 3 smooth tiles, one link each ---
const stage = document.getElementById("stage");
const bar = document.getElementById("bar");
const COLS = 2;
const ROWS = 3;
const linkItems = [
  ...CONFIG.links.map((l) => ({ ...l, path: window.ICONS[l.id] })),
  { id: "email", label: "Email", url: `mailto:${CONFIG.email}`, path: EMAIL_ICON },
];

// seeded, so the tiles always land in the same tidy scatter
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

const tiles = linkItems.map((item, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);

  const a = document.createElement("a");
  a.className = `tile ${item.id}`;
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

  // the slab's outer corners are rounded from the start, the rest once it breaks
  const top = r === 0;
  const bottom = r === ROWS - 1;
  const left = c === 0;
  const right = c === COLS - 1;
  a.style.cssText =
    `--col:${c};--row:${r};` +
    `--o-tl:${+(top && left)};--o-tr:${+(top && right)};--o-br:${+(bottom && right)};--o-bl:${+(bottom && left)}`;
  a.innerHTML =
    `<span class="tf">${pixelIcon(item.path)}</span><span class="tb"></span>` +
    ["l", "r", "t", "b"].map((s) => `<span class="te ${s}"></span>`).join("");
  bar.appendChild(a);

  return {
    el: a,
    // where the tile comes to rest: pushed apart, tilted a little so its edges show
    rest: {
      x: (left ? -1 : 1) * 20 + spread(4),
      y: (r - 1) * 30 + spread(4),
      rx: (top ? 7 : bottom ? -7 : 0) + spread(2),
      ry: (left ? -9 : 9) + spread(2),
      rz: spread(5),
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

// --- entrance: the slab flies in, cracks and breaks into its six tiles ---
const hoverable = window.matchMedia("(hover: hover)");
const FOCUS = window.CSS && CSS.supports("selector(:focus-visible)") ? ":focus-visible" : ":focus";
const D = parseFloat(getComputedStyle(bar).getPropertyValue("--tile-depth")) || 20;

// ms after the first frame
const T = { appear: 800, burst: 1150, end: 2150 };
const POSE = {
  start: { x: 0, y: -40, z: -600, rx: 38, ry: -40, rz: -8 },
  front: { x: 0, y: 0, z: 0, rx: -4, ry: 0, rz: 0 },
  flat: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
};
const LOOSEN = 0.06; // how far the tiles part while the slab cracks

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeOutBack = (t) => 1 + 2.6 * (t - 1) ** 3 + 1.6 * (t - 1) ** 2;
const mix = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], t)]));
const toCss = (p, s = 1) =>
  `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px) ` +
  `rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg)` +
  (s !== 1 ? ` scale(${s.toFixed(3)})` : "");

function barPose(e) {
  if (e < T.appear) return mix(POSE.start, POSE.front, easeOutCubic(e / T.appear));
  if (e < T.burst) {
    // the crack: a short, fading shudder
    const k = (e - T.appear) / (T.burst - T.appear);
    return { ...POSE.front, rz: Math.sin(k * Math.PI * 10) * 1.4 * (1 - 0.6 * k) };
  }
  return mix(POSE.front, POSE.flat, easeOutCubic(clamp01((e - T.burst) / (T.end - T.burst))));
}

function tilePose(tile, e) {
  const { rest, tumble } = tile;
  if (e < T.burst) {
    const k = e < T.appear ? 0 : LOOSEN * easeOutCubic((e - T.appear) / (T.burst - T.appear));
    return { x: rest.x * k, y: rest.y * k, z: 0, rx: 0, ry: 0, rz: 0 };
  }
  // fly apart with a little overshoot, popping towards the viewer and tumbling on the way
  const t = clamp01((e - T.burst - tile.delay) / (T.end - T.burst - 150));
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

// square "pixel" debris thrown out along the break lines
function spawnCrumbs() {
  const W = bar.offsetWidth;
  const H = bar.offsetHeight;
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("span");
    s.className = i % 2 ? "crumb" : "crumb alt";
    const k = i % 3;
    const x = k === 0 ? W / 2 : Math.random() * W;
    const y = k === 0 ? Math.random() * H : (H / 3) * k;
    const size = PX * (Math.random() < 0.65 ? 1 : 2);
    s.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px`;
    bar.appendChild(s);
    const dx = (x - W / 2) * 0.5 + (Math.random() - 0.5) * 140;
    const up = -30 - Math.random() * 90;
    const fall = 220 + Math.random() * 260;
    const dz = 40 + Math.random() * 160;
    s.animate(
      [
        { transform: `translate3d(0, 0, ${D / 2 + 1}px)`, opacity: 1 },
        { transform: `translate3d(${dx / 2}px, ${up}px, ${dz * 0.6}px)`, opacity: 1, offset: 0.35 },
        { transform: `translate3d(${dx}px, ${fall}px, ${dz}px)`, opacity: 0 },
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
  if (!reduceMotion) spawnCrumbs();
}

function skipIntro() {
  if (start === null) skipPending = true;
  else if (elapsed < T.burst) start = performance.now() - T.burst;
}

// during the entrance a tap just skips ahead; the links work once the tiles fly apart
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
  bar.style.transform = toCss(barPose(e));

  // crack lines run out along the seams, flicker, then fade as the tiles fly
  const grow = clamp01((e - T.appear) / 160);
  const shine =
    e < T.burst
      ? clamp01((e - T.appear) / 90) * (0.85 + 0.15 * Math.sin(e / 11))
      : 1 - clamp01((e - T.burst) / 260);
  cracks.forEach((s, i) => {
    s.style.opacity = shine.toFixed(3);
    s.style.transform = `translateZ(${D / 2 + 1}px) ${i === 0 ? "scaleY" : "scaleX"}(${grow.toFixed(3)})`;
  });

  // once settled the tiles only bob gently; hover or focus lifts one towards you
  const bob = reduceMotion ? 0 : clamp01((e - T.end) / 800);
  for (const tile of tiles) {
    const want = broken && ((hoverable.matches && tile.el.matches(":hover")) || tile.el.matches(FOCUS)) ? 1 : 0;
    tile.lift += (want - tile.lift) * 0.2;
    const p = tilePose(tile, e);
    p.y += Math.sin(now / 900 + tile.phase) * 3 * bob;
    p.rz += Math.sin(now / 1300 + tile.phase) * 0.6 * bob;
    p.z += tile.lift * 28;
    tile.el.style.transform = toCss(p, 1 + tile.lift * 0.04);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
