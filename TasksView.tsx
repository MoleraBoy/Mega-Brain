'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  Trash2,
  Plus,
  BookOpen,
  Wrench
} from 'lucide-react';
import { BrainTask } from '@/lib/types';
import { classifyTaskRealtime } from '@/lib/tneClassifier';

interface TasksViewProps {
  tasks: BrainTask[];
  onAddTask: (title: string, isTne: boolean, dueDate?: string) => void;
  onToggleComplete: (taskId: string) => void;
  onPostpone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function TasksView({
  tasks,
  onAddTask,
  onToggleComplete,
  onPostpone,
  onDelete
}: TasksViewProps) {
  const [title, setTitle] = useState('');
  const [manualOverrideTne, setManualOverrideTne] = useState<boolean | null>(null);
  const [dueDate, setDueDate] = useState('');

  const analysis = classifyTaskRealtime(title);
  const effectiveIsTne = manualOverrideTne !== null ? manualOverrideTne : analysis.isTne;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask(title.trim(), effectiveIsTne, dueDate || undefined);
    setTitle('');
    setManualOverrideTne(null);
    setDueDate('');
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="Digite uma tarefa (ex: Preparar site, Revisar capítulo de React...)"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setManualOverrideTne(null);
            }}
            className="flex-1 rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2.5 text-sm"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md3-md border border-md3-outline bg-md3-surface px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-md3-full bg-md3-primary px-5 py-2.5 text-sm font-medium text-md3-onPrimary hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {/* Classificador TNE em tempo real */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-md3-onSurfaceVariant">Classificação em tempo real:</span>
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
          </div>

          <button
            type="button"
            onClick={() => setManualOverrideTne(!effectiveIsTne)}
            className="text-md3-primary font-medium hover:underline"
          >
            Alternar manualmente para {effectiveIsTne ? 'Estudo' : 'TNE'}
          </button>
        </div>
      </form>

      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="rounded-md3-lg border border-dashed border-md3-outlineVariant p-8 text-center text-sm text-md3-onSurfaceVariant">
            Nenhuma tarefa cadastrada neste espaço.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="md3-card p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleComplete(task.id)}
                  className="text-md3-primary shrink-0"
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      task.completed
                        ? 'line-through text-md3-onSurfaceVariant'
                        : 'text-md3-onSurface'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                    <span
                      className={`rounded-md3-full px-2 py-0.5 font-medium ${
                        task.isTne
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                      }`}
                    >
                      {task.isTne ? 'TNE' : 'Estudo'}
                    </span>
                    {task.dueDate && (
                      <span className="text-md3-onSurfaceVariant">
                        Prazo: {task.dueDate}
                      </span>
                    )}
                    {task.postponedCount > 0 && (
                      <span className="text-amber-700 font-medium">
                        Adiada {task.postponedCount}x
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!task.completed && (
                  <button
                    type="button"
                    onClick={() => onPostpone(task.id)}
                    className="inline-flex items-center gap-1 rounded-md3-full bg-md3-surfaceContainerHigh px-3 py-1 text-xs font-medium text-md3-onSurface hover:bg-md3-secondaryContainer"
                    title="Adiar para amanhã"
                  >
                    <Clock className="w-3.5 h-3.5" /> Adiar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="rounded-full p-1.5 text-red-600 hover:bg-red-50"
                  title="Excluir tarefa"
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
