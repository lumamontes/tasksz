/**
 * TaskForm Component
 * Store-driven form island: opens via $taskForm (new task or edit),
 * prefills the date from the selected day when browsing another day.
 *
 * Extra fields (description + subtasks) sit behind a collapsible "Mais
 * detalhes" accordion so the basic task stays quick to create. When creating
 * a new task, subtasks entered here are added right after the task exists.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import type { Task } from '../../types';
import { Button } from '../ui/Button';
import { $tasks, addTask, updateTask, selectTask, addSubtask } from '../../stores/tasksStore';
import { $taskForm, closeTaskForm } from '../../stores/uiStore';
import { addDays, formatDateLocal, getTodayString } from '../../utils/dateUtils';
import { TaskDatePicker } from './TaskDatePicker';
import { ChevronDown, Plus, X } from 'lucide-react';

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with task data when editing
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setScheduledDate(editingTask.scheduledDate || undefined);
      setDescription(editingTask.description || '');
      setNewSubtasks([]);
    }
  }, [editingTask]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      let newTaskId: string;
      try {
        newTaskId = await addTask(data);
      } catch {
        setError('Não foi possível criar a tarefa. Tente novamente.');
        return;
      }

      // Attach subtasks only after the parent task exists locally.
      newSubtasks.forEach((subtaskTitle, index) => {
        if (subtaskTitle.trim()) addSubtask(newTaskId, subtaskTitle.trim(), index);
      });
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

  const addSubtaskInput = () => {
    const value = subtaskInput.trim();
    if (!value) return;
    setNewSubtasks((prev) => [...prev, value]);
    setSubtaskInput('');
    if (subtaskInputRef.current) subtaskInputRef.current.focus();
  };

  return (
    <div className="bg-theme-sidebar rounded-xl p-6 max-w-2xl mx-auto">
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
          </div>
          <TaskDatePicker id="task-date" value={scheduledDate} onChange={setScheduledDate} />
        </div>

        {/* Mais detalhes - collapsible accordion */}
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
              {/* Description */}
              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-theme-text mb-2">
                  Descrição
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-theme-border rounded-lg transition-colors resize-none bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
                  placeholder="Notas, contexto, links..."
                  maxLength={1000}
                />
              </div>

              {/* Subtasks - only when creating a new task */}
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
