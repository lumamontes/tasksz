import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { Controller, useForm } from 'react-hook-form';
import type { Task } from '../../types';
import { taskDraftSchema, type TaskDraft } from '../../domain/tasks/schemas';
import { Button } from '../ui/Button';
import { $tasks, addTask, updateTask, selectTask, addSubtask } from '../../stores/tasksStore';
import { $projects } from '../../stores/projectsStore';
import { $taskForm, closeTaskForm } from '../../stores/uiStore';
import { addDays, formatDateLocal, getTodayString } from '../../utils/dateUtils';
import { TaskDatePicker } from './TaskDatePicker';
import { TaskOrganizationFields } from './TaskOrganizationFields';
import { ChevronDown, Plus, X } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';

export function TaskForm() {
  const taskForm = useStore($taskForm);
  const tasks = useStore($tasks);
  const projects = useStore($projects);

  const editingTask =
    taskForm?.mode === 'edit' ? tasks.find((t) => t.id === taskForm.taskId) : undefined;
  const editingAreaId = editingTask?.projectId ? projects.find((project) => project.id === editingTask.projectId)?.areaId : undefined;

  const form = useForm<TaskDraft>({
    resolver: zodResolver(taskDraftSchema),
    defaultValues: { title: '', description: '', scheduledDate: taskForm?.mode === 'new' ? taskForm.scheduledDate : undefined },
  });
  const scheduledDate = form.watch('scheduledDate');
  const [error, setError] = useState('');
  const [organizationAreaId, setOrganizationAreaId] = useState<string | undefined>(undefined);
  const validationError = error || form.formState.errors.title?.message || form.formState.errors.endDate?.message;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // A identidade da tarefa define o limite para reiniciar o rascunho.
  useEffect(() => {
    if (editingTask) {
       form.reset({
         title: editingTask.title,
         scheduledDate: editingTask.scheduledDate || undefined,
         startDate: editingTask.startDate || undefined,
         endDate: editingTask.endDate || undefined,
         description: editingTask.description || '',
          projectId: editingTask.projectId,
        });
        setOrganizationAreaId(editingAreaId);
       setNewSubtasks([]);
    } else if (taskForm?.mode === 'new') {
      form.reset({ title: '', description: '', scheduledDate: taskForm.scheduledDate });
      setOrganizationAreaId(undefined);
    }
    setDetailsOpen(false);
    setSubtasksOpen(false);
    setSubtaskInput('');
    setError('');
  }, [editingAreaId, editingTask, taskForm?.mode, taskForm?.mode === 'new' ? taskForm.scheduledDate : undefined, form]);

  const handleSubmit = async (draft: TaskDraft) => {
    setError('');

    const data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'> = {
      title: draft.title,
      description: draft.description || undefined,
      scheduledDate: draft.scheduledDate || undefined,
      startDate: draft.startDate || undefined,
      endDate: draft.endDate || undefined,
      archived: editingTask?.archived || false,
      completed: editingTask?.completed,
      projectId: draft.projectId,
    };

    try {
      if (editingTask) {
        updateTask(editingTask.id, data);
      } else {
      let newTaskId: string;
        newTaskId = await addTask(data);

        // As subtarefas só existem depois que a tarefa pai foi persistida.
        await Promise.all(newSubtasks.filter(Boolean).map((subtaskTitle, index) => addSubtask(newTaskId, subtaskTitle, index)));
        selectTask(newTaskId);
      }
    } catch {
      setError('Não foi possível salvar a tarefa. Tente novamente.');
      return;
    }
    closeTaskForm();
  };

  const quickDateClasses = (isActive: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
      isActive
        ? 'bg-theme-accent text-white'
        : 'bg-theme-bg text-theme-text border border-theme-border hover:border-theme-accent'
    }`;

  const addSubtaskInput = () => {
    const value = subtaskInput.trim();
    if (!value) return;
    setNewSubtasks((prev) => [...prev, value]);
    setSubtaskInput('');
    if (subtaskInputRef.current) subtaskInputRef.current.focus();
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-theme-sidebar rounded-xl p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-theme-text">
          {editingTask ? 'Editar tarefa' : 'Nova tarefa'}
        </h2>
        {!editingTask && (
          <p className="text-sm text-theme-muted mt-1">
            Do jeito que der. Dá para mudar depois.
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Título sempre visível. */}
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-theme-text mb-2">
            O que você precisa fazer?
          </label>
          <input
            id="task-title"
            type="text"
             {...form.register('title')}
            className={`
              w-full px-4 py-3 text-lg border rounded-lg transition-colors bg-theme-bg text-theme-text
              focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none
             ${validationError ? 'border-red-300 bg-red-50' : 'border-theme-border'}
            `}
            placeholder="ex.: Revisar a proposta do projeto"
            autoFocus
            maxLength={200}
          />
           {validationError && (
             <p className="mt-1 text-sm text-red-600" role="alert">
               {validationError}
            </p>
          )}
        </div>

        {/* Data sempre visível. */}
          <div>
            <label htmlFor="task-date" className="block text-sm font-medium text-theme-text mb-2">
            Quando? <span className="text-theme-muted font-normal">(opcional)</span>
          </label>
          <div className="flex items-center gap-1.5 mb-2">
            <button
              type="button"
               onClick={() => form.setValue('scheduledDate', getTodayString())}
              className={quickDateClasses(scheduledDate === getTodayString())}
            >
              Hoje
            </button>
            <button
              type="button"
               onClick={() => form.setValue('scheduledDate', formatDateLocal(addDays(new Date(), 1)))}
              className={quickDateClasses(
                scheduledDate === formatDateLocal(addDays(new Date(), 1))
              )}
            >
              Amanhã
            </button>
          </div>
             <Controller control={form.control} name="scheduledDate" render={({ field }) => <TaskDatePicker id="task-date" value={field.value} onChange={field.onChange} />} />
          </div>

            <Controller control={form.control} name="projectId" render={({ field: projectField }) => (
              <TaskOrganizationFields key={editingTask?.id || 'new-task'} areaId={organizationAreaId} projectId={projectField.value} onAreaChange={(areaId) => { setOrganizationAreaId(areaId); projectField.onChange(undefined); }} onProjectChange={projectField.onChange} />
            )} />

        {/* Detalhes opcionais em um acordeão. */}
        <div className="pt-1 border-t border-theme-border">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            className="w-full flex items-center justify-between py-3 text-sm font-medium text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg"
          >
            <span>
              Mais detalhes{' '}
              <span className="text-theme-muted font-normal">(opcional)</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-theme-muted transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {detailsOpen && (
            <div className="space-y-4 pb-3">
              {/* Descrição. */}
              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-theme-text mb-2">
                  Descrição
                </label>
                <textarea
                  id="task-description"
                   {...form.register('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-theme-border rounded-lg transition-colors resize-none bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
                  placeholder="Notas, contexto, links..."
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">
                  Período <span className="text-theme-muted font-normal">(opcional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs text-theme-muted mb-1">Início</span>
                   <Controller control={form.control} name="startDate" render={({ field }) => <TaskDatePicker id="task-start-date" value={field.value} onChange={field.onChange} />} />
                  </div>
                  <div>
                    <span className="block text-xs text-theme-muted mb-1">Fim</span>
                   <Controller control={form.control} name="endDate" render={({ field }) => <TaskDatePicker id="task-end-date" value={field.value} onChange={field.onChange} />} />
                  </div>
                </div>
              </div>

              {/* Subtarefas durante a criação. */}
              {!editingTask && (
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    Subtarefas <span className="text-theme-muted font-normal">(opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSubtasksOpen((open) => !open)}
                    aria-expanded={subtasksOpen}
                    className="flex items-center gap-1.5 text-sm text-theme-muted hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg px-1 py-1"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Adicionar subtarefas
                  </button>

                  {subtasksOpen && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          ref={subtaskInputRef}
                          type="text"
                          value={subtaskInput}
                          onChange={(e) => setSubtaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSubtaskInput();
                            }
                            if (e.key === 'Escape') {
                              setSubtaskInput('');
                            }
                          }}
                          placeholder="Um passo de cada vez..."
                          maxLength={200}
                          autoFocus
                          className="flex-1 text-sm text-theme-text bg-theme-bg border border-theme-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
                        />
                        <button
                          type="button"
                          onClick={addSubtaskInput}
                          aria-label="Adicionar subtarefa"
                          className="p-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {newSubtasks.length > 0 && (
                        <ul className="space-y-1.5">
                          {newSubtasks.map((subtaskTitle, index) => (
                            <li
                              key={`${subtaskTitle}-${index}`}
                              className="flex items-center gap-2 text-sm text-theme-text bg-theme-bg border border-theme-border rounded-lg px-3 py-2"
                            >
                              <span className="flex-1 min-w-0 truncate">{subtaskTitle}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewSubtasks((prev) => prev.filter((_, i) => i !== index))
                                }
                                aria-label={`Remover subtarefa ${subtaskTitle}`}
                                className="p-1 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-theme-accent"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações do formulário. */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-theme-border">
          <Button
            type="button"
            onClick={closeTaskForm}
            variant="ghost"
            size="medium"
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="medium"
            className="flex-1 sm:flex-none sm:min-w-[120px]"
          >
            {editingTask ? 'Salvar alterações' : 'Criar tarefa'}
          </Button>
        </div>
      </form>
    </div>
  );
}
