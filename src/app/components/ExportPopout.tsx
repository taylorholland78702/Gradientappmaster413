import { choice } from './choice';
import { embedSnippet, type EmbedKind } from '../utils/shareExport';
import { wallpaperTarget } from '../constants/exportOptions';

// The "Save & share" popout: one Save PNG button (an 8K image shaped like this screen) and the embed snippets.
export function ExportPopout({
  isMobile, closePopover, copiedKey, copyText, currentPlayerUrl, saveWallpaper,
}: {
  isMobile: boolean;
  closePopover: () => void;
  copiedKey: string | null; copyText: (key: string, text: string) => void; currentPlayerUrl: () => string;
  saveWallpaper: () => void;
}) {
  const png = wallpaperTarget(window.screen.width, window.screen.height);
  return (<>
      <button
        onClick={() => { saveWallpaper(); closePopover(); }}
        title={`An 8K PNG shaped like this screen (${png.w}×${png.h})`}
        className="wav-choice text-[11px] font-semibold transition-all bg-white text-black"
      >Save PNG</button>
      {!isMobile && <p className="text-[10px] text-wav-text-3">The S key saves it too.</p>}
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
