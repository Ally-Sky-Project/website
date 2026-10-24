# allyskyproject.com — NTQTP beacon

Minimal public site: NTQTP beacon home, **transmission registry** (comic publications), privacy page, and outbound channel links from `site.json`.

## Live

- **Production:** https://allyskyproject.com/ (after DNS)
- **GitHub Pages:** https://ally-sky-project.github.io/website/
- **Repo:** https://github.com/Ally-Sky-Project/website

## Deploy

Push to `main` → GitHub Actions → Pages. Custom domain: GitHub Pages settings + Squarespace DNS (apex A → GitHub Pages IPs, `www` CNAME → `ally-sky-project.github.io`).

## Transmissions registry

**URL:** `/transmissions/` — NTQTP transmission registry (Subject, encoding, ID, date, frames, payload, cross-post).

Data comes from `comic/registry.json`. The page shows **one row per story** (latest `published_at` per `gscript` / `deck`); older IDs remain valid at `/{id}/`.

Per-release fields include `reality_layer`, `reconstruction`, `frame_count`, and `payload_bytes` (NTQTP **message** size — same `deckPayloadByteLength` as the composer title slide, not PNG file size). Set on `npm run release` from the compiled deck.

Optional per-release field:

```json
"crosspost": {
  "instagram": "https://…",
  "youtube": "https://…",
  "tiktok": "https://…",
  "github": "https://…"
}
```

## Comic publication IDs

Official releases are listed in `comic/registry.json`. Each comic has an **ID** (`16` hex digest + comic **version** digits), e.g. `ad5ba57c25217bfe1`.

- URL: `https://allyskyproject.com/{id}` — GitHub Pages serves **`404.html`** for unknown paths (comic ID routes); each release also gets `/{id}/index.html`.

Release from monorepo:

```bash
cd comic/slides && npm run release -- stories/….gscript --export
```

Cross-post URLs (optional; carried forward on re-release for the same story unless overridden):

```bash
npm run release -- stories/foo.gscript --export --instagram=https://… --youtube=https://…
```

## Local preview

```bash
node scripts/serve.mjs
```

Open http://127.0.0.1:8080/ — comics at **`http://127.0.0.1:8080/{id}`** (e.g. `/ad5ba57c25217bfe1`).

Plain `python3 -m http.server` does not route `/{id}`; use the Node server above.

## License

Site HTML/CSS: MIT — [LICENSE](LICENSE).
