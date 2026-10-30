import { formatTransmissionDate, stackReleases } from "./transmissions.js";
import { hrefForRelease } from "./transmission-slots.js";
import {
  hasReconstructionVariants,
  primaryVariantHref,
  reconstructionStackFlairHtml,
  stackCoverUrl,
} from "./reconstruction-variants.js";

const REGISTRY_URL = "/comic/registry.json";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function reconstructionFlairHtml(release) {
  return reconstructionStackFlairHtml(release);
}

function coverUrl(release) {
  return stackCoverUrl(release);
}

function primaryHrefForRelease(r) {
  return primaryVariantHref(r);
}

function hasInteractiveReconFlair(r) {
  return hasReconstructionVariants(r);
}

function stackMetaHtml(flair, date, title, opts = {}) {
  const { bodyHref = null } = opts;
  const dateTitle =
    bodyHref != null
      ? `<a class="transmission-stack__body-link" href="${bodyHref}">
        <span class="transmission-stack__date">${date}</span>
        <span class="transmission-stack__title">${title}</span>
      </a>`
      : `<span class="transmission-stack__date">${date}</span>
        <span class="transmission-stack__title">${title}</span>`;
  return `<span class="transmission-stack__meta">
        ${flair}
        ${dateTitle}
      </span>`;
}

function stackItemHtml(r, i) {
  const href = escapeHtml(hrefForRelease(r));
  const primary = escapeHtml(primaryHrefForRelease(r));
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

  if (hasInteractiveReconFlair(r)) {
    return `<li class="transmission-stack__item${latest}">
    ${badgeSlot}
    <div class="transmission-stack__link transmission-stack__link--shell">
      <a class="transmission-stack__cover-link" href="${primary}">${thumb}</a>
      ${stackMetaHtml(flair, date, title, { bodyHref: primary })}
    </div>
  </li>`;
  }

  return `<li class="transmission-stack__item${latest}">
    ${badgeSlot}
    <a class="transmission-stack__link" href="${href}">
      ${thumb}
      ${stackMetaHtml(flair, date, title)}
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
