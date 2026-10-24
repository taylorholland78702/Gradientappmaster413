// Save PNG options. Size is the exported image's long edge; Aspect crops the
// center of what's on screen to that shape ('screen' keeps the window's own).
export type ExportSize = 'screen' | '1080' | '4k' | '8k';
export type ExportAspect = 'screen' | '1:1' | '4:5' | '16:9' | '9:16';
export const EXPORT_SIZES: { id: ExportSize; label: string; longEdge: number }[] = [
  { id: 'screen', label: 'Screen', longEdge: 0 },
  { id: '1080', label: '1080p', longEdge: 1920 },
  { id: '4k', label: '4K', longEdge: 3840 },
  { id: '8k', label: '8K', longEdge: 7680 },
];
export const EXPORT_ASPECTS: { id: ExportAspect; label: string; ratio: number }[] = [
  { id: 'screen', label: 'Screen', ratio: 0 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
];
// Save Video options. Size is the recorded video's long edge (the artwork is re-rendered at that
// size for the take); Length stops the take for you, or leaves it to the Record button.
export type VideoSize = 'screen' | '720' | '1080' | '4k';
export type VideoLength = 'manual' | '5' | '10' | '30';
export const VIDEO_SIZES: { id: VideoSize; label: string; longEdge: number }[] = [
  { id: 'screen', label: 'Screen', longEdge: 0 },
  { id: '720', label: '720p', longEdge: 1280 },
  { id: '1080', label: '1080p', longEdge: 1920 },
  { id: '4k', label: '4K', longEdge: 3840 },
];
export const VIDEO_LENGTHS: { id: VideoLength; label: string; seconds: number }[] = [
  { id: 'manual', label: 'Until I stop', seconds: 0 },
  { id: '5', label: '5s', seconds: 5 },
  { id: '10', label: '10s', seconds: 10 },
  { id: '30', label: '30s', seconds: 30 },
];

// Canvas backing-store ceilings: one edge, and total pixels (about 36 MB of RGBA x4).
export const EXPORT_MAX_EDGE = 8192;
export const EXPORT_MAX_PIXELS = 40_000_000;

// "Wallpaper": a PNG at this device's own screen resolution (CSS size x pixel ratio), whatever shape the window is,
// scaled down only if it would pass the canvas ceilings above.
export function wallpaperTarget(screenWidth: number, screenHeight: number, pixelRatio: number): { w: number; h: number } {
  let w = Math.max(1, Math.round(screenWidth * pixelRatio));
  let h = Math.max(1, Math.round(screenHeight * pixelRatio));
  const k = Math.min(1, EXPORT_MAX_EDGE / Math.max(w, h), Math.sqrt(EXPORT_MAX_PIXELS / (w * h)));
  if (k < 1) { w = Math.max(1, Math.floor(w * k)); h = Math.max(1, Math.floor(h * k)); }
  return { w, h };
}
