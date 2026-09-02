/**
 * PomodoroTimer Component
 * Focus timer rendered as the "Pomodoro" view of the Tarefas panel and inside
 * focus mode. It is a thin view over the shared pomodoro store: all timing,
 * mode switching and persistence live there so every island stays consistent.
 */

import { useStore } from '@nanostores/react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import {
  $minutes,
  $seconds,
  $mode,
  $isActive,
  $hasFinished,
  $completedFocusSessions,
  getDurationMinutes,
  getNextMode,
  setMode,
  startCountdown,
  pauseCountdown,
  resetCountdown,
  nextMode,
  type PomodoroMode,
} from '../stores/pomodoroStore';
import { $settings } from '../stores/settingsStore';
import { useStoreInit } from '../hooks/useStoreInit';

const MODES: Array<{ id: PomodoroMode; label: string }> = [
  { id: 'focus', label: 'Foco' },
  { id: 'break', label: 'Pausa' },
  { id: 'longBreak', label: 'Pausa Longa' },
];

const MODE_META: Record<PomodoroMode, { title: string; description: string }> = {
  focus: { title: 'Tempo de Foco', description: 'Sem interrupções. Você consegue.' },
  break: { title: 'Pausa Curta', description: 'Levante, respire, alongue-se.' },
  longBreak: { title: 'Pausa Longa', description: 'Hora de descansar um pouco mais.' },
};

function formatTime(minutes: number, seconds: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function PomodoroTimer() {
  const minutes = useStore($minutes);
  const seconds = useStore($seconds);
  const mode = useStore($mode);
  const isActive = useStore($isActive);
  const hasFinished = useStore($hasFinished);
  const completedSessions = useStore($completedFocusSessions);
  const settings = useStore($settings);

  useStoreInit({ pomodoro: true });

  const meta = MODE_META[mode];
  const next = getNextMode();
  const totalSeconds = getDurationMinutes(mode) * 60;
  const remaining = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100) : 0;
  const isFresh = remaining >= totalSeconds;

  return (
    <Card padding="lg" variant="panel">
      <div className="text-center">
        {/* Mode header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-theme-text">{meta.title}</h2>
          <p className="text-theme-muted mt-1">
            {mode === 'focus'
              ? `Sessão de foco #${completedSessions + 1}`
              : meta.description}
          </p>
        </div>

        {/* Mode selection */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              disabled={isActive}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                mode === id
                  ? 'bg-theme-accent/10 text-theme-text border border-theme-accent/50'
                  : 'text-theme-muted border border-transparent hover:text-theme-text hover:bg-theme-bg'
              } ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Timer + progress */}
        <div className="mb-8">
          <div className="text-6xl font-mono font-bold text-theme-text mb-4 tabular-nums">
            {formatTime(minutes, seconds)}
          </div>
          {settings.showProgressBars && (
            <div className="w-full bg-theme-border rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full bg-theme-accent ${
                  settings.reduceMotion ? '' : 'transition-all duration-500 ease-out'
                }`}
                style={{ width: `${Math.max(0, progress)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do pomodoro"
              />
            </div>
          )}
        </div>

        {/* Controls */}
        {hasFinished ? (
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={resetCountdown} variant="ghost" size="medium" className="min-w-[120px]">
              Reiniciar
            </Button>
            <Button onClick={nextMode} variant="primary" size="medium" className="min-w-[160px]">
              Iniciar {MODE_META[next].title}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            {isActive ? (
              <>
                <Button onClick={pauseCountdown} variant="primary" size="large" className="min-w-[140px]">
                  Pausar
                </Button>
                <Button onClick={resetCountdown} variant="secondary" size="large" className="min-w-[120px]">
                  Parar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={startCountdown} variant="primary" size="large" className="min-w-[160px]">
                  {isFresh ? `Iniciar ${meta.title}` : 'Retomar'}
                </Button>
                {!isFresh && (
                  <Button onClick={resetCountdown} variant="secondary" size="large" className="min-w-[120px]">
                    Reiniciar
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Session counter */}
        {completedSessions > 0 && (
          <div className="mt-6 pt-4 border-t border-theme-border">
            <p className="text-sm text-theme-muted">
              Sessões completadas hoje: <span className="font-medium text-theme-text">{completedSessions}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}