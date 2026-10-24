import { useEffect } from 'react';

// Keeps the --slider-pct CSS variable in step with every range input so the fill tracks the thumb. Moved out of InteractiveGradient unchanged.
export function useSliderFill() {
  // Sync --slider-pct CSS var so the purple-pink fill tracks the thumb position
  useEffect(() => {
    const update = (el: HTMLInputElement) => {
      const min = Number(el.min) || 0;
      const max = Number(el.max) || 100;
      const pct = ((Number(el.value) - min) / (max - min)) * 100;
      el.style.setProperty('--slider-pct', `${Math.max(0, Math.min(100, pct))}%`);
    };
    const initAll = () =>
      document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(update);

    // Update on every input event (range drag or keyboard on range)
    const onInput = (e: Event) => { if ((e.target as HTMLElement).matches('input[type="range"]')) update(e.target as HTMLInputElement); };
    document.addEventListener('input', onInput);

    // New sliders appearing (conditional renders / dropdowns opening) are
    // already covered by the deps-less effect below, which re-syncs every
    // range input after every render — no need for a separate
    // document-wide MutationObserver duplicating that on top of it (that
    // used to fire a full-document querySelectorAll on any DOM mutation
    // anywhere in the app, not just slider-related ones).
    initAll();
    return () => {
      document.removeEventListener('input', onInput);
    };
  }, []);

  // Re-sync all range fills after every render (catches number-input keyboard changes
  // that update React state → re-render the range value but fire no DOM input event)
  useEffect(() => {
    document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(el => {
      const min = Number(el.min) || 0;
      const max = Number(el.max) || 100;
      const pct = ((Number(el.value) - min) / (max - min)) * 100;
      el.style.setProperty('--slider-pct', `${Math.max(0, Math.min(100, pct))}%`);
    });
  });
}
