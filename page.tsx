'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Plus,
  FolderTree as FolderTreeIcon,
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
  BookOpen
} from 'lucide-react';
import {
  BrainDatabase,
  BrainItem,
  DisplayFieldConfig,
  MediaType,
  ViewMode
} from '@/lib/types';
import {
  addOrUpdateItem,
  addTask,
  createFolder,
  deleteItemWithoutCount,
  deleteTask,
  getDescendantFolderIds,
  getFolderFullPath,
  loadDatabase,
  markItemAsSeen,
  moveItemToFolder,
  postponeTask,
  saveDatabase,
  toggleTaskComplete
} from '@/lib/storageEngine';
import FolderTree from '@/components/FolderTree';
import LinkModal from '@/components/LinkModal';
import LinksMediaView from '@/components/LinksMediaView';
import TasksView from '@/components/TasksView';
import ReportsView from '@/components/ReportsView';
import PrivateSpaceGate from '@/components/PrivateSpaceGate';
import SeenConfirmModal from '@/components/SeenConfirmModal';

type ActiveTab = 'explore' | 'links_media' | 'tasks' | 'history' | 'reports' | 'private';

export default function MegaBrainPage() {
  const [db, setDb] = useState<BrainDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);

  // Navegação e Filtros Combináveis
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterMediaType, setFilterMediaType] = useState<string>('');
  const [filterOnlyStudy, setFilterOnlyStudy] = useState<boolean>(false);

  // Modos de Exibição Material Design 3 + Toggles Individuais
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [showDisplayConfig, setShowDisplayConfig] = useState(false);
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

  // Modais
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrainItem | null>(null);
  const [seenTargetItem, setSeenTargetItem] = useState<BrainItem | null>(null);

  useEffect(() => {
    setDb(loadDatabase());
  }, []);

  const isPrivateSpace = activeTab === 'private';

  const scopedFolders = useMemo(() => {
    if (!db) return [];
    return db.folders.filter((f) => f.isPrivate === isPrivateSpace);
  }, [db, isPrivateSpace]);

  const scopedActiveItems = useMemo(() => {
    if (!db) return [];
    return db.items.filter(
      (i) => i.isPrivate === isPrivateSpace && i.status === 'active'
    );
  }, [db, isPrivateSpace]);

  const scopedHistoryItems = useMemo(() => {
    if (!db) return [];
    return db.items.filter(
      (i) => i.isPrivate === isPrivateSpace && i.status === 'history'
    );
  }, [db, isPrivateSpace]);

  const scopedTasks = useMemo(() => {
    if (!db) return [];
    return db.tasks.filter((t) => t.isPrivate === isPrivateSpace);
  }, [db, isPrivateSpace]);

  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of scopedActiveItems) {
      for (const tag of item.tags) set.add(tag);
    }
    return Array.from(set).sort();
  }, [scopedActiveItems]);

  const filteredExploreItems = useMemo(() => {
    return scopedActiveItems.filter((item) => {
      if (selectedFolderId) {
        const validIds = getDescendantFolderIds(scopedFolders, selectedFolderId);
        if (!item.folderId || !validIds.includes(item.folderId)) return false;
      }
      if (filterTag && !item.tags.includes(filterTag)) return false;
      if (filterMediaType && item.mediaType !== filterMediaType) return false;
      if (filterOnlyStudy && !item.isStudy) return false;
      return true;
    });
  }, [
    scopedActiveItems,
    scopedFolders,
    selectedFolderId,
    filterTag,
    filterMediaType,
    filterOnlyStudy
  ]);

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-md3-onSurfaceVariant">
        Carregando Mega Brain v2-3...
      </div>
    );
  }

  function applyViewPreset(mode: ViewMode) {
    setViewMode(mode);
    if (mode === 'name_only') {
      setFieldConfig({
        showTitle: true,
        showThumb: false,
        showTheme: false,
        showFolder: false,
        showTags: false,
        showWhatIs: false,
        showWhySaved: false,
        showStudyBadge: false
      });
    } else if (mode === 'thumb_only') {
      setFieldConfig({
        showTitle: false,
        showThumb: true,
        showTheme: false,
        showFolder: false,
        showTags: false,
        showWhatIs: false,
        showWhySaved: false,
        showStudyBadge: false
      });
    } else if (mode === 'mini_all') {
      setFieldConfig({
        showTitle: true,
        showThumb: true,
        showTheme: true,
        showFolder: false,
        showTags: true,
        showWhatIs: false,
        showWhySaved: false,
        showStudyBadge: true
      });
    } else {
      setFieldConfig({
        showTitle: true,
        showThumb: true,
        showTheme: true,
        showFolder: true,
        showTags: true,
        showWhatIs: true,
        showWhySaved: true,
        showStudyBadge: true
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top App Bar Material Design 3 */}
      <header className="sticky top-0 z-30 border-b border-md3-outlineVariant bg-md3-surfaceContainerLowest/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md3-md bg-md3-primary p-2 text-md3-onPrimary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-md3-onSurface">
                Mega Brain <span className="text-xs font-medium text-md3-primary">v2-3</span>
              </h1>
              <p className="text-[11px] text-md3-onSurfaceVariant">
                Segundo Cérebro • Links, Mídias & Execução
              </p>
            </div>
          </div>

          {/* Menu Superior */}
          <nav className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('explore')}
              className={`inline-flex items-center gap-1.5 rounded-md3-full px-3.5 py-2 text-xs font-medium transition ${
                activeTab === 'explore'
                  ? 'bg-md3-secondaryContainer text-md3-onSecondaryContainer'
                  : 'text-md3-onSurfaceVariant hover:bg-md3-surfaceContainer'
              }`}
            >
              <FolderTreeIcon className="w-3.5 h-3.5" /> Pastas & Explorar
            </button>

            <button
              onClick={() => setActiveTab('links_media')}
              className={`inline-flex items-center gap-1.5 rounded-md3-full px-3.5 py-2 text-xs font-medium transition ${
                activeTab === 'links_media'
                  ? 'bg-md3-secondaryContainer text-md3-onSecondaryContainer'
                  : 'text-md3-onSurfaceVariant hover:bg-md3-surfaceContainer'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" /> Links e Mídias
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`inline-flex items-center gap-1.5 rounded-md3-full px-3.5 py-2 text-xs font-medium transition ${
                activeTab === 'tasks'
                  ? 'bg-md3-secondaryContainer text-md3-onSecondaryContainer'
                  : 'text-md3-onSurfaceVariant hover:bg-md3-surfaceContainer'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Tarefas
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-1.5 rounded-md3-full px-3.5 py-2 text-xs font-medium transition ${
                activeTab === 'history'
                  ? 'bg-md3-secondaryContainer text-md3-onSecondaryContainer'
                  : 'text-md3-onSurfaceVariant hover:bg-md3-surfaceContainer'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Histórico ({scopedHistoryItems.length})
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`inline-flex items-center gap-1.5 rounded-md3-full px-3.5 py-2 text-xs font-medium transition ${
                activeTab === 'reports'
                  ? 'bg-md3-secondaryContainer text-md3-onSecondaryContainer'
                  : 'text-md3-onSurfaceVariant hover:bg-md3-surfaceContainer'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Relatórios
            </button>

            <button
              onClick={() => {
                setSelectedFolderId(null);
                setActiveTab('private');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md3-full px-3.5 py-2 text-xs font-medium transition ${
                activeTab === 'private'
                  ? 'bg-md3-tertiaryContainer text-md3-onTertiaryContainer'
                  : 'text-md3-onSurfaceVariant hover:bg-md3-surfaceContainer'
              }`}
            >
              {isPrivateUnlocked ? (
                <Unlock className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              Espaço Privado
            </button>
          </nav>

          {/* Botão Primário + Novo Link */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsLinkModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md3-full bg-md3-primary px-4 py-2 text-xs font-semibold text-md3-onPrimary shadow-sm hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> Salvar Link
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 space-y-6">
        {/* Gate Biométrico / PIN para Espaço Privado */}
        {activeTab === 'private' && !isPrivateUnlocked ? (
          <PrivateSpaceGate
            config={db.privateConfig}
            isUnlocked={isPrivateUnlocked}
            onUnlock={() => setIsPrivateUnlocked(true)}
            onConfigureVault={(newConfig) => {
              const updated = { ...db, privateConfig: newConfig };
              saveDatabase(updated);
              setDb(updated);
            }}
          />
        ) : null}

        {/* Barra superior do Espaço Privado quando desbloqueado */}
        {activeTab === 'private' && isPrivateUnlocked && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md3-lg bg-md3-tertiaryContainer/40 border border-md3-tertiary/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-md3-onTertiaryContainer">
              <Unlock className="w-4 h-4" />
              <span>
                Espaço Privado Desbloqueado — Itens aqui não entram nas estatísticas gerais.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrivateUnlocked(false)}
                className="rounded-md3-full bg-md3-surfaceContainerLowest px-3 py-1 text-xs font-medium text-md3-onSurface border border-md3-outlineVariant"
              >
                Bloquear Agora
              </button>
            </div>
          </div>
        )}

        {/* Aba Explorar (ou Espaço Privado Desbloqueado) */}
        {(activeTab === 'explore' || (activeTab === 'private' && isPrivateUnlocked)) && (
          <div className="space-y-5">
            <FolderTree
              folders={scopedFolders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={(name, parentId) => {
                const { db: next } = createFolder(db, name, parentId, isPrivateSpace);
                setDb(next);
              }}
            />

            {/* Barra de Filtros Combináveis + Modos de Exibição MD3 */}
            <div className="rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="rounded-md3-full border border-md3-outline bg-md3-surface px-3 py-1.5 text-xs"
                  >
                    <option value="">Todas as Tags</option>
                    {allAvailableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        #{tag}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterMediaType}
                    onChange={(e) => setFilterMediaType(e.target.value)}
                    className="rounded-md3-full border border-md3-outline bg-md3-surface px-3 py-1.5 text-xs"
                  >
                    <option value="">Todos os Tipos</option>
                    <option value="article">Artigo</option>
                    <option value="video">Vídeo</option>
                    <option value="document">Documento</option>
                    <option value="tool">Ferramenta</option>
                    <option value="image">Imagem</option>
                    <option value="audio">Áudio</option>
                  </select>

                  <label className="inline-flex items-center gap-1.5 rounded-md3-full border border-md3-outline bg-md3-surface px-3 py-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOnlyStudy}
                      onChange={(e) => setFilterOnlyStudy(e.target.checked)}
                      className="accent-md3-primary"
                    />
                    <span>Somente Estudos</span>
                  </label>
                </div>

                {/* Modos de visualização */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['name_only', 'Só Nome'],
                      ['thumb_only', 'Só Thumb'],
                      ['mini_all', 'Miniatura de Tudo'],
                      ['detailed', 'Detalhado']
                    ] as [ViewMode, string][]
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => applyViewPreset(mode)}
                      className={`rounded-md3-full px-3 py-1 text-xs font-medium transition ${
                        viewMode === mode
                          ? 'bg-md3-primary text-md3-onPrimary'
                          : 'bg-md3-surfaceContainerHigh text-md3-onSurface'
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowDisplayConfig((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline bg-md3-surface px-3 py-1 text-xs font-medium"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Campos
                  </button>
                </div>
              </div>

              {/* Toggles Individuais por Campo */}
              {showDisplayConfig && (
                <div className="flex flex-wrap gap-3 pt-2 border-t border-md3-outlineVariant text-xs">
                  {(
                    [
                      ['showTitle', 'Título'],
                      ['showThumb', 'Thumbnail'],
                      ['showTheme', 'Tema'],
                      ['showFolder', 'Pasta'],
                      ['showTags', 'Tags'],
                      ['showWhatIs', 'O que é'],
                      ['showWhySaved', 'Por que salvei'],
                      ['showStudyBadge', 'Selo Estudo']
                    ] as [keyof DisplayFieldConfig, string][]
                  ).map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldConfig[key]}
                        onChange={(e) =>
                          setFieldConfig((prev) => ({
                            ...prev,
                            [key]: e.target.checked
                          }))
                        }
                        className="accent-md3-primary"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Grid de Cards */}
            {filteredExploreItems.length === 0 ? (
              <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-12 text-center text-sm text-md3-onSurfaceVariant">
                Nenhum link encontrado com os filtros atuais.
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  viewMode === 'name_only'
                    ? 'grid-cols-1 md:grid-cols-2'
                    : viewMode === 'thumb_only'
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {filteredExploreItems.map((item) => (
                  <article key={item.id} className="md3-card overflow-hidden flex flex-col">
                    {fieldConfig.showThumb && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-36 w-full bg-md3-surfaceContainerHighest overflow-hidden relative"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-md3-onSurfaceVariant">
                            {item.mediaType.toUpperCase()}
                          </div>
                        )}
                      </a>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {fieldConfig.showTheme && item.themeName && (
                            <span className="rounded-md3-full bg-md3-primaryContainer px-2.5 py-0.5 text-[11px] font-semibold text-md3-onPrimaryContainer">
                              {item.themeName}
                            </span>
                          )}
                          {fieldConfig.showStudyBadge && item.isStudy && (
                            <span className="inline-flex items-center gap-1 rounded-md3-full bg-md3-tertiaryContainer px-2 py-0.5 text-[11px] font-medium text-md3-onTertiaryContainer">
                              <BookOpen className="w-3 h-3" /> Estudo
                            </span>
                          )}
                        </div>

                        {fieldConfig.showTitle && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-start gap-1.5 text-sm font-semibold text-md3-onSurface hover:text-md3-primary"
                          >
                            <span>{item.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          </a>
                        )}

                        {fieldConfig.showFolder && (
                          <p className="text-[11px] text-md3-onSurfaceVariant">
                            Pasta: {getFolderFullPath(scopedFolders, item.folderId)}
                          </p>
                        )}

                        {fieldConfig.showWhatIs && item.whatIs && (
                          <p className="text-xs text-md3-onSurfaceVariant">
                            <strong className="text-md3-onSurface">O que é:</strong>{' '}
                            {item.whatIs}
                          </p>
                        )}

                        {fieldConfig.showWhySaved && item.whySaved && (
                          <p className="text-xs text-md3-onSurfaceVariant">
                            <strong className="text-md3-onSurface">Por que salvei:</strong>{' '}
                            {item.whySaved}
                          </p>
                        )}

                        {fieldConfig.showTags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md3-full bg-md3-surfaceContainerHighest px-2 py-0.5 text-[11px] text-md3-onSurfaceVariant"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Ações do Card */}
                      <div className="flex items-center justify-between pt-2 border-t border-md3-outlineVariant">
                        <button
                          type="button"
                          onClick={() => setSeenTargetItem(item)}
                          className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primary px-3 py-1 text-xs font-medium text-md3-onPrimary hover:opacity-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Visto
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setIsLinkModalOpen(true);
                            }}
                            className="rounded-full p-1.5 text-md3-onSurfaceVariant hover:bg-md3-surfaceContainerHigh"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDb(deleteItemWithoutCount(db, item.id))}
                            className="rounded-full p-1.5 text-red-600 hover:bg-red-50"
                            title="Excluir sem contabilizar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba Links e Mídias */}
        {activeTab === 'links_media' && (
          <LinksMediaView
            items={scopedActiveItems}
            folders={scopedFolders}
            onMoveItem={(itemId, folderId) => setDb(moveItemToFolder(db, itemId, folderId))}
            onCreateSubfolderAndMove={(itemId, parentId, name) => {
              const { db: withFolder, folder } = createFolder(
                db,
                name,
                parentId,
                isPrivateSpace
              );
              setDb(moveItemToFolder(withFolder, itemId, folder.id));
            }}
            onRequestSeen={(item) => setSeenTargetItem(item)}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsLinkModalOpen(true);
            }}
            onDeleteItem={(itemId) => setDb(deleteItemWithoutCount(db, itemId))}
          />
        )}

        {/* Aba Tarefas (Estudo + TNE em tempo real) */}
        {activeTab === 'tasks' && (
          <TasksView
            tasks={scopedTasks}
            onAddTask={(title, isTne, dueDate) =>
              setDb(addTask(db, title, isTne, isPrivateSpace, dueDate))
            }
            onToggleComplete={(taskId) => setDb(toggleTaskComplete(db, taskId))}
            onPostpone={(taskId) => setDb(postponeTask(db, taskId))}
            onDelete={(taskId) => setDb(deleteTask(db, taskId))}
          />
        )}

        {/* Aba Histórico */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4">
              <h2 className="text-lg font-semibold text-md3-onSurface">
                Histórico de Conteúdos Consumidos ({scopedHistoryItems.length})
              </h2>
              <p className="text-xs text-md3-onSurfaceVariant">
                Itens marcados como &quot;Visto&quot; que você optou por manter salvos para consulta.
              </p>
            </div>
            {scopedHistoryItems.length === 0 ? (
              <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-10 text-center text-sm text-md3-onSurfaceVariant">
                Nenhum item salvo no Histórico ainda.
              </div>
            ) : (
              <div className="space-y-2.5">
                {scopedHistoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="md3-card p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-md3-onSurface hover:text-md3-primary inline-flex items-center gap-1.5"
                      >
                        <span className="truncate">{item.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                      <p className="text-xs text-md3-onSurfaceVariant mt-0.5">
                        Tema: {item.themeName || 'Geral'} • Visto em{' '}
                        {item.lastSeenAt
                          ? new Date(item.lastSeenAt).toLocaleDateString('pt-BR')
                          : '-'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDb(deleteItemWithoutCount(db, item.id))}
                      className="rounded-full p-2 text-red-600 hover:bg-red-50"
                      title="Remover do Histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba Relatórios Inteligentes */}
        {activeTab === 'reports' && (
          <ReportsView
            items={db.items}
            tasks={db.tasks}
            consumptionLogs={db.consumptionLogs}
            hasPrivateVault={db.privateConfig.enabled}
          />
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
        historyItems={[...scopedActiveItems, ...scopedHistoryItems]}
        defaultFolderId={selectedFolderId}
        isPrivateMode={isPrivateSpace}
        editingItem={editingItem}
        onSave={(payload) => setDb(addOrUpdateItem(db, payload))}
      />

      {/* Modal de Confirmação "Visto" -> Histórico vs. Excluir */}
      <SeenConfirmModal
        item={seenTargetItem}
        onClose={() => setSeenTargetItem(null)}
        onConfirm={(itemId, keepInHistory) =>
          setDb(markItemAsSeen(db, itemId, keepInHistory))
        }
      />
    </div>
  );
}
