'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FolderPlus,
  FolderTree,
  History,
  LayoutGrid,
  Link2,
  ListChecks,
  Lock,
  Plus,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Trash2,
  Unlock,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  DisplayMode,
  FieldVisibility,
  Folder,
  LinkItem,
  MediaType,
  NotificationSettings,
  PrivateVaultConfig,
  TaskItem,
  VisitLog
} from '@/lib/types';
import { getFolderPath, localDB } from '@/lib/storage';
import { classifyTaskRealtime, learnFromHistory } from '@/lib/classifier';
import { dispatchReminderAlert } from '@/lib/notifications';
import { PrivateVaultModal } from '@/components/PrivateVaultModal';
import { ViewConfirmModal } from '@/components/ViewConfirmModal';
import { ReportsPanel } from '@/components/ReportsPanel';

type ActiveTab = 'workspace' | 'all_media' | 'tasks' | 'history' | 'reports';

export default function MegaBrainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [vaultConfig, setVaultConfig] = useState<PrivateVaultConfig>({ isConfigured: false, pinHash: '' });
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    globalSoundEnabled: true,
    globalVibrationEnabled: true
  });

  // Espaço Privado
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Navegação de Pastas Recursivas
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newSubfolderName, setNewSubfolderName] = useState('');

  // Formulário Inteligente de Novo Link com Aprendizado Automático
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [thumbInput, setThumbInput] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [whatIsInput, setWhatIsInput] = useState('');
  const [whySavedInput, setWhySavedInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<MediaType>('artigo');
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [isStudyInput, setIsStudyInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [learnedBadge, setLearnedBadge] = useState<string>('');
  const lastAnalyzedUrlRef = useRef<string>('');

  // Exibição MD3 & Filtros Combináveis
  const [displayMode, setDisplayMode] = useState<DisplayMode>('mini_all');
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [fieldVisibility, setFieldVisibility] = useState<FieldVisibility>({
    showTitle: true,
    showThumb: true,
    showTheme: true,
    showWhatIs: true,
    showWhySaved: true,
    showTags: true,
    showFolderPath: true
  });

  const [filterFolderId, setFilterFolderId] = useState<string>('ALL');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [filterMediaType, setFilterMediaType] = useState<string>('ALL');
  const [filterOnlyStudy, setFilterOnlyStudy] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de Fluxo "Visto"
  const [linkToConfirmView, setLinkToConfirmView] = useState<LinkItem | null>(null);

  // Tarefas, TNE & Lembretes com Som e Vibração
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskReminderTime, setTaskReminderTime] = useState('');
  const [taskSoundEnabled, setTaskSoundEnabled] = useState(true);
  const [taskVibrationEnabled, setTaskVibrationEnabled] = useState(true);
  const [alertFeedback, setAlertFeedback] = useState<string>('');

  useEffect(() => {
    setFolders(localDB.getFolders());
    setLinks(localDB.getLinks());
    setTasks(localDB.getTasks());
    setVisits(localDB.getVisits());
    setVaultConfig(localDB.getVault());
    setNotifSettings(localDB.getNotifSettings());
  }, []);

  const scopedFolders = useMemo(
    () => folders.filter((f) => f.isPrivate === isPrivateMode),
    [folders, isPrivateMode]
  );

  const scopedLinks = useMemo(
    () => links.filter((l) => l.isPrivate === isPrivateMode),
    [links, isPrivateMode]
  );

  const scopedTasks = useMemo(
    () => tasks.filter((t) => t.isPrivate === isPrivateMode),
    [tasks, isPrivateMode]
  );

  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    scopedLinks.forEach((l) => l.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [scopedLinks]);

  const breadcrumbs = useMemo(() => {
    const trail: Folder[] = [];
    let curr = scopedFolders.find((f) => f.id === currentFolderId);
    const seen = new Set<string>();
    while (curr && !seen.has(curr.id)) {
      seen.add(curr.id);
      trail.unshift(curr);
      curr = curr.parentId ? scopedFolders.find((f) => f.id === curr!.parentId) : undefined;
    }
    return trail;
  }, [currentFolderId, scopedFolders]);

  const childFolders = useMemo(
    () => scopedFolders.filter((f) => f.parentId === currentFolderId),
    [scopedFolders, currentFolderId]
  );

  const runSmartAnalysis = async (rawUrl: string) => {
    const clean = rawUrl.trim();
    if (!clean || clean.length < 6 || lastAnalyzedUrlRef.current === clean) return;
    lastAnalyzedUrlRef.current = clean;
    setIsAnalyzing(true);
    setLearnedBadge('');
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean })
      });
      const data = await res.json();
      const learned = learnFromHistory(
        data.url || clean,
        data.title || '',
        data.description || '',
        links
      );
      setUrlInput(data.url || clean);
      setTitleInput(data.title || clean);
      setThumbInput(data.thumbnailUrl || '');
      setThemeInput(learned.suggestedTheme);
      setWhatIsInput(learned.suggestedWhatIs);
      setWhySavedInput(learned.suggestedWhySaved);
      setTagsInput(learned.suggestedTags.join(', '));
      setMediaTypeInput(learned.suggestedMediaType);
      setIsStudyInput(learned.isStudy);
      if (learned.suggestedFolderId && scopedFolders.some((f) => f.id === learned.suggestedFolderId)) {
        setTargetFolderId(learned.suggestedFolderId);
      } else if (currentFolderId) {
        setTargetFolderId(currentFolderId);
      }
      setLearnedBadge(
        learned.learnedFromCount > 0
          ? `Aprendido com ${learned.learnedFromCount} item(ns) do seu histórico`
          : 'Preenchido automaticamente pelo conteúdo do link'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dispara aprendizado automaticamente quando o usuário cola/digita uma URL válida
  useEffect(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      lastAnalyzedUrlRef.current = '';
      setLearnedBadge('');
      return;
    }
    if (/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)) {
      const timer = setTimeout(() => {
        runSmartAnalysis(trimmed);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [urlInput]);

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    localDB.upsertLinkWithTheme({
      folderId: targetFolderId || currentFolderId || null,
      themeName: themeInput.trim() || 'Geral',
      url: urlInput.trim(),
      title: titleInput.trim() || urlInput.trim(),
      thumbnailUrl:
        thumbInput.trim() ||
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
      mediaType: mediaTypeInput,
      whatIs: whatIsInput.trim(),
      whySaved: whySavedInput.trim(),
      tags,
      isStudy: isStudyInput,
      isPrivate: isPrivateMode
    });

    setLinks(localDB.getLinks());
    setUrlInput('');
    setTitleInput('');
    setThumbInput('');
    setWhatIsInput('');
    setWhySavedInput('');
    setTagsInput('');
    setLearnedBadge('');
    lastAnalyzedUrlRef.current = '';
  };

  const handleCreateSubfolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubfolderName.trim()) return;
    const folder: Folder = {
      id: `f-${Date.now()}`,
      parentId: currentFolderId,
      name: newSubfolderName.trim(),
      isPrivate: isPrivateMode,
      createdAt: new Date().toISOString()
    };
    const updated = [...folders, folder];
    localDB.saveFolders(updated);
    setFolders(updated);
    setNewSubfolderName('');
  };

  const handleMoveLinkToFolder = (linkId: string, newFolderId: string | null) => {
    const updated = links.map((l) => (l.id === linkId ? { ...l, folderId: newFolderId } : l));
    localDB.saveLinks(updated);
    setLinks(updated);
  };

  const handleCreateFolderAndMove = (linkId: string) => {
    const name = window.prompt('Nome da nova pasta ou subpasta:');
    if (!name || !name.trim()) return;
    const parentId = links.find((l) => l.id === linkId)?.folderId || null;
    const newFolder: Folder = {
      id: `f-${Date.now()}`,
      parentId,
      name: name.trim(),
      isPrivate: isPrivateMode,
      createdAt: new Date().toISOString()
    };
    const updatedFolders = [...folders, newFolder];
    localDB.saveFolders(updatedFolders);
    setFolders(updatedFolders);
    handleMoveLinkToFolder(linkId, newFolder.id);
  };

  // Clicar no link abre o conteúdo e libera o botão "Visto", mas NÃO contabiliza visita ainda
  const handleMarkLinkOpened = (linkId: string) => {
    const updated = links.map((l) =>
      l.id === linkId ? { ...l, openedAt: new Date().toISOString() } : l
    );
    localDB.saveLinks(updated);
    setLinks(updated);
  };

  // Excluir direto NÃO contabiliza visita
  const handleDeleteWithoutView = (linkId: string) => {
    const updated = links.filter((l) => l.id !== linkId);
    localDB.saveLinks(updated);
    setLinks(updated);
  };

  // Botão "Visto" -> pergunta se quer manter no Histórico e sempre contabiliza visita real
  const handleConfirmViewed = (link: LinkItem, keepInHistory: boolean) => {
    const now = new Date().toISOString();
    const visitEntry: VisitLog = {
      id: `v-${Date.now()}`,
      linkId: link.id,
      title: link.title,
      themeName: link.themeName,
      isStudy: link.isStudy,
      isPrivate: link.isPrivate,
      keptInHistory: keepInHistory,
      visitedAt: now
    };
    const updatedVisits = [visitEntry, ...visits];
    localDB.saveVisits(updatedVisits);
    setVisits(updatedVisits);

    const updatedLinks: LinkItem[] = keepInHistory
      ? links.map((l) => (l.id === link.id ? { ...l, status: 'history', viewedAt: now } : l))
      : links.filter((l) => l.id !== link.id);

    localDB.saveLinks(updatedLinks);
    setLinks(updatedLinks);
    setLinkToConfirmView(null);
  };

  const liveClassification = useMemo(
    () => classifyTaskRealtime(taskTitleInput),
    [taskTitleInput]
  );

  const handleToggleGlobalSound = () => {
    const next = { ...notifSettings, globalSoundEnabled: !notifSettings.globalSoundEnabled };
    localDB.saveNotifSettings(next);
    setNotifSettings(next);
  };

  const handleToggleGlobalVibration = () => {
    const next = { ...notifSettings, globalVibrationEnabled: !notifSettings.globalVibrationEnabled };
    localDB.saveNotifSettings(next);
    setNotifSettings(next);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitleInput.trim()) return;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    const newTask: TaskItem = {
      id: `tk-${Date.now()}`,
      title: taskTitleInput.trim(),
      category: liveClassification.category,
      status: 'pending',
      postponeCount: 0,
      isPrivate: isPrivateMode,
      reminderTime: taskReminderTime || undefined,
      soundEnabled: taskSoundEnabled,
      vibrationEnabled: taskVibrationEnabled,
      createdAt: new Date().toISOString()
    };
    const updated = [newTask, ...tasks];
    localDB.saveTasks(updated);
    setTasks(updated);
    setTaskTitleInput('');
    setTaskReminderTime('');
  };

  const handleToggleTaskNotification = (taskId: string, field: 'soundEnabled' | 'vibrationEnabled') => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, [field]: !t[field] } : t
    );
    localDB.saveTasks(updated);
    setTasks(updated);
  };

  const handleTestReminderAlert = (task: TaskItem) => {
    const res = dispatchReminderAlert(task, notifSettings);
    setAlertFeedback(
      `Lembrete "${task.title}" disparado • Som: ${res.playedSound ? 'ATIVO' : 'MUDO'} • Vibração: ${res.vibrated ? 'ATIVA' : 'DESLIGADA'}`
    );
    setTimeout(() => setAlertFeedback(''), 4000);
  };

  const handleCompleteTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'completed' as const } : t
    );
    localDB.saveTasks(updated);
    setTasks(updated);
  };

  const handlePostponeTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: 'postponed' as const, postponeCount: t.postponeCount + 1 }
        : t
    );
    localDB.saveTasks(updated);
    setTasks(updated);
  };

  const filteredLinks = useMemo(() => {
    return scopedLinks.filter((link) => {
      if (activeTab === 'history') {
        if (link.status !== 'history') return false;
      } else {
        if (link.status !== 'active') return false;
      }

      if (activeTab === 'workspace' && filterFolderId === 'ALL') {
        if ((link.folderId || null) !== currentFolderId) return false;
      } else if (filterFolderId !== 'ALL') {
        if ((link.folderId || 'ROOT') !== filterFolderId) return false;
      }

      if (filterTag !== 'ALL' && !link.tags.includes(filterTag)) return false;
      if (filterMediaType !== 'ALL' && link.mediaType !== filterMediaType) return false;
      if (filterOnlyStudy && !link.isStudy) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          link.title.toLowerCase().includes(q) ||
          link.themeName.toLowerCase().includes(q) ||
          link.whatIs.toLowerCase().includes(q) ||
          link.tags.some((t) => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [
    scopedLinks,
    activeTab,
    currentFolderId,
    filterFolderId,
    filterTag,
    filterMediaType,
    filterOnlyStudy,
    searchQuery
  ]);

  const togglePrivateArea = () => {
    if (isPrivateMode) {
      setIsPrivateMode(false);
      setCurrentFolderId(null);
      return;
    }
    if (isPrivateUnlocked) {
      setIsPrivateMode(true);
      setCurrentFolderId(null);
    } else {
      setShowVaultModal(true);
    }
  };

  const applyDisplayPreset = (mode: DisplayMode) => {
    setDisplayMode(mode);
    if (mode === 'only_name') {
      setFieldVisibility({
        showTitle: true,
        showThumb: false,
        showTheme: false,
        showWhatIs: false,
        showWhySaved: false,
        showTags: false,
        showFolderPath: false
      });
    } else if (mode === 'only_thumb') {
      setFieldVisibility({
        showTitle: false,
        showThumb: true,
        showTheme: false,
        showWhatIs: false,
        showWhySaved: false,
        showTags: false,
        showFolderPath: false
      });
    } else if (mode === 'mini_all') {
      setFieldVisibility({
        showTitle: true,
        showThumb: true,
        showTheme: true,
        showWhatIs: false,
        showWhySaved: false,
        showTags: true,
        showFolderPath: true
      });
    } else {
      setFieldVisibility({
        showTitle: true,
        showThumb: true,
        showTheme: true,
        showWhatIs: true,
        showWhySaved: true,
        showTags: true,
        showFolderPath: true
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top App Bar Material Design 3 */}
      <header
        className={`sticky top-0 z-30 border-b px-4 sm:px-8 py-3.5 transition-colors ${
          isPrivateMode
            ? 'bg-slate-900 text-white border-slate-700'
            : 'bg-white/95 backdrop-blur border-md3-outlineVariant'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-md3-lg flex items-center justify-center font-bold text-lg ${
                isPrivateMode
                  ? 'bg-indigo-500 text-white'
                  : 'bg-md3-primary text-md3-onPrimary'
              }`}
            >
              MB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">Mega Brain v2.3</h1>
                {isPrivateMode && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/40">
                    ESPAÇO PRIVADO
                  </span>
                )}
              </div>
              <p className={`text-xs ${isPrivateMode ? 'text-slate-300' : 'text-gray-500'}`}>
                Pastas Recursivas • IA que Aprende • TNE • Lembretes Som/Vibração
              </p>
            </div>
          </div>

          {/* Menu Superior + Controles Globais de Som/Vibração + Espaço Privado */}
          <nav className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'workspace', label: 'Pastas & Hub', icon: FolderTree },
              { id: 'all_media', label: 'Links e Mídias', icon: Link2 },
              { id: 'tasks', label: 'Tarefas & Lembretes', icon: ListChecks },
              { id: 'history', label: 'Histórico', icon: History },
              { id: 'reports', label: 'Relatórios', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md3-full text-xs font-semibold transition ${
                    active
                      ? isPrivateMode
                        ? 'bg-indigo-500 text-white'
                        : 'bg-md3-secondaryContainer text-md3-onSecondaryContainer'
                      : isPrivateMode
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-gray-700 hover:bg-md3-surfaceContainer'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}

            {/* Toggles Globais de Som e Vibração para Todos os Lembretes */}
            <div className="flex items-center gap-1 ml-1 px-2 py-1 rounded-md3-full border border-md3-outlineVariant bg-md3-surfaceContainer/60">
              <button
                type="button"
                onClick={handleToggleGlobalSound}
                title="Ligar/Desligar Som Global de todos os lembretes"
                className={`p-1.5 rounded-full transition ${
                  notifSettings.globalSoundEnabled
                    ? 'bg-md3-primary text-white'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {notifSettings.globalSoundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleToggleGlobalVibration}
                title="Ligar/Desligar Vibração Global de todos os lembretes"
                className={`p-1.5 rounded-full transition ${
                  notifSettings.globalVibrationEnabled
                    ? 'bg-md3-primary text-white'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={togglePrivateArea}
              className={`ml-1 flex items-center gap-1.5 px-3.5 py-2 rounded-md3-full text-xs font-semibold border transition ${
                isPrivateMode
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'border-md3-outlineVariant hover:bg-md3-surfaceContainer text-gray-800'
              }`}
            >
              {isPrivateMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isPrivateMode ? 'Sair do Privado' : 'Espaço Privado'}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {activeTab === 'reports' ? (
          <ReportsPanel
            links={links}
            tasks={tasks}
            visits={visits}
            isPrivateUnlocked={isPrivateUnlocked}
          />
        ) : activeTab === 'tasks' ? (
          /* Aba Tarefas, TNE & Lembretes com Som e Vibração */
          <div className="space-y-6">
            {/* Controle Global de Som e Vibração */}
            <div className="bg-white p-4 rounded-md3-xl border border-md3-outlineVariant flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-md3-primary" />
                <div>
                  <h3 className="text-sm font-semibold">Notificações de Lembretes (Geral)</h3>
                  <p className="text-xs text-gray-500">
                    Controle mestre de som e vibração para todos os lembretes ou configure individualmente abaixo.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleGlobalSound}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md3-full text-xs font-semibold transition ${
                    notifSettings.globalSoundEnabled
                      ? 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {notifSettings.globalSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  Som Global: {notifSettings.globalSoundEnabled ? 'Ligado' : 'Desligado'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleGlobalVibration}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md3-full text-xs font-semibold transition ${
                    notifSettings.globalVibrationEnabled
                      ? 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Vibração Global: {notifSettings.globalVibrationEnabled ? 'Ligada' : 'Desligada'}
                </button>
              </div>
            </div>

            {alertFeedback && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-md3-lg text-xs font-medium">
                {alertFeedback}
              </div>
            )}

            <form
              onSubmit={handleAddTask}
              className="bg-white p-5 rounded-md3-xl border border-md3-outlineVariant shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-base">Nova Tarefa / Lembrete (Classificação TNE)</h2>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    liveClassification.category === 'TNE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {liveClassification.category === 'TNE'
                    ? 'TNE (Tarefa que Não é Estudo)'
                    : 'Tarefa de Estudo'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={taskTitleInput}
                  onChange={(e) => setTaskTitleInput(e.target.value)}
                  placeholder="Ex: Arrumar site para estudar depois, pagar conta, estudar capítulo 3..."
                  className="flex-1 rounded-md3-md border border-md3-outlineVariant px-4 py-2.5 text-sm focus:border-md3-primary focus:outline-none"
                />
                <input
                  type="time"
                  value={taskReminderTime}
                  onChange={(e) => setTaskReminderTime(e.target.value)}
                  title="Horário do lembrete"
                  className="rounded-md3-md border border-md3-outlineVariant px-3 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-md3-full bg-md3-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-95"
                >
                  <Plus className="w-4 h-4" />
                  Salvar Lembrete
                </button>
              </div>

              {/* Opções individuais de Som e Vibração para este novo lembrete */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-gray-500">{liveClassification.reason}</p>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 bg-md3-surfaceContainer px-3 py-1.5 rounded-md3-full">
                    <input
                      type="checkbox"
                      checked={taskSoundEnabled}
                      onChange={(e) => setTaskSoundEnabled(e.target.checked)}
                    />
                    <Volume2 className="w-3.5 h-3.5 text-md3-primary" />
                    Som neste lembrete
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 bg-md3-surfaceContainer px-3 py-1.5 rounded-md3-full">
                    <input
                      type="checkbox"
                      checked={taskVibrationEnabled}
                      onChange={(e) => setTaskVibrationEnabled(e.target.checked)}
                    />
                    <Smartphone className="w-3.5 h-3.5 text-md3-primary" />
                    Vibração neste lembrete
                  </label>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-md3-lg border border-md3-outlineVariant flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            task.category === 'TNE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {task.category}
                        </span>
                        {task.reminderTime && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-md3-surfaceContainer text-gray-700">
                            ⏰ {task.reminderTime}
                          </span>
                        )}
                        {task.postponeCount > 0 && (
                          <span className="text-[11px] text-gray-500">
                            Adiada {task.postponeCount}x
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>

                    {task.status !== 'completed' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handlePostponeTask(task.id)}
                          title="Adiar tarefa"
                          className="p-2 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          title="Concluir tarefa"
                          className="p-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700">Concluída</span>
                    )}
                  </div>

                  {/* Controles individuais de Som, Vibração e Teste de Alerta */}
                  <div className="pt-2 border-t border-md3-outlineVariant flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskNotification(task.id, 'soundEnabled')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition ${
                          task.soundEnabled
                            ? 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {task.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                        Som {task.soundEnabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleTaskNotification(task.id, 'vibrationEnabled')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition ${
                          task.vibrationEnabled
                            ? 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        Vibração {task.vibrationEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTestReminderAlert(task)}
                      className="flex items-center gap-1 text-md3-primary font-semibold hover:underline"
                    >
                      <Bell className="w-3 h-3" />
                      Testar Alerta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Workspace / Links e Mídias / Histórico */
          <>
            {/* Captura Inteligente com Aprendizado Contínuo Automático */}
            {activeTab !== 'history' && (
              <form
                onSubmit={handleSaveLink}
                className="bg-white p-5 rounded-md3-xl border border-md3-outlineVariant shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-md3-primary" />
                    <h2 className="font-semibold text-base">
                      Salvar Link (Aprende com suas Tags, O que é e Por que salvei)
                    </h2>
                    {learnedBadge && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {learnedBadge}
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-md3-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStudyInput}
                      onChange={(e) => setIsStudyInput(e.target.checked)}
                    />
                    <BookOpen className="w-4 h-4" />
                    Conteúdo de Estudo
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Cole a URL aqui — a IA analisa e preenche tags, 'O que é' e 'Por que salvei' automaticamente..."
                    className="flex-1 rounded-md3-md border border-md3-outlineVariant px-4 py-2.5 text-sm focus:border-md3-primary focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => runSmartAnalysis(urlInput)}
                    disabled={isAnalyzing}
                    className="rounded-md3-full bg-md3-primaryContainer text-md3-onPrimaryContainer px-5 py-2.5 text-xs font-semibold hover:brightness-95 transition"
                  >
                    {isAnalyzing ? 'Aprendendo do link...' : 'Re-analisar URL'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="Título do item"
                    className="rounded-md3-md border border-md3-outlineVariant px-3.5 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    placeholder="Tema"
                    className="rounded-md3-md border border-md3-outlineVariant px-3.5 py-2 text-sm"
                  />
                  <select
                    value={targetFolderId || currentFolderId || ''}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    className="rounded-md3-md border border-md3-outlineVariant px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="">Raiz (Sem Pasta)</option>
                    {scopedFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {getFolderPath(f.id, scopedFolders)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={whatIsInput}
                    onChange={(e) => setWhatIsInput(e.target.value)}
                    placeholder="O que é (sugerido pela IA)"
                    className="rounded-md3-md border border-md3-outlineVariant px-3.5 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={whySavedInput}
                    onChange={(e) => setWhySavedInput(e.target.value)}
                    placeholder="Por que salvei (aprendido do histórico)"
                    className="rounded-md3-md border border-md3-outlineVariant px-3.5 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="Tags (aprendidas)"
                      className="flex-1 rounded-md3-md border border-md3-outlineVariant px-3.5 py-2 text-sm"
                    />
                    <select
                      value={mediaTypeInput}
                      onChange={(e) => setMediaTypeInput(e.target.value as MediaType)}
                      className="rounded-md3-md border border-md3-outlineVariant px-2.5 py-2 text-xs bg-white"
                    >
                      <option value="artigo">Artigo</option>
                      <option value="video">Vídeo</option>
                      <option value="pdf">PDF</option>
                      <option value="ferramenta">Ferramenta</option>
                      <option value="curso">Curso</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-md3-full bg-md3-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-95"
                  >
                    <Plus className="w-4 h-4" />
                    Salvar no Mega Brain
                  </button>
                </div>
              </form>
            )}

            {/* Navegação de Pastas e Subpastas Recursivas */}
            {activeTab === 'workspace' && (
              <div className="bg-white p-5 rounded-md3-xl border border-md3-outlineVariant space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <button
                      onClick={() => setCurrentFolderId(null)}
                      className={`px-2.5 py-1 rounded-md3-sm font-medium ${
                        currentFolderId === null
                          ? 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                          : 'text-gray-600 hover:bg-md3-surfaceContainer'
                      }`}
                    >
                      Raiz
                    </button>
                    {breadcrumbs.map((bc) => (
                      <React.Fragment key={bc.id}>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <button
                          onClick={() => setCurrentFolderId(bc.id)}
                          className={`px-2.5 py-1 rounded-md3-sm font-medium ${
                            currentFolderId === bc.id
                              ? 'bg-md3-primaryContainer text-md3-onPrimaryContainer'
                              : 'text-gray-600 hover:bg-md3-surfaceContainer'
                          }`}
                        >
                          {bc.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Criar Pasta dentro de qualquer pasta */}
                  <form onSubmit={handleCreateSubfolder} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubfolderName}
                      onChange={(e) => setNewSubfolderName(e.target.value)}
                      placeholder={
                        currentFolderId ? 'Nova subpasta aqui...' : 'Nova pasta na raiz...'
                      }
                      className="rounded-md3-full border border-md3-outlineVariant px-3.5 py-1.5 text-xs focus:border-md3-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 rounded-md3-full bg-md3-surfaceContainerHigh px-3.5 py-1.5 text-xs font-semibold hover:bg-md3-primaryContainer transition"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      {currentFolderId ? 'Criar Subpasta' : 'Criar Pasta'}
                    </button>
                  </form>
                </div>

                {childFolders.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {childFolders.map((folder) => {
                      const subCount = scopedFolders.filter((f) => f.parentId === folder.id).length;
                      const itemCount = scopedLinks.filter(
                        (l) => l.status === 'active' && l.folderId === folder.id
                      ).length;
                      return (
                        <button
                          key={folder.id}
                          onClick={() => setCurrentFolderId(folder.id)}
                          className="flex items-center justify-between gap-2 p-3 rounded-md3-lg bg-md3-surfaceContainer hover:bg-md3-primaryContainer/60 text-left transition border border-transparent hover:border-md3-primary/30"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderTree className="w-5 h-5 text-md3-primary shrink-0" />
                            <span className="text-sm font-medium truncate">{folder.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 shrink-0">
                            {subCount > 0 ? `${subCount}p • ` : ''}
                            {itemCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Barra de Exibição Material Design 3 + Filtros */}
            <div className="bg-white p-4 rounded-md3-xl border border-md3-outlineVariant space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por título, tema, tag, pasta ou descrição..."
                    className="w-full rounded-md3-full bg-md3-surfaceContainer pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-md3-primary"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'only_name', label: 'Só Nome' },
                    { id: 'only_thumb', label: 'Só Thumb' },
                    { id: 'mini_all', label: 'Miniatura de Tudo' },
                    { id: 'detailed', label: 'Detalhado' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => applyDisplayPreset(mode.id as DisplayMode)}
                      className={`px-3 py-1.5 rounded-md3-full text-xs font-medium transition ${
                        displayMode === mode.id
                          ? 'bg-md3-primary text-white'
                          : 'bg-md3-surfaceContainer text-gray-700 hover:bg-md3-surfaceContainerHigh'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowDisplaySettings(!showDisplaySettings)}
                    className="p-2 rounded-full bg-md3-surfaceContainer hover:bg-md3-surfaceContainerHigh"
                    title="Editar exibição campo a campo"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  value={filterFolderId}
                  onChange={(e) => setFilterFolderId(e.target.value)}
                  className="rounded-md3-full border border-md3-outlineVariant px-3 py-1.5 text-xs bg-white"
                >
                  <option value="ALL">
                    {activeTab === 'all_media' ? 'Pasta: Todas' : 'Pasta: Atual / Todas'}
                  </option>
                  <option value="ROOT">Raiz (Sem Pasta)</option>
                  {scopedFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {getFolderPath(f.id, scopedFolders)}
                    </option>
                  ))}
                </select>

                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="rounded-md3-full border border-md3-outlineVariant px-3 py-1.5 text-xs bg-white"
                >
                  <option value="ALL">Tag: Todas</option>
                  {allAvailableTags.map((t) => (
                    <option key={t} value={t}>
                      #{t}
                    </option>
                  ))}
                </select>

                <select
                  value={filterMediaType}
                  onChange={(e) => setFilterMediaType(e.target.value)}
                  className="rounded-md3-full border border-md3-outlineVariant px-3 py-1.5 text-xs bg-white"
                >
                  <option value="ALL">Mídia: Todas</option>
                  <option value="artigo">Artigo</option>
                  <option value="video">Vídeo</option>
                  <option value="pdf">PDF</option>
                  <option value="ferramenta">Ferramenta</option>
                  <option value="curso">Curso</option>
                </select>

                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md3-full border border-md3-outlineVariant text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOnlyStudy}
                    onChange={(e) => setFilterOnlyStudy(e.target.checked)}
                  />
                  Somente Estudos
                </label>
              </div>

              {showDisplaySettings && (
                <div className="flex flex-wrap gap-3 pt-2 border-t border-md3-outlineVariant text-xs">
                  {(
                    [
                      ['showTitle', 'Título'],
                      ['showThumb', 'Thumbnail'],
                      ['showTheme', 'Tema'],
                      ['showWhatIs', 'O que é'],
                      ['showWhySaved', 'Por que salvei'],
                      ['showTags', 'Tags'],
                      ['showFolderPath', 'Caminho da Pasta']
                    ] as [keyof FieldVisibility, string][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldVisibility[key]}
                        onChange={(e) =>
                          setFieldVisibility({ ...fieldVisibility, [key]: e.target.checked })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Grade de Cards Material Design 3 */}
            {filteredLinks.length === 0 ? (
              <div className="bg-white p-10 rounded-md3-xl border border-dashed border-md3-outlineVariant text-center text-sm text-gray-500">
                <LayoutGrid className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                Nenhum link ou mídia encontrado neste filtro.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLinks.map((link) => (
                  <article
                    key={link.id}
                    className="bg-white rounded-md3-lg border border-md3-outlineVariant overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {fieldVisibility.showThumb && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => handleMarkLinkOpened(link.id)}
                          className="block relative group"
                        >
                          <img
                            src={link.thumbnailUrl}
                            alt={link.title}
                            className="w-full h-40 object-cover bg-md3-surfaceContainer"
                          />
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 opacity-90 group-hover:opacity-100">
                            <ExternalLink className="w-3 h-3" />
                            Abrir Conteúdo
                          </span>
                        </a>
                      )}

                      <div className="p-4 space-y-2">
                        {/* Badge clara da Pasta/Subpasta onde está salvo (destaque especial em Links e Mídias) */}
                        {(fieldVisibility.showFolderPath || activeTab === 'all_media') && (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-800 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md3-sm">
                            <FolderTree className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                            <span className="truncate">
                              Pasta: {getFolderPath(link.folderId, scopedFolders)}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5">
                          {fieldVisibility.showTheme && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-md3-primaryContainer text-md3-onPrimaryContainer">
                              {link.themeName}
                            </span>
                          )}
                          {link.isStudy && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Estudo
                            </span>
                          )}
                          <span className="text-[10px] uppercase text-gray-400 font-semibold ml-auto">
                            {link.mediaType}
                          </span>
                        </div>

                        {fieldVisibility.showTitle && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => handleMarkLinkOpened(link.id)}
                            className="block font-semibold text-sm text-gray-900 hover:text-md3-primary line-clamp-2"
                          >
                            {link.title}
                          </a>
                        )}

                        {fieldVisibility.showWhatIs && link.whatIs && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            <strong>O que é:</strong> {link.whatIs}
                          </p>
                        )}

                        {fieldVisibility.showWhySaved && link.whySaved && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            <strong>Por que salvei:</strong> {link.whySaved}
                          </p>
                        )}

                        {fieldVisibility.showTags && link.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {link.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] bg-md3-surfaceContainer text-gray-700 px-2 py-0.5 rounded-md3-sm"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rodapé de Ações: Mover para Pasta/Subpasta + Botão "Visto" após abrir */}
                    <div className="px-4 py-3 bg-md3-surfaceContainer/60 border-t border-md3-outlineVariant flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={link.folderId || ''}
                          onChange={(e) => handleMoveLinkToFolder(link.id, e.target.value || null)}
                          aria-label="Mover para pasta ou subpasta"
                          title="Mover para outra pasta ou subpasta"
                          className="max-w-[155px] rounded-md3-sm border border-md3-outlineVariant bg-white px-2 py-1 text-[11px]"
                        >
                          <option value="">Mover: Raiz (Sem Pasta)</option>
                          {scopedFolders.map((f) => (
                            <option key={f.id} value={f.id}>
                              {getFolderPath(f.id, scopedFolders)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleCreateFolderAndMove(link.id)}
                          title="Criar nova pasta/subpasta e mover"
                          className="p-1.5 rounded-md3-sm bg-white border border-md3-outlineVariant hover:bg-md3-primaryContainer"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-md3-primary" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {link.status === 'active' && link.openedAt && (
                          <button
                            type="button"
                            onClick={() => setLinkToConfirmView(link)}
                            className="flex items-center gap-1 rounded-md3-full px-3 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Visto
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteWithoutView(link.id)}
                          title="Excluir sem contabilizar visita"
                          className="p-1.5 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <PrivateVaultModal
        isOpen={showVaultModal}
        config={vaultConfig}
        onClose={() => setShowVaultModal(false)}
        onSaveConfig={(cfg) => {
          localDB.saveVault(cfg);
          setVaultConfig(cfg);
        }}
        onUnlock={() => {
          setIsPrivateUnlocked(true);
          setIsPrivateMode(true);
          setShowVaultModal(false);
          setCurrentFolderId(null);
        }}
      />

      <ViewConfirmModal
        link={linkToConfirmView}
        onClose={() => setLinkToConfirmView(null)}
        onConfirm={handleConfirmViewed}
      />
    </div>
  );
}
