/**
 * Light channel routing footer (legal + policy, lore-neutral).
 * @param {{ minimal?: boolean }} [opts]
 */
export function renderSiteFooter(opts = {}) {
  const minimal = Boolean(opts.minimal);
  const parts = [
    `<a class="site-footer__link" href="/about/">About</a>`,
    `<a class="site-footer__link" href="/legal/privacy.html">Privacy transmission</a>`,
  ];
  if (!minimal) {
    parts.push(
      `<a class="site-footer__link" href="/feed.xml">RSS</a>`,
    );
    parts.push(`<a class="site-footer__link" href="/LICENSE">Site (MIT)</a>`);
  }
  parts.push(`<span class="site-footer__copy">© 2026 Ally Sky Project</span>`);

  const body = parts
    .map((p) => `<span class="site-footer__item">${p}</span>`)
    .join(`<span class="site-footer__sep" aria-hidden="true">·</span>`);

  return `<footer class="site-footer" aria-label="Channel routing">
    <p class="site-footer__line"><span class="site-footer__prefix">&gt; ROUTING:</span> ${body}</p>
  </footer>`;
}

/**
 * @param {HTMLElement | null} el
 * @param {{ minimal?: boolean }} [opts]
 */
export function mountSiteFooter(el, opts = {}) {
  if (!el) return;
  el.innerHTML = renderSiteFooter(opts);
}
