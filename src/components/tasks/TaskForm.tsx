/**
 * TaskForm Component
 * Store-driven form island: opens via $taskForm (new task or edit),
 * prefills the date from the selected day when browsing another day.
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import type { Task } from '../../types';
import { Button } from '../ui/Button';
import { $tasks, addTask, updateTask, selectTask } from '../../stores/tasksStore';
import { $taskForm, closeTaskForm } from '../../stores/uiStore';
import { addDays, formatDateLocal, getTodayString } from '../../utils/dateUtils';
import { X } from 'lucide-react';

export function TaskForm() {
  const form = useStore($taskForm);
  const tasks = useStore($tasks);

  const editingTask =
    form?.mode === 'edit' ? tasks.find((t) => t.id === form.taskId) : undefined;

  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string | undefined>(() =>
    form?.mode === 'new' ? form.scheduledDate : undefined
  );
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Initialize form with task data when editing
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setScheduledDate(editingTask.scheduledDate || undefined);
      setDescription(editingTask.description || '');
    }
  }, [editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Digite um título para a tarefa.');
      return;
    }

    const data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledDate: scheduledDate || undefined,
      archived: editingTask?.archived || false,
    };

    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      const newTaskId = addTask(data);
      selectTask(newTaskId);
    }
    closeTaskForm();
  };

  const quickDateClasses = (isActive: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
      isActive
        ? 'bg-theme-accent text-white'
        : 'bg-theme-bg text-theme-text border border-theme-border hover:border-theme-accent'
    }`;

  return (
    <div className="bg-theme-sidebar rounded-xl border border-theme-border p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-theme-text">
          {editingTask ? 'Editar tarefa' : 'Nova tarefa'}
        </h2>
        {!editingTask && (
          <p className="text-sm text-theme-muted mt-1">
            Você pode ajustar qualquer coisa depois.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title - Always visible */}
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-theme-text mb-2">
            O que você precisa fazer?
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            className={`
              w-full px-4 py-3 text-lg border rounded-lg transition-colors bg-theme-bg text-theme-text
              focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none
              ${error ? 'border-red-300 bg-red-50' : 'border-theme-border'}
            `}
            placeholder="ex.: Revisar a proposta do projeto"
            autoFocus
            maxLength={200}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Date - Always visible */}
        <div>
          <label htmlFor="task-date" className="block text-sm font-medium text-theme-text mb-2">
            Quando? <span className="text-theme-muted font-normal">(opcional)</span>
          </label>
          <div className="flex items-center gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => setScheduledDate(getTodayString())}
              className={quickDateClasses(scheduledDate === getTodayString())}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setScheduledDate(formatDateLocal(addDays(new Date(), 1)))}
              className={quickDateClasses(
                scheduledDate === formatDateLocal(addDays(new Date(), 1))
              )}
            >
              Amanhã
            </button>
            {scheduledDate && (
              <button
                type="button"
                onClick={() => setScheduledDate(undefined)}
                aria-label="Limpar data"
                title="Limpar data"
                className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-bg rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <input
            id="task-date"
            type="date"
            value={scheduledDate || ''}
            onChange={(e) => setScheduledDate(e.target.value || undefined)}
            className="w-full px-4 py-3 border border-theme-border rounded-lg transition-colors bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
          />
        </div>

        {/* Details - Always visible */}
        <div className="space-y-4 pt-4 border-t border-theme-border">
          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-theme-text mb-2">
              Descrição (opcional)
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-theme-border rounded-lg transition-colors resize-none bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
              placeholder="Adicione mais detalhes sobre esta tarefa..."
              maxLength={1000}
            />
          </div>
        </div>

        {/* Form Actions */}
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