'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Plus,
  Link2,
  CheckSquare,
  BarChart3,
  History,
  Lock,
  Unlock,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  Edit3,
  Trash2,
  BookOpen,
  Wrench,
  Folder as FolderIcon,
  GripVertical,
  CalendarClock,
  LayoutGrid
} from 'lucide-react';
import {
  BrainDatabase,
  BrainItem,
  BrainTask,
  DisplayFieldConfig,
  Folder,
  HomeFilterConfig,
  ViewMode
} from '@/lib/types';
import {
  addOrUpdateItem,
  addTask,
  completeFolderWithHistory,
  completeTaskWithHistory,
  createFolder,
  deleteItemWithoutCount,
  deleteTask,
  getDescendantFolderIds,
  getFolderFullPath,
  getWednesdayUndatedDigest,
  isWednesdayToday,
  loadDatabase,
  markItemAsSeen,
  moveItemToFolder,
  postponeTask,
  reorderEntities,
  saveDatabase,
  snoozeToNextWednesday
} from '@/lib/storageEngine';
import FolderTree from '@/components/FolderTree';
import LinkModal from '@/components/LinkModal';
import LinksMediaView from '@/components/LinksMediaView';
import TasksView from '@/components/TasksView';
import ReportsView from '@/components/ReportsView';
import PrivateSpaceGate from '@/components/PrivateSpaceGate';
import SeenConfirmModal from '@/components/SeenConfirmModal';
import WednesdayReviewModal from '@/components/WednesdayReviewModal';

type ActiveTab = 'home' | 'links_media' | 'tasks' | 'history' | 'reports' | 'private';

type PendingArchiveAction =
  | { kind: 'item'; item: BrainItem }
  | { kind: 'task'; task: BrainTask }
  | { kind: 'folder'; folder: Folder }
  | null;

export default function MegaBrainPage() {
  const [db, setDb] = useState<BrainDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);

  // Navegação por Pasta & Filtros da Página Inicial
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [homeFilter, setHomeFilter] = useState<HomeFilterConfig>({
    showFolders: true,
    showLinks: true,
    showTasks: true,
    onlyStudy: false,
    mediaType: '',
    tag: ''
  });

  // Edição de Exibição Material Design 3
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [showDisplayDrawer, setShowDisplayDrawer] = useState(false);
  const [fieldConfig, setFieldConfig] = useState<DisplayFieldConfig>({
    showTitle: true,
    showThumb: true,
    showTheme: true,
    showFolder: true,
    showTags: true,
    showWhatIs: true,
    showWhySaved: true,
    showStudyBadge: true
  });

  // Drag & Drop na Página Inicial
  const [dragState, setDragState] = useState<{
    kind: 'folder' | 'item' | 'task';
    id: string;
  } | null>(null);

  // Modais e Notificações
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrainItem | null>(null);
  const [pendingArchive, setPendingArchive] = useState<PendingArchiveAction>(null);
  const [isWednesdayModalOpen, setIsWednesdayModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadDatabase();
    setDb(loaded);
    if (isWednesdayToday()) {
      const digest = getWednesdayUndatedDigest(
        loaded,
        loaded.privateConfig.includePrivateInWednesdayReminder
      );
      if (digest.items.length > 0 || digest.tasks.length > 0) {
        setIsWednesdayModalOpen(true);
      }
    }
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  const isPrivateContext = activeTab === 'private';

  const scopedFolders = useMemo(
    () => (db ? db.folders.filter((f) => f.isPrivate === isPrivateContext) : []),
    [db, isPrivateContext]
  );

  const scopedItems = useMemo(
    () => (db ? db.items.filter((i) => i.isPrivate === isPrivateContext) : []),
    [db, isPrivateContext]
  );

  const scopedTasks = useMemo(
    () => (db ? db.tasks.filter((t) => t.isPrivate === isPrivateContext) : []),
    [db, isPrivateContext]
  );

  const activeItems = useMemo(() => {
    const allowedFolders = selectedFolderId
      ? new Set(getDescendantFolderIds(scopedFolders, selectedFolderId))
      : null;

    return scopedItems
      .filter((item) => {
        if (item.status !== 'active') return false;
        if (allowedFolders && (!item.folderId || !allowedFolders.has(item.folderId))) {
          return false;
        }
        if (homeFilter.tag && !item.tags.includes(homeFilter.tag)) return false;
        if (homeFilter.mediaType && item.mediaType !== homeFilter.mediaType) return false;
        if (homeFilter.onlyStudy && (!item.isStudy || item.isTne)) return false;
        return true;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [scopedItems, scopedFolders, selectedFolderId, homeFilter]);

  const activeSubfolders = useMemo(() => {
    return scopedFolders
      .filter((f) => f.status === 'active' && f.parentId === selectedFolderId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [scopedFolders, selectedFolderId]);

  const activeHomeTasks = useMemo(() => {
    const allowedFolders = selectedFolderId
      ? new Set(getDescendantFolderIds(scopedFolders, selectedFolderId))
      : null;

    return scopedTasks
      .filter((t) => {
        if (t.status !== 'active' || t.completed) return false;
        if (allowedFolders && (!t.folderId || !allowedFolders.has(t.folderId))) return false;
        if (homeFilter.onlyStudy && t.isTne) return false;
        if (homeFilter.tag && !t.tags.includes(homeFilter.tag)) return false;
        return true;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [scopedTasks, scopedFolders, selectedFolderId, homeFilter]);

  if (!db) return null;

  const wednesdayDigest = getWednesdayUndatedDigest(
    db,
    db.privateConfig.includePrivateInWednesdayReminder
  );

  const allTags = Array.from(new Set(scopedItems.flatMap((i) => i.tags))).sort();

  function handleConfirmArchive(keepInHistory: boolean) {
    if (!db || !pendingArchive) return;
    if (pendingArchive.kind === 'item') {
      setDb(markItemAsSeen(db, pendingArchive.item.id, keepInHistory));
      showToast(
        keepInHistory
          ? 'Link marcado como Visto, contabilizado e salvo no Histórico!'
          : 'Link marcado como Visto, contabilizado no relatório e removido.'
      );
    } else if (pendingArchive.kind === 'task') {
      setDb(completeTaskWithHistory(db, pendingArchive.task.id, keepInHistory));
      showToast(
        keepInHistory
          ? 'Tarefa concluída e guardada no Histórico!'
          : 'Tarefa concluída e removida.'
      );
    } else if (pendingArchive.kind === 'folder') {
      setDb(completeFolderWithHistory(db, pendingArchive.folder.id, keepInHistory));
      if (selectedFolderId === pendingArchive.folder.id) setSelectedFolderId(null);
      showToast(
        keepInHistory
          ? 'Pasta/subpasta concluída e salva no Histórico!'
          : 'Pasta/subpasta concluída e excluída.'
      );
    }
    setPendingArchive(null);
  }

  function renderHomeExplorer() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lateral de Pastas e Subpastas */}
        <aside className="lg:col-span-3 space-y-4">
          <FolderTree
            folders={scopedFolders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={(name, parentId, isStudy) =>
              setDb(createFolder(db, name, parentId, isPrivateContext, isStudy))
            }
            onCompleteFolder={(folder) =>
              setPendingArchive({ kind: 'folder', folder })
            }
          />
        </aside>

        {/* Área Principal Material Design 3 */}
        <section className="lg:col-span-9 space-y-4">
          {/* Barra Superior de Breadcrumb, Filtros e Edição de Exibição */}
          <div className="rounded-md3-lg border border-md3-outlineVariant bg-md3-surfaceContainerLow p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-md3-onSurfaceVariant">
                <FolderIcon className="w-4 h-4 text-md3-primary" />
                <span>Local:</span>
                <strong className="text-md3-onSurface">
                  {getFolderFullPath(scopedFolders, selectedFolderId)}
                </strong>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['name_only', 'thumb_only', 'mini_all', 'detailed'] as ViewMode[]).map((mode) => {
                  const labels: Record<ViewMode, string> = {
                    name_only: 'Só Nome',
                    thumb_only: 'Só Thumb',
                    mini_all: 'Miniatura de Tudo',
                    detailed: 'Detalhado'
                  };
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-md3-full px-3 py-1 text-xs font-medium transition ${
                        viewMode === mode
                          ? 'bg-md3-primary text-md3-onPrimary'
                          : 'bg-md3-surfaceContainerHigh text-md3-onSurfaceVariant hover:text-md3-onSurface'
                      }`}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowDisplayDrawer(!showDisplayDrawer)}
                  className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline px-3 py-1 text-xs font-medium hover:bg-md3-surfaceContainerHigh"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Editar Exibição & Filtros
                </button>
              </div>
            </div>

            {/* Painel de Filtros Combináveis & Campos Visíveis */}
            {showDisplayDrawer && (
              <div className="rounded-md3-md border border-md3-outlineVariant bg-md3-surface p-3.5 space-y-3 text-xs">
                <div className="space-y-1.5">
                  <span className="font-semibold text-md3-onSurface">
                    O que exibir na Página Inicial:
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={homeFilter.showFolders}
                        onChange={(e) =>
                          setHomeFilter({ ...homeFilter, showFolders: e.target.checked })
                        }
                      />
                      Pastas/Subpastas
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={homeFilter.showLinks}
                        onChange={(e) =>
                          setHomeFilter({ ...homeFilter, showLinks: e.target.checked })
                        }
                      />
                      Links e Mídias
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={homeFilter.showTasks}
                        onChange={(e) =>
                          setHomeFilter({ ...homeFilter, showTasks: e.target.checked })
                        }
                      />
                      Tarefas
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-md3-primary font-medium">
                      <input
                        type="checkbox"
                        checked={homeFilter.onlyStudy}
                        onChange={(e) =>
                          setHomeFilter({ ...homeFilter, onlyStudy: e.target.checked })
                        }
                      />
                      Somente Estudos
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={homeFilter.tag}
                    onChange={(e) => setHomeFilter({ ...homeFilter, tag: e.target.value })}
                    className="rounded border border-md3-outline px-2.5 py-1.5"
                  >
                    <option value="">Filtrar por Tag (Todas)</option>
                    {allTags.map((t) => (
                      <option key={t} value={t}>
                        #{t}
                      </option>
                    ))}
                  </select>

                  <select
                    value={homeFilter.mediaType}
                    onChange={(e) => setHomeFilter({ ...homeFilter, mediaType: e.target.value })}
                    className="rounded border border-md3-outline px-2.5 py-1.5"
                  >
                    <option value="">Filtrar por Tipo de Mídia (Todos)</option>
                    <option value="article">Artigo</option>
                    <option value="video">Vídeo</option>
                    <option value="document">Documento</option>
                    <option value="tool">Ferramenta</option>
                    <option value="image">Imagem</option>
                    <option value="audio">Áudio</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-md3-outlineVariant">
                  <span className="font-semibold text-md3-onSurface">
                    Campos visíveis nos cards:
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        ['showTitle', 'Título'],
                        ['showThumb', 'Thumbnail'],
                        ['showTheme', 'Tema'],
                        ['showFolder', 'Pasta'],
                        ['showTags', 'Tags'],
                        ['showWhatIs', 'O que é'],
                        ['showWhySaved', 'Por que salvei']
                      ] as [keyof DisplayFieldConfig, string][]
                    ).map(([key, label]) => (
                      <label key={key} className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldConfig[key]}
                          onChange={(e) =>
                            setFieldConfig({ ...fieldConfig, [key]: e.target.checked })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 1. Pastas e Subpastas na Página Inicial (Arrastáveis) */}
          {homeFilter.showFolders && activeSubfolders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-md3-onSurfaceVariant">
                Pastas & Subpastas (Arraste para reordenar)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeSubfolders.map((folder) => (
                  <div
                    key={folder.id}
                    draggable
                    onDragStart={() => setDragState({ kind: 'folder', id: folder.id })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragState?.kind === 'folder') {
                        setDb(reorderEntities(db, 'folder', dragState.id, folder.id));
                        setDragState(null);
                      }
                    }}
                    className="md3-card p-3 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    >
                      <GripVertical className="w-4 h-4 text-md3-outline shrink-0" />
                      <FolderIcon className="w-4 h-4 text-md3-primary shrink-0" />
                      <span className="text-xs font-semibold truncate">{folder.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingArchive({ kind: 'folder', folder })}
                      title="Concluir pasta"
                      className="text-emerald-700 hover:bg-emerald-50 p-1 rounded"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Links & Mídias (Arrastáveis + Modos MD3) */}
          {homeFilter.showLinks && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-md3-onSurfaceVariant">
                  Links & Mídias ({activeItems.length}) — Arraste para organizar
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsLinkModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primary px-3.5 py-1.5 text-xs font-medium text-md3-onPrimary hover:opacity-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Link
                </button>
              </div>

              {activeItems.length === 0 ? (
                <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-8 text-center text-xs text-md3-onSurfaceVariant">
                  Nenhum link ativo neste filtro. Clique em &quot;Adicionar Link&quot; para salvar um novo conteúdo.
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'thumb_only'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
                      : viewMode === 'mini_all'
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'
                      : 'space-y-3'
                  }
                >
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDragState({ kind: 'item', id: item.id })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragState?.kind === 'item') {
                          setDb(reorderEntities(db, 'item', dragState.id, item.id));
                          setDragState(null);
                        }
                      }}
                      className="md3-card p-3.5 flex flex-col justify-between gap-2.5 cursor-grab active:cursor-grabbing"
                    >
                      {viewMode === 'thumb_only' ? (
                        <div className="space-y-2">
                          <img
                            src={item.thumbnailUrl || 'https://placehold.co/320x180?text=Mega+Brain'}
                            alt={item.title}
                            className="w-full h-28 object-cover rounded-md3-md bg-md3-surfaceContainer"
                          />
                          <p className="text-xs font-medium truncate">{item.title}</p>
                        </div>
                      ) : viewMode === 'name_only' ? (
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-md3-outline shrink-0" />
                          <span className="text-sm font-medium truncate">{item.title}</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-4 h-4 text-md3-outline shrink-0 mt-1" />
                          {fieldConfig.showThumb && item.thumbnailUrl && (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className={
                                viewMode === 'mini_all'
                                  ? 'w-12 h-12 rounded-md3-sm object-cover shrink-0'
                                  : 'w-20 h-20 rounded-md3-md object-cover shrink-0 border border-md3-outlineVariant'
                              }
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {fieldConfig.showTheme && (
                                <span className="rounded-md3-full bg-md3-secondaryContainer px-2 py-0.5 text-[10px] font-semibold text-md3-onSecondaryContainer">
                                  {item.themeName}
                                </span>
                              )}
                              {fieldConfig.showFolder && (
                                <span className="text-[10px] text-md3-onSurfaceVariant">
                                  {getFolderFullPath(scopedFolders, item.folderId)}
                                </span>
                              )}
                              {item.isStudy && !item.isTne && (
                                <span className="inline-flex items-center gap-0.5 rounded-md3-full bg-md3-primaryContainer px-2 py-0.5 text-[10px] font-semibold text-md3-onPrimaryContainer">
                                  <BookOpen className="w-2.5 h-2.5" /> Estudo
                                </span>
                              )}
                              {item.isTne && (
                                <span className="inline-flex items-center gap-0.5 rounded-md3-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                                  <Wrench className="w-2.5 h-2.5" /> TNE
                                </span>
                              )}
                            </div>

                            {fieldConfig.showTitle && (
                              <h4 className="text-sm font-semibold text-md3-onSurface line-clamp-1">
                                {item.title}
                              </h4>
                            )}

                            {viewMode === 'detailed' && fieldConfig.showWhatIs && item.whatIs && (
                              <p className="text-xs text-md3-onSurfaceVariant line-clamp-2">
                                <strong>O que é:</strong> {item.whatIs}
                              </p>
                            )}

                            {viewMode === 'detailed' && fieldConfig.showWhySaved && item.whySaved && (
                              <p className="text-xs text-md3-onSurfaceVariant line-clamp-1">
                                <strong>Por que salvei:</strong> {item.whySaved}
                              </p>
                            )}

                            {fieldConfig.showTags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {item.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="rounded bg-md3-surfaceContainerHigh px-1.5 py-0.5 text-[10px] text-md3-onSurfaceVariant"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-md3-outlineVariant/60">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline px-2.5 py-1 text-[11px] font-medium hover:bg-md3-surfaceContainerHigh"
                        >
                          <ExternalLink className="w-3 h-3" /> Abrir
                        </a>
                        <button
                          type="button"
                          onClick={() => setPendingArchive({ kind: 'item', item })}
                          className="inline-flex items-center gap-1 rounded-md3-full bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Visto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsLinkModalOpen(true);
                          }}
                          className="rounded-md3-full p-1 text-md3-onSurfaceVariant hover:bg-md3-surfaceContainerHigh"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDb(deleteItemWithoutCount(db, item.id))}
                          className="rounded-md3-full p-1 text-rose-600 hover:bg-rose-50"
                          title="Excluir sem contabilizar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Tarefas na Página Inicial (Arrastáveis) */}
          {homeFilter.showTasks && activeHomeTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-md3-onSurfaceVariant">
                Tarefas Pendentes ({activeHomeTasks.length}) — Arraste para priorizar
              </h3>
              <div className="space-y-2">
                {activeHomeTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragState({ kind: 'task', id: task.id })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragState?.kind === 'task') {
                        setDb(reorderEntities(db, 'task', dragState.id, task.id));
                        setDragState(null);
                      }
                    }}
                    className="md3-card p-3 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-4 h-4 text-md3-outline shrink-0" />
                      <span
                        className={`rounded-md3-full px-2 py-0.5 text-[10px] font-semibold ${
                          task.isTne
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                        }`}
                      >
                        {task.isTne ? 'TNE' : 'Estudo'}
                      </span>
                      <span className="text-xs font-medium truncate">{task.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingArchive({ kind: 'task', task })}
                      className="inline-flex items-center gap-1 rounded-md3-full bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white"
                    >
                      <CheckSquare className="w-3 h-3" /> Concluir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderHistoryTab() {
    const historyItems = scopedItems.filter((i) => i.status === 'history');
    const historyTasks = scopedTasks.filter((t) => t.status === 'history');
    const historyFolders = scopedFolders.filter((f) => f.status === 'history');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="md3-card p-4">
            <span className="text-xs text-md3-onSurfaceVariant">Links Vistos no Histórico</span>
            <p className="text-2xl font-bold text-md3-primary mt-1">{historyItems.length}</p>
          </div>
          <div className="md3-card p-4">
            <span className="text-xs text-md3-onSurfaceVariant">Tarefas Concluídas Salvas</span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{historyTasks.length}</p>
          </div>
          <div className="md3-card p-4">
            <span className="text-xs text-md3-onSurfaceVariant">Pastas & Subpastas Concluídas</span>
            <p className="text-2xl font-bold text-md3-onSurface mt-1">{historyFolders.length}</p>
          </div>
        </div>

        {/* Links no Histórico */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-md3-onSurface">Links & Mídias Guardados</h3>
          {historyItems.length === 0 ? (
            <p className="text-xs text-md3-onSurfaceVariant">Nenhum link salvo no histórico.</p>
          ) : (
            historyItems.map((item) => (
              <div key={item.id} className="md3-card p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-md3-onSurfaceVariant">
                    Tema: {item.themeName} • Visto {item.seenCount}x
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md3-full border border-md3-outline px-3 py-1 text-xs"
                  >
                    Reabrir
                  </a>
                  <button
                    type="button"
                    onClick={() => setDb(deleteItemWithoutCount(db, item.id))}
                    className="rounded-md3-full p-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tarefas no Histórico */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-md3-onSurface">Tarefas Concluídas Guardadas</h3>
          {historyTasks.length === 0 ? (
            <p className="text-xs text-md3-onSurfaceVariant">Nenhuma tarefa guardada no histórico.</p>
          ) : (
            historyTasks.map((task) => (
              <div key={task.id} className="md3-card p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium line-through text-md3-onSurfaceVariant">
                    {task.title}
                  </p>
                  <span className="text-[11px] text-md3-onSurfaceVariant">
                    {task.isTne ? 'TNE' : 'Estudo'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDb(deleteTask(db, task.id))}
                  className="rounded-md3-full p-1.5 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pastas & Subpastas no Histórico */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-md3-onSurface">Pastas & Subpastas Arquivadas</h3>
          {historyFolders.length === 0 ? (
            <p className="text-xs text-md3-onSurfaceVariant">Nenhuma pasta arquivada no histórico.</p>
          ) : (
            historyFolders.map((folder) => (
              <div key={folder.id} className="md3-card p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-4 h-4 text-md3-primary" />
                  <span className="text-sm font-semibold">{folder.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDb(completeFolderWithHistory(db, folder.id, false))}
                  className="rounded-md3-full p-1.5 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra Superior Material Design 3 */}
      <header className="sticky top-0 z-30 border-b border-md3-outlineVariant bg-md3-surface/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md3-md bg-md3-primary p-2 text-md3-onPrimary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-md3-onSurface">
                Mega Brain
              </h1>
              <p className="text-[11px] text-md3-onSurfaceVariant">
                Segundo Cérebro • Material Design 3
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['home', 'Início', LayoutGrid],
                ['links_media', 'Links e Mídias', Link2],
                ['tasks', 'Tarefas', CheckSquare],
                ['history', 'Histórico', History],
                ['reports', 'Relatórios', BarChart3],
                ['private', 'Espaço Privado', isPrivateUnlocked ? Unlock : Lock]
              ] as [ActiveTab, string, React.ElementType][]
            ).map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedFolderId(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md3-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab
                    ? 'bg-md3-primary text-md3-onPrimary shadow-sm'
                    : 'bg-md3-surfaceContainerHigh text-md3-onSurfaceVariant hover:text-md3-onSurface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}

            {/* Botão de Revisão de Quarta-feira (Itens sem data) */}
            <button
              type="button"
              onClick={() => setIsWednesdayModalOpen(true)}
              title="Resumo semanal de quarta-feira para itens sem data"
              className="inline-flex items-center gap-1.5 rounded-md3-full bg-md3-tertiaryContainer px-3 py-1.5 text-xs font-semibold text-md3-onTertiaryContainer hover:opacity-90"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Quarta ({wednesdayDigest.items.length + wednesdayDigest.tasks.length})</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Toast de Notificação */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md3-lg bg-md3-onSurface text-md3-surface px-4 py-3 text-xs font-medium shadow-xl">
          {toastMessage}
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        {activeTab === 'home' && renderHomeExplorer()}

        {activeTab === 'links_media' && (
          <LinksMediaView
            items={scopedItems.filter((i) => i.status === 'active')}
            folders={scopedFolders}
            onMoveItem={(itemId, targetId) => setDb(moveItemToFolder(db, itemId, targetId))}
            onCreateSubfolder={(name, parentId) =>
              setDb(createFolder(db, name, parentId, isPrivateContext, false))
            }
            onTriggerSeen={(item) => setPendingArchive({ kind: 'item', item })}
            onDelete={(itemId) => setDb(deleteItemWithoutCount(db, itemId))}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={scopedTasks.filter((t) => t.status === 'active' && !t.completed)}
            folders={scopedFolders}
            onAddTask={(payload) =>
              setDb(addTask(db, { ...payload, isPrivate: isPrivateContext }))
            }
            onCompleteTaskWithPrompt={(task) => setPendingArchive({ kind: 'task', task })}
            onPostpone={(taskId) => setDb(postponeTask(db, taskId))}
            onDelete={(taskId) => setDb(deleteTask(db, taskId))}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'history' && renderHistoryTab()}

        {activeTab === 'reports' && (
          <ReportsView
            folders={db.folders}
            items={db.items}
            tasks={db.tasks}
            consumptionLogs={db.consumptionLogs}
            hasPrivateVault={db.privateConfig.enabled}
          />
        )}

        {activeTab === 'private' && (
          <>
            {!isPrivateUnlocked ? (
              <PrivateSpaceGate
                config={db.privateConfig}
                isUnlocked={isPrivateUnlocked}
                onUnlock={() => setIsPrivateUnlocked(true)}
                onConfigureVault={(newConfig) => {
                  const next = { ...db, privateConfig: newConfig };
                  saveDatabase(next);
                  setDb(next);
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md3-lg bg-purple-50 border border-purple-200 px-4 py-2.5 text-xs">
                  <span className="font-semibold text-purple-950">
                    Espaço Privado Desbloqueado — Pastas, links e tarefas aqui dentro são isolados.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPrivateUnlocked(false)}
                    className="inline-flex items-center gap-1 rounded-md3-full bg-purple-900 px-3 py-1 font-medium text-white"
                  >
                    <Lock className="w-3 h-3" /> Bloquear Cofre
                  </button>
                </div>
                {renderHomeExplorer()}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Criação / Edição de Link */}
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setEditingItem(null);
        }}
        folders={scopedFolders}
        historyItems={db.items}
        defaultFolderId={selectedFolderId}
        isPrivateMode={isPrivateContext}
        editingItem={editingItem}
        onSave={(payload) => {
          setDb(addOrUpdateItem(db, payload));
          showToast('Item salvo com sucesso!');
        }}
      />

      {/* Modal de Confirmação: Manter no Histórico vs Excluir */}
      <SeenConfirmModal
        isOpen={Boolean(pendingArchive)}
        entityLabel={
          pendingArchive?.kind === 'item'
            ? 'Conteúdo Visto'
            : pendingArchive?.kind === 'task'
            ? 'Tarefa Concluída'
            : 'Pasta / Subpasta Concluída'
        }
        entityTitle={
          pendingArchive?.kind === 'item'
            ? pendingArchive.item.title
            : pendingArchive?.kind === 'task'
            ? pendingArchive.task.title
            : pendingArchive?.kind === 'folder'
            ? pendingArchive.folder.name
            : ''
        }
        description={
          pendingArchive?.kind === 'item'
            ? 'Deseja manter este link no seu Histórico de itens vistos? Se escolher "Não", ele será apagado mas continuará contabilizado como visitado no relatório.'
            : 'Deseja salvar este registro no seu Histórico de concluídos ou prefere excluí-lo definitivamente?'
        }
        onConfirmKeepHistory={() => handleConfirmArchive(true)}
        onConfirmDelete={() => handleConfirmArchive(false)}
        onCancel={() => setPendingArchive(null)}
      />

      {/* Modal de Revisão Semanal de Quarta-feira */}
      <WednesdayReviewModal
        isOpen={isWednesdayModalOpen}
        onClose={() => setIsWednesdayModalOpen(false)}
        items={wednesdayDigest.items}
        tasks={wednesdayDigest.tasks}
        folders={db.folders}
        hasPrivateVault={db.privateConfig.enabled}
        includePrivate={db.privateConfig.includePrivateInWednesdayReminder}
        onToggleIncludePrivate={(val) => {
          const next = {
            ...db,
            privateConfig: {
              ...db.privateConfig,
              includePrivateInWednesdayReminder: val
            }
          };
          saveDatabase(next);
          setDb(next);
        }}
        onViewItemNow={(item) => {
          window.open(item.url, '_blank', 'noopener,noreferrer');
          setIsWednesdayModalOpen(false);
          setPendingArchive({ kind: 'item', item });
        }}
        onSnoozeToNextWednesday={(kind, id) => {
          setDb(snoozeToNextWednesday(db, kind, id));
          showToast('Adiado para a próxima quarta-feira!');
        }}
        onCompleteTaskNow={(task) => {
          setIsWednesdayModalOpen(false);
          setPendingArchive({ kind: 'task', task });
        }}
      />
    </div>
  );
}
