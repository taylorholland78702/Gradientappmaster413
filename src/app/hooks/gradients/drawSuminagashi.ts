// Suminagashi (paper marbling): concentric color rings from center, repeatedly
// domain-warped by a flow-noise field (sum-of-sines pseudo-noise, same
// cheap-trig-noise approach as drawMarble's turbulence) so the rings stretch
// into fine thread-like swirls instead of staying perfect circles. Each
// comb pass adds one more layer of warping -- more passes reads as finer,
// more tangled threading.
export function drawSuminagashi(P: any): CanvasGradient | undefined {
  const {
    ctx, centerX, centerY, displayWidth, displayHeight, zoom,
    gradientColors, putScaledImageData,
    suminagashiAnimTime, suminagashiRingCount, suminagashiCombPasses, suminagashiCombStrength,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel,
  } = P;

  const audioActive = isAudioEnabled && isAudioReactive;
  const strengthBoost = audioActive ? 1 + (audioSubBassLevel / 5) * 0.6 : 1;
  const driftBoost = audioActive ? 1 + (audioMidsLevel / 5) * 1.2 : 1;

  const t = suminagashiAnimTime * driftBoost;
  const passes = Math.max(1, Math.min(Math.round(suminagashiCombPasses), 6));
  const rings = Math.max(3, Math.min(Math.round(suminagashiRingCount), 12));
  const strength = suminagashiCombStrength * strengthBoost;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY) || 1;
  const ringWidth = maxDist / rings;

  const scaleF = 1 / zoom;
  const out = ctx.createImageData(displayWidth, displayHeight);
  const d = out.data;

  for (let y = 0; y < displayHeight; y++) {
    for (let x = 0; x < displayWidth; x++) {
      let wx = centerX + (x - centerX) * scaleF;
      let wy = centerY + (y - centerY) * scaleF;

      for (let p = 0; p < passes; p++) {
        const freq = 0.006 + p * 0.003;
        const phase = t + p * 1.7;
        const angle = Math.sin(wx * freq + phase) * Math.PI + Math.cos(wy * freq * 0.85 - phase * 0.6) * Math.PI;
        const dispMag = strength * (14 + p * 6);
        wx += Math.cos(angle) * dispMag * 0.05;
        wy += Math.sin(angle) * dispMag * 0.05;
      }

      const dx = wx - centerX;
      const dy = wy - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ringIdx = Math.floor(dist / ringWidth);
      const color = gradientColors[((ringIdx % gradientColors.length) + gradientColors.length) % gradientColors.length] || { r: 255, g: 255, b: 255 };
      // Subtle shimmer along the thread direction so bands don't read flat.
      const shimmer = 0.82 + 0.18 * Math.sin(dist * 0.25 + t * 0.5);

      const idx = (y * displayWidth + x) * 4;
      d[idx] = Math.round(Math.min(255, color.r * shimmer));
      d[idx + 1] = Math.round(Math.min(255, color.g * shimmer));
      d[idx + 2] = Math.round(Math.min(255, color.b * shimmer));
      d[idx + 3] = 255;
    }
  }

  putScaledImageData(out);
  return undefined;
}
