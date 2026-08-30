import { getScratchImageData } from '../../utils/scratchCanvas';
import { hash2 } from '../../utils/valueNoise';
import { makeDownscaleCapture } from '../../utils/downscaleCapture';

const dc = makeDownscaleCapture(640);

// Planar faceting: a jittered-grid Voronoi (each grid cell's seed point is
// nudged off-center by a per-cell hash, cheap O(9) nearest-seed lookup
// instead of a true unbounded Voronoi) carves the canvas into irregular
// polygons. Each facet resamples the source offset from its own position
// and gets its own flat brightness multiplier — like light catching
// different planes of a faceted surface — with a darkened seam between
// facets standing in for the hard edge between planes.
export function applyCubism(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, cubismFacetSize, cubismOffset, ctx, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { w, h } = dc.getWorkingSize(displayWidth, displayHeight);
  const src = dc.capture(canvas, w, h);
  const s = src.data;
  const out = getScratchImageData('cubism', ctx, w, h);
  const o = out.data;

  const cellSize = Math.max(4, cubismFacetSize);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);

      // Nearest jittered seed among the 3x3 surrounding grid cells —
      // whichever cell wins identifies this pixel's facet, and the gap
      // between the best and second-best distance tells us how close we
      // are to that facet's edge.
      let bestDist = Infinity, bestGx = gx, bestGy = gy, secondDist = Infinity;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const ngx = gx + ox, ngy = gy + oy;
          const seedX = (ngx + 0.5 + (hash2(ngx, ngy) - 0.5) * 0.8) * cellSize;
          const seedY = (ngy + 0.5 + (hash2(ngx + 91, ngy + 91) - 0.5) * 0.8) * cellSize;
          const dx = x - seedX, dy = y - seedY;
          const d = dx * dx + dy * dy;
          if (d < bestDist) { secondDist = bestDist; bestDist = d; bestGx = ngx; bestGy = ngy; }
          else if (d < secondDist) { secondDist = d; }
        }
      }

      const jitterX = (hash2(bestGx + 500, bestGy + 500) - 0.5) * 2 * cubismOffset * cellSize;
      const jitterY = (hash2(bestGx + 900, bestGy + 900) - 0.5) * 2 * cubismOffset * cellSize;
      const sx = Math.max(0, Math.min(w - 1, Math.round(x + jitterX)));
      const sy = Math.max(0, Math.min(h - 1, Math.round(y + jitterY)));
      const si = (sy * w + sx) * 4;

      // Flat per-facet shading — different planes catch light differently.
      const shade = 0.8 + hash2(bestGx + 1300, bestGy + 1300) * 0.4;

      // Seam darkening — the closer the two nearest seeds' distances are,
      // the nearer this pixel is to the facet boundary.
      const edgeGap = Math.sqrt(secondDist) - Math.sqrt(bestDist);
      const seam = edgeGap < cellSize * 0.06 ? 1 - edgeGap / (cellSize * 0.06) : 0;
      const mul = shade * (1 - seam * 0.55);

      const i = (y * w + x) * 4;
      o[i] = s[si] * mul;
      o[i + 1] = s[si + 1] * mul;
      o[i + 2] = s[si + 2] * mul;
      o[i + 3] = 255;
    }
  }

  putLowResImageData(out);
}
