import type { ChangeEvent, ComponentProps, MouseEvent as ReactMouseEvent, MutableRefObject, SetStateAction, TouchEvent, WheelEvent } from 'react';
import { ControlDrawer } from './ControlDrawer';
import { ControlRail } from './ControlRail';
import { NoticeToast } from './NoticeToast';
import { RailPopouts } from './RailPopouts';
import { WavHint } from './WavHint';
import { AboutPanel } from './AboutPanel';
import type { AutoShuffleScope } from '../constants/autoShuffle';
import type { ExportAspect, ExportSize, VideoLength, VideoSize } from '../constants/exportOptions';

// The app's markup: the full-bleed canvas, the dock (control rail and drawer), hidden file inputs, hint, popouts and About. All state and handlers come in as props. Moved out of InteractiveGradient unchanged.
export interface GradientAppViewParams {
  aboutDialogRef: MutableRefObject<HTMLDivElement>;
  activeTab: "effects" | "color" | "gradients" | "audio" | "presets";
  audioFile: string;
  audioPanelActions: ComponentProps<typeof ControlDrawer>['audioActions'];
  audioPanelState: ComponentProps<typeof ControlDrawer>['audioState'];
  audioRef: MutableRefObject<HTMLAudioElement>;
  autoShuffleIntervalSec: number;
  autoShufflePopoverAnchor: { top?: number; bottom?: number; left: number; width: number; height?: number; };
  autoShufflePopoverRef: MutableRefObject<HTMLDivElement>;
  autoShuffleScope: "all" | "gradient" | "effects" | "colors";
  canvasRef: MutableRefObject<HTMLCanvasElement>;
  containerRef: MutableRefObject<HTMLDivElement>;
  controlDrawerTabProps: ComponentProps<typeof ControlDrawer>['tabProps'];
  controlRailProps: Omit<ComponentProps<typeof ControlRail>, 'ref'>;
  copiedKey: string;
  copyText: (key: string, text: string) => Promise<void>;
  currentPlayerUrl: () => string;
  dismissWavHint: () => void;
  drawerRef: MutableRefObject<HTMLDivElement>;
  exportAsPNG: (mode?: "download" | "preview") => Promise<void>;
  exportAspect: "screen" | "1:1" | "4:5" | "16:9" | "9:16";
  exportSize: "screen" | "1080" | "4k" | "8k";
  fileInputRef: MutableRefObject<HTMLInputElement>;
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMouseDown: (e: ReactMouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: ReactMouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handlePhotoFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleTouchCancel: () => void;
  handleTouchEnd: (e: TouchEvent<HTMLCanvasElement>) => void;
  handleTouchMove: (e: TouchEvent<HTMLCanvasElement>) => void;
  handleTouchStart: (e: TouchEvent<HTMLCanvasElement>) => void;
  handleWheel: (e: WheelEvent<HTMLCanvasElement>) => void;
  hasRevealed: boolean;
  isAboutOpen: boolean;
  isAutoShuffleOn: boolean;
  isControlsVisible: boolean;
  isDisplayLinkCopied: boolean;
  isMobile: boolean;
  isRecording: boolean;
  mobilePanelMaxHeight: number;
  motionDenied: boolean;
  panelRef: MutableRefObject<HTMLElement>;
  photoInputRef: MutableRefObject<HTMLInputElement>;
  popoverMode: "autoShuffle" | "export" | "record";
  railRect: { top: number; left: number; right: number; bottom: number; width: number; height: number; };
  savePreview: { url: string; blob: Blob; name: string; };
  setAutoShuffleIntervalSec: (sec: number) => void;
  setAutoShufflePopoverAnchor: (value: SetStateAction<{ top?: number; bottom?: number; left: number; width: number; height?: number; }>) => void;
  setAutoShuffleScope: (scope: AutoShuffleScope) => void;
  setExportAspect: (v: ExportAspect) => void;
  setExportSize: (v: ExportSize) => void;
  setIsAboutOpen: (value: SetStateAction<boolean>) => void;
  setIsAutoShuffleOn: (value: SetStateAction<boolean>) => void;
  setSavePreview: (value: SetStateAction<{ url: string; blob: Blob; name: string; }>) => void;
  setVideoLength: (v: VideoLength) => void;
  setVideoSize: (v: VideoSize) => void;
  shakeEnabled: boolean;
  shakeWrapperRef: MutableRefObject<HTMLDivElement>;
  showWavHint: boolean;
  startVideoTake: () => Promise<void>;
  tiltEnabled: boolean;
  toggleMotion: (kind: "shake" | "tilt") => Promise<void>;
  videoLength: "manual" | "5" | "10" | "30";
  videoSize: "screen" | "1080" | "4k" | "720";
}

export function GradientAppView(p: GradientAppViewParams) {
  const { aboutDialogRef, activeTab, audioFile, audioPanelActions, audioPanelState, audioRef, autoShuffleIntervalSec, autoShufflePopoverAnchor, autoShufflePopoverRef, autoShuffleScope, canvasRef, containerRef, controlDrawerTabProps, controlRailProps, copiedKey, copyText, currentPlayerUrl, dismissWavHint, drawerRef, exportAsPNG, exportAspect, exportSize, fileInputRef, handleFileUpload, handleMouseDown, handleMouseMove, handleMouseUp, handlePhotoFileChange, handleTouchCancel, handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel, hasRevealed, isAboutOpen, isAutoShuffleOn, isControlsVisible, isDisplayLinkCopied, isMobile, isRecording, mobilePanelMaxHeight, motionDenied, panelRef, photoInputRef, popoverMode, railRect, savePreview, setAutoShuffleIntervalSec, setAutoShufflePopoverAnchor, setAutoShuffleScope, setExportAspect, setExportSize, setIsAboutOpen, setIsAutoShuffleOn, setSavePreview, setVideoLength, setVideoSize, shakeEnabled, shakeWrapperRef, showWavHint, startVideoTake, tiltEnabled, toggleMotion, videoLength, videoSize } = p;
  const dock = (
    <div
      data-role="dock"
      className={isMobile ? 'flex-shrink-0 w-full flex flex-col' : 'flex-shrink-0 h-full flex flex-row'}
    >
      {!isMobile && (
        <ControlRail ref={panelRef} {...controlRailProps} />
      )}

      <ControlDrawer
        ref={drawerRef}
        activeTab={activeTab}
        isMobile={isMobile}
        mobileMaxHeight={mobilePanelMaxHeight}
        tabProps={controlDrawerTabProps}
        audioState={audioPanelState}
        audioActions={audioPanelActions}
      />

      {isMobile && (
        <ControlRail ref={panelRef} {...controlRailProps} />
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black flex"
      style={{ flexDirection: isMobile ? 'column' : 'row' }}
      ref={containerRef}
    >
      {/* Canvas renders full-bleed behind the dock (fixed, out of flex flow)
          so the dock's translucent background genuinely shows the gradient
          through it, instead of just the root's opaque black. */}
      <main ref={shakeWrapperRef} className="fixed inset-0 z-0" aria-label="Gradient canvas">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Animated gradient artwork"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onTouchMove={handleTouchMove}
          onWheel={handleWheel}
          className="w-full h-full"
          style={{ touchAction: 'none', opacity: hasRevealed ? 1 : 0, transition: 'opacity 900ms ease-out' }}
        />
      </main>
      {!isMobile && isControlsVisible && <div className="relative z-10 flex-shrink-0">{dock}</div>}
      {/* Pure flex spacer — no content, so it must not intercept pointer
          events. Without pointer-events-none, this (relative, DOM-order
          after the canvas's fixed z-0 wrapper) painted above the canvas
          across the entire non-dock area and silently swallowed every
          click/drag meant for it in desktop layout. */}
      <div className="relative flex-1 min-w-0 min-h-0 pointer-events-none" />
      {isMobile && isControlsVisible && <div className="relative z-10 flex-shrink-0">{dock}</div>}

      {/* Upper Right Controls */}
      <div className={`absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoFileChange}
          className="hidden"
        />
      </div>

      
      {/* First-run hint — floats near wherever the rail currently is
          (railRect), same content/dismiss logic as before, just
          repositioned now that it can't sit inline under the wordmark
          inside a card anymore (the rail is a slim strip with no room for
          it). Hidden while a drawer is open so it can't overlap one. */}
      {savePreview && (
        <div
          role="dialog"
          aria-label="Save image"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.86)' }}
          onClick={() => { URL.revokeObjectURL(savePreview.url); setSavePreview(null); }}
        >
          <img
            src={savePreview.url}
            alt="Your artwork. Press and hold to save it to Photos."
            className="max-w-full object-contain shadow-2xl"
            style={{ maxHeight: 'calc(100% - 120px)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-[13px] text-white text-center">Press and hold the image, then tap <span className="font-semibold">Add to Photos</span></p>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                className="px-4 py-2 text-[13px] font-semibold bg-wav-hover text-white"
                onClick={async () => {
                  const file = new File([savePreview.blob], savePreview.name, { type: 'image/png' });
                  try { if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }); } catch { /* closed or unsupported */ }
                }}
              >Share…</button>
            )}
            <button
              className="px-4 py-2 text-[13px] font-semibold bg-wav-hover text-white"
              onClick={() => {
                const link = document.createElement('a');
                link.href = savePreview.url;
                link.download = savePreview.name;
                link.click();
              }}
            >Download</button>
            <button
              className="px-4 py-2 text-[13px] font-semibold bg-white text-black"
              onClick={() => { URL.revokeObjectURL(savePreview.url); setSavePreview(null); }}
            >Done</button>
          </div>
        </div>
      )}

      {/* First-run pointer to the wāv button, where the full gesture guide lives. */}
      {showWavHint && !activeTab && !autoShufflePopoverAnchor && !isAboutOpen && railRect && (
        <WavHint isMobile={isMobile} railRect={railRect} onDismiss={dismissWavHint} />
      )}


      {audioFile && (
        <audio
          ref={audioRef}
          src={audioFile}
          loop
        />
      )}

      {/* Auto Shuffle interval popover — single render call site so opening
          it from either trigger (collapsed cluster or expanded top row,
          only one of which is ever mounted+clickable at a time) never
          produces two portaled copies. */}
      <RailPopouts
        mode={popoverMode} anchor={autoShufflePopoverAnchor} popoverRef={autoShufflePopoverRef} isMobile={isMobile}
        setAnchor={setAutoShufflePopoverAnchor}
        exportProps={{ exportSize, setExportSize, exportAspect, setExportAspect, exportAsPNG, copiedKey, copyText, currentPlayerUrl }}
        recordProps={{ videoSize, setVideoSize, videoLength, setVideoLength, isRecording, startVideoTake }}
        autoShuffleProps={{ isAutoShuffleOn, setIsAutoShuffleOn, autoShuffleIntervalSec, setAutoShuffleIntervalSec, autoShuffleScope, setAutoShuffleScope }}
      />

      <NoticeToast />

      {/* Display-link-copied toast — brief confirmation for Shift+P */}
      {isDisplayLinkCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-wav-surface backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg z-50">
          Display link copied — open it in a new tab/window for live output
        </div>
      )}

      {/* About panel. Mobile: a centered floating card, same as any other
          modal — the rail there is a bottom bar, not a side column, so
          there's no "attached to the panel" edge to dock against. Desktop:
          fastened flush against the rail's right edge (no gap), square
          corners (a docked extension of the rail rather than a floating
          card), and stretches from the rail's own top down to the bottom
          of the viewport — same footprint the canvas itself has. The
          click-catcher behind it stays unblurred so the gradient result
          underneath isn't blurred out; only the card itself keeps its own
          surface. */}
      {isAboutOpen && (
        <AboutPanel
          isMobile={isMobile} railRect={railRect} dialogRef={aboutDialogRef} onClose={() => setIsAboutOpen(false)}
          isAutoShuffleOn={isAutoShuffleOn} setIsAutoShuffleOn={setIsAutoShuffleOn}
          autoShuffleIntervalSec={autoShuffleIntervalSec} setAutoShuffleIntervalSec={setAutoShuffleIntervalSec}
          shakeEnabled={shakeEnabled} tiltEnabled={tiltEnabled} toggleMotion={toggleMotion} motionDenied={motionDenied}
        />
      )}

    </div>
  );
}
