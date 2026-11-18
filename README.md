# Mega Brain — Centralizador Pessoal Inteligente (SPA)

O **Mega Brain** é uma Single Page Application (SPA) de organização pessoal, estudos, finanças, mídia, links salvos, compromissos e espaço privado com design Clean/Material (estilo Notion/Apple).

## 🚀 Como Executar Imediatamente (Zero Instalação)
1. Extraia o arquivo `.zip` em uma pasta.
2. Abra o arquivo **`index.html`** diretamente no seu navegador (Chrome, Edge, Safari, Firefox) ou via Live Server.
3. Todos os dados são salvos automaticamente no `localStorage` do navegador.

## 📂 Arquitetura em Pasta Única
Todos os arquivos estão na raiz para facilidade de uso:
- **`index.html`**: Aplicação SPA completa, autônoma e 100% funcional (React + Tailwind CSS + Lucide Icons + WebAuthn + Web Audio API + Drag & Drop).
- **`types.ts` & `storageEngine.ts`**: Tipagem TypeScript e motor de persistência, histórico e relatórios.
- **`tneClassifier.ts`**: Motor de aprendizado por tags/contexto ("O que é" e "Por que salvei") e detecção automática de **TNE (Tarefas que Não são Estudo)**.
- **`notificationHelper.ts` & `webauthnHelper.ts`**: Alertas multimodais (popup, vibração, som sintetizado) e autenticação biométrica/PIN para o Espaço Privado.
- **`page.tsx` & componentes `.tsx`**: Estrutura modular em Next.js/React para projetos com bundler.

## ✨ Funcionalidades Implementadas
1. **Aprendizado Semântico & Sugestão Automática**: Aprende com suas tags, "O que é" e "Por que salvei" para preencher automaticamente novos links e identificar padrões.
2. **Pastas e Subpastas Infinitas**: Crie pastas dentro de pastas livremente em qualquer módulo.
3. **Customização Material Design & Drag-and-Drop**: Arraste cards na Home para reordenar, filtre o que aparece na página inicial e alterne entre modos de visualização (**Cards/Thumbnails**, **Lista**, **Miniatura/Compacto**).
4. **Menu Superior "Links e Mídias"**: Visão unificada de todos os itens salvos com filtro por tags, pasta/subpasta e movimentação direta entre pastas.
5. **Fluxo de "Visto" & Relatórios Inteligentes**: Ao abrir/concluir um conteúdo, clique em **"Marcar como Visto"** para decidir se guarda no **Histórico** ou descarta (computando visitas reais, taxa de conclusão e adiamentos).
6. **Área de Histórico Dedicada**: Preserva links, tarefas, pastas e subpastas concluídas que você optou por manter.
7. **Estudos & Detecção TNE**: Oculta Estudos do relatório se estiver vazio e classifica itens operacionais (ex: arrumar site, configurar ferramentas) como **TNE (Tarefas que Não são Estudo)**.
8. **Espaço Privado (PIN + Biometria Digital)**: Protegido por PIN e WebAuthn (impressão digital no celular), isolado dos relatórios por padrão (com opção de incluir).
9. **Notificações Personalizadas por Tarefa**: Escolha entre *Vibrar + Tocar*, *Só Vibrar* ou *Apenas Popup* ao criar cada tarefa.
10. **Revisão Semanal de Quarta-Feira**: Notificação e modal interativo para revisar itens sem data definida (ver agora ou adiar para a próxima quarta), com opt-in opcional para o Espaço Privado.
