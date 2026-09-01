import { DEG_TO_RAD } from '../../constants/gradientEffects';

// Sol LeWitt: a wall drawing reduced to its own instructions — 1-4 layers
// of straight parallel lines, each layer one fixed direction evenly spread
// around the shared Angle control, each layer one color. Density (line
// spacing), not color or position, is what audio is allowed to touch.
export function drawHatch(P: any): CanvasGradient | undefined {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    gradientColors,
    gradientAngle,
    isAudioEnabled,
    isAudioReactive,
    audioMidsLevel,
    hatchLayers,
    hatchSpacing,
    hatchResponse,
  } = P;
  let gradient: CanvasGradient | undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;
  if (!gradientColors || gradientColors.length === 0) return gradient;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  const layers = Math.min(4, Math.max(1, Math.round(hatchLayers)));
  const cx = displayWidth / 2;
  const cy = displayHeight / 2;
  const diag = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight);
  const audioActive = isAudioEnabled && isAudioReactive;
  // Mids tighten the spacing (denser hatching) rather than moving or
  // recoloring anything — the one place audio is allowed to act.
  const spacingMod = audioActive ? 1 - Math.min(0.6, hatchResponse * audioMidsLevel * 0.6) : 1;
  const spacing = Math.max(3, hatchSpacing * spacingMod);

  for (let layer = 0; layer < layers; layer++) {
    const angle = gradientAngle + layer * (180 / layers);
    const color = gradientColors[layer % gradientColors.length];
    if (!color) continue;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle * DEG_TO_RAD);
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = -diag; x <= diag; x += spacing) {
      ctx.moveTo(x, -diag);
      ctx.lineTo(x, diag);
    }
    ctx.stroke();
    ctx.restore();
  }

  return gradient;
}
