// Paint splotches: hard-edged organic blobs with a darker "wet paint" rim,
// each a flat color from the active palette. Edge shape is perturbed with a
// sum-of-sines pseudo-noise (same cheap-trig-noise approach as drawMarble's
// turbulence) driven by the angle around each blob's center, instead of a
// perfect circle -- that's what reads as a splotch rather than a dot.
export function drawSplotches(P: any): CanvasGradient | undefined {
  const {
    ctx, centerX, centerY, displayWidth, displayHeight, zoom,
    gradientColors, putScaledImageData,
    splotchesAnimTime, splotchCount, splotchSize, splotchEdgeRoughness,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel,
  } = P;

  const audioActive = isAudioEnabled && isAudioReactive;
  const bassBoost = audioActive ? 1 + (audioSubBassLevel / 5) * 0.6 : 1;
  const driftBoost = audioActive ? 1 + (audioMidsLevel / 5) * 1.5 : 1;

  const t = splotchesAnimTime * driftBoost;
  const numSplotches = Math.max(2, Math.min(Math.round(splotchCount), 20));
  const baseRadius = Math.min(displayWidth, displayHeight) * splotchSize * bassBoost;

  const splotches: Array<{ x: number; y: number; r: number; seed: number; color: { r: number; g: number; b: number } }> = [];
  for (let i = 0; i < numSplotches; i++) {
    const angle = (i / numSplotches) * Math.PI * 2 + t * (0.08 + (i % 3) * 0.03);
    const orbitR = 0.2 + 0.22 * Math.sin(t * 0.15 + i * 1.7);
    const color = gradientColors[i % gradientColors.length] || { r: 255, g: 255, b: 255 };
    splotches.push({
      x: centerX + displayWidth * orbitR * Math.cos(angle),
      y: centerY + displayHeight * orbitR * Math.sin(angle * 0.8 + t * 0.05),
      r: baseRadius * (0.6 + 0.5 * Math.sin(i * 2.3 + t * 0.1)),
      seed: i * 13.37,
      color,
    });
  }

  const scaleF = 1 / zoom;
  const out = ctx.createImageData(displayWidth, displayHeight);
  const d = out.data;

  for (let y = 0; y < displayHeight; y++) {
    for (let x = 0; x < displayWidth; x++) {
      const px = centerX + (x - centerX) * scaleF;
      const py = centerY + (y - centerY) * scaleF;

      let bestDist = Infinity;
      let winner = -1;
      let winnerEdge = 0;

      for (let i = 0; i < splotches.length; i++) {
        const s = splotches[i];
        const dx = px - s.x;
        const dy = py - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx);
        // Perturb the blob's boundary radius as a function of angle so it
        // reads as an irregular splotch outline rather than a perfect circle.
        const wobble = 1 + splotchEdgeRoughness * (
          0.5 * Math.sin(ang * 3 + s.seed) +
          0.3 * Math.sin(ang * 5 - s.seed * 1.3) +
          0.2 * Math.sin(ang * 8 + s.seed * 0.7)
        );
        const edge = s.r * Math.max(0.2, wobble);
        const normalized = dist - edge;
        if (normalized < bestDist) {
          bestDist = normalized;
          winner = i;
          winnerEdge = edge;
        }
      }

      const idx = (y * displayWidth + x) * 4;
      if (winner >= 0 && bestDist <= 0) {
        const s = splotches[winner];
        // Darken a thin band just inside the edge for a "wet paint" rim.
        const rimWidth = Math.max(2, winnerEdge * 0.08);
        const rimT = Math.min(1, Math.max(0, -bestDist / rimWidth));
        const shade = 0.55 + 0.45 * rimT; // darker right at the edge, full color toward center
        d[idx] = Math.round(s.color.r * shade);
        d[idx + 1] = Math.round(s.color.g * shade);
        d[idx + 2] = Math.round(s.color.b * shade);
        d[idx + 3] = 255;
      } else {
        d[idx] = 8;
        d[idx + 1] = 8;
        d[idx + 2] = 10;
        d[idx + 3] = 255;
      }
    }
  }

  putScaledImageData(out);
  return undefined;
}
