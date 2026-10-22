// Motion sensors (shake, tilt). Android and desktop Chrome just deliver the events; iOS
// makes the page ask first, and only lets it ask from inside a tap.
type MotionPermissionApi = { requestPermission?: () => Promise<'granted' | 'denied'> };

export const motionSensorsSupported = (): boolean =>
  typeof window !== 'undefined' && ('DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window);

export async function requestMotionPermission(): Promise<boolean> {
  if (!motionSensorsSupported()) return false;
  const needsAsk = [
    (window as unknown as { DeviceMotionEvent?: MotionPermissionApi }).DeviceMotionEvent,
    (window as unknown as { DeviceOrientationEvent?: MotionPermissionApi }).DeviceOrientationEvent,
  ].filter((api): api is MotionPermissionApi => !!api && typeof api.requestPermission === 'function');
  if (needsAsk.length === 0) return true;
  try {
    const results = await Promise.all(needsAsk.map(api => api.requestPermission!()));
    return results.every(r => r === 'granted');
  } catch {
    return false;
  }
}
