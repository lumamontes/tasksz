/**
 * SubtaskRow Component
 * Individual subtask row with checkbox, title, and actions
 */

import { useState } from 'react';
import { toggleSubtaskDone, updateSubtask, deleteSubtask } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { useStore } from '@nanostores/react';
import type { Subtask } from '../../types';

interface SubtaskRowProps {
  subtask: Subtask;
  isSelected: boolean;
  isOverwhelmMode: boolean;
  onSelect: () => void;
}

export function SubtaskRow({ subtask, isSelected, isOverwhelmMode, onSelect }: SubtaskRowProps) {
  const settings = useStore($settings);
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(subtask.title);
  const [showDelete, setShowDelete] = useState(false);

  const handleSave = () => {
    if (titleValue.trim()) {
      updateSubtask(subtask.id, { title: titleValue.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitleValue(subtask.title);
    setIsEditing(false);
  };

  const handleToggle = () => {
    toggleSubtaskDone(subtask.id);
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta subtarefa?')) {
      deleteSubtask(subtask.id);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-3 bg-theme-sidebar rounded-lg border border-theme-border">
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="flex-1 text-sm text-theme-text bg-theme-bg border border-theme-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-accent"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs bg-theme-accent text-white rounded hover:opacity-90"
        >
          Salvar
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1 text-xs bg-theme-sidebar text-theme-text rounded hover:bg-theme-bg"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div
      data-subtask-id={subtask.id}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-colors
        ${isSelected ? 'bg-theme-accent/10 border-theme-accent' : 'bg-theme-sidebar border-theme-border'}
        ${subtask.done ? 'opacity-60' : ''}
        ${settings.reduceMotion ? '' : 'hover:bg-theme-bg'}
      `}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      tabIndex={isSelected ? 0 : -1}
      role="button"
      aria-label={`Subtarefa: ${subtask.title}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
          ${subtask.done
            ? 'bg-theme-accent border-theme-accent text-white'
            : 'border-theme-border hover:border-theme-accent'
          }
        `}
        aria-label={subtask.done ? 'Marcar como não concluída' : 'Marcar como concluída'}
      >
        {subtask.done && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      
      <button
        onClick={() => setIsEditing(true)}
        className={`
          flex-1 text-left text-sm
          ${subtask.done ? 'text-theme-muted line-through' : 'text-theme-text'}
        `}
      >
        {subtask.title}
      </button>

      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="p-1 text-theme-muted hover:text-red-600 rounded transition-colors shrink-0"
          aria-label="Excluir subtarefa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
