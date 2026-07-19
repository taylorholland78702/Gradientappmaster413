import { useState, useEffect } from 'react';

// Matches the 768px threshold usePanelPosState.ts already uses to center
// the control panel on narrow first-loads — kept in sync so the panel's
// mobile bottom-sheet layout and that centering logic agree on the same
// breakpoint. Live-updates via matchMedia (not just a one-time check) so
// rotating a phone or resizing a browser window across the breakpoint
// re-renders correctly instead of getting stuck in whichever layout was
// active on mount.
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < breakpoint
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
