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

// --- chocolate pieces: 3 × 6, links in the two middle rows ---
const pieces = document.getElementById("pieces");
const linkItems = [
  ...CONFIG.links.map((l) => ({ ...l, path: window.ICONS[l.id] })),
  { id: "email", label: "Email", url: `mailto:${CONFIG.email}`, path: EMAIL_ICON },
];
const FIRST_LINK_SLOT = 6;

for (let i = 0; i < 18; i++) {
  const item = linkItems[i - FIRST_LINK_SLOT];
  if (!item) {
    const p = document.createElement("div");
    p.className = "piece";
    p.setAttribute("aria-hidden", "true");
    pieces.appendChild(p);
    continue;
  }
  const a = document.createElement("a");
  a.className = `piece link ${item.id}`;
  a.href = item.url;
  a.title = item.label;
  a.setAttribute("aria-label", item.id === "email" ? "Send me an email" : item.label);
  a.draggable = false;
  if (item.id !== "email") {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  } else {
    a.addEventListener("click", (e) => {
      if (typeof dialog.showModal !== "function") return; // plain mailto fallback
      e.preventDefault();
      dialog.showModal();
    });
  }
  a.innerHTML =
    `<span class="mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${item.path}"/></svg>` +
    `<span class="label">${item.label}</span></span>`;
  pieces.appendChild(a);
}

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

// --- rotation: drag with inertia, arrow keys, idle sway back to the front ---
const stage = document.getElementById("stage");
const bar = document.getElementById("bar");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let rx = -8, ry = 20;   // degrees
let vx = 0, vy = 0;     // degrees per frame
let lastInteraction = -Infinity;
let hovering = false;
const IDLE_MS = 2200;
const DRAG_THRESHOLD = 6; // px; below this a press counts as a tap on a link

// pointer state; capture starts only once the press turns into a drag
let ptr = null;
let suppressClick = false;

stage.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false };
  suppressClick = false;
  vx = vy = 0;
  lastInteraction = performance.now();
});

stage.addEventListener("pointermove", (e) => {
  if (!ptr || e.pointerId !== ptr.id) return;
  if (!ptr.moved) {
    if (Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0) < DRAG_THRESHOLD) return;
    ptr.moved = true;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
  }
  const dx = e.clientX - ptr.x;
  const dy = e.clientY - ptr.y;
  ptr.x = e.clientX;
  ptr.y = e.clientY;
  vy = dx * 0.5;
  vx = -dy * 0.5;
  ry += vy;
  rx += vx;
  lastInteraction = performance.now();
});

function endPointer(e) {
  if (!ptr || e.pointerId !== ptr.id) return;
  if (ptr.moved) suppressClick = true;
  ptr = null;
  stage.classList.remove("dragging");
  lastInteraction = performance.now();
}
stage.addEventListener("pointerup", endPointer);
stage.addEventListener("pointercancel", endPointer);

// a drag that ends over a piece must not open its link
stage.addEventListener("click", (e) => {
  if (!suppressClick) return;
  suppressClick = false;
  e.preventDefault();
  e.stopPropagation();
}, true);

bar.addEventListener("pointerenter", () => (hovering = true));
bar.addEventListener("pointerleave", () => (hovering = false));

// tabbing onto a link turns the bar back to the front right away
stage.addEventListener("focusin", (e) => {
  if (e.target.closest(".link")) {
    vx = vy = 0;
    lastInteraction = -Infinity;
  }
});

stage.addEventListener("keydown", (e) => {
  const step = 15;
  const keys = {
    ArrowLeft: () => (ry -= step),
    ArrowRight: () => (ry += step),
    ArrowUp: () => (rx += step),
    ArrowDown: () => (rx -= step),
  };
  if (keys[e.key]) {
    e.preventDefault();
    keys[e.key]();
    vx = vy = 0;
    lastInteraction = performance.now();
  }
});

function render() {
  bar.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  // slide the highlight across the front as the bar turns
  const sheen = 50 + Math.sin((ry * Math.PI) / 180) * 70 + Math.sin((rx * Math.PI) / 180) * 30;
  bar.style.setProperty("--sheen", `${sheen.toFixed(1)}%`);
}

function nearestTurn(angle, offset) {
  return Math.round((angle - offset) / 360) * 360 + offset;
}

function tick(now) {
  if (!ptr || !ptr.moved) {
    rx += vx;
    ry += vy;
    vx *= 0.94;
    vy *= 0.94;
    if (Math.abs(vx) < 0.01) vx = 0;
    if (Math.abs(vy) < 0.01) vy = 0;

    // when idle, ease back to the front (where the links are) with a gentle sway
    if (!vx && !vy && !ptr && now - lastInteraction > IDLE_MS) {
      const sway = reduceMotion || hovering ? 0 : 1;
      const tx = nearestTurn(rx, -8) + sway * Math.sin(now / 2300) * 5;
      const ty = nearestTurn(ry, 0) + sway * Math.sin(now / 1700) * 16;
      rx += (tx - rx) * 0.04;
      ry += (ty - ry) * 0.04;
    }
  }
  render();
  requestAnimationFrame(tick);
}
render();
requestAnimationFrame(tick);
