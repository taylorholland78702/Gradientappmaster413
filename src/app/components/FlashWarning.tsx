import React, { useState } from 'react';

const SEEN_KEY = 'wavFlashWarningSeen';

// Shown once, on first visit, before anything is playing: the app can flash with the music. The choice is stored with
// the Reduce flashing setting (see hooks/useReduceFlash.ts), which stays one tap away in the Audio panel.
export const FlashWarning: React.FC<{ reduceFlash: boolean; setReduceFlash: (on: boolean) => void }> = ({ setReduceFlash }) => {
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(SEEN_KEY) !== '1'; } catch { return false; }
  });
  if (!open) return null;
  const close = (reduce: boolean) => {
    setReduceFlash(reduce); // also records the choice, so the system default is no longer used
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* shown again next visit */ }
    setOpen(false);
  };
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="flash-warning-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.86)' }}
    >
      <div className="w-full max-w-sm bg-wav-surface border border-wav-line-strong p-4 flex flex-col gap-3 text-white">
        <h2 id="flash-warning-title" className="text-[15px] font-semibold">Flashing lights</h2>
        <p className="text-[13px] text-wav-text-2 leading-snug">
          wāv can pulse, shake and flip colours in time with music, which may trigger seizures in people with photosensitive
          epilepsy. Reduce flashing mutes those reactions. You can change it any time in the Audio tab.
        </p>
        <div className="flex gap-2">
          <button onClick={() => close(true)} className="wav-choice flex-1 px-3 text-[13px] font-semibold bg-white text-black">Reduce flashing</button>
          <button onClick={() => close(false)} className="wav-choice flex-1 px-3 text-[13px] font-semibold border border-wav-line-strong text-white hover:bg-wav-hover">Continue</button>
        </div>
      </div>
    </div>
  );
};
