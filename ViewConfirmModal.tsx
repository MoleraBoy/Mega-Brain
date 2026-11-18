'use client';

import React from 'react';
import { CheckCircle2, History, Trash2, X } from 'lucide-react';
import { LinkItem } from '@/lib/types';

interface Props {
  link: LinkItem | null;
  onClose: () => void;
  onConfirm: (link: LinkItem, keepInHistory: boolean) => void;
}

export function ViewConfirmModal({ link, onClose, onConfirm }: Props) {
  if (!link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-md3-xl bg-white p-6 shadow-2xl border border-md3-outlineVariant">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Conteúdo Visto!</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-md3-surfaceContainer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-800 mb-2 font-medium line-clamp-2">{link.title}</p>
        <p className="text-sm text-gray-600 mb-5">
          Deseja manter este link guardado no seu <strong>Histórico</strong>?
          Se clicar em <strong>Sim</strong>, ele vai para o espaço de links vistos que você quis guardar. Se clicar em <strong>Não</strong>, ele será apagado — e em ambos os casos entrará no relatório como visitado de fato.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onConfirm(link, true)}
            className="flex items-center justify-center gap-2 rounded-md3-full bg-md3-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 transition"
          >
            <History className="w-4 h-4" />
            Sim, guardar no Histórico
          </button>
          <button
            onClick={() => onConfirm(link, false)}
            className="flex items-center justify-center gap-2 rounded-md3-full bg-md3-surfaceContainerHigh px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            Não, apagar link
          </button>
        </div>
      </div>
    </div>
  );
}
