import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EffectSection, EffectOrderCtx } from './EffectSection';

const section = (id: string, label: string, isMulti = true) =>
  createElement(EffectSection, { id, label, isMulti, expanded: false, onToggle: () => {}, children: null });
const withOrder = (order: string[], ...kids: ReturnType<typeof section>[]) =>
  renderToStaticMarkup(createElement(EffectOrderCtx.Provider, { value: { order, move: () => {} } }, ...kids));

describe('EffectSection order', () => {
  it('lays each panel out at its place in the apply order, with a handle to move it', () => {
    const html = withOrder(['mirror', 'blur'], section('blur', 'Blur'), section('mirror', 'Mirror'));
    expect(html).toMatch(/data-effect-section="blur"[^>]*style="order:1"/);
    expect(html).toMatch(/data-effect-section="mirror"[^>]*style="order:0"/);
    expect(html).toContain('aria-label="Move Blur in the effect order"');
  });

  it('draws no divider under the panel that is last in the order, whichever comes last in the page', () => {
    const html = withOrder(['mirror', 'blur'], section('blur', 'Blur'), section('mirror', 'Mirror'));
    const blur = html.slice(html.indexOf('data-effect-section="blur"'), html.indexOf('data-effect-section="mirror"'));
    const mirror = html.slice(html.indexOf('data-effect-section="mirror"'));
    expect(blur).not.toContain('border-b');
    expect(mirror).toContain('border-b');
  });

  it('shows no handle and no wrapper for a single effect', () => {
    const html = renderToStaticMarkup(createElement(EffectSection, { id: 'blur', label: 'Blur', isMulti: false, expanded: true, onToggle: () => {}, children: 'x' }));
    expect(html).toBe('x');
  });
});
