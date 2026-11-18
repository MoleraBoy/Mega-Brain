# Mega Brain v3 — Segundo Cérebro & Hub Pessoal (Pasta Única + HTML Completo)

Todos os arquivos estão em **pasta única** (sem subpastas) e agora incluem tanto o **`index.html` completo e autocontido** (para abrir diretamente no navegador com um clique ou hospedar em qualquer servidor estático) quanto a **arquitetura completa em Next.js + TypeScript + Tailwind MD3**.

## Opção 1: Abrir Diretamente no Navegador (Sem Instalação)

Basta dar duplo clique no arquivo **`index.html`** para usar o **Mega Brain v3** imediatamente no computador ou celular com todas as funcionalidades ativas.

## Opção 2: Executar o Projeto Next.js Completo Localmente

```bash
node setup-structure.js
npm install
npm run dev
```

## Funcionalidades Implementadas

1. **Aprendizado Contínuo com Tags, "O que é" e "Por que salvei"**: Auto-preenchimento inteligente ao colar links cruzando metadados com o histórico do usuário.
2. **Pastas e Subpastas Recursivas**: Criação ilimitada de subpastas dentro de qualquer pasta com navegação completa.
3. **Material Design 3 + Edição de Exibição & Drag & Drop**: Modos *Só Nome*, *Só Thumb*, *Miniatura de Tudo* e *Detalhado*, filtros combináveis na página inicial e reordenação por arrastar e soltar.
4. **Menu Superior -> Links e Mídias**: Listagem completa com tags, caminho completo da pasta/subpasta e movimentação rápida entre pastas.
5. **Consumo Real ("Visto") & Relatórios Analíticos**: Contabiliza visitas somente após clicar em *Visto* (com opção de guardar no Histórico ou excluir mantendo a contagem no relatório), ranking do que mais é salvo, taxa de conclusão e taxa de adiamento.
6. **Área de Histórico Completa**: Armazena links vistos, tarefas concluídas e pastas/subpastas concluídas que o usuário escolheu manter.
7. **Estudos vs. TNE (Tarefas que Não são Estudo)**: Oculta o bloco de Estudos do relatório quando não há registros de estudo e classifica atividades operacionais/preparação (ex.: arrumar um site) em pastas de estudo como **TNE**.
8. **Espaço Privado (PIN + Digital no Celular via WebAuthn)**: Isolado das estatísticas gerais por padrão (com opção manual para incluir no relatório).
9. **Notificação Configurável por Tarefa**: Escolha entre *Vibrar e Tocar*, *Só Vibrar* ou *Só Aparecer o Popup* ao criar cada tarefa.
10. **Revisão Automática de Quarta-feira**: Dispara toda quarta-feira reunindo links e tarefas sem data definida (mostrando tema, tags e pasta/subpasta), permitindo abrir agora ou adiar para a próxima quarta, com suporte opcional ao Espaço Privado.
