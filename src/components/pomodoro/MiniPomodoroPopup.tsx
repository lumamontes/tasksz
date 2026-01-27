/**
 * MiniPomodoroPopup Component
 * Standalone popup window version of the mini pomodoro timer
 */

import React from 'react';
import { useStore } from '@nanostores/react';
import {
  $minutes,
  $seconds,
  $mode,
  $isActive,
  $hasFinished,
  startCountdown,
  pauseCountdown,
  resetCountdown,
  nextMode,
} from '../../stores/pomodoroStore';
import { $settings } from '../../stores/settingsStore';
import { $selectedTask } from '../../stores/tasksStore';
import { useStoreInit } from '../../hooks/useStoreInit';

export function MiniPomodoroPopup() {
  const minutes = useStore($minutes);
  const seconds = useStore($seconds);
  const mode = useStore($mode);
  const isActive = useStore($isActive);
  const hasFinished = useStore($hasFinished);
  const settings = useStore($settings);
  const selectedTask = useStore($selectedTask);

  // Initialize stores using centralized hook
  useStoreInit({
    persistence: true,
    settings: true,
    miniTimer: true,
    pomodoro: true,
  });

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'focus':
        return 'Foco';
      case 'break':
        return 'Pausa';
      case 'longBreak':
        return 'Pausa Longa';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-theme-panel border border-theme-border rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-theme-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-theme-text">{getModeLabel()}</h2>
        </div>

        {/* Time Display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-mono font-bold text-theme-text mb-2">
            {formatTime(minutes, seconds)}
          </div>
          {selectedTask && (
            <p className="text-sm text-theme-muted truncate" title={selectedTask.title}>
              {selectedTask.title}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          {isActive ? (
            <button
              onClick={pauseCountdown}
              className="w-full px-4 py-3 bg-theme-sidebar hover:bg-theme-border text-theme-text rounded-lg font-medium transition-colors focus-ring"
              aria-label="Pausar"
            >
              <svg
                className="w-5 h-5 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pausar
            </button>
          ) : (
            <button
              onClick={startCountdown}
              className="w-full px-4 py-3 bg-theme-accent hover:opacity-90 text-white rounded-lg font-medium transition-colors focus-ring"
              aria-label="Iniciar"
            >
              <svg
                className="w-5 h-5 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Iniciar
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={resetCountdown}
              className="flex-1 px-4 py-3 bg-theme-sidebar hover:bg-theme-border text-theme-text rounded-lg font-medium transition-colors focus-ring"
              aria-label="Reiniciar"
            >
              <svg
                className="w-5 h-5 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            {hasFinished && (
              <button
                onClick={nextMode}
                className="flex-1 px-4 py-3 bg-theme-accent hover:opacity-90 text-white rounded-lg font-medium transition-colors focus-ring"
                aria-label="Próximo modo"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
