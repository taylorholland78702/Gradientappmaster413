import React from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { type ColorRGB } from '../constants/gradientEffects';
import { type GradientLook } from '../constants/gradientLooks';
import { PALETTE_GROUPS, type PalettePreset } from '../constants/palettePresets';
import { hexToRgb, samplePalette } from '../utils/color';

interface LooksMenuProps {
  gradientName: string;
  looks: GradientLook[];
  gradientColors: ColorRGB[];
  onLook: (look: GradientLook) => void;
  onPalette: (palette: PalettePreset) => void;
}

const swatch = (colors: string[]) => `linear-gradient(to right, ${colors.join(', ')})`;

// How far (average channel difference) the live palette is from a set of colors. A set
// with a different count is re-cut to the live count first (the same re-cut applying it
// does), so a 4-color palette still reads as active on a 6-color canvas. Auto color
// drifts the palette slowly, so "which one is active" is the closest within a loose
// tolerance, not an exact match.
const distance = (hexes: string[], live: ColorRGB[]) => {
  let colors: ColorRGB[] = hexes.map(hexToRgb);
  if (colors.length !== live.length) colors = samplePalette(colors, null, 0.5, 0, 'oklab', live.length);
  let sum = 0;
  colors.forEach((c, i) => {
    const g = live[i];
    sum += Math.abs(c.r - g.r) + Math.abs(c.g - g.g) + Math.abs(c.b - g.b);
  });
  return sum / (colors.length * 3);
};

const LooksMenuInner: React.FC<LooksMenuProps> = ({ gradientName, looks, gradientColors, onLook, onPalette }) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey, true); };
  }, [open]);

  // The closest Look or palette within tolerance, shown on the button.
  const active = React.useMemo(() => {
    let best: { name: string; colors: string[]; d: number } | null = null;
    const consider = (name: string, colors: string[]) => {
      const d = distance(colors, gradientColors);
      if (!best || d < best.d) best = { name, colors, d };
    };
    looks.forEach(l => consider(l.name, l.colors));
    PALETTE_GROUPS.forEach(g => g.palettes.forEach(p => consider(p.name, p.colors)));
    return best && (best as { d: number }).d < 45 ? (best as { name: string; colors: string[] }) : null;
  }, [looks, gradientColors]);

  const rowClass = (isActive: boolean) =>
    `w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-left transition-all ${isActive ? 'bg-white text-black font-bold' : 'text-white hover:bg-white/15'}`;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Pick a Look or a color palette"
        className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-white bg-black/25 hover:bg-white/15 border border-white/15 transition-all"
      >
        <span aria-hidden="true" className="block w-8 h-3 border border-white/20 shrink-0" style={{ background: swatch((active?.colors ?? gradientColors.map(c => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`))) }} />
        <span className="flex-1 text-left truncate">{active ? active.name : 'Custom colors'}</span>
        <CaretDown weight="regular" className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-label="Looks and palettes" className="absolute left-0 right-0 top-full mt-0.5 z-30 max-h-60 overflow-y-auto border border-white/20 shadow-lg"
          style={{ backgroundColor: '#0b0b10' }}>
          {looks.length > 0 && (
            <div>
              <div className="px-2 pt-1.5 pb-1 text-[9px] uppercase tracking-wide text-white/50 sticky top-0" style={{ backgroundColor: '#0b0b10' }}>{gradientName} Looks</div>
              {looks.map(look => (
                <button
                  key={look.name}
                  role="option"
                  aria-selected={active?.name === look.name}
                  onClick={() => { onLook(look); setOpen(false); }}
                  title={`Apply the ${look.name} look — sets the palette and its settings`}
                  className={rowClass(active?.name === look.name)}
                >
                  <span aria-hidden="true" className="block w-8 h-3 border border-white/20 shrink-0" style={{ background: swatch(look.colors) }} />
                  {look.name}
                </button>
              ))}
            </div>
          )}
          {PALETTE_GROUPS.map(g => (
            <div key={g.group}>
              <div className="px-2 pt-1.5 pb-1 text-[9px] uppercase tracking-wide text-white/50 sticky top-0" style={{ backgroundColor: '#0b0b10' }}>{g.group}</div>
              {g.palettes.map(p => (
                <button
                  key={p.name}
                  role="option"
                  aria-selected={active?.name === p.name}
                  onClick={() => { onPalette(p); setOpen(false); }}
                  title={`Use the ${p.name} palette (colors only)`}
                  className={rowClass(active?.name === p.name)}
                >
                  <span aria-hidden="true" className="block w-8 h-3 border border-white/20 shrink-0" style={{ background: swatch(p.colors) }} />
                  {p.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const LooksMenu = React.memo(LooksMenuInner);
