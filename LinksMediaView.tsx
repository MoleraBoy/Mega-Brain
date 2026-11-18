'use client';

import React, { useState } from 'react';
import {
  FolderInput,
  ExternalLink,
  CheckCircle2,
  Trash2,
  FolderPlus,
  Tag,
  BookOpen,
  Wrench
} from 'lucide-react';
import { BrainItem, Folder } from '@/lib/types';
import { getFolderFullPath } from '@/lib/storageEngine';

interface LinksMediaViewProps {
  items: BrainItem[];
  folders: Folder[];
  onMoveItem: (itemId: string, targetFolderId: string | null) => void;
  onCreateSubfolder: (name: string, parentId: string | null) => void;
  onTriggerSeen: (item: BrainItem) => void;
  onDelete: (itemId: string) => void;
}

export default function LinksMediaView({
  items,
  folders,
  onMoveItem,
  onCreateSubfolder,
  onTriggerSeen,
  onDelete
}: LinksMediaViewProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [quickFolderName, setQuickFolderName] = useState('');
  const [quickParentId, setQuickParentId] = useState<string | null>(null);

  const activeFolders = folders.filter((f) => f.status === 'active');
  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).sort();

  const filtered = items.filter((item) => {
    const matchesQuery =
      !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.themeName.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || item.tags.includes(selectedTag);
    return matchesQuery && matchesTag;
  });

  function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!quickFolderName.trim()) return;
    onCreateSubfolder(quickFolderName.trim(), quickParentId);
    setQuickFolderName('');
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md3-lg border border-md3-outlineVariant bg-md3-surfaceContainerLow p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por título, tema ou URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
          />
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-2 text-sm"
          >
            <option value="">Todas as Tags ({allTags.length})</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>

        {/* Criação rápida de pasta/subpasta para reorganização */}
        <form onSubmit={handleQuickCreate} className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-medium text-md3-onSurfaceVariant inline-flex items-center gap-1">
            <FolderPlus className="w-3.5 h-3.5 text-md3-primary" /> Criar destino rápido:
          </span>
          <input
            type="text"
            placeholder="Nova pasta ou subpasta..."
            value={quickFolderName}
            onChange={(e) => setQuickFolderName(e.target.value)}
            className="rounded-md3-md border border-md3-outline bg-md3-surface px-2.5 py-1.5"
          />
          <select
            value={quickParentId || ''}
            onChange={(e) => setQuickParentId(e.target.value || null)}
            className="rounded-md3-md border border-md3-outline bg-md3-surface px-2.5 py-1.5"
          >
            <option value="">Na Raiz</option>
            {activeFolders.map((f) => (
              <option key={f.id} value={f.id}>
                Dentro de: {getFolderFullPath(activeFolders, f.id)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md3-full bg-md3-primaryContainer px-3 py-1.5 font-medium text-md3-onPrimaryContainer"
          >
            Criar Pasta
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-8 text-center text-sm text-md3-onSurfaceVariant">
            Nenhum link ou mídia encontrado com os filtros atuais.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="md3-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-14 h-14 rounded-md3-md object-cover border border-md3-outlineVariant shrink-0 bg-md3-surfaceContainer"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md3-full bg-md3-secondaryContainer px-2.5 py-0.5 text-[11px] font-medium text-md3-onSecondaryContainer">
                      {item.themeName}
                    </span>
                    <span className="text-[11px] uppercase font-semibold text-md3-primary">
                      {item.mediaType}
                    </span>
                    {item.isStudy && !item.isTne && (
                      <span className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primaryContainer px-2 py-0.5 text-[10px] font-semibold text-md3-onPrimaryContainer">
                        <BookOpen className="w-3 h-3" /> Estudo
                      </span>
                    )}
                    {item.isTne && (
                      <span className="inline-flex items-center gap-1 rounded-md3-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                        <Wrench className="w-3 h-3" /> TNE
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm text-md3-onSurface truncate">{item.title}</h4>
                  <p className="text-xs text-md3-onSurfaceVariant line-clamp-1">{item.whatIs}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded-md3-sm bg-md3-surfaceContainerHigh px-2 py-0.5 text-[11px] text-md3-onSurfaceVariant"
                      >
                        <Tag className="w-2.5 h-2.5" /> #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seletor de Pasta/Subpasta para mover livremente */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 rounded-md3-md border border-md3-outline bg-md3-surfaceContainerLow px-2.5 py-1.5 text-xs">
                  <FolderInput className="w-4 h-4 text-md3-primary shrink-0" />
                  <select
                    aria-label="Mover para pasta"
                    value={item.folderId || ''}
                    onChange={(e) => onMoveItem(item.id, e.target.value || null)}
                    className="bg-transparent font-medium text-md3-onSurface max-w-[210px]"
                  >
                    <option value="">Raiz (Sem Pasta)</option>
                    {activeFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {getFolderFullPath(activeFolders, f.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline px-3 py-1.5 text-xs font-medium hover:bg-md3-surfaceContainerHigh"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => onTriggerSeen(item)}
                    className="inline-flex items-center gap-1 rounded-md3-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Visto
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    title="Excluir sem contabilizar visita"
                    className="rounded-md3-full p-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
