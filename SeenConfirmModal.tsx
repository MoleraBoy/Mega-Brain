'use client';

import React from 'react';
import { CheckCircle2, Archive, Trash2, X } from 'lucide-react';
import { BrainItem } from '@/lib/types';

interface SeenConfirmModalProps {
  item: BrainItem | null;
  onClose: () => void;
  onConfirm: (itemId: string, keepInHistory: boolean) => void;
}

export default function SeenConfirmModal({
  item,
  onClose,
  onConfirm
}: SeenConfirmModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-md3-xl bg-md3-surfaceContainerLowest p-6 shadow-xl border border-md3-outlineVariant space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-md3-primary">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-semibold text-md3-onSurface">
              Confirmar Consumo (&quot;Visto&quot;)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-md3-onSurfaceVariant hover:bg-md3-surfaceContainerHigh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-md3-onSurface">
          Você concluiu <strong>{item.title}</strong>. Deseja manter este item salvo no seu{' '}
          <strong>Histórico</strong>?
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onConfirm(item.id, true);
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md3-full bg-md3-primary py-2.5 text-sm font-medium text-md3-onPrimary hover:opacity-95"
          >
            <Archive className="w-4 h-4" /> Sim, mover para o Histórico
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm(item.id, false);
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md3-full bg-md3-secondaryContainer py-2.5 text-sm font-medium text-md3-onSecondaryContainer hover:opacity-90"
          >
            <Trash2 className="w-4 h-4" /> Não, apagar link (mas registrar visita)
          </button>
        </div>
      </div>
    </div>
  );
}
