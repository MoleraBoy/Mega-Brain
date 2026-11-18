'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Trash2,
  Plus,
  BookOpen,
  Wrench,
  Bell,
  Volume2,
  Vibrate,
  MessageSquare,
  Folder as FolderIcon
} from 'lucide-react';
import { BrainTask, Folder, TaskNotificationMode } from '@/lib/types';
import { classifyContentRealtime } from '@/lib/tneClassifier';
import { getFolderFullPath, isFolderInsideStudyTree } from '@/lib/storageEngine';
import { triggerTaskNotification } from '@/lib/notificationHelper';

interface TasksViewProps {
  tasks: BrainTask[];
  folders: Folder[];
  onAddTask: (payload: {
    title: string;
    folderId: string | null;
    tags: string[];
    isTne: boolean;
    dueDate?: string;
    notificationMode: TaskNotificationMode;
  }) => void;
  onCompleteTaskWithPrompt: (task: BrainTask) => void;
  onPostpone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onShowToast: (msg: string) => void;
}

export default function TasksView({
  tasks,
  folders,
  onAddTask,
  onCompleteTaskWithPrompt,
  onPostpone,
  onDelete,
  onShowToast
}: TasksViewProps) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [manualOverrideTne, setManualOverrideTne] = useState<boolean | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notificationMode, setNotificationMode] = useState<TaskNotificationMode>('sound_vibrate');

  const activeFolders = folders.filter((f) => f.status === 'active');
  const inStudyFolder = isFolderInsideStudyTree(activeFolders, folderId);
  const analysis = classifyContentRealtime(title, inStudyFolder);
  const effectiveIsTne = manualOverrideTne !== null ? manualOverrideTne : analysis.isTne;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onAddTask({
      title: title.trim(),
      folderId,
      tags,
      isTne: effectiveIsTne,
      dueDate: dueDate || undefined,
      notificationMode
    });

    setTitle('');
    setTagsInput('');
    setManualOverrideTne(null);
    setDueDate('');
  }

  function renderNotificationBadge(mode: TaskNotificationMode) {
    if (mode === 'sound_vibrate') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md3-full bg-md3-secondaryContainer px-2 py-0.5 text-[10px] font-medium text-md3-onSecondaryContainer">
          <Volume2 className="w-3 h-3" /> Vibrar + Tocar
        </span>
      );
    }
    if (mode === 'vibrate_only') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md3-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-900">
          <Vibrate className="w-3 h-3" /> Só Vibrar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md3-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-800">
        <MessageSquare className="w-3 h-3" /> Só Popup
      </span>
    );
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4 space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <input
            type="text"
            placeholder="Nova tarefa (ex: Arrumar o site de estudos, Revisar capítulo 3...)"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setManualOverrideTne(null);
            }}
            className="md:col-span-6 rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2.5 text-sm"
          />

          <select
            value={folderId || ''}
            onChange={(e) => setFolderId(e.target.value || null)}
            className="md:col-span-3 rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-2 text-xs"
          >
            <option value="">Sem Pasta (Raiz)</option>
            {activeFolders.map((f) => (
              <option key={f.id} value={f.id}>
                {getFolderFullPath(activeFolders, f.id)}
              </option>
            ))}
          </select>

          <input
            type="date"
            title="Deixe vazio para entrar no resumo automático de toda quarta-feira"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="md:col-span-3 rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-2 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <input
            type="text"
            placeholder="Tags (ex: urgente, site, prova)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="md:col-span-4 rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-2 text-xs"
          />

          {/* Escolha do tipo de notificação na criação */}
          <div className="md:col-span-5 flex items-center gap-2 rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-1.5 text-xs">
            <Bell className="w-3.5 h-3.5 text-md3-primary shrink-0" />
            <span className="text-md3-onSurfaceVariant shrink-0">Notificação:</span>
            <select
              value={notificationMode}
              onChange={(e) => setNotificationMode(e.target.value as TaskNotificationMode)}
              className="flex-1 bg-transparent font-medium text-md3-onSurface"
            >
              <option value="sound_vibrate">Vibrar e Tocar</option>
              <option value="vibrate_only">Só Vibrar</option>
              <option value="popup_only">Só Aparecer o Popup</option>
            </select>
          </div>

          <button
            type="submit"
            className="md:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-md3-full bg-md3-primary px-5 py-2 text-sm font-medium text-md3-onPrimary hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> Criar Tarefa
          </button>
        </div>

        {/* Classificador TNE em tempo real */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-md3-outlineVariant">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md3-full px-2.5 py-0.5 font-semibold ${
                effectiveIsTne
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
              }`}
            >
              {effectiveIsTne ? (
                <>
                  <Wrench className="w-3 h-3" /> TNE (Tarefa que Não é Estudo)
                </>
              ) : (
                <>
                  <BookOpen className="w-3 h-3" /> Tarefa de Estudo
                </>
              )}
            </span>
            <span className="text-md3-onSurfaceVariant">{analysis.reason}</span>
          </div>

          <button
            type="button"
            onClick={() => setManualOverrideTne(!effectiveIsTne)}
            className="text-md3-primary font-semibold hover:underline"
          >
            Alternar Estudo / TNE
          </button>
        </div>
      </form>

      {/* Lista de Tarefas Ativas */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-8 text-center text-sm text-md3-onSurfaceVariant">
            Nenhuma tarefa ativa no momento.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="md3-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {task.isTne ? (
                    <span className="inline-flex items-center gap-1 rounded-md3-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                      <Wrench className="w-3 h-3" /> TNE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md3-full bg-md3-primaryContainer px-2 py-0.5 text-[10px] font-semibold text-md3-onPrimaryContainer">
                      <BookOpen className="w-3 h-3" /> Estudo
                    </span>
                  )}
                  {renderNotificationBadge(task.notificationMode)}
                  {task.folderId && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-md3-onSurfaceVariant">
                      <FolderIcon className="w-3 h-3" />
                      {getFolderFullPath(activeFolders, task.folderId)}
                    </span>
                  )}
                  {task.dueDate ? (
                    <span className="text-[11px] font-medium text-md3-primary">
                      Prazo: {task.dueDate}
                    </span>
                  ) : (
                    <span className="text-[11px] text-md3-onSurfaceVariant">
                      Sem data (Resumo toda quarta-feira)
                    </span>
                  )}
                  {task.postponedCount > 0 && (
                    <span className="rounded-md3-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                      Adiada {task.postponedCount}x
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-md3-onSurface">{task.title}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    triggerTaskNotification(task.title, task.notificationMode, onShowToast)
                  }
                  title="Disparar/testar notificação configurada"
                  className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline px-2.5 py-1 text-xs font-medium hover:bg-md3-surfaceContainerHigh"
                >
                  <Bell className="w-3.5 h-3.5 text-md3-primary" /> Testar Alerta
                </button>
                <button
                  type="button"
                  onClick={() => onPostpone(task.id)}
                  className="inline-flex items-center gap-1 rounded-md3-full border border-md3-outline px-2.5 py-1 text-xs font-medium hover:bg-md3-surfaceContainerHigh"
                >
                  <Clock className="w-3.5 h-3.5" /> Adiar
                </button>
                <button
                  type="button"
                  onClick={() => onCompleteTaskWithPrompt(task)}
                  className="inline-flex items-center gap-1 rounded-md3-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Concluir
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="rounded-md3-full p-1.5 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
