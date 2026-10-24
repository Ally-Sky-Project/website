/** NTQTP transmission encoding labels (registry + reader). */

export const REALITY_LAYER_LABELS = {
  description: "DESCRIPTION-LOCKED",
  capture: "CAPTURED WAVEFORM",
  hybrid: "HYBRID",
};

export const RECONSTRUCTION_LABELS = {
  ai_frame_stack: "AI · FRAME STACK",
  ai_waveform: "AI · WAVEFORM",
  direct: "DIRECT",
};

/**
 * @param {string | undefined} key
 */
export function labelRealityLayer(key) {
  if (!key) return "—";
  return REALITY_LAYER_LABELS[key] || key;
}

/**
 * @param {string | undefined} key
 */
export function labelReconstruction(key) {
  if (!key) return "—";
  return RECONSTRUCTION_LABELS[key] || key;
}

/**
 * @param {number} bytes
 */
export function formatPayloadSize(bytes) {
  const n = Math.max(0, Number(bytes) || 0);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
}

/**
 * @param {{ frame_count?: number } | undefined} release
 */
export function formatFrameCount(release) {
  const n = release?.frame_count;
  if (n == null || Number.isNaN(Number(n))) return "—";
  return String(n);
}

/**
 * NTQTP message size (same as composer title-slide `PAYLOAD SIZE` / deckPayloadByteLength).
 * @param {{ payload_bytes?: number } | undefined} release
 */
export function formatMessagePayload(release) {
  if (release?.payload_bytes == null) return "—";
  return formatPayloadSize(release.payload_bytes);
}

/** @deprecated use formatMessagePayload */
export const formatArtifactPayload = formatMessagePayload;

/**
 * @param {object} release
 * @returns {string[]}
 */
export function encodingLines(release) {
  const rl = labelRealityLayer(release.reality_layer);
  const rc = labelReconstruction(release.reconstruction);
  if (rl === "—" && rc === "—") return [];
  return [`REALITY LAYER: ${rl}`, `RECONSTRUCTION: ${rc}`];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {object} release
 */
export function renderEncodingLinesHtml(release, blockClass = "transmissions-encoding") {
  const lines = encodingLines(release);
  if (!lines.length) {
    return '<span class="transmissions-empty">—</span>';
  }
  return `<div class="${escapeHtml(blockClass)}">${lines
    .map((line) => `<div class="${escapeHtml(blockClass)}__line">${escapeHtml(line)}</div>`)
    .join("")}</div>`;
}

/** @deprecated table layout; use renderEncodingLinesHtml */
export function renderEncodingCell(release) {
  const lines = encodingLines(release);
  if (!lines.length) {
    return '<span class="transmissions-empty">—</span>';
  }
  return `<span class="transmissions-encoding">${lines
    .map((line) => `<span class="transmissions-encoding__line">${escapeHtml(line)}</span>`)
    .join("")}</span>`;
}

/**
 * @param {object} release
 */
export function renderEncodingMetaHtml(release) {
  const lines = encodingLines(release);
  if (!lines.length) return "";
  const body = lines.map((line) => escapeHtml(line)).join("<br />");
  return `<p class="meta reader-encoding">${body}</p>`;
}
