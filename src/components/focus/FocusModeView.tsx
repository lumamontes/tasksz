/**
 * FocusModeView Component
 * Minimal, distraction-free view for deep focus
 * Shows only: current task, next step, next subtask, pomodoro controls
 */

import { useStore } from '@nanostores/react';
import { $selectedTask, $selectedTaskSubtasks, updateTask } from '../../stores/tasksStore';
import { $settings, updateSettings } from '../../stores/settingsStore';
import { PomodoroTimer } from '../PomodoroTimer';
import { useState, useEffect } from 'react';
import {
  $isActive,
  startCountdown,
  resetCountdown,
} from '../../stores/pomodoroStore';

export function FocusModeView() {
  const selectedTask = useStore($selectedTask);
  const subtasks = useStore($selectedTaskSubtasks);
  const settings = useStore($settings);
  const isPomodoroActive = useStore($isActive);
  
  const [isEditingNextStep, setIsEditingNextStep] = useState(false);
  const [nextStepValue, setNextStepValue] = useState('');

  // Get next incomplete subtask
  const nextSubtask = subtasks.find(s => !s.done);

  // Initialize nextStep editing
  useEffect(() => {
    if (selectedTask) {
      setNextStepValue(selectedTask.nextStep || '');
    }
  }, [selectedTask]);

  // Handle nextStep editing
  const handleNextStepEdit = () => {
    if (selectedTask) {
      setNextStepValue(selectedTask.nextStep || '');
      setIsEditingNextStep(true);
    }
  };

  const handleNextStepSave = () => {
    if (selectedTask && nextStepValue.trim()) {
      updateTask(selectedTask.id, { nextStep: nextStepValue.trim() });
    }
    setIsEditingNextStep(false);
  };

  const handleNextStepCancel = () => {
    if (selectedTask) {
      setNextStepValue(selectedTask.nextStep || '');
    }
    setIsEditingNextStep(false);
  };

  // If no task selected, show gentle empty state
  if (!selectedTask) {
    return (
      <div className="h-full flex items-center justify-center bg-theme-panel">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-theme-sidebar rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-theme-text mb-3">
            Modo Foco
          </h2>
          <p className="text-theme-muted mb-6">
            Selecione uma tarefa para começar a focar.
          </p>
          <button
            onClick={() => updateSettings({ focusModeEnabled: false })}
            className="px-6 py-3 bg-theme-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            Sair do modo foco
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-theme-panel">
      {/* Exit Button - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => updateSettings({ focusModeEnabled: false })}
          className="px-4 py-2 text-theme-text hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm font-medium"
          aria-label="Sair do modo foco"
        >
          Sair do modo foco
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 max-w-2xl mx-auto w-full">
        {/* Task Title */}
        <h1 className="text-3xl font-semibold text-theme-text mb-8 text-center">
          {selectedTask.title}
        </h1>

        {/* Next Step Section */}
        <div className="w-full mb-8">
          {isEditingNextStep ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-theme-muted mb-2">
                Próximo pequeno passo
              </label>
              <input
                type="text"
                value={nextStepValue}
                onChange={(e) => setNextStepValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNextStepSave();
                  if (e.key === 'Escape') handleNextStepCancel();
                }}
                className="w-full px-4 py-3 bg-theme-sidebar border border-theme-border rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent text-lg"
                placeholder="Qual é o menor passo possível?"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleNextStepSave}
                  className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  Salvar
                </button>
                <button
                  onClick={handleNextStepCancel}
                  className="px-4 py-2 bg-theme-sidebar text-theme-text rounded-lg text-sm font-medium hover:bg-theme-border transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <label className="block text-sm font-medium text-theme-muted mb-3">
                Próximo pequeno passo
              </label>
              {selectedTask.nextStep ? (
                <button
                  onClick={handleNextStepEdit}
                  className="w-full px-6 py-4 bg-theme-sidebar border border-theme-border rounded-lg text-left text-lg text-theme-text hover:border-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  {selectedTask.nextStep}
                </button>
              ) : (
                <button
                  onClick={handleNextStepEdit}
                  className="w-full px-6 py-4 bg-theme-sidebar border border-theme-border border-dashed rounded-lg text-left text-lg text-theme-muted hover:border-theme-accent hover:text-theme-text transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  Qual é o menor passo possível?
                </button>
              )}
            </div>
          )}
        </div>

        {/* Next Subtask */}
        {nextSubtask && (
          <div className="w-full mb-8">
            <label className="block text-sm font-medium text-theme-muted mb-3">
              Próxima subtarefa
            </label>
            <div className="px-6 py-4 bg-theme-sidebar border border-theme-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-theme-accent rounded shrink-0" />
                <span className="text-lg text-theme-text">{nextSubtask.title}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pomodoro Controls - Simplified */}
        <div className="w-full mt-auto">
          <div className="bg-theme-sidebar border border-theme-border rounded-lg p-6">
            <PomodoroTimer />
          </div>
        </div>

        {/* Idle State for Pomodoro */}
        {!isPomodoroActive && !nextSubtask && !selectedTask.nextStep && (
          <div className="mt-8 text-center">
            <p className="text-theme-muted text-sm">
              Quando estiver pronto, aperte iniciar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
