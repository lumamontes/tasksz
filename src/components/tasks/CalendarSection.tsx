/**
 * CalendarSection Component
 * Live date editing with the same date picker and date fields as task creation.
 */

import { addDays, formatDateLocal, getTodayString } from '../../utils/dateUtils';
import { updateTask } from '../../stores/tasksStore';
import type { Task } from '../../types';
import { TaskDatePicker } from './TaskDatePicker';

export function CalendarSection({ task }: { task: Task }) {
  return (
    <div className="mx-6 mb-6 rounded-xl border border-theme-border bg-theme-sidebar p-4">
      <div>
        <h3 className="text-sm font-medium text-theme-text">Quando?</h3>
        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateTask(task.id, { scheduledDate: getTodayString(), recurring: undefined })}
            className="cursor-pointer rounded-lg border border-theme-border bg-theme-bg px-3 py-1.5 text-xs font-medium text-theme-text hover:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >Hoje</button>
          <button
            type="button"
            onClick={() => updateTask(task.id, { scheduledDate: formatDateLocal(addDays(new Date(), 1)), recurring: undefined })}
            className="cursor-pointer rounded-lg border border-theme-border bg-theme-bg px-3 py-1.5 text-xs font-medium text-theme-text hover:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >Amanhã</button>
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1.5 block text-sm font-medium text-theme-text" htmlFor={`${task.id}-scheduled-date`}>Data</label>
        <TaskDatePicker
          id={`${task.id}-scheduled-date`}
          value={task.scheduledDate}
          onChange={(scheduledDate) => updateTask(task.id, { scheduledDate, recurring: undefined })}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-theme-text" htmlFor={`${task.id}-start-date`}>Início <span className="font-normal text-theme-muted">(opcional)</span></label>
          <TaskDatePicker id={`${task.id}-start-date`} value={task.startDate} onChange={(startDate) => updateTask(task.id, { startDate })} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-theme-text" htmlFor={`${task.id}-end-date`}>Fim <span className="font-normal text-theme-muted">(opcional)</span></label>
          <TaskDatePicker id={`${task.id}-end-date`} value={task.endDate} onChange={(endDate) => updateTask(task.id, { endDate })} />
        </div>
      </div>
    </div>
  );
}
