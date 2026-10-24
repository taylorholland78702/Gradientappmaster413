import { parseHexList, renderCard, CARD_WIDTH, CARD_HEIGHT } from './_card';
import { encodePng } from './_png';

// GET /api/og?c=2b1055-7597de-ff5e7e : the share-card image for a palette (1200x630 PNG).
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const colors = parseHexList(new URL(request.url).searchParams.get('c'));
  const png = await encodePng(CARD_WIDTH, CARD_HEIGHT, renderCard(colors));
  return new Response(png as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      // the same palette always gives the same picture
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  });
}
