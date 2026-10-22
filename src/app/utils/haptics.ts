// Small taps for gestures, on whichever platform can give one.
//
// - Android (and some desktop Chromes): navigator.vibrate.
// - iPhone and iPad: Safari has no vibration API, but from iOS 17.4 flipping a native
//   switch control (<input type="checkbox" switch>) makes the system play its own
//   light tap. So a hidden switch is toggled through its label. This is a known
//   workaround rather than a supported feature, it only works from inside a real
//   touch or click handler, and it is one fixed strength, so the kinds below differ
//   only by how many taps they play.
// - Anywhere else: nothing happens, and nothing throws.

export type HapticKind = 'tick' | 'success' | 'warn';

const VIBRATE_PATTERN: Record<HapticKind, number | number[]> = {
  tick: 10,
  success: [12, 60, 12],
  warn: [30, 50, 30],
};
// Gaps (ms) between iOS switch taps for each kind.
const IOS_TAPS: Record<HapticKind, number[]> = { tick: [0], success: [0, 70], warn: [0, 110] };

let label: HTMLLabelElement | null = null;

function iosSwitchLabel(): HTMLLabelElement | null {
  if (label && label.isConnected) return label;
  if (typeof document === 'undefined' || !document.body) return null;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.id = 'wav-haptic-switch';
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  const l = document.createElement('label');
  l.htmlFor = input.id;
  l.setAttribute('aria-hidden', 'true');
  // Off-screen but still rendered: display:none would stop the switch from clicking.
  Object.assign(l.style, { position: 'fixed', left: '-100px', top: '-100px', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
  Object.assign(input.style, { position: 'fixed', left: '-100px', top: '-100px', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
  l.appendChild(input);
  document.body.appendChild(l);
  label = l;
  return l;
}

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

export function haptic(kind: HapticKind = 'tick'): void {
  try {
    if (prefersReducedMotion()) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(VIBRATE_PATTERN[kind]);
      return;
    }
    const l = iosSwitchLabel();
    if (!l) return;
    IOS_TAPS[kind].forEach((delay) => {
      if (delay === 0) l.click();
      else window.setTimeout(() => l.click(), delay);
    });
  } catch { /* haptics are a nicety; never let one break a gesture */ }
}
