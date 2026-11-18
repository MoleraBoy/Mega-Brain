'use client';

import React from 'react';
import { Archive, Trash2, X } from 'lucide-react';

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  entityLabel: string;
  entityTitle: string;
  description: string;
  onConfirmKeepHistory: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}

export default function SeenConfirmModal({
  isOpen,
  entityLabel,
  entityTitle,
  description,
  onConfirmKeepHistory,
  onConfirmDelete,
  onCancel
}: ArchiveConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-md3-xl bg-md3-surfaceContainerLowest border border-md3-outlineVariant p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="rounded-md3-full bg-md3-primaryContainer px-3 py-1 text-xs font-semibold text-md3-onPrimaryContainer">
            {entityLabel}
          </span>
          <button type="button" onClick={onCancel} className="p-1 text-md3-onSurfaceVariant">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-md3-onSurface line-clamp-2">
            {entityTitle}
          </h3>
          <p className="text-xs text-md3-onSurfaceVariant leading-relaxed">{description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onConfirmKeepHistory}
            className="inline-flex items-center justify-center gap-1.5 rounded-md3-full bg-md3-primary px-4 py-2.5 text-xs font-semibold text-md3-onPrimary hover:opacity-95"
          >
            <Archive className="w-4 h-4" /> Sim, guardar no Histórico
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="inline-flex items-center justify-center gap-1.5 rounded-md3-full border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            <Trash2 className="w-4 h-4" /> Não, apagar agora
          </button>
        </div>
      </div>
    </div>
  );
}
