import { MODULATABLE_PARAMS, type ModulatableParam } from './modulatableParams';
import { GRADIENT_MOD_CATEGORY, STYLED_GRADIENTS_CATEGORY, GLOBAL_CATEGORIES } from './gradientModCategories';
import { STYLE_SHAPE_CONTROLS } from './styleShapeControls';
import { EFFECT_MOD_CATEGORY, EFFECT_LABELS } from './effectRegistry';
import { FULL_GRADIENT_TYPES, GRADIENT_DISPLAY_NAMES, STYLE_FIELD_GRADIENT_TYPES, familyOf } from './gradientEffects';

// The Advanced audio picker is a tree: Type (Gradient / Effect) > Source (one gradient or effect, merged gradients
// grouped under their family) > Parameter (grouped by the mode it belongs to when the source has several).

export type ModKind = 'gradient' | 'effect' | 'global';

export interface ModSource {
  kind: ModKind;
  id: string;
  // How the picker lists it (a merged gradient's member name, like Facets), and its full name for the bound list.
  label: string;
  name: string;
  // The merged-gradient family this belongs to (Waves > Ribbon), when it has one.
  family?: string;
  categories: string[];
}

// Categories that are really a mode of another gradient, shown as a sub-group of it.
const MODE_TITLES: Record<string, string> = {
  'Flow Field': 'Flow Field mode', Marks: 'Marks mode', 'Polar Grid': 'Polar Grid mode', Helix: 'Helix mode',
  'Grid Effect': 'Grid effect', [STYLED_GRADIENTS_CATEGORY]: 'All styled gradients',
};

const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);

export const MOD_SOURCES: ModSource[] = (() => {
  const out: ModSource[] = [];
  for (const id of FULL_GRADIENT_TYPES) {
    const base = GRADIENT_MOD_CATEGORY[id];
    if (!base) continue;
    const family = familyOf(id);
    const categories = (STYLE_FIELD_GRADIENT_TYPES as readonly string[]).includes(id) ? [...base, STYLED_GRADIENTS_CATEGORY] : base;
    out.push({
      kind: 'gradient', id, categories, name: GRADIENT_DISPLAY_NAMES[id],
      label: family ? (family.members.find(m => m.type === id)?.label ?? GRADIENT_DISPLAY_NAMES[id]) : GRADIENT_DISPLAY_NAMES[id],
      family: family?.label,
    });
  }
  for (const [id, categories] of Object.entries(EFFECT_MOD_CATEGORY)) {
    if (categories.length) out.push({ kind: 'effect', id, label: EFFECT_LABELS[id] ?? id, name: EFFECT_LABELS[id] ?? id, categories });
  }
  for (const category of GLOBAL_CATEGORIES) out.push({ kind: 'global', id: category, label: category, name: category, categories: [category] });
  return out;
})();

export const sourcesOf = (kind: ModKind): ModSource[] => MOD_SOURCES.filter(s => s.kind === kind);

// Gradient sources in picker order: A-Z by what the Gradient tab shows, a family's members together under its name.
export function groupedSources(kind: ModKind): { group: string | null; sources: ModSource[] }[] {
  const entries: { sortKey: string; group: string | null; sources: ModSource[] }[] = [];
  for (const s of sourcesOf(kind).sort(byLabel)) {
    if (s.family) {
      let e = entries.find(x => x.group === s.family);
      if (!e) { e = { sortKey: s.family, group: s.family, sources: [] }; entries.push(e); }
      e.sources.push(s);
    } else entries.push({ sortKey: s.label, group: null, sources: [s] });
  }
  return entries.sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(({ group, sources }) => ({ group, sources }));
}

export const findSource = (kind: ModKind, id: string): ModSource | undefined =>
  MOD_SOURCES.find(s => s.kind === kind && s.id === id);

const words = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

// "Grid Effect Sides" under Grid effect -> "Sides": the parent is already named by the picker above.
export function shortLabel(param: ModulatableParam, ...owners: string[]): string {
  const w = param.label.split(' ');
  let best = 0;
  for (const owner of owners) {
    const o = words(owner);
    let n = 0;
    while (n < o.length && n < w.length - 1 && words(w[n])[0] === o[n]) n++;
    best = Math.max(best, n);
  }
  return w.slice(best).join(' ');
}

// The two shape sliders of a styled gradient carry that gradient's own names (Smoke's Cloud and Stars).
function shapeLabel(param: ModulatableParam, source: ModSource): string | null {
  const index = param.key === 'fieldShapeA' ? 0 : param.key === 'fieldShapeB' ? 1 : -1;
  return index >= 0 ? STYLE_SHAPE_CONTROLS[source.id]?.[index]?.label ?? null : null;
}

// What a source's parameters look like in the third select: one group per category when it has several.
export function paramGroups(source: ModSource): { title: string | null; params: { param: ModulatableParam; label: string }[] }[] {
  const groups = source.categories.map(category => ({
    title: source.categories.length > 1 ? (MODE_TITLES[category] ?? (category === source.categories[0] ? 'Settings' : category)) : null,
    params: MODULATABLE_PARAMS.filter(p => p.category === category).map(param => ({ param, label: shapeLabel(param, source) ?? shortLabel(param, category, source.label) })).sort((a, b) => a.label.localeCompare(b.label)),
  })).filter(g => g.params.length > 0);
  return groups;
}

// The full name of a bound parameter, for the list of bindings: "Grid (effect) · Rows".
export function bindingLabel(key: string): string {
  const param = MODULATABLE_PARAMS.find(p => p.key === key);
  if (!param) return key;
  const owners = MOD_SOURCES.filter(s => s.categories.includes(param.category));
  if (owners.length === 0) return param.label;
  if (owners.length > 3) return `${MODE_TITLES[param.category] ?? param.category} · ${shortLabel(param, param.category)}`;
  const first = owners[0];
  const kinds = new Set(owners.map(o => o.kind));
  const clash = MOD_SOURCES.some(s => s.kind !== first.kind && s.name.toLowerCase() === first.name.toLowerCase());
  const name = owners.length === 1 ? first.name : [...new Set(owners.map(o => o.name))].join(' / ');
  const tag = kinds.size > 1 ? ' (gradient + effect)' : clash ? ` (${first.kind})` : '';
  // A mode of another gradient (Helix, Marks, ...) says so, so it cannot be mistaken for the main setting of the same name.
  const mode = first.categories[0] !== param.category && param.category !== 'Grid Effect' && MODE_TITLES[param.category] ? `${MODE_TITLES[param.category]}: ` : '';
  return `${name}${tag} · ${mode}${shortLabel(param, param.category, first.name)}`;
}
