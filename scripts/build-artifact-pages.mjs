#!/usr/bin/env node
/** Static HTML for essay artifacts (no client-side registry fetch required). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  escapeHtml,
  essayAiDisclosureHtml,
  formatArtifactDate,
  proseHtmlFromText,
} from "./artifact-prose.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "artifacts/registry.json");

function readBody(bodyPath) {
  const rel = bodyPath.replace(/^\//, "");
  const filePath = path.join(ROOT, rel);
  return fs.readFileSync(filePath, "utf-8");
}

function essayPageHtml(artifact, bodyText) {
  const title = artifact.title || "Essay";
  const listed = formatArtifactDate(artifact.published_at);
  const article = proseHtmlFromText(bodyText, true) || "<p>—</p>";
  const disclosure = essayAiDisclosureHtml(artifact.ai_disclosure);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Cache-Control" content="no-cache" />
    <meta name="description" content="${escapeHtml(title)}" />
    <title>${escapeHtml(title)} · Ally Sky Project</title>
    <link rel="canonical" href="https://allyskyproject.com/artifacts/${escapeHtml(artifact.id)}/" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Source+Code+Pro:ital,wght@0,500;0,800;1,800&display=block"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/css/beacon.css" />
    <link rel="stylesheet" href="/css/wordmark.css" />
    <link rel="stylesheet" href="/css/site-nav.css" />
    <link rel="stylesheet" href="/css/site-footer.css" />
    <link rel="stylesheet" href="/css/about.css" />
    <link rel="stylesheet" href="/css/artifacts.css" />
  </head>
  <body>
    <div class="beacon beacon--home reader-beacon">
      <div id="site-nav"></div>
      <div class="artifact-layout">
        <div id="app" class="artifact-reader-content">
          <header class="artifact-detail__header artifact-detail__header--essay">
            <p class="artifact-detail__type">ESSAY</p>
            <h1 class="about-page__title">${escapeHtml(title)}</h1>
            <p class="artifact-detail__meta">Listed <code>${escapeHtml(listed)}</code></p>
          </header>
          <div class="about-page artifact-essay">
            <article aria-label="Essay">${article}</article>
            ${disclosure}
          </div>
          <p class="artifact-detail__back"><a href="/artifacts/">← Artifacts</a> · <a href="/">Home</a></p>
        </div>
      </div>
      <div id="site-footer"></div>
    </div>
    <script type="module">
      import { mountSiteNav } from "/js/site-nav.js";
      import { mountSiteFooter } from "/js/site-footer.js";

      mountSiteNav(document.getElementById("site-nav"), "artifacts");
      mountSiteFooter(document.getElementById("site-footer"), { minimal: true });
    </script>
  </body>
</html>
`;
}

function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  let count = 0;

  for (const artifact of registry.artifacts || []) {
    if (artifact.type !== "essay" || !artifact.id || !artifact.body_path) continue;
    const bodyText = readBody(artifact.body_path);
    const outDir = path.join(ROOT, "artifacts", artifact.id);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "index.html");
    fs.writeFileSync(outPath, essayPageHtml(artifact, bodyText));
    console.log(`artifacts/${artifact.id}/index.html (static essay)`);
    count += 1;
  }

  if (!count) console.log("No essay artifacts to build.");
}

main();
