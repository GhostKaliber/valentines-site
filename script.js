(() => {
  const actions = document.getElementById("actions");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");

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
