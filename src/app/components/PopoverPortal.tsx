import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode, RefObject } from 'react';
import { POPOVER_SCALE } from '../constants/autoShuffle';

export type PopoverAnchor = { top?: number; bottom?: number; left: number; width: number; height?: number };

// Shared shell for the rail's Auto Shuffle and Save & share popouts.
export function PopoverPortal({ anchor, popoverRef, isMobile, title, icon, children }: {
  anchor: PopoverAnchor; popoverRef: RefObject<HTMLDivElement>; isMobile: boolean; title: string; icon?: ReactNode; children: ReactNode;
}) {
  // The popout is portaled to the end of <body>, so keyboard users would otherwise Tab away from it.
  // Move focus into it on open and hand it back to the control that opened it on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    popoverRef.current?.focus({ preventScroll: true });
    return () => { if (opener && document.contains(opener)) opener.focus({ preventScroll: true }); };
  }, [popoverRef]);
  // Styled to match the panel's other popouts (bg-wav-surface, white text,
  // same corner treatment as the drawer) — this popover is portaled to
  // document.body, outside the dock's own DOM subtree, so it doesn't get
  // that theme CSS applied automatically; the colors below are written
  // out directly instead.
  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      // Fixed flush to the rail now (like the drawer) instead of
      // floating free — square on the edge touching the rail, rounded
      // on the edge facing the canvas.
      className={`fixed z-50 shadow-sm bg-wav-surface rounded-none border border-wav-line outline-none ${isMobile ? 'wav-mobile' : ''}`}
      style={{
        top: anchor.top,
        bottom: anchor.bottom,
        left: anchor.left,
        width: isMobile ? anchor.width : anchor.width * POPOVER_SCALE,
        height: anchor.height,
        // Anchored by its bottom edge it grows upward, so it may only use the room above that edge.
        maxHeight: anchor.top === undefined && anchor.bottom !== undefined
          ? `calc(100vh - ${anchor.bottom + 8}px)`
          : 'calc(100vh - 16px)',
        overflowY: 'auto',
      }}
    >
      {/* On desktop the tab drawers render at 1.3x (ControlDrawer's scale wrapper);
          zoom gives this popout the same type size, with layout following it. The title bar
          matches the drawers' (15px semibold, hairline underneath). */}
      <div style={isMobile ? undefined : { zoom: POPOVER_SCALE }}>
        <div
          className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-wav-surface border-b border-wav-line-strong"
          style={{ padding: '6px 12px' }}
        >
          {icon}
          <span className="text-white font-semibold" style={{ fontSize: 15 }}>{title}</span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
