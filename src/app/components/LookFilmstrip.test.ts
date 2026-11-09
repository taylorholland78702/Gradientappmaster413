import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LookFilmstrip } from './LookFilmstrip';

const render = (looks: { index: number; thumb: string | null }[], nowThumb: string | null = 'data:now') =>
  renderToStaticMarkup(createElement(LookFilmstrip, { looks, nowThumb, onJump: () => {}, isMobile: false }));

describe('LookFilmstrip', () => {
  it('shows nothing until there is a look to go back to', () => {
    expect(render([])).toBe('');
  });

  it('lists the looks oldest to newest, labelled by how far back each is, ending with the one on screen', () => {
    const html = render([{ index: 2, thumb: 'data:a' }, { index: 3, thumb: 'data:b' }, { index: 4, thumb: null }]);
    const labels = [...html.matchAll(/aria-label="(Go back \d+ looks?)"/g)].map(m => m[1]);
    expect(labels).toEqual(['Go back 3 looks', 'Go back 2 looks', 'Go back 1 look']);
    expect(html.indexOf('Go back 1 look')).toBeLessThan(html.indexOf('The look on screen now'));
    expect(html).toContain('src="data:a"');
    expect(html).toContain('aria-label="Hide recent looks"');
  });
});
