import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// A tiny renderHook for tests: mounts a component that calls the hook on every render and exposes the latest result.
// (No @testing-library dependency; React's own act() flushes effects.)
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export function renderHook<Props, Result>(useHook: (props: Props) => Result, initialProps: Props) {
  let result!: Result;
  let currentProps = initialProps;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const Probe = ({ hookProps }: { hookProps: Props }): ReactElement | null => {
    result = useHook(hookProps);
    return null;
  };
  const render = () => act(() => { root.render(createElement(Probe, { hookProps: currentProps })); });
  render();
  return {
    get current() { return result; },
    rerender(next?: Props) { if (next !== undefined) currentProps = next; render(); },
    unmount() { act(() => root.unmount()); container.remove(); },
    act,
  };
}
