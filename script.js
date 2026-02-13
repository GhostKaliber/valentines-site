const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => Math.random() * (max - min) + min;

// Floating hearts
const heartsLayer = document.getElementById("hearts");
const heartChars = ["💗","💖","💘","💝","💕","💞","💓","💟"];
let heartTimer = null;

function spawnHeart(){
  const h = document.createElement("div");
  h.className = "heart";
  h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];

  const startX = rand(0, window.innerWidth);
  const startY = window.innerHeight + rand(10, 60);
  const duration = rand(7.5, 13.5);

  h.style.left = `${startX}px`;
  h.style.top = `${startY}px`;
  h.style.setProperty("--drift", `${rand(-90, 90)}px`);
  h.style.setProperty("--spin", `${rand(-25, 25)}deg`);
  h.style.animationDuration = `${duration}s`;
  h.style.opacity = String(rand(0.10, 0.20));

  heartsLayer.appendChild(h);
  h.addEventListener("animationend", () => h.remove());
}

function startHearts(){
  if (heartTimer) return;
  for(let i=0;i<10;i++) setTimeout(spawnHeart, i * 180);
  heartTimer = setInterval(spawnHeart, 420);
}
startHearts();

// Sparkle cursor
const sparkle = document.getElementById("sparkle");
let lastSparkle = 0;

window.addEventListener("pointermove", (e) => {
  const now = performance.now();
  if (now - lastSparkle < 22) return;
  lastSparkle = now;

  sparkle.style.left = e.clientX + "px";
  sparkle.style.top = e.clientY + "px";
  sparkle.style.opacity = "0.55";
  sparkle.animate(
    [
      { transform: "translate(-50%,-50%) scale(1)", opacity: 0.55 },
      { transform: "translate(-50%,-50%) scale(2.4)", opacity: 0 }
    ],
    { duration: 380, easing: "ease-out" }
  );
});

// NO button evasive
const actions = document.getElementById("actions");
const noBtn = document.getElementById("noBtn");

function placeNoButtonRandom(){
  const bounds = actions.getBoundingClientRect();
  const btn = noBtn.getBoundingClientRect();
  const pad = 10;

  const minX = pad;
  const maxX = bounds.width - btn.width - pad;
  const minY = pad;
  const maxY = bounds.height - btn.height - pad;

  const x = (maxX <= minX) ? (bounds.width - btn.width) / 2 : rand(minX, maxX);
  const y = (maxY <= minY) ? (bounds.height - btn.height) / 2 : rand(minY, maxY);

  noBtn.style.left = `${clamp(x, 0, bounds.width - btn.width)}px`;
  noBtn.style.top = `${clamp(y, 0, bounds.height - btn.height)}px`;
  noBtn.style.transform = "translateX(0)";
}

function pointerNearNoButton(e){
  const nb = noBtn.getBoundingClientRect();
  const cx = nb.left + nb.width / 2;
  const cy = nb.top + nb.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const dist = Math.hypot(dx, dy);

  const danger = clamp(Math.min(window.innerWidth, window.innerHeight) * 0.16, 90, 160);
  if (dist < danger) placeNoButtonRandom();
}

function initNoButton(){
  // Wait one frame so flex layout positions the buttons naturally (centered, side-by-side)
  requestAnimationFrame(() => {
    const bounds = actions.getBoundingClientRect();
    const nb = noBtn.getBoundingClientRect();

    // Convert current on-screen position to coordinates relative to .actions
    const left = nb.left - bounds.left;
    const top  = nb.top  - bounds.top;

    // Now enable evasive mode, but keep the same initial position
    noBtn.classList.add("evasive");
    noBtn.style.left = `${left}px`;
    noBtn.style.top  = `${top}px`;
    noBtn.style.transform = "translateX(0)";
  });
}


window.addEventListener("pointermove", (e) => {
  if (window.matchMedia("(pointer: fine)").matches) pointerNearNoButton(e);
});
noBtn.addEventListener("mouseenter", () => {
  if (window.matchMedia("(pointer: fine)").matches) placeNoButtonRandom();
});
noBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  placeNoButtonRandom();
});
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  placeNoButtonRandom();
});
window.addEventListener("resize", () => placeNoButtonRandom());
//window.addEventListener("load", () => placeNoButtonRandom());

// YES behavior + burst
const yesBtn = document.getElementById("yesBtn");
const success = document.getElementById("success");
const burstLayer = document.getElementById("burst");

function burstAt(x, y){
  const pieces = 36;
  const chars = ["✨","💖","💗","💘","💕","💞","💝","🌸","⭐"];

  for(let i=0;i<pieces;i++){
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = chars[Math.floor(Math.random()*chars.length)];

    const x0 = x + rand(-8, 8);
    const y0 = y + rand(-8, 8);

    const angle = (Math.PI * 2) * (i / pieces) + rand(-0.25, 0.25);
    const radius = rand(80, 220);
    const x1 = x + Math.cos(angle) * radius;
    const y1 = y + Math.sin(angle) * radius;

    p.style.left = x0 + "px";
    p.style.top = y0 + "px";
    p.style.setProperty("--x0", "0px");
    p.style.setProperty("--y0", "0px");
    p.style.setProperty("--x1", (x1 - x0) + "px");
    p.style.setProperty("--y1", (y1 - y0) + "px");
    p.style.setProperty("--rot", `${rand(-140, 140)}deg`);
    p.style.fontSize = rand(14, 24) + "px";

    burstLayer.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

function showSuccess(){
  yesBtn.disabled = true;
  noBtn.style.display = "none";
  yesBtn.style.display = "none";
  success.style.display = "flex";
  for(let i=0;i<14;i++) setTimeout(spawnHeart, i * 90);
}

yesBtn.addEventListener("click", () => {
  const rect = yesBtn.getBoundingClientRect();
  burstAt(rect.left + rect.width/2, rect.top + rect.height/2);
  setTimeout(showSuccess, 420);
});
