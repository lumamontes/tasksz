/**
 * Start Button Feature
 * ND-friendly initiation ritual to help with task starting
 */

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $selectedTaskSubtasks } from '../../stores/tasksStore';
import { setCurrentSection } from '../../stores/settingsStore';

interface StartButtonProps {
  taskId: string;
}

export function StartButton({ taskId }: StartButtonProps) {
  const subtasks = useStore($selectedTaskSubtasks);
  const [showInitiation, setShowInitiation] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<string | null>(null);
  
  const incompleteSubtasks = subtasks.filter(s => !s.done);
  
  const handleStart = () => {
    if (incompleteSubtasks.length === 0) {
      // No subtasks, just start working
      setCurrentSection('pomodoro');
    } else {
      // Show initiation ritual
      setShowInitiation(true);
    }
  };

  const handleSelectSubtask = (subtaskId: string) => {
    setSelectedSubtask(subtaskId);
  };

  const handleBeginWork = () => {
    // Switch to pomodoro timer
    setCurrentSection('pomodoro');
  };

  if (showInitiation) {
    return (
      <div className="bg-theme-sidebar rounded-xl border border-theme-border p-6 mb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-theme-panel rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-theme-text mb-2">
            Vamos começar! 🚀
          </h3>
          <p className="text-sm text-theme-muted mb-4">
            Qual é o menor passo que você pode dar agora?
          </p>
          
          {incompleteSubtasks.length > 0 ? (
            <div className="space-y-2 mb-4">
              {incompleteSubtasks.map((subtask) => (
                <button
                  key={subtask.id}
                  onClick={() => handleSelectSubtask(subtask.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedSubtask === subtask.id
                      ? 'bg-theme-panel border-theme-accent text-theme-text'
                      : 'bg-theme-bg border-theme-border hover:bg-theme-sidebar hover:border-theme-accent/50'
                  }`}
                >
                  <span className="text-sm font-medium">{subtask.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-theme-muted mb-4">
              Todas as subtarefas estão completas! Hora de finalizar.
            </p>
          )}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowInitiation(false)}
              className="px-4 py-2 bg-theme-sidebar text-theme-text rounded-lg text-sm font-medium hover:bg-theme-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBeginWork}
              disabled={incompleteSubtasks.length > 0 && !selectedSubtask}
              className="px-6 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Começar a trabalhar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleStart}
        className="w-full bg-theme-accent text-white py-4 px-6 rounded-xl font-medium text-lg hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-theme-accent flex items-center justify-center gap-3"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>Começar a trabalhar nesta tarefa</span>
      </button>
      <p className="text-xs text-theme-muted text-center mt-2">
        Vamos te ajudar a dar o primeiro passo
      </p>
    </div>
  );
}