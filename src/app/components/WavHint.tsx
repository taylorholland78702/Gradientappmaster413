import { Shuffle, X } from '@phosphor-icons/react';

// First-run pointer to the wāv button, where the full gesture guide lives. Moved out of InteractiveGradient unchanged.
export function WavHint({ isMobile, railRect, onDismiss }: {
  isMobile: boolean;
  railRect: { left: number; right: number; top: number };
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className={`fixed z-40 pointer-events-auto flex items-start gap-1.5 px-2.5 py-1.5 bg-wav-field border border-wav-line text-wav-text-2 max-w-[220px] ${isMobile ? 'wav-mobile' : ''}`}
      style={isMobile
        ? { left: railRect.left, bottom: window.innerHeight - railRect.top + 8 }
        : { left: railRect.right + 12, top: railRect.top }}
    >
      <span className="text-[10px] leading-snug flex-1">
        Tap <span className="text-white font-medium">wāv</span> for gestures and help · tap <Shuffle weight="regular" className="w-2.5 h-2.5 inline -translate-y-px" /> to shuffle a new look
      </span>
      <button
        onClick={onDismiss}
        className="relative wav-hit text-wav-text-3 hover:text-white transition-all flex-shrink-0"
        title="Dismiss"
        aria-label="Dismiss hint"
      >
        <X weight="bold" className="w-3 h-3" />
      </button>
    </div>
  );
}
