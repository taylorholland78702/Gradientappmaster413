import { applyKaleidoscope } from './applyKaleidoscope';
import { applyGlitch } from './applyGlitch';
import { applyInvert } from './applyInvert';
import { applyPixelate } from './applyPixelate';
import { applyTriangulate } from './applyTriangulate';
import { applyChromatic } from './applyChromatic';
import { applyFisheye } from './applyFisheye';
import { applyGrain } from './applyGrain';
import { applyPosterize } from './applyPosterize';
import { applyHalftone } from './applyHalftone';
import { applyVhs } from './applyVhs';
import { applyZoomBlur } from './applyZoomBlur';
import { applyMirror } from './applyMirror';
import { applyWave } from './applyWave';
import { applyShift } from './applyShift';
import { applyDuotone } from './applyDuotone';
import { applyVignette } from './applyVignette';
import { applyScanlines } from './applyScanlines';
import { applyGridEffect } from './applyGridEffect';
import { applyBlur } from './applyBlur';
import { applyDither } from './applyDither';
import { applySlitScan } from './applySlitScan';
import { applyBloom } from './applyBloom';
import { applyFeedback } from './applyFeedback';
import { applyRipple } from './applyRipple';
import { applyAscii } from './applyAscii';
import { applyEmoji } from './applyEmoji';
import { applyPhoto } from './applyPhoto';
import { applyLiquid } from './applyLiquid';
import { applyChromaticTrails } from './applyChromaticTrails';

export const EFFECT_DRAW_FNS: Record<string, (P: any) => void> = {
  'kaleidoscope': applyKaleidoscope,
  'glitch': applyGlitch,
  'invert': applyInvert,
  'pixelate': applyPixelate,
  'triangulate': applyTriangulate,
  'chromatic': applyChromatic,
  'fisheye': applyFisheye,
  'grain': applyGrain,
  'posterize': applyPosterize,
  'halftone': applyHalftone,
  'vhs': applyVhs,
  'zoom-blur': applyZoomBlur,
  'mirror': applyMirror,
  'wave': applyWave,
  'shift': applyShift,
  'duotone': applyDuotone,
  'vignette': applyVignette,
  'scanlines': applyScanlines,
  'grid-effect': applyGridEffect,
  'blur': applyBlur,
  'dither': applyDither,
  'slit-scan': applySlitScan,
  'bloom': applyBloom,
  'feedback': applyFeedback,
  'ripple': applyRipple,
  'ascii': applyAscii,
  'emoji': applyEmoji,
  'photo': applyPhoto,
  'liquid': applyLiquid,
  'chromatic-trails': applyChromaticTrails,
};
