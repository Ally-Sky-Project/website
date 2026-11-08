const REGISTRY_URL = "/artifacts/registry.json";
const REGISTRY_FETCH = { cache: "no-store" };

const TYPE_LABELS = {
  track: "TRACK",
  essay: "ESSAY",
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
 * Long date with weekday (UTC) for NMF listing copy.
 * @param {string | undefined} iso
 */
export function formatArtifactDateLongWithWeekday(iso) {
  if (!iso) return "—";
  const day = String(iso).slice(0, 10);
  const d = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * @param {object} artifact
 * @param {object | null | undefined} variant
 */
export function publishedAtForListing(artifact, variant) {
  if (variant?.published_at) return variant.published_at;
  return artifact?.published_at;
}

/**
 * @param {object} artifact
 * @param {object | null | undefined} variant
 */
function nmfAlignmentForListing(artifact, variant) {
  const base = artifact?.nmf_alignment;
  const over = variant?.nmf_alignment;
  if (!base && !over) return null;
  return { ...base, ...over };
}

const LISTING_WINDOW_TAGS = {
  nmf: "NMF",
  sunday: "Sunday release",
};

/**
 * @param {string | undefined} iso
 * @param {string | undefined} referenceDate YYYY-MM-DD
 */
function isSameMonthDay(iso, referenceDate) {
  if (!iso || !referenceDate) return false;
  return String(iso).slice(5, 10) === String(referenceDate).slice(5, 10);
}

/**
 * @param {object} align
 */
function listingWindowTag(align) {
  const kind = align?.listing_window || "nmf";
  const label = LISTING_WINDOW_TAGS[kind] || kind;
  return ` (${escapeHtml(label)})`;
}

/**
 * @param {object} artifact
 * @param {object | null | undefined} [variant]
 */
function artifactListingMetaHtml(artifact, variant) {
  const listedIso = publishedAtForListing(artifact, variant);
  const align = nmfAlignmentForListing(artifact, variant);
  if (!align?.reference_date) {
    return `Listed <code>${escapeHtml(formatArtifactDate(listedIso))}</code>`;
  }
  const listed = formatArtifactDateLongWithWeekday(listedIso);
  const refDate = formatArtifactDateLong(align.reference_date);
  const reference = escapeHtml(align.reference || "Wonderwall");
  const window = align.listing_window || "nmf";
  const listedPart = `Listed ${escapeHtml(listed)}${listingWindowTag(align)}`;

  let text;
  if (window === "sunday") {
    text = `${listedPart} — same Wonderwall weekend as Oct 30 NMF. ${reference} (${escapeHtml(refDate)})`;
  } else {
    text = `${listedPart} — aligned with the ${reference} release (${escapeHtml(refDate)})`;
  }

  const nextNmf = align.next_window || align.reference_date;
  if (nextNmf && isSameMonthDay(nextNmf, align.reference_date)) {
    const next = formatArtifactDateLongWithWeekday(nextNmf);
    text += `. Next NMF opportunity: ${escapeHtml(next)} (NMF)`;
  }

  if (align.next_sunday_release) {
    const nextSun = formatArtifactDateLongWithWeekday(align.next_sunday_release);
    text += `. Next Sunday release: ${escapeHtml(nextSun)} (Sunday release)`;
  }

  return text;
}

/**
 * @param {object[]} artifacts
 */
export function sortArtifacts(artifacts) {
  const sortKey = (a) => {
    const variantTimes = (a.variants || []).map((v) => Date.parse(v.published_at || 0));
    const t = Date.parse(a.published_at || 0);
    return Math.max(t, ...variantTimes, 0);
  };
  return [...(artifacts || [])].sort((a, b) => sortKey(b) - sortKey(a));
}

/**
 * One listing row per track version (variant order preserved within each artifact).
 * @param {object[]} artifacts
 * @returns {{ artifact: object, variant: object | null }[]}
 */
export function expandArtifactListing(artifacts) {
  const rows = [];
  for (const artifact of sortArtifacts(artifacts)) {
    const variants = artifact.variants;
    if (Array.isArray(variants) && variants.length) {
      for (const variant of variants) {
        rows.push({ artifact, variant });
      }
    } else {
      rows.push({ artifact, variant: null });
    }
  }
  return rows.sort(
    (a, b) =>
      Date.parse(publishedAtForListing(b.artifact, b.variant) || 0) -
      Date.parse(publishedAtForListing(a.artifact, a.variant) || 0),
  );
}

/**
 * @param {object} artifact
 */
export function hrefForArtifact(artifact) {
  if (artifact?.page_href) return String(artifact.page_href);
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
 * @returns {{ slot: number, title?: string, reconstruction_variants?: boolean }[]}
 */
function relatedTransmissionsForArtifact(artifact) {
  const list = artifact?.related_transmissions;
  if (Array.isArray(list) && list.length) {
    return list.filter((t) => t?.slot > 0);
  }
  const single = artifact?.related_transmission;
  if (single?.slot > 0) {
    return [
      {
        slot: single.slot,
        title: single.title,
        reconstruction_variants: single.reconstruction_variants !== false,
      },
    ];
  }
  return [];
}

/**
 * @param {object} artifact
 */
function relatedTransmissionHtml(artifact) {
  const rows = relatedTransmissionsForArtifact(artifact);
  if (!rows.length) return "";

  const label = rows.length > 1 ? "Transmissions" : "Transmission";
  const items = rows
    .map((t) => {
      const slot = t.slot;
      const title = escapeHtml(t.title || `Transmission ${slot}`);
      const titleHref = t.reconstruction_variants ? `/${slot}/human/` : `/${slot}/`;
      let recon = "";
      if (t.reconstruction_variants) {
        recon = `<span class="artifact-related__recon">
        <a href="/${slot}/ai/">AI</a>
        <span class="artifact-related__sep" aria-hidden="true">·</span>
        <a href="/${slot}/human/">HUMAN</a>
      </span>`;
      }
      return `<li class="artifact-related__item">
      <a href="${titleHref}">${title}</a>${recon}
    </li>`;
    })
    .join("");

  return `<div class="artifact-related">
    <p class="artifact-related__heading"><span class="artifact-related__label">${label}</span></p>
    <ul class="artifact-related__list">${items}</ul>
  </div>`;
}

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
 * @param {object} artifact
 * @param {object | null | undefined} variant
 */
function bodyPathForArtifact(artifact, variant) {
  const v = variant || {};
  return v.body_path || v.lyrics_path || artifact.body_path || artifact.lyrics_path || "";
}

/**
 * @param {object} artifact
 * @param {object | null | undefined} variant
 */
async function loadArtifactBody(artifact, variant) {
  const inline = variant?.lyrics || variant?.body || artifact.body || artifact.lyrics || "";
  if (inline) return String(inline);
  const path = bodyPathForArtifact(artifact, variant);
  if (!path) return "";
  try {
    const res = await fetch(path);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * @param {string} raw
 */
function inlineProseHtml(raw) {
  const parts = String(raw).split(/\*\*(.+?)\*\*/g);
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const chunk = escapeHtml(parts[i]);
    if (i % 2 === 1) out += `<strong>${chunk}</strong>`;
    else out += chunk;
  }
  return out;
}

/**
 * @param {string} text
 */
function essayAiDisclosureHtml(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  return `<section class="about-disclosure" aria-labelledby="artifact-ai-disclosure">
    <h2 id="artifact-ai-disclosure">AI Disclosure</h2>
    <p>${escapeHtml(t)}</p>
  </section>`;
}

/**
 * @param {string} raw
 */
function proseHtmlFromText(raw, aboutStyle = false) {
  const blocks = String(raw || "")
    .trim()
    .split(/\n\n+/);
  let firstPara = true;
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) {
        return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      }
      const para = trimmed.replace(/\n+/g, " ");
      if (aboutStyle) {
        const lead = firstPara ? ` class="about-page__lead"` : "";
        firstPara = false;
        return `<p${lead}>${inlineProseHtml(para)}</p>`;
      }
      return `<p>${inlineProseHtml(para)}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * @param {HTMLElement} root
 */
export async function mountArtifactsRegistry(root) {
  let registry;
  try {
    const res = await fetch(REGISTRY_URL, REGISTRY_FETCH);
    if (!res.ok) throw new Error(`Registry HTTP ${res.status}`);
    registry = await res.json();
  } catch {
    root.innerHTML = `<p class="artifacts-err">Could not load artifact registry.</p>`;
    return;
  }

  const rows = expandArtifactListing(registry.artifacts || []);
  if (!rows.length) {
    root.innerHTML = `<p class="artifacts-empty">No artifacts listed yet.</p>`;
    return;
  }

  const cards = rows
    .map(({ artifact: a, variant }) => {
      const pageHref = variant ? hrefForArtifactVariant(a, variant) : hrefForArtifact(a);
      const href = escapeHtml(pageHref);
      const title = escapeHtml(a.title || "Untitled");
      const type = escapeHtml(artifactTypeLabel(a));
      const date = escapeHtml(formatArtifactDate(publishedAtForListing(a, variant)));
      const variantNote = variant?.label
        ? `<span class="artifact-card__variants">${escapeHtml(variant.label)}</span>`
        : "";
      const cover = coverUrlForArtifact(a, variant || undefined);
      const coverLink = pageHref;
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
    const res = await fetch(REGISTRY_URL, REGISTRY_FETCH);
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
  const hasVariants = variants.length > 0;
  if (!hasVariants && !bodyPathForArtifact(artifact, null)) {
    app.innerHTML = `<p class="artifacts-empty">No content published for this artifact yet.</p>`;
    return;
  }

  let active = null;
  let tabs = "";
  if (hasVariants) {
    const params = new URLSearchParams(location.search);
    let activeId = params.get("version") || variants[0].id;
    if (!variants.some((v) => v.id === activeId)) activeId = variants[0].id;
    active = variants.find((v) => v.id === activeId) || variants[0];
    tabs =
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
  }

  const sidebarEl = opts.sidebar ?? document.getElementById("artifact-sidebar");
  mountArtifactSidebar(sidebarEl, artifact, active || {});

  const cover = coverUrlForArtifact(artifact, active || undefined);
  const coverPageHref = active ? hrefForArtifactVariant(artifact, active) : hrefForArtifact(artifact);
  const coverHtml = cover
    ? coverFigureHtml(cover, coverPageHref, "artifact-detail", {
        width: 1024,
        height: 1024,
        loading: "eager",
      })
    : "";

  const isEssay = artifact.type === "essay";
  let body = await loadArtifactBody(artifact, active);
  if (!isEssay) {
    body = body.replace(/^[^\n]*Official lyrics[^\n]*\n/i, "").trim();
  }

  if (hasVariants && active) {
    document.title = `${artifact.title || "Artifact"} · ${active.label || active.id} · Ally Sky`;
  } else {
    document.title = `${artifact.title || "Artifact"} · Ally Sky Project`;
  }

  const bodyHtml = isEssay
    ? `<div class="about-page artifact-essay"><article aria-label="Essay">${proseHtmlFromText(body, true) || "<p>—</p>"}</article>${essayAiDisclosureHtml(artifact.ai_disclosure)}</div>`
    : `<pre class="artifact-lyrics transmission no-glitch" aria-label="Lyrics">${escapeHtml(body || "—")}</pre>`;

  const metaVariant = hasVariants ? active : null;
  const essayHeaderClass = isEssay ? " artifact-detail__header--essay" : "";
  const titleClass = isEssay ? "about-page__title" : "";

  app.innerHTML = `
    ${coverHtml}
    <header class="artifact-detail__header${essayHeaderClass}">
      <p class="artifact-detail__type">${escapeHtml(artifactTypeLabel(artifact))}</p>
      <h1 class="${titleClass}">${escapeHtml(artifact.title || "Untitled")}</h1>
      <p class="artifact-detail__meta">${artifactListingMetaHtml(artifact, metaVariant)}</p>
      ${relatedTransmissionHtml(artifact)}
      ${tabs}
    </header>
    ${bodyHtml}
    <p class="artifact-detail__back"><a href="/artifacts/">← Artifacts</a> · <a href="/">Home</a></p>`;
}
