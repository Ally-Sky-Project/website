function flushLayout() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function fitRuleCharCount(pre, innerPx, char) {
  const budget = Math.max(1, innerPx - 2);
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:absolute;left:0;top:0;visibility:hidden;white-space:pre;pointer-events:none;";

  const cs = getComputedStyle(pre);
  probe.style.font = cs.font;
  probe.style.letterSpacing = cs.letterSpacing;

  pre.appendChild(probe);

  let lo = 4;
  let hi = 200;
  let best = 4;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    probe.textContent = char.repeat(mid);
    const w = probe.getBoundingClientRect().width;
    if (w <= budget) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  probe.remove();
  return best;
}

/**
 * @param {HTMLElement} pre
 * @param {number} [fallbackWidthPx]
 */
export async function measureRuleCounts(pre, fallbackWidthPx) {
  const cs = getComputedStyle(pre);
  const sizePx = parseFloat(cs.fontSize) || 16;
  const fontLoad = `500 ${sizePx}px "Source Code Pro"`;
  await document.fonts.load(fontLoad);
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await flushLayout();

  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  let inner = (pre.clientWidth || pre.offsetWidth) - padL - padR;
  if (inner <= 0 && fallbackWidthPx) {
    inner = fallbackWidthPx - padL - padR;
  }
  inner = Math.max(1, inner);

  return {
    eqCount: fitRuleCharCount(pre, inner, "="),
    dashCount: fitRuleCharCount(pre, inner, "-"),
  };
}

/**
 * @param {string} html
 * @param {{ eqCount: number, dashCount: number }} counts
 */
export function expandRuleLinesInHtml(html, { eqCount, dashCount }) {
  return html
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (/^=+$/.test(t)) return "=".repeat(eqCount);
      if (/^-+$/.test(t)) return "-".repeat(dashCount);
      return line;
    })
    .join("\n");
}

/**
 * @param {HTMLElement} pre
 * @param {number} [fallbackWidthPx]
 */
export async function expandTransmissionRules(pre, fallbackWidthPx) {
  const counts = await measureRuleCounts(pre, fallbackWidthPx);
  pre.textContent = expandRuleLinesInHtml(pre.textContent, counts);
}
