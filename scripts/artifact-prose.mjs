/** Shared essay prose HTML (build + optional tests). */

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

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

export function essayAiDisclosureHtml(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  return `<section class="about-disclosure" aria-labelledby="artifact-ai-disclosure">
    <h2 id="artifact-ai-disclosure">AI Disclosure</h2>
    <p>${escapeHtml(t)}</p>
  </section>`;
}

export function proseHtmlFromText(raw, aboutStyle = false) {
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

export function formatArtifactDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}
