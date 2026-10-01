import { useStore } from '@nanostores/react';
import type { ReactNode } from 'react';
import { FolderKanban } from 'lucide-react';
import type { Project } from '../../types';
import { $tasks } from '../../stores/tasksStore';
import { countActiveTasksByProject } from '../../stores/areasSelectors';
import { openProject } from '../../stores/areasWorkspaceStore';
import { ListCard, ListRow } from '../areas-projects/ui';
import { countLabel } from '../../utils/text';

export function ProjectListCard({ projects, label, empty }: {
  projects: Project[];
  label: string;
  empty: ReactNode;
}) {
  const tasks = useStore($tasks);
  const taskCounts = countActiveTasksByProject(tasks);

  return (
    <ListCard label={label}>
      {projects.map((project) => (
        <ListRow
          key={project.id}
          onClick={() => openProject(project.id)}
          leading={<FolderKanban className="h-4 w-4 shrink-0 text-theme-muted" aria-hidden="true" />}
          title={project.name}
          meta={countLabel(taskCounts.get(project.id) ?? 0, 'tarefa', 'tarefas')}
        />
      ))}
      {projects.length === 0 && empty}
    </ListCard>
  );
}
