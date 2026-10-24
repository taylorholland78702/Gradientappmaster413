import React, { useMemo, useState } from 'react';
import { CaretDown, CaretLeft, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { MOD_SOURCES, findSource, groupedSources, paramGroups, bindingLabel, type ModKind, type ModSource } from '../constants/modulationTree';

const KIND_LABEL: Record<ModKind, string> = { gradient: 'Gradient', effect: 'Effect', global: 'Global' };
const KINDS: ModKind[] = ['gradient', 'effect', 'global'];

// Picks the setting an audio binding will drive. Closed it is one field showing the choice; open it is a search box
// over a single list that goes one level at a time: the gradient and effects on screen first, then All settings
// (Gradient / Effect / Global), then one of them, then its setting.
interface Props {
  value: string;
  onChange: (key: string) => void;
  gradientType: string | null;
  activeEffects: readonly string[];
}

interface Entry { key: string; label: string; path: string }

const ALL_ENTRIES: Entry[] = MOD_SOURCES.flatMap(source =>
  paramGroups(source).flatMap(group => group.params.map(({ param, label }) => ({
    key: param.key, label, path: `${KIND_LABEL[source.kind]} › ${source.name}`,
  }))),
);

const row = 'min-h-[var(--ctl-h)] w-full flex items-center justify-between gap-2 px-1.5 text-[10px] text-white text-left hover:bg-wav-hover transition-all';
const heading = 'px-1.5 pt-2 pb-0.5 text-[10px] text-wav-text-3';
const caret = <CaretRight weight="bold" className="w-3 h-3 text-wav-text-3 flex-shrink-0" aria-hidden="true" />;

export const AudioParamPicker: React.FC<Props> = ({ value, onChange, gradientType, activeEffects }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [path, setPath] = useState<string[]>([]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    const words = q.split(/\s+/);
    return ALL_ENTRIES.filter(e => {
      const hay = `${e.label} ${e.path}`.toLowerCase();
      return words.every(w => hay.includes(w));
    }).slice(0, 40);
  }, [q]);

  const close = () => { setOpen(false); setQuery(''); setPath([]); };
  const pick = (key: string) => { onChange(key); close(); };

  // What is on screen right now: the gradient and each effect in use.
  const onScreen = useMemo(
    () => [findSource('gradient', gradientType ?? ''), ...activeEffects.map(e => findSource('effect', e))].filter((s): s is ModSource => !!s),
    [gradientType, activeEffects],
  );

  const kind = path[0] as ModKind | undefined;
  const source = kind && path[1] ? findSource(kind, path[1]) : undefined;
  const title = source ? `${KIND_LABEL[source.kind]} › ${source.name}` : kind ? KIND_LABEL[kind] : null;
  const go = (k: ModKind, id: string) => setPath([k, id]);

  const sourceButton = (s: ModSource, indent = false) => (
    <button key={`${s.kind}-${s.id}`} onClick={() => go(s.kind, s.id)} className={`${row} ${indent ? 'pl-3' : ''}`}>
      <span>{s.label}</span>{caret}
    </button>
  );

  return (
    <div className="flex flex-col gap-1">
      <button
        aria-expanded={open}
        aria-label={`Setting to modulate: ${bindingLabel(value)}`}
        onClick={() => (open ? close() : setOpen(true))}
        className="min-h-[var(--ctl-h)] w-full flex items-center justify-between gap-2 px-1.5 text-[10px] text-white bg-wav-field hover:bg-wav-hover transition-all"
      >
        <span className="truncate text-left">{bindingLabel(value)}</span>
        <CaretDown weight="regular" className={`w-3 h-3 text-wav-text-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="flex flex-col border border-wav-line">
          <label className="relative flex items-center border-b border-wav-line">
            <MagnifyingGlass weight="regular" className="absolute left-1.5 w-3 h-3 text-wav-text-3 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search audio settings"
              placeholder="Search: hue, speed, grid…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-[10px] text-white bg-transparent pl-6 pr-1.5 py-1.5 outline-none"
            />
          </label>

          {!q && path.length > 0 && (
            <div className="flex items-center gap-1 px-1 border-b border-wav-line min-h-[24px]">
              <button aria-label="Back" title="Back" onClick={() => setPath(path.slice(0, -1))} className="wav-hit text-white hover:text-wav-text-2">
                <CaretLeft weight="bold" className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-wav-text-2 truncate">{title}</span>
            </div>
          )}

          <div className="flex flex-col max-h-56 overflow-auto" role={q ? 'listbox' : undefined} aria-label={q ? 'Search results' : undefined}>
            {q && results.length === 0 && <div className="px-1.5 py-2 text-[10px] text-wav-text-3">Nothing matches. Try “speed” or “hue”.</div>}
            {q && results.map(e => (
              <button key={`${e.path}-${e.key}`} role="option" aria-selected={e.key === value} onClick={() => pick(e.key)} className={`${row} ${e.key === value ? 'bg-wav-active' : ''}`}>
                <span className="truncate">{e.label}</span>
                <span className="text-wav-text-3 truncate">{e.path}</span>
              </button>
            ))}

            {!q && !kind && (
              <>
                {onScreen.length > 0 && <div className={heading}>On screen now</div>}
                {onScreen.map(s => sourceButton(s))}
                <div className={heading}>All settings</div>
                {KINDS.map(k => (
                  <button key={k} onClick={() => setPath([k])} className={row}><span>{KIND_LABEL[k]}</span>{caret}</button>
                ))}
              </>
            )}

            {!q && kind && !source && groupedSources(kind).map(({ group, sources }) => (
              <React.Fragment key={group ?? sources[0].id}>
                {group && <div className={heading}>{group}</div>}
                {sources.map(s => sourceButton(s, !!group))}
              </React.Fragment>
            ))}

            {!q && source && paramGroups(source).map(group => (
              <React.Fragment key={group.title ?? 'all'}>
                {group.title && <div className={heading}>{group.title}</div>}
                {group.params.map(({ param, label }) => (
                  <button key={param.key} aria-pressed={param.key === value} onClick={() => pick(param.key)} className={`${row} ${param.key === value ? 'bg-wav-active' : ''}`}>
                    <span>{label}</span>
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
