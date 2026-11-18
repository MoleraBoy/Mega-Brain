'use client';

import React, { useState } from 'react';
import {
  Folder as FolderIcon,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { Folder } from '@/lib/types';

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null, isStudyFolder: boolean) => void;
  onCompleteFolder: (folder: Folder) => void;
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onCompleteFolder
}: FolderTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creatingParentId, setCreatingParentId] = useState<string | null | 'ROOT'>(null);
  const [newName, setNewName] = useState('');
  const [newIsStudy, setNewIsStudy] = useState(false);

  const activeFolders = folders
    .filter((f) => f.status === 'active')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  function handleCreateSubmit(e: React.FormEvent, parentId: string | null) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateFolder(newName.trim(), parentId, newIsStudy);
    setNewName('');
    setNewIsStudy(false);
    setCreatingParentId(null);
    if (parentId) {
      setExpanded((prev) => ({ ...prev, [parentId]: true }));
    }
  }

  function renderBranch(parentId: string | null, depth: number) {
    const children = activeFolders.filter((f) => f.parentId === parentId);
    if (children.length === 0 && creatingParentId !== parentId) return null;

    return (
      <div className={depth > 0 ? 'ml-3.5 border-l border-md3-outlineVariant pl-2 space-y-1' : 'space-y-1'}>
        {children.map((folder) => {
          const hasSub = activeFolders.some((f) => f.parentId === folder.id);
          const isOpen = expanded[folder.id] ?? true;
          const isSelected = selectedFolderId === folder.id;

          return (
            <div key={folder.id} className="space-y-1">
              <div
                className={`group flex items-center justify-between rounded-md3-md px-2.5 py-1.5 text-xs transition ${
                  isSelected
                    ? 'bg-md3-secondaryContainer text-md3-onSecondaryContainer font-semibold'
                    : 'hover:bg-md3-surfaceContainerHigh text-md3-onSurface'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => ({ ...p, [folder.id]: !isOpen }))}
                    className="p-0.5 text-md3-onSurfaceVariant hover:text-md3-onSurface"
                    title="Expandir/Recolher"
                  >
                    {hasSub ? (
                      isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )
                    ) : (
                      <span className="inline-block w-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center gap-1.5 truncate text-left flex-1"
                  >
                    <FolderIcon className="w-3.5 h-3.5 shrink-0 text-md3-primary" />
                    <span className="truncate">{folder.name}</span>
                    {folder.isStudyFolder && (
                      <span
                        title="Pasta de Estudos"
                        className="inline-flex items-center rounded bg-md3-primaryContainer px-1 py-0.5 text-[10px] text-md3-onPrimaryContainer"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingParentId(folder.id);
                      setNewName('');
                      setNewIsStudy(folder.isStudyFolder);
                    }}
                    title="Criar subpasta aqui dentro"
                    className="rounded p-1 hover:bg-md3-surface text-md3-primary"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onCompleteFolder(folder)}
                    title="Concluir pasta (salvar no Histórico ou excluir)"
                    className="rounded p-1 hover:bg-md3-surface text-emerald-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {creatingParentId === folder.id && (
                <form
                  onSubmit={(e) => handleCreateSubmit(e, folder.id)}
                  className="ml-5 rounded-md3-md border border-md3-primary bg-md3-surface p-2 space-y-1.5"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nome da subpasta..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded border border-md3-outline px-2 py-1 text-xs"
                  />
                  <label className="flex items-center gap-1.5 text-[11px] text-md3-onSurfaceVariant">
                    <input
                      type="checkbox"
                      checked={newIsStudy}
                      onChange={(e) => setNewIsStudy(e.target.checked)}
                    />
                    Pasta de Estudos
                  </label>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setCreatingParentId(null)}
                      className="px-2 py-0.5 text-[11px] text-md3-onSurfaceVariant"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-md3-full bg-md3-primary px-2.5 py-0.5 text-[11px] font-medium text-md3-onPrimary"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              )}

              {isOpen && renderBranch(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-md3-lg border border-md3-outlineVariant bg-md3-surfaceContainerLow p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-md3-onSurfaceVariant">
          Pastas & Subpastas
        </span>
        <button
          type="button"
          onClick={() => {
            setCreatingParentId('ROOT');
            setNewName('');
            setNewIsStudy(false);
          }}
          className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primaryContainer px-2.5 py-1 text-[11px] font-medium text-md3-onPrimaryContainer hover:opacity-90"
        >
          <FolderPlus className="w-3 h-3" /> Nova Pasta
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelectFolder(null)}
        className={`w-full flex items-center gap-2 rounded-md3-md px-2.5 py-1.5 text-xs text-left transition ${
          selectedFolderId === null
            ? 'bg-md3-secondaryContainer text-md3-onSecondaryContainer font-semibold'
            : 'hover:bg-md3-surfaceContainerHigh text-md3-onSurface'
        }`}
      >
        <FolderIcon className="w-3.5 h-3.5 text-md3-primary" />
        <span>Todas as Pastas (Início)</span>
      </button>

      {creatingParentId === 'ROOT' && (
        <form
          onSubmit={(e) => handleCreateSubmit(e, null)}
          className="rounded-md3-md border border-md3-primary bg-md3-surface p-2 space-y-1.5"
        >
          <input
            type="text"
            autoFocus
            placeholder="Nome da pasta raiz..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded border border-md3-outline px-2 py-1 text-xs"
          />
          <label className="flex items-center gap-1.5 text-[11px] text-md3-onSurfaceVariant">
            <input
              type="checkbox"
              checked={newIsStudy}
              onChange={(e) => setNewIsStudy(e.target.checked)}
            />
            Marcar como Pasta de Estudos
          </label>
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setCreatingParentId(null)}
              className="px-2 py-0.5 text-[11px] text-md3-onSurfaceVariant"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md3-full bg-md3-primary px-2.5 py-0.5 text-[11px] font-medium text-md3-onPrimary"
            >
              Criar
            </button>
          </div>
        </form>
      )}

      {renderBranch(null, 0)}
    </div>
  );
}
