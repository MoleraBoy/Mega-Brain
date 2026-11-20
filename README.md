# Mega Brain v12 — Gerador Automático de Tarefa Teste & Alarmes em Segundo Plano

## Arquivos incluídos
- `index.html`: Aplicação completa com botão **Teste** dentro de *Novo Item* (abaixo de *Tags* e ao lado de *Cancelar* e *Salvar*), gerando automaticamente `Teste`, `Teste-02`, `Teste-03`... com alarme agendado para 1 minuto e todos os modos ativos (Popup + Som + Vibração).
- `sw.js`: Service Worker unificado com loop de verificação em segundo plano, suporte a Periodic Sync, vibração nativa e notificação com a tela bloqueada ou em outro app.
- `Mega Brain.mp3`: Áudio oficial da marca ao clicar no logo.
