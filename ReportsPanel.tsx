'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3, BookOpen, CheckCircle, Clock, Flame, History, Shield, Tag } from 'lucide-react';
import { LinkItem, TaskItem, VisitLog } from '@/lib/types';

interface Props {
  links: LinkItem[];
  tasks: TaskItem[];
  visits: VisitLog[];
  isPrivateUnlocked: boolean;
}

export function ReportsPanel({ links, tasks, visits, isPrivateUnlocked }: Props) {
  const [includePrivate, setIncludePrivate] = useState(false);

  const visibleVisits = useMemo(
    () => visits.filter((v) => !v.isPrivate || (isPrivateUnlocked && includePrivate)),
    [visits, isPrivateUnlocked, includePrivate]
  );
  const visibleTasks = useMemo(
    () => tasks.filter((t) => !t.isPrivate || (isPrivateUnlocked && includePrivate)),
    [tasks, isPrivateUnlocked, includePrivate]
  );
  const visibleLinks = useMemo(
    () => links.filter((l) => !l.isPrivate || (isPrivateUnlocked && includePrivate)),
    [links, isPrivateUnlocked, includePrivate]
  );

  // Estudos
  const studyVisits = visibleVisits.filter((v) => v.isStudy);
  const studyTasks = visibleTasks.filter((t) => t.category === 'ESTUDO');
  const studyLinks = visibleLinks.filter((l) => l.isStudy && l.status === 'active');
  const studiedThemes = Array.from(
    new Set(studyVisits.map((v) => v.themeName).filter(Boolean))
  );
  const hasAnyStudyRecord =
    studyVisits.length > 0 || studyTasks.length > 0 || studyLinks.length > 0;

  // Tarefas Geral e TNE
  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const tneTasks = visibleTasks.filter((t) => t.category === 'TNE');
  const tneCompleted = tneTasks.filter((t) => t.status === 'completed').length;
  const tneCompletionRate =
    tneTasks.length > 0 ? Math.round((tneCompleted / tneTasks.length) * 100) : 0;
  const totalPostpones = visibleTasks.reduce((acc, t) => acc + t.postponeCount, 0);
  const postponedTasksCount = visibleTasks.filter((t) => t.postponeCount > 0).length;
  const postponeRate =
    totalTasks > 0 ? Math.round((postponedTasksCount / totalTasks) * 100) : 0;

  // Histórico e Visitas
  const historyCount = visibleLinks.filter((l) => l.status === 'history').length;

  // Top Temas mais salvos
  const topThemes = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleLinks.forEach((l) => {
      const key = l.themeName || 'Sem tema';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [visibleLinks]);

  // Top Tags mais salvas
  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleLinks.forEach((l) => {
      l.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [visibleLinks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-md3-lg border border-md3-outlineVariant">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md3-md bg-md3-primaryContainer text-md3-onPrimaryContainer">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Relatórios de Consumo & Execução</h2>
            <p className="text-xs text-gray-500">
              Apenas itens confirmados no botão &quot;Visto&quot; contabilizam visitas reais.
            </p>
          </div>
        </div>

        {isPrivateUnlocked && (
          <label className="flex items-center gap-2 text-xs font-medium bg-md3-secondaryContainer text-md3-onSecondaryContainer px-3.5 py-2 rounded-md3-full cursor-pointer">
            <Shield className="w-4 h-4" />
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={(e) => setIncludePrivate(e.target.checked)}
            />
            Incluir dados do Espaço Privado
          </label>
        )}
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-md3-lg border border-md3-outlineVariant">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase">Visitas Reais</p>
            <History className="w-4 h-4 text-md3-primary" />
          </div>
          <p className="text-3xl font-bold text-md3-primary mt-1">{visibleVisits.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {historyCount} salvos no Histórico •{' '}
            {visibleVisits.filter((v) => !v.keptInHistory).length} excluídos após leitura
          </p>
        </div>

        <div className="bg-white p-5 rounded-md3-lg border border-md3-outlineVariant">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase">Conclusão de Tarefas</p>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{completionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {completedTasks} de {totalTasks} tarefas concluídas
          </p>
        </div>

        <div className="bg-white p-5 rounded-md3-lg border border-md3-outlineVariant">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase">Taxa de Adiamento</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-1">{postponeRate}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {totalPostpones} adiamentos em {postponedTasksCount} tarefas
          </p>
        </div>

        <div className="bg-white p-5 rounded-md3-lg border border-md3-outlineVariant">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase">Execução TNE</p>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-700 mt-1">{tneCompletionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {tneCompleted}/{tneTasks.length} Tarefas que Não são Estudo
          </p>
        </div>
      </div>

      {/* O que mais está sendo salvo: Temas e Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-md3-lg border border-md3-outlineVariant space-y-3">
          <div className="flex items-center gap-2 text-md3-primary">
            <Flame className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Temas Mais Salvos</h3>
          </div>
          {topThemes.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum tema salvo ainda.</p>
          ) : (
            <div className="space-y-2">
              {topThemes.map(([theme, count]) => (
                <div key={theme} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-800">{theme}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-md3-primaryContainer text-md3-onPrimaryContainer font-semibold">
                    {count} {count === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-md3-lg border border-md3-outlineVariant space-y-3">
          <div className="flex items-center gap-2 text-md3-primary">
            <Tag className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Tags Mais Frequentes</h3>
          </div>
          {topTags.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhuma tag registrada ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="text-xs bg-md3-surfaceContainer px-3 py-1.5 rounded-md3-full font-medium text-gray-800"
                >
                  #{tag} <strong>({count})</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seção de Estudos: totalmente oculta se nenhum conteúdo ou tarefa de estudo existir */}
      {hasAnyStudyRecord && (
        <div className="bg-white p-5 rounded-md3-lg border border-md3-outlineVariant space-y-3">
          <div className="flex items-center gap-2 text-md3-primary">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold">Desempenho em Estudos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3.5 rounded-md3-md bg-md3-surfaceContainer">
              <span className="text-gray-500 block text-xs">Conteúdos Estudados (Vistos)</span>
              <strong className="text-lg">{studyVisits.length}</strong>
            </div>
            <div className="p-3.5 rounded-md3-md bg-md3-surfaceContainer">
              <span className="text-gray-500 block text-xs">Temas Estudados</span>
              <strong className="text-lg">{studiedThemes.length}</strong>
            </div>
            <div className="p-3.5 rounded-md3-md bg-md3-surfaceContainer">
              <span className="text-gray-500 block text-xs">Tarefas de Estudo</span>
              <strong className="text-lg">
                {studyTasks.filter((t) => t.status === 'completed').length} / {studyTasks.length}
              </strong>
            </div>
            <div className="p-3.5 rounded-md3-md bg-md3-surfaceContainer">
              <span className="text-gray-500 block text-xs">Fila Ativa de Estudos</span>
              <strong className="text-lg">{studyLinks.length}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
