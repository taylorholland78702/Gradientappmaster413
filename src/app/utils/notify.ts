// A one-line notice shown by <NoticeToast/>. Replaces window.alert(), which blocks the render loop
// and is suppressed inside embeds.
const EVENT = 'wav-notice';

export function notify(message: string) {
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: message })); } catch { /* no window */ }
}

export function onNotice(handler: (message: string) => void): () => void {
  const listener = (e: Event) => handler(String((e as CustomEvent).detail ?? ''));
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
