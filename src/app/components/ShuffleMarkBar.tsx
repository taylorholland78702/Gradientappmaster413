import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { shuffleMarks, summarize, DEFAULT_TARGET, type RateRow } from '../utils/shuffleMarks';
import { choice } from './choice';

// The marking tool: a bar at the top of the screen while you shuffle and mark each look Keep or Skip. When the session
// ends it shows what it learned and offers the numbers to copy.

const pct = (v: number) => `${Math.round(v * 100)}%`;
const rowText = (rows: RateRow[]) => rows.map(r => `${r.id} (${r.kept}/${r.total})`).join(', ');

export function ShuffleMarkBar({ onShuffle }: { onShuffle: () => void }) {
  useSyncExternalStore(shuffleMarks.subscribe, shuffleMarks.getVersion, shuffleMarks.getVersion);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wasActive = useRef(false);
  const active = shuffleMarks.active;
  const done = shuffleMarks.sessionMarks.length;
  const target = shuffleMarks.target;
  const ready = !!shuffleMarks.current;

  // Starting a session shuffles the first look.
  useEffect(() => {
    if (active && !wasActive.current) { setSummaryOpen(false); setCopied(false); onShuffle(); }
    wasActive.current = active;
  }, [active, onShuffle]);

  const mark = useCallback((verdict: 'keep' | 'skip') => {
    if (!shuffleMarks.mark(verdict)) return;
    if (shuffleMarks.sessionMarks.length >= shuffleMarks.target) setSummaryOpen(true);
    else window.setTimeout(onShuffle, 120);
  }, [onShuffle]);

  useEffect(() => {
    if (!active || summaryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'k' || e.key === 'K') { e.preventDefault(); mark('keep'); }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); mark('skip'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, summaryOpen, mark]);

  if (!active) return null;

  const copy = async () => {
    const text = shuffleMarks.export();
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
  };

  const shell = 'fixed left-1/2 -translate-x-1/2 z-50 max-w-[92vw] bg-wav-surface border border-wav-line-strong text-white text-[10px] flex flex-col gap-2 p-2';
  const top = { top: 'max(12px, env(safe-area-inset-top))' };

  if (summaryOpen) {
    const s = summarize(shuffleMarks.sessionMarks);
    const best = [...s.effects, ...s.gradients].filter(r => r.total >= 3 && r.rate >= 0.75).sort((a, b) => b.rate - a.rate).slice(0, 4);
    const worst = [...s.effects, ...s.gradients].filter(r => r.total >= 3 && r.rate <= 0.25).sort((a, b) => a.rate - b.rate).slice(0, 4);
    return (
      <div className={`${shell} w-[360px]`} style={top} role="dialog" aria-label="Shuffle marking results">
        <div className="text-[11px] font-bold">You kept {s.kept} of {s.total} ({pct(s.keepRate)})</div>
        {s.scoreAuc !== null
          ? <div>The frame score put your keeps above your skips {pct(s.scoreAuc)} of the time (50% is chance, 100% is perfect).</div>
          : <div className="text-wav-text-2">Mark at least three of each to see how well the frame score agrees with you.</div>}
        {best.length > 0 && <div><span className="text-wav-text-2">Kept most: </span>{rowText(best)}</div>}
        {worst.length > 0 && <div><span className="text-wav-text-2">Skipped most: </span>{rowText(worst)}</div>}
        {s.features.length > 0 && <div><span className="text-wav-text-2">Biggest difference: </span>{s.features[0].name} ({s.features[0].keptMean} kept, {s.features[0].skippedMean} skipped)</div>}
        <div className="flex flex-wrap gap-1">
          <button onClick={copy} className={choice(copied, 'flex-auto')}>{copied ? 'Copied' : 'Copy results'}</button>
          <button onClick={() => { shuffleMarks.start(shuffleMarks.target + 15); }} className={choice(false, 'flex-auto')}>Mark 15 more</button>
          <button onClick={() => shuffleMarks.stop()} className={choice(false, 'flex-auto')}>Close</button>
        </div>
        <button onClick={() => { shuffleMarks.clear(); shuffleMarks.stop(); }} className="self-start text-wav-text-3 hover:text-white transition-all">Delete all marks</button>
        <div className="text-wav-text-3">Paste the copied results to Claude to tune the score and the taste table. Your marks have already taught Shuffle.</div>
      </div>
    );
  }

  return (
    <div className={`${shell} w-[320px]`} style={top} role="group" aria-label="Mark this shuffle">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">Mark this look · {Math.min(done + 1, target)} of {target}</span>
        <button onClick={() => (done > 0 ? setSummaryOpen(true) : shuffleMarks.stop())} className="text-wav-text-3 hover:text-white transition-all">{done > 0 ? 'Finish' : 'Cancel'}</button>
      </div>
      <div className="flex gap-1">
        <button onClick={() => mark('keep')} disabled={!ready} className={choice(false, 'flex-1 disabled:opacity-50')}>Keep (K)</button>
        <button onClick={() => mark('skip')} disabled={!ready} className={choice(false, 'flex-1 disabled:opacity-50')}>Skip (N)</button>
      </div>
      <div className="text-wav-text-3">{ready ? 'Would you want to keep looking at this?' : 'Shuffling…'}</div>
    </div>
  );
}

export { DEFAULT_TARGET };
