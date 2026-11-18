export type PriorityStatus = 'urgent' | 'attention' | 'later' | 'done';
export type ViewMode = 'cards' | 'list' | 'compact';
export type NotificationMode = 'vibrate_sound' | 'vibrate_only' | 'popup_only';

export type ModuleCategory =
  | 'media_terror'
  | 'media_comedia'
  | 'media_geral'
  | 'musicas'
  | 'apps_jogos'
  | 'receitas'
  | 'links_gerais'
  | 'estudos'
  | 'financas';

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  module: ModuleCategory | 'all';
  isPrivate: boolean;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface BrainItem {
  id: string;
  kind: 'link_media' | 'task' | 'finance';
  title: string;
  url?: string;
  thumbnail?: string;
  category: ModuleCategory;
  genreOrTopic: string;
  whatIsIt: string;      // "O que é"
  whySaved: string;      // "Por que salvei"
  tags: string[];
  folderId: string | null;
  priority: PriorityStatus;
  isPrivate: boolean;
  isTNE?: boolean;       // Tarefas que Não são Estudo
  // Tarefas / Compromissos
  dueDate?: string;      // ISO date/time ou vazio (sem data -> entra na quarta-feira)
  isHabit?: boolean;
  habitFrequency?: 'daily' | 'weekly';
  assignedPerson?: string;
  subtasks?: SubTask[];
  notificationMode?: NotificationMode;
  postponeCount?: number;
  // Finanças
  amount?: number;
  financeType?: 'bill' | 'wishlist' | 'cancel_sub';
  // Controle de Visita / Histórico
  visitedCount: number;
  seenConfirmed: boolean;
  archivedToHistory: boolean;
  completedAt?: string;
  createdAt: string;
  homeOrder: number;
}

export interface HistoryEntry {
  id: string;
  originalId: string;
  entryType: 'link_media' | 'task' | 'folder';
  title: string;
  details: string;
  tags: string[];
  folderPath: string;
  isPrivate: boolean;
  savedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  viewMode: ViewMode;
  homeFilters: {
    showUrgent: boolean;
    showAttention: boolean;
    showLater: boolean;
    showDone: boolean;
    selectedCategories: ModuleCategory[];
  };
  privatePin: string | null;
  biometricEnabled: boolean;
  includePrivateInReports: boolean;
  includePrivateInWednesday: boolean;
  lastWednesdayPromptDate: string | null;
}

export interface MegaBrainState {
  folders: FolderNode[];
  items: BrainItem[];
  history: HistoryEntry[];
  preferences: UserPreferences;
  stats: {
    discardedAfterSeenCount: number;
    totalPostponedTasks: number;
  };
}
