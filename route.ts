import { NextRequest, NextResponse } from 'next/server';

interface HistorySample {
  title: string;
  tags: string[];
  themeName: string;
  whatIs: string;
  whySaved: string;
  folderId: string | null;
  isStudy?: boolean;
}

function detectMediaType(url: string): 'video' | 'article' | 'image' | 'audio' | 'document' | 'tool' {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com') || u.includes('tiktok.com')) {
    return 'video';
  }
  if (u.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/) || u.includes('pinterest') || u.includes('unsplash')) {
    return 'image';
  }
  if (u.includes('spotify.com') || u.includes('soundcloud.com') || u.match(/\.(mp3|wav|ogg)(\?|$)/)) {
    return 'audio';
  }
  if (u.match(/\.(pdf|doc|docx|ppt|pptx)(\?|$)/) || u.includes('docs.') || u.includes('notion.site')) {
    return 'document';
  }
  if (u.includes('github.com') || u.includes('vercel.com') || u.includes('figma.com') || u.includes('npmjs.com')) {
    return 'tool';
  }
  return 'article';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url: string = body.url || '';
    const history: HistorySample[] = Array.isArray(body.history) ? body.history : [];

    if (!url) {
      return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 });
    }

    let pageTitle = '';
    let pageDescription = '';
    let ogImage = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MegaBrainBot/3.0)' }
      });
      clearTimeout(timeout);
      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const ogTitleMatch = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const descMatch = html.match(/name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const ogDescMatch = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const imgMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

        pageTitle = (ogTitleMatch?.[1] || titleMatch?.[1] || '').trim();
        pageDescription = (ogDescMatch?.[1] || descMatch?.[1] || '').trim();
        ogImage = (imgMatch?.[1] || '').trim();
      }
    } catch {
      // Fallback para extração por tokens da URL
    }

    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace('www.', '');
    if (!pageTitle) {
      const slug = parsedUrl.pathname
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace(/[-_]/g, ' ');
      pageTitle = slug ? `${slug.charAt(0).toUpperCase() + slug.slice(1)} (${domain})` : domain;
    }

    const mediaType = detectMediaType(url);
    const contextText = `${url} ${pageTitle} ${pageDescription}`.toLowerCase();

    // Aprendizado contínuo baseado nas tags, "O que é" e "Por que salvei" do histórico do usuário
    const tagWeights = new Map<string, number>();
    let bestSample: HistorySample | null = null;
    let bestScore = 0;

    for (const sample of history) {
      let score = 0;
      for (const tag of sample.tags || []) {
        const t = tag.toLowerCase();
        if (t.length >= 2 && contextText.includes(t)) {
          score += 3;
          tagWeights.set(t, (tagWeights.get(t) || 0) + 4);
        } else {
          tagWeights.set(t, (tagWeights.get(t) || 0) + 1);
        }
      }
      if (sample.themeName && contextText.includes(sample.themeName.toLowerCase())) {
        score += 4;
      }
      if (score > bestScore) {
        bestScore = score;
        bestSample = sample;
      }
    }

    // Extrai palavras-chave relevantes do domínio e título
    const domainTag = domain.split('.')[0];
    if (domainTag && domainTag.length > 2) {
      tagWeights.set(domainTag, (tagWeights.get(domainTag) || 0) + 3);
    }

    const suggestedTags = Array.from(tagWeights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);

    const whatIs =
      pageDescription ||
      (bestSample?.whatIs
        ? `Conteúdo relacionado a ${bestSample.themeName || domain}: ${pageTitle}`
        : `Recurso (${mediaType}) capturado de ${domain} sobre ${pageTitle}.`);

    const whySaved =
      bestSample?.whySaved ||
      `Referência salva automaticamente com base nos seus interesses em ${suggestedTags.join(', ') || domain}.`;

    return NextResponse.json({
      title: pageTitle,
      thumbnailUrl: ogImage || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      mediaType,
      tags: suggestedTags,
      themeName: bestSample?.themeName || (domainTag.charAt(0).toUpperCase() + domainTag.slice(1)),
      folderId: bestSample?.folderId || null,
      whatIs,
      whySaved,
      isStudy: bestSample?.isStudy ?? false
    });
  } catch {
    return NextResponse.json({ error: 'Falha ao analisar URL' }, { status: 500 });
  }
}
