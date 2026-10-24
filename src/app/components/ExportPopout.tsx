import {
  type ExportSize, type ExportAspect, EXPORT_SIZES, EXPORT_ASPECTS,
} from '../constants/exportOptions';
import { ChoiceChips, choice } from './choice';
import { embedSnippet, type EmbedKind } from '../utils/shareExport';
import { wallpaperTarget } from '../constants/exportOptions';

// The "Save & share" popout: PNG size/aspect, embed snippet and palette copy.
export function ExportPopout({
  isMobile, exportSize, setExportSize, exportAspect, setExportAspect, exportAsPNG, closePopover,
  copiedKey, copyText, currentPlayerUrl,
  saveWallpaper,
}: {
  isMobile: boolean;
  exportSize: ExportSize; setExportSize: (v: ExportSize) => void;
  exportAspect: ExportAspect; setExportAspect: (v: ExportAspect) => void;
  exportAsPNG: () => void; closePopover: () => void;
  copiedKey: string | null; copyText: (key: string, text: string) => void; currentPlayerUrl: () => string;
  saveWallpaper: () => void;
}) {
  const wallpaper = wallpaperTarget(window.screen.width, window.screen.height, window.devicePixelRatio || 1);
  return (<>
      {([
        { label: 'Size', options: EXPORT_SIZES, value: exportSize, set: setExportSize, hint: 'Long edge of the saved image. Re-renders the artwork at that size.' },
        { label: 'Aspect', options: EXPORT_ASPECTS, value: exportAspect, set: setExportAspect, hint: 'Crops the center of what you see to this shape.' },
      ] as { label: string; options: { id: string; label: string }[]; value: string; set: (v: never) => void; hint: string }[]).map(g => (
        <div key={g.label} className="flex flex-col gap-1" title={g.hint}>
          <span className="text-[10px] text-wav-text-2">{g.label}</span>
          <ChoiceChips ariaLabel={`Export ${g.label.toLowerCase()}`} options={g.options} value={g.value} onChange={g.set as (id: string) => void} />
        </div>
      ))}
      <button
        onClick={() => { exportAsPNG(); closePopover(); }}
        className="wav-choice text-[11px] font-semibold transition-all bg-white text-black"
      >Save PNG</button>
      {!isMobile && <p className="text-[10px] text-wav-text-3">The S key saves with these settings.</p>}
      <button
        onClick={() => { saveWallpaper(); closePopover(); }}
        title="A PNG at this device's own screen size and shape, whatever size the window is"
        className={choice(false)}
      >Save as wallpaper · {wallpaper.w}×{wallpaper.h}</button>
      <div className="flex flex-col gap-1 pt-1 border-t border-wav-line">
        <span className="text-[10px] text-wav-text-2" title="A snippet that shows this look, live, on any web page">Embed on a website</span>
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
      </div>
  </>);
}
