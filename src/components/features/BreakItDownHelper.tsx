/**
 * Break It Down Helper
 * ND-friendly feature to help break tasks into manageable subtasks
 */

import { useState } from 'react';
import { addSubtask } from '../../stores/tasksStore';

interface BreakItDownHelperProps {
  taskId: string;
  onClose: () => void;
}

export function BreakItDownHelper({ taskId, onClose }: BreakItDownHelperProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const defaultSubtasks = [
    'Preparar',
    'Primeiro passo',
    'Fazer',
    'Revisar',
    'Finalizar',
    'Organizar'
  ];

  const handleBreakItDown = async () => {
    setIsGenerating(true);
    
    // Add a small delay to show the thinking animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Add the default subtasks
    for (const [index, title] of defaultSubtasks.entries()) {
      addSubtask(taskId, title);
      // Small delay between each addition for smooth UX
      if (index < defaultSubtasks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="bg-theme-sidebar rounded-xl border border-theme-border p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-theme-panel rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-theme-text mb-2">
            Quebrar em passos menores
          </h3>
          <p className="text-sm text-theme-muted mb-3">
            Às vezes uma tarefa parece muito grande. Que tal dividir ela em pedaços menores e mais fáceis de fazer?
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleBreakItDown}
              disabled={isGenerating}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-theme-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando passos...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Quebrar tarefa
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-theme-sidebar text-theme-text rounded-lg text-sm font-medium hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}