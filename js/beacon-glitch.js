/** NTQTP beacon — grain, character corruption, random horizontal tears. */

const GLITCH_CHARS = "█▓▒░¿@#%&*~\\/|<>⌐¬½¼";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return min + ((Math.random() * (max - min + 1)) | 0);
}

/**
 * @param {HTMLElement} el
 * @param {() => boolean} isActive
 */
function initGrain(el, isActive) {
  const canvas = document.createElement("canvas");
  canvas.className = "transmission-grain-canvas";
  el.appendChild(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const resize = () => {
    const r = el.getBoundingClientRect();
    const w = Math.max(1, (r.width * devicePixelRatio) | 0);
    const h = Math.max(1, (r.height * devicePixelRatio) | 0);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  resize();
  new ResizeObserver(resize).observe(el);

  const draw = () => {
    if (!isActive()) return;
    const w = canvas.width;
    const h = canvas.height;
    const id = ctx.createImageData(w, h);
    const d = id.data;
    const density = 0.1 + Math.random() * 0.14;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.random() > density) {
        d[i + 3] = 0;
        continue;
      }
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = (rand(10, 32) * Math.min(devicePixelRatio, 2)) | 0;
    }
    ctx.putImageData(id, 0, 0);
    window.setTimeout(() => requestAnimationFrame(draw), rand(90, 200));
  };
  requestAnimationFrame(draw);
}

/**
 * @param {HTMLElement} root
 * @param {{ reducedMotion?: boolean }} opts
 * @returns {{ stabilize: () => void, resume: () => void, isStabilized: () => boolean } | null}
 */
export function initBeaconGlitch(root, opts = {}) {
  const reduced = opts.reducedMotion ?? false;
  const tearLayer = root.querySelector(".transmission-tear");
  const main = root.querySelector(".transmission-main");
  const noiseEl = root.querySelector(".transmission-noise");
  if (!main || !tearLayer) return null;

  let stopped = reduced;
  /** @type {number[]} */
  const timers = [];

  const isActive = () => !stopped && !root.classList.contains("is-stabilized");

  const schedule = (fn, ms) => {
    if (!isActive()) return;
    const id = window.setTimeout(() => {
      if (isActive()) fn();
    }, ms);
    timers.push(id);
  };

  const clearTimers = () => {
    for (const id of timers) window.clearTimeout(id);
    timers.length = 0;
  };

  if (noiseEl && !reduced) initGrain(noiseEl, isActive);

  /** @type {WeakMap<Text, string>} */
  const canonicalByNode = new WeakMap();

  const collectTextNodes = () => {
    const nodes = [];
    const tw = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.parentElement?.closest(".no-glitch")) continue;
      if (n.nodeValue && n.nodeValue.length > 0) nodes.push(n);
    }
    return nodes;
  };

  const captureCanonical = () => {
    for (const node of collectTextNodes()) {
      canonicalByNode.set(node, node.nodeValue ?? "");
    }
  };

  captureCanonical();

  const syncTear = () => {
    tearLayer.innerHTML = main.innerHTML;
  };
  syncTear();

  function restoreAll() {
    for (const node of collectTextNodes()) {
      const c = canonicalByNode.get(node);
      if (c !== undefined) node.nodeValue = c;
    }
    syncTear();
  }

  function corruptOnce(count = 1) {
    const nodes = collectTextNodes();
    if (!nodes.length) return;

    /** @type {Set<string>} */
    const touched = new Set();

    for (let k = 0; k < count; k++) {
      const node = nodes[(Math.random() * nodes.length) | 0];
      const canonical = canonicalByNode.get(node);
      if (canonical === undefined || canonical.length < 1) continue;

      const len = canonical.length;
      const index = (Math.random() * len) | 0;
      const key = `${nodes.indexOf(node)}:${index}`;
      if (touched.has(key)) continue;
      touched.add(key);

      const orig = canonical[index];
      if (orig === "\n" && Math.random() < 0.7) continue;

      const val = node.nodeValue ?? "";
      if (index >= val.length) continue;

      const g = GLITCH_CHARS[(Math.random() * GLITCH_CHARS.length) | 0];
      node.nodeValue = val.slice(0, index) + g + val.slice(index + 1);
    }
    syncTear();
  }

  function applyTearSlice(yPct, hPct, shift, chroma, opacity) {
    root.style.setProperty("--tear-top", `${yPct}%`);
    root.style.setProperty("--tear-height", `${hPct}%`);
    root.style.setProperty("--tear-x", `${shift}px`);
    root.style.setProperty("--tear-chroma", `${chroma}px`);
    root.style.setProperty("--tear-opacity", String(opacity));
    root.style.setProperty("--tear-skew", `${rand(-2.5, 2.5)}deg`);
    root.classList.add("is-tearing");
  }

  function clearTear() {
    root.classList.remove("is-tearing");
    root.style.setProperty("--tear-x", "0px");
  }

  function fireTear() {
    const slices = Math.random() < 0.35 ? randInt(2, 4) : 1;
    let endAt = 0;

    for (let s = 0; s < slices; s++) {
      const delay = s === 0 ? 0 : rand(15, 120);
      const y = rand(2, 92);
      const h = rand(0.8, 11);
      const shift = (Math.random() - 0.5) * rand(12, 42);
      const chroma = (Math.random() - 0.5) * rand(4, 14);
      const opacity = rand(0.65, 1);
      const hold = rand(35, 220);
      endAt = Math.max(endAt, delay + hold);

      schedule(() => {
        applyTearSlice(y, h, shift, chroma, opacity);
        if (Math.random() < 0.85) corruptOnce(randInt(1, 6));
        if (Math.random() < 0.25 && !root.hasAttribute("data-wordmark-glitch")) {
          main.style.transform = `translateX(${rand(-3, 3)}px)`;
          schedule(() => {
            main.style.transform = "";
          }, hold * 0.6);
        }
        schedule(clearTear, hold);
      }, delay);
    }

    schedule(() => {
      restoreAll();
    }, endAt + 20);
  }

  function tickGlitch() {
    const roll = Math.random();
    if (roll < 0.45) corruptOnce(randInt(1, 3));
    if (roll > 0.78) corruptOnce(randInt(3, 8));
    if (roll > 0.92 && Math.random() < 0.4) fireTear();

    const hold = rand(25, 280);
    schedule(() => {
      restoreAll();
      scheduleGlitch();
    }, hold);
  }

  function scheduleGlitch() {
    const wait = Math.random() < 0.12 ? rand(40, 120) : rand(80, 900);
    schedule(tickGlitch, wait);
  }

  function scheduleTear() {
    const wait =
      Math.random() < 0.08
        ? rand(120, 400)
        : Math.random() < 0.2
          ? rand(400, 1200)
          : rand(600, 4500);
    schedule(() => {
      if (Math.random() < 0.15) {
        schedule(fireTear, rand(50, 400));
      }
      fireTear();
      scheduleTear();
    }, wait);
  }

  function stabilize() {
    stopped = true;
    clearTimers();
    restoreAll();
    clearTear();
    main.style.transform = "";
    root.classList.add("is-stabilized");
  }

  function resume() {
    if (reduced) return;
    stopped = false;
    root.classList.remove("is-stabilized");
    scheduleGlitch();
    scheduleTear();
    schedule(fireTear, rand(200, 800));
  }

  if (!reduced) {
    scheduleGlitch();
    scheduleTear();
    schedule(fireTear, rand(200, 800));
  }

  return {
    stabilize,
    resume,
    isStabilized: () => stopped || root.classList.contains("is-stabilized"),
  };
}
