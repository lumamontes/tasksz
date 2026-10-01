import { useId, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Area } from '../../types';
import { $areas } from '../../stores/areasStore';
import { $projects } from '../../stores/projectsStore';
import { $tasks } from '../../stores/tasksStore';
import { summarizeAreaDeletion } from '../../domain/areasProjects/deletion';
import { removeArea } from '../../stores/areasWorkspaceStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { countLabel } from '../../utils/text';
import { DeleteTasksOption } from './DeleteTasksOption';

type ProjectsAction = 'delete' | 'move';

export function DeleteAreaDialog({ area, onClose }: { area: Area; onClose: () => void }) {
  const areas = useStore($areas);
  const projects = useStore($projects);
  const tasks = useStore($tasks);
  const [projectsAction, setProjectsAction] = useState<ProjectsAction>('delete');
  const [deleteTasks, setDeleteTasks] = useState(false);
  const { projects: areaProjects, taskCount, destinationAreas: otherAreas } = summarizeAreaDeletion(area.id, areas, projects, tasks);
  const [toAreaId, setToAreaId] = useState(otherAreas[0]?.id ?? '');
  const groupName = useId();
  const hasProjects = areaProjects.length > 0;

  const confirm = () => removeArea(area.id, projectsAction === 'move'
    ? { kind: 'move', toAreaId }
    : { kind: 'delete', deleteTasks });

  return (
    <ConfirmDialog
      title={`Excluir a área “${area.name}”?`}
      description={hasProjects
        ? `Esta área tem ${countLabel(areaProjects.length, 'projeto', 'projetos')}. Escolha o que fazer com ${areaProjects.length === 1 ? 'ele' : 'eles'}.`
        : 'Esta área não tem projetos. Esta ação não pode ser desfeita.'}
      confirmLabel="Excluir área"
      failureMessage="Não foi possível excluir a área."
      onConfirm={confirm}
      onCancel={onClose}
      confirmDisabled={projectsAction === 'move' && !toAreaId}
    >
      {hasProjects && (
        <fieldset className="space-y-3">
          <legend className="sr-only">O que fazer com os projetos</legend>
          <div className={`rounded-lg border p-3 ${projectsAction === 'delete' ? 'border-theme-accent bg-theme-accent/5' : 'border-theme-border'}`}>
            <label className="flex items-start gap-3">
              <input type="radio" name={groupName} checked={projectsAction === 'delete'} onChange={() => setProjectsAction('delete')} className="mt-1 accent-[var(--theme-accent)]" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-theme-text">Excluir os projetos</span>
                <span className="block break-words text-xs text-theme-muted">{areaProjects.map((project) => project.name).join(', ')}</span>
              </span>
            </label>
            {projectsAction === 'delete' && taskCount > 0 && (
              <DeleteTasksOption className="mt-3 ml-7" taskCount={taskCount} checked={deleteTasks} onChange={setDeleteTasks} scope={areaProjects.length === 1 ? 'deste projeto' : 'destes projetos'} />
            )}
          </div>
          <div className={`rounded-lg border p-3 ${projectsAction === 'move' ? 'border-theme-accent bg-theme-accent/5' : 'border-theme-border'} ${otherAreas.length === 0 ? 'opacity-60' : ''}`}>
            <label className="flex items-start gap-3">
              <input type="radio" name={groupName} checked={projectsAction === 'move'} disabled={otherAreas.length === 0} onChange={() => setProjectsAction('move')} className="mt-1 accent-[var(--theme-accent)]" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-theme-text">Mover os projetos para outra área</span>
                <span className="block text-xs text-theme-muted">
                  {otherAreas.length === 0 ? 'Crie outra área para poder mover os projetos.' : 'As tarefas continuam nos projetos.'}
                </span>
              </span>
            </label>
            {projectsAction === 'move' && otherAreas.length > 0 && (
              <div className="mt-3 ml-7">
                <label htmlFor={`${groupName}-destination`} className="mb-1 block text-xs font-medium text-theme-muted">Mover para</label>
                <select
                  id={`${groupName}-destination`}
                  value={toAreaId}
                  onChange={(event) => setToAreaId(event.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
                >
                  {otherAreas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </fieldset>
      )}
    </ConfirmDialog>
  );
}
