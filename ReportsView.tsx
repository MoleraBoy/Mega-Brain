'use client';

import React, { useState } from 'react';
import { BarChart3, BookOpen, Wrench, CheckCircle2, Lock } from 'lucide-react';
import { BrainItem, BrainTask, ConsumptionLog } from '@/lib/types';

interface ReportsViewProps {
  items: BrainItem[];
  tasks: BrainTask[];
  consumptionLogs: ConsumptionLog[];
  hasPrivateVault: boolean;
}

export default function ReportsView({
  items,
  tasks,
  consumptionLogs,
  hasPrivateVault
}: ReportsViewProps) {
  const [includePrivate, setIncludePrivate] = useState(false);

  const visibleItems = items.filter((i) => includePrivate || !i.isPrivate);
  const visibleTasks = tasks.filter((t) => includePrivate || !t.isPrivate);
  const visibleLogs = consumptionLogs.filter((l) => includePrivate || !l.isPrivate);

  // Regra: Seção de Estudos fica totalmente oculta se nenhum conteúdo ou tarefa de estudo tiver sido registrado
  const studyItems = visibleItems.filter((i) => i.isStudy);
  const studyTasks = visibleTasks.filter((t) => !t.isTne);
  const studyLogs = visibleLogs.filter((l) => l.isStudy);
  const hasAnyStudyRecord =
    studyItems.length > 0 || studyTasks.length > 0 || studyLogs.length > 0;

  // Métricas TNE (Tarefas que Não são Estudo)
  const tneTasks = visibleTasks.filter((t) => t.isTne);
  const tneCompleted = tneTasks.filter((t) => t.completed).length;
  const tnePostponedTotal = tneTasks.reduce((acc, t) => acc + t.postponedCount, 0);

  // Métricas de Estudo
  const studyTasksCompleted = studyTasks.filter((t) => t.completed).length;
  const studyTasksPostponed = studyTasks.reduce((acc, t) => acc + t.postponedCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-md3-primary" />
          <div>
            <h2 className="text-lg font-semibold text-md3-onSurface">
              Relatórios Inteligentes de Consumo & Execução
            </h2>
            <p className="text-xs text-md3-onSurfaceVariant">
              Baseado exclusivamente em itens marcados como &quot;Visto&quot; e tarefas registradas.
            </p>
          </div>
        </div>

        {hasPrivateVault && (
          <label className="inline-flex items-center gap-2 rounded-md3-full bg-md3-surfaceContainerHigh px-3.5 py-1.5 text-xs font-medium cursor-pointer">
            <Lock className="w-3.5 h-3.5 text-md3-primary" />
            <span>Incluir dados do Espaço Privado</span>
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={(e) => setIncludePrivate(e.target.checked)}
              className="accent-md3-primary"
            />
          </label>
        )}
      </div>

      {/* Visão Geral de Consumo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="md3-card p-4">
          <p className="text-xs font-medium text-md3-onSurfaceVariant">
            Links Realmente Consumidos (&quot;Visto&quot;)
          </p>
          <p className="text-2xl font-bold text-md3-primary mt-1">
            {visibleLogs.length}
          </p>
          <p className="text-[11px] text-md3-onSurfaceVariant mt-1">
            {visibleLogs.filter((l) => l.keptInHistory).length} mantidos no Histórico •{' '}
            {visibleLogs.filter((l) => !l.keptInHistory).length} descartados após leitura
          </p>
        </div>

        <div className="md3-card p-4">
          <p className="text-xs font-medium text-md3-onSurfaceVariant">
            Links Ativos na Fila
          </p>
          <p className="text-2xl font-bold text-md3-onSurface mt-1">
            {visibleItems.filter((i) => i.status === 'active').length}
          </p>
          <p className="text-[11px] text-md3-onSurfaceVariant mt-1">
            Cliques simples não alteram este indicador
          </p>
        </div>

        <div className="md3-card p-4">
          <p className="text-xs font-medium text-md3-onSurfaceVariant">
            Taxa Geral de Conclusão de Tarefas
          </p>
          <p className="text-2xl font-bold text-md3-onSurface mt-1">
            {visibleTasks.length > 0
              ? Math.round(
                  (visibleTasks.filter((t) => t.completed).length / visibleTasks.length) *
                    100
                )
              : 0}
            %
          </p>
          <p className="text-[11px] text-md3-onSurfaceVariant mt-1">
            {visibleTasks.filter((t) => t.completed).length} de {visibleTasks.length} concluídas
          </p>
        </div>
      </div>

      {/* Seção de Estudos (Condicional: oculta se nenhum conteúdo ou tarefa de estudo existir) */}
      {hasAnyStudyRecord && (
        <div className="rounded-md3-lg border border-md3-primary/30 bg-md3-primaryContainer/20 p-5 space-y-3">
          <div className="flex items-center gap-2 text-md3-primary">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-semibold">Desempenho de Estudos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md3-md bg-md3-surfaceContainerLowest p-3 border border-md3-outlineVariant">
              <span className="text-xs text-md3-onSurfaceVariant">Conteúdos Estudados</span>
              <p className="text-xl font-bold text-md3-onSurface">{studyLogs.length}</p>
            </div>
            <div className="rounded-md3-md bg-md3-surfaceContainerLowest p-3 border border-md3-outlineVariant">
              <span className="text-xs text-md3-onSurfaceVariant">Tarefas de Estudo Concluídas</span>
              <p className="text-xl font-bold text-md3-onSurface">
                {studyTasksCompleted} / {studyTasks.length}
              </p>
            </div>
            <div className="rounded-md3-md bg-md3-surfaceContainerLowest p-3 border border-md3-outlineVariant">
              <span className="text-xs text-md3-onSurfaceVariant">Adiamentos em Estudos</span>
              <p className="text-xl font-bold text-md3-onSurface">{studyTasksPostponed}</p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Separadas de TNE (Tarefas que Não são Estudo) */}
      <div className="rounded-md3-lg border border-amber-300 bg-amber-50/50 p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-900">
          <Wrench className="w-5 h-5" />
          <h3 className="text-base font-semibold">
            Métricas TNE (Tarefas que Não são Estudo)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md3-md bg-white p-3 border border-amber-200">
            <span className="text-xs text-amber-800">Total de Tarefas TNE</span>
            <p className="text-xl font-bold text-amber-950">{tneTasks.length}</p>
          </div>
          <div className="rounded-md3-md bg-white p-3 border border-amber-200">
            <span className="text-xs text-amber-800">TNE Concluídas</span>
            <p className="text-xl font-bold text-emerald-700">{tneCompleted}</p>
          </div>
          <div className="rounded-md3-md bg-white p-3 border border-amber-200">
            <span className="text-xs text-amber-800">Total de Adiamentos TNE</span>
            <p className="text-xl font-bold text-amber-900">{tnePostponedTotal}</p>
          </div>
        </div>
      </div>

      {/* Últimos registros de consumo */}
      <div className="rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4 space-y-2.5">
        <h3 className="text-sm font-semibold text-md3-onSurface">
          Log de Consumo Real Recente
        </h3>
        {visibleLogs.length === 0 ? (
          <p className="text-xs text-md3-onSurfaceVariant">
            Nenhum item foi marcado como &quot;Visto&quot; ainda.
          </p>
        ) : (
          <div className="divide-y divide-md3-outlineVariant">
            {visibleLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="py-2 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium truncate">{log.title}</span>
                </div>
                <span className="text-md3-onSurfaceVariant shrink-0">
                  {log.keptInHistory ? 'Salvo no Histórico' : 'Apenas Contabilizado'} •{' '}
                  {new Date(log.consumedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
