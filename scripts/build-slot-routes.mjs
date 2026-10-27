#!/usr/bin/env node
/** Generate /1/index.html, /2/index.html, … → canonical /{id}/ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry, releasesWithSlots } from "./transmission-slots.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function slotIndexHtml(id) {
  const url = `/${id}/`;
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
  const registry = loadRegistry();
  const rows = releasesWithSlots(registry.releases || []);

  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (/^\d+$/.test(ent.name)) {
      fs.rmSync(path.join(ROOT, ent.name), { recursive: true, force: true });
    }
  }

  for (const r of rows) {
    const dir = path.join(ROOT, String(r.slot));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), slotIndexHtml(r.id));
    console.log(`/${r.slot}/ → /${r.id}/`);
  }
}

main();
