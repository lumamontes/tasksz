/**
 * SubtaskList Component
 * List of subtasks with add functionality
 */

import { useStore } from '@nanostores/react';
import { $selectedTaskSubtasks, addSubtask, toggleSubtaskDone, updateSubtask, deleteSubtask } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { useState } from 'react';

interface SubtaskListProps {
  taskId: string;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const subtasks = useStore($selectedTaskSubtasks);
  const settings = useStore($settings);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Find current (next incomplete) subtask
  const currentSubtaskId = subtasks.find(s => !s.done)?.id || null;

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      addSubtask(taskId, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setNewSubtaskTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing subtasks */}
      {subtasks.map((subtask) => (
        <SubtaskItem
          key={subtask.id}
          subtask={subtask}
          isCurrent={subtask.id === currentSubtaskId}
          onToggleDone={() => toggleSubtaskDone(subtask.id)}
          onUpdateTitle={(title) => updateSubtask(subtask.id, { title })}
          onUpdateDescription={(description) => updateSubtask(subtask.id, { description })}
          onDelete={() => deleteSubtask(subtask.id)}
        />
      ))}

      {/* Add new subtask */}
      {isAdding ? (
        <div className="bg-theme-sidebar rounded-2xl px-6 py-4 shadow-sm border border-theme-border">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o título da subtarefa..."
              className="flex-1 bg-transparent outline-none text-theme-text placeholder-theme-muted"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddSubtask}
                className="p-1 text-theme-accent hover:bg-theme-panel rounded-lg transition-colors"
                title="Salvar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setNewSubtaskTitle('');
                  setIsAdding(false);
                }}
                className="p-1 text-theme-muted hover:bg-theme-bg rounded-lg transition-colors"
                title="Cancelar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-theme-sidebar rounded-2xl px-6 py-4 shadow-sm border border-theme-border border-dashed hover:border-theme-accent hover:bg-theme-panel transition-all duration-200 text-left text-theme-muted hover:text-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-current rounded border-dashed flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium">Adicionar subtarefa</span>
          </div>
        </button>
      )}
    </div>
  );
}

interface SubtaskItemProps {
  subtask: {
    id: string;
    title: string;
    description?: string;
    done: boolean;
  };
  isCurrent?: boolean;
  onToggleDone: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onDelete: () => void;
}

function SubtaskItem({ subtask, isCurrent = false, onToggleDone, onUpdateTitle, onUpdateDescription, onDelete }: SubtaskItemProps) {
  const settings = useStore($settings);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState(subtask.title);
  const [descriptionValue, setDescriptionValue] = useState(subtask.description || '');
  
  // Animation classes based on reduceMotion setting
  const transitionClass = settings.reduceMotion ? '' : 'transition-all duration-200';
  const animationClass = settings.reduceMotion ? '' : 'hover:scale-[0.98]';

  const handleSave = () => {
    if (titleValue.trim()) {
      onUpdateTitle(titleValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitleValue(subtask.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDescriptionSave = () => {
    onUpdateDescription(descriptionValue);
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setDescriptionValue(subtask.description || '');
    setIsEditingDescription(false);
  };

  return (
    <div className={`bg-theme-sidebar rounded-2xl px-6 py-4 shadow-sm border group ${transitionClass} ${
      isCurrent && !subtask.done
        ? 'border-theme-accent bg-[var(--accent)]/5'
        : 'border-theme-border'
    } ${subtask.done ? 'opacity-60' : ''}`}>
      <div className="space-y-3">
        {/* Title Row */}
        <div className="flex items-center gap-4">
          {isEditing ? (
            <>
              <button
                onClick={onToggleDone}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${transitionClass} ${
                  subtask.done
                    ? 'bg-success-500 border-success-500 text-white'
                    : 'border-theme-border hover:border-theme-accent'
                }`}
              >
                {subtask.done && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-theme-text"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  className="p-1 text-theme-accent hover:bg-theme-panel rounded-lg transition-colors"
                  title="Salvar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-theme-muted hover:bg-theme-bg rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={onToggleDone}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${transitionClass} ${animationClass} ${
                  subtask.done
                    ? 'bg-success-500 border-success-500 text-white'
                    : 'border-theme-border hover:border-theme-accent'
                }`}
              >
                {subtask.done && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className={`flex-1 text-left text-sm ${transitionClass} hover:text-theme-accent focus:outline-none focus:text-theme-accent ${
                  subtask.done ? 'text-theme-muted line-through' : 'text-theme-text'
                }`}
              >
                {subtask.title}
              </button>
              <button
                onClick={onDelete}
                className={`opacity-0 group-hover:opacity-100 p-1 text-theme-muted hover:text-error-500 hover:bg-error-50 rounded-lg ${transitionClass}`}
                title="Excluir"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Description Row - Optional */}
        {(subtask.description || isEditingDescription) && (
          <div className="pl-9">
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleDescriptionCancel();
                    if (e.key === 'Enter' && e.ctrlKey) handleDescriptionSave();
                  }}
                  className="w-full min-h-16 text-sm text-theme-text bg-theme-panel border border-theme-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-accent resize-none"
                  placeholder="Adicionar descrição..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDescriptionSave}
                    className="px-3 py-1 text-xs bg-theme-accent text-white rounded-lg hover:opacity-90 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={handleDescriptionCancel}
                    className="px-3 py-1 text-xs bg-theme-sidebar text-theme-text rounded-lg hover:bg-theme-bg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="flex-1 text-xs text-theme-muted">{subtask.description}</p>
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-theme-muted hover:text-theme-accent rounded transition-colors"
                  title="Editar descrição"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Description Button */}
        {!subtask.description && !isEditingDescription && (
          <div className="pl-9">
            <button
              onClick={() => setIsEditingDescription(true)}
              className="opacity-0 group-hover:opacity-100 text-xs text-theme-muted hover:text-theme-accent transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar descrição
            </button>
          </div>
        )}
      </div>
    </div>
  );
}