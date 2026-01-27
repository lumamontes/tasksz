/**
 * FocusModeView Component
 * Minimal, distraction-free view for deep focus
 * Shows only: current task, next subtask, pomodoro controls
 */

import { useStore } from '@nanostores/react';
import { $selectedTask, $selectedTaskSubtasks } from '../../stores/tasksStore';
import { $settings, updateSettings } from '../../stores/settingsStore';
import { PomodoroTimer } from '../PomodoroTimer';
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

  // Get next incomplete subtask
  const nextSubtask = subtasks.find(s => !s.done);

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
        {!isPomodoroActive && !nextSubtask && (
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
