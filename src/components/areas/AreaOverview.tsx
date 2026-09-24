import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Plus } from 'lucide-react';
import type { Area } from '../../types';
import { updateArea } from '../../stores/areasStore';
import { $projects } from '../../stores/projectsStore';
import { $tasks } from '../../stores/tasksStore';
import { countActiveTasksInArea, selectProjectsInArea } from '../../stores/areasSelectors';
import { openCreateProjectDialog, showAreaList, showAreaProjects } from '../../stores/areasWorkspaceStore';
import { AreaForm } from '../areas-projects/forms';
import { BackLink, EntityHeader, StatCard } from '../areas-projects/ui';
import { DeleteAreaDialog } from './DeleteAreaDialog';
import { ProjectListCard } from './ProjectListCard';

const PREVIEW_LIMIT = 5;

export function AreaOverview({ area }: { area: Area }) {
  const projects = useStore($projects);
  const tasks = useStore($tasks);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const areaProjects = selectProjectsInArea(projects, area.id);
  const taskCount = countActiveTasksInArea(area.id, projects, tasks);

  return (
    <section className="mx-auto max-w-3xl p-6 lg:p-8" aria-label={`Área ${area.name}`}>
      <BackLink className="mb-5 lg:hidden" onClick={showAreaList}>Áreas</BackLink>
      <EntityHeader
        eyebrow="Área"
        title={area.name}
        description={area.description || 'Organize projetos e tarefas relacionadas.'}
        color={area.color}
        editLabel="Editar área"
        deleteLabel="Excluir área"
        editing={editing}
        onEdit={() => setEditing(!editing)}
        onDelete={() => setDeleting(true)}
      />
      {deleting && <DeleteAreaDialog area={area} onClose={() => setDeleting(false)} />}
      {editing ? (
        <div className="mt-8">
          <AreaForm
            key={area.id}
            defaultValues={{ name: area.name, description: area.description ?? '', color: area.color }}
            onSubmit={async (input) => { await updateArea(area.id, input); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard value={areaProjects.length} label={areaProjects.length === 1 ? 'projeto' : 'projetos'} />
            <StatCard value={taskCount} label={taskCount === 1 ? 'tarefa ativa' : 'tarefas ativas'} />
          </div>
          <div className="mt-8 mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-theme-text">Projetos</h3>
            {areaProjects.length > 0 && (
              <button type="button" onClick={showAreaProjects} className="rounded text-sm font-medium text-theme-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent">Ver todos</button>
            )}
          </div>
          <ProjectListCard
            label={`Projetos de ${area.name}`}
            projects={areaProjects.slice(0, PREVIEW_LIMIT)}
            empty={(
              <li>
                <button type="button" onClick={() => openCreateProjectDialog(area.id)} className="flex w-full items-center gap-2 p-5 text-left text-sm text-theme-muted hover:bg-theme-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme-accent">
                  <Plus className="h-4 w-4" aria-hidden="true" />Criar o primeiro projeto
                </button>
              </li>
            )}
          />
        </>
      )}
    </section>
  );
}
