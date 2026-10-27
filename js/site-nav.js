import { NTQTP_VERSION } from "./ntqtp-telemetry.js";

const TABS = [
  { href: "/", label: "Beacon", id: "beacon" },
  { href: "/transmissions/", label: "Transmissions", id: "transmissions" },
  { href: "/about/", label: "About", id: "about" },
];

const GITHUB_ICON = `<svg class="site-nav__github-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;

/**
 * @param {string} activeId
 */
export function renderSiteNav(activeId) {
  const links = TABS.map((tab) => {
    const active = tab.id === activeId ? " is-active" : "";
    return `<a class="site-nav__link${active}" href="${tab.href}">${tab.label}</a>`;
  });
  return `<nav class="site-nav" aria-label="Primary">
    <div class="site-nav__brand-row">
      <a href="/" class="site-nav__brand" id="site-nav-brand" aria-label="Ally Sky Project home"></a>
      <div class="site-nav__meta">
        <button type="button" class="site-nav__stabilize" id="site-nav-stabilize" aria-pressed="false">
          STABILIZE
        </button>
        <span class="site-nav__protocol" title="Noise-Tolerant Quantum Transport Protocol">NTQTP v${NTQTP_VERSION}</span>
        <a
          class="site-nav__github"
          id="site-nav-github"
          href="https://github.com/orgs/Ally-Sky-Project/repositories"
          rel="noopener noreferrer"
          aria-label="Ally Sky Project on GitHub"
        >${GITHUB_ICON}</a>
      </div>
    </div>
    <div class="site-nav__tabs">${links.join("")}</div>
  </nav>`;
}

/**
 * @param {HTMLElement} el
 * @param {string} activeId
 * @param {{ reducedMotion?: boolean }} [opts]
 */
export function mountSiteNav(el, activeId, opts = {}) {
  if (!el) return;
  el.innerHTML = renderSiteNav(activeId);

  fetch("/site.json")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const url = data?.social?.github;
      const link = el.querySelector("#site-nav-github");
      if (link && url) link.href = url;
    })
    .catch(() => {});

  import("./wordmark-glitch.js").then(({ mountWordmarkGlitch, wireStabilizeButton }) => {
    const brand = el.querySelector("#site-nav-brand");
    const stabilizeBtn = el.querySelector("#site-nav-stabilize");
    mountWordmarkGlitch(brand, { reducedMotion: opts.reducedMotion });
    wireStabilizeButton(stabilizeBtn);
  });
}
