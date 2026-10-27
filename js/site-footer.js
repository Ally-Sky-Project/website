/**
 * Site footer (copyright, colophon, channel links).
 * @param {{ minimal?: boolean }} [opts]
 */
export function renderSiteFooter(opts = {}) {
  const minimal = Boolean(opts.minimal);
  const parts = [
    `<span class="site-footer__copy">© 2026 The Ally Sky Project</span>`,
    `<span class="site-footer__tagline">Built with human hands &amp; computational pipelines.</span>`,
    `<a class="site-footer__link" href="/about/#about-colophon">About / Colophon</a>`,
    `<a class="site-footer__link" href="/legal/privacy.html">Privacy transmission</a>`,
  ];
  if (!minimal) {
    parts.push(`<a class="site-footer__link" href="/feed.xml">RSS</a>`);
    parts.push(`<a class="site-footer__link" href="/LICENSE">Site (MIT)</a>`);
  }

  const body = parts
    .map((p) => `<span class="site-footer__item">${p}</span>`)
    .join(`<span class="site-footer__sep" aria-hidden="true">·</span>`);

  return `<footer class="site-footer" aria-label="Site footer">
    <p class="site-footer__line">${body}</p>
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
