import { cardPath, decodePreset, describeLook, readLook } from './_look';

// Serves the app's page for a shared link (/?preset=… or /?display=1&preset=…) with the look's name, description and
// a card image in the preview tags, so the link unfurls nicely in chat apps. The page itself is unchanged: the app
// reads the preset from the URL as it always did.
export const config = { runtime: 'edge' };

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Meta = { title: string; description: string; image: string; url: string };

export function injectMeta(html: string, meta: Meta): string {
  const t = escapeAttr(meta.title), d = escapeAttr(meta.description), i = escapeAttr(meta.image), u = escapeAttr(meta.url);
  const set = (page: string, attr: 'name' | 'property', key: string, value: string) => {
    const tag = `<meta ${attr}="${key}" content="${value}" />`;
    const re = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, 'i');
    return re.test(page) ? page.replace(re, () => tag) : page.replace('</head>', () => `  ${tag}\n</head>`);
  };
  let out = html.replace(/<title>[^<]*<\/title>/i, () => `<title>${t}</title>`);
  out = set(out, 'name', 'description', d);
  out = set(out, 'property', 'og:title', t);
  out = set(out, 'property', 'og:description', d);
  out = set(out, 'property', 'og:image', i);
  out = set(out, 'property', 'og:image:width', '1200');
  out = set(out, 'property', 'og:image:height', '630');
  out = set(out, 'property', 'og:url', u);
  out = set(out, 'name', 'twitter:card', 'summary_large_image');
  out = set(out, 'name', 'twitter:title', t);
  out = set(out, 'name', 'twitter:description', d);
  out = set(out, 'name', 'twitter:image', i);
  return out;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const page = await fetch(new URL('/index.html', url.origin));
  const html = await page.text();
  const look = readLook(decodePreset(url.searchParams.get('preset') ?? ''));
  const { title, description } = describeLook(look);
  const body = injectMeta(html, { title, description, image: new URL(cardPath(look), url.origin).toString(), url: url.toString() });
  return new Response(body, {
    status: page.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      // the same isolation headers vercel.json sets on every page (the app needs them for video export)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  });
}
