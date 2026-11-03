import {
  artifactTypeLabel,
  coverUrlForArtifact,
  expandArtifactListing,
  formatArtifactDate,
  hrefForArtifact,
  hrefForArtifactVariant,
  publishedAtForListing,
} from "./artifacts.js";

const REGISTRY_URL = "/artifacts/registry.json";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function stackItemHtml(a, variant, i) {
  const pageHref = variant ? hrefForArtifactVariant(a, variant) : hrefForArtifact(a);
  const href = escapeHtml(pageHref);
  const title = escapeHtml(a.title || "Untitled");
  const type = escapeHtml(artifactTypeLabel(a));
  const date = escapeHtml(formatArtifactDate(publishedAtForListing(a, variant)));
  const latest = i === 0 ? " artifact-stack__item--latest" : "";
  const sub = variant?.label
    ? `<span class="artifact-stack__variant">${escapeHtml(variant.label)}</span>`
    : "";
  const cover = coverUrlForArtifact(a, variant || undefined);
  const thumb = cover
    ? `<span class="artifact-stack__frame"><img class="artifact-stack__cover" src="${escapeHtml(cover)}" alt="" width="9" height="16" loading="lazy" decoding="async" /></span>`
    : `<span class="artifact-stack__frame artifact-stack__frame--empty" aria-hidden="true"></span>`;

  return `<li class="artifact-stack__item${latest}">
    <a class="artifact-stack__link" href="${href}">
      ${thumb}
      <span class="artifact-stack__text">
        <span class="artifact-stack__type">${type}</span>
        <span class="artifact-stack__title">${title}</span>
        ${sub}
        <span class="artifact-stack__date">${date}</span>
      </span>
    </a>
  </li>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ limit?: number }} [opts]
 */
export async function mountArtifactStack(root, opts = {}) {
  const limit = opts.limit ?? 5;
  if (!root) return;

  let registry;
  try {
    const res = await fetch(REGISTRY_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Registry HTTP ${res.status}`);
    registry = await res.json();
  } catch {
    root.hidden = true;
    return;
  }

  const rows = expandArtifactListing(registry.artifacts || []).slice(0, limit);
  if (!rows.length) {
    root.hidden = true;
    return;
  }

  const items = rows.map(({ artifact, variant }, i) => stackItemHtml(artifact, variant, i)).join("");

  root.innerHTML = `
    <header class="artifact-stack__header">
      <h2 class="artifact-stack__label">Artifacts</h2>
      <p class="artifact-stack__footer">
        <a class="artifact-stack__registry" href="/artifacts/">View registry →</a>
      </p>
    </header>
    <ol class="artifact-stack__list">${items}</ol>`;
  root.hidden = false;
}
