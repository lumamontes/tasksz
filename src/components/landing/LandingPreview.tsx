/**
 * Landing Preview Component
 * A simplified, demo version of the pomodoro timer for the landing page
 * Shows the product in action without requiring authentication or full functionality
 */

import React, { useEffect, useState } from 'react';

interface DemoTask {
  title: string;
  subtasks: { title: string; done: boolean }[];
}

const DEMO_TASKS: DemoTask[] = [
  {
    title: "Organizar trabalho de casa",
    subtasks: [
      { title: "Separar materiais", done: true },
      { title: "Ler instruções", done: true },
      { title: "Fazer rascunho", done: false },
      { title: "Revisar e finalizar", done: false }
    ]
  },
  {
    title: "Cuidar das plantas",
    subtasks: [
      { title: "Regar a samambaia", done: true },
      { title: "Verificar terra do vaso", done: false },
      { title: "Remover folhas secas", done: false }
    ]
  }
];

export function LandingPreview() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const currentTask = DEMO_TASKS[currentTaskIndex];
  const progress = {
    completed: currentTask.subtasks.filter(s => s.done).length,
    total: currentTask.subtasks.length
  };
  const progressPercentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  // Auto-cycle through tasks every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTaskIndex((prev) => (prev + 1) % DEMO_TASKS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Demo timer - just for show, doesn't actually countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev === 0) {
            setMinutes(m => {
              if (m === 0) {
                setIsRunning(false);
                return 25; // Reset
              }
              return m - 1;
            });
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="bg-theme-panel border border-theme-border rounded-2xl shadow-xl overflow-hidden max-w-sm w-full">
      {/* Header with gentle gradient */}
      <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 border-b border-secondary-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-secondary-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-secondary-700">Sessão de Foco</span>
          <div className="ml-auto">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-secondary-300"></div>
              <div className="w-2 h-2 rounded-full bg-secondary-400"></div>
              <div className="w-2 h-2 rounded-full bg-secondary-500"></div>
            </div>
          </div>
        </div>
        <div className="text-2xl font-mono font-bold text-secondary-800 text-center">
          {formatTime(minutes, seconds)}
        </div>
      </div>

      {/* Current Task */}
      <div className="p-4">
        <div className="mb-4">
          <h3 className="font-medium text-theme-text mb-2 text-sm">Tarefa Atual</h3>
          <div className="bg-theme-bg rounded-lg p-3 border border-theme-border">
            <h4 className="font-medium text-theme-text text-sm mb-2">{currentTask.title}</h4>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-theme-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-theme-accent transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs text-theme-muted">
                {progress.completed}/{progress.total}
              </span>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              {currentTask.subtasks.slice(0, 3).map((subtask, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                    subtask.done 
                      ? 'bg-theme-accent border-theme-accent' 
                      : 'border-theme-border'
                  }`}>
                    {subtask.done && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${
                    subtask.done ? 'text-theme-muted line-through' : 'text-theme-text'
                  }`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {currentTask.subtasks.length > 3 && (
                <div className="text-xs text-theme-muted pl-5">
                  +{currentTask.subtasks.length - 3} mais subtarefas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="flex justify-center">
          <button
            onClick={handleToggleTimer}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent/50 ${
              isRunning
                ? 'bg-theme-sidebar hover:bg-theme-border text-theme-text'
                : 'bg-theme-accent hover:opacity-90 text-white'
            }`}
            disabled={minutes === 0 && seconds === 0}
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pausar
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {minutes === 0 && seconds === 0 ? 'Reiniciar' : 'Iniciar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}