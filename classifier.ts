import { LinkItem, MediaType, TaskCategory } from './types';

const STUDY_KEYWORDS = [
  'estudar', 'estudo', 'aula', 'curso', 'ler livro', 'artigo científico',
  'revisar matéria', 'exercício', 'simulado', 'resumo', 'aprender',
  'documentação', 'tutorial', 'faculdade', 'prova', 'pesquisa', 'paper',
  'capítulo', 'módulo', 'bootcamp', 'workshop'
];

const TNE_KEYWORDS = [
  'preparar site', 'arrumar site', 'organizar site', 'configurar', 'deploy', 'publicar',
  'pagar', 'comprar', 'agendar', 'limpar', 'arrumar', 'enviar email',
  'reunião', 'corrigir bug', 'backup', 'atualizar servidor', 'fazer compras',
  'médico', 'banco', 'boleto', 'manutenção', 'organizar pastas', 'domínio',
  'hospedagem', 'dns', 'layout', 'ajustar css', 'subir produção', 'instalar',
  'preparar ambiente', 'configurar ambiente'
];

export function classifyTaskRealtime(title: string): {
  category: TaskCategory;
  confidence: 'alta' | 'média';
  reason: string;
} {
  const normalized = title.toLowerCase().trim();
  if (!normalized) {
    return { category: 'TNE', confidence: 'média', reason: 'Aguardando texto...' };
  }

  for (const kw of TNE_KEYWORDS) {
    if (normalized.includes(kw)) {
      return {
        category: 'TNE',
        confidence: 'alta',
        reason: `Detectado padrão operacional/preparação ("${kw}") — classificado como TNE (Tarefa que Não é Estudo)`
      };
    }
  }

  for (const kw of STUDY_KEYWORDS) {
    if (normalized.includes(kw)) {
      return {
        category: 'ESTUDO',
        confidence: 'alta',
        reason: `Detectado padrão de aprendizagem ativa ("${kw}")`
      };
    }
  }

  return {
    category: 'TNE',
    confidence: 'média',
    reason: 'Classificado por padrão como Tarefa que Não é Estudo (TNE)'
  };
}

export function normalizeThemeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function learnFromHistory(
  url: string,
  fetchedTitle: string,
  fetchedDescription: string,
  historyLinks: LinkItem[]
): {
  suggestedTags: string[];
  suggestedTheme: string;
  suggestedFolderId: string | null;
  suggestedWhatIs: string;
  suggestedWhySaved: string;
  suggestedMediaType: MediaType;
  isStudy: boolean;
  learnedFromCount: number;
} {
  const lowerUrl = url.toLowerCase();
  const combinedText = `${lowerUrl} ${fetchedTitle.toLowerCase()} ${fetchedDescription.toLowerCase()}`;

  let domain = '';
  try {
    domain = new URL(lowerUrl.startsWith('http') ? lowerUrl : `https://${lowerUrl}`).hostname.replace('www.', '');
  } catch {
    domain = '';
  }

  let suggestedMediaType: MediaType = 'artigo';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo')) {
    suggestedMediaType = 'video';
  } else if (lowerUrl.endsWith('.pdf')) {
    suggestedMediaType = 'pdf';
  } else if (lowerUrl.includes('github.com') || lowerUrl.includes('vercel.app')) {
    suggestedMediaType = 'ferramenta';
  } else if (lowerUrl.includes('udemy') || lowerUrl.includes('coursera') || lowerUrl.includes('alura')) {
    suggestedMediaType = 'curso';
  }

  const tagScores: Record<string, number> = {};
  let bestSimilarity = 0;
  let matchedTheme = '';
  let matchedFolderId: string | null = null;
  let learnedWhatIs = '';
  let learnedWhySaved = '';
  let studyVotes = 0;
  let learnedFromCount = 0;

  for (const item of historyLinks) {
    let similarity = 0;
    if (domain && item.url.toLowerCase().includes(domain)) similarity += 3;
    if (item.mediaType === suggestedMediaType) similarity += 1;

    const itemTokens = `${item.title} ${item.themeName} ${item.whatIs} ${item.tags.join(' ')}`
      .toLowerCase()
      .split(/[^a-zà-ú0-9-]+/)
      .filter((w) => w.length > 3);

    for (const token of itemTokens) {
      if (combinedText.includes(token)) {
        similarity += 2;
      }
    }

    if (similarity > 0) {
      learnedFromCount++;
      for (const tag of item.tags) {
        tagScores[tag] = (tagScores[tag] || 0) + similarity;
      }
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        matchedTheme = item.themeName;
        matchedFolderId = item.folderId;
        if (item.whatIs) learnedWhatIs = item.whatIs;
        if (item.whySaved) learnedWhySaved = item.whySaved;
      }
      if (item.isStudy) studyVotes += similarity;
    } else {
      for (const tag of item.tags) {
        tagScores[tag] = (tagScores[tag] || 0) + 0.5;
      }
    }
  }

  const rankedTags = Object.entries(tagScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  const autoTags = new Set<string>(rankedTags);
  if (suggestedMediaType === 'video') autoTags.add('vídeo');
  if (combinedText.includes('ia') || combinedText.includes('ai') || combinedText.includes('llm')) {
    autoTags.add('inteligência-artificial');
  }
  if (combinedText.includes('next') || combinedText.includes('react') || combinedText.includes('typescript')) {
    autoTags.add('dev');
  }

  const isStudy =
    studyVotes >= 2 ||
    suggestedMediaType === 'curso' ||
    STUDY_KEYWORDS.some((k) => combinedText.includes(k));

  const defaultWhatIs = fetchedDescription
    ? fetchedDescription.slice(0, 140)
    : `${suggestedMediaType.toUpperCase()} sobre ${fetchedTitle || domain || url}`;

  return {
    suggestedTags: Array.from(autoTags).slice(0, 5),
    suggestedTheme: matchedTheme || (isStudy ? 'Estudos & Pesquisa' : 'Referências Gerais'),
    suggestedFolderId: matchedFolderId,
    suggestedWhatIs: fetchedDescription ? fetchedDescription.slice(0, 140) : (learnedWhatIs || defaultWhatIs),
    suggestedWhySaved:
      learnedWhySaved ||
      (isStudy
        ? 'Material de aprofundamento e estudo baseado nos seus salvamentos anteriores'
        : 'Referência prática alinhada ao seu histórico de consultas'),
    suggestedMediaType,
    isStudy,
    learnedFromCount
  };
}
