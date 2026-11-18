import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'MegaBrainBot/2.2' }
      });
      clearTimeout(timeout);
      const html = await res.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      const ogDescMatch = html.match(/<meta[^>]+(?:name=["']description["']|property=["']og:description["'])[^>]+content=["']([^"']+)["']/i);
      const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

      const title = (ogTitleMatch?.[1] || titleMatch?.[1] || normalizedUrl).trim();
      const description = (ogDescMatch?.[1] || '').trim();
      const thumbnailUrl = (ogImgMatch?.[1] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80').trim();

      return NextResponse.json({
        url: normalizedUrl,
        title,
        description,
        thumbnailUrl
      });
    } catch {
      clearTimeout(timeout);
      const hostname = new URL(normalizedUrl).hostname.replace('www.', '');
      return NextResponse.json({
        url: normalizedUrl,
        title: `Conteúdo de ${hostname}`,
        description: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'
      });
    }
  } catch {
    return NextResponse.json({ error: 'Erro ao processar URL' }, { status: 500 });
  }
}
