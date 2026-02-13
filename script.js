(() => {
  const actions = document.getElementById("actions");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const noArena = document.getElementById("noArena");


  const questionSection = document.getElementById("questionSection");
  const successSection = document.getElementById("successSection");

  const particles = document.getElementById("particles");
  const heartsBg = document.getElementById("heartsBg");

  // --------- Background hearts (keep subtle) ----------
  function spawnBackgroundHearts() {
    const count = 10; // fewer = closer to screenshot vibe

    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.className = "heart";

      const left = Math.random() * 100; // %
      const size = 10 + Math.random() * 10; // px
      const duration = 14 + Math.random() * 16; // s
      const delay = Math.random() * 10; // s
      const opacity = 0.10 + Math.random() * 0.14; // more subtle

      h.style.left = `${left}%`;
      h.style.bottom = `${-20 - Math.random() * 25}vh`;
      h.style.width = `${size}px`;
      h.style.height = `${size}px`;
      h.style.opacity = opacity.toFixed(2);
      h.style.animationDuration = `${duration}s`;
      h.style.animationDelay = `${delay}s`;

      heartsBg.appendChild(h);
    }
  }

  // ---------- helpers ----------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function getPointerLocal(e) {
    if (!e || typeof e.clientX !== "number") return null;
    const a = actions.getBoundingClientRect();
    return { x: e.clientX - a.left, y: e.clientY - a.top };
  }

  function getArenaLocal() {
    const a = actions.getBoundingClientRect();
    const r = noArena.getBoundingClientRect();
    return {
      x: r.left - a.left,
      y: r.top - a.top,
      w: r.width,
      h: r.height,
    };
  }

  function getBtnLocalInActions(btn) {
    const a = actions.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height };
  }

  function placeButtonsInitially() {
    const arena = getArenaLocal();
    const pad = 10;

    // YES stays centered in the left region (everything left of the arena)
    const leftRegionW = Math.max(0, arena.x - pad);
    const yesX = clamp((leftRegionW - yesBtn.offsetWidth) / 2, pad, leftRegionW - yesBtn.offsetWidth - pad);
    const midY = Math.round((actions.clientHeight - yesBtn.offsetHeight) / 2);

    yesBtn.style.left = `${Math.round(yesX)}px`;
    yesBtn.style.top = `${midY}px`;

    // NO starts centered in the arena
    const noX = arena.x + (arena.w - noBtn.offsetWidth) / 2;
    const noY = arena.y + (arena.h - noBtn.offsetHeight) / 2;

    noBtn.style.left = `${Math.round(noX)}px`;
    noBtn.style.top = `${Math.round(noY)}px`;
  }

  // ---------- playful "running away" behavior ----------
  const RUN_TRIGGER_DIST = 140;   // how close cursor must be before it runs
  const MIN_CURSOR_DIST = 110;    // after moving, must be at least this far
  const ARENA_PAD = 10;           // keep away from arena edges
  const COOLDOWN_MS = 90;

  let lastMoveAt = 0;

  function inArena(pointer) {
    const arena = getArenaLocal();
    return (
      pointer.x >= arena.x &&
      pointer.x <= arena.x + arena.w &&
      pointer.y >= arena.y &&
      pointer.y <= arena.y + arena.h
    );
  }

  function moveNoTo(x, y) {
    noBtn.style.left = `${Math.round(x)}px`;
    noBtn.style.top = `${Math.round(y)}px`;
  }

  function computeFleeTarget(pointer) {
    const arena = getArenaLocal();
    const no = getBtnLocalInActions(noBtn);

    // work in arena-local coordinates
    const p = { x: pointer.x - arena.x, y: pointer.y - arena.y };
    const noCenter = { x: (no.x - arena.x) + no.w / 2, y: (no.y - arena.y) + no.h / 2 };

    let vx = noCenter.x - p.x;
    let vy = noCenter.y - p.y;

    let len = Math.hypot(vx, vy);
    if (len < 0.001) {
      // if cursor is exactly at center, pick random direction
      const ang = Math.random() * Math.PI * 2;
      vx = Math.cos(ang);
      vy = Math.sin(ang);
      len = 1;
    }

    // unit vector away from cursor
    const ux = vx / len;
    const uy = vy / len;

    // perpendicular for playful "zig-zag"
    const px = -uy;
    const py = ux;

    const noW = noBtn.offsetWidth;
    const noH = noBtn.offsetHeight;

    // bounds for TOP-LEFT of the button inside the arena
    const minX = ARENA_PAD;
    const maxX = arena.w - noW - ARENA_PAD;
    const minY = ARENA_PAD;
    const maxY = arena.h - noH - ARENA_PAD;

    // Try a few “run” attempts: push away + add jitter so it doesn't just go up/down
    for (let i = 0; i < 10; i++) {
      const step = 150 + Math.random() * 170 + i * 18;    // gets more aggressive if needed
      const jitter = (Math.random() * 2 - 1) * (70 + i * 6);

      const targetCenterX = noCenter.x + ux * step + px * jitter;
      const targetCenterY = noCenter.y + uy * step + py * jitter;

      let targetX = targetCenterX - noW / 2;
      let targetY = targetCenterY - noH / 2;

      targetX = clamp(targetX, minX, maxX);
      targetY = clamp(targetY, minY, maxY);

      // must end far enough from cursor
      const endCenterX = targetX + noW / 2;
      const endCenterY = targetY + noH / 2;
      const endDist = Math.hypot(endCenterX - p.x, endCenterY - p.y);

      if (endDist >= MIN_CURSOR_DIST) {
        return { x: arena.x + targetX, y: arena.y + targetY };
      }
    }

    // fallback: random within arena (still different each time)
    const rx = arena.x + minX + Math.random() * Math.max(1, maxX - minX);
    const ry = arena.y + minY + Math.random() * Math.max(1, maxY - minY);
    return { x: rx, y: ry };
  }

  function evade(e) {
    const now = performance.now();
    if (now - lastMoveAt < COOLDOWN_MS) return;
    lastMoveAt = now;

    const pointer = getPointerLocal(e);
    if (!pointer) return;

    const target = computeFleeTarget(pointer);
    moveNoTo(target.x, target.y);
  }

  // Make it feel like it's "running" — respond to cursor getting close inside arena
  actions.addEventListener("pointermove", (e) => {
    const pointer = getPointerLocal(e);
    if (!pointer) return;
    if (!inArena(pointer)) return;

    const no = getBtnLocalInActions(noBtn);
    const noCenter = { x: no.x + no.w / 2, y: no.y + no.h / 2 };
    const d = Math.hypot(pointer.x - noCenter.x, pointer.y - noCenter.y);

    if (d < RUN_TRIGGER_DIST) evade(e);
  });

  // Also dodge if they actually touch/enter it (desktop)
  noBtn.addEventListener("pointerenter", evade);

  // Mobile: dodge before click registers
  noBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    evade(e);
  });

  // YES behavior (keep whatever you had — simple example here)
  function burstHearts(anchorEl) {
    const a = actions.getBoundingClientRect();
    const b = anchorEl.getBoundingClientRect();
    const cx = (b.left - a.left) + b.width / 2;
    const cy = (b.top - a.top) + b.height / 2;

    const emojis = ["💖", "💘", "✨", "💗", "💞", "🌸"];
    const count = 24;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 90;

      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.setProperty("--dx", `${dx}px`);
      p.style.setProperty("--dy", `${dy}px`);
      p.style.animationDelay = `${Math.random() * 120}ms`;

      particles.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }
  }

  function showSuccess() {
    questionSection.classList.remove("is-active");
    successSection.classList.add("is-active");
    successSection.classList.add("pop-in");
  }

  yesBtn.addEventListener("click", () => {
    burstHearts(yesBtn);
    showSuccess();
  });

  // init
  window.addEventListener("load", placeButtonsInitially);
  window.addEventListener("resize", placeButtonsInitially);

  // keep your background hearts if you already have them; leaving minimal here
})();

/*
  // --------- Button positioning: absolute + centered, no shifting ----------
  function placeButtonsInitially() {
    const pad = 10;
    const a = actions.getBoundingClientRect();
    const y = Math.round((a.height - yesBtn.offsetHeight) / 2);

    const gap = 16;
    const totalWidth = yesBtn.offsetWidth + gap + noBtn.offsetWidth;
    const startX = Math.round((a.width - totalWidth) / 2);

    yesBtn.style.left = `${Math.max(pad, startX)}px`;
    yesBtn.style.top = `${y}px`;

    const noStartX = Math.max(pad, startX + yesBtn.offsetWidth + gap);
    noBtn.style.left = `${noStartX}px`;
    noBtn.style.top = `${y}px`;
  }

  // --------- Evasive NO logic (cursor-safe distance) ----------
  const SAFE_CURSOR_PAD = 60; // <-- increase if you want it to jump even farther || orig -- 44
  const SAFE_YES_PAD = 14;
  let lastMoveAt = 0;

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh, pad = 0) {
    return (
      ax < bx + bw + pad &&
      ax + aw + pad > bx &&
      ay < by + bh + pad &&
      ay + ah + pad > by
    );
  }

  function pointerTooClose(pointer, x, y, w, h) {
    if (!pointer) return false;
    // "No-touch zone" around the button so it won't land under/against the cursor
    return (
      pointer.x > x - SAFE_CURSOR_PAD &&
      pointer.x < x + w + SAFE_CURSOR_PAD &&
      pointer.y > y - SAFE_CURSOR_PAD &&
      pointer.y < y + h + SAFE_CURSOR_PAD
    );
  }

  function getPointerLocal(e) {
    if (!e || typeof e.clientX !== "number") return null;
    const a = actions.getBoundingClientRect();
    return { x: e.clientX - a.left, y: e.clientY - a.top };
  }

  function getSafeRandomPosition(pointer) {
    const a = actions.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();

    const pad = 10;
    const maxX = a.width - noBtn.offsetWidth - pad;
    const maxY = a.height - noBtn.offsetHeight - pad;

    const yesLocal = {
      x: yesRect.left - a.left,
      y: yesRect.top - a.top,
      w: yesRect.width,
      h: yesRect.height,
    };

    const noW = noBtn.offsetWidth;
    const noH = noBtn.offsetHeight;

    // Try random spots first
    for (let attempt = 0; attempt < 48; attempt++) {
      const x = pad + Math.random() * Math.max(1, maxX - pad);
      const y = pad + Math.random() * Math.max(1, maxY - pad);

      const overlapsYes = rectsOverlap(
        x, y, noW, noH,
        yesLocal.x, yesLocal.y, yesLocal.w, yesLocal.h,
        SAFE_YES_PAD
      );

      if (overlapsYes) continue;
      if (pointerTooClose(pointer, x, y, noW, noH)) continue;

      return { x: Math.round(x), y: Math.round(y) };
    }

    // Fallback: pick the farthest “corner-ish” spot from the pointer
    const candidates = [
      { x: pad, y: pad },
      { x: Math.max(pad, maxX), y: pad },
      { x: pad, y: Math.max(pad, maxY) },
      { x: Math.max(pad, maxX), y: Math.max(pad, maxY) },
      { x: Math.round((maxX + pad) / 2), y: pad },
      { x: Math.round((maxX + pad) / 2), y: Math.max(pad, maxY) },
    ];

    const p = pointer || { x: a.width / 2, y: a.height / 2 };

    let best = candidates[0];
    let bestScore = -Infinity;

    for (const c of candidates) {
      const overlapsYes = rectsOverlap(
        c.x, c.y, noW, noH,
        yesLocal.x, yesLocal.y, yesLocal.w, yesLocal.h,
        SAFE_YES_PAD
      );
      if (overlapsYes) continue;

      const cx = c.x + noW / 2;
      const cy = c.y + noH / 2;
      const score = (cx - p.x) ** 2 + (cy - p.y) ** 2;

      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    return { x: Math.round(best.x), y: Math.round(best.y) };
  }

  function moveNoButton(e) {
    const pointer = getPointerLocal(e);
    const { x, y } = getSafeRandomPosition(pointer);
    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
  }

  function handleEvasion(e) {
    const now = performance.now();
    if (now - lastMoveAt < 90) return; // tiny cooldown to prevent jitter loops
    lastMoveAt = now;
    moveNoButton(e);
  }

  // --------- Heart burst + sparkles ----------
  function burstHearts(anchorEl) {
    const a = actions.getBoundingClientRect();
    const b = anchorEl.getBoundingClientRect();

    const cx = (b.left - a.left) + b.width / 2;
    const cy = (b.top - a.top) + b.height / 2;

    const emojis = ["💖", "💘", "✨", "💗", "💞", "🌸"];
    const count = 24;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 90;

      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;

      p.style.setProperty("--dx", `${dx}px`);
      p.style.setProperty("--dy", `${dy}px`);
      p.style.animationDelay = `${Math.random() * 120}ms`;

      particles.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }
  }

  function showSuccess() {
    questionSection.classList.remove("is-active");
    successSection.classList.add("is-active");
    successSection.classList.add("pop-in");
  }

  // --------- Event wiring ----------
  // Desktop hover
  noBtn.addEventListener("pointerenter", handleEvasion);

  // Mobile / touch: dodge *before* the click can register
  noBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleEvasion(e);
  });

  yesBtn.addEventListener("click", () => {
    burstHearts(yesBtn);
    showSuccess();
  });

  function init() {
    spawnBackgroundHearts();
    placeButtonsInitially();
  }

  window.addEventListener("load", init);
  window.addEventListener("resize", placeButtonsInitially);
})();
*/