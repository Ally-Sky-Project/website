import { labelReconstruction } from "./encoding.js";
import { formatTransmissionDate, stackReleases } from "./transmissions.js";
import { hrefForRelease } from "./transmission-slots.js";

const REGISTRY_URL = "/comic/registry.json";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function stackReaderHref(release) {
  const human = release.reconstruction_variants?.human;
  if (human?.path) return human.path;
  if (human && release.slot) return `/${release.slot}/human/`;
  return hrefForRelease(release);
}

/**
 * Slot 4 only: AI label + link to human reconstruction (avoids nested anchors in card link).
 * @param {object} release
 */
function reconstructionFlairHtml(release) {
  const human = release.reconstruction_variants?.human;
  if (human) {
    return `<span class="transmission-stack__flair">RECONSTRUCTION: AI (Coming Soon) · HUMAN</span>`;
  }
  const label = labelReconstruction(release.reconstruction);
  if (label === "—") return "";
  return `<span class="transmission-stack__flair">${escapeHtml(`RECONSTRUCTION: ${label}`)}</span>`;
}

/**
 * @param {object} release
 */
function coverUrl(release) {
  const carousel = release.carousel;
  if (Array.isArray(carousel) && carousel[0]) return carousel[0];
  const humanCarousel = release.reconstruction_variants?.human?.carousel;
  if (Array.isArray(humanCarousel) && humanCarousel[0]) return humanCarousel[0];
  if (typeof release.cover === "string" && release.cover) return release.cover;
  return null;
}

function stackItemHtml(r, i) {
  const href = escapeHtml(stackReaderHref(r));
  const title = escapeHtml(r.title || "Untitled");
  const date = escapeHtml(formatTransmissionDate(r.published_at));
  const flair = reconstructionFlairHtml(r);
  const cover = coverUrl(r);
  const latest = i === 0 ? " transmission-stack__item--latest" : "";
  const badgeSlot =
    i === 0
      ? '<div class="transmission-stack__badge-slot"><span class="transmission-stack__badge" aria-label="Latest transmission">Latest</span></div>'
      : '<div class="transmission-stack__badge-slot" aria-hidden="true"></div>';
  const thumb = cover
    ? `<span class="transmission-stack__frame"><img class="transmission-stack__cover" src="${escapeHtml(cover)}" alt="" width="9" height="16" loading="lazy" decoding="async" /></span>`
    : `<span class="transmission-stack__frame transmission-stack__frame--empty" aria-hidden="true"></span>`;

  return `<li class="transmission-stack__item${latest}">
    ${badgeSlot}
    <a class="transmission-stack__link" href="${href}">
      ${thumb}
      <span class="transmission-stack__meta">
        ${flair}
        <span class="transmission-stack__date">${date}</span>
        <span class="transmission-stack__title">${title}</span>
      </span>
    </a>
  </li>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ limit?: number }} [opts]
 */
export async function mountTransmissionStack(root, opts = {}) {
  const limit = opts.limit ?? 5;
  if (!root) return;

  let registry;
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`Registry HTTP ${res.status}`);
    registry = await res.json();
  } catch {
    root.hidden = true;
    return;
  }

  const rows = stackReleases(registry.releases || []).slice(0, limit);
  if (!rows.length) {
    root.hidden = true;
    return;
  }

  const items = rows.map((r, i) => stackItemHtml(r, i)).join("");

  root.innerHTML = `
    <header class="transmission-stack__header">
      <h2 class="transmission-stack__label">Transmission stack</h2>
      <p class="transmission-stack__footer">
        <a class="transmission-stack__registry" href="/transmissions/">View registry →</a>
      </p>
    </header>
    <div class="transmission-stack__scroller">
      <button type="button" class="transmission-stack__scroll transmission-stack__scroll--prev" aria-label="Scroll transmissions left" hidden>←</button>
      <ol class="transmission-stack__list">${items}</ol>
      <button type="button" class="transmission-stack__scroll transmission-stack__scroll--next" aria-label="Scroll transmissions right" hidden>→</button>
    </div>`;
  root.hidden = false;
  initStackScroller(root);
}

/**
 * @param {HTMLElement} root
 */
function initStackScroller(root) {
  const list = root.querySelector(".transmission-stack__list");
  const btnPrev = root.querySelector(".transmission-stack__scroll--prev");
  const btnNext = root.querySelector(".transmission-stack__scroll--next");
  if (!list || !btnPrev || !btnNext) return;

  function scrollStep(dir) {
    const item = list.querySelector(".transmission-stack__item");
    const gap = parseFloat(getComputedStyle(list).columnGap || getComputedStyle(list).gap) || 12;
    const step = (item?.getBoundingClientRect().width || 120) + gap;
    list.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  function updateButtons() {
    const maxScroll = list.scrollWidth - list.clientWidth;
    const show = maxScroll > 4;
    btnPrev.hidden = !show;
    btnNext.hidden = !show;
    if (!show) return;
    btnPrev.disabled = list.scrollLeft <= 2;
    btnNext.disabled = list.scrollLeft >= maxScroll - 2;
  }

  btnPrev.addEventListener("click", () => scrollStep(-1));
  btnNext.addEventListener("click", () => scrollStep(1));
  list.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();
}
