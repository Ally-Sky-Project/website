import { formatFrameCount, formatMessagePayload, renderEncodingMetaHtml } from "/js/encoding.js";
import { hasCrosspostLinks, renderCrosspostLinks } from "/js/transmissions.js";

const REGISTRY_URL = "/comic/registry.json";

/**
 * @returns {string | null}
 */
export function resolveComicId() {
  const params = new URLSearchParams(location.search);
  if (params.get("id")) return params.get("id").trim().toLowerCase();

  let path = location.pathname.replace(/\/$/, "");
  if (path.startsWith("/")) path = path.slice(1);
  // Single segment: /ad5ba57c25217bfe1
  if (/^[a-f0-9]{16}\d+$/i.test(path)) return path.toLowerCase();
  const leaf = path.split("/").pop() || "";
  if (/^[a-f0-9]{16}\d+$/i.test(leaf)) return leaf.toLowerCase();
  return null;
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
 * @param {HTMLElement} app
 */
export async function mountComicReader(app) {
  const id = resolveComicId();

  if (!id) {
    app.innerHTML = `<p class="err">Missing publication ID. Open <code>/{id}</code> (example: <code>/ad5ba57c25217bfe1</code>).</p>`;
    return;
  }

  const parts = parseComicId(id);
  if (!parts) {
    app.innerHTML = `<p class="err">Invalid ID format: <code>${id}</code></p>`;
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

  let carouselHtml = "";
  if (release.carousel?.length) {
    carouselHtml = `<div class="carousel">${release.carousel
      .map((src) => `<img src="${src}" alt="" loading="lazy" />`)
      .join("")}</div>`;
  } else if (release.note) {
    carouselHtml = `<pre class="transmission">${escapeHtml(release.note)}</pre>`;
  } else {
    carouselHtml = `<pre class="transmission">> PUBLICATION REGISTERED
> ID: ${id}</pre>`;
  }

  const encodingBlock = renderEncodingMetaHtml(release);
  const frames = formatFrameCount(release);
  const payload = formatMessagePayload(release);
  const metricsLine =
    frames !== "—" || payload !== "—"
      ? `<p class="meta reader-metrics">Frames <code>${escapeHtml(frames)}</code> · payload <code>${escapeHtml(payload)}</code></p>`
      : "";

  const crosspostBlock = hasCrosspostLinks(release.crosspost)
    ? `<p class="meta reader-crosspost">Cross-post ${renderCrosspostLinks(release.crosspost)}</p>`
    : "";

  app.innerHTML = `
    <h1>${escapeHtml(release.title || "Untitled")}</h1>
    <p class="meta">
      ID <code>${id}</code><br />
      Version <code>${parts.version}</code> · listed <code>${published}</code>
    </p>
    ${encodingBlock}
    ${metricsLine}
    ${crosspostBlock}
    ${carouselHtml}
    <p class="back"><a href="/transmissions/">← Transmissions</a> · <a href="/">Beacon</a></p>`;
}

const app = document.getElementById("app");
if (app) mountComicReader(app);
