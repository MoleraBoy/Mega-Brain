export type MediaType = 'video' | 'article' | 'image' | 'audio' | 'document' | 'tool';

export type ViewMode = 'name_only' | 'thumb_only' | 'mini_all' | 'detailed';

export interface DisplayFieldConfig {
  showTitle: boolean;
  showThumb: boolean;
  showTheme: boolean;
  showFolder: boolean;
  showTags: boolean;
  showWhatIs: boolean;
  showWhySaved: boolean;
  showStudyBadge: boolean;
}

export interface Theme {
  id: string;
  name: string;
  normalizedName: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Folder {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface BrainItem {
  id: string;
  folderId: string | null;
  themeId: string | null;
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
  status: 'active' | 'history' | 'deleted_counted';
  seenCount: number;
  lastSeenAt?: string;
  createdAt: string;
}

export interface BrainTask {
  id: string;
  title: string;
  isTne: boolean;
  completed: boolean;
  postponedCount: number;
  dueDate?: string;
  isPrivate: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface ConsumptionLog {
  id: string;
  itemId: string;
  title: string;
  themeName: string;
  isStudy: boolean;
  isPrivate: boolean;
  keptInHistory: boolean;
  consumedAt: string;
}

export interface PrivateVaultConfig {
  enabled: boolean;
  pinHash: string;
  webauthnCredentialId?: string;
}

export interface BrainDatabase {
  themes: Theme[];
  folders: Folder[];
  items: BrainItem[];
  tasks: BrainTask[];
  consumptionLogs: ConsumptionLog[];
  privateConfig: PrivateVaultConfig;
}
