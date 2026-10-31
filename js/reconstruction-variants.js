import { labelReconstruction, labelRealityLayer } from "./encoding.js";
import { hrefForRelease } from "./transmission-slots.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

export function hasReconstructionVariants(release) {
  return Boolean(release?.reconstruction_variants?.ai || release?.reconstruction_variants?.human);
}

export function aiVariantReady(release) {
  const ai = release?.reconstruction_variants?.ai;
  return (ai?.carousel?.length ?? 0) > 0 && Boolean(ai?.path);
}

/**
 * Default reader href for stack cover / title (AI when ready).
 * @param {object} release
 */
export function primaryVariantHref(release) {
  const slotHref = hrefForRelease(release);
  const variants = release?.reconstruction_variants;
  if (!variants?.human?.path && !variants?.ai?.path) return slotHref;
  const ai = variants.ai;
  if (aiVariantReady(release) && ai?.path) return ai.path;
  return variants.human?.path || ai?.path || slotHref;
}

/**
 * @param {object} release
 * @param {{ linkClass?: string }} [opts]
 */
export function reconstructionVariantLinksInnerHtml(release, opts = {}) {
  const linkClass = opts.linkClass || "transmission-stack__recon-link";
  const variants = release.reconstruction_variants;
  const ai = variants?.ai;
  const human = variants?.human;
  const aiReady = aiVariantReady(release);
  const aiText = aiReady ? "AI" : "AI (Coming Soon)";
  const aiPart =
    aiReady && ai?.path
      ? `<a class="${escapeHtml(linkClass)}" href="${escapeHtml(ai.path)}">${aiText}</a>`
      : escapeHtml(aiText);
  const humanPart =
    human?.path
      ? `<a class="${escapeHtml(linkClass)}" href="${escapeHtml(human.path)}">HUMAN</a>`
      : "HUMAN";
  return `${aiPart} · ${humanPart}`;
}

/**
 * Homepage stack flair line.
 * @param {object} release
 */
export function reconstructionStackFlairHtml(release) {
  if (hasReconstructionVariants(release)) {
    const inner = reconstructionVariantLinksInnerHtml(release, {
      linkClass: "transmission-stack__recon-link",
    });
    return `<span class="transmission-stack__flair">RECONSTRUCTION: ${inner}</span>`;
  }
  const label = labelReconstruction(release.reconstruction);
  if (label === "—") return "";
  return `<span class="transmission-stack__flair">${escapeHtml(`RECONSTRUCTION: ${label}`)}</span>`;
}

/**
 * Transmission registry card encoding block (reality + linked reconstructions).
 * @param {object} release
 * @param {string} blockClass
 * @param {string} lineClass
 */
export function renderReconstructionVariantEncodingHtml(
  release,
  blockClass = "transmission-card__encoding",
  lineClass = "transmission-card__encoding__line",
) {
  const rl = labelRealityLayer(release.reality_layer);
  const inner = reconstructionVariantLinksInnerHtml(release, {
    linkClass: "transmission-card__recon-link",
  });
  const lines = [];
  if (rl !== "—") {
    lines.push(`REALITY LAYER: ${escapeHtml(rl)}`);
  }
  lines.push(`RECONSTRUCTION: ${inner}`);
  return `<div class="${escapeHtml(blockClass)}">${lines
    .map((line) => `<div class="${escapeHtml(lineClass)}">${line}</div>`)
    .join("")}</div>`;
}

export function stackCoverUrl(release) {
  if (typeof release.registry_thumb === "string" && release.registry_thumb) {
    return release.registry_thumb;
  }
  const variants = release.reconstruction_variants;
  const ai = variants?.ai;
  if (aiVariantReady(release) && ai.carousel[0]) return ai.carousel[0];
  if (aiVariantReady(release) && typeof ai.cover === "string" && ai.cover) return ai.cover;
  const carousel = release.carousel;
  if (Array.isArray(carousel) && carousel[0]) return carousel[0];
  if (typeof release.cover === "string" && release.cover) return release.cover;
  return null;
}
