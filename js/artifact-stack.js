import {
  artifactTypeLabel,
  formatArtifactDate,
  hrefForArtifact,
  hrefForArtifactVariant,
  primaryCoverUrl,
  sortArtifacts,
} from "./artifacts.js";

const REGISTRY_URL = "/artifacts/registry.json";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function stackItemHtml(a, i) {
  const primaryVariant = a.variants?.[0];
  const href = escapeHtml(
    primaryVariant ? hrefForArtifactVariant(a, primaryVariant) : hrefForArtifact(a),
  );
  const title = escapeHtml(a.title || "Untitled");
  const type = escapeHtml(artifactTypeLabel(a));
  const date = escapeHtml(formatArtifactDate(a.published_at));
  const latest = i === 0 ? " artifact-stack__item--latest" : "";
  const sub = primaryVariant?.label
    ? `<span class="artifact-stack__variant">${escapeHtml(primaryVariant.label)}</span>`
    : "";
  const cover = primaryCoverUrl(a);
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
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`Registry HTTP ${res.status}`);
    registry = await res.json();
  } catch {
    root.hidden = true;
    return;
  }

  const rows = sortArtifacts(registry.artifacts || []).slice(0, limit);
  if (!rows.length) {
    root.hidden = true;
    return;
  }

  const items = rows.map((a, i) => stackItemHtml(a, i)).join("");

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
