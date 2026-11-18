'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, X, Loader2, Tag, Folder as FolderIcon, BookOpen, Wrench } from 'lucide-react';
import { BrainItem, Folder, MediaType } from '@/lib/types';
import { getFolderFullPath, isFolderInsideStudyTree } from '@/lib/storageEngine';
import { classifyContentRealtime } from '@/lib/tneClassifier';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  historyItems: BrainItem[];
  defaultFolderId: string | null;
  isPrivateMode: boolean;
  editingItem?: BrainItem | null;
  onSave: (payload: {
    id?: string;
    folderId: string | null;
    themeName: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    mediaType: MediaType;
    whatIs: string;
    whySaved: string;
    tags: string[];
    isStudy: boolean;
    isTne: boolean;
    isPrivate: boolean;
    dueDate?: string;
  }) => void;
}

export default function LinkModal({
  isOpen,
  onClose,
  folders,
  historyItems,
  defaultFolderId,
  isPrivateMode,
  editingItem,
  onSave
}: LinkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('article');
  const [themeName, setThemeName] = useState('');
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId);
  const [whatIs, setWhatIs] = useState('');
  const [whySaved, setWhySaved] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isStudy, setIsStudy] = useState(false);
  const [manualTne, setManualTne] = useState<boolean | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const activeFolders = folders.filter((f) => f.status === 'active');

  useEffect(() => {
    if (editingItem) {
      setUrl(editingItem.url);
      setTitle(editingItem.title);
      setThumbnailUrl(editingItem.thumbnailUrl);
      setMediaType(editingItem.mediaType);
      setThemeName(editingItem.themeName);
      setFolderId(editingItem.folderId);
      setWhatIs(editingItem.whatIs);
      setWhySaved(editingItem.whySaved);
      setTagsInput(editingItem.tags.join(', '));
      setDueDate(editingItem.dueDate || '');
      setIsStudy(editingItem.isStudy);
      setManualTne(editingItem.isTne);
    } else {
      setUrl('');
      setTitle('');
      setThumbnailUrl('');
      setMediaType('article');
      setThemeName('');
      setFolderId(defaultFolderId);
      setWhatIs('');
      setWhySaved('');
      setTagsInput('');
      setDueDate('');
      setIsStudy(isFolderInsideStudyTree(activeFolders, defaultFolderId));
      setManualTne(null);
    }
  }, [editingItem, defaultFolderId, isOpen]);

  if (!isOpen) return null;

  const inStudyFolder = isFolderInsideStudyTree(activeFolders, folderId);
  const realtimeCheck = classifyContentRealtime(`${title} ${whatIs} ${whySaved}`, inStudyFolder);
  const effectiveTne = manualTne !== null ? manualTne : inStudyFolder ? realtimeCheck.isTne : !isStudy;

  async function handleAutoAnalyze(targetUrl: string) {
    if (!targetUrl.startsWith('http')) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          history: historyItems.slice(0, 50).map((i) => ({
            title: i.title,
            tags: i.tags,
            themeName: i.themeName,
            whatIs: i.whatIs,
            whySaved: i.whySaved,
            folderId: i.folderId,
            isStudy: i.isStudy
          }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title && !title) setTitle(data.title);
        if (data.thumbnailUrl && !thumbnailUrl) setThumbnailUrl(data.thumbnailUrl);
        if (data.mediaType) setMediaType(data.mediaType);
        if (data.themeName && !themeName) setThemeName(data.themeName);
        if (data.folderId && !folderId) setFolderId(data.folderId);
        if (data.whatIs && !whatIs) setWhatIs(data.whatIs);
        if (data.whySaved && !whySaved) setWhySaved(data.whySaved);
        if (Array.isArray(data.tags) && data.tags.length > 0 && !tagsInput) {
          setTagsInput(data.tags.join(', '));
        }
        if (typeof data.isStudy === 'boolean') {
          setIsStudy(data.isStudy);
        }
      }
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onSave({
      id: editingItem?.id,
      folderId,
      themeName: themeName.trim() || 'Geral',
      url: url.trim(),
      title: title.trim() || url.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      mediaType,
      whatIs: whatIs.trim(),
      whySaved: whySaved.trim(),
      tags,
      isStudy: effectiveTne ? false : isStudy || inStudyFolder,
      isTne: effectiveTne,
      isPrivate: editingItem ? editingItem.isPrivate : isPrivateMode,
      dueDate: dueDate || undefined
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-md3-xl bg-md3-surfaceContainerLowest border border-md3-outlineVariant p-6 shadow-xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-md3-outlineVariant pb-3">
          <h3 className="text-base font-semibold text-md3-onSurface">
            {editingItem ? 'Editar Link / Mídia' : 'Novo Link ou Mídia (Aprendizado Contínuo)'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-md3-onSurfaceVariant">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-md3-onSurfaceVariant mb-1">URL do Link / Mídia *</label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={(e) => {
                  if (!editingItem && e.target.value) handleAutoAnalyze(e.target.value);
                }}
                className="flex-1 rounded-md3-md border border-md3-outline px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={analyzing || !url}
                onClick={() => handleAutoAnalyze(url)}
                className="inline-flex items-center gap-1.5 rounded-md3-full bg-md3-secondaryContainer px-3.5 py-2 font-medium text-md3-onSecondaryContainer hover:opacity-90 disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Auto-Preencher
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-md3-onSurfaceVariant mb-1">Título</label>
              <input
                type="text"
                placeholder="Título do conteúdo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium text-md3-onSurfaceVariant mb-1">Tipo de Mídia</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-2"
              >
                <option value="article">Artigo / Leitura</option>
                <option value="video">Vídeo</option>
                <option value="document">Documento / PDF</option>
                <option value="tool">Ferramenta / Site</option>
                <option value="image">Imagem / Referência</option>
                <option value="audio">Áudio / Podcast</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-md3-onSurfaceVariant mb-1">Tema / Assunto</label>
              <input
                type="text"
                placeholder="Ex: React, Design, Finanças..."
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline px-3 py-2"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 font-medium text-md3-onSurfaceVariant mb-1">
                <FolderIcon className="w-3.5 h-3.5" /> Pasta / Subpasta
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setFolderId(val);
                  if (isFolderInsideStudyTree(activeFolders, val)) {
                    setIsStudy(true);
                  }
                }}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-2"
              >
                <option value="">Raiz (Sem Pasta)</option>
                {activeFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {getFolderFullPath(activeFolders, f.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-md3-onSurfaceVariant mb-1">
              O que é? (Aprendido com seu padrão)
            </label>
            <input
              type="text"
              placeholder="Resumo objetivo do que se trata este link"
              value={whatIs}
              onChange={(e) => setWhatIs(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium text-md3-onSurfaceVariant mb-1">
              Por que salvei?
            </label>
            <input
              type="text"
              placeholder="Qual problema resolve ou onde pretende aplicar"
              value={whySaved}
              onChange={(e) => setWhySaved(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 font-medium text-md3-onSurfaceVariant mb-1">
                <Tag className="w-3.5 h-3.5" /> Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="ex: react, tutorial, referencia"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium text-md3-onSurfaceVariant mb-1">
                Data para lembrar (vazio = toda quarta-feira)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-md3-onSurfaceVariant mb-1">
              URL da Miniatura / Thumbnail (opcional)
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline px-3 py-2"
            />
          </div>

          {/* Classificação Estudo vs TNE */}
          <div className="rounded-md3-md bg-md3-surfaceContainerLow p-3 border border-md3-outlineVariant space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStudy || inStudyFolder}
                  onChange={(e) => {
                    setIsStudy(e.target.checked);
                    setManualTne(null);
                  }}
                />
                <BookOpen className="w-3.5 h-3.5 text-md3-primary" />
                <span>Vincular a Estudos</span>
              </label>

              <button
                type="button"
                onClick={() => setManualTne(!effectiveTne)}
                className={`inline-flex items-center gap-1 rounded-md3-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  effectiveTne
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                }`}
              >
                {effectiveTne ? (
                  <>
                    <Wrench className="w-3 h-3" /> Marcado como TNE (Clique p/ Estudo)
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3 h-3" /> Matéria de Estudo (Clique p/ TNE)
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-md3-onSurfaceVariant">{realtimeCheck.reason}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md3-full px-4 py-2 font-medium text-md3-onSurfaceVariant hover:bg-md3-surfaceContainerHigh"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md3-full bg-md3-primary px-5 py-2 font-medium text-md3-onPrimary hover:opacity-95"
            >
              Salvar no Mega Brain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
