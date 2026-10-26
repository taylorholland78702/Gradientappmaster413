// A look is made on a desktop-sized canvas, so anything measured in pixels (the size of a dot, a cell, a tile, a ring)
// is set against that. On a phone the same pixels are a far bigger share of the picture, so a preset made on a
// desktop came out coarse and out of proportion. These scale such sizes with the canvas, down only: a canvas the
// size of a desktop window or larger keeps the sizes exactly as set.
export const REFERENCE_CANVAS_SIZE = 1000; // square root of the canvas area, in CSS pixels

export function canvasSizeScale(width: number, height: number): number {
  const root = Math.sqrt(Math.max(1, width) * Math.max(1, height));
  return Math.min(1, Math.max(0.35, root / REFERENCE_CANVAS_SIZE));
}

// The settings measured in pixels, and the smallest value each may be scaled down to.
export const PIXEL_SIZED_SETTINGS: Record<string, number> = {
  pixelSize: 2, halftoneSize: 2, triangleSize: 6, asciiSize: 6, emojiSize: 8,
  tilingSize: 20, truchetSize: 10, concentricRingWidth: 6, ditherScale: 1,
};

// Row and column counts are laid out for the screen's shape: a 30 x 10 grid made on a landscape screen is a 10 x 30
// grid for the same picture on a portrait one. A saved look remembers the shape it was made on (landscape if it
// predates that), and swaps rows and columns when it is opened on the other shape.
export function orientedGrid(
  look: { gridRows?: number; gridColumns?: number; canvasAspect?: number },
  nowLandscape: boolean,
): { rows: number | undefined; columns: number | undefined } {
  const savedLandscape = (look.canvasAspect ?? 1.6) >= 1;
  return savedLandscape === nowLandscape
    ? { rows: look.gridRows, columns: look.gridColumns }
    : { rows: look.gridColumns, columns: look.gridRows };
}
