'use client';

import React from 'react';
import { CalendarClock, ExternalLink, Clock, Folder as FolderIcon, Tag, X, Lock } from 'lucide-react';
import { BrainItem, BrainTask, Folder } from '@/lib/types';
import { getFolderFullPath } from '@/lib/storageEngine';

interface WednesdayReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BrainItem[];
  tasks: BrainTask[];
  folders: Folder[];
  hasPrivateVault: boolean;
  includePrivate: boolean;
  onToggleIncludePrivate: (val: boolean) => void;
  onViewItemNow: (item: BrainItem) => void;
  onSnoozeToNextWednesday: (kind: 'item' | 'task', id: string) => void;
  onCompleteTaskNow: (task: BrainTask) => void;
}

export default function WednesdayReviewModal({
  isOpen,
  onClose,
  items,
  tasks,
  folders,
  hasPrivateVault,
  includePrivate,
  onToggleIncludePrivate,
  onViewItemNow,
  onSnoozeToNextWednesday,
  onCompleteTaskNow
}: WednesdayReviewModalProps) {
  if (!isOpen) return null;

  const totalCount = items.length + tasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-md3-xl bg-md3-surfaceContainerLowest border border-md3-outlineVariant p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-start justify-between gap-3 border-b border-md3-outlineVariant pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full bg-md3-primaryContainer p-2.5 text-md3-primary">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-md3-onSurface">
                Revisão Semanal de Quarta-feira (Itens Sem Data)
              </h3>
              <p className="text-xs text-md3-onSurfaceVariant">
                Resumo dos temas, tags e pastas salvos sem prazo definido. Escolha o que ver agora ou adie para a próxima quarta.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-md3-onSurfaceVariant">
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasPrivateVault && (
          <label className="flex items-center justify-between rounded-md3-md bg-md3-surfaceContainerLow px-3.5 py-2 text-xs border border-md3-outlineVariant cursor-pointer">
            <span className="inline-flex items-center gap-1.5 font-medium text-md3-onSurface">
              <Lock className="w-3.5 h-3.5 text-md3-primary" />
              Incluir itens do Espaço Privado no lembrete de quarta-feira
            </span>
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={(e) => onToggleIncludePrivate(e.target.checked)}
              className="accent-md3-primary"
            />
          </label>
        )}

        {totalCount === 0 ? (
          <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-8 text-center text-xs text-md3-onSurfaceVariant">
            Nenhum item ou tarefa sem data pendente para esta quarta-feira!
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-md3-lg border border-md3-outlineVariant bg-md3-surface p-3.5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded-md3-full bg-md3-secondaryContainer px-2.5 py-0.5 font-semibold text-md3-onSecondaryContainer">
                      Tema: {item.themeName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-md3-onSurfaceVariant">
                      <FolderIcon className="w-3 h-3 text-md3-primary" />
                      {getFolderFullPath(folders, item.folderId)}
                    </span>
                  </div>
                  {item.isPrivate && (
                    <span className="rounded-md3-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-900">
                      Privado
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-md3-onSurface">{item.title}</p>

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded bg-md3-surfaceContainerHigh px-2 py-0.5 text-[10px] text-md3-onSurfaceVariant"
                      >
                        <Tag className="w-2.5 h-2.5" /> #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSnoozeToNextWednesday('item', item.id)}
                    className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline px-3 py-1 text-xs font-medium hover:bg-md3-surfaceContainerHigh"
                  >
                    <Clock className="w-3.5 h-3.5" /> Adiar p/ próxima quarta
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewItemNow(item)}
                    className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primary px-3.5 py-1 text-xs font-semibold text-md3-onPrimary hover:opacity-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver Agora
                  </button>
                </div>
              </div>
            ))}

            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md3-lg border border-md3-outlineVariant bg-md3-surface p-3.5 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-md3-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-900">
                    Tarefa sem data
                  </span>
                  <span className="inline-flex items-center gap-1 text-md3-onSurfaceVariant">
                    <FolderIcon className="w-3 h-3 text-md3-primary" />
                    {getFolderFullPath(folders, task.folderId)}
                  </span>
                </div>

                <p className="text-sm font-semibold text-md3-onSurface">{task.title}</p>

                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded bg-md3-surfaceContainerHigh px-2 py-0.5 text-[10px] text-md3-onSurfaceVariant"
                      >
                        <Tag className="w-2.5 h-2.5" /> #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSnoozeToNextWednesday('task', task.id)}
                    className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline px-3 py-1 text-xs font-medium hover:bg-md3-surfaceContainerHigh"
                  >
                    <Clock className="w-3.5 h-3.5" /> Adiar p/ próxima quarta
                  </button>
                  <button
                    type="button"
                    onClick={() => onCompleteTaskNow(task)}
                    className="inline-flex items-center gap-1 rounded-md3-full bg-emerald-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Resolver Agora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
