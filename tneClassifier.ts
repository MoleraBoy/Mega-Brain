// Classificador em tempo real de TNE (Tarefas que Não são Estudo)
// Se o usuário salva algo em pasta de estudos ou digita uma atividade que é apenas preparação/manutenção/organização
// (ex.: arrumar um site, configurar ferramentas, comprar algo, organizar pastas), marca automaticamente como TNE.

const TNE_KEYWORDS = [
  'arrumar site',
  'arrumar o site',
  'configurar',
  'instalar',
  'organizar',
  'limpar',
  'comprar',
  'pagar',
  'agendar',
  'baixar',
  'atualizar',
  'backup',
  'deploy',
  'subir no github',
  'criar pasta',
  'preparar ambiente',
  'preparar site',
  'manutenção',
  'consertar',
  'formatar',
  'formatação',
  'layout',
  'css',
  'domínio',
  'hospedagem'
];

const STUDY_KEYWORDS = [
  'estudar',
  'ler',
  'capítulo',
  'aula',
  'curso',
  'resumo',
  'exercício',
  'exercícios',
  'prova',
  'artigo científico',
  'revisar matéria',
  'apostila',
  'simulado',
  'aprender',
  'pesquisar sobre',
  'documentação',
  'teoria',
  'conceito'
];

export interface ClassificationResult {
  isTne: boolean;
  reason: string;
}

export function classifyContentRealtime(
  text: string,
  inStudyFolder: boolean = false
): ClassificationResult {
  const lower = text.toLowerCase().trim();
  if (!lower) {
    return {
      isTne: false,
      reason: 'Aguardando descrição para análise semântica...'
    };
  }

  const matchedTne = TNE_KEYWORDS.find((kw) => lower.includes(kw));
  const matchedStudy = STUDY_KEYWORDS.find((kw) => lower.includes(kw));

  if (matchedTne && !matchedStudy) {
    return {
      isTne: true,
      reason: inStudyFolder
        ? `Salvo em pasta de Estudo, mas detectado como operacional/preparação ("${matchedTne}") -> Classificado como TNE.`
        : `Atividade operacional/preparação detectada ("${matchedTne}") -> Classificada como TNE.`
    };
  }

  if (matchedStudy) {
    return {
      isTne: false,
      reason: `Conteúdo de aprendizagem detectado ("${matchedStudy}") -> Matéria/Estudo.`
    };
  }

  if (inStudyFolder) {
    return {
      isTne: false,
      reason: 'Dentro de pasta de Estudos sem indício operacional -> Matéria/Estudo.'
    };
  }

  return {
    isTne: true,
    reason: 'Item geral sem marcador explícito de matéria -> Classificado como TNE.'
  };
}
