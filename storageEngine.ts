import {
  BrainDatabase,
  BrainItem,
  BrainTask,
  ConsumptionLog,
  Folder,
  MediaType,
  Theme
} from './types';

const STORAGE_KEY = 'mega_brain_v2_3_db';

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const INITIAL_DB: BrainDatabase = {
  themes: [
    {
      id: 'theme-arquitetura',
      name: 'Arquitetura de Software',
      normalizedName: 'arquitetura de software',
      isPrivate: false,
      createdAt: new Date().toISOString()
    }
  ],
  folders: [
    {
      id: 'folder-estudos',
      parentId: null,
      name: 'Estudos & Engenharia',
      color: '#6750A4',
      isPrivate: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'folder-nextjs',
      parentId: 'folder-estudos',
      name: 'Next.js & React',
      color: '#7D5260',
      isPrivate: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'folder-referencias',
      parentId: null,
      name: 'Referências Rápidas',
      color: '#625B71',
      isPrivate: false,
      createdAt: new Date().toISOString()
    }
  ],
  items: [
    {
      id: 'item-1',
      folderId: 'folder-nextjs',
      themeId: 'theme-arquitetura',
      themeName: 'Arquitetura de Software',
      url: 'https://nextjs.org/docs/app',
      title: 'Documentação Oficial Next.js App Router',
      thumbnailUrl: 'https://nextjs.org/og.png',
      mediaType: 'document',
      whatIs: 'Guia oficial sobre Server Components, roteamento aninhado e API Routes.',
      whySaved: 'Referência base para estruturar aplicações full-stack modernas.',
      tags: ['nextjs', 'react', 'arquitetura'],
      isStudy: true,
      isPrivate: false,
      status: 'active',
      seenCount: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'item-2',
      folderId: 'folder-nextjs',
      themeId: 'theme-arquitetura',
      themeName: 'Arquitetura de Software',
      url: 'https://m3.material.io/',
      title: 'Material Design 3 — Guidelines & Tokens',
      thumbnailUrl: 'https://lh3.googleusercontent.com/m3-og-preview',
      mediaType: 'article',
      whatIs: 'Sistema de design oficial do Google com tokens de elevação e superfícies.',
      whySaved: 'Padronizar interfaces limpas com contraste acessível e hierarquia visual.',
      tags: ['design', 'md3', 'ui'],
      isStudy: true,
      isPrivate: false,
      status: 'active',
      seenCount: 0,
      createdAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Revisar padrões de Server Actions no Next.js',
      isTne: false,
      completed: false,
      postponedCount: 0,
      isPrivate: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      title: 'Preparar site e configurar repositório no GitHub',
      isTne: true,
      completed: false,
      postponedCount: 0,
      isPrivate: false,
      createdAt: new Date().toISOString()
    }
  ],
  consumptionLogs: [],
  privateConfig: {
    enabled: false,
    pinHash: ''
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
    return JSON.parse(raw) as BrainDatabase;
  } catch {
    return INITIAL_DB;
  }
}

export function saveDatabase(db: BrainDatabase): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// UPSERT idempotente por nome normalizado (case-insensitive)
export function upsertTheme(
  db: BrainDatabase,
  rawName: string,
  isPrivate: boolean
): { db: BrainDatabase; theme: Theme | null } {
  const cleaned = rawName.trim();
  if (!cleaned) return { db, theme: null };

  const normalized = cleaned.toLowerCase();
  const existing = db.themes.find(
    (t) => t.normalizedName === normalized && t.isPrivate === isPrivate
  );

  if (existing) {
    const updatedThemes = db.themes.map((t) =>
      t.id === existing.id ? { ...t, name: cleaned } : t
    );
    return {
      db: { ...db, themes: updatedThemes },
      theme: { ...existing, name: cleaned }
    };
  }

  const newTheme: Theme = {
    id: uid(),
    name: cleaned,
    normalizedName: normalized,
    isPrivate,
    createdAt: new Date().toISOString()
  };

  return {
    db: { ...db, themes: [...db.themes, newTheme] },
    theme: newTheme
  };
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
    isPrivate: boolean;
  }
): BrainDatabase {
  const { db: dbWithTheme, theme } = upsertTheme(
    db,
    payload.themeName,
    payload.isPrivate
  );

  if (payload.id) {
    const items = dbWithTheme.items.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            folderId: payload.folderId,
            themeId: theme ? theme.id : null,
            themeName: theme ? theme.name : '',
            url: payload.url.trim(),
            title: payload.title.trim() || payload.url.trim(),
            thumbnailUrl: payload.thumbnailUrl.trim(),
            mediaType: payload.mediaType,
            whatIs: payload.whatIs.trim(),
            whySaved: payload.whySaved.trim(),
            tags: payload.tags,
            isStudy: payload.isStudy,
            isPrivate: payload.isPrivate
          }
        : item
    );
    const nextDb = { ...dbWithTheme, items };
    saveDatabase(nextDb);
    return nextDb;
  }

  const newItem: BrainItem = {
    id: uid(),
    folderId: payload.folderId,
    themeId: theme ? theme.id : null,
    themeName: theme ? theme.name : '',
    url: payload.url.trim(),
    title: payload.title.trim() || payload.url.trim(),
    thumbnailUrl: payload.thumbnailUrl.trim(),
    mediaType: payload.mediaType,
    whatIs: payload.whatIs.trim(),
    whySaved: payload.whySaved.trim(),
    tags: payload.tags,
    isStudy: payload.isStudy,
    isPrivate: payload.isPrivate,
    status: 'active',
    seenCount: 0,
    createdAt: new Date().toISOString()
  };

  const nextDb = {
    ...dbWithTheme,
    items: [newItem, ...dbWithTheme.items]
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function createFolder(
  db: BrainDatabase,
  name: string,
  parentId: string | null,
  isPrivate: boolean,
  color = '#6750A4'
): { db: BrainDatabase; folder: Folder } {
  const folder: Folder = {
    id: uid(),
    parentId,
    name: name.trim(),
    color,
    isPrivate,
    createdAt: new Date().toISOString()
  };
  const nextDb = { ...db, folders: [...db.folders, folder] };
  saveDatabase(nextDb);
  return { db: nextDb, folder };
}

export function moveItemToFolder(
  db: BrainDatabase,
  itemId: string,
  targetFolderId: string | null
): BrainDatabase {
  const nextDb = {
    ...db,
    items: db.items.map((item) =>
      item.id === itemId ? { ...item, folderId: targetFolderId } : item
    )
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function getFolderFullPath(folders: Folder[], folderId: string | null): string {
  if (!folderId) return 'Sem Pasta (Raiz)';
  const pathParts: string[] = [];
  let currentId: string | null = folderId;
  const guard = new Set<string>();

  while (currentId && !guard.has(currentId)) {
    guard.add(currentId);
    const found = folders.find((f) => f.id === currentId);
    if (!found) break;
    pathParts.unshift(found.name);
    currentId = found.parentId;
  }

  return pathParts.length > 0 ? pathParts.join(' / ') : 'Sem Pasta (Raiz)';
}

export function getDescendantFolderIds(folders: Folder[], rootFolderId: string): string[] {
  const ids: string[] = [rootFolderId];
  const queue: string[] = [rootFolderId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = folders.filter((f) => f.parentId === current);
    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

export function markItemAsSeen(
  db: BrainDatabase,
  itemId: string,
  keepInHistory: boolean
): BrainDatabase {
  const target = db.items.find((i) => i.id === itemId);
  if (!target) return db;

  const now = new Date().toISOString();
  const log: ConsumptionLog = {
    id: uid(),
    itemId: target.id,
    title: target.title,
    themeName: target.themeName,
    isStudy: target.isStudy,
    isPrivate: target.isPrivate,
    keptInHistory: keepInHistory,
    consumedAt: now
  };

  const updatedItems: BrainItem[] = keepInHistory
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

  const nextDb: BrainDatabase = {
    ...db,
    items: updatedItems,
    consumptionLogs: [log, ...db.consumptionLogs]
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function deleteItemWithoutCount(db: BrainDatabase, itemId: string): BrainDatabase {
  const nextDb = {
    ...db,
    items: db.items.filter((i) => i.id !== itemId)
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function addTask(
  db: BrainDatabase,
  title: string,
  isTne: boolean,
  isPrivate: boolean,
  dueDate?: string
): BrainDatabase {
  const task: BrainTask = {
    id: uid(),
    title: title.trim(),
    isTne,
    completed: false,
    postponedCount: 0,
    dueDate,
    isPrivate,
    createdAt: new Date().toISOString()
  };
  const nextDb = { ...db, tasks: [task, ...db.tasks] };
  saveDatabase(nextDb);
  return nextDb;
}

export function toggleTaskComplete(db: BrainDatabase, taskId: string): BrainDatabase {
  const nextDb = {
    ...db,
    tasks: db.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : undefined
          }
        : t
    )
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function postponeTask(db: BrainDatabase, taskId: string): BrainDatabase {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextDb = {
    ...db,
    tasks: db.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            postponedCount: t.postponedCount + 1,
            dueDate: tomorrow
          }
        : t
    )
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function deleteTask(db: BrainDatabase, taskId: string): BrainDatabase {
  const nextDb = {
    ...db,
    tasks: db.tasks.filter((t) => t.id !== taskId)
  };
  saveDatabase(nextDb);
  return nextDb;
}
