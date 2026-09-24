import { useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Project } from '../../types';
import { $tasks } from '../../stores/tasksStore';
import { removeProject } from '../../stores/areasWorkspaceStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DeleteTasksOption } from './DeleteTasksOption';

export function DeleteProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const tasks = useStore($tasks);
  const [deleteTasks, setDeleteTasks] = useState(false);
  const taskCount = tasks.filter((task) => task.projectId === project.id).length;

  return (
    <ConfirmDialog
      title={`Excluir o projeto “${project.name}”?`}
      description={taskCount > 0 ? 'Esta ação não pode ser desfeita.' : 'Este projeto não tem tarefas. Esta ação não pode ser desfeita.'}
      confirmLabel="Excluir projeto"
      failureMessage="Não foi possível excluir o projeto."
      onConfirm={() => removeProject(project.id, { deleteTasks })}
      onCancel={onClose}
    >
      {taskCount > 0 && <DeleteTasksOption taskCount={taskCount} checked={deleteTasks} onChange={setDeleteTasks} scope="deste projeto" />}
    </ConfirmDialog>
  );
}
