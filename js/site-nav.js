const TABS = [
  { href: "/", label: "Beacon", id: "beacon" },
  { href: "/transmissions/", label: "Transmissions", id: "transmissions" },
];

export function renderSiteWordmark() {
  return `<a href="/" class="site-nav__brand">
    <span class="wordmark wordmark--site-nav" aria-hidden="true">
      <span class="wordmark__line">
        <span class="wordmark__layer wordmark__layer--bottom">Ally Sky Project</span>
        <span class="wordmark__layer wordmark__layer--top">Ally Sky Project</span>
      </span>
    </span>
    <span class="visually-hidden">Ally Sky Project</span>
  </a>`;
}

/**
 * @param {string} activeId
 */
export function renderSiteNav(activeId) {
  const links = TABS.map((tab) => {
    const active = tab.id === activeId ? " is-active" : "";
    return `<a class="site-nav__link${active}" href="${tab.href}">${tab.label}</a>`;
  });
  return `<nav class="site-nav" aria-label="Primary">
    ${renderSiteWordmark()}
    <div class="site-nav__tabs">${links.join("")}</div>
  </nav>`;
}

/**
 * @param {HTMLElement} el
 * @param {string} activeId
 */
export function mountSiteNav(el, activeId) {
  if (!el) return;
  el.innerHTML = renderSiteNav(activeId);
}
