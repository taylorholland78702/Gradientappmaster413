import { DEG_TO_RAD } from '../../constants/gradientEffects';

// Donald Judd: identical units at precise, regular intervals, each one a
// hard-cornered flat-color bar — no gradient, no glow, no per-bar
// randomness beyond which third of the stack (and so which audio band)
// it belongs to. With audio off this renders as a static, unchanging
// stack, same as Judd's own wall pieces; Response is what turns it into
// an equalizer. Orientation reuses the shared gradientAngle control.
export function drawStack(P: any): CanvasGradient | undefined {
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
    audioMidsLevel,
    audioTrebleLevel,
    stackCount,
    stackGap,
    stackWidth,
    stackResponse,
  } = P;
  let gradient: CanvasGradient | undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;
  if (!gradientColors || gradientColors.length === 0) return gradient;

  const count = Math.max(2, Math.round(stackCount));
  const gap = Math.min(0.8, Math.max(0, stackGap));
  const widthMult = Math.max(0.1, stackWidth ?? 1);
  const cx = displayWidth / 2;
  const cy = displayHeight / 2;
  const diag = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight);
  const audioActive = isAudioEnabled && isAudioReactive;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(gradientAngle * DEG_TO_RAD);
  const unitWidth = (2 * diag) / count;
  // Width scales the gap-derived bar thickness independently — clamped
  // just under a full unit so adjacent bars can get close/touching at
  // high Width without ever fully erasing the gaps between them.
  const barWidth = Math.min(unitWidth * 0.98, unitWidth * (1 - gap) * widthMult);
  const baseHalfLength = diag * 0.28;
  const third = count / 3;
  for (let i = 0; i < count; i++) {
    // First third responds to sub-bass, middle third to mids, last third
    // to treble — a cheap stand-in for the per-bin frequency spectrum a
    // real equalizer reads, since this app only tracks three bands.
    const bandLevel = audioActive
      ? (i < third ? audioSubBassLevel : i < third * 2 ? audioMidsLevel : audioTrebleLevel)
      : 0;
    const halfLength = baseHalfLength * (1 + stackResponse * bandLevel);
    const xCenter = -diag + (i + 0.5) * unitWidth;
    const color = gradientColors[i % gradientColors.length];
    if (!color) continue;
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(xCenter - barWidth / 2, -halfLength, barWidth, halfLength * 2);
  }
  ctx.restore();

  return gradient;
}
