/**
 * App Controller - Conecta UI, MegaBrainEngine, VaultSecurity e BrainStorage.
 */
document.addEventListener('DOMContentLoaded', () => {
  const storage = new BrainStorage();
  const vault = new VaultSecurity();
  let state = storage.load();
  const brain = new MegaBrainEngine(state.brainModel);

  if (!state.brainModel) {
    brain.rebuildModel(state.notes);
    state.brainModel = brain.exportState();
    storage.save(state);
  }

  let currentView = 'all';
  let currentFolderId = null;
  let currentTagFilter = null;
  let searchQuery = '';

  const els = {
    brainStatus: document.getElementById('brain-status'),
    searchInput: document.getElementById('search-input'),
    navViews: document.getElementById('nav-views'),
    folderList: document.getElementById('folder-list'),
    tagCloud: document.getElementById('tag-cloud'),
    insightsBanner: document.getElementById('insights-banner'),
    notesGrid: document.getElementById('notes-grid'),
    noteModal: document.getElementById('note-modal'),
    noteForm: document.getElementById('note-form'),
    noteId: document.getElementById('note-id'),
    noteTitle: document.getElementById('note-title'),
    noteFolder: document.getElementById('note-folder'),
    noteContent: document.getElementById('note-content'),
    noteTags: document.getElementById('note-tags'),
    suggestedTags: document.getElementById('suggested-tags'),
    folderModal: document.getElementById('folder-modal'),
    folderForm: document.getElementById('folder-form'),
    folderName: document.getElementById('folder-name'),
    folderPrivate: document.getElementById('folder-private'),
    folderPin: document.getElementById('folder-pin'),
    pinWrapper: document.getElementById('pin-wrapper'),
    unlockModal: document.getElementById('unlock-modal'),
    unlockForm: document.getElementById('unlock-form'),
    unlockFolderId: document.getElementById('unlock-folder-id'),
    unlockFolderLabel: document.getElementById('unlock-folder-label'),
    unlockPinInput: document.getElementById('unlock-pin-input'),
    unlockError: document.getElementById('unlock-error')
  };

  function persist() {
    brain.rebuildModel(state.notes);
    state.brainModel = brain.exportState();
    storage.save(state);
  }

  function getFolder(folderId) {
    return state.folders.find(f => f.id === folderId) || state.folders[0];
  }

  function renderSidebar() {
    // Pastas
    els.folderList.innerHTML = '';
    for (const folder of state.folders) {
      const li = document.createElement('li');
      const isLocked = folder.isPrivate && !vault.isUnlocked(folder.id);
      li.className = currentFolderId === folder.id ? 'active' : '';
      li.innerHTML = `<span>${folder.isPrivate ? (isLocked ? '🔒' : '🔓') : '📁'} ${folder.name}</span>`;
      li.addEventListener('click', () => handleSelectFolder(folder));
      els.folderList.appendChild(li);
    }

    // Tags aprendidas
    const stats = brain.getStats();
    els.brainStatus.textContent = `Aprendizado ativo • ${stats.totalTags} tags e ${stats.totalPatterns} associações`;
    els.tagCloud.innerHTML = '';
    for (const [tag, count] of stats.topTags) {
      const span = document.createElement('span');
      span.className = 'tag-pill';
      span.textContent = `#${tag} (${count})`;
      span.addEventListener('click', () => {
        currentTagFilter = currentTagFilter === tag ? null : tag;
        renderNotes();
      });
      els.tagCloud.appendChild(span);
    }
  }

  function handleSelectFolder(folder) {
    if (folder.isPrivate && !vault.isUnlocked(folder.id)) {
      els.unlockFolderId.value = folder.id;
      els.unlockFolderLabel.textContent = `Digite o PIN para abrir "${folder.name}"`;
      els.unlockPinInput.value = '';
      els.unlockError.classList.add('hidden');
      els.unlockModal.showModal();
      return;
    }
    currentView = 'folder';
    currentFolderId = folder.id;
    currentTagFilter = null;
    updateActiveNav();
    renderAll();
  }

  function updateActiveNav() {
    els.navViews.querySelectorAll('li').forEach(li => {
      li.classList.toggle('active', li.dataset.view === currentView && !currentFolderId);
    });
  }

  function renderInsights() {
    if (currentView !== 'insights') {
      els.insightsBanner.classList.add('hidden');
      return;
    }
    const stats = brain.getStats();
    els.insightsBanner.classList.remove('hidden');
    els.insightsBanner.innerHTML = `
      <h3>🧠 Diagnóstico do Mega Brain</h3>
      <p style="margin-top:8px;color:#cbd5e1;font-size:14px;">
        O motor mapeou <strong>${stats.totalTags}</strong> tags distintas e <strong>${stats.totalPatterns}</strong> conexões semânticas a partir das suas notas.
        Quanto mais você escreve e organiza, maior a precisão das sugestões automáticas.
      </p>
    `;
  }

  function renderNotes() {
    els.notesGrid.innerHTML = '';
    const filtered = state.notes.filter(note => {
      const folder = getFolder(note.folderId);
      const isLocked = folder?.isPrivate && !vault.isUnlocked(folder.id);

      // Oculta conteúdo de pastas privadas bloqueadas nas visões gerais
      if (isLocked && currentView !== 'private') return false;

      if (currentView === 'public' && folder?.isPrivate) return false;
      if (currentView === 'private' && !folder?.isPrivate) return false;
      if (currentView === 'folder' && note.folderId !== currentFolderId) return false;
      if (currentTagFilter && !(note.tags || []).includes(currentTagFilter)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = note.title.toLowerCase().includes(q);
        const inBody = !isLocked && note.content.toLowerCase().includes(q);
        const inTags = (note.tags || []).some(t => t.includes(q.replace('#', '')));
        return inTitle || inBody || inTags;
      }
      return true;
    });

    if (!filtered.length) {
      els.notesGrid.innerHTML = `<p style="color:var(--muted);">Nenhuma nota encontrada nesta visualização.</p>`;
      return;
    }

    for (const note of filtered) {
      const folder = getFolder(note.folderId);
      const isLocked = folder?.isPrivate && !vault.isUnlocked(folder.id);
      const card = document.createElement('article');
      card.className = `note-card ${folder?.isPrivate ? 'private-card' : ''}`;

      const tagsHtml = (note.tags || [])
        .map(t => `<span class="tag-pill">#${t}</span>`)
        .join('');

      card.innerHTML = `
        <div class="note-card-header">
          <h4>${note.title}</h4>
          ${folder?.isPrivate ? `<span class="badge-private">${isLocked ? '🔒 Bloqueada' : '🔓 Privada'}</span>` : ''}
        </div>
        <div class="note-body">${isLocked ? 'Conteúdo protegido. Desbloqueie a pasta para visualizar.' : note.content}</div>
        <div class="tag-cloud">${tagsHtml}</div>
        <div class="note-footer">
          <span>${folder?.name || 'Geral'}</span>
          ${isLocked ? `<button class="btn secondary btn-unlock-card">Desbloquear</button>` : `<button class="btn secondary btn-edit-card">Editar</button>`}
        </div>
      `;

      const editBtn = card.querySelector('.btn-edit-card');
      if (editBtn) editBtn.addEventListener('click', () => openNoteModal(note));

      const unlockBtn = card.querySelector('.btn-unlock-card');
      if (unlockBtn) unlockBtn.addEventListener('click', () => handleSelectFolder(folder));

      els.notesGrid.appendChild(card);
    }
  }

  function renderAll() {
    renderSidebar();
    renderInsights();
    renderNotes();
  }

  function refreshTagSuggestions() {
    const existing = els.noteTags.value.split(',').map(t => t.trim()).filter(Boolean);
    const suggestions = brain.suggestTags(els.noteTitle.value, els.noteContent.value, existing);
    els.suggestedTags.innerHTML = '';
    if (!suggestions.length) {
      els.suggestedTags.innerHTML = '<span style="color:var(--muted);">Continue escrevendo para ver sugestões...</span>';
      return;
    }
    for (const item of suggestions) {
      const chip = document.createElement('span');
      chip.className = 'tag-pill';
      chip.textContent = `+ #${item.tag} (${item.confidence}%)`;
      chip.addEventListener('click', () => {
        const current = els.noteTags.value.split(',').map(t => t.trim()).filter(Boolean);
        if (!current.includes(item.tag)) {
          current.push(item.tag);
          els.noteTags.value = current.join(', ');
          refreshTagSuggestions();
        }
      });
      els.suggestedTags.appendChild(chip);
    }
  }

  function openNoteModal(note = null) {
    els.noteFolder.innerHTML = state.folders
      .filter(f => !f.isPrivate || vault.isUnlocked(f.id))
      .map(f => `<option value="${f.id}">${f.isPrivate ? '🔒 ' : ''}${f.name}</option>`)
      .join('');

    if (note) {
      document.getElementById('note-modal-title').textContent = 'Editar Nota';
      els.noteId.value = note.id;
      els.noteTitle.value = note.title;
      els.noteFolder.value = note.folderId;
      els.noteContent.value = note.content;
      els.noteTags.value = (note.tags || []).join(', ');
    } else {
      document.getElementById('note-modal-title').textContent = 'Nova Nota';
      els.noteId.value = '';
      els.noteTitle.value = '';
      els.noteFolder.value = currentFolderId && !getFolder(currentFolderId)?.isPrivate ? currentFolderId : 'general';
      els.noteContent.value = '';
      els.noteTags.value = '';
    }
    refreshTagSuggestions();
    els.noteModal.showModal();
  }

  // Eventos
  els.navViews.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    currentView = li.dataset.view;
    currentFolderId = null;
    currentTagFilter = null;
    updateActiveNav();
    renderAll();
  });

  els.searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderNotes();
  });

  document.getElementById('btn-new-note').addEventListener('click', () => openNoteModal());
  document.getElementById('btn-cancel-note').addEventListener('click', () => els.noteModal.close());
  els.noteTitle.addEventListener('input', refreshTagSuggestions);
  els.noteContent.addEventListener('input', refreshTagSuggestions);

  els.noteForm.addEventListener('submit', e => {
    e.preventDefault();
    const id = els.noteId.value || `note_${Date.now()}`;
    const tags = [...new Set(
      els.noteTags.value.split(',').map(t => brain.normalizeTag(t)).filter(Boolean)
    )];
    const payload = {
      id,
      title: els.noteTitle.value.trim(),
      folderId: els.noteFolder.value,
      content: els.noteContent.value.trim(),
      tags,
      updatedAt: new Date().toISOString()
    };

    const idx = state.notes.findIndex(n => n.id === id);
    if (idx >= 0) state.notes[idx] = payload;
    else state.notes.unshift(payload);

    persist();
    els.noteModal.close();
    renderAll();
  });

  document.getElementById('btn-new-folder').addEventListener('click', () => {
    els.folderName.value = '';
    els.folderPrivate.checked = true;
    els.folderPin.value = '';
    els.pinWrapper.classList.remove('hidden');
    els.folderModal.showModal();
  });
  document.getElementById('btn-cancel-folder').addEventListener('click', () => els.folderModal.close());
  els.folderPrivate.addEventListener('change', () => {
    els.pinWrapper.classList.toggle('hidden', !els.folderPrivate.checked);
  });

  els.folderForm.addEventListener('submit', async e => {
    e.preventDefault();
    const isPrivate = els.folderPrivate.checked;
    const pin = els.folderPin.value.trim();
    if (isPrivate && pin.length < 4) return;

    const id = `folder_${Date.now()}`;
    const pinHash = isPrivate ? await vault.hashPin(pin) : null;
    state.folders.push({
      id,
      name: els.folderName.value.trim(),
      isPrivate,
      pinHash
    });
    if (isPrivate) vault.unlock(id);
    persist();
    els.folderModal.close();
    renderAll();
  });

  document.getElementById('btn-cancel-unlock').addEventListener('click', () => els.unlockModal.close());
  els.unlockForm.addEventListener('submit', async e => {
    e.preventDefault();
    const folder = getFolder(els.unlockFolderId.value);
    const valid = await vault.verifyPin(els.unlockPinInput.value, folder.pinHash);
    if (!valid) {
      els.unlockError.classList.remove('hidden');
      return;
    }
    vault.unlock(folder.id);
    els.unlockModal.close();
    currentView = 'folder';
    currentFolderId = folder.id;
    renderAll();
  });

  renderAll();
});
