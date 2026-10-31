import {
  formatFrameCount,
  formatMessagePayload,
  renderEncodingLinesHtml,
} from "./encoding.js";
import {
  hasReconstructionVariants,
  primaryVariantHref,
  renderReconstructionVariantEncodingHtml,
} from "./reconstruction-variants.js";
import { hrefForRelease, releasesWithSlots } from "./transmission-slots.js";

const REGISTRY_URL = "/comic/registry.json";

export const CROSSPOST_LABELS = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  tiktok_photo: "TikTok · photos",
  github: "GitHub",
};

/**
 * @param {Record<string, string> | undefined} crosspost
 */
export function hasCrosspostLinks(crosspost) {
  if (!crosspost || typeof crosspost !== "object") return false;
  return Object.keys(CROSSPOST_LABELS).some((key) => {
    const url = crosspost[key];
    return typeof url === "string" && url.length > 0;
  });
}

/**
 * Stable slot order (/1, /2, …). Prev = lower slot · Next = higher slot.
 * @param {object[]} releases
 * @param {string} currentId
 */
export function adjacentReleases(releases, currentId) {
  const rows = releasesWithSlots(releases || []);
  const current = (releases || []).find((r) => r.id === currentId);
  const slot = current?.slot;
  if (!slot) {
    return { prev: null, next: null, rows };
  }
  return {
    prev: rows.find((r) => r.slot === slot - 1) ?? null,
    next: rows.find((r) => r.slot === slot + 1) ?? null,
    rows,
  };
}

/** Homepage stack: one row per slotted story, newest slot first. */
export function stackReleases(releases) {
  return [...releasesWithSlots(releases || [])].sort((a, b) => b.slot - a.slot);
}

export function dedupeReleases(releases) {
  /** @type {Map<string, object>} */
  const byKey = new Map();
  for (const r of releases || []) {
    const key = (r.gscript || r.deck || r.id || "").toLowerCase();
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || Date.parse(r.published_at || 0) > Date.parse(prev.published_at || 0)) {
      byKey.set(key, r);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0),
  );
}

/**
 * @param {string | undefined} iso
 */
export function formatTransmissionDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {Record<string, string> | undefined} crosspost
 */
export function renderCrosspostLinks(crosspost) {
  if (!crosspost || typeof crosspost !== "object") {
    return '<span class="transmissions-empty">—</span>';
  }
  const links = [];
  for (const [key, label] of Object.entries(CROSSPOST_LABELS)) {
    const url = crosspost[key];
    if (!url || typeof url !== "string") continue;
    links.push(
      `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
    );
  }
  if (!links.length) {
    return '<span class="transmissions-empty">—</span>';
  }
  return `<span class="transmissions-cross">${links.join("")}</span>`;
}

/**
 * @param {HTMLElement} root
 */
export async function mountTransmissionsRegistry(root) {
  let registry;
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`Registry HTTP ${res.status}`);
    registry = await res.json();
  } catch (err) {
    root.innerHTML = `<p class="transmissions-err">Could not load transmission registry.</p>`;
    return;
  }

  const rows = dedupeReleases(registry.releases || []);
  if (!rows.length) {
    root.innerHTML = `<p class="transmissions-empty">No transmissions listed yet.</p>`;
    return;
  }

  const cards = rows
    .map((r) => {
      const subject = escapeHtml(r.title || "Untitled");
      const id = escapeHtml(r.id || "");
      const href = hasReconstructionVariants(r)
        ? primaryVariantHref(r)
        : hrefForRelease(r);
      const hrefEsc = escapeHtml(href);
      const date = escapeHtml(formatTransmissionDate(r.published_at));
      const encoding = hasReconstructionVariants(r)
        ? renderReconstructionVariantEncodingHtml(r)
        : renderEncodingLinesHtml(r, "transmission-card__encoding");
      const frames = escapeHtml(formatFrameCount(r));
      const payload = escapeHtml(formatMessagePayload(r));
      const cross = renderCrosspostLinks(r.crosspost);
      const thumb = typeof r.registry_thumb === "string" ? r.registry_thumb : null;
      const coverHrefEsc = escapeHtml(href);
      const coverHtml = thumb
        ? `<a class="transmission-card__cover-link" href="${coverHrefEsc}"><img class="transmission-card__cover" src="${escapeHtml(thumb)}" alt="" width="9" height="16" loading="lazy" decoding="async" /></a>`
        : "";
      return `<li>
        <article class="transmission-card${thumb ? "" : " transmission-card--no-cover"}">
          ${coverHtml}
          <div class="transmission-card__body">
          <h2 class="transmission-card__subject">
            <a href="${hrefEsc}">${subject}</a>
          </h2>
          ${encoding}
          <p class="transmission-card__telemetry">
            <a class="transmission-card__id" href="${hrefEsc}"><code>${id}</code></a>
            <span class="transmission-card__sep" aria-hidden="true">·</span>
            <span>${date}</span>
            <span class="transmission-card__sep" aria-hidden="true">·</span>
            <span>${frames} frames</span>
            <span class="transmission-card__sep" aria-hidden="true">·</span>
            <span>${payload} payload</span>
          </p>
          <p class="transmission-card__cross">
            <span class="transmission-card__cross-label">Cross-post</span>
            ${cross}
          </p>
          </div>
        </article>
      </li>`;
    })
    .join("");

  root.innerHTML = `<ul class="transmissions-list">${cards}</ul>`;
}
