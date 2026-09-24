import { useId, useState, type KeyboardEvent } from 'react';
import type { Area, Project, Task } from '../../types';
import type { ProjectTab } from '../../stores/areasSelectors';
import { saveProject, setProjectTab, showAreaOverview } from '../../stores/areasWorkspaceStore';
import { ProjectForm } from '../areas-projects/forms';
import { BackLink, EntityHeader } from '../areas-projects/ui';
import { countLabel } from '../../utils/text';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { ProjectTaskList } from './ProjectTaskList';

const TABS: Array<{ id: ProjectTab; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'tasks', label: 'Tarefas' },
];

export function ProjectDetail({ area, project, tab, tasks }: {
  area: Area;
  project: Project;
  tab: ProjectTab;
  tasks: Task[];
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tabsId = useId();

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const index = TABS.findIndex((item) => item.id === tab);
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setProjectTab(next.id);
    document.getElementById(`${tabsId}-${next.id}-tab`)?.focus();
  };

  return (
    <section className="mx-auto max-w-3xl p-6 lg:p-8" aria-label={`Projeto ${project.name}`}>
      <BackLink onClick={showAreaOverview}>{area.name}</BackLink>
      <EntityHeader
        eyebrow="Projeto"
        title={project.name}
        description={project.description || 'Sem descrição.'}
        editLabel="Editar projeto"
        deleteLabel="Excluir projeto"
        editing={editing}
        onEdit={() => setEditing(!editing)}
        onDelete={() => setDeleting(true)}
      />
      {deleting && <DeleteProjectDialog project={project} onClose={() => setDeleting(false)} />}
      {editing ? (
        <div className="mt-8">
          <ProjectForm
            key={project.id}
            defaultValues={{ name: project.name, description: project.description ?? '', areaId: project.areaId }}
            onSubmit={async (input) => { await saveProject(project.id, input); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Seções do projeto" className="mt-8 flex gap-5 border-b border-theme-border">
            {TABS.map((item) => (
              <button
                key={item.id}
                id={`${tabsId}-${item.id}-tab`}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`${tabsId}-panel`}
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => setProjectTab(item.id)}
                onKeyDown={onTabKeyDown}
                className={`border-b-2 pb-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent ${tab === item.id ? 'border-theme-accent text-theme-text' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {item.label}
                {item.id === 'tasks' && <span className="ml-1 text-xs text-theme-muted"><span className="sr-only">, </span>{tasks.length}</span>}
              </button>
            ))}
          </div>
          <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}-tab`} className="mt-6">
            {tab === 'tasks' ? (
              <ProjectTaskList tasks={tasks} label={`Tarefas de ${project.name}`} />
            ) : (
              <div className="rounded-xl border border-theme-border bg-theme-bg p-5">
                <p className="text-sm text-theme-muted">Este projeto tem {countLabel(tasks.length, 'tarefa ativa', 'tarefas ativas')}.</p>
                <button type="button" onClick={() => setProjectTab('tasks')} className="mt-4 rounded text-sm font-medium text-theme-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent">Ver tarefas</button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
