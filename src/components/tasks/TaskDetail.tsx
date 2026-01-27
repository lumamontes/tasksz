/**
 * TaskDetail Component
 * Right panel showing selected task details and subtasks
 */

import { useStore } from '@nanostores/react';
import { $selectedTask, $selectedTaskSubtasks, $filteredTasks, $selectedTaskIndex, selectTask, updateTask } from '../../stores/tasksStore';
import { SubtaskList } from './SubtaskList';
import { BreakItDownHelper } from '../features/BreakItDownHelper';
import { StartButton } from '../features/StartButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { useState, useEffect, useRef } from 'react';

export function TaskDetail() {
  const selectedTask = useStore($selectedTask);
  const subtasks = useStore($selectedTaskSubtasks);
  const filteredTasks = useStore($filteredTasks);
  const selectedTaskIndex = useStore($selectedTaskIndex);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingNextStep, setIsEditingNextStep] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [nextStepValue, setNextStepValue] = useState('');
  const [showBreakItDown, setShowBreakItDown] = useState(false);
  const [isNextStepExpanded, setIsNextStepExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(true); // Title always visible by default
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  const justCanceledEditRef = useRef(false);

  // Keyboard shortcuts for prev/next navigation and closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key handling
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        // If we just canceled an edit, close the panel on second Escape
        if (justCanceledEditRef.current) {
          e.preventDefault();
          justCanceledEditRef.current = false;
          selectTask(null);
          return;
        }
        
        // If editing, let the individual handlers cancel first
        if (isEditingTitle || isEditingDescription || isEditingNextStep) {
          // Don't prevent default - let the input handlers cancel
          return;
        }
        
        // If not editing and not in an input, close the panel
        if (!isInInput) {
          e.preventDefault();
          selectTask(null);
        }
        return;
      }

      // Only handle navigation if not typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // J/K or Ctrl+Arrow for navigation
      if (
        (e.key === 'j' || e.key === 'J' || (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey))) &&
        selectedTaskIndex >= 0 &&
        selectedTaskIndex < filteredTasks.length - 1
      ) {
        e.preventDefault();
        const nextTask = filteredTasks[selectedTaskIndex + 1];
        if (nextTask) selectTask(nextTask.id);
      } else if (
        (e.key === 'k' || e.key === 'K' || (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey))) &&
        selectedTaskIndex > 0
      ) {
        e.preventDefault();
        const prevTask = filteredTasks[selectedTaskIndex - 1];
        if (prevTask) selectTask(prevTask.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIndex, filteredTasks, isEditingTitle, isEditingDescription, isEditingNextStep]);

  const handlePrevTask = () => {
    if (selectedTaskIndex > 0) {
      const prevTask = filteredTasks[selectedTaskIndex - 1];
      if (prevTask) selectTask(prevTask.id);
    }
  };

  const handleNextTask = () => {
    if (selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length - 1) {
      const nextTask = filteredTasks[selectedTaskIndex + 1];
      if (nextTask) selectTask(nextTask.id);
    }
  };

  const canGoPrev = selectedTaskIndex > 0;
  const canGoNext = selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length - 1;

  // If no task is selected, return null (placeholder is handled by parent)
  if (!selectedTask) {
    return null;
  }

  // Handle title editing
  const handleTitleEdit = () => {
    setTitleValue(selectedTask.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateTask(selectedTask.id, { title: titleValue.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue('');
    setIsEditingTitle(false);
    // Mark that we just canceled, so next Escape will close the panel
    justCanceledEditRef.current = true;
    setTimeout(() => {
      justCanceledEditRef.current = false;
    }, 300); // Reset after 300ms
  };

  // Handle description editing
  const handleDescriptionEdit = () => {
    setDescriptionValue(selectedTask.description || '');
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    // Save empty string if content is just <p></p> or whitespace
    const cleanValue = descriptionValue.trim() === '<p></p>' || descriptionValue.trim() === '' 
      ? undefined 
      : descriptionValue.trim();
    updateTask(selectedTask.id, { description: cleanValue });
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setDescriptionValue('');
    setIsEditingDescription(false);
    // Mark that we just canceled, so next Escape will close the panel
    justCanceledEditRef.current = true;
    setTimeout(() => {
      justCanceledEditRef.current = false;
    }, 300); // Reset after 300ms
  };

  // Handle nextStep editing
  const handleNextStepEdit = () => {
    setNextStepValue(selectedTask?.nextStep || '');
    setIsEditingNextStep(true);
  };

  const handleNextStepSave = () => {
    if (selectedTask && nextStepValue.trim()) {
      updateTask(selectedTask.id, { nextStep: nextStepValue.trim() });
    }
    setIsEditingNextStep(false);
  };

  const handleNextStepCancel = () => {
    setNextStepValue('');
    setIsEditingNextStep(false);
    // Mark that we just canceled, so next Escape will close the panel
    justCanceledEditRef.current = true;
    setTimeout(() => {
      justCanceledEditRef.current = false;
    }, 300); // Reset after 300ms
  };

  return (
    <div 
      className="h-full overflow-y-auto bg-theme-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="task-detail-heading"
    >
      <div className="p-8">
        {/* Header with Close Button */}
        <div className="mb-6 flex items-center justify-between">
          <h2 id="task-detail-heading" className="text-lg font-semibold text-theme-text">
            Detalhes da Tarefa
          </h2>
          <button
            onClick={() => selectTask(null)}
            className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
            aria-label="Fechar detalhes (pressione Escape)"
            title="Fechar detalhes (Escape)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task Navigation */}
        {filteredTasks.length > 1 && (
          <div className="mb-6 flex items-center justify-between p-4 bg-theme-sidebar border border-theme-border rounded-xl">
            <button
              onClick={handlePrevTask}
              disabled={!canGoPrev}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-theme-text disabled:text-theme-muted disabled:opacity-50 hover:bg-theme-bg rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Tarefa anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            <span className="text-sm text-theme-muted">
              {selectedTaskIndex + 1} de {filteredTasks.length}
            </span>
            <button
              onClick={handleNextTask}
              disabled={!canGoNext}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-theme-text disabled:text-theme-muted disabled:opacity-50 hover:bg-theme-bg rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Próxima tarefa"
            >
              Próxima
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Next Step Section - Collapsible */}
        <div className="mb-8">
          <button
            onClick={() => setIsNextStepExpanded(!isNextStepExpanded)}
            className="flex items-center justify-between w-full mb-3 text-sm font-medium text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-1 -m-1"
            aria-expanded={isNextStepExpanded}
          >
            <span>Próximo pequeno passo</span>
            <svg
              className={`w-4 h-4 transition-transform ${isNextStepExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isNextStepExpanded && (
            <div>
              {isEditingNextStep ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={nextStepValue}
                    onChange={(e) => setNextStepValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNextStepSave();
                      if (e.key === 'Escape') handleNextStepCancel();
                    }}
                    className="w-full text-lg text-theme-text bg-theme-sidebar border border-theme-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
                    placeholder="Qual é o menor passo possível?"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleNextStepSave}
                      className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={handleNextStepCancel}
                      className="px-4 py-2 bg-theme-sidebar text-theme-text rounded-lg text-sm font-medium hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleNextStepEdit}
                  className="w-full text-left px-6 py-4 bg-theme-sidebar border border-theme-border rounded-xl hover:border-theme-accent hover:text-theme-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  {selectedTask.nextStep || (
                    <span className="text-theme-muted italic">Qual é o menor passo possível?</span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Task Title Section - Collapsible */}
        <div className="mb-8">
          <button
            onClick={() => setIsTitleExpanded(!isTitleExpanded)}
            className="flex items-center justify-between w-full mb-3 text-sm font-medium text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-1 -m-1"
            aria-expanded={isTitleExpanded}
          >
            <span>Título da tarefa</span>
            <svg
              className={`w-4 h-4 transition-transform ${isTitleExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isTitleExpanded && (
            <div>
              {isEditingTitle ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') handleTitleCancel();
                    }}
                    className="w-full text-xl font-semibold text-theme-text bg-theme-sidebar border border-theme-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleTitleSave}
                      className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={handleTitleCancel}
                      className="px-4 py-2 bg-theme-sidebar text-theme-text rounded-lg text-sm font-medium hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleTitleEdit}
                  className="w-full text-left text-xl font-semibold text-theme-text hover:text-theme-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-2 -m-2"
                >
                  {selectedTask.title}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Task Description Section - Collapsible */}
        <div className="mb-8">
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="flex items-center justify-between w-full mb-3 text-sm font-medium text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-1 -m-1"
            aria-expanded={isDescriptionExpanded}
          >
            <span>Descrição da tarefa</span>
            <svg
              className={`w-4 h-4 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDescriptionExpanded && (
            <div>
              {isEditingDescription ? (
                <div className="space-y-3">
                  <RichTextEditor
                    content={descriptionValue || ''}
                    onChange={(html) => setDescriptionValue(html)}
                    placeholder="Adicione uma descrição..."
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDescriptionSave}
                      className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={handleDescriptionCancel}
                      className="px-4 py-2 bg-theme-sidebar text-theme-text rounded-lg text-sm font-medium hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {selectedTask.description ? (
                    <div
                      onClick={handleDescriptionEdit}
                      className="w-full text-left text-theme-text hover:text-theme-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-2 -m-2 min-h-12 cursor-pointer prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                    />
                  ) : (
                    <button
                      onClick={handleDescriptionEdit}
                      className="w-full text-left text-theme-muted hover:text-theme-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-2 -m-2 min-h-12 flex items-start italic"
                    >
                      Clique para adicionar uma descrição...
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ND Features */}
        <div className="mb-8">
          {/* Start Button */}
          <StartButton taskId={selectedTask.id} />
          
          {/* Break It Down Helper - only show if no subtasks */}
          {subtasks.length === 0 && (
            <>
              {!showBreakItDown ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowBreakItDown(true)}
                    className="text-sm text-theme-accent hover:opacity-80 font-medium underline"
                  >
                    Tarefa parece muito grande? Vamos quebrá-la em pedaços menores
                  </button>
                </div>
              ) : (
                <BreakItDownHelper 
                  taskId={selectedTask.id} 
                  onClose={() => setShowBreakItDown(false)} 
                />
              )}
            </>
          )}
        </div>

        {/* Subtasks Section - Collapsible */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
              className="flex items-center gap-2 text-lg font-semibold text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-1 -m-1"
              aria-expanded={isSubtasksExpanded}
            >
              <span>Subtarefas</span>
              {subtasks.length > 0 && (
                <span className="text-sm font-normal text-theme-muted">
                  ({subtasks.length})
                </span>
              )}
              <svg
                className={`w-4 h-4 transition-transform ${isSubtasksExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {subtasks.length > 0 && isSubtasksExpanded && (
              <button
                onClick={() => setShowBreakItDown(true)}
                className="text-sm text-theme-accent hover:opacity-80 font-medium"
                title="Adicionar mais passos"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Quebrar mais
              </button>
            )}
          </div>
          
          {isSubtasksExpanded && (
            <>
              {showBreakItDown && subtasks.length > 0 && (
                <BreakItDownHelper 
                  taskId={selectedTask.id} 
                  onClose={() => setShowBreakItDown(false)} 
                />
              )}
              
              {subtasks.length === 0 ? (
                <div className="bg-theme-sidebar rounded-xl border border-theme-border p-8 text-center">
                  <p className="text-theme-muted mb-4">
                    Esta tarefa ainda não foi quebrada em passos menores.
                  </p>
                  <button
                    onClick={() => setShowBreakItDown(true)}
                    className="px-6 py-3 bg-theme-accent text-white rounded-lg font-medium hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    Quebrar em passos menores
                  </button>
                </div>
              ) : (
                <SubtaskList taskId={selectedTask.id} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}