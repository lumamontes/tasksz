/**
 * MiniPomodoro Component
 * Detachable floating pomodoro timer for ADHD-friendly time awareness
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import {
  $miniTimer,
  setMiniTimerPosition,
  toggleMiniTimerCollapsed,
  disableMiniTimer,
} from '../../stores/miniTimerStore';
import { $selectedTask } from '../../stores/tasksStore';

const MINI_TIMER_WIDTH = 280;
const MINI_TIMER_HEIGHT = 180;
const SAFE_MARGIN = 24;

export function MiniPomodoro() {
  const minutes = useStore($minutes);
  const seconds = useStore($seconds);
  const mode = useStore($mode);
  const isActive = useStore($isActive);
  const hasFinished = useStore($hasFinished);
  const settings = useStore($settings);
  const miniTimer = useStore($miniTimer);
  const selectedTask = useStore($selectedTask);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize position if not set
  useEffect(() => {
    if (!miniTimer.miniPosition && containerRef.current) {
      const defaultPosition = {
        x: window.innerWidth - MINI_TIMER_WIDTH - SAFE_MARGIN,
        y: window.innerHeight - MINI_TIMER_HEIGHT - SAFE_MARGIN,
      };
      setMiniTimerPosition(defaultPosition);
    }
  }, [miniTimer.miniPosition]);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const newX = Math.max(
      SAFE_MARGIN,
      Math.min(e.clientX - dragOffset.x, window.innerWidth - MINI_TIMER_WIDTH - SAFE_MARGIN)
    );
    const newY = Math.max(
      SAFE_MARGIN,
      Math.min(e.clientY - dragOffset.y, window.innerHeight - MINI_TIMER_HEIGHT - SAFE_MARGIN)
    );

    setMiniTimerPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard handler (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && miniTimer.miniEnabled) {
        disableMiniTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [miniTimer.miniEnabled]);

  // Don't render if not enabled
  if (!miniTimer.miniEnabled) return null;

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

  const position = miniTimer.miniPosition || {
    x: window.innerWidth - MINI_TIMER_WIDTH - SAFE_MARGIN,
    y: window.innerHeight - MINI_TIMER_HEIGHT - SAFE_MARGIN,
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${MINI_TIMER_WIDTH}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: settings.reduceMotion ? 'none' : 'transform 0.2s ease-out',
      }}
      role="dialog"
      aria-label="Mini Pomodoro Timer"
      aria-modal="false"
    >
      <div
        className={`
          bg-theme-panel border border-theme-border rounded-xl shadow-lg
          ${settings.reduceMotion ? '' : 'transition-shadow duration-200'}
          ${isDragging ? 'shadow-2xl' : 'shadow-lg'}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Header - draggable area */}
        <div className="flex items-center justify-between p-3 border-b border-theme-border cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg
              className="w-4 h-4 text-theme-accent flex-shrink-0"
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
            <span className="text-xs font-medium text-theme-text truncate">
              {getModeLabel()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMiniTimerCollapsed}
              className="p-1 rounded hover:bg-theme-sidebar text-theme-muted hover:text-theme-text transition-colors"
              aria-label={miniTimer.miniCollapsed ? 'Expandir' : 'Minimizar'}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {miniTimer.miniCollapsed ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                )}
              </svg>
            </button>
            <button
              onClick={disableMiniTimer}
              className="p-1 rounded hover:bg-theme-sidebar text-theme-muted hover:text-theme-text transition-colors"
              aria-label="Reanexar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {!miniTimer.miniCollapsed && (
          <div className="p-4">
            {/* Time Display */}
            <div className="text-center mb-4">
              <div className="text-3xl font-mono font-bold text-theme-text mb-1">
                {formatTime(minutes, seconds)}
              </div>
              {selectedTask && (
                <p className="text-xs text-theme-muted truncate" title={selectedTask.title}>
                  {selectedTask.title}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {isActive ? (
                <button
                  onClick={pauseCountdown}
                  className="px-3 py-1.5 bg-theme-sidebar hover:bg-theme-border text-theme-text rounded-lg text-sm font-medium transition-colors focus-ring"
                  aria-label="Pausar"
                >
                  <svg
                    className="w-4 h-4 inline mr-1"
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
                  className="px-3 py-1.5 bg-theme-accent hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors focus-ring"
                  aria-label="Iniciar"
                >
                  <svg
                    className="w-4 h-4 inline mr-1"
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
              <button
                onClick={resetCountdown}
                className="px-3 py-1.5 bg-theme-sidebar hover:bg-theme-border text-theme-text rounded-lg text-sm font-medium transition-colors focus-ring"
                aria-label="Reiniciar"
              >
                <svg
                  className="w-4 h-4 inline"
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
                  className="px-3 py-1.5 bg-theme-accent hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors focus-ring"
                  aria-label="Próximo modo"
                >
                  Próximo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
