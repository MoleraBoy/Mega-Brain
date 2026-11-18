export type MediaType = 'artigo' | 'video' | 'pdf' | 'ferramenta' | 'curso' | 'outro';

export type DisplayMode = 'only_name' | 'only_thumb' | 'mini_all' | 'detailed';

export type TaskCategory = 'ESTUDO' | 'TNE';

export interface Folder {
  id: string;
  parentId: string | null;
  name: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Theme {
  id: string;
  name: string;
  normalizedName: string;
  isPrivate: boolean;
}

export interface LinkItem {
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
  openedAt?: string;
  status: 'active' | 'history' | 'deleted_after_view';
  viewedAt?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  status: 'pending' | 'completed' | 'postponed';
  postponeCount: number;
  isPrivate: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface VisitLog {
  id: string;
  linkId: string;
  title: string;
  themeName: string;
  isStudy: boolean;
  isPrivate: boolean;
  keptInHistory: boolean;
  visitedAt: string;
}

export interface FieldVisibility {
  showTitle: boolean;
  showThumb: boolean;
  showTheme: boolean;
  showWhatIs: boolean;
  showWhySaved: boolean;
  showTags: boolean;
  showFolderPath: boolean;
}

export interface PrivateVaultConfig {
  isConfigured: boolean;
  pinHash: string;
  webAuthnCredentialId?: string;
}
