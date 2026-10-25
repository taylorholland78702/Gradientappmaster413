// True on phones and tablets (iPads that report as Macs included). Their browsers don't reliably save a file written
// from a script after a long wait, and their video encoders and memory are far smaller than a desktop's.
export function isTouchPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return true;
  return navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1;
}
