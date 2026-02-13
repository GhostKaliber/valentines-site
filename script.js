// script.js
(() => {
  const actions = document.getElementById("actions");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");

  const questionSection = document.getElementById("questionSection");
  const successSection = document.getElementById("successSection");

  const particles = document.getElementById("particles");
  const heartsBg = document.getElementById("heartsBg");

  // --------- Background hearts (subtle, non-interactive) ----------
  function spawnBackgroundHearts() {
    const count = 18;

    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.className = "heart";

      const left = Math.random() * 100; // %
      const size = 10 + Math.random() * 12; // px
      const duration = 12 + Math.random() * 14; // s
      const delay = Math.random() * 10; // s
      const opacity = 0.16 + Math.random() * 0.22;

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
  // We compute a stable "start" position so both buttons begin perfectly aligned.
  function placeButtonsInitially() {
    const pad = 10;
    const a = actions.getBoundingClientRect();
    const y = Math.round((a.height - yesBtn.offsetHeight) / 2);

    const totalWidth = yesBtn.offsetWidth + 16 + noBtn.offsetWidth;
    const startX = Math.round((a.width - totalWidth) / 2);

    // YES stays fixed forever.
    yesBtn.style.left = `${Math.max(pad, startX)}px`;
    yesBtn.style.top = `${y}px`;

    // NO starts aligned next to YES.
    const noStartX = Math.max(pad, startX + yesBtn.offsetWidth + 16);
    noBtn.style.left = `${noStartX}px`;
    noBtn.style.top = `${y}px`;
  }

  // --------- Evasive NO logic ----------
  // IMPORTANT: Only move when cursor directly hovers NO button (not proximity).
  // It moves to a random location inside the .actions container and avoids overlapping YES.
  function getSafeRandomPosition() {
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

    // Try a handful of random spots; pick the first that doesn't overlap YES.
    for (let attempt = 0; attempt < 24; attempt++) {
      const x = pad + Math.random() * Math.max(1, (maxX - pad));
      const y = pad + Math.random() * Math.max(1, (maxY - pad));

      const overlapsYes =
        x < yesLocal.x + yesLocal.w + 12 &&
        x + noW + 12 > yesLocal.x &&
        y < yesLocal.y + yesLocal.h + 12 &&
        y + noH + 12 > yesLocal.y;

      if (!overlapsYes) {
        return { x: Math.round(x), y: Math.round(y) };
      }
    }

    // Fallback: top-left safe area away from YES.
    return { x: pad, y: pad };
  }

  function moveNoButton() {
    const { x, y } = getSafeRandomPosition();
    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
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

      // Used by CSS animation to fly outward.
      p.style.setProperty("--dx", `${dx}px`);
      p.style.setProperty("--dy", `${dy}px`);

      // Slight staggering for a cute pop.
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
  // NO moves ONLY when hovered directly.
  noBtn.addEventListener("mouseenter", () => {
    moveNoButton();
  });

  // Prevent accidental click on NO (optional gentle safety)
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    moveNoButton();
  });

  yesBtn.addEventListener("click", () => {
    burstHearts(yesBtn);
    showSuccess();
  });

  // Keep everything stable on load and resize.
  function init() {
    spawnBackgroundHearts();
    placeButtonsInitially();
  }

  window.addEventListener("load", init);

  window.addEventListener("resize", () => {
    // Re-center the buttons without shifting layout
    placeButtonsInitially();
  });
})();
