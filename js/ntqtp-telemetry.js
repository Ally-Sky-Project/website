/** Noise-Tolerant Quantum Transport Protocol — payload / redundancy telemetry. */

export const NTQTP_VERSION = "1.7.0b";

export const NTQTP_BEACON_SEED = `ntqtp-beacon-${NTQTP_VERSION}`;

/**
 * @param {string} seed
 */
export function hashSeed(seed) {
  let h1 = 0;
  let h2 = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h1 = (Math.imul(31, h1) + s.charCodeAt(i)) | 0;
    h2 = (Math.imul(17, h2) + s.charCodeAt(i)) | 0;
  }
  return { h1: h1 >>> 0, h2: h2 >>> 0 };
}

/**
 * Seeded ρ ≥ 100 with jitter (stable per publication).
 * @param {string} seed
 */
export function redundancyFactorFromSeed(seed) {
  const { h1, h2 } = hashSeed(seed);
  const base = 100 + (h1 % 120);
  const jitter = (h2 % 1000) / 10;
  return Math.round((base + jitter) * 10) / 10;
}

/**
 * @param {number} bytes
 */
export function formatPayloadSize(bytes) {
  const n = Math.max(0, bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
}

/**
 * @param {object} deck
 */
export function deckPayloadByteLength(deck) {
  const enc = new TextEncoder();
  let total = 0;
  for (const s of deck.slides || []) {
    if (s.type === "id" || s.type === "signature") continue;
    const parts = [s.body, s.subject, s.caption_top, s.caption_bottom];
    if (s.lines?.length) parts.push(s.lines.join("\n"));
    for (const p of parts) {
      if (p) total += enc.encode(p).length;
    }
  }
  return Math.max(1, total);
}

/**
 * Observer-facing frames (title + art + id), aligned with PNG carousel export.
 * @param {object} deck
 */
export function deckObserverFrameCount(deck) {
  return (deck.slides || []).filter((s) => ["title", "art", "id"].includes(s.type)).length;
}

/**
 * @param {object} deck
 * @returns {string[]}
 */
export function deckTelemetryLines(deck) {
  const frames = deckObserverFrameCount(deck);
  const payloadBytes = deckPayloadByteLength(deck);
  const seed = deck.publication_id || deck.id || "untitled";
  const rho = redundancyFactorFromSeed(seed);
  const noiseBytes = Math.ceil(payloadBytes * rho);

  return [
    `> FRAMES:                      ${frames}`,
    `> PAYLOAD SIZE:                ${formatPayloadSize(payloadBytes)}`,
    `> NOISE-TOLERANT PAYLOAD SIZE: ${formatPayloadSize(noiseBytes)}  (ρ = ${rho})`,
  ];
}

/**
 * Beacon channel noise / error tolerance (seeded, stable per build).
 * @param {string} [seed]
 */
export function beaconChannelTelemetry(seed = NTQTP_BEACON_SEED) {
  const { h1, h2 } = hashSeed(seed);
  const rho = redundancyFactorFromSeed(seed);
  const qberExponent = 3 + (h1 % 3);
  const qber = `~10⁻${qberExponent}`;
  const logicalErr = `10⁻${2 + (h2 % 2)}`;
  const effectiveErr = `10⁻${5 + (h1 % 3)}`;
  const noiseBand = h2 % 3 === 0 ? "ELEVATED" : "HIGH";

  return { rho, qber, logicalErr, effectiveErr, noiseBand };
}
