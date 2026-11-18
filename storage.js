/**
 * BrainStorage - Persistência local unificada (notas, pastas privadas e pesos do Mega Brain).
 */
class BrainStorage {
  constructor(storageKey = 'mega_brain_hub_v2') {
    this.storageKey = storageKey;
  }

  load() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return {
        folders: [
          { id: 'general', name: 'Geral', isPrivate: false, pinHash: null },
          { id: 'projects', name: 'Projetos & Estudos', isPrivate: false, pinHash: null }
        ],
        notes: [
          {
            id: 'welcome-note',
            folderId: 'general',
            title: 'Bem-vindo ao Mega Brain',
            content: 'Crie notas com suas tags favoritas. O motor aprende seu vocabulário e passa a sugerir tags automaticamente. Você também pode criar Pastas Privadas protegidas por PIN.',
            tags: ['megabrain', 'guia', 'produtividade'],
            updatedAt: new Date().toISOString()
          }
        ],
        brainModel: null
      };
    }
    return JSON.parse(raw);
  }

  save(state) {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }
}

window.BrainStorage = BrainStorage;
