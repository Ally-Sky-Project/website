const REGISTRY_URL = "/artifacts/registry.json";

const TYPE_LABELS = {
  track: "TRACK",
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string | undefined} iso
 */
export function formatArtifactDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

/**
 * @param {string | undefined} iso YYYY-MM-DD or full ISO
 */
export function formatArtifactDateLong(iso) {
  if (!iso) return "—";
  const day = String(iso).slice(0, 10);
  const d = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * @param {object} artifact
 */
function artifactListingMetaHtml(artifact) {
  const listed = formatArtifactDateLong(artifact.published_at);
  const align = artifact.nmf_alignment;
  if (!align?.reference_date) {
    return `Listed <code>${escapeHtml(formatArtifactDate(artifact.published_at))}</code>`;
  }
  const refDate = formatArtifactDateLong(align.reference_date);
  const reference = escapeHtml(align.reference || "Wonderwall");
  let text = `Listed ${escapeHtml(listed)} (NMF) — date aligned with the ${reference} release (${escapeHtml(refDate)})`;
  if (align.next_window) {
    const next = formatArtifactDateLong(align.next_window);
    text += `. Next opportunity: ${escapeHtml(next)} (NMF)`;
  }
  return text;
}

/**
 * @param {object[]} artifacts
 */
export function sortArtifacts(artifacts) {
  return [...(artifacts || [])].sort(
    (a, b) => Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0),
  );
}

/**
 * @param {object} artifact
 */
export function hrefForArtifact(artifact) {
  return `/artifacts/${artifact.id}/`;
}

/**
 * @param {object} artifact
 * @param {object | undefined} variant
 */
export function hrefForArtifactVariant(artifact, variant) {
  if (variant?.cover_href) return String(variant.cover_href);
  const base = hrefForArtifact(artifact);
  const versionId = variant?.id;
  if (!versionId) return base;
  const q = new URLSearchParams({ version: versionId });
  return `${base}?${q}`;
}

/**
 * @param {object} artifact
 * @param {object | undefined} variant
 */
export function coverUrlForArtifact(artifact, variant) {
  const path = variant?.cover_path || artifact?.cover_path;
  return path ? String(path) : null;
}

/**
 * @param {object | undefined} variant
 * @param {object} artifact
 */
function artifactSidebarHtml(artifact, variant) {
  const items = [];
  const stemsUrl = variant?.stems_url;
  if (stemsUrl) {
    const label = escapeHtml(variant.stems_label || "Stems");
    items.push(
      `<li><a class="artifact-sidebar__link" href="${escapeHtml(stemsUrl)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`,
    );
  }
  if (!items.length) return "";
  return `<nav class="artifact-sidebar__nav" aria-label="Artifact links">
    <p class="artifact-sidebar__label">Links</p>
    <ul class="artifact-sidebar__list">${items.join("")}</ul>
  </nav>`;
}

/**
 * @param {HTMLElement | null | undefined} sidebar
 * @param {object} artifact
 * @param {object} variant
 */
function mountArtifactSidebar(sidebar, artifact, variant) {
  if (!sidebar) return;
  const html = artifactSidebarHtml(artifact, variant);
  if (!html) {
    sidebar.hidden = true;
    sidebar.innerHTML = "";
    return;
  }
  sidebar.hidden = false;
  sidebar.innerHTML = html;
}

/**
 * @param {object} artifact
 * @param {string} [variantId]
 */
export function primaryCoverUrl(artifact, variantId) {
  const variants = artifact?.variants || [];
  const variant = variantId
    ? variants.find((v) => v.id === variantId) || variants[0]
    : variants[0];
  return coverUrlForArtifact(artifact, variant);
}

/**
 * @param {object} artifact
 */
export function artifactTypeLabel(artifact) {
  return TYPE_LABELS[artifact?.type] || String(artifact?.type || "ARTIFACT").toUpperCase();
}

/**
 * @param {object} artifact
 */
function relatedTransmissionHtml(artifact) {
  const slot = artifact?.related_transmission?.slot;
  if (!slot) return "";
  return `<p class="artifact-related">
    <span class="artifact-related__label">Transmission</span>
    <a href="/${slot}/ai/">AI</a>
    <span class="artifact-related__sep" aria-hidden="true">·</span>
    <a href="/${slot}/human/">HUMAN</a>
  </p>`;
}

/**
 * @param {string} coverSrc
 * @param {string | null} href
 * @param {string} classPrefix artifact-card | artifact-detail
 * @param {{ width: number, height: number, loading: string }} img
 */
function coverFigureHtml(coverSrc, href, classPrefix, img) {
  const imgTag = `<img class="${classPrefix}__cover" src="${escapeHtml(coverSrc)}" alt="" width="${img.width}" height="${img.height}" loading="${img.loading}" decoding="async" />`;
  if (!href) {
    if (classPrefix === "artifact-detail") {
      return `<figure class="artifact-detail__cover">${imgTag}</figure>`;
    }
    return imgTag;
  }
  if (classPrefix === "artifact-detail") {
    return `<figure class="artifact-detail__cover">
        <a class="artifact-detail__cover-link" href="${escapeHtml(href)}">${imgTag}</a>
      </figure>`;
  }
  return `<a class="artifact-card__cover-link" href="${escapeHtml(href)}">${imgTag}</a>`;
}

/**
 * @param {HTMLElement} root
 */
export async function mountArtifactsRegistry(root) {
  let registry;
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`Registry HTTP ${res.status}`);
    registry = await res.json();
  } catch {
    root.innerHTML = `<p class="artifacts-err">Could not load artifact registry.</p>`;
    return;
  }

  const rows = sortArtifacts(registry.artifacts || []);
  if (!rows.length) {
    root.innerHTML = `<p class="artifacts-empty">No artifacts listed yet.</p>`;
    return;
  }

  const cards = rows
    .map((a) => {
      const href = escapeHtml(hrefForArtifact(a));
      const title = escapeHtml(a.title || "Untitled");
      const type = escapeHtml(artifactTypeLabel(a));
      const date = escapeHtml(formatArtifactDate(a.published_at));
      const variantCount = a.variants?.length ?? 0;
      const variantNote =
        variantCount > 0
          ? `<span class="artifact-card__variants">${variantCount} version${variantCount === 1 ? "" : "s"}</span>`
          : "";
      const primaryVariant = a.variants?.[0];
      const cover = primaryCoverUrl(a);
      const coverLink = primaryVariant ? hrefForArtifactVariant(a, primaryVariant) : hrefForArtifact(a);
      const coverHtml = cover
        ? coverFigureHtml(cover, coverLink, "artifact-card", {
            width: 320,
            height: 320,
            loading: "lazy",
          })
        : "";
      return `<li>
        <article class="artifact-card">
          ${coverHtml}
          <div class="artifact-card__body">
            <p class="artifact-card__type">${type}</p>
            <h2 class="artifact-card__title"><a href="${href}">${title}</a></h2>
            <p class="artifact-card__meta">${date} ${variantNote}</p>
          </div>
        </article>
      </li>`;
    })
    .join("");

  root.innerHTML = `<ul class="artifacts-list">${cards}</ul>`;
}

/**
 * @param {HTMLElement} app
 * @param {string} artifactId
 * @param {{ sidebar?: HTMLElement | null }} [opts]
 */
export async function mountArtifactDetail(app, artifactId, opts = {}) {
  let registry;
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`Registry HTTP ${res.status}`);
    registry = await res.json();
  } catch {
    app.innerHTML = `<p class="artifacts-err">Could not load artifact registry.</p>`;
    return;
  }

  const artifact = (registry.artifacts || []).find(
    (a) => a.id === artifactId || a.id?.toLowerCase() === artifactId?.toLowerCase(),
  );
  if (!artifact) {
    app.innerHTML = `<p class="artifacts-err">Artifact not found: <code>${escapeHtml(artifactId)}</code></p>`;
    return;
  }

  const variants = artifact.variants || [];
  if (!variants.length) {
    app.innerHTML = `<p class="artifacts-empty">No versions published for this artifact yet.</p>`;
    return;
  }

  const params = new URLSearchParams(location.search);
  let activeId = params.get("version") || variants[0].id;
  if (!variants.some((v) => v.id === activeId)) activeId = variants[0].id;

  const tabs =
    variants.length > 1
      ? `<div class="artifact-tabs" role="tablist" aria-label="Track versions">
          ${variants
            .map((v) => {
              const selected = v.id === activeId;
              const q = new URLSearchParams({ version: v.id });
              return `<a class="artifact-tabs__tab${selected ? " is-active" : ""}" role="tab" aria-selected="${selected ? "true" : "false"}" href="?${q}">${escapeHtml(v.label || v.id)}</a>`;
            })
            .join("")}
        </div>`
      : `<div class="artifact-tabs artifact-tabs--single" role="tablist" aria-label="Track versions">
          <span class="artifact-tabs__tab is-active" role="tab" aria-selected="true">${escapeHtml(variants[0].label || variants[0].id)}</span>
        </div>`;

  const active = variants.find((v) => v.id === activeId) || variants[0];
  const sidebarEl = opts.sidebar ?? document.getElementById("artifact-sidebar");
  mountArtifactSidebar(sidebarEl, artifact, active);

  const cover = coverUrlForArtifact(artifact, active);
  const coverPageHref = hrefForArtifactVariant(artifact, active);
  const coverHtml = cover
    ? coverFigureHtml(cover, coverPageHref, "artifact-detail", {
        width: 1024,
        height: 1024,
        loading: "eager",
      })
    : "";
  let lyrics = active.lyrics || "";
  if (!lyrics && active.lyrics_path) {
    try {
      const lr = await fetch(active.lyrics_path);
      if (lr.ok) lyrics = await lr.text();
    } catch {
      lyrics = "";
    }
  }
  lyrics = lyrics.replace(/^[^\n]*Official lyrics[^\n]*\n/i, "").trim();

  document.title = `${artifact.title || "Artifact"} · ${active.label || active.id} · Ally Sky`;

  app.innerHTML = `
    ${coverHtml}
    <header class="artifact-detail__header">
      <p class="artifact-detail__type">${escapeHtml(artifactTypeLabel(artifact))}</p>
      <h1>${escapeHtml(artifact.title || "Untitled")}</h1>
      <p class="artifact-detail__meta">${artifactListingMetaHtml(artifact)}</p>
      ${relatedTransmissionHtml(artifact)}
      ${tabs}
    </header>
    <pre class="artifact-lyrics transmission no-glitch" aria-label="Lyrics">${escapeHtml(lyrics || "—")}</pre>
    <p class="artifact-detail__back"><a href="/artifacts/">← Artifacts</a> · <a href="/">Beacon</a></p>`;
}
