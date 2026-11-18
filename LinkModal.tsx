'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, X, Loader2, Tag, Folder as FolderIcon, BookOpen } from 'lucide-react';
import { BrainItem, Folder, MediaType } from '@/lib/types';
import { getFolderFullPath } from '@/lib/storageEngine';

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
    isPrivate: boolean;
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
  const [isStudy, setIsStudy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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
      setIsStudy(editingItem.isStudy);
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
      setIsStudy(false);
    }
  }, [editingItem, defaultFolderId, isOpen]);

  if (!isOpen) return null;

  async function handleAutoAnalyze(targetUrl: string) {
    if (!targetUrl.startsWith('http')) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          history: historyItems.slice(0, 40).map((i) => ({
            title: i.title,
            tags: i.tags,
            themeName: i.themeName,
            whatIs: i.whatIs,
            whySaved: i.whySaved,
            folderId: i.folderId
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
      }
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      id: editingItem?.id,
      folderId,
      themeName,
      url,
      title: title || url,
      thumbnailUrl,
      mediaType,
      whatIs,
      whySaved,
      tags: parsedTags,
      isStudy,
      isPrivate: isPrivateMode
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md3-xl bg-md3-surfaceContainerLowest p-6 shadow-xl border border-md3-outlineVariant">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-md3-onSurface">
              {editingItem ? 'Editar Link / Mídia' : 'Novo Link ou Mídia'}
            </h2>
            <p className="text-xs text-md3-onSurfaceVariant">
              Cole a URL para análise automática baseada no seu histórico de tags e temas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-md3-onSurfaceVariant hover:bg-md3-surfaceContainerHigh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
              URL do Conteúdo *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={(e) => !editingItem && handleAutoAnalyze(e.target.value)}
                className="flex-1 rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2.5 text-sm focus:border-md3-primary focus:outline-none"
              />
              <button
                type="button"
                disabled={analyzing || !url}
                onClick={() => handleAutoAnalyze(url)}
                className="inline-flex items-center gap-1.5 rounded-md3-full bg-md3-secondaryContainer px-4 py-2 text-xs font-medium text-md3-onSecondaryContainer hover:opacity-90 disabled:opacity-50"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Analisar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
                Título
              </label>
              <input
                type="text"
                placeholder="Nome do conteúdo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
                Tema (Agrupamento Inteligente)
              </label>
              <input
                type="text"
                placeholder="Ex: Arquitetura de Software"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-md3-onSurfaceVariant mb-1">
                <FolderIcon className="w-3.5 h-3.5" /> Pasta / Subpasta
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
              >
                <option value="">Sem Pasta (Raiz)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {getFolderFullPath(folders, f.id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
                Tipo de Mídia
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
              >
                <option value="article">Artigo / Leitura</option>
                <option value="video">Vídeo</option>
                <option value="document">Documento / PDF</option>
                <option value="tool">Ferramenta / Repositório</option>
                <option value="image">Imagem / Referência Visual</option>
                <option value="audio">Áudio / Podcast</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
              O que é
            </label>
            <textarea
              rows={2}
              placeholder="Resumo objetivo do que este link apresenta..."
              value={whatIs}
              onChange={(e) => setWhatIs(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
              Por que salvei
            </label>
            <textarea
              rows={2}
              placeholder="Intenção prática ou contexto de uso futuro..."
              value={whySaved}
              onChange={(e) => setWhySaved(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-md3-onSurfaceVariant mb-1">
                <Tag className="w-3.5 h-3.5" /> Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="react, arquitetura, ia"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
                URL da Thumbnail (opcional)
              </label>
              <input
                type="url"
                placeholder="https://.../capa.png"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md3-lg bg-md3-surfaceContainer p-3.5">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-md3-primary" />
              <div>
                <p className="text-sm font-medium text-md3-onSurface">Conteúdo de Estudo</p>
                <p className="text-xs text-md3-onSurfaceVariant">
                  Contabiliza nas métricas e relatórios dedicados de aprendizado.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isStudy}
              onChange={(e) => setIsStudy(e.target.checked)}
              className="h-5 w-5 accent-md3-primary rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md3-full px-5 py-2.5 text-sm font-medium text-md3-primary hover:bg-md3-surfaceContainerHigh"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md3-full bg-md3-primary px-6 py-2.5 text-sm font-medium text-md3-onPrimary hover:opacity-95"
            >
              Salvar no Mega Brain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
