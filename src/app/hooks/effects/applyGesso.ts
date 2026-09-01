// Robert Ryman: the canvas ground itself as the subject. Desaturates and
// lifts whatever's underneath toward a near-white monochrome field, then
// lays a fine brushed-texture noise over it — audio (when on) only ever
// deepens that texture, never reintroduces color, since every channel gets
// the identical delta.
export function applyGesso(P: any): void {
  const {
    imageData,
    putScaledImageData,
    gessoWhiteness,
    gessoTexture,
    gessoResponse,
    isAudioEnabled,
    isAudioReactive,
    audioTrebleLevel,
    isFirstEffect,
    audioModulation,
  } = P;
  if (!imageData) return;
  const d = imageData.data;

  const whiteness = Math.min(1, Math.max(0, gessoWhiteness));
  const audioActive = isAudioEnabled && isAudioReactive;
  const textureBoost = audioActive ? gessoResponse * audioTrebleLevel * 0.5 : 0;
  const texture = Math.min(1, Math.max(0, gessoTexture) + textureBoost + (isFirstEffect ? audioModulation * 0.1 : 0));

  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const base = lum + (255 - lum) * whiteness;
    const noise = (Math.random() - 0.5) * texture * 40;
    const v = Math.min(255, Math.max(0, base + noise));
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }
  putScaledImageData(imageData);
}
