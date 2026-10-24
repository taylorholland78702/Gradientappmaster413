import { createPortal } from 'react-dom';
import type { ReactNode, RefObject } from 'react';
import { POPOVER_SCALE } from '../constants/autoShuffle';

export type PopoverAnchor = { top?: number; bottom?: number; left: number; width: number; height?: number };

// Shared shell for the rail's Auto Shuffle and Save & share popouts.
export function PopoverPortal({ anchor, popoverRef, isMobile, children }: {
  anchor: PopoverAnchor; popoverRef: RefObject<HTMLDivElement>; isMobile: boolean; children: ReactNode;
}) {
  // Styled to match the panel's other popouts (bg-black/75, white text,
  // same corner treatment as the drawer) — this popover is portaled to
  // document.body, outside the dock's own DOM subtree, so it doesn't get
  // that theme CSS applied automatically; the colors below are written
  // out directly instead.
  return createPortal(
    <div
      ref={popoverRef}
      // Fixed flush to the rail now (like the drawer) instead of
      // floating free — square on the edge touching the rail, rounded
      // on the edge facing the canvas.
      className="fixed z-50 shadow-sm bg-black/75 rounded-none"
      style={{
        top: anchor.top,
        bottom: anchor.bottom,
        left: anchor.left,
        width: isMobile ? anchor.width : anchor.width * POPOVER_SCALE,
        height: anchor.height,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        // Anchored by its bottom edge it grows upward, so it may only use the room above that edge.
        maxHeight: anchor.top === undefined && anchor.bottom !== undefined
          ? `calc(100vh - ${anchor.bottom + 8}px)`
          : 'calc(100vh - 16px)',
        overflowY: 'auto',
      }}
    >
      {/* On desktop the tab drawers render at 1.3x (ControlDrawer's scale wrapper);
          zoom gives this popout the same type size, with layout following it. */}
      <div className="p-3 flex flex-col gap-2" style={isMobile ? undefined : { zoom: POPOVER_SCALE }}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
