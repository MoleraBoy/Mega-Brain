'use client';

import React, { useState } from 'react';
import { Folder as FolderIcon, FolderPlus, ChevronRight, Home } from 'lucide-react';
import { Folder } from '@/lib/types';

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder
}: FolderTreeProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingInsideSelected, setCreatingInsideSelected] = useState(false);

  // Constrói breadcrumb recursivo da pasta selecionada até a raiz
  const breadcrumb: Folder[] = [];
  let cursor = selectedFolderId;
  const visited = new Set<string>();
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const f = folders.find((item) => item.id === cursor);
    if (!f) break;
    breadcrumb.unshift(f);
    cursor = f.parentId;
  }

  const currentChildren = folders.filter((f) => f.parentId === selectedFolderId);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), creatingInsideSelected ? selectedFolderId : null);
    setNewFolderName('');
    setCreatingInsideSelected(false);
  }

  return (
    <div className="rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4 space-y-4">
      {/* Navegação por Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => onSelectFolder(null)}
          className={`inline-flex items-center gap-1 rounded-md3-full px-2.5 py-1 font-medium transition ${
            selectedFolderId === null
              ? 'bg-md3-primary text-md3-onPrimary'
              : 'bg-md3-surfaceContainerHigh text-md3-onSurface hover:bg-md3-secondaryContainer'
          }`}
        >
          <Home className="w-3.5 h-3.5" /> Raiz
        </button>

        {breadcrumb.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3.5 h-3.5 text-md3-onSurfaceVariant" />
            <button
              onClick={() => onSelectFolder(crumb.id)}
              className={`rounded-md3-full px-2.5 py-1 font-medium transition ${
                selectedFolderId === crumb.id
                  ? 'bg-md3-primary text-md3-onPrimary'
                  : 'bg-md3-surfaceContainerHigh text-md3-onSurface hover:bg-md3-secondaryContainer'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Subpastas do nível atual */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-md3-onSurfaceVariant">
            {selectedFolderId ? 'Subpastas deste nível' : 'Pastas Principais'}
          </span>
          <button
            type="button"
            onClick={() => setCreatingInsideSelected((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-md3-primary hover:underline"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            {selectedFolderId ? 'Nova Subpasta Aqui' : 'Nova Pasta'}
          </button>
        </div>

        {currentChildren.length === 0 ? (
          <p className="text-xs text-md3-onSurfaceVariant italic py-2">
            Nenhuma subpasta neste nível.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentChildren.map((folder) => {
              const subCount = folders.filter((f) => f.parentId === folder.id).length;
              return (
                <button
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className="flex items-center justify-between rounded-md3-md border border-md3-outlineVariant bg-md3-surfaceContainerLowest px-3.5 py-2.5 text-left hover:bg-md3-secondaryContainer/40 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FolderIcon className="w-4 h-4 shrink-0 text-md3-primary" />
                    <span className="text-sm font-medium truncate text-md3-onSurface">
                      {folder.name}
                    </span>
                  </div>
                  {subCount > 0 && (
                    <span className="ml-2 rounded-full bg-md3-primaryContainer px-2 py-0.5 text-[11px] font-semibold text-md3-onPrimaryContainer">
                      +{subCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulário inline para criar pasta ou subpasta */}
      {creatingInsideSelected && (
        <form onSubmit={handleAdd} className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder={
              selectedFolderId
                ? 'Nome da nova subpasta...'
                : 'Nome da nova pasta raiz...'
            }
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-1.5 text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md3-full bg-md3-primary px-4 py-1.5 text-xs font-medium text-md3-onPrimary"
          >
            Criar
          </button>
        </form>
      )}
    </div>
  );
}
