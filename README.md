# Mega Brain v2.2 - Hub Pessoal & Segundo Cérebro

Aplicação completa em Next.js + TypeScript + Tailwind CSS (Material Design 3) + Supabase (com fallback offline automático em `localStorage`).

## Novidades da v2.2

1. **UPSERT Idempotente de Temas (Correção definitiva do 2º link no mesmo tema)**:
   - Normalização case-insensitive e trim no nome do tema tanto no cliente quanto na RPC PostgreSQL (`upsert_link_with_theme`), garantindo que links comuns e de estudo compartilhem temas sem conflitos ou ocultação.
2. **Aprendizado Contínuo de Metadados**:
   - Extração de OpenGraph/Title/Description via `/api/analyze-url` combinada com histórico do usuário para sugerir `tags`, `tema`, `pasta`, `"O que é"` e `"Por que salvei"`.
3. **Pastas e Subpastas Recursivas**:
   - Criação de subpastas ilimitadas em árvore (`parentId`), navegação via Breadcrumb e visualização do caminho completo (`Raiz / Pasta / Subpasta`).
4. **Material Design 3 + Edição de Exibição e Filtros**:
   - Modos: `Só Nome`, `Só Thumb`, `Miniatura de Tudo` e `Detalhado`.
   - Toggles individuais de campos e filtros combináveis por Pasta, Tag, Tipo de Mídia e Somente Estudos.
5. **Aba "Links e Mídias"**:
   - Visão consolidada com caminho completo da pasta e movimentação direta para qualquer pasta/subpasta (ou criação de nova subpasta na hora).
6. **Fluxo Real de Consumo ("Visto" -> Histórico vs. Excluir) e Relatórios Completos**:
   - Clicar ou excluir não conta como visita. O botão **Visto** só aparece após abrir o link ou pode ser acionado manualmente, perguntando se deve ir para o Histórico (`Sim` -> move para Histórico e registra visita; `Não` -> exclui o link, mas contabiliza a visita concluída no relatório).
   - **Relatórios com Rankings e Taxas Percentuais**: Top temas mais salvos, top tags mais frequentes, taxa percentual de conclusão de tarefas (Geral e TNE), taxa/média de adiamento de tarefas, total no histórico, visitas reais e temas estudados.
   - A seção de Estudos no relatório é ocultada automaticamente quando não há registros de estudo.
   - Classificação automática em tempo real de **TNE (Tarefas que Não são Estudo)** vs **Tarefas de Estudo** (incluindo preparativos operacionais como "arrumar site para estudar").
7. **Espaço Privado com PIN + Biometria Digital (WebAuthn)**:
   - Cofre protegido por PIN e autenticação biométrica nativa do dispositivo, isolado das estatísticas gerais (com opção de inclusão manual nos relatórios).

## Como Executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.
