/** Canonical slot URLs /1 /2 /3 … (Node). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REGISTRY_PATH = path.join(__dirname, "../comic/registry.json");

/**
 * @param {object} r
 */
export function storyKey(r) {
  return (r.gscript || r.deck || r.id || "").toLowerCase();
}

/**
 * @param {object[]} releases
 */
export function releasesWithSlots(releases) {
  /** @type {Map<string, object>} */
  const byStory = new Map();
  for (const r of releases || []) {
    if (!r.slot || r.slot < 1) continue;
    const key = storyKey(r);
    if (!key) continue;
    const prev = byStory.get(key);
    if (!prev) {
      byStory.set(key, r);
      continue;
    }
    const t = Date.parse(r.published_at || 0);
    const pt = Date.parse(prev.published_at || 0);
    if (t >= pt) byStory.set(key, r);
  }
  return [...byStory.values()].sort((a, b) => a.slot - b.slot);
}

/**
 * @param {object} registry
 * @param {number} slot
 */
export function idForSlot(registry, slot) {
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1) return null;
  const hit = releasesWithSlots(registry.releases || []).find((r) => r.slot === n);
  return hit?.id ?? null;
}

/**
 * @param {object} registry
 * @param {string} id
 */
export function slotForId(registry, id) {
  const needle = String(id || "").toLowerCase();
  if (!needle) return null;
  const hit = (registry.releases || []).find((r) => r.id?.toLowerCase() === needle);
  return hit?.slot > 0 ? hit.slot : null;
}

export function loadRegistry(filePath = REGISTRY_PATH) {
  if (!fs.existsSync(filePath)) return { releases: [] };
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * @param {object} registry
 */
export function nextSlot(registry) {
  const slots = (registry.releases || []).map((r) => r.slot).filter((s) => s > 0);
  return slots.length ? Math.max(...slots) + 1 : 1;
}

/**
 * @param {object} registry
 * @param {string} gscriptRel
 * @param {string} comicId
 */
export function resolveSlot(registry, gscriptRel, comicId) {
  const key = gscriptRel.toLowerCase();
  for (const r of registry.releases || []) {
    if (r.slot && storyKey(r) === key) return r.slot;
  }
  const byId = (registry.releases || []).find((r) => r.id === comicId && r.slot);
  if (byId) return byId.slot;
  return nextSlot(registry);
}
