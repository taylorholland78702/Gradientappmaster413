import { Camera } from '@phosphor-icons/react';
import type { ColorRGB } from '../constants/gradientEffects';
import {
  type ExportSize, type ExportAspect, EXPORT_SIZES, EXPORT_ASPECTS,
  type VideoSize, type VideoLength, VIDEO_SIZES, VIDEO_LENGTHS,
} from '../constants/exportOptions';
import { ChoiceChips, choice } from './choice';
import { formatPalette, embedSnippet, type PaletteFormat, type EmbedKind } from '../utils/shareExport';

// The "Save & share" popout: PNG size/aspect, video take, embed snippet and palette copy.
export function ExportPopout({
  isMobile, exportSize, setExportSize, exportAspect, setExportAspect, exportAsPNG, closePopover,
  videoSize, setVideoSize, videoLength, setVideoLength, isRecording, startVideoTake,
  copiedKey, copyText, currentPlayerUrl, gradientColors, paletteStops,
}: {
  isMobile: boolean;
  exportSize: ExportSize; setExportSize: (v: ExportSize) => void;
  exportAspect: ExportAspect; setExportAspect: (v: ExportAspect) => void;
  exportAsPNG: () => void; closePopover: () => void;
  videoSize: VideoSize; setVideoSize: (v: VideoSize) => void;
  videoLength: VideoLength; setVideoLength: (v: VideoLength) => void;
  isRecording: boolean; startVideoTake: () => void;
  copiedKey: string | null; copyText: (key: string, text: string) => void; currentPlayerUrl: () => string;
  gradientColors: ColorRGB[]; paletteStops: Parameters<typeof formatPalette>[1];
}) {
  return (<>
      <span className="text-xs flex items-center gap-2 text-white"><Camera weight="regular" className="w-4 h-4 shrink-0" /> Save &amp; share</span>
      {([
        { label: 'Size', options: EXPORT_SIZES, value: exportSize, set: setExportSize, hint: 'Long edge of the saved image. Re-renders the artwork at that size.' },
        { label: 'Aspect', options: EXPORT_ASPECTS, value: exportAspect, set: setExportAspect, hint: 'Crops the center of what you see to this shape.' },
      ] as { label: string; options: { id: string; label: string }[]; value: string; set: (v: never) => void; hint: string }[]).map(g => (
        <div key={g.label} className="flex flex-col gap-1" title={g.hint}>
          <span className="text-[10px] text-white/60">{g.label}</span>
          <ChoiceChips ariaLabel={`Export ${g.label.toLowerCase()}`} options={g.options} value={g.value} onChange={g.set as (id: string) => void} />
        </div>
      ))}
      <button
        onClick={() => { exportAsPNG(); closePopover(); }}
        className="wav-choice text-[11px] font-semibold transition-all"
        style={{ backgroundColor: '#ffffff', color: '#000000' }}
      >Save PNG</button>
      {!isMobile && <p className="text-[10px] text-white/50">The S key saves with these settings.</p>}
      <div className="flex flex-col gap-1 pt-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <span className="text-[10px] text-white/60" title="Records the live artwork, with sound if audio is on, as an MP4">Record video</span>
        {([
          { label: 'Size', options: VIDEO_SIZES, value: videoSize, set: setVideoSize },
          { label: 'Length', options: VIDEO_LENGTHS, value: videoLength, set: setVideoLength },
        ] as { label: string; options: { id: string; label: string }[]; value: string; set: (v: never) => void }[]).map(g => (
          <ChoiceChips key={g.label} ariaLabel={`Video ${g.label.toLowerCase()}`} options={g.options} value={g.value} onChange={g.set as (id: string) => void} disabled={isRecording} />
        ))}
        <button
          onClick={startVideoTake}
          className="wav-choice text-[11px] font-semibold transition-all"
          style={isRecording ? { backgroundColor: '#ef4444', color: '#ffffff' } : { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
        >{isRecording ? 'Stop recording' : 'Start recording'}</button>
        {videoSize === '4k' && <p className="text-[10px] text-white/50">4K is heavy: busy gradients or effects may drop frames.</p>}
      </div>
      <div className="flex flex-col gap-1 pt-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <span className="text-[10px] text-white/60" title="A snippet that shows this look, live, on any web page">Embed on a website</span>
        <div className="flex gap-1">
          {([['box', 'Box 16:9'], ['background', 'Background']] as [EmbedKind, string][]).map(([kind, label]) => (
            <button
              key={kind}
              onClick={() => copyText(`embed-${kind}`, embedSnippet(currentPlayerUrl(), kind))}
              title={kind === 'box' ? 'A responsive 16:9 frame' : 'Pinned behind the whole page'}
              className={choice(copiedKey === `embed-${kind}`, 'flex-1')}
            >{copiedKey === `embed-${kind}` ? 'Copied' : label}</button>
          ))}
        </div>
        <span className="text-[10px] text-white/60 pt-1">Copy palette as</span>
        <div className="flex gap-1">
          {([['hex', 'Hex'], ['css', 'CSS'], ['tailwind', 'Tailwind'], ['json', 'JSON']] as [PaletteFormat, string][]).map(([fmt, label]) => (
            <button
              key={fmt}
              onClick={() => copyText(`palette-${fmt}`, formatPalette(gradientColors, paletteStops, fmt))}
              className={choice(copiedKey === `palette-${fmt}`, 'flex-1')}
            >{copiedKey === `palette-${fmt}` ? 'Copied' : label}</button>
          ))}
        </div>
      </div>
  </>);
}
