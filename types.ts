export type MediaType = 'video' | 'article' | 'image' | 'audio' | 'document' | 'tool';

export type ViewMode = 'name_only' | 'thumb_only' | 'mini_all' | 'detailed';

export type TaskNotificationMode = 'sound_vibrate' | 'vibrate_only' | 'popup_only';

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

export interface HomeFilterConfig {
  showFolders: boolean;
  showLinks: boolean;
  showTasks: boolean;
  onlyStudy: boolean;
  mediaType: string;
  tag: string;
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
  isStudyFolder: boolean;
  status: 'active' | 'history';
  sortOrder: number;
  createdAt: string;
  archivedAt?: string;
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
  isTne: boolean;
  isPrivate: boolean;
  status: 'active' | 'history' | 'deleted_counted';
  seenCount: number;
  sortOrder: number;
  dueDate?: string;
  wednesdaySnoozedUntil?: string;
  lastSeenAt?: string;
  createdAt: string;
}

export interface BrainTask {
  id: string;
  folderId: string | null;
  title: string;
  tags: string[];
  isTne: boolean;
  completed: boolean;
  postponedCount: number;
  dueDate?: string;
  notificationMode: TaskNotificationMode;
  wednesdaySnoozedUntil?: string;
  isPrivate: boolean;
  status: 'active' | 'history';
  sortOrder: number;
  createdAt: string;
  completedAt?: string;
}

export interface ConsumptionLog {
  id: string;
  itemId: string;
  title: string;
  themeName: string;
  tags: string[];
  isStudy: boolean;
  isTne: boolean;
  isPrivate: boolean;
  keptInHistory: boolean;
  consumedAt: string;
}

export interface PrivateVaultConfig {
  enabled: boolean;
  pinHash: string;
  webauthnCredentialId?: string;
  includePrivateInWednesdayReminder: boolean;
}

export interface BrainDatabase {
  themes: Theme[];
  folders: Folder[];
  items: BrainItem[];
  tasks: BrainTask[];
  consumptionLogs: ConsumptionLog[];
  privateConfig: PrivateVaultConfig;
}
