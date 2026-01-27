/**
 * DescriptionSection Component
 * Collapsible description section
 */

import { useState } from 'react';
import { updateTask } from '../../stores/tasksStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import type { Task } from '../../types';

interface DescriptionSectionProps {
  task: Task;
  isEditMode: boolean;
}

export function DescriptionSection({ task, isEditMode }: DescriptionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!!task.description);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.description || '');

  const handleSave = () => {
    const cleanValue = value.trim() === '<p></p>' || value.trim() === '' 
      ? undefined 
      : value.trim();
    updateTask(task.id, { description: cleanValue });
    setIsEditing(false);
    if (!cleanValue) {
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setValue(task.description || '');
    setIsEditing(false);
  };

  return (
    <div className="mx-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3 text-sm font-medium text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-1 -m-1"
        aria-expanded={isExpanded}
      >
        <span>Descrição</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div>
          {isEditing || (isEditMode && !task.description) ? (
            <div className="space-y-3">
              <RichTextEditor
                content={value}
                onChange={(html) => setValue(html)}
                placeholder="Adicione uma descrição..."
                className="w-full"
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
          ) : (
            <div>
              {task.description ? (
                <div
                  onClick={() => isEditMode && setIsEditing(true)}
                  className={`
                    text-sm text-theme-text prose prose-sm max-w-none
                    ${isEditMode ? 'cursor-pointer hover:text-theme-accent' : ''}
                  `}
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full text-left text-sm text-theme-muted hover:text-theme-accent italic p-2 rounded-lg hover:bg-theme-sidebar transition-colors"
                >
                  Clique para adicionar uma descrição...
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
