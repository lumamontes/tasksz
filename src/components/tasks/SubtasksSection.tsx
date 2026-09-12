/**
 * SubtasksSection Component
 * Primary working area for subtasks with overwhelm mode and step generator
 */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $selectedTaskSubtasks, addSubtask, toggleSubtaskDone, reorderSubtasks } from '../../stores/tasksStore';
import { SubtaskRow } from './SubtaskRow';
import type { Task } from '../../types';
import { Check, X, Plus } from 'lucide-react';

interface SubtasksSectionProps {
  task: Task;
}

// Overwhelm mode preference (stored in localStorage)
const OVERWHELM_MODE_KEY = 'tarefitas_overwhelm_mode';

export function SubtasksSection({ task }: SubtasksSectionProps) {
  const subtasks = useStore($selectedTaskSubtasks);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [overwhelmMode, setOverwhelmMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(OVERWHELM_MODE_KEY) === 'true';
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize selected subtask to first incomplete
  useEffect(() => {
    if (subtasks.length > 0 && !selectedSubtaskId) {
      const firstIncomplete = subtasks.find(s => !s.done);
      if (firstIncomplete) {
        setSelectedSubtaskId(firstIncomplete.id);
      } else {
        setSelectedSubtaskId(subtasks[0].id);
      }
    }
  }, [subtasks, selectedSubtaskId]);

  // Persist overwhelm mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(OVERWHELM_MODE_KEY, overwhelmMode.toString());
    }
  }, [overwhelmMode]);

  // Keyboard navigation for subtasks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (subtasks.length === 0) return;

      const currentIndex = subtasks.findIndex(s => s.id === selectedSubtaskId);
      if (currentIndex === -1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < subtasks.length - 1) {
            setSelectedSubtaskId(subtasks[currentIndex + 1].id);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedSubtaskId(subtasks[currentIndex - 1].id);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedSubtaskId) {
            toggleSubtaskDone(selectedSubtaskId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subtasks, selectedSubtaskId, isAdding]);

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAdding(false);
    }
  };

  const handleGenerateSteps = (count: number) => {
    const stepTemplates = [
      'Primeiro passo',
      'Preparar',
      'Executar',
      'Revisar',
      'Finalizar'
    ];
    
    const firstOrder = subtasks.length;
    for (let i = 0; i < count; i++) {
      const title = stepTemplates[i] || `Passo ${i + 1}`;
      addSubtask(task.id, title, firstOrder + i);
    }
  };

  const handleDragStartSubtask = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  };

  const handleDragOverSubtask = (index: number) => (e: React.DragEvent) => {
    if (dragIndex === null) return;
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDropSubtask = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...subtasks];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    reorderSubtasks(task.id, reordered);

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEndSubtask = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Show all subtasks by default, overwhelm mode can still be toggled
  const visibleSubtasks = subtasks;

  return (
    <div className="mx-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-theme-text">
          Subtarefas
          {subtasks.length > 0 && (
            <span className="text-sm font-normal text-theme-muted ml-2">
              ({subtasks.length})
            </span>
          )}
        </h2>
      </div>

      {/* Add Subtask */}
      {isAdding ? (
        <div className="mb-3 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSubtask();
              }
              if (e.key === 'Escape') {
                setNewSubtaskTitle('');
                setIsAdding(false);
              }
            }}
            className="flex-1 text-sm text-theme-text bg-theme-bg border border-theme-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
            placeholder="Digite o título da subtarefa..."
            autoFocus
          />
          <button
            onClick={handleAddSubtask}
            aria-label="Salvar subtarefa"
            className="p-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent shrink-0"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setNewSubtaskTitle('');
              setIsAdding(false);
            }}
            aria-label="Cancelar"
            className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-bg rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsAdding(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          aria-label="Adicionar subtarefa"
          className="mb-3 flex items-center gap-1.5 px-2 py-1.5 text-sm text-theme-muted hover:text-theme-accent hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
        >
          <Plus className="w-4 h-4" />
          Adicionar subtarefa
        </button>
      )}

      {/* Empty State */}
      {subtasks.length === 0 ? (
        <div className="bg-theme-sidebar rounded-xl border border-theme-border p-8 text-center">
          <p className="text-theme-muted mb-4">
            Que tal quebrar em passos menores?
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleGenerateSteps(3)}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
            >
              Criar 3 passos
            </button>
            <button
              onClick={() => handleGenerateSteps(5)}
              className="px-4 py-2 bg-theme-sidebar text-theme-text border border-theme-border rounded-lg text-sm font-medium hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
            >
              Criar 5 passos
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSubtasks.map((subtask, index) => (
            <div
              key={subtask.id}
              draggable
              onDragStart={handleDragStartSubtask(index)}
              onDragOver={handleDragOverSubtask(index)}
              onDrop={handleDropSubtask(index)}
              onDragEnd={handleDragEndSubtask}
              className={`transition-all ${
                dragIndex === index
                  ? 'opacity-40'
                  : dragOverIndex === index && dragIndex !== null
                  ? 'ring-2 ring-theme-accent/40 rounded-lg'
                  : ''
              }`}
            >
              <SubtaskRow
                subtask={subtask}
                isSelected={subtask.id === selectedSubtaskId}
                isOverwhelmMode={overwhelmMode}
                onSelect={() => setSelectedSubtaskId(subtask.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
