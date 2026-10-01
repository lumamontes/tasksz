/**
 * TaskSummaryStrip Component
 * Live organization fields shown after a task's subtasks.
 */

import type { Task } from "../../types";
import { setTaskProject } from "../../stores/tasksStore";
import { TaskOrganizationFields } from "./TaskOrganizationFields";

export function TaskSummaryStrip({ task }: { task: Task }) {
  return (
    <div className="mx-6 mb-6 rounded-xl border border-theme-border bg-theme-sidebar px-4 py-3">
      <TaskOrganizationFields
        projectId={task.projectId}
        onProjectChange={(projectId) => setTaskProject(task.id, projectId)}
      />
    </div>
  );
}
