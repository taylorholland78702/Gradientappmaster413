// Watercolor wash: soft translucent blobs alpha-composited over a paper-white
// base. Unlike Splotches (hard edge, single winner-takes-pixel), every blob
// contributes here -- overlapping regions pool into darker/more saturated
// color through repeated alpha blending, and edges fade out over a wide
// band instead of cutting off, which is what reads as "bleeding" pigment
// rather than a painted shape.
export function drawWatercolor(P: any): CanvasGradient | undefined {
  const {
    ctx, centerX, centerY, displayWidth, displayHeight, zoom,
    gradientColors, putScaledImageData,
    watercolorAnimTime, watercolorBlobCount, watercolorBleedRadius, watercolorOpacity,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel,
  } = P;

  const audioActive = isAudioEnabled && isAudioReactive;
  const sizeBoost = audioActive ? 1 + (audioSubBassLevel / 5) * 0.5 : 1;
  const driftBoost = audioActive ? 1 + (audioMidsLevel / 5) * 1.2 : 1;

  const t = watercolorAnimTime * driftBoost;
  const numBlobs = Math.max(2, Math.min(Math.round(watercolorBlobCount), 20));
  const baseRadius = Math.min(displayWidth, displayHeight) * (0.12 + watercolorBleedRadius) * sizeBoost;

  const blobs: Array<{ x: number; y: number; r: number; jitter: number; color: { r: number; g: number; b: number } }> = [];
  for (let i = 0; i < numBlobs; i++) {
    const angle = (i / numBlobs) * Math.PI * 2 + t * (0.06 + (i % 4) * 0.02);
    const orbitR = 0.18 + 0.25 * Math.sin(t * 0.1 + i * 2.1);
    const color = gradientColors[i % gradientColors.length] || { r: 200, g: 200, b: 220 };
    blobs.push({
      x: centerX + displayWidth * orbitR * Math.cos(angle),
      y: centerY + displayHeight * orbitR * Math.sin(angle * 0.75 + t * 0.04),
      r: baseRadius * (0.7 + 0.4 * Math.sin(i * 1.9 + t * 0.08)),
      jitter: i * 7.11,
      color,
    });
  }

  const scaleF = 1 / zoom;
  const out = ctx.createImageData(displayWidth, displayHeight);
  const d = out.data;
  // Off-white "paper" base rather than pure white or black -- reads as a
  // painted surface, and keeps very light palette colors from disappearing.
  const paper = { r: 246, g: 242, b: 233 };

  for (let y = 0; y < displayHeight; y++) {
    for (let x = 0; x < displayWidth; x++) {
      const px = centerX + (x - centerX) * scaleF;
      const py = centerY + (y - centerY) * scaleF;

      let r = paper.r, g = paper.g, b = paper.b;

      for (let i = 0; i < blobs.length; i++) {
        const bl = blobs[i];
        const dx = px - bl.x;
        const dy = py - bl.y;
        const ang = Math.atan2(dy, dx);
        // Mild edge jitter so the feathered boundary isn't a perfect circle.
        const wobble = 1 + 0.08 * Math.sin(ang * 4 + bl.jitter);
        const dist = Math.sqrt(dx * dx + dy * dy) / wobble;
        if (dist >= bl.r * 1.4) continue;
        // Smooth falloff from full opacity at the core to zero at the outer
        // bleed edge -- this wide, soft band is what makes it read as
        // feathered pigment rather than a hard-edged splotch.
        const innerR = bl.r * 0.35;
        const outerR = bl.r * 1.4;
        const tNorm = Math.min(1, Math.max(0, (dist - innerR) / (outerR - innerR)));
        const falloff = 1 - tNorm * tNorm * (3 - 2 * tNorm); // smoothstep, inverted
        const alpha = falloff * watercolorOpacity;
        if (alpha <= 0.002) continue;
        r = r * (1 - alpha) + bl.color.r * alpha;
        g = g * (1 - alpha) + bl.color.g * alpha;
        b = b * (1 - alpha) + bl.color.b * alpha;
      }

      const idx = (y * displayWidth + x) * 4;
      d[idx] = Math.round(Math.min(255, Math.max(0, r)));
      d[idx + 1] = Math.round(Math.min(255, Math.max(0, g)));
      d[idx + 2] = Math.round(Math.min(255, Math.max(0, b)));
      d[idx + 3] = 255;
    }
  }

  putScaledImageData(out);
  return undefined;
}
