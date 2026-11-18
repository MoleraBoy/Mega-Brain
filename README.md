# Mega Brain v2.3 — Hub Pessoal & Segundo Cérebro

Arquitetura completa em Next.js + TypeScript + Tailwind CSS (Material Design 3) + Supabase (com persistência local imediata para testes sem configuração extra).

## Onde encontrar cada implementação (Itens 1 a 10)

1. **Aprendizado Contínuo (Tags, "O que é" e "Por que salvei")** -> `src/lib/classifier.ts` (`learnFromHistory`) + `src/app/api/analyze-url/route.ts` + auto-análise ao colar URL em `src/app/page.tsx`.
2. **Criar pastas dentro de pastas (Subpastas recursivas)** -> `src/app/page.tsx` (Breadcrumb + formulário "Nova subpasta aqui..." + árvore ilimitada via `parentId`).
3. **Exibição de links, pastas e subpastas** -> `src/app/page.tsx` (exibição hierárquica em Pastas & Hub e na aba Links e Mídias).
4. **Material Design 3 + Editar Exibição e Filtros** -> `src/app/page.tsx` (Presets: `Só Nome`, `Só Thumb`, `Miniatura de Tudo`, `Detalhado`, toggles individuais por campo e filtros combináveis).
5. **Menu Superior "Links e Mídias" com Pasta Atual e Movimentação** -> `src/app/page.tsx` (aba `Links e Mídias` exibe badge destacada com o caminho completo da pasta `Raiz / Pasta / Subpasta`, seletor para mover para qualquer pasta/subpasta e botão `+` para criar subpasta e mover).
6. **Relatórios Completos** -> `src/components/ReportsPanel.tsx` (ranking do que mais é salvo por tema e tag, taxa de conclusão de tarefas, taxa de adiamento, visitas reais, histórico e estudos).
7. **Fluxo "Visto" -> Histórico vs. Excluir + Ocultação de Estudos Vazios** -> `src/components/ViewConfirmModal.tsx` e `src/components/ReportsPanel.tsx` (botão **Visto** aparece após abrir o link; clicar pergunta se quer manter no Histórico; seção de estudos some automaticamente se nada de estudo foi adicionado).
8. **Classificação TNE (Tarefas que Não são Estudo)** -> `src/lib/classifier.ts` (`classifyTaskRealtime`, detectando preparativos operacionais como "arrumar site para estudar depois" como `TNE`).
9. **Espaço Privado com PIN e Biometria Digital (Celular/WebAuthn)** -> `src/components/PrivateVaultModal.tsx` e `src/lib/webauthn.ts` (isolado das estatísticas do relatório, com checkbox opcional para incluir quando desbloqueado).
10. **Notificações de Som e Vibração (Global e Individual por Lembrete/Tarefa)** -> `src/lib/notifications.ts` + controles globais no topo e toggles individuais de Som e Vibração em cada novo lembrete/tarefa e nos cards em `src/app/page.tsx`.

## Como executar

```bash
npm install
npm run dev
```
