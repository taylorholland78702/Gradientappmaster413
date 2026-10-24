import { deflateSync, Inflate } from 'fflate';
import { SHARE_DEFAULTS_V1 } from '../constants/shareDefaults';
import { activeCategories, isRelevant } from '../constants/shareRelevance';
import { decodePresetData } from './presetShare';

// Share-link format.
//
//  v1 (old links): ?preset=<base64url of the whole snapshot as JSON>. About 9 KB.
//  v2: ?preset=~<base64url of deflate(JSON)>, where the JSON holds only what is needed to show the look:
//      - settings that cannot change this look are left out (a Rays gradient with Grain does not need Julia's values;
//        see constants/shareRelevance.ts) as are animation clocks and, with audio off, audio tuning;
//      - settings at their default are left out and filled back in on opening (constants/shareDefaults.ts, frozen);
//      - numbers are rounded to 3 decimals, colors are 6-digit hex.
//  Typically 700-1,100 characters. Both formats open in the app; v1 links keep working.

const V2 = '~';
const MAX_PARAM_CHARS = 20_000;
const MAX_INFLATED_BYTES = 400_000;

type Snapshot = Record<string, unknown>;
type Rgb = { r: number; g: number; b: number };

const COLOR_LISTS = ['gradientColors', 'targetColors', 'baseAIColors'] as const;
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const hex = (c: Rgb) => [c.r, c.g, c.b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const isRgb = (c: unknown): c is Rgb => !!c && typeof c === 'object' && ['r', 'g', 'b'].every(k => typeof (c as Record<string, unknown>)[k] === 'number');
const isColorList = (v: unknown): v is Rgb[] => Array.isArray(v) && v.length > 0 && v.every(isRgb);

function roundDeep(v: unknown): unknown {
  if (typeof v === 'number') return Number.isFinite(v) ? round3(v) : v;
  if (Array.isArray(v)) return v.map(roundDeep);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Snapshot).map(([k, x]) => [k, roundDeep(x)]));
  return v;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// The part of a snapshot a link needs.
export function compactLook(snapshot: Snapshot): Snapshot {
  const gradientType = typeof snapshot.gradientType === 'string' ? snapshot.gradientType : 'angle';
  const effects = Array.isArray(snapshot.activeEffects) ? snapshot.activeEffects.filter((e): e is string => typeof e === 'string') : [];
  const bindings = Array.isArray(snapshot.audioBindings) ? snapshot.audioBindings as Array<{ param?: string }> : [];
  const look = {
    gradientType, effects, audioOn: snapshot.isAudioEnabled === true,
    bound: new Set(bindings.map(b => b.param).filter((p): p is string => typeof p === 'string')),
  };
  const categories = activeCategories(gradientType, effects);
  const out: Snapshot = {};
  for (const [key, raw] of Object.entries(snapshot)) {
    if (raw === undefined || raw === null || !isRelevant(key, look, categories)) continue;
    if ((COLOR_LISTS as readonly string[]).includes(key) && isColorList(raw)) { out[key] = raw.map(hex); continue; }
    const value = roundDeep(raw);
    if (key in SHARE_DEFAULTS_V1 && same(SHARE_DEFAULTS_V1[key], value)) continue;
    out[key] = value;
  }
  // The colors being eased toward are the colors themselves unless a transition was in progress.
  if (out.targetColors && out.gradientColors && same(out.targetColors, out.gradientColors)) delete out.targetColors;
  return out;
}

const toB64Url = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64Url = (text: string) => {
  const p = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(p + '='.repeat((4 - (p.length % 4)) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};

// The `preset` parameter for a link to this look.
export function shareParam(snapshot: Snapshot): string {
  return V2 + toB64Url(deflateSync(new TextEncoder().encode(JSON.stringify(compactLook(snapshot))), { level: 9 }));
}

function inflateCapped(bytes: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [];
  let total = 0;
  const stream = new Inflate((chunk) => {
    total += chunk.length;
    if (total > MAX_INFLATED_BYTES) throw new Error('share link too large');
    chunks.push(chunk);
  });
  stream.push(bytes, true);
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}

// Puts back what compactLook took out.
export function expandLook(compact: Snapshot): Snapshot {
  const out: Snapshot = { ...SHARE_DEFAULTS_V1, ...compact };
  for (const key of COLOR_LISTS) {
    const list = out[key];
    if (Array.isArray(list) && list.every(c => typeof c === 'string')) {
      out[key] = (list as string[]).flatMap(h => {
        const m = /^#?([0-9a-f]{6})$/i.exec(h);
        if (!m) return [];
        const n = parseInt(m[1], 16);
        return [{ r: n >> 16, g: (n >> 8) & 255, b: n & 255 }];
      });
    }
  }
  return out;
}

// Reads a `preset` parameter in either format. Throws on anything that is not a look.
export function readShareParam(param: string): unknown {
  if (!param || param.length > MAX_PARAM_CHARS) throw new Error('share link missing or too long');
  if (!param.startsWith(V2)) return decodePresetData(param);
  const json = new TextDecoder().decode(inflateCapped(fromB64Url(param.slice(1))));
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not a look');
  return expandLook(parsed as Snapshot);
}
