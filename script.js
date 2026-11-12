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

// --- social links ---
const nav = document.getElementById("links");
for (const { id, label, url } of CONFIG.links) {
  const a = document.createElement("a");
  a.className = `link ${id}`;
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.title = label;
  a.setAttribute("aria-label", label);
  a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${window.ICONS[id]}"/></svg>`;
  nav.appendChild(a);
}

// --- email dialog ---
const dialog = document.getElementById("emailDialog");
const form = document.getElementById("emailForm");
const addr = document.getElementById("emailAddress");
addr.textContent = CONFIG.email;
addr.href = `mailto:${CONFIG.email}`;

document.getElementById("emailBtn").addEventListener("click", () => {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else location.href = `mailto:${CONFIG.email}`;
});
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

// --- chocolate pieces ---
const pieces = document.getElementById("pieces");
for (let i = 0; i < 18; i++) {
  const p = document.createElement("div");
  p.className = "piece";
  pieces.appendChild(p);
}

// --- rotation: drag with inertia, arrow keys, idle auto-spin ---
const stage = document.getElementById("stage");
const bar = document.getElementById("bar");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let rx = -12, ry = 25;   // degrees
let vx = 0, vy = 0;      // degrees per frame
let dragging = false;
let lastX = 0, lastY = 0;
let lastInteraction = 0;
const AUTO_SPIN = reduceMotion ? 0 : 0.35;
const IDLE_MS = 2500;

function render() {
  bar.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
}

stage.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  vx = vy = 0;
  stage.setPointerCapture(e.pointerId);
  stage.classList.add("dragging");
});

stage.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  vy = dx * 0.5;
  vx = -dy * 0.5;
  ry += vy;
  rx += vx;
  lastInteraction = performance.now();
});

function endDrag() {
  dragging = false;
  stage.classList.remove("dragging");
  lastInteraction = performance.now();
}
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

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

// double-click / double-tap flips the bar to show the other side
stage.addEventListener("dblclick", () => {
  ry += 180;
  lastInteraction = performance.now();
});

function tick(now) {
  if (!dragging) {
    // inertia after release
    rx += vx;
    ry += vy;
    vx *= 0.94;
    vy *= 0.94;
    if (Math.abs(vx) < 0.01) vx = 0;
    if (Math.abs(vy) < 0.01) vy = 0;
    if (!vx && !vy && now - lastInteraction > IDLE_MS) ry += AUTO_SPIN;
  }
  render();
  requestAnimationFrame(tick);
}
render();
requestAnimationFrame(tick);
