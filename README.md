# Mega Brain v2-3 — Hub Pessoal & Segundo Cérebro (Estrutura Plana / Flat)

Sistema completo de gestão de links, mídias, pastas recursivas, histórico de consumo real, tarefas (Estudo vs. TNE), relatórios inteligentes e Espaço Privado protegido por PIN + Biometria (WebAuthn), construído com **Next.js (App Router)**, **Material Design 3** e **Supabase / LocalStorage híbrido**.

## Estrutura Plana (Sem Subdiretórios)

Todos os arquivos deste repositório estão na raiz para facilitar o upload direto no GitHub. Para rodar o projeto localmente ou fazer deploy (Vercel/Netlify), execute o script de organização antes de iniciar:

```bash
node setup-structure.js
npm install
npm run dev
```

O script `setup-structure.js` distribui automaticamente os arquivos nos diretórios padrão do Next.js (`app/`, `app/api/analyze/`, `components/`, `lib/`) mantendo todos os imports consistentes.

## Funcionalidades Implementadas (v2-3)

1. **Correção do Bug do Segundo Link com o Mesmo Tema (`UPSERT` Idempotente)**:
   - Normalização case-insensitive de temas e `upsert` atômico tanto no armazenamento local quanto na RPC PostgreSQL (`supabase-schema.sql`), permitindo cadastrar múltiplos links (comuns e de estudo) no mesmo tema sem falha silenciosa ou duplicação.
2. **Aprendizado Contínuo (Tags, "O que é" e "Por que salvei")**:
   - Endpoint de análise de URL (`/api/analyze`) + heurística inteligente que extrai metadados da página e cruza com as tags mais frequentes e exemplos anteriores do histórico do usuário para sugerir automaticamente tags, tema, pasta, *"O que é"* e *"Por que salvei"*.
3. **Pastas e Subpastas Recursivas**:
   - Criação ilimitada de subpastas dentro de qualquer pasta (`parentId`), árvore hierárquica e navegação completa por **breadcrumb**.
4. **Material Design 3 + Edição de Exibição e Filtros**:
   - Tokens de superfície e elevação MD3, 4 modos de visualização (**Só Nome**, **Só Thumb**, **Miniatura de Tudo**, **Detalhado**), toggles individuais por campo e filtros combináveis (**Pasta**, **Tag**, **Tipo de Mídia** e **Somente Estudos**).
5. **Aba "Links e Mídias" no Menu Superior**:
   - Lista global com o caminho completo da pasta/subpasta de cada item (`Raiz / Estudos / React`) e seletor rápido para mover qualquer item entre pastas/subpastas ou criar uma nova subpasta na hora.
6. **Fluxo de Consumo Real ("Visto" -> Histórico vs. Excluir) + Relatórios Inteligentes & TNE**:
   - Clicar no link ou excluí-lo não contabiliza consumo. O botão **"Visto"** pergunta se deseja manter no Histórico (*Sim* -> move para Histórico e soma no relatório; *Não* -> remove da lista ativa mas registra a visita no relatório).
   - Detecção automática em tempo real de **TNE (Tarefas que Não são Estudo)** (ex.: organização, compras, preparação de site, manutenção) com métricas separadas de conclusão e adiamento.
   - Seção de Estudos nos relatórios totalmente oculta caso nenhum conteúdo ou tarefa de estudo tenha sido registrado.
7. **Espaço Privado com PIN e Digital no Celular (WebAuthn)**:
   - Proteção por PIN numérico (hash SHA-256) e autenticação biométrica nativa do dispositivo via **WebAuthn** (`navigator.credentials`), isolando pastas, subpastas, links e tarefas privadas das estatísticas gerais (com toggle opcional nos relatórios).
