/** Stable slot URLs: /1 → publication id (browser). */

export function storyKey(r) {
  return (r.gscript || r.deck || r.id || "").toLowerCase();
}

export function releasesWithSlots(releases) {
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

export function idForSlotFromReleases(releases, slot) {
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1) return null;
  const hit = releasesWithSlots(releases).find((r) => r.slot === n);
  return hit?.id ?? null;
}

export function hrefForRelease(r) {
  if (r.slot > 0) return `/${r.slot}/`;
  return `/${r.id}/`;
}
