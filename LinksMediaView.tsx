'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  FolderInput,
  FolderPlus,
  CheckCircle2,
  Trash2,
  Edit3,
  BookOpen
} from 'lucide-react';
import { BrainItem, Folder } from '@/lib/types';
import { getFolderFullPath } from '@/lib/storageEngine';

interface LinksMediaViewProps {
  items: BrainItem[];
  folders: Folder[];
  onMoveItem: (itemId: string, targetFolderId: string | null) => void;
  onCreateSubfolderAndMove: (itemId: string, parentFolderId: string | null, name: string) => void;
  onRequestSeen: (item: BrainItem) => void;
  onEditItem: (item: BrainItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export default function LinksMediaView({
  items,
  folders,
  onMoveItem,
  onCreateSubfolderAndMove,
  onRequestSeen,
  onEditItem,
  onDeleteItem
}: LinksMediaViewProps) {
  const [creatingForItemId, setCreatingForItemId] = useState<string | null>(null);
  const [newSubfolderName, setNewSubfolderName] = useState('');

  return (
    <div className="space-y-4">
      <div className="rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4">
        <h2 className="text-lg font-semibold text-md3-onSurface">
          Todos os Links e Mídias ({items.length})
        </h2>
        <p className="text-xs text-md3-onSurfaceVariant">
          Visualize o caminho completo de cada item e mova livremente entre pastas e subpastas (ou crie uma subpasta na hora).
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-10 text-center text-sm text-md3-onSurfaceVariant">
          Nenhum link ou mídia ativo neste espaço.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const fullPath = getFolderFullPath(folders, item.folderId);
            return (
              <div
                key={item.id}
                className="md3-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primaryContainer px-2.5 py-0.5 text-xs font-medium text-md3-onPrimaryContainer">
                      {fullPath}
                    </span>
                    <span className="rounded-md3-full bg-md3-surfaceContainerHighest px-2.5 py-0.5 text-[11px] font-medium uppercase text-md3-onSurfaceVariant">
                      {item.mediaType}
                    </span>
                    {item.isStudy && (
                      <span className="inline-flex items-center gap-1 rounded-md3-full bg-md3-tertiaryContainer px-2.5 py-0.5 text-xs font-medium text-md3-onTertiaryContainer">
                        <BookOpen className="w-3 h-3" /> Estudo
                      </span>
                    )}
                    {item.themeName && (
                      <span className="text-xs font-medium text-md3-primary">
                        • {item.themeName}
                      </span>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-base font-semibold text-md3-onSurface hover:text-md3-primary"
                  >
                    <span className="truncate">{item.title}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>

                  {item.whatIs && (
                    <p className="text-xs text-md3-onSurfaceVariant line-clamp-2">
                      {item.whatIs}
                    </p>
                  )}
                </div>

                {/* Controles de movimentação rápida + ações */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <FolderInput className="w-4 h-4 text-md3-onSurfaceVariant shrink-0" />
                    <select
                      aria-label="Mover para pasta"
                      value={item.folderId || ''}
                      onChange={(e) => onMoveItem(item.id, e.target.value || null)}
                      className="rounded-md3-md border border-md3-outline bg-md3-surface px-2.5 py-1.5 text-xs max-w-[210px]"
                    >
                      <option value="">Sem Pasta (Raiz)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {getFolderFullPath(folders, f.id)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      title="Criar subpasta na hora e mover"
                      onClick={() => {
                        setCreatingForItemId(
                          creatingForItemId === item.id ? null : item.id
                        );
                        setNewSubfolderName('');
                      }}
                      className="rounded-md3-md border border-md3-outlineVariant bg-md3-surfaceContainerHigh p-1.5 text-md3-primary hover:bg-md3-secondaryContainer"
                    >
                      <FolderPlus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRequestSeen(item)}
                      className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primary px-3 py-1.5 text-xs font-medium text-md3-onPrimary hover:opacity-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Visto
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="rounded-full p-1.5 text-md3-onSurfaceVariant hover:bg-md3-surfaceContainerHigh"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="rounded-full p-1.5 text-red-600 hover:bg-red-50"
                      title="Excluir sem contabilizar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Criação rápida de subpasta inline */}
                {creatingForItemId === item.id && (
                  <div className="w-full lg:w-auto flex items-center gap-2 pt-2 lg:pt-0">
                    <input
                      type="text"
                      placeholder="Nome da nova subpasta..."
                      value={newSubfolderName}
                      onChange={(e) => setNewSubfolderName(e.target.value)}
                      className="rounded-md3-md border border-md3-outline bg-md3-surface px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSubfolderName.trim()) {
                          onCreateSubfolderAndMove(
                            item.id,
                            item.folderId,
                            newSubfolderName.trim()
                          );
                          setCreatingForItemId(null);
                          setNewSubfolderName('');
                        }
                      }}
                      className="rounded-md3-full bg-md3-secondaryContainer px-3 py-1 text-xs font-medium text-md3-onSecondaryContainer"
                    >
                      Criar & Mover
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
