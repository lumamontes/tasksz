/**
 * NextStepCard Component
 * Prominent card for "Próximo pequeno passo" - high priority section
 */

import { useState } from 'react';
import { updateTask } from '../../stores/tasksStore';
import type { Task } from '../../types';

interface NextStepCardProps {
  task: Task;
  isEditMode: boolean;
}

export function NextStepCard({ task, isEditMode }: NextStepCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.nextStep || '');

  const handleSave = () => {
    updateTask(task.id, { nextStep: value.trim() || undefined });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(task.nextStep || '');
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setValue(task.nextStep || '');
    setIsEditing(true);
  };

  if (isEditing || (isEditMode && !task.nextStep)) {
    return (
      <div className="mx-6 mt-6 mb-4">
        <label className="block text-sm font-medium text-theme-text mb-2">
          Próximo pequeno passo
        </label>
        <div className="space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="w-full text-base text-theme-text bg-theme-sidebar border border-theme-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
            placeholder="Qual é o menor passo possível?"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-theme-accent"
            >
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-theme-sidebar text-theme-text rounded-lg text-sm font-medium hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task.nextStep) {
    return (
      <div className="mx-6 mt-6 mb-4">
        <div className="bg-theme-sidebar border-2 border-dashed border-theme-border rounded-xl p-6 text-center">
          <p className="text-sm text-theme-muted mb-4">
            Que tal definir o próximo pequeno passo?
          </p>
          <button
            onClick={handleStartEditing}
            className="px-6 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            Definir agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-6 mt-6 mb-4">
      <div className="bg-theme-accent/10 border border-theme-accent/30 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-theme-muted mb-1">
              Próximo pequeno passo
            </label>
            <p className="text-base text-theme-text font-medium">
              {task.nextStep}
            </p>
          </div>
          {isEditMode && (
            <button
              onClick={handleStartEditing}
              className="p-1 text-theme-muted hover:text-theme-accent rounded transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Editar próximo passo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
