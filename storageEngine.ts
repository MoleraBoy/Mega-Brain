import {
  BrainDatabase,
  BrainItem,
  BrainTask,
  ConsumptionLog,
  Folder,
  MediaType,
  TaskNotificationMode
} from './types';

const STORAGE_KEY = 'mega_brain_v3_db';

export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const INITIAL_DB: BrainDatabase = {
  themes: [
    {
      id: 'theme-arquitetura',
      name: 'Arquitetura & Engenharia',
      normalizedName: 'arquitetura & engenharia',
      isPrivate: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'theme-design',
      name: 'Material Design & UI',
      normalizedName: 'material design & ui',
      isPrivate: false,
      createdAt: new Date().toISOString()
    }
  ],
  folders: [
    {
      id: 'folder-estudos',
      parentId: null,
      name: 'Estudos',
      color: '#6750A4',
      isPrivate: false,
      isStudyFolder: true,
      status: 'active',
      sortOrder: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'folder-nextjs',
      parentId: 'folder-estudos',
      name: 'Next.js & React',
      color: '#7D5260',
      isPrivate: false,
      isStudyFolder: true,
      status: 'active',
      sortOrder: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: 'folder-referencias',
      parentId: null,
      name: 'Referências & Ferramentas',
      color: '#625B71',
      isPrivate: false,
      isStudyFolder: false,
      status: 'active',
      sortOrder: 3,
      createdAt: new Date().toISOString()
    }
  ],
  items: [
    {
      id: 'item-1',
      folderId: 'folder-nextjs',
      themeId: 'theme-arquitetura',
      themeName: 'Arquitetura & Engenharia',
      url: 'https://nextjs.org/docs/app',
      title: 'Documentação Oficial Next.js App Router',
      thumbnailUrl: 'https://nextjs.org/og.png',
      mediaType: 'document',
      whatIs: 'Guia oficial sobre Server Components, App Router e API Routes.',
      whySaved: 'Material base para estudar arquitetura full-stack moderna.',
      tags: ['nextjs', 'react', 'estudo'],
      isStudy: true,
      isTne: false,
      isPrivate: false,
      status: 'active',
      seenCount: 0,
      sortOrder: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'item-2',
      folderId: 'folder-referencias',
      themeId: 'theme-design',
      themeName: 'Material Design & UI',
      url: 'https://m3.material.io/',
      title: 'Material Design 3 — Tokens e Componentes',
      thumbnailUrl: 'https://www.google.com/s2/favicons?domain=m3.material.io&sz=128',
      mediaType: 'article',
      whatIs: 'Especificação oficial de superfícies, elevação e tipografia MD3.',
      whySaved: 'Referência visual para manter consistência nas telas do app.',
      tags: ['md3', 'design', 'ui'],
      isStudy: false,
      isTne: true,
      isPrivate: false,
      status: 'active',
      seenCount: 0,
      sortOrder: 2,
      createdAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: 'task-1',
      folderId: 'folder-nextjs',
      title: 'Estudar Server Actions e Cache no Next.js',
      tags: ['nextjs', 'estudo'],
      isTne: false,
      completed: false,
      postponedCount: 0,
      notificationMode: 'sound_vibrate',
      isPrivate: false,
      status: 'active',
      sortOrder: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      folderId: 'folder-estudos',
      title: 'Arrumar o site de anotações antes de começar a matéria',
      tags: ['site', 'setup'],
      isTne: true,
      completed: false,
      postponedCount: 0,
      notificationMode: 'popup_only',
      isPrivate: false,
      status: 'active',
      sortOrder: 2,
      createdAt: new Date().toISOString()
    }
  ],
  consumptionLogs: [],
  privateConfig: {
    enabled: false,
    pinHash: '',
    includePrivateInWednesdayReminder: false
  }
};

export function loadDatabase(): BrainDatabase {
  if (typeof window === 'undefined') return INITIAL_DB;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
      return INITIAL_DB;
    }
    const parsed = JSON.parse(raw) as BrainDatabase;
    return {
      ...INITIAL_DB,
      ...parsed,
      privateConfig: {
        ...INITIAL_DB.privateConfig,
        ...(parsed.privateConfig || {})
      }
    };
  } catch {
    return INITIAL_DB;
  }
}

export function saveDatabase(db: BrainDatabase): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getFolderFullPath(folders: Folder[], folderId: string | null): string {
  if (!folderId) return 'Raiz (Sem Pasta)';
  const parts: string[] = [];
  let currentId: string | null = folderId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const folder = folders.find((f) => f.id === currentId);
    if (!folder) break;
    parts.unshift(folder.name);
    currentId = folder.parentId;
  }
  return parts.length > 0 ? parts.join(' / ') : 'Raiz';
}

export function getDescendantFolderIds(folders: Folder[], rootFolderId: string): string[] {
  const result: string[] = [rootFolderId];
  const queue: string[] = [rootFolderId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const children = folders.filter((f) => f.parentId === curr && f.status === 'active');
    for (const child of children) {
      result.push(child.id);
      queue.push(child.id);
    }
  }
  return result;
}

export function isFolderInsideStudyTree(folders: Folder[], folderId: string | null): boolean {
  let curr = folderId;
  const visited = new Set<string>();
  while (curr && !visited.has(curr)) {
    visited.add(curr);
    const f = folders.find((item) => item.id === curr);
    if (!f) break;
    if (f.isStudyFolder) return true;
    curr = f.parentId;
  }
  return false;
}

export function createFolder(
  db: BrainDatabase,
  name: string,
  parentId: string | null,
  isPrivate: boolean,
  isStudyFolder: boolean = false,
  color: string = '#6750A4'
): BrainDatabase {
  const inheritedStudy =
    isStudyFolder || (parentId ? isFolderInsideStudyTree(db.folders, parentId) : false);
  const maxOrder = db.folders.reduce((m, f) => Math.max(m, f.sortOrder || 0), 0);
  const newFolder: Folder = {
    id: `folder-${uid()}`,
    parentId,
    name: name.trim(),
    color,
    isPrivate,
    isStudyFolder: inheritedStudy,
    status: 'active',
    sortOrder: maxOrder + 1,
    createdAt: new Date().toISOString()
  };
  const next = { ...db, folders: [...db.folders, newFolder] };
  saveDatabase(next);
  return next;
}

export function completeFolderWithHistory(
  db: BrainDatabase,
  folderId: string,
  keepInHistory: boolean
): BrainDatabase {
  const targetIds = new Set(getDescendantFolderIds(db.folders, folderId));
  let updatedFolders: Folder[];

  if (keepInHistory) {
    const now = new Date().toISOString();
    updatedFolders = db.folders.map((f) =>
      targetIds.has(f.id) ? { ...f, status: 'history', archivedAt: now } : f
    );
  } else {
    updatedFolders = db.folders.filter((f) => !targetIds.has(f.id));
  }

  const next = { ...db, folders: updatedFolders };
  saveDatabase(next);
  return next;
}

export function addOrUpdateItem(
  db: BrainDatabase,
  payload: {
    id?: string;
    folderId: string | null;
    themeName: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    mediaType: MediaType;
    whatIs: string;
    whySaved: string;
    tags: string[];
    isStudy: boolean;
    isTne: boolean;
    isPrivate: boolean;
    dueDate?: string;
  }
): BrainDatabase {
  const cleanTheme = payload.themeName.trim() || 'Geral';
  const normalized = cleanTheme.toLowerCase();

  let theme = db.themes.find(
    (t) => t.normalizedName === normalized && t.isPrivate === payload.isPrivate
  );
  const themes = [...db.themes];

  if (!theme) {
    theme = {
      id: `theme-${uid()}`,
      name: cleanTheme,
      normalizedName: normalized,
      isPrivate: payload.isPrivate,
      createdAt: new Date().toISOString()
    };
    themes.push(theme);
  }

  const items = [...db.items];
  if (payload.id) {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        folderId: payload.folderId,
        themeId: theme.id,
        themeName: theme.name,
        url: payload.url.trim(),
        title: payload.title.trim() || payload.url.trim(),
        thumbnailUrl: payload.thumbnailUrl.trim(),
        mediaType: payload.mediaType,
        whatIs: payload.whatIs.trim(),
        whySaved: payload.whySaved.trim(),
        tags: payload.tags,
        isStudy: payload.isStudy,
        isTne: payload.isTne,
        dueDate: payload.dueDate || undefined
      };
    }
  } else {
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sortOrder || 0), 0);
    items.unshift({
      id: `item-${uid()}`,
      folderId: payload.folderId,
      themeId: theme.id,
      themeName: theme.name,
      url: payload.url.trim(),
      title: payload.title.trim() || payload.url.trim(),
      thumbnailUrl: payload.thumbnailUrl.trim(),
      mediaType: payload.mediaType,
      whatIs: payload.whatIs.trim(),
      whySaved: payload.whySaved.trim(),
      tags: payload.tags,
      isStudy: payload.isStudy,
      isTne: payload.isTne,
      isPrivate: payload.isPrivate,
      status: 'active',
      seenCount: 0,
      sortOrder: maxOrder + 1,
      dueDate: payload.dueDate || undefined,
      createdAt: new Date().toISOString()
    });
  }

  const next = { ...db, themes, items };
  saveDatabase(next);
  return next;
}

export function moveItemToFolder(
  db: BrainDatabase,
  itemId: string,
  targetFolderId: string | null
): BrainDatabase {
  const items = db.items.map((item) =>
    item.id === itemId ? { ...item, folderId: targetFolderId } : item
  );
  const next = { ...db, items };
  saveDatabase(next);
  return next;
}

export function markItemAsSeen(
  db: BrainDatabase,
  itemId: string,
  keepInHistory: boolean
): BrainDatabase {
  const target = db.items.find((i) => i.id === itemId);
  if (!target) return db;

  const now = new Date().toISOString();
  const newLog: ConsumptionLog = {
    id: `log-${uid()}`,
    itemId: target.id,
    title: target.title,
    themeName: target.themeName,
    tags: target.tags,
    isStudy: target.isStudy,
    isTne: target.isTne,
    isPrivate: target.isPrivate,
    keptInHistory: keepInHistory,
    consumedAt: now
  };

  const items: BrainItem[] = keepInHistory
    ? db.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              status: 'history',
              seenCount: i.seenCount + 1,
              lastSeenAt: now
            }
          : i
      )
    : db.items.filter((i) => i.id !== itemId);

  const next = {
    ...db,
    items,
    consumptionLogs: [newLog, ...db.consumptionLogs]
  };
  saveDatabase(next);
  return next;
}

export function deleteItemWithoutCount(db: BrainDatabase, itemId: string): BrainDatabase {
  const next = {
    ...db,
    items: db.items.filter((i) => i.id !== itemId)
  };
  saveDatabase(next);
  return next;
}

export function addTask(
  db: BrainDatabase,
  payload: {
    title: string;
    folderId: string | null;
    tags: string[];
    isTne: boolean;
    dueDate?: string;
    notificationMode: TaskNotificationMode;
    isPrivate: boolean;
  }
): BrainDatabase {
  const maxOrder = db.tasks.reduce((m, t) => Math.max(m, t.sortOrder || 0), 0);
  const newTask: BrainTask = {
    id: `task-${uid()}`,
    folderId: payload.folderId,
    title: payload.title.trim(),
    tags: payload.tags,
    isTne: payload.isTne,
    completed: false,
    postponedCount: 0,
    dueDate: payload.dueDate || undefined,
    notificationMode: payload.notificationMode,
    isPrivate: payload.isPrivate,
    status: 'active',
    sortOrder: maxOrder + 1,
    createdAt: new Date().toISOString()
  };
  const next = { ...db, tasks: [newTask, ...db.tasks] };
  saveDatabase(next);
  return next;
}

export function completeTaskWithHistory(
  db: BrainDatabase,
  taskId: string,
  keepInHistory: boolean
): BrainDatabase {
  const now = new Date().toISOString();
  const tasks: BrainTask[] = keepInHistory
    ? db.tasks.map((t) =>
        t.id === taskId
          ? { ...t, completed: true, status: 'history', completedAt: now }
          : t
      )
    : db.tasks.filter((t) => t.id !== taskId);

  const next = { ...db, tasks };
  saveDatabase(next);
  return next;
}

export function postponeTask(db: BrainDatabase, taskId: string): BrainDatabase {
  const tasks = db.tasks.map((t) =>
    t.id === taskId ? { ...t, postponedCount: t.postponedCount + 1 } : t
  );
  const next = { ...db, tasks };
  saveDatabase(next);
  return next;
}

export function deleteTask(db: BrainDatabase, taskId: string): BrainDatabase {
  const next = { ...db, tasks: db.tasks.filter((t) => t.id !== taskId) };
  saveDatabase(next);
  return next;
}

export function reorderEntities(
  db: BrainDatabase,
  kind: 'folder' | 'item' | 'task',
  draggedId: string,
  targetId: string
): BrainDatabase {
  if (draggedId === targetId) return db;

  if (kind === 'folder') {
    const list = [...db.folders];
    const a = list.findIndex((x) => x.id === draggedId);
    const b = list.findIndex((x) => x.id === targetId);
    if (a !== -1 && b !== -1) {
      const temp = list[a].sortOrder;
      list[a] = { ...list[a], sortOrder: list[b].sortOrder };
      list[b] = { ...list[b], sortOrder: temp };
      const next = { ...db, folders: list };
      saveDatabase(next);
      return next;
    }
  } else if (kind === 'item') {
    const list = [...db.items];
    const a = list.findIndex((x) => x.id === draggedId);
    const b = list.findIndex((x) => x.id === targetId);
    if (a !== -1 && b !== -1) {
      const temp = list[a].sortOrder;
      list[a] = { ...list[a], sortOrder: list[b].sortOrder };
      list[b] = { ...list[b], sortOrder: temp };
      const next = { ...db, items: list };
      saveDatabase(next);
      return next;
    }
  } else {
    const list = [...db.tasks];
    const a = list.findIndex((x) => x.id === draggedId);
    const b = list.findIndex((x) => x.id === targetId);
    if (a !== -1 && b !== -1) {
      const temp = list[a].sortOrder;
      list[a] = { ...list[a], sortOrder: list[b].sortOrder };
      list[b] = { ...list[b], sortOrder: temp };
      const next = { ...db, tasks: list };
      saveDatabase(next);
      return next;
    }
  }
  return db;
}

export function isWednesdayToday(date = new Date()): boolean {
  return date.getDay() === 3;
}

export function getNextWednesdayISO(fromDate = new Date()): string {
  const d = new Date(fromDate);
  const diff = (3 + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function getWednesdayUndatedDigest(db: BrainDatabase, includePrivate: boolean) {
  const nowIso = new Date().toISOString();

  const items = db.items.filter(
    (item) =>
      item.status === 'active' &&
      !item.dueDate &&
      (!item.wednesdaySnoozedUntil || item.wednesdaySnoozedUntil <= nowIso) &&
      (includePrivate || !item.isPrivate)
  );

  const tasks = db.tasks.filter(
    (task) =>
      task.status === 'active' &&
      !task.completed &&
      !task.dueDate &&
      (!task.wednesdaySnoozedUntil || task.wednesdaySnoozedUntil <= nowIso) &&
      (includePrivate || !task.isPrivate)
  );

  return { items, tasks };
}

export function snoozeToNextWednesday(
  db: BrainDatabase,
  kind: 'item' | 'task',
  id: string
): BrainDatabase {
  const nextWed = getNextWednesdayISO();
  if (kind === 'item') {
    const items = db.items.map((i) =>
      i.id === id ? { ...i, wednesdaySnoozedUntil: nextWed } : i
    );
    const next = { ...db, items };
    saveDatabase(next);
    return next;
  } else {
    const tasks = db.tasks.map((t) =>
      t.id === id
        ? { ...t, wednesdaySnoozedUntil: nextWed, postponedCount: t.postponedCount + 1 }
        : t
    );
    const next = { ...db, tasks };
    saveDatabase(next);
    return next;
  }
}
