/**
 * TaskListPanel Component
 * Center panel showing tasks for a selected day. Three modes:
 *  - List mode (default): day navigation, search, filters, draggable tasks
 *  - Calendar mode: month grid + tasks for the chosen day
 *  - Pomodoro mode: integrated focus timer
 * Supports multi-select (Ctrl/Cmd+click or checkbox) and a right-click context
 * menu with batch actions (copy, archive).
 */

import { useStore } from '@nanostores/react';
import {
  $filteredTasks,
  $selectedTaskId,
  $taskFilter,
  $selectedDay,
  $tasks,
  $subtasks,
  selectTask,
  setTaskFilter,
  setSelectedDay,
  getTaskProgress,
  isTaskCompleted,
  toggleTaskCompleted,
  reorderTasks,
  archiveTasks,
  type TaskFilter,
} from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { openNewTask } from '../../stores/uiStore';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { openAreasWorkspace } from '../../stores/areasWorkspaceStore';
import { filterTasksByOrganization, groupTasksByOrganization, type TaskOrganizationView } from '../../stores/areasSelectors';
import { $leftPanelWidth } from '../../stores/layoutStore';
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { PomodoroTimer } from '../PomodoroTimer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { htmlToPlainText } from '../../utils/text';
import { tasksToMarkdown } from '../../utils/taskFormat';
import { addDays, formatDateLocal, formatDayLabelFull, getTodayString, isValidDateString, parseDateLocal } from '../../utils/dateUtils';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  CalendarDays,
  Timer,
  GripVertical,
  X,
  Copy,
  ArrowLeft,
  Archive,
} from 'lucide-react';
import type { Task } from '../../types';
import { $areas } from '../../stores/areasStore';
import { $projects } from '../../stores/projectsStore';

interface TaskListPanelProps {
  desktopResizable?: boolean;
}

const TaskDayPickerLazy = lazy(() => import('./TaskDayPicker').then((m) => ({ default: m.TaskDayPicker })));

const FILTER_OPTIONS: Array<{ id: TaskFilter; label: string }> = [
  { id: 'all', label: 'Ativas' },
  { id: 'in-progress', label: 'Em andamento' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'archived', label: 'Arquivadas' },
];

type ViewMode = 'list' | 'calendar' | 'pomodoro';

export function TaskListPanel({ desktopResizable = false }: TaskListPanelProps) {
  const filteredTasks = useStore($filteredTasks);
  const selectedTaskId = useStore($selectedTaskId);
  const selectedDay = useStore($selectedDay);
  const currentFilter = useStore($taskFilter);
  const settings = useStore($settings);
  const areas = useStore($areas);
  const projects = useStore($projects);
  const leftPanelWidth = useStore($leftPanelWidth);

  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [organizationView, setOrganizationView] = useState<TaskOrganizationView>('flat');
  const [areaFilterId, setAreaFilterId] = useState<string>('');
  const [projectFilterId, setProjectFilterId] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { requestConfirm, confirmDialog } = useConfirmDialog();

  const todayStr = getTodayString();

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2200);
  };

  // Clear stale selection when the selected task leaves the filtered list
  // (e.g. archived, deleted, or the day/filter changes)
  useEffect(() => {
    if (selectedTaskId && !filteredTasks.some((task) => task.id === selectedTaskId)) {
      selectTask(null);
    }
  }, [selectedTaskId, filteredTasks]);

  // Close the filter popover on outside click
  useEffect(() => {
    if (!filtersOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [filtersOpen]);

  // Close context menu on outside click / scroll
  useEffect(() => {
    if (!contextMenu) return;
    const onDown = (e: MouseEvent) => {
      if (contextMenuRef.current && contextMenuRef.current.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    const onScroll = () => setContextMenu(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [contextMenu]);

  // Escape clears multi-selection and context menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setSelectedTaskIds([]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const organizationTasks = filterTasksByOrganization(filteredTasks, projects, {
    areaId: areaFilterId || undefined,
    projectId: projectFilterId || undefined,
  });
  // Filter by search query
  const displayTasks = searchQuery.trim()
    ? organizationTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description
          ? htmlToPlainText(task.description).toLowerCase().includes(searchQuery.toLowerCase())
          : false)
      )
    : organizationTasks;

  const groupedTasks = groupTasksByOrganization(organizationView, displayTasks, areas, projects);

  const moveDay = (offset: number) => {
    const base = isValidDateString(selectedDay) ? parseDateLocal(selectedDay) : new Date();
    setSelectedDay(formatDateLocal(addDays(base, offset)));
  };

  // Keyboard navigation - Arrow Down / J
  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const nextIndex = Math.min(currentIndex + 1, displayTasks.length - 1);
        setFocusedIndex(nextIndex);
        selectTask(displayTasks[nextIndex].id);
      }
    },
    { key: 'ArrowDown', enabled: viewMode === 'list' && displayTasks.length > 0, ignoreInputs: true }
  );

  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const nextIndex = Math.min(currentIndex + 1, displayTasks.length - 1);
        setFocusedIndex(nextIndex);
        selectTask(displayTasks[nextIndex].id);
      }
    },
    { key: 'j', enabled: viewMode === 'list' && displayTasks.length > 0, ignoreInputs: true }
  );

  // Keyboard navigation - Arrow Up / K
  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const prevIndex = Math.max(currentIndex - 1, 0);
        setFocusedIndex(prevIndex);
        selectTask(displayTasks[prevIndex].id);
      }
    },
    { key: 'ArrowUp', enabled: viewMode === 'list' && displayTasks.length > 0, ignoreInputs: true }
  );

  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const prevIndex = Math.max(currentIndex - 1, 0);
        setFocusedIndex(prevIndex);
        selectTask(displayTasks[prevIndex].id);
      }
    },
    { key: 'k', enabled: viewMode === 'list' && displayTasks.length > 0, ignoreInputs: true }
  );

  // Keyboard navigation - Enter
  useKeyboardShortcut(
    () => {
      if (focusedIndex >= 0 && displayTasks[focusedIndex]) {
        selectTask(displayTasks[focusedIndex].id);
      }
    },
    { key: 'Enter', enabled: viewMode === 'list' && focusedIndex >= 0, ignoreInputs: true }
  );

  // Reset focused index when selection changes externally
  useEffect(() => {
    if (selectedTaskId) {
      const index = displayTasks.findIndex(t => t.id === selectedTaskId);
      if (index >= 0) {
        setFocusedIndex(index);
      }
    }
  }, [selectedTaskId, displayTasks]);

  const handleTaskClick = (taskId: string) => {
    selectTask(taskId);
    setFocusedIndex(displayTasks.findIndex(t => t.id === taskId));
  };

  const toggleMulti = (taskId: string) => {
    setSelectionMode(true);
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  };

  const allSelectedIn = (ids: string[]) =>
    ids.length > 0 && ids.every((id) => selectedTaskIds.includes(id));

  const toggleSelectAllFor = (ids: string[]) => {
    const visible = new Set(ids);
    const all = ids.length > 0 && ids.every((id) => selectedTaskIds.includes(id));
    setSelectedTaskIds((current) =>
      all
        ? current.filter((id) => !visible.has(id))
        : [...new Set([...current, ...ids])]
    );
  };

  const handleCardClick = (e: React.MouseEvent, taskId: string) => {
    if (e.metaKey || e.ctrlKey) {
      toggleMulti(taskId);
      return;
    }
    if (selectedTaskIds.length > 0) {
      setSelectedTaskIds([]);
    }
    handleTaskClick(taskId);
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setSelectionMode(true);
    setSelectedTaskIds((current) => (current.includes(taskId) ? current : [taskId]));
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    if (dragIndex === null) return;
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...displayTasks];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);

    // Persist the new relative order across the whole task list, keeping any
    // tasks outside the current view (archived/other days) in their place.
    const allTasks = $tasks.get();
    const byId = new Map(allTasks.map((t) => [t.id, t]));
    const ordered = reordered
      .map((t) => byId.get(t.id))
      .filter((t): t is Task => Boolean(t));
    const seen = new Set(ordered.map((t) => t.id));
    const rest = allTasks.filter((t) => !seen.has(t.id));
    reorderTasks([...ordered, ...rest]);

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // ---- Multi-select batch actions ----
  const menuTasks = $tasks.get().filter((t) => selectedTaskIds.includes(t.id));
  const allArchived = menuTasks.length > 0 && menuTasks.every((t) => t.archived);

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotice(message);
    } catch {
      showNotice('Não foi possível copiar.');
    }
    setContextMenu(null);
  };

  const handleBatchArchive = () => {
    const ids = selectedTaskIds;
    const archive = !allArchived;
    const apply = async () => {
      await archiveTasks(ids, archive);
      setSelectedTaskIds([]);
      showNotice(archive ? 'Arquivadas' : 'Desarquivadas');
    };
    setContextMenu(null);

    // Unarchiving restores tasks, so only archiving asks first.
    if (!archive) {
      apply().catch(() => showNotice('Não foi possível desarquivar.'));
      return;
    }
    requestConfirm({
      title: ids.length === 1 ? 'Arquivar tarefa?' : `Arquivar ${ids.length} tarefas?`,
      description: `${ids.length === 1 ? 'A tarefa deixará' : 'As tarefas deixarão'} a listagem padrão. Você ${ids.length === 1 ? 'a encontra' : 'as encontra'} depois no filtro Arquivadas.`,
      confirmLabel: 'Arquivar',
      failureMessage: 'Não foi possível arquivar as tarefas.',
      onConfirm: apply,
    });
  };

  const contextMenuStyle = contextMenu
    ? typeof window !== 'undefined'
      ? {
          left: Math.min(contextMenu.x, window.innerWidth - 252),
          top: Math.min(contextMenu.y, window.innerHeight - 360),
        }
      : { left: contextMenu.x, top: contextMenu.y }
    : undefined;

  const renderCalendarMode = () => (
    <div key="calendar" className="animate-[fadeIn_0.18s_ease-out]">
      <div className="border border-theme-border rounded-xl bg-theme-panel p-3">
        <Suspense fallback={<div className="h-64" />}>
          <TaskDayPickerLazy />
        </Suspense>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-theme-text mb-2">
          Tarefas para {formatDayLabelFull(selectedDay)}
        </h4>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-theme-muted">Nenhuma tarefa para este dia.</p>
            <p className="text-xs text-theme-muted mt-1">
              Tarefas sem data ficam aqui até você escolher um dia.
            </p>
          </div>
        ) : (
          <div>
             <div className="flex items-center justify-between gap-2 mb-2">
               <button
               type="button"
               onClick={() => { setSelectionMode((current) => !current); setSelectedTaskIds([]); }}
               className="text-xs font-medium text-theme-muted hover:text-theme-text"
               >{selectionMode ? 'Concluir seleção' : 'Selecionar tarefas'}</button>
               {selectionMode && <button
               type="button"
               onClick={() => toggleSelectAllFor(filteredTasks.map((t) => t.id))}
              aria-label={
                allSelectedIn(filteredTasks.map((t) => t.id))
                  ? 'Remover todas as tarefas da seleção'
                  : 'Selecionar todas as tarefas'
              }
              aria-pressed={allSelectedIn(filteredTasks.map((t) => t.id))}
              className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                allSelectedIn(filteredTasks.map((t) => t.id))
                  ? 'bg-theme-accent border-theme-accent text-white'
                  : 'border-theme-border hover:border-theme-accent'
              }`}
             >
               {allSelectedIn(filteredTasks.map((t) => t.id)) && <Check className="w-3 h-3" />}
               </button>}
            <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
              {selectedTaskIds.length > 0 && (
                <>
                  <span className="text-xs text-theme-muted">
                    {selectedTaskIds.length} selecionada(s)
                  </span>
                  <button
                    onClick={() => setSelectedTaskIds([])}
                    aria-label="Limpar seleção"
                    className="p-0.5 rounded text-theme-muted hover:text-theme-text transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
            </div>
            <div className="space-y-2">
            {filteredTasks.map((task) => {
              const progress = getTaskProgress(task.id);
              const isCompleted = progress.total > 0 && progress.percentage === 100;
              const isMulti = selectedTaskIds.includes(task.id);
              return (
                <div key={task.id} className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMulti(task.id);
                    }}
                    aria-label={isMulti ? 'Remover da seleção' : 'Adicionar à seleção'}
                    aria-pressed={isMulti}
                    className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                      isMulti
                        ? 'bg-theme-accent border-theme-accent text-white'
                        : 'border-theme-border hover:border-theme-accent'
                    }`}
                  >
                    {isMulti && <Check className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => handleCardClick(e, task.id)}
                    onContextMenu={(e) => handleContextMenu(e, task.id)}
                    className={`flex-1 min-w-0 text-left px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                      isMulti
                        ? 'bg-theme-accent/10 border-theme-border'
                        : isCompleted
                        ? 'bg-theme-sidebar border-theme-border text-theme-muted'
                        : 'bg-theme-panel border-theme-border hover:border-theme-accent/50 text-theme-text'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex-1 min-w-0 text-sm truncate ${
                          isCompleted ? 'line-through' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderListMode = () => (
    <div key="list" className="animate-[fadeIn_0.18s_ease-out]">
      {/* Search + Filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefa…"
            size="sm"
            fullWidth
            className="h-10"
          />
        </div>
        <div className="relative shrink-0" ref={filterRef}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-haspopup="menu"
            aria-expanded={filtersOpen}
            aria-label="Filtrar e organizar tarefas"
            className={`relative h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
              currentFilter !== 'all'
                ? 'border-theme-accent/50 text-theme-accent bg-theme-accent/10'
                : 'border-theme-border text-theme-muted hover:text-theme-text hover:bg-theme-bg'
            }`}
            >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Organizar</span>
            {currentFilter !== 'all' && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-theme-accent"
                aria-hidden="true"
              />
            )}
          </button>

          <span className="sr-only">Use o menu para filtrar ou organizar suas tarefas</span>

            {filtersOpen && (
               <div
                role="menu"
                aria-label="Tipo de tarefa"
                className="absolute right-0 mt-2 w-48 bg-theme-sidebar border border-theme-border rounded-xl shadow-lg z-20 p-1"
              >
                {FILTER_OPTIONS.map((filter) => (
                  <button
                    key={filter.id}
                    role="menuitemradio"
                    aria-checked={currentFilter === filter.id}
                    onClick={() => {
                      setTaskFilter(filter.id);
                      setFiltersOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent flex items-center justify-between ${
                      currentFilter === filter.id
                        ? 'text-theme-text bg-theme-accent/10'
                        : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
                    }`}
                  >
                    <span>{filter.label}</span>
                    {currentFilter === filter.id && (
                      <Check className="w-4 h-4 text-theme-accent" />
                    )}
                  </button>
                ))}
                <div className="my-1 border-t border-theme-border" />
                <p className="px-3 py-1.5 text-xs font-medium text-theme-muted">Exibir</p>
                {([
                  ['flat', 'Lista simples'],
                  ['area', 'Agrupar por área'],
                  ['area-project', 'Área e projeto'],
                  ['project', 'Agrupar por projeto'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    role="menuitemradio"
                    aria-checked={organizationView === id}
                    onClick={() => setOrganizationView(id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent flex items-center justify-between ${
                      organizationView === id ? 'text-theme-text bg-theme-accent/10' : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
                    }`}
                  >
                    <span>{label}</span>
                    {organizationView === id && <Check className="w-4 h-4 text-theme-accent" />}
                  </button>
                ))}
                <div className="my-1 border-t border-theme-border" />
                <p className="px-3 py-1.5 text-xs font-medium text-theme-muted">Áreas</p>
                {areas.length > 0 && (
                  <select
                    value={areaFilterId}
                    onChange={(event) => setAreaFilterId(event.target.value)}
                    aria-label="Filtrar por área"
                    className="mt-2 w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    <option value="">Todas as áreas</option>
                    {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                  </select>
                )}
                <p className="mt-2 px-3 py-1.5 text-xs font-medium text-theme-muted">Projetos</p>
                {projects.length > 0 && (
                  <select
                    value={projectFilterId}
                    onChange={(event) => setProjectFilterId(event.target.value)}
                    aria-label="Filtrar por projeto"
                    className="mt-2 w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    <option value="">Todos os projetos</option>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                )}
                <button
                  onClick={() => {
                    setFiltersOpen(false);
                    openAreasWorkspace({ areaId: areaFilterId || undefined, projectId: projectFilterId || undefined });
                  }}
                  className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-theme-muted hover:bg-theme-bg hover:text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  Gerenciar áreas e projetos
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Task List */}
      {displayTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-muted">
            {searchQuery.trim()
              ? 'Nenhuma tarefa encontrada'
              : selectedDay === todayStr
                ? 'Nenhuma tarefa para hoje'
                : 'Nenhuma tarefa para este dia'}
          </p>
          {searchQuery.trim() === '' && (
            <p className="text-xs text-theme-muted mt-1">
              Tarefas sem data ficam aqui até você escolher um dia.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
           <div className="mb-1 flex items-center justify-between">
             <button
               type="button"
               onClick={() => { setSelectionMode((current) => !current); setSelectedTaskIds([]); }}
               className="text-xs font-medium text-theme-muted hover:text-theme-text"
             >{selectionMode ? 'Concluir seleção' : 'Selecionar tarefas'}</button>
             {selectionMode && <button
               type="button"
               onClick={() => toggleSelectAllFor(displayTasks.map((t) => t.id))}
              aria-label={
                allSelectedIn(displayTasks.map((t) => t.id))
                  ? 'Remover todas as tarefas da seleção'
                  : 'Selecionar todas as tarefas'
              }
              aria-pressed={allSelectedIn(displayTasks.map((t) => t.id))}
              className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                allSelectedIn(displayTasks.map((t) => t.id))
                  ? 'bg-theme-accent border-theme-accent text-white'
                  : 'border-theme-border hover:border-theme-accent'
              }`}
             >
               {allSelectedIn(displayTasks.map((t) => t.id)) && <Check className="w-3 h-3" />}
             </button>}
            <div className="flex items-center justify-end gap-2">
              {selectedTaskIds.length > 0 && (
                <>
                  <span className="text-xs text-theme-muted">
                    {selectedTaskIds.length} selecionada(s)
                  </span>
                  <button
                    onClick={() => setSelectedTaskIds([])}
                    aria-label="Limpar seleção"
                    className="p-0.5 rounded text-theme-muted hover:text-theme-text transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
           </div>
          </div>
           {groupedTasks.map((group) => (
             <div key={group.key} className="contents">
               {group.label && (
                 <h3 className="col-span-3 flex items-center gap-2 pt-3 pb-1 text-sm font-medium text-theme-text">
                   <span className="w-2 h-2 rounded-full" aria-hidden="true" style={{ backgroundColor: group.color || 'var(--theme-accent)' }} />
                   {group.label}
                 </h3>
               )}
               {group.tasks.map((task) => {
             const index = displayTasks.findIndex((item) => item.id === task.id);
             const progress = getTaskProgress(task.id);
             const isCompleted = isTaskCompleted(task.id, task, $subtasks.get());
            const isSelected = task.id === selectedTaskId;
            const isMultiSelected = selectedTaskIds.includes(task.id);
            const isFocused = index === focusedIndex;

              return (
               <div key={task.id}>
                 <button
                   draggable
                   onDragStart={handleDragStart(index)}
                   onDragOver={handleDragOver(index)}
                   onDrop={handleDrop(index)}
                   onDragEnd={handleDragEnd}
                   onClick={(e) => handleCardClick(e, task.id)}
                   onContextMenu={(e) => handleContextMenu(e, task.id)}
                   className={`group grid ${selectionMode ? 'grid-cols-[1.25rem_1rem_minmax(0,1fr)_auto]' : 'grid-cols-[1rem_minmax(0,1fr)_auto]'} items-start gap-3 min-w-0 text-left px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-theme-accent cursor-grab active:cursor-grabbing ${
                     dragIndex === index
                       ? 'opacity-40'
                       : dragOverIndex === index && dragIndex !== null
                       ? 'border-theme-accent/60 ring-2 ring-theme-accent/20'
                       : isMultiSelected || isSelected
                       ? 'bg-theme-accent/10 border-theme-border'
                       : isCompleted
                       ? 'bg-theme-sidebar border-theme-border text-theme-muted'
                       : isFocused
                       ? 'bg-theme-bg border-theme-border text-theme-text'
                       : 'bg-theme-panel border-theme-border hover:border-theme-accent/50 text-theme-text'
                   }`}
                   aria-pressed={isSelected}
                   aria-grabbed={dragIndex === index}
                 >
                 {selectionMode && <span
                   role="checkbox"
                   aria-checked={isMultiSelected}
                   aria-label={isMultiSelected ? 'Remover da seleção' : 'Adicionar à seleção'}
                   onClick={(e) => { e.stopPropagation(); toggleMulti(task.id); }}
                   className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isMultiSelected ? 'bg-theme-accent border-theme-accent text-white' : 'border-theme-border hover:border-theme-accent'}`}
                 >{isMultiSelected && <Check className="w-3 h-3" />}</span>}
                 <span
                   role="button"
                   tabIndex={0}
                   onClick={(e) => {
                     e.stopPropagation();
                     toggleTaskCompleted(task.id);
                   }}
                   aria-label={isCompleted ? 'Marcar tarefa como não concluída' : 'Marcar tarefa inteira como concluída'}
                   className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${isCompleted ? 'bg-theme-accent border-theme-accent text-white' : 'border-theme-border hover:border-theme-accent'}`}
                 >
                   {isCompleted && <Check className="w-3 h-3" />}
                 </span>
                 <span aria-hidden="true" className="mt-1 text-theme-muted/60 group-hover:text-theme-muted transition-colors flex items-center justify-center"><GripVertical className="w-4 h-4" /></span>
                  <div className="min-w-0">
                     <div className="flex items-center gap-2">
                      <h3 className={`font-semibold text-base leading-snug line-clamp-2 ${
                        isCompleted ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </h3>
                    </div>
                    {task.description && (
                      <p className="text-sm text-theme-muted line-clamp-1 mt-0.5">
                        {htmlToPlainText(task.description)}
                      </p>
                    )}
                    {settings.showProgressBars && progress.total > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-theme-border rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isCompleted ? 'bg-theme-muted/50' : 'bg-theme-accent'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                            role="progressbar"
                            aria-valuenow={progress.percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${progress.completed} de ${progress.total} subtarefas concluídas`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 w-10 shrink-0 text-right text-xs text-theme-muted leading-6">
                    {progress.total > 0 ? `${progress.completed}/${progress.total}` : ''}
                  </span>
                </button>
              </div>
            );
               })}
             </div>
           ))}
        </div>
      )}
    </div>
  );

  return (
    <ErrorBoundary>
      <div
        style={desktopResizable ? { width: `${leftPanelWidth}px` } : undefined}
        className={`relative h-full flex flex-col bg-theme-sidebar border-r border-theme-border ${
          desktopResizable ? 'shrink-0' : 'flex-1'
        }`}
      >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-theme-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-theme-text">Tarefas</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => openNewTask()} size="small" aria-label="Nova tarefa">
              <Plus />
            </Button>
          </div>
        </div>

        <div className="flex items-center mb-3">
          {viewMode === 'list' ? (
            <div className="flex items-center">
              <button
                onClick={() => moveDay(-1)}
                aria-label="Dia anterior"
                className="p-1 rounded-md text-theme-muted/60 hover:text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="min-w-[6.5rem] text-center text-sm font-medium text-theme-text truncate">
                {formatDayLabelFull(selectedDay)}
              </h3>
              <button
                onClick={() => moveDay(1)}
                aria-label="Próximo dia"
                className="p-1 rounded-md text-theme-muted/60 hover:text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {selectedDay !== todayStr && (
                <button
                  onClick={() => setSelectedDay(todayStr)}
                  className="ml-1.5 px-2 py-0.5 text-xs font-medium text-theme-accent hover:bg-theme-bg rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  voltar para hoje
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <button
                onClick={() => setViewMode('list')}
                aria-label="Voltar à lista de tarefas"
                className="p-1.5 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="ml-1 text-sm font-medium text-theme-muted">
                {viewMode === 'calendar' ? 'Calendário' : 'Pomodoro'}
              </span>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode(viewMode === 'pomodoro' ? 'list' : 'pomodoro')}
              aria-label={viewMode === 'pomodoro' ? 'Fechar pomodoro' : 'Abrir pomodoro'}
              aria-pressed={viewMode === 'pomodoro'}
              className={`p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                viewMode === 'pomodoro'
                  ? 'text-theme-accent bg-theme-accent/10'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
              }`}
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              aria-label={viewMode === 'calendar' ? 'Fechar calendário' : 'Abrir calendário'}
              aria-pressed={viewMode === 'calendar'}
              className={`p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                viewMode === 'calendar'
                  ? 'text-theme-accent bg-theme-accent/10'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode content */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {viewMode === 'calendar'
          ? renderCalendarMode()
          : viewMode === 'pomodoro'
            ? <PomodoroTimer />
            : renderListMode()}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          role="menu"
          aria-label="Ações em lote"
          style={contextMenuStyle}
          className="fixed z-50 w-60 bg-theme-sidebar border border-theme-border rounded-xl shadow-2xl p-1.5 text-sm"
        >
          <p className="px-3 py-1.5 text-xs font-medium text-theme-muted border-b border-theme-border mb-1">
            {selectedTaskIds.length} tarefa(s) selecionada(s)
          </p>

          <button
            role="menuitem"
            onClick={() => copyToClipboard(menuTasks.map((t) => t.title).join('\n'), 'Títulos copiados')}
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            <Copy className="w-4 h-4 text-theme-muted" />
            Copiar títulos
          </button>
          <button
            role="menuitem"
            onClick={() =>
              copyToClipboard(
                menuTasks
                  .map((t) => (t.description ? htmlToPlainText(t.description) : ''))
                  .filter(Boolean)
                  .join('\n\n'),
                'Descrições copiadas'
              )
            }
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            <Copy className="w-4 h-4 text-theme-muted" />
            Copiar descrições
          </button>
          <button
            role="menuitem"
            onClick={() => copyToClipboard(tasksToMarkdown(menuTasks), 'Conteúdo formatado copiado')}
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            <Copy className="w-4 h-4 text-theme-muted" />
            Copiar conteúdo
          </button>

          <div className="my-1 border-t border-theme-border" />

          <button
            role="menuitem"
            onClick={handleBatchArchive}
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            <Archive className="w-4 h-4 text-theme-muted" />
            {allArchived ? 'Desarquivar' : 'Arquivar'}
          </button>
        </div>
      )}


      {confirmDialog}

      {/* Toast */}
      {notice && (
        <div
          role="status"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-theme-text text-theme-sidebar rounded-lg text-sm font-medium shadow-lg animate-[fadeIn_0.2s_ease-out]"
        >
          {notice}
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
