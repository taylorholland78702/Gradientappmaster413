import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SliderRow } from './SliderRow';

const noop = () => {};
const html = (props: Partial<Parameters<typeof SliderRow>[0]> = {}, ...kids: unknown[]) =>
  renderToStaticMarkup(createElement(SliderRow, { label: 'Exposure:', value: 0.5, onChange: noop, min: 0, max: 1, step: 0.05, ...props }, ...(kids as []) ));

describe('SliderRow', () => {
  it('renders a label, a range and a number box that share one value and bounds', () => {
    const h = html();
    expect(h).toContain('>Exposure:</label>');
    expect(h.match(/type="range"/g)?.length).toBe(1);
    expect(h.match(/type="number"/g)?.length).toBe(1);
    expect(h.match(/value="0.5"/g)?.length).toBe(2);
    expect(h.match(/min="0"/g)?.length).toBe(2);
    expect(h.match(/max="1"/g)?.length).toBe(2);
    expect(h.match(/step="0.05"/g)?.length).toBe(2);
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
