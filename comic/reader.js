import { formatMessagePayload, renderEncodingMetaHtml } from "/js/encoding.js";
import { carouselForReader } from "/js/reader-carousel.js";
import {
  adjacentReleases,
  hasCrosspostLinks,
  renderCrosspostLinks,
} from "/js/transmissions.js";
import { hrefForRelease, idForSlotFromReleases } from "/js/transmission-slots.js";

const REGISTRY_URL = "/comic/registry.json";
const FRAME_MODE_KEY = "ally-reader-frame-mode";

const HASH_VERIFY_BY_GSCRIPT = {
  "comic/slides/stories/03-time-hallucination.gscript": {
    lead: "Check the verification hash yourself:",
    command:
      "printf '%s' '2027-09-27 9:00:00 PM 87C-6DD-49E-EF8' | openssl dgst -sha256 | cut -d' ' -f2 | cut -c1-12",
  },
};

const COPY_ICON_SVG = `<svg class="reader-verify__copy-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

function renderHashVerifyBlock(release) {
  const spec = HASH_VERIFY_BY_GSCRIPT[release?.gscript || ""];
  if (!spec) return "";
  return `<aside class="reader-verify" data-reader-verify aria-label="Hash verification">
    <p class="reader-verify__lead">${escapeHtml(spec.lead)}</p>
    <div class="reader-verify__cmd-wrap">
      <pre class="reader-verify__cmd"><code>${escapeHtml(spec.command)}</code></pre>
      <button type="button" class="reader-verify__copy" data-verify-copy aria-label="Copy command" title="Copy command">
        ${COPY_ICON_SVG}
        <span class="reader-verify__copy-label" data-verify-copy-label hidden>Copied</span>
      </button>
    </div>
  </aside>`;
}

/**
 * @param {HTMLElement} root
 */
function initHashVerifyCopy(root) {
  const block = root.querySelector("[data-reader-verify]");
  const btn = block?.querySelector("[data-verify-copy]");
  const code = block?.querySelector(".reader-verify__cmd code");
  const label = block?.querySelector("[data-verify-copy-label]");
  if (!btn || !code) return;

  let resetTimer = 0;

  async function copyCommand() {
    const text = code.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    btn.classList.add("is-copied");
    btn.setAttribute("aria-label", "Copied");
    if (label) label.hidden = false;
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      btn.classList.remove("is-copied");
      btn.setAttribute("aria-label", "Copy command");
      if (label) label.hidden = true;
    }, 2000);
  }

  btn.addEventListener("click", () => {
    void copyCommand();
  });
}

/**
 * @returns {string | null}
 */
/**
 * @returns {{ type: "id", id: string } | { type: "slot", slot: number } | null}
 */
export function resolveComicRoute() {
  const params = new URLSearchParams(location.search);
  if (params.get("id")) {
    return { type: "id", id: params.get("id").trim().toLowerCase() };
  }

  let path = location.pathname.replace(/\/$/, "");
  if (path.startsWith("/")) path = path.slice(1);
  if (/^\d+$/.test(path)) return { type: "slot", slot: parseInt(path, 10) };
  if (/^[a-f0-9]{16}\d+$/i.test(path)) return { type: "id", id: path.toLowerCase() };
  const leaf = path.split("/").pop() || "";
  if (/^[a-f0-9]{16}\d+$/i.test(leaf)) return { type: "id", id: leaf.toLowerCase() };
  return null;
}

/** @deprecated Use resolveComicRoute + registry lookup */
export function resolveComicId() {
  const route = resolveComicRoute();
  if (!route || route.type !== "id") return null;
  return route.id;
}

export function parseComicId(id) {
  const m = id.match(/^([a-f0-9]{16})(\d+)$/);
  if (!m) return null;
  return { digest: m[1], version: Number(m[2], 10) };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

/**
 * Prev = lower slot (/1, /2, …) · Next = higher slot.
 * @param {{ prev: object | null, next: object | null }} adj
 */
function renderTransmissionNav(adj) {
  if (!adj.prev && !adj.next) return "";

  const prevBtn = adj.prev
    ? `<a class="reader-tx-nav__btn" href="${escapeHtml(hrefForRelease(adj.prev))}" rel="prev" aria-label="Earlier story">← Earlier</a>`
    : `<span class="reader-tx-nav__btn is-disabled" aria-disabled="true">← Earlier</span>`;
  const nextBtn = adj.next
    ? `<a class="reader-tx-nav__btn" href="${escapeHtml(hrefForRelease(adj.next))}" rel="next" aria-label="Later story">Later →</a>`
    : `<span class="reader-tx-nav__btn is-disabled" aria-disabled="true">Later →</span>`;

  const hint = [];
  if (adj.prev) hint.push(escapeHtml(adj.prev.title || "Earlier story"));
  if (adj.next) hint.push(escapeHtml(adj.next.title || "Later story"));
  const sub =
    hint.length === 2
      ? `<span class="reader-tx-nav__hint">${hint[0]} · ${hint[1]}</span>`
      : hint.length === 1
        ? `<span class="reader-tx-nav__hint">${hint[0]}</span>`
        : "";

  return `<nav class="reader-tx-nav" aria-label="Other stories">
    ${prevBtn}
    ${sub}
    ${nextBtn}
  </nav>`;
}

/**
 * @param {string[]} carousel
 */
function renderFramesSection(carousel) {
  const scrollImgs = carousel
    .map((src) => `<img src="${escapeHtml(src)}" alt="" loading="lazy" />`)
    .join("");
  const first = escapeHtml(carousel[0]);
  const n = carousel.length;
  return `<section class="reader-frames" data-reader-frames>
    <div class="reader-frames__mode" role="tablist" aria-label="Frame browsing">
      <button type="button" class="reader-frames__tab" role="tab" data-frame-mode="scroll" aria-selected="true">Scroll</button>
      <button type="button" class="reader-frames__tab" role="tab" data-frame-mode="step">Step</button>
    </div>
    <div class="reader-frames__panel" data-panel="scroll">
      <div class="carousel">${scrollImgs}</div>
    </div>
    <div class="reader-frames__panel" data-panel="step" hidden>
      <div class="reader-step">
        <div class="reader-step__toolbar">
          <button type="button" class="reader-step__btn" data-slide-nav="prev" aria-label="Previous frame">← Prev</button>
          <span class="reader-step__counter" data-slide-counter aria-live="polite">1 / ${n}</span>
          <button type="button" class="reader-step__btn" data-slide-nav="next" aria-label="Next frame">Next →</button>
        </div>
        <div class="reader-step__frame">
          <img class="reader-step__img" data-slide-img src="${first}" alt="" decoding="async" />
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * @param {HTMLElement} app
 * @param {string[]} carousel
 * @param {{ prev: object | null, next: object | null }} adj
 */
function initFramesSection(app, carousel, adj) {
  const root = app.querySelector("[data-reader-frames]");
  if (!root || !carousel.length) return;

  const tabs = root.querySelectorAll("[data-frame-mode]");
  const panels = {
    scroll: root.querySelector('[data-panel="scroll"]'),
    step: root.querySelector('[data-panel="step"]'),
  };
  let mode = "scroll";
  try {
    const saved = localStorage.getItem(FRAME_MODE_KEY);
    if (saved === "scroll" || saved === "step") mode = saved;
  } catch {
    /* ignore */
  }

  let slideIdx = 0;
  const img = root.querySelector("[data-slide-img]");
  const counter = root.querySelector("[data-slide-counter]");
  const btnPrev = root.querySelector('[data-slide-nav="prev"]');
  const btnNext = root.querySelector('[data-slide-nav="next"]');

  function goSlide(nextIdx) {
    slideIdx = Math.max(0, Math.min(carousel.length - 1, nextIdx));
    if (img) img.src = carousel[slideIdx];
    if (counter) counter.textContent = `${slideIdx + 1} / ${carousel.length}`;
    if (btnPrev) btnPrev.disabled = slideIdx === 0;
    if (btnNext) btnNext.disabled = slideIdx === carousel.length - 1;
  }

  function setMode(next) {
    mode = next;
    root.setAttribute("data-active-mode", mode);
    try {
      localStorage.setItem(FRAME_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
    for (const tab of tabs) {
      const on = tab.getAttribute("data-frame-mode") === mode;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.classList.toggle("is-active", on);
    }
    panels.scroll.hidden = mode !== "scroll";
    panels.step.hidden = mode !== "step";
    if (mode === "step") goSlide(slideIdx);
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const m = tab.getAttribute("data-frame-mode");
      if (m === "scroll" || m === "step") setMode(m);
    });
  }

  btnPrev?.addEventListener("click", () => goSlide(slideIdx - 1));
  btnNext?.addEventListener("click", () => goSlide(slideIdx + 1));
  goSlide(0);
  setMode(mode);

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    const activeMode = root.getAttribute("data-active-mode") || mode;

    if (activeMode === "step") {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goSlide(slideIdx - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goSlide(slideIdx + 1);
      } else if (e.key === "[" && adj.prev) {
        location.assign(hrefForRelease(adj.prev));
      } else if (e.key === "]" && adj.next) {
        location.assign(hrefForRelease(adj.next));
      }
      return;
    }

    if (e.key === "ArrowLeft" && adj.prev) {
      location.assign(hrefForRelease(adj.prev));
    } else if (e.key === "ArrowRight" && adj.next) {
      location.assign(hrefForRelease(adj.next));
    }
  });

  setMode(mode);
}

/**
 * @param {HTMLElement} app
 */
export async function mountComicReader(app) {
  const route = resolveComicRoute();

  if (!route) {
    app.innerHTML = `<p class="err">Missing transmission. Open a slot URL (example: <code>/1/</code>).</p>`;
    return;
  }

  let registry;
  try {
    const res = await fetch(REGISTRY_URL);
    registry = await res.json();
  } catch {
    app.innerHTML = `<p class="err">Could not load registry.</p>`;
    return;
  }

  let id;
  if (route.type === "slot") {
    id = idForSlotFromReleases(registry.releases, route.slot);
    if (!id) {
      app.innerHTML = `<p class="err">No transmission in slot <code>${route.slot}</code>.</p>`;
      return;
    }
  } else {
    id = route.id;
  }

  const parts = parseComicId(id);
  if (!parts) {
    app.innerHTML = `<p class="err">Invalid ID format: <code>${id}</code></p>`;
    return;
  }

  const release = (registry.releases || []).find((r) => r.id === id);
  if (!release) {
    app.innerHTML = `
      <h1>TRANSMISSION NOT FOUND</h1>
      <p class="meta">No official release for <code>${id}</code></p>
      <p class="meta">Digest <code>${parts.digest}</code> · version <code>${parts.version}</code></p>
      <p class="back"><a href="/transmissions/">← Transmissions</a> · <a href="/">Beacon</a></p>`;
    document.title = `Unknown · ${id}`;
    return;
  }

  document.title = `${release.title || "Comic"} · ${id}`;

  const published = release.published_at
    ? new Date(release.published_at).toISOString().slice(0, 10)
    : "—";

  const carousel = carouselForReader(release.carousel);
  let carouselHtml = "";
  if (carousel.length) {
    carouselHtml = renderFramesSection(carousel);
  } else if (release.note) {
    carouselHtml = `<pre class="transmission">${escapeHtml(release.note)}</pre>`;
  } else {
    carouselHtml = `<pre class="transmission">> PUBLICATION REGISTERED
> ID: ${id}</pre>`;
  }

  const encodingBlock = renderEncodingMetaHtml(release);
  const frames = carousel.length ? String(carousel.length) : "—";
  const payload = formatMessagePayload(release);
  const metricsLine =
    frames !== "—" || payload !== "—"
      ? `<p class="meta reader-metrics">Frames <code>${escapeHtml(frames)}</code> · payload <code>${escapeHtml(payload)}</code></p>`
      : "";

  const crosspostBlock = hasCrosspostLinks(release.crosspost)
    ? `<p class="meta reader-crosspost">Cross-post ${renderCrosspostLinks(release.crosspost)}</p>`
    : "";

  const hashVerifyBlock = renderHashVerifyBlock(release);

  const adj = adjacentReleases(registry.releases, id);
  const transmissionNav = renderTransmissionNav(adj);

  app.innerHTML = `
    <h1>${escapeHtml(release.title || "Untitled")}</h1>
    ${transmissionNav}
    <p class="meta">
      ID <code>${id}</code><br />
      Version <code>${parts.version}</code> · listed <code>${published}</code>
    </p>
    ${encodingBlock}
    ${metricsLine}
    ${crosspostBlock}
    ${carouselHtml}
    ${hashVerifyBlock}
    <p class="back"><a href="/transmissions/">← Transmissions</a> · <a href="/">Beacon</a></p>`;

  if (carousel.length) initFramesSection(app, carousel, adj);
  initHashVerifyCopy(app);
}

const app = document.getElementById("app");
if (app) mountComicReader(app);
