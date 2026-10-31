import { initBeaconGlitch } from "./beacon-glitch.js";

export const WORDMARK_STABILIZE_KEY = "ally-wordmark-stabilized";

/** @type {{ stabilize: () => void, resume: () => void, isStabilized: () => boolean }[]} */
const glitchTargets = [];

let stabilizedPreference = false;

/**
 * @param {{ stabilize: () => void, resume: () => void, isStabilized: () => boolean } | null} ctrl
 */
export function registerGlitchTarget(ctrl) {
  if (!ctrl) return;
  glitchTargets.push(ctrl);
  if (stabilizedPreference) ctrl.stabilize();
}

function wordmarkLine(text) {
  return `<div class="wordmark__line">
    <span class="wordmark__layer wordmark__layer--bottom" aria-hidden="true">${text}</span>
    <span class="wordmark__layer wordmark__layer--top" aria-hidden="true">${text}</span>
  </div>`;
}

export function renderWordmarkGlitchHtml() {
  const inner = wordmarkLine("Ally Sky Project");
  return `<span class="wordmark-hero-wrap transmission-wrap" data-wordmark-glitch>
    <span class="transmission-noise" aria-hidden="true"></span>
    <span class="transmission-glitch-zone wordmark-hero-zone">
      <span class="transmission transmission-main wordmark wordmark--horizontal wordmark--hero" aria-hidden="true">
        ${inner}
      </span>
      <span class="transmission transmission-tear wordmark wordmark--horizontal wordmark--hero" aria-hidden="true"></span>
    </span>
  </span>`;
}

/** Site nav: CSS slice wordmark only (no tear/grain — avoids layout flash on load). */
export function renderNavWordmarkHtml() {
  const inner = wordmarkLine("Ally Sky Project");
  return `<span class="wordmark-hero-wrap wordmark-nav-static" aria-hidden="true">
    <span class="transmission transmission-main wordmark wordmark--horizontal wordmark--hero">
      ${inner}
    </span>
  </span>`;
}

/**
 * @param {HTMLElement | null} host
 * @param {{ reducedMotion?: boolean }} [opts]
 * @returns {{ stabilize: () => void, resume: () => void, isStabilized: () => boolean } | null}
 */
export function mountWordmarkGlitch(host, opts = {}) {
  if (!host) return null;
  if (!host.querySelector("[data-wordmark-glitch]")) {
    host.innerHTML = renderWordmarkGlitchHtml();
  }
  const wrap = host.querySelector("[data-wordmark-glitch]");
  if (!wrap) return null;
  const ctrl = initBeaconGlitch(wrap, { reducedMotion: opts.reducedMotion });
  registerGlitchTarget(ctrl);
  return ctrl;
}

function allStabilized() {
  return glitchTargets.length > 0 && glitchTargets.every((c) => c.isStabilized());
}

/**
 * @param {HTMLElement | null} btn
 */
export function wireStabilizeButton(btn) {
  if (!btn) return;

  const apply = (on) => {
    stabilizedPreference = on;
    for (const ctrl of glitchTargets) {
      if (on) ctrl.stabilize();
      else ctrl.resume();
    }
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Resume wordmark glitch effects" : "Stabilize wordmark glitch effects");
    try {
      localStorage.setItem(WORDMARK_STABILIZE_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  btn.addEventListener("click", () => apply(!allStabilized()));

  let saved = false;
  try {
    saved = localStorage.getItem(WORDMARK_STABILIZE_KEY) === "1";
  } catch {
    /* ignore */
  }
  if (saved) apply(true);
}
