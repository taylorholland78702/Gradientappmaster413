import { useEffect, useRef } from 'react';

interface MotionGestureOptions {
  shake: boolean;
  tilt: boolean;
  onShake: () => void;
  // gamma: phone leaning left (-) / right (+), in degrees; beta: front/back.
  onTilt: (gamma: number, beta: number) => void;
}

// Shake: two hard jolts within half a second (a jolt is the acceleration, with gravity
// removed, passing a threshold), then a cooldown so one shake is one Shuffle.
const JOLT_MS2 = 16;
const JOLT_WINDOW_MS = 550;
const COOLDOWN_MS = 1400;

export function useMotionGestures({ shake, tilt, onShake, onTilt }: MotionGestureOptions) {
  const shakeCb = useRef(onShake);
  const tiltCb = useRef(onTilt);
  shakeCb.current = onShake;
  tiltCb.current = onTilt;

  useEffect(() => {
    if (!shake) return;
    let lastJolt = 0, jolts = 0, lastFire = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null || g.z == null) return;
      const mag = Math.hypot(g.x, g.y, g.z);
      if (Math.abs(mag - 9.81) < JOLT_MS2) return;
      const now = performance.now();
      if (now - lastFire < COOLDOWN_MS) return;
      jolts = now - lastJolt < JOLT_WINDOW_MS ? jolts + 1 : 1;
      lastJolt = now;
      if (jolts >= 2) { jolts = 0; lastFire = now; shakeCb.current(); }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [shake]);

  useEffect(() => {
    if (!tilt) return;
    let last = 0;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const now = performance.now();
      if (now - last < 40) return; // ~25 updates a second is plenty
      last = now;
      tiltCb.current(e.gamma, e.beta);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [tilt]);
}
