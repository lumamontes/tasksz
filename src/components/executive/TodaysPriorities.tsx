/**
 * TodaysPriorities Component
 * Executive function scaffolding for ADHD users
 * Provides clear priority structure with time estimates
 */

import { useStore } from '@nanostores/react';
import { $filteredTasks, $subtasks, selectTask, getTaskProgress } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { $energyLevel } from '../../stores/ndStore';
import { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Shuffle } from 'lucide-react';

interface TaskCardProps {
  task: any;
  priority: 'must-do' | 'should-do' | 'nice-to-do';
  timeEstimate: string;
  onSelect: (taskId: string) => void;
}

function TaskCard({ task, priority, timeEstimate, onSelect }: TaskCardProps) {
  const settings = useStore($settings);
  const progress = getTaskProgress(task.id);

  const priorityStyles = {
    'must-do': 'border-red-200 bg-red-50 text-red-800',
    'should-do': 'border-yellow-200 bg-yellow-50 text-yellow-800', 
    'nice-to-do': 'border-green-200 bg-green-50 text-green-800'
  };

  const priorityLabels = {
    'must-do': 'Preciso Fazer',
    'should-do': 'Deveria Fazer',
    'nice-to-do': 'Seria Bom Fazer'
  };

  return (
    <button
      onClick={() => onSelect(task.id)}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        settings.reduceMotion ? '' : 'duration-200 hover:scale-105'
      } focus:outline-none focus:ring-2 focus:ring-theme-accent ${
        priorityStyles[priority]
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {priorityLabels[priority]}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
          {timeEstimate}
        </span>
      </div>
      
      <h3 className="font-semibold text-base mb-1 line-clamp-1">
        {task.title}
      </h3>
      
      {task.description && (
        <p className="text-sm opacity-75 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}
      
      {progress.total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="text-xs font-medium">
            {progress.completed}/{progress.total}
          </span>
        </div>
      )}
    </button>
  );
}

export function TodaysPriorities() {
  const tasks = useStore($filteredTasks);
  const settings = useStore($settings);
  const energyLevel = useStore($energyLevel);
  const [randomSeed, setRandomSeed] = useState(0);

  // Calculate time estimates based on subtasks
  const getTimeEstimate = (task: any) => {
    const progress = getTaskProgress(task.id);
    const remainingTasks = progress.total - progress.completed;
    
    if (remainingTasks === 0) return '5min'; // Just marking complete
    if (remainingTasks <= 2) return '15min';
    if (remainingTasks <= 5) return '30min';
    return '45min+';
  };

  // Prioritize tasks based on various factors
  const prioritizedTasks = useMemo(() => {
    let availableTasks = [...tasks].filter(task => !task.archived);
    
    // Randomize if user preference is set
    if (settings.ndSettings?.randomizeOrder) {
      availableTasks = availableTasks
        .map(task => ({ task, sort: Math.random() + randomSeed }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ task }) => task);
    }

    // Smart prioritization based on energy level and task complexity
    const mustDo = [];
    const shouldDo = [];
    const niceToDo = [];

    for (const task of availableTasks) {
      const progress = getTaskProgress(task.id);
      const isNearComplete = progress.total > 0 && progress.percentage > 75;
      const hasSubtasks = progress.total > 0;
      const timeEstimate = getTimeEstimate(task);
      
      // Must-do logic: quick wins when energy is low, important tasks when high
      if (isNearComplete || (energyLevel === 'low' && timeEstimate === '15min')) {
        mustDo.push(task);
      } else if (energyLevel === 'high' || hasSubtasks) {
        shouldDo.push(task);
      } else {
        niceToDo.push(task);
      }
      
      // Limit to 3 total recommendations
      if (mustDo.length + shouldDo.length + niceToDo.length >= 3) break;
    }

    return {
      mustDo: mustDo.slice(0, 1),
      shouldDo: shouldDo.slice(0, 1), 
      niceToDo: niceToDo.slice(0, 1)
    };
  }, [tasks, energyLevel, settings.ndSettings?.randomizeOrder, randomSeed]);

  const handleTaskSelect = (taskId: string) => {
    selectTask(taskId);
  };

  const handleRandomize = () => {
    setRandomSeed(Math.random());
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-theme-sidebar rounded-xl p-6 text-center">
        <p className="text-theme-muted">Nenhuma tarefa para hoje. Que tal criar uma? 🌱</p>
      </div>
    );
  }

  return (
    <div className="bg-theme-sidebar rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-theme-text">
          Prioridades de Hoje
        </h2>
        {settings.ndSettings?.randomizeOrder && (
          <Button 
            onClick={handleRandomize}
            variant="ghost"
            size="small"
            aria-label="Embaralhar ordem das tarefas"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {prioritizedTasks.mustDo.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-text mb-2">🔥 Foco Principal</h3>
            {prioritizedTasks.mustDo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                priority="must-do"
                timeEstimate={getTimeEstimate(task)}
                onSelect={handleTaskSelect}
              />
            ))}
          </div>
        )}

        {prioritizedTasks.shouldDo.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-text mb-2">⚡ Segundo Foco</h3>
            {prioritizedTasks.shouldDo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                priority="should-do"
                timeEstimate={getTimeEstimate(task)}
                onSelect={handleTaskSelect}
              />
            ))}
          </div>
        )}

        {prioritizedTasks.niceToDo.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-text mb-2">🌟 Se Sobrar Energia</h3>
            {prioritizedTasks.niceToDo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                priority="nice-to-do"
                timeEstimate={getTimeEstimate(task)}
                onSelect={handleTaskSelect}
              />
            ))}
          </div>
        )}
      </div>

      {energyLevel === 'low' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💙 Energia baixa detectada. Focando em tarefas rápidas e conquistas fáceis.
          </p>
        </div>
      )}
    </div>
  );
}