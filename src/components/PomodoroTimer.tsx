/**
 * PomodoroTimer Component
 * Neurodivergent-friendly focus timer with Tailwind styling
 */

import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Button } from './ui/Button';
import {
  $minutes,
  $seconds,
  $mode,
  $isActive,
  $hasFinished,
  $completedFocusSessions,
  setMode,
  startCountdown,
  resetCountdown,
  nextMode,
  initializeStore,
} from '../stores/pomodoroStore';
import { useStore as useSettingsStore } from '@nanostores/react';
import { $settings } from '../stores/settingsStore';

export function PomodoroTimer() {
  const minutes = useStore($minutes);
  const seconds = useStore($seconds);
  const mode = useStore($mode);
  const isActive = useStore($isActive);
  const hasFinished = useStore($hasFinished);
  const completedSessions = useStore($completedFocusSessions);
  const settings = useSettingsStore($settings);

  useEffect(() => {
    initializeStore();
  }, []);

  // Get current mode duration
  const getModeDuration = () => {
    switch (mode) {
      case 'focus':
        return settings.pomodoro.focusMinutes;
      case 'break':
        return settings.pomodoro.shortBreakMinutes;
      case 'longBreak':
        return settings.pomodoro.longBreakMinutes;
      default:
        return 25;
    }
  };

  const modeDuration = getModeDuration();
  const totalSeconds = modeDuration * 60;
  const remainingSeconds = minutes * 60 + seconds;
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  const getModeInfo = () => {
    switch (mode) {
      case 'focus':
        return {
          title: 'Tempo de Foco',
          description: `Sessão de foco #${completedSessions + 1}`,
          bgColor: 'bg-theme-panel',
          textColor: 'text-theme-text',
          buttonColor: 'bg-theme-accent hover:opacity-90',
        };
      case 'break':
        return {
          title: 'Pausa Curta',
          description: 'Momento para recarregar as energias',
          bgColor: 'bg-theme-panel',
          textColor: 'text-theme-text',
          buttonColor: 'bg-theme-accent hover:opacity-90',
        };
      case 'longBreak':
        return {
          title: 'Pausa Longa',
          description: 'Hora de descansar mais um pouco',
          bgColor: 'bg-theme-panel',
          textColor: 'text-theme-text',
          buttonColor: 'bg-theme-accent hover:opacity-90',
        };
      default:
        return {
          title: '',
          emoji: '',
          description: '',
          bgColor: '',
          textColor: '',
          buttonColor: '',
        };
    }
  };

  const getNextModeInfo = () => {
    if (mode === 'focus') {
      const nextSessions = completedSessions + 1;
      if (nextSessions % 4 === 0) {
        return { title: 'Pausa Longa' };
      } else {
        return { title: 'Pausa Curta' };
      }
    } else {
      return { title: 'Tempo de Foco' };
    }
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modeInfo = getModeInfo();
  const nextModeInfo = getNextModeInfo();

  return (
    <div className={`rounded-xl border border-theme-border p-6 transition-colors ${modeInfo.bgColor}`}>
      <div className="text-center">
        {/* Mode Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-8 h-8 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className={`text-2xl font-semibold ${modeInfo.textColor}`}>
              {modeInfo.title}
            </h2>
          </div>
          <p className="text-theme-muted">{modeInfo.description}</p>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { key: 'focus', label: 'Foco', value: 'focus', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )},
            { key: 'break', label: 'Pausa', value: 'break', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 013 3v1m-6-4a7 7 0 1014 0v-3" />
              </svg>
            )},
            { key: 'longBreak', label: 'Pausa Longa', value: 'longBreak', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" />
              </svg>
            )},
          ].map(({ key, label, value, icon }) => (
            <button
              key={key}
              onClick={() => setMode(value as any)}
              disabled={isActive}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${mode === value
                  ? `${modeInfo.textColor} bg-theme-sidebar shadow-sm border border-theme-border`
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-sidebar/50'
                }
                ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="mb-8">
          <div className={`text-6xl font-mono font-bold ${modeInfo.textColor} mb-4`}>
            {formatTime(minutes, seconds)}
          </div>
          
          {/* Progress Bar - only show if showProgressBars is enabled, and only animate if reduceMotion is false */}
          {settings.showProgressBars && (
            <div className="w-full bg-theme-sidebar rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full bg-theme-accent ${
                  settings.reduceMotion ? '' : 'transition-all duration-1000 ease-out'
                }`}
                style={{ 
                  width: `${Math.max(0, Math.min(100, progressPercentage))}%` 
                }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        {hasFinished ? (
          <div className="space-y-4">
            <div className="text-center">
              {/* Soft completion indicator - subtle checkmark, no bounce */}
              <div className={`mx-auto w-12 h-12 rounded-full ${modeInfo.bgColor} flex items-center justify-center mb-3 ${
                settings.reduceMotion ? '' : 'transition-colors duration-300'
              }`}>
                <svg className={`w-6 h-6 ${modeInfo.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className={`text-lg font-medium ${modeInfo.textColor} mb-4`}>
                {mode === 'focus' ? 'Sessão de foco concluída' : 'Pausa finalizada'}
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={resetCountdown}
                variant="ghost"
                size="medium"
                className="min-w-[120px]"
              >
                Reiniciar
              </Button>
              
              <Button
                onClick={nextMode}
                variant="primary"
                size="medium"
                className="min-w-[160px]"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 013 3v1m-6-4a7 7 0 1014 0v-3" />
                  </svg>
                  <span>Iniciar {nextModeInfo.title}</span>
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 justify-center">
            {isActive ? (
              <Button
                onClick={resetCountdown}
                variant="secondary"
                size="large"
                className="min-w-[160px]"
              >
                Parar Sessão
              </Button>
            ) : (
              <Button
                onClick={startCountdown}
                variant="primary"
                size="large"
                className="min-w-[160px]"
              >
                Iniciar {modeInfo.title}
              </Button>
            )}
          </div>
        )}

        {/* Session Counter */}
        {completedSessions > 0 && (
          <div className="mt-6 pt-4 border-t border-theme-border">
            <p className="text-sm text-theme-muted">
              Sessões completadas hoje: <span className="font-medium">{completedSessions}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}