/**
 * TaskSummaryStrip Component
 * Small, minimal summary strip with calendar info
 */

import { useState } from 'react';
import type { Task } from '../../types';
import { useStore } from '@nanostores/react';
import { isValidDateString, parseDateLocal } from '../../utils/dateUtils';
import { setTaskProject } from '../../stores/tasksStore';
import { areaOfTask, projectAfterAreaChange } from '../../stores/areasSelectors';
import { TaskOrganizationFields } from './TaskOrganizationFields';
import { $projects } from '../../stores/projectsStore';

interface TaskSummaryStripProps {
  task: Task;
}

export function TaskSummaryStrip({ task }: TaskSummaryStripProps) {
  const projects = useStore($projects);
  const projectAreaId = areaOfTask(task, projects);
  // An Area picked before its Project is a draft: it only lets the Project
  // field appear, since a task belongs to an Area through its Project.
  const [draftAreaId, setDraftAreaId] = useState<string | undefined>();

  const changeArea = (areaId: string | undefined) => {
    setDraftAreaId(areaId);
    setTaskProject(task.id, projectAfterAreaChange(task.projectId, areaId, projects));
  };

  return (
      <div className="px-6 py-2 bg-theme-sidebar border-b border-theme-border flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-theme-muted">
      <TaskOrganizationFields areaId={projectAreaId ?? draftAreaId} projectId={task.projectId} onAreaChange={changeArea} onProjectChange={(projectId) => setTaskProject(task.id, projectId)} />
      {(task.startDate || task.scheduledDate || task.endDate) && <div className="flex items-center gap-2 min-w-0">
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="break-words">
          {task.startDate && isValidDateString(task.startDate) ? parseDateLocal(task.startDate).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }) : task.scheduledDate && isValidDateString(task.scheduledDate) ? parseDateLocal(task.scheduledDate).toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          }) : 'Sem início'}
          {task.endDate && isValidDateString(task.endDate) && ` até ${parseDateLocal(task.endDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        </span>
      </div>}
    </div>
  );
}
