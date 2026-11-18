const TNE_KEYWORDS = [
  'organizar', 'organizacao', 'organização', 'arrumar', 'limpar', 'comprar',
  'pagar', 'boleto', 'fatura', 'banco', 'mercado', 'supermercado', 'consulta',
  'medico', 'médico', 'dentista', 'agendar', 'marcar', 'preparar site',
  'configurar dominio', 'configurar domínio', 'deploy', 'hospedagem', 'backup',
  'enviar email', 'responder', 'ligar', 'consertar', 'manutencao', 'manutenção',
  'documentos', 'cartorio', 'cartório', 'entrega', 'correios', 'compras',
  'lista de compras', 'lavar', 'cozinhar', 'reuniao', 'reunião', 'alinhamento'
];

const STUDY_KEYWORDS = [
  'estudar', 'estudo', 'ler artigo', 'capitulo', 'capítulo', 'livro', 'curso',
  'aula', 'modulo', 'módulo', 'exercicio', 'exercício', 'resumo', 'flashcard',
  'revisar', 'revisao', 'revisão', 'aprender', 'tutorial', 'documentacao',
  'documentação', 'pesquisa', 'paper', 'tese', 'prova', 'simulado', 'algoritmo'
];

export interface TneAnalysisResult {
  isTne: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchedKeyword?: string;
}

export function classifyTaskRealtime(title: string): TneAnalysisResult {
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!normalized) {
    return { isTne: false, confidence: 'low' };
  }

  for (const kw of STUDY_KEYWORDS) {
    const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normKw)) {
      return { isTne: false, confidence: 'high', matchedKeyword: kw };
    }
  }

  for (const kw of TNE_KEYWORDS) {
    const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normKw)) {
      return { isTne: true, confidence: 'high', matchedKeyword: kw };
    }
  }

  return { isTne: false, confidence: 'low' };
}
