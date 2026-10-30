#!/usr/bin/env node
/** Canonical /1 /2 /3 … reader pages; /{publication-id}/ → slot redirect. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry, releasesWithSlots } from "./transmission-slots.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ID_PAGE_TEMPLATE = path.join(ROOT, "comic/id-page.html");

function redirectIndexHtml(url) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${url}" />
    <link rel="canonical" href="${url}" />
    <title>Redirect</title>
    <script>location.replace("${url}");</script>
  </head>
  <body>
    <p><a href="${url}">Continue to transmission</a></p>
  </body>
</html>
`;
}

function main() {
  const readerHtml = fs.readFileSync(ID_PAGE_TEMPLATE, "utf-8");
  const registry = loadRegistry();
  const rows = releasesWithSlots(registry.releases || []);

  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (/^\d+$/.test(ent.name)) {
      fs.rmSync(path.join(ROOT, ent.name), { recursive: true, force: true });
    }
  }

  for (const r of rows) {
    const slotUrl = `/${r.slot}/`;
    const slotDir = path.join(ROOT, String(r.slot));
    fs.mkdirSync(slotDir, { recursive: true });
    fs.writeFileSync(path.join(slotDir, "index.html"), readerHtml);
    console.log(`/${r.slot}/ reader (canonical)`);

    for (const variant of Object.values(r.reconstruction_variants || {})) {
      if (!variant?.path) continue;
      const variantPath = variant.path.replace(/\/$/, "");
      const variantRel = variantPath.startsWith("/") ? variantPath.slice(1) : variantPath;
      const variantDir = path.join(ROOT, ...variantRel.split("/"));
      fs.mkdirSync(variantDir, { recursive: true });
      fs.writeFileSync(path.join(variantDir, "index.html"), readerHtml);
      console.log(`${variant.path} reader (${variant.label || "variant"})`);
    }

    const idDir = path.join(ROOT, r.id);
    fs.mkdirSync(idDir, { recursive: true });
    fs.writeFileSync(path.join(idDir, "index.html"), redirectIndexHtml(slotUrl));
    console.log(`/${r.id}/ → ${slotUrl}`);
  }
}

main();
