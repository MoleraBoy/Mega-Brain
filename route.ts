import { NextRequest, NextResponse } from 'next/server';

interface HistorySample {
  title: string;
  tags: string[];
  themeName: string;
  whatIs: string;
  whySaved: string;
  folderId: string | null;
}

function inferMediaType(url: string): 'video' | 'article' | 'image' | 'audio' | 'document' | 'tool' {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
    return 'video';
  }
  if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) {
    return 'image';
  }
  if (lower.match(/\.(mp3|wav|ogg)$/) || lower.includes('spotify.com')) {
    return 'audio';
  }
  if (lower.endsWith('.pdf') || lower.includes('/docs')) {
    return 'document';
  }
  if (lower.includes('github.com') || lower.includes('vercel.com') || lower.includes('figma.com')) {
    return 'tool';
  }
  return 'article';
}

function extractMeta(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match && match[1] ? match[1].replace(/\s+/g, ' ').trim() : '';
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
    let description = '';
    let thumbnailUrl = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MegaBrainBot/2.3)'
        }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        pageTitle =
          extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
          extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i);
        description =
          extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
          extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
        thumbnailUrl = extractMeta(
          html,
          /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
        );
      }
    } catch {
      // Fallback silencioso caso o site bloqueie scraping
    }

    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    if (!pageTitle) {
      pageTitle = `${hostname} — ${parsedUrl.pathname.replace(/\//g, ' ').trim() || 'Link Salvo'}`;
    }

    // Aprendizado contínuo cruzando metadados com tags e exemplos do histórico do usuário
    const tagFrequency = new Map<string, number>();
    for (const item of history) {
      for (const tag of item.tags || []) {
        const norm = tag.toLowerCase().trim();
        if (norm) tagFrequency.set(norm, (tagFrequency.get(norm) || 0) + 1);
      }
    }

    const corpus = `${url} ${pageTitle} ${description}`.toLowerCase();
    const matchedHistoryTags = Array.from(tagFrequency.entries())
      .filter(([tag]) => corpus.includes(tag))
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 4);

    const domainTag = hostname.split('.')[0];
    const suggestedTags = Array.from(new Set([...matchedHistoryTags, domainTag])).slice(0, 5);

    // Encontra item histórico mais próximo para espelhar estilo de "O que é", "Por que salvei", Tema e Pasta
    let bestMatch: HistorySample | null = null;
    let bestScore = 0;
    for (const sample of history) {
      let score = 0;
      for (const tag of sample.tags || []) {
        if (corpus.includes(tag.toLowerCase())) score += 2;
      }
      if (sample.themeName && corpus.includes(sample.themeName.toLowerCase())) {
        score += 3;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sample;
      }
    }

    const mediaType = inferMediaType(url);
    const whatIs =
      description ||
      (bestMatch?.whatIs
        ? `Conteúdo relacionado a ${bestMatch.themeName || domainTag}: ${pageTitle}`
        : `Recurso web (${mediaType}) hospedado em ${hostname}.`);

    const whySaved =
      bestMatch?.whySaved ||
      `Consultar e aplicar insights de ${pageTitle} nos próximos projetos.`;

    return NextResponse.json({
      title: pageTitle,
      thumbnailUrl,
      mediaType,
      tags: suggestedTags,
      themeName: bestMatch?.themeName || '',
      folderId: bestMatch?.folderId || null,
      whatIs,
      whySaved
    });
  } catch {
    return NextResponse.json({ error: 'Falha ao analisar URL' }, { status: 500 });
  }
}
