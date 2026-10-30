#!/usr/bin/env node
/**
 * Build feed.xml from comic/registry.json (Atom 1.0).
 * Usage: node scripts/build-rss.mjs [-o feed.xml]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dedupeReleases } from "../js/transmissions.js";
import { hrefForRelease } from "../js/transmission-slots.js";
import { encodingLines, formatFrameCount, formatMessagePayload } from "../js/encoding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "comic/registry.json");

const SITE_URL = (process.env.SITE_URL || "https://allyskyproject.com").replace(/\/$/, "");
const FEED_TITLE = "Ally Sky Project Transmissions";
const FEED_ID = `${SITE_URL}/transmissions/`;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemSummary(release) {
  const lines = encodingLines(release);
  const parts = [];
  if (lines.length) parts.push(lines.join(" · "));
  const frames = formatFrameCount(release);
  if (frames !== "—") parts.push(`${frames} frames`);
  const payload = formatMessagePayload(release);
  if (payload !== "—") parts.push(`payload ${payload}`);
  parts.push(`ID ${release.id}`);
  return parts.join(" · ") || release.title || "Transmission";
}

function buildAtom(registry) {
  const rows = dedupeReleases(registry.releases || []).sort(
    (a, b) => Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0),
  );

  const updated =
    rows[0]?.published_at || registry.updated_at || new Date().toISOString();

  const entries = rows
    .map((r) => {
      const id = r.id || "";
      const link = `${SITE_URL}${hrefForRelease(r)}`;
      const title = r.title || "Untitled";
      const published = r.published_at || updated;
      const summary = itemSummary(r);
      return `  <entry>
    <title>${escapeXml(title)}</title>
    <link href="${escapeXml(link)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(link)}</id>
    <published>${escapeXml(published)}</published>
    <updated>${escapeXml(published)}</updated>
    <summary type="text">${escapeXml(summary)}</summary>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(FEED_TITLE)}</title>
  <link href="${escapeXml(FEED_ID)}" rel="alternate" type="text/html"/>
  <link href="${escapeXml(SITE_URL)}/feed.xml" rel="self" type="application/atom+xml"/>
  <id>${escapeXml(FEED_ID)}</id>
  <updated>${escapeXml(updated)}</updated>
  <subtitle>New NTQTP transmissions (one entry per story, latest publication ID).</subtitle>
  <author>
    <name>Ally Sky Project</name>
  </author>
${entries}
</feed>
`;
}

function parseArgs(argv) {
  let out = path.join(ROOT, "feed.xml");
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "-o" || a === "--output") out = path.resolve(rest.shift() || "");
    else if (!a.startsWith("-")) out = path.resolve(a);
  }
  return out;
}

function main() {
  const outPath = parseArgs(process.argv.slice(2));
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  const xml = buildAtom(registry);
  fs.writeFileSync(outPath, xml);
  const n = dedupeReleases(registry.releases || []).length;
  console.log(`Wrote ${outPath} (${n} feed entr${n === 1 ? "y" : "ies"})`);
}

main();
