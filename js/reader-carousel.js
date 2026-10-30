/**
 * Comic reader frames: exported carousel PNGs minus the closing id/copyright slide.
 * @param {string[] | undefined | null} carousel
 * @returns {string[]}
 */
export function carouselForReader(carousel) {
  if (!Array.isArray(carousel) || carousel.length === 0) return [];
  if (carousel.length === 1) return [];
  return carousel.slice(0, -1);
}

/**
 * Frames shown in the site reader (excludes trailing signature PNG).
 * @param {string[] | undefined | null} carousel
 * @returns {number}
 */
export function readerFrameCountFromCarousel(carousel) {
  return carouselForReader(carousel).length;
}
