/**
 * PomodoroView Component
 * Full pomodoro timer view for the main panel
 */

import { PomodoroTimer } from '../PomodoroTimer';
import { useStore } from '@nanostores/react';
import { $selectedTask } from '../../stores/tasksStore';
import { $isActive } from '../../stores/pomodoroStore';
import { $miniTimer, enableMiniTimer, disableMiniTimer, openPopupWindow } from '../../stores/miniTimerStore';
import { Button } from '../ui/Button';

export function PomodoroView() {
  const selectedTask = useStore($selectedTask);
  const isPomodoroActive = useStore($isActive);
  const miniTimer = useStore($miniTimer);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {/* Optional: Show current task being worked on */}
        {selectedTask && (
          <div className="mb-6 p-4 bg-theme-sidebar rounded-xl border border-theme-border">
            <h3 className="text-sm font-medium text-theme-muted mb-1">Trabalhando em:</h3>
            <p className="text-lg font-semibold text-theme-text">{selectedTask.title}</p>
          </div>
        )}
        
        {/* Detach/Reattach Buttons */}
        <div className="mb-6 flex justify-end gap-2">
          {miniTimer.miniEnabled || miniTimer.popupEnabled ? (
            <Button
              onClick={disableMiniTimer}
              variant="secondary"
              size="medium"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              }
            >
              Reanexar
            </Button>
          ) : (
            <>
              <Button
                onClick={enableMiniTimer}
                variant="secondary"
                size="medium"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                }
              >
                Destacar
              </Button>
              <Button
                onClick={() => {
                  const opened = openPopupWindow();
                  if (!opened) {
                    // Show gentle message that popup was blocked
                    setTimeout(() => {
                      alert('Seu navegador bloqueou a janela. Usando mini timer aqui :)');
                    }, 100);
                  }
                }}
                variant="ghost"
                size="medium"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                }
              >
                Abrir em janela
              </Button>
            </>
          )}
        </div>
        
        {/* Pomodoro Timer */}
        <PomodoroTimer />
        
        {/* Idle State */}
        {!isPomodoroActive && (
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