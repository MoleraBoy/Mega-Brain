import {
  Folder,
  LinkItem,
  NotificationSettings,
  PrivateVaultConfig,
  TaskItem,
  Theme,
  VisitLog
} from './types';
import { normalizeThemeName } from './classifier';

const KEYS = {
  FOLDERS: 'mb_v23_folders',
  THEMES: 'mb_v23_themes',
  LINKS: 'mb_v23_links',
  TASKS: 'mb_v23_tasks',
  VISITS: 'mb_v23_visits',
  VAULT: 'mb_v23_vault',
  NOTIF: 'mb_v23_notif'
};

export const SEED_FOLDERS: Folder[] = [
  { id: 'f-root-1', parentId: null, name: 'Desenvolvimento & IA', isPrivate: false, createdAt: new Date().toISOString() },
  { id: 'f-sub-1', parentId: 'f-root-1', name: 'Arquitetura Next.js', isPrivate: false, createdAt: new Date().toISOString() },
  { id: 'f-sub-2', parentId: 'f-sub-1', name: 'Supabase & RPCs', isPrivate: false, createdAt: new Date().toISOString() },
  { id: 'f-root-2', parentId: null, name: 'Produtividade & Operação', isPrivate: false, createdAt: new Date().toISOString() },
  { id: 'f-priv-1', parentId: null, name: 'Projetos Confidenciais', isPrivate: true, createdAt: new Date().toISOString() }
];

export const SEED_THEMES: Theme[] = [
  { id: 'th-1', name: 'Arquitetura Fullstack', normalizedName: 'arquitetura fullstack', isPrivate: false }
];

export const SEED_LINKS: LinkItem[] = [
  {
    id: 'lk-1',
    folderId: 'f-sub-2',
    themeId: 'th-1',
    themeName: 'Arquitetura Fullstack',
    url: 'https://supabase.com/docs/guides/database/functions',
    title: 'PostgreSQL Functions & Idempotent Upserts',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',
    mediaType: 'artigo',
    whatIs: 'Guia oficial de funções RPC e tratamento de conflitos ON CONFLICT no PostgreSQL.',
    whySaved: 'Garantir idempotência ao salvar múltiplos links no mesmo tema.',
    tags: ['supabase', 'postgres', 'rpc', 'backend'],
    isStudy: false,
    isPrivate: false,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lk-2',
    folderId: 'f-sub-1',
    themeId: 'th-1',
    themeName: 'Arquitetura Fullstack',
    url: 'https://nextjs.org/docs/app/building-your-application/routing',
    title: 'Next.js App Router & Server Actions',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
    mediaType: 'artigo',
    whatIs: 'Documentação de roteamento aninhado e mutações no App Router.',
    whySaved: 'Segundo link no mesmo tema para validar exibição conjunta sem sobrescrita.',
    tags: ['nextjs', 'react', 'arquitetura'],
    isStudy: false,
    isPrivate: false,
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export const SEED_TASKS: TaskItem[] = [
  {
    id: 'tk-1',
    title: 'Arrumar site e configurar domínio para estudar depois',
    category: 'TNE',
    status: 'pending',
    postponeCount: 0,
    isPrivate: false,
    reminderTime: '18:00',
    soundEnabled: true,
    vibrationEnabled: true,
    createdAt: new Date().toISOString()
  }
];

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const localDB = {
  getFolders: () => readStore<Folder[]>(KEYS.FOLDERS, SEED_FOLDERS),
  saveFolders: (folders: Folder[]) => writeStore(KEYS.FOLDERS, folders),

  getThemes: () => readStore<Theme[]>(KEYS.THEMES, SEED_THEMES),
  saveThemes: (themes: Theme[]) => writeStore(KEYS.THEMES, themes),

  getLinks: () => readStore<LinkItem[]>(KEYS.LINKS, SEED_LINKS),
  saveLinks: (links: LinkItem[]) => writeStore(KEYS.LINKS, links),

  getTasks: () => readStore<TaskItem[]>(KEYS.TASKS, SEED_TASKS),
  saveTasks: (tasks: TaskItem[]) => writeStore(KEYS.TASKS, tasks),

  getVisits: () => readStore<VisitLog[]>(KEYS.VISITS, []),
  saveVisits: (visits: VisitLog[]) => writeStore(KEYS.VISITS, visits),

  getVault: () => readStore<PrivateVaultConfig>(KEYS.VAULT, { isConfigured: false, pinHash: '' }),
  saveVault: (cfg: PrivateVaultConfig) => writeStore(KEYS.VAULT, cfg),

  getNotifSettings: () =>
    readStore<NotificationSettings>(KEYS.NOTIF, {
      globalSoundEnabled: true,
      globalVibrationEnabled: true
    }),
  saveNotifSettings: (cfg: NotificationSettings) => writeStore(KEYS.NOTIF, cfg),

  upsertLinkWithTheme(input: Omit<LinkItem, 'id' | 'themeId' | 'createdAt' | 'status'>): LinkItem {
    const themes = this.getThemes();
    const links = this.getLinks();
    const cleanThemeName = input.themeName.trim() || 'Geral';
    const norm = normalizeThemeName(cleanThemeName);

    let existingTheme = themes.find(
      (t) => t.normalizedName === norm && t.isPrivate === input.isPrivate
    );

    if (!existingTheme) {
      existingTheme = {
        id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanThemeName,
        normalizedName: norm,
        isPrivate: input.isPrivate
      };
      this.saveThemes([...themes, existingTheme]);
    }

    const newLink: LinkItem = {
      ...input,
      id: `lk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      themeId: existingTheme.id,
      themeName: existingTheme.name,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.saveLinks([newLink, ...links]);
    return newLink;
  }
};

export function getFolderPath(folderId: string | null, folders: Folder[]): string {
  if (!folderId) return 'Raiz (Sem Pasta)';
  const parts: string[] = [];
  let current = folders.find((f) => f.id === folderId);
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);
    current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined;
  }
  return parts.length > 0 ? parts.join(' / ') : 'Raiz';
}
