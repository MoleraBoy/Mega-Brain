'use client';

import React, { useState } from 'react';
import { BarChart3, BookOpen, Wrench, History, Lock, Tag, Layers } from 'lucide-react';
import { BrainItem, BrainTask, ConsumptionLog, Folder } from '@/lib/types';

interface ReportsViewProps {
  folders: Folder[];
  items: BrainItem[];
  tasks: BrainTask[];
  consumptionLogs: ConsumptionLog[];
  hasPrivateVault: boolean;
}

export default function ReportsView({
  folders,
  items,
  tasks,
  consumptionLogs,
  hasPrivateVault
}: ReportsViewProps) {
  const [includePrivate, setIncludePrivate] = useState(false);

  const visibleFolders = folders.filter((f) => includePrivate || !f.isPrivate);
  const visibleItems = items.filter((i) => includePrivate || !i.isPrivate);
  const visibleTasks = tasks.filter((t) => includePrivate || !t.isPrivate);
  const visibleLogs = consumptionLogs.filter((l) => includePrivate || !l.isPrivate);

  // O que mais está sendo salvo (Temas e Tags)
  const themeCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  for (const item of visibleItems) {
    themeCounts.set(item.themeName, (themeCounts.get(item.themeName) || 0) + 1);
    for (const tag of item.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const topThemes = Array.from(themeCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Taxa de visita real ("Visto") vs links ativos
  const activeLinksCount = visibleItems.filter((i) => i.status === 'active').length;
  const totalVisitedCount = visibleLogs.length;
  const visitDenominator = activeLinksCount + totalVisitedCount;
  const realVisitRate =
    visitDenominator > 0 ? Math.round((totalVisitedCount / visitDenominator) * 100) : 0;

  // Histórico (links vistos mantidos + tarefas concluídas mantidas + pastas arquivadas)
  const historyLinksCount = visibleItems.filter((i) => i.status === 'history').length;
  const historyTasksCount = visibleTasks.filter((t) => t.status === 'history').length;
  const historyFoldersCount = visibleFolders.filter((f) => f.status === 'history').length;

  // Taxas gerais de tarefas (conclusão e adiamento)
  const totalTasksCount = visibleTasks.length;
  const completedTasksCount = visibleTasks.filter((t) => t.completed).length;
  const postponedTasksCount = visibleTasks.filter((t) => t.postponedCount > 0).length;
  const totalPostponements = visibleTasks.reduce((acc, t) => acc + t.postponedCount, 0);
  const completionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const postponementRate =
    totalTasksCount > 0 ? Math.round((postponedTasksCount / totalTasksCount) * 100) : 0;

  // Regra de Estudos: se nada foi jogado no estudo, não traz o bloco de estudos no relatório
  const studyItems = visibleItems.filter((i) => i.isStudy && !i.isTne);
  const studyTasks = visibleTasks.filter((t) => !t.isTne);
  const studyLogs = visibleLogs.filter((l) => l.isStudy && !l.isTne);
  const hasAnyStudy =
    studyItems.length > 0 || studyTasks.length > 0 || studyLogs.length > 0;

  const studiedTopics = Array.from(
    new Set([
      ...studyItems.map((i) => i.themeName),
      ...studyLogs.map((l) => l.themeName)
    ])
  );

  // TNE (Tarefas/itens que não são estudo)
  const tneTasks = visibleTasks.filter((t) => t.isTne);
  const tneItems = visibleItems.filter((i) => i.isTne);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md3-lg bg-md3-surfaceContainerLow border border-md3-outlineVariant p-4">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-md3-primary" />
          <div>
            <h2 className="text-base font-semibold text-md3-onSurface">
              Relatórios Analíticos & Histórico Consolidado
            </h2>
            <p className="text-xs text-md3-onSurfaceVariant">
              Visitas computadas exclusivamente após confirmação no botão &quot;Visto&quot;.
            </p>
          </div>
        </div>

        {hasPrivateVault && (
          <label className="inline-flex items-center gap-2 rounded-md3-full bg-md3-surfaceContainerHigh px-3.5 py-1.5 text-xs font-medium cursor-pointer">
            <Lock className="w-3.5 h-3.5 text-md3-primary" />
            <span>Incluir Espaço Privado no relatório</span>
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={(e) => setIncludePrivate(e.target.checked)}
              className="accent-md3-primary"
            />
          </label>
        )}
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="md3-card p-4">
          <p className="text-xs text-md3-onSurfaceVariant">Taxa de Visita Real aos Links</p>
          <p className="text-2xl font-bold text-md3-primary mt-1">{realVisitRate}%</p>
          <p className="text-[11px] text-md3-onSurfaceVariant mt-1">
            {totalVisitedCount} vistos ({visibleLogs.filter((l) => l.keptInHistory).length} no histórico,{' '}
            {visibleLogs.filter((l) => !l.keptInHistory).length} apagados)
          </p>
        </div>

        <div className="md3-card p-4">
          <p className="text-xs text-md3-onSurfaceVariant">Taxa de Conclusão de Tarefas</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{completionRate}%</p>
          <p className="text-[11px] text-md3-onSurfaceVariant mt-1">
            {completedTasksCount} concluídas de {totalTasksCount} registradas
          </p>
        </div>

        <div className="md3-card p-4">
          <p className="text-xs text-md3-onSurfaceVariant">Taxa de Adiamento de Tarefas</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{postponementRate}%</p>
          <p className="text-[11px] text-md3-onSurfaceVariant mt-1">
            {postponedTasksCount} tarefas adiadas ({totalPostponements} adiamentos totais)
          </p>
        </div>

        <div className="md3-card p-4">
          <p className="text-xs text-md3-onSurfaceVariant inline-flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-md3-primary" /> Itens Guardados no Histórico
          </p>
          <p className="text-2xl font-bold text-md3-onSurface mt-1">
            {historyLinksCount + historyTasksCount + historyFoldersCount}
          </p>
          <p className="text-[11px] text-md3-onSurfaceVariant mt-1">
            {historyLinksCount} links • {historyTasksCount} tarefas • {historyFoldersCount} pastas
          </p>
        </div>
      </div>

      {/* O que mais está sendo salvo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md3-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-md3-onSurface">
            <Layers className="w-4 h-4 text-md3-primary" /> Temas Mais Salvos
          </h3>
          {topThemes.length === 0 ? (
            <p className="text-xs text-md3-onSurfaceVariant">Nenhum tema registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {topThemes.map(([theme, count]) => (
                <div key={theme} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-md3-onSurface">{theme}</span>
                  <span className="rounded-md3-full bg-md3-secondaryContainer px-2.5 py-0.5 font-semibold text-md3-onSecondaryContainer">
                    {count} {count === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md3-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-md3-onSurface">
            <Tag className="w-4 h-4 text-md3-primary" /> Tags Mais Frequentes
          </h3>
          {topTags.length === 0 ? (
            <p className="text-xs text-md3-onSurfaceVariant">Nenhuma tag registrada ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-md3-full bg-md3-surfaceContainerHigh px-3 py-1 text-xs font-medium text-md3-onSurface"
                >
                  #{tag}
                  <strong className="text-md3-primary">{count}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bloco de Estudos (exibido SOMENTE se houver algum registro de estudo) */}
      {hasAnyStudy && (
        <div className="rounded-md3-lg border border-md3-primary/30 bg-md3-primaryContainer/25 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-md3-onPrimaryContainer">
              <BookOpen className="w-4 h-4 text-md3-primary" /> Desempenho em Estudos
            </h3>
            <span className="text-xs font-semibold text-md3-primary">
              {studiedTopics.length} {studiedTopics.length === 1 ? 'tema estudado' : 'temas estudados'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-md3-md bg-md3-surface p-3 border border-md3-outlineVariant">
              <span className="text-md3-onSurfaceVariant">Materiais de Estudo</span>
              <p className="text-lg font-bold text-md3-onSurface mt-0.5">
                {studyItems.length} ativos • {studyLogs.length} concluídos
              </p>
            </div>
            <div className="rounded-md3-md bg-md3-surface p-3 border border-md3-outlineVariant">
              <span className="text-md3-onSurfaceVariant">Tarefas de Estudo</span>
              <p className="text-lg font-bold text-md3-onSurface mt-0.5">
                {studyTasks.filter((t) => t.completed).length}/{studyTasks.length} concluídas
              </p>
            </div>
            <div className="rounded-md3-md bg-md3-surface p-3 border border-md3-outlineVariant">
              <span className="text-md3-onSurfaceVariant">Temas Abordados</span>
              <p className="text-xs font-medium text-md3-onSurface mt-1">
                {studiedTopics.join(', ') || 'Em andamento'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bloco TNE (Tarefas/Itens que Não são Estudo) */}
      <div className="rounded-md3-lg border border-amber-300 bg-amber-50/60 p-5 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-950">
          <Wrench className="w-4 h-4 text-amber-700" /> TNE — Tarefas e Preparações que Não são Estudo
        </h3>
        <p className="text-xs text-amber-900">
          Atividades operacionais (como arrumar um site, configurar ferramentas ou organizar materiais) contabilizadas separadamente das matérias de estudo:
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold text-amber-950">
          <span>• Tarefas TNE: {tneTasks.length} ({tneTasks.filter((t) => t.completed).length} concluídas)</span>
          <span>• Links/Ferramentas TNE: {tneItems.length}</span>
        </div>
      </div>
    </div>
  );
}
