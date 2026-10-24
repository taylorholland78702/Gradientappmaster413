import React, { useMemo, useState } from 'react';
import { CaretLeft, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { MOD_SOURCES, findSource, groupedSources, paramGroups, bindingLabel, type ModKind, type ModSource } from '../constants/modulationTree';
import { choice } from './choice';

const KIND_LABEL: Record<ModKind, string> = { gradient: 'Gradient', effect: 'Effect', global: 'Global' };
const KINDS: ModKind[] = ['gradient', 'effect', 'global'];

// The picker for the Advanced audio settings: search, shortcuts for the look on screen, and a drill-down through
// Gradient / Effect / Global > one of them > its setting. One level shows at a time, so it fits the narrow panel
// and works the same by touch and by keyboard.
interface Props {
  value: string;
  onChange: (key: string) => void;
  gradientType: string | null;
  activeEffects: readonly string[];
}

interface Entry { key: string; label: string; path: string; source: ModSource }

const ALL_ENTRIES: Entry[] = MOD_SOURCES.flatMap(source =>
  paramGroups(source).flatMap(group => group.params.map(({ param, label }) => ({
    key: param.key, label, path: `${KIND_LABEL[source.kind]} › ${source.name}`, source,
  }))),
);

const row = 'min-h-[var(--ctl-h)] w-full flex items-center justify-between gap-2 px-1.5 text-[10px] text-white text-left hover:bg-wav-hover transition-all';

export const AudioParamPicker: React.FC<Props> = ({ value, onChange, gradientType, activeEffects }) => {
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

  const pick = (key: string) => { onChange(key); setQuery(''); setPath([]); };

  // What is on screen right now: the gradient and each effect in use.
  const onScreen = useMemo(() => {
    const sources = [findSource('gradient', gradientType ?? ''), ...activeEffects.map(e => findSource('effect', e))].filter((s): s is ModSource => !!s);
    return sources.map(source => ({
      source,
      chips: paramGroups(source).flatMap(g => g.params).slice(0, 5),
    }));
  }, [gradientType, activeEffects]);

  const kind = path[0] as ModKind | undefined;
  const source = kind && path[1] ? findSource(kind, path[1]) : undefined;
  const crumb = source ? `${KIND_LABEL[kind!]} › ${source.name}` : kind ? KIND_LABEL[kind] : 'All settings';

  return (
    <div className="flex flex-col gap-2">
      <label className="relative flex items-center">
        <MagnifyingGlass weight="regular" className="absolute left-1.5 w-3 h-3 text-wav-text-3 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search audio settings"
          placeholder="Search: hue, speed, grid…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-[10px] text-white bg-wav-field border border-wav-line rounded pl-6 pr-1.5 py-1"
        />
      </label>

      {q ? (
        <div className="flex flex-col max-h-44 overflow-auto border border-wav-line" role="listbox" aria-label="Search results">
          {results.length === 0 && <div className="px-1.5 py-2 text-[10px] text-wav-text-3">Nothing matches. Try “speed” or “hue”.</div>}
          {results.map(e => (
            <button key={`${e.path}-${e.key}`} role="option" aria-selected={e.key === value} onClick={() => pick(e.key)} className={`${row} ${e.key === value ? 'bg-wav-active' : ''}`}>
              <span className="truncate">{e.label}</span>
              <span className="text-wav-text-3 truncate">{e.path}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {onScreen.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-wav-text-2">On screen now</span>
              {onScreen.map(({ source: s, chips }) => (
                <div key={`${s.kind}-${s.id}`} className="flex flex-col gap-1">
                  <span className="text-[10px] text-wav-text-3">{s.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {chips.map(({ param, label }) => (
                      <button key={param.key} aria-pressed={param.key === value} onClick={() => pick(param.key)} className={choice(param.key === value)}>{label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col border border-wav-line">
            <div className="flex items-center gap-1 px-1 border-b border-wav-line min-h-[24px]">
              {path.length > 0 && (
                <button aria-label="Back" title="Back" onClick={() => setPath(path.slice(0, -1))} className="wav-hit text-white hover:text-wav-text-2">
                  <CaretLeft weight="bold" className="w-3 h-3" />
                </button>
              )}
              <span className="text-[10px] text-wav-text-2 truncate">{crumb}</span>
            </div>
            <div className="flex flex-col max-h-44 overflow-auto">
              {!kind && KINDS.map(k => (
                <button key={k} onClick={() => setPath([k])} className={row}>
                  <span>{KIND_LABEL[k]}</span>
                  <CaretRight weight="bold" className="w-3 h-3 text-wav-text-3" aria-hidden="true" />
                </button>
              ))}
              {kind && !source && groupedSources(kind).map(({ group, sources }) => (
                <React.Fragment key={group ?? sources[0].id}>
                  {group && <div className="px-1.5 pt-1.5 pb-0.5 text-[10px] text-wav-text-3">{group}</div>}
                  {sources.map(s => (
                    <button key={s.id} onClick={() => setPath([kind, s.id])} className={`${row} ${group ? 'pl-3' : ''}`}>
                      <span>{s.label}</span>
                      <CaretRight weight="bold" className="w-3 h-3 text-wav-text-3" aria-hidden="true" />
                    </button>
                  ))}
                </React.Fragment>
              ))}
              {source && paramGroups(source).map(group => (
                <React.Fragment key={group.title ?? 'all'}>
                  {group.title && <div className="px-1.5 pt-1.5 pb-0.5 text-[10px] text-wav-text-3">{group.title}</div>}
                  {group.params.map(({ param, label }) => (
                    <button key={param.key} aria-pressed={param.key === value} onClick={() => pick(param.key)} className={`${row} ${param.key === value ? 'bg-wav-active' : ''}`}>
                      <span>{label}</span>
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-1 text-[10px]">
        <span className="text-wav-text-3 flex-shrink-0">Binding to</span>
        <span className="text-white truncate" title={bindingLabel(value)}>{bindingLabel(value)}</span>
      </div>
    </div>
  );
};
