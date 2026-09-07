/**
 * TaskDetailEmpty Component
 * Illustrated empty states shown when no task is selected
 */

import { useStore } from '@nanostores/react';
import { $tasks, $selectedDay } from '../../stores/tasksStore';
import { openNewTask } from '../../stores/uiStore';
import { getAuthDisplayName } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { CheckSquare } from 'lucide-react';
import { formatDayLabel, getTodayString, isValidDateString } from '../../utils/dateUtils';

import nextTaskArt from '../../assets/images/undraw_next-task_jtbr.svg';

// Astro/Vite may resolve SVG imports as a plain URL string or an object with `.src`
function toSrc(asset: string | { src: string }): string {
  return typeof asset === 'string' ? asset : asset.src;
}

export function TaskDetailEmpty() {
  const tasks = useStore($tasks);
  const selectedDay = useStore($selectedDay);
  const isOtherDay = isValidDateString(selectedDay) && selectedDay !== getTodayString();

  const userName = getAuthDisplayName();
  const isFirstTime = tasks.length === 0;

  if (isFirstTime) {
    return (
      <div className="h-full overflow-y-auto bg-theme-panel">
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <img
            src={toSrc(nextTaskArt)}
            alt=""
            className="w-48 max-w-full mb-8"
            width={240}
            height={240}
          />
          <h2 className="text-2xl font-semibold text-theme-text mb-3">
            {userName ? `Olá, ${userName}!` : 'Olá!'}
          </h2>
          <p className="text-theme-muted max-w-sm mb-8">
            Bora começar? Crie sua primeira tarefa e deixe o dia mais leve.
          </p>
          <Button onClick={() => openNewTask()} variant="primary" size="medium">
            Criar tarefa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-theme-panel">
      <div className="flex flex-col items-center gap-4 text-center px-8">
        <span className="w-24 h-24 rounded-full bg-theme-sidebar border border-theme-border flex items-center justify-center">
          <CheckSquare className="w-10 h-10 text-theme-muted/60" aria-hidden="true" />
        </span>
        <p className="text-sm text-theme-muted">Selecione uma tarefa para ver os detalhes</p>
        {isOtherDay && (
          <Button onClick={() => openNewTask({ scheduledDate: selectedDay })} variant="secondary" size="small">
            Criar tarefa para {formatDayLabel(selectedDay)}
          </Button>
        )}
      </div>
    </div>
  );
}