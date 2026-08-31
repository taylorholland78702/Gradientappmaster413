import { DEG_TO_RAD } from '../../constants/gradientEffects';

// Ellsworth Kelly / Blinky Palermo / Robert Mangold: flat, unblended color
// panels meeting at a hard edge — the one gradient in this app that
// deliberately avoids blending. Split direction reuses the shared
// gradientAngle control instead of a dedicated slider.
export function drawColorField(P: any): CanvasGradient | undefined {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    gradientColors,
    gradientAngle,
    isAudioEnabled,
    isAudioReactive,
    audioSubBassLevel,
    audioTrebleLevel,
    colorFieldPanels,
    colorFieldDrift,
    colorFieldPulse,
  } = P;
  let gradient: CanvasGradient | undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;
  if (!gradientColors || gradientColors.length === 0) return gradient;

  const panels = Math.max(2, Math.round(colorFieldPanels));
  const cx = displayWidth / 2;
  const cy = displayHeight / 2;
  const diag = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight);
  const audioActive = isAudioEnabled && isAudioReactive;
  // Bass nudges each boundary slightly out of true — a hand-set, slightly
  // off-grid feel rather than a rigid mechanical split. Treble lifts every
  // panel toward white together as one unified pulse (not per-panel
  // flicker), so the flat-field read stays intact.
  const driftPx = audioActive ? colorFieldDrift * audioSubBassLevel * diag * 0.06 : 0;
  const pulse = audioActive ? colorFieldPulse * audioTrebleLevel * 0.35 : 0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(gradientAngle * DEG_TO_RAD);
  const panelWidth = (2 * diag) / panels;
  for (let i = 0; i < panels; i++) {
    const startOffset = Math.sin(i * 2.4) * driftPx;
    const endOffset = Math.sin((i + 1) * 2.4) * driftPx;
    const xStart = -diag + i * panelWidth + startOffset;
    const xEnd = -diag + (i + 1) * panelWidth + endOffset;
    const color = gradientColors[i % gradientColors.length];
    if (!color) continue;
    const r = Math.round(color.r + (255 - color.r) * pulse);
    const g = Math.round(color.g + (255 - color.g) * pulse);
    const b = Math.round(color.b + (255 - color.b) * pulse);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    // +1px overlap so adjacent panels never leave a hairline seam from
    // sub-pixel rounding on the rotated fill.
    ctx.fillRect(xStart, -diag, (xEnd - xStart) + 1, 2 * diag);
  }
  ctx.restore();

  return gradient;
}
