import names from './_lookNames.json';
import { parseHexList, toHexList, type Rgb } from './_card';

// What a shared link says about its look, and the page title/description/image to show for it. Everything that
// ends up in the page comes from the name tables in _lookNames.json or from numbers: nothing from the link is
// copied into the HTML as text.

export interface Look { gradient: string | null; effects: string[]; colors: Rgb[] }

const MAX_PRESET_CHARS = 20000;

export function decodePreset(encoded: string): Record<string, unknown> | null {
  if (!encoded || encoded.length > MAX_PRESET_CHARS) return null;
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

const channel = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(255, Math.round(v))) : null);

export function readLook(preset: Record<string, unknown> | null): Look {
  const look: Look = { gradient: null, effects: [], colors: [] };
  if (!preset) return look;
  const g = preset.gradientType;
  if (typeof g === 'string' && Object.prototype.hasOwnProperty.call(names.gradients, g)) look.gradient = g;
  if (Array.isArray(preset.activeEffects)) {
    for (const e of preset.activeEffects) {
      if (typeof e === 'string' && Object.prototype.hasOwnProperty.call(names.effects, e) && !look.effects.includes(e)) look.effects.push(e);
      if (look.effects.length >= 6) break;
    }
  }
  if (Array.isArray(preset.gradientColors)) {
    for (const c of preset.gradientColors as Array<Record<string, unknown>>) {
      const r = channel(c?.r), g2 = channel(c?.g), b = channel(c?.b);
      if (r !== null && g2 !== null && b !== null) look.colors.push({ r, g: g2, b });
      if (look.colors.length >= 8) break;
    }
  }
  return look;
}

const gradientName = (id: string) => (names.gradients as Record<string, string>)[id];
const effectName = (id: string) => (names.effects as Record<string, string>)[id];

export function describeLook(look: Look): { title: string; description: string } {
  const effects = look.effects.map(effectName);
  if (!look.gradient) {
    return { title: 'A look made in WĀV', description: 'Open the link to watch this look move, then make it your own in WĀV, an audio-reactive gradient and effects playground.' };
  }
  const g = gradientName(look.gradient);
  const withEffects = effects.length ? ` with ${effects.join(', ')}` : '';
  return {
    title: `${g}${effects.length ? ` + ${effects.slice(0, 2).join(' + ')}` : ''} · WĀV`,
    description: `A ${g} look${withEffects}. Open the link to watch it move, then make it your own in WĀV.`,
  };
}

export function cardPath(look: Look): string {
  return look.colors.length >= 2 ? `/api/og?c=${toHexList(look.colors)}` : '/og-default.png';
}

export { parseHexList };
