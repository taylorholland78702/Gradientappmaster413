// URL-safe base64 encode/decode for embedding a preset's full state snapshot
// directly in a shareable link — no backend involved, so it works regardless
// of Firestore security rules (which this app doesn't control from the
// client and can't safely assume allow public reads on a new collection).
// TextEncoder/TextDecoder round-trip keeps this safe for unicode content
// (e.g. emoji effect characters) that plain btoa/atob would mangle.
export function encodePresetData(data: unknown): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePresetData(encoded: string): unknown {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}
