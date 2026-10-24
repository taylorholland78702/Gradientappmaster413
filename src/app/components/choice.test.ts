import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { choice, ChoiceChips } from './choice';

const noop = () => {};

describe('choice()', () => {
  it('gives every chip the same shape and fill rules', () => {
    for (const c of [choice(false), choice(true)]) {
      expect(c).toContain('wav-choice');
      expect(c).toContain('text-[10px]');
      expect(c).toContain('px-1.5');
      expect(c).not.toMatch(/\brounded/);
    }
  });

  it('selected is white with black bold text, resting is the field fill with the shared hover fill', () => {
    expect(choice(true)).toContain('bg-white text-black font-bold');
    expect(choice(false)).toContain('bg-wav-field text-white hover:bg-wav-hover');
    expect(choice(false)).not.toContain('font-bold');
  });

  it('only adds placement classes from the caller', () => {
    expect(choice(false, 'flex-1 shrink-0')).toContain('flex-1 shrink-0');
    expect(choice(false)).not.toContain('  ');
  });
});

describe('ChoiceChips', () => {
  const options = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta', title: 'Second' }, { id: 'c', label: 'Gamma' }];
  const html = (over = {}) => renderToStaticMarkup(createElement(ChoiceChips, { options, value: 'b', onChange: noop, ariaLabel: 'Letters', ...over }));

  it('renders one pressed chip inside a labelled group', () => {
    const h = html();
    expect(h).toContain('role="group" aria-label="Letters"');
    expect(h.match(/aria-pressed="true"/g)?.length).toBe(1);
    expect(h.match(/aria-pressed="false"/g)?.length).toBe(2);
    expect(h).toMatch(/aria-pressed="true"[^>]*title="Second"|title="Second"[^>]*aria-pressed="true"/);
  });

  it('shares the row by default and can opt out', () => {
    expect(html()).toContain('flex-auto');
    expect(html({ grow: false })).not.toContain('flex-auto');
  });

  it('disables every chip when asked', () => {
    expect(html({ disabled: true }).match(/disabled=""/g)?.length).toBe(3);
  });

  it('supports numeric ids', () => {
    const h = renderToStaticMarkup(createElement(ChoiceChips, { options: [{ id: 5, label: '5s' }, { id: 15, label: '15s' }], value: 15, onChange: noop, ariaLabel: 'Presets' }));
    expect(h.match(/aria-pressed="true"[^>]*>15s</g)?.length).toBe(1);
  });
});
