import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SliderRow } from './SliderRow';

const noop = () => {};
const html = (props: Partial<Parameters<typeof SliderRow>[0]> = {}, ...kids: unknown[]) =>
  renderToStaticMarkup(createElement(SliderRow, { label: 'Exposure:', value: 0.5, onChange: noop, min: 0, max: 1, step: 0.05, ...props }, ...(kids as []) ));

describe('SliderRow', () => {
  it('renders a label, a range and a number box that share one value and bounds', () => {
    const h = html({ min: 0, max: 100, step: 5, value: 50 });
    expect(h).toContain('>Exposure:</label>');
    expect(h.match(/type="range"/g)?.length).toBe(1);
    expect(h.match(/type="number"/g)?.length).toBe(1);
    expect(h.match(/value="50"/g)?.length).toBe(2);
    expect(h.match(/min="0"/g)?.length).toBe(2);
    expect(h.match(/max="100"/g)?.length).toBe(2);
    expect(h.match(/step="5"/g)?.length).toBe(2);
  });

  it('shows a slider that moves in fractions as 0-100, and keeps the real value for the tooltip', () => {
    // 0.3 to 3 in 0.05 steps, at 1.65: halfway.
    const h = html({ min: 0.3, max: 3, step: 0.05, value: 1.65 });
    expect(h.match(/value="50"/g)?.length).toBe(2);
    expect(h.match(/min="0"/g)?.length).toBe(2);
    expect(h.match(/max="100"/g)?.length).toBe(2);
    expect(h.match(/step="1"/g)?.length).toBe(2);
    expect(h).toContain('title="Actual value 1.65"');
  });

  it('leaves a slider that already moves in whole units alone', () => {
    const h = html({ min: 2, max: 16, step: 1, value: 9 });
    expect(h.match(/value="9"/g)?.length).toBe(2);
    expect(h.match(/max="16"/g)?.length).toBe(2);
    expect(h).not.toContain('Actual value');
  });

  it('uses the same three-column grid for every row so tracks line up', () => {
    const a = html({ label: 'A:' });
    const b = html({ label: 'A much longer label:' });
    const grid = (s: string) => s.match(/grid-cols-\[[^\]]+\]/)?.[0];
    expect(grid(a)).toBe('grid-cols-[4.75rem_minmax(0,1fr)_3rem]');
    expect(grid(b)).toBe(grid(a));
  });

  it('adds a fourth column only when it has a trailing control', () => {
    const h = renderToStaticMarkup(createElement(SliderRow, { label: 'Intensity:', value: 1, onChange: noop }, createElement('button', null, 'x')));
    expect(h).toContain('grid-cols-[4.75rem_minmax(0,1fr)_3rem_auto]');
    expect(h).toContain('<button>x</button>');
  });

  it('labels the range for assistive tech from a string label, without the colon', () => {
    expect(html({ label: 'Cell Size:' })).toContain('aria-label="Cell Size"');
  });

  it('passes a tooltip through to the row', () => {
    expect(html({ title: 'Brightens in stops' })).toContain('title="Brightens in stops"');
  });
});
