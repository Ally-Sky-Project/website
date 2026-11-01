function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ id?: string, variant?: string, label?: string }} ref
 */
export function hrefForReactionArtifact(ref) {
  if (!ref?.id) return null;
  const base = `/artifacts/${encodeURIComponent(ref.id)}/`;
  if (!ref.variant) return base;
  return `${base}?${new URLSearchParams({ version: ref.variant })}`;
}

/**
 * @param {{ part?: number, slot?: number, title?: string, href?: string }} ref
 */
export function hrefForContinuesTransmission(ref) {
  if (ref?.href) return ref.href;
  if (ref?.slot > 0) return `/${ref.slot}/`;
  return null;
}

/**
 * @param {object | undefined} release
 * @param {{ blockClass?: string, lineClass?: string, labelClass?: string }} [opts]
 */
export function renderTransmissionContextHtml(release, opts = {}) {
  const blockClass = opts.blockClass || "transmission-context";
  const lineClass = opts.lineClass || `${blockClass}__line`;
  const labelClass = opts.labelClass || `${blockClass}__label`;

  const lines = [];
  const cont = release?.continues_transmission;
  if (cont?.title || cont?.slot) {
    const href = hrefForContinuesTransmission(cont);
    const title = cont.title || (cont.slot ? `Transmission ${cont.slot}` : "Previous transmission");
    const partNum = Number.isInteger(cont.part) && cont.part > 1 ? cont.part : null;
    const labelText = partNum ? `Part ${partNum} of` : "Continues";
    const link = href
      ? `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`
      : escapeHtml(title);
    lines.push(
      `<p class="${lineClass}"><span class="${labelClass}">${escapeHtml(labelText)}</span> ${link}</p>`,
    );
  }

  const react = release?.reaction_to_artifact;
  if (react?.label || react?.id) {
    const href = hrefForReactionArtifact(react);
    const label = react.label || react.id;
    const link = href
      ? `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
      : escapeHtml(label);
    lines.push(
      `<p class="${lineClass}"><span class="${labelClass}">Reaction to</span> ${link}</p>`,
    );
  }

  if (!lines.length) return "";
  return `<div class="${blockClass}">${lines.join("")}</div>`;
}
