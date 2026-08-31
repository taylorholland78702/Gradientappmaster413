// Simulates raised, textured brushwork: treats local luminance as a height
// field (a brighter/higher-contrast area reads as a thicker daub of paint),
// derives a surface normal from it via a Sobel gradient, then relights each
// pixel against that normal with a directional light — the same "bump map"
// trick a 3D renderer uses for a normal-mapped surface, just computed
// straight from the image instead of an authored texture. That's what
// actually reads as "depth": flat color alone can look painterly (see Oil
// Paint), but only simulated relief + light/shadow reads as raised paint.
export function impastoPixels(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  strength: number,
  lightAngleDeg: number,
): void {
  if (w < 3 || h < 3) return;

  // Luminance height field, computed once so the Sobel pass below doesn't
  // recompute it 9x per pixel.
  const lum = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    lum[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
  }

  const at = (x: number, y: number): number => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return lum[cy * w + cx];
  };

  const lightRad = (lightAngleDeg * Math.PI) / 180;
  // Raking light — low elevation reads as a stronger, more directional
  // relief than a light aimed straight down would.
  const lx = Math.cos(lightRad);
  const ly = Math.sin(lightRad);
  const lz = 0.55;
  const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const Lx = lx / lLen, Ly = ly / lLen, Lz = lz / lLen;
  // Viewer straight on, for the specular half-vector below.
  const Hx = Lx, Hy = Ly, Hz = (Lz + 1) / Math.sqrt(Lx * Lx + Ly * Ly + (Lz + 1) * (Lz + 1));

  const ambient = 0.4;
  const src = data.slice();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Sobel gradient of the height field — dz/dx and dz/dy.
      const gx =
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) -
        (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const gy =
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) -
        (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));

      // Surface normal from the height gradient — steeper edges tilt the
      // normal further from straight-up, which is what catches or loses
      // the light.
      let nx = -gx * strength;
      let ny = -gy * strength;
      let nz = 1;
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= nLen; ny /= nLen; nz /= nLen;

      const diffuse = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
      const specDot = Math.max(0, nx * Hx + ny * Hy + nz * Hz);
      const specular = Math.pow(specDot, 28) * 0.5;
      const shade = ambient + diffuse * (1 - ambient);

      const i = (y * w + x) * 4;
      data[i] = Math.min(255, src[i] * shade + 255 * specular);
      data[i + 1] = Math.min(255, src[i + 1] * shade + 255 * specular);
      data[i + 2] = Math.min(255, src[i + 2] * shade + 255 * specular);
    }
  }
}
