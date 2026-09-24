/**
 * AreaDetailPane (island)
 * Detail side of the Areas workspace: Area overview, the Area's Projects,
 * a Project, or a Project task. Also hosts the creation dialogs.
 */

import { lazy, Suspense, useEffect, useRef } from 'react';
import { isRendered } from '../../utils/accessibility';
import { preloadWhenIdle } from '../../utils/preload';
import { useStore } from '@nanostores/react';
import { $areas, addSuggestedAreas, SUGGESTED_AREA_NAMES } from '../../stores/areasStore';
import {
  $areasDialog,
  $resolvedAreasWorkspace,
  closeAreasDialog,
  createArea,
  createProject,
  openCreateAreaDialog,
  openProjectTask,
} from '../../stores/areasWorkspaceStore';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { AreaForm, ProjectForm } from '../areas-projects/forms';
import { BackLink } from '../areas-projects/ui';
import { Dialog } from '../ui/Dialog';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { AreaOverview } from './AreaOverview';
import { AreaProjectList } from './AreaProjectList';
import { ProjectDetail } from './ProjectDetail';

const loadTaskDetailPanel = () => import('../tasks/TaskDetailPanel');
const TaskDetailPanelLazy = lazy(() => loadTaskDetailPanel().then((m) => ({ default: m.TaskDetailPanel })));

export function AreaDetailPane() {
  const { area, view, project, projectTab, projectTasks, task, pane } = useStore($resolvedAreasWorkspace);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => preloadWhenIdle(loadTaskDetailPanel), []);
  const viewKey = [pane, area?.id, view, project?.id, projectTab, task?.id].join('/');

  // Changing views unmounts the control that was clicked; continue from the
  // new view's heading instead of dropping focus to the page.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      const active = document.activeElement;
      if (!container || !isRendered(container)) return;
      if (active && active !== document.body && isRendered(active)) return;
      container.querySelector<HTMLElement>('h2, #task-detail-heading')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [viewKey]);

  let content;
  if (!area) {
    content = <AreasEmptyState />;
  } else if (project && task) {
    content = (
      <div className="flex h-full flex-col">
        <div className="border-b border-theme-border px-6 py-3">
          <BackLink className="" onClick={() => openProjectTask(null)}>{project.name}</BackLink>
        </div>
        <div className="min-h-0 flex-1">
          <ErrorBoundary>
            <Suspense fallback={<p className="p-6 text-sm text-theme-muted">Carregando…</p>}>
              <TaskDetailPanelLazy key={task.id} taskId={task.id} navigationTasks={projectTasks} onSelectTask={openProjectTask} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    );
  } else if (project) {
    content = <ProjectDetail area={area} project={project} tab={projectTab} tasks={projectTasks} />;
  } else if (view === 'projects') {
    content = <AreaProjectList area={area} />;
  } else {
    content = <AreaOverview key={area.id} area={area} />;
  }

  return (
    <div ref={containerRef} className="h-full" data-areas-pane={pane}>
      {content}
      <AreasDialogs />
    </div>
  );
}

function AreasEmptyState() {
  const { requestConfirm, confirmDialog } = useConfirmDialog();

  const addSuggestions = () => requestConfirm({
    title: 'Usar áreas sugeridas?',
    description: `Vamos criar: ${SUGGESTED_AREA_NAMES.join(', ')}. Você pode editar ou excluir cada uma depois.`,
    confirmLabel: 'Criar áreas',
    tone: 'default',
    failureMessage: 'Não foi possível criar as áreas sugeridas.',
    onConfirm: addSuggestedAreas,
  });

  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div className="max-w-sm">
        <h2 tabIndex={-1} className="text-lg font-semibold text-theme-text focus:outline-none">Comece por uma área</h2>
        <p className="mt-1 text-sm text-theme-muted">Áreas agrupam projetos e deixam seu trabalho mais fácil de encontrar. Elas são opcionais.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={openCreateAreaDialog} className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2">Nova área</button>
          <button type="button" onClick={addSuggestions} className="rounded-lg border border-theme-border px-4 py-2 text-sm font-medium text-theme-text hover:bg-theme-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent">Usar sugestões</button>
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}

function AreasDialogs() {
  const dialog = useStore($areasDialog);
  const areas = useStore($areas);

  if (dialog?.kind === 'create-area') {
    return (
      <Dialog title="Nova área" onClose={closeAreasDialog}>
        <AreaForm onSubmit={createArea} onCancel={closeAreasDialog} submitLabel="Criar área" />
      </Dialog>
    );
  }

  if (dialog?.kind === 'create-project') {
    const parentArea = areas.find((item) => item.id === dialog.areaId);
    return (
      <Dialog title="Novo projeto" subtitle={parentArea?.name} onClose={closeAreasDialog}>
        <ProjectForm defaultValues={{ areaId: dialog.areaId }} onSubmit={createProject} onCancel={closeAreasDialog} submitLabel="Criar projeto" />
      </Dialog>
    );
  }

  return null;
}
