import React from 'react';

export type VideoResult =
  | { kind: 'ready'; url: string; blob: Blob; name: string }
  | { kind: 'error'; message: string };

// Shown when a take finishes on a phone (or fails anywhere). A tap here is what lets the browser save or share the file;
// a download started by script after a long encode is dropped on iOS.
export const VideoResultDialog: React.FC<{ result: VideoResult; onClose: () => void }> = ({ result, onClose }) => {
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  return (
  <div
    role="dialog"
    aria-label={result.kind === 'ready' ? 'Save video' : 'Video export failed'}
    className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 p-4"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.86)' }}
    onClick={onClose}
  >
    {result.kind === 'ready' ? (
      <>
        <video
          src={result.url}
          controls
          playsInline
          loop
          muted
          autoPlay
          className="max-w-full object-contain shadow-2xl"
          style={{ maxHeight: 'calc(100% - 120px)' }}
          onClick={(e) => e.stopPropagation()}
        />
        <p className="text-[13px] text-white text-center">
          {canShare
            ? <>Your video is ready. Tap <span className="font-semibold">Save…</span>, then <span className="font-semibold">Save Video</span>.</>
            : <>Your video is ready.</>}
        </p>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {canShare && (
            <button
              className="px-4 py-2 text-[13px] font-semibold bg-wav-hover text-white"
              onClick={async () => {
                const file = new File([result.blob], result.name, { type: 'video/mp4' });
                try { if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }); } catch { /* closed or unsupported */ }
              }}
            >Save…</button>
          )}
          <button
            className="px-4 py-2 text-[13px] font-semibold bg-wav-hover text-white"
            onClick={() => {
              const link = document.createElement('a');
              link.href = result.url;
              link.download = result.name;
              link.click();
            }}
          >Download</button>
          <button className="px-4 py-2 text-[13px] font-semibold bg-white text-black" onClick={onClose}>Done</button>
        </div>
      </>
    ) : (
      <>
        <p className="text-[13px] text-white text-center max-w-xs">{result.message}</p>
        <button className="px-4 py-2 text-[13px] font-semibold bg-white text-black" onClick={(e) => { e.stopPropagation(); onClose(); }}>OK</button>
      </>
    )}
  </div>
  );
};
