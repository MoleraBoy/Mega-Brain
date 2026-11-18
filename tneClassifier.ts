import { BrainItem, ModuleCategory } from './types';

const TNE_KEYWORDS = [
  'arrumar site', 'configurar', 'instalar', 'layout', 'css', 'hospedagem',
  'domínio', 'servidor', 'organizar pasta', 'backup', 'comprar caderno',
  'formatar', 'atualizar sistema', 'deploy', 'ajustar', 'manutenção',
  'limpar', 'setup', 'planilha', 'template', 'notion', 'ferramenta'
];

const CATEGORY_HINTS: Record<string, { category: ModuleCategory; genre: string; whatIsIt: string }> = {
  'youtube.com': { category: 'estudos', genre: 'Videoaula / Vídeo', whatIsIt: 'Vídeo salvo do YouTube para assistir e anotar' },
  'youtu.be': { category: 'estudos', genre: 'Videoaula / Vídeo', whatIsIt: 'Vídeo salvo do YouTube' },
  'imdb.com': { category: 'media_geral', genre: 'Cinema / Série', whatIsIt: 'Referência de filme ou série' },
  'myanimelist.net': { category: 'media_geral', genre: 'Anime / Mangá', whatIsIt: 'Anime ou mangá na lista para acompanhar' },
  'spotify.com': { category: 'musicas', genre: 'Playlist / Álbum', whatIsIt: 'Música ou playlist salva para ouvir' },
  'github.com': { category: 'estudos', genre: 'Repositório / Código', whatIsIt: 'Projeto ou código-fonte de referência técnica' },
  'tudogostoso': { category: 'receitas', genre: 'Culinária', whatIsIt: 'Receita culinária para testar na cozinha' },
  'receita': { category: 'receitas', genre: 'Culinária', whatIsIt: 'Receita prática salva' },
  'terror': { category: 'media_terror', genre: 'Terror / Suspense', whatIsIt: 'Obra de terror selecionada' },
  'comedia': { category: 'media_comedia', genre: 'Comédia', whatIsIt: 'Entretenimento leve de comédia' },
  'comédia': { category: 'media_comedia', genre: 'Comédia', whatIsIt: 'Entretenimento leve de comédia' },
  'pdf': { category: 'estudos', genre: 'Documento PDF', whatIsIt: 'Material de leitura em PDF' }
};

export function detectIsTNE(title: string, whatIsIt: string, whySaved: string, tags: string[]): boolean {
  const haystack = `${title} ${whatIsIt} ${whySaved} ${tags.join(' ')}`.toLowerCase();
  return TNE_KEYWORDS.some((kw) => haystack.includes(kw));
}

export function inferMetadataFromHistory(
  inputTitleOrUrl: string,
  existingItems: BrainItem[]
): {
  suggestedCategory: ModuleCategory;
  suggestedGenre: string;
  suggestedWhatIsIt: string;
  suggestedWhySaved: string;
  suggestedTags: string[];
  isTNE: boolean;
} {
  const query = inputTitleOrUrl.toLowerCase().trim();
  const tokens = query.split(/[\s\-_/.:?=&]+/).filter((t) => t.length > 2);

  // 1. Aprender com itens já salvos pelo usuário (tags, "o que é" e "por que salvei")
  let bestMatch: BrainItem | null = null;
  let highestScore = 0;

  for (const item of existingItems) {
    let score = 0;
    const itemCorpus = `${item.title} ${item.genreOrTopic} ${item.whatIsIt} ${item.whySaved} ${item.tags.join(' ')}`.toLowerCase();
    for (const token of tokens) {
      if (itemCorpus.includes(token)) score += 2;
      if (item.tags.some((t) => t.toLowerCase() === token)) score += 3;
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  let suggestedCategory: ModuleCategory = 'links_gerais';
  let suggestedGenre = 'Geral';
  let suggestedWhatIsIt = '';
  let suggestedWhySaved = '';
  const tagSet = new Set<string>();

  if (bestMatch && highestScore >= 2) {
    suggestedCategory = bestMatch.category;
    suggestedGenre = bestMatch.genreOrTopic;
    suggestedWhatIsIt = bestMatch.whatIsIt;
    suggestedWhySaved = `Relacionado a "${bestMatch.title}" — ${bestMatch.whySaved}`;
    bestMatch.tags.slice(0, 4).forEach((t) => tagSet.add(t));
  }

  // 2. Regras heurísticas complementares por domínio/palavra-chave
  for (const [pattern, hint] of Object.entries(CATEGORY_HINTS)) {
    if (query.includes(pattern)) {
      if (!bestMatch || highestScore < 2) {
        suggestedCategory = hint.category;
        suggestedGenre = hint.genre;
        suggestedWhatIsIt = hint.whatIsIt;
      }
      tagSet.add(pattern.replace('.com', '').replace('.net', ''));
    }
  }

  // Extrair possíveis tags frequentes do usuário que batem com o texto
  const allUserTags = Array.from(new Set(existingItems.flatMap((i) => i.tags)));
  for (const uTag of allUserTags) {
    if (query.includes(uTag.toLowerCase())) {
      tagSet.add(uTag);
    }
  }

  const tags = Array.from(tagSet);
  const isTNE = suggestedCategory === 'estudos' && detectIsTNE(query, suggestedWhatIsIt, suggestedWhySaved, tags);

  return {
    suggestedCategory,
    suggestedGenre,
    suggestedWhatIsIt,
    suggestedWhySaved,
    suggestedTags: tags,
    isTNE,
  };
}
