/**
 * NDDashboard Component
 * Neurodivergent-friendly dashboard with executive function support
 * Single focus area design to prevent overwhelm
 */

import { useStore } from '@nanostores/react';
import { $settings } from '../../stores/settingsStore';
import { $tasks, $selectedTaskId } from '../../stores/tasksStore';
import { $contextState, shouldShowCelebration, getCelebrationLevel, $streakMessage } from '../../stores/ndStore';
import { useState, useEffect } from 'react';

// ND-specific components
import { TodaysPriorities } from '../executive/TodaysPriorities';
import { ContextPanel } from '../context/ContextPanel';
import { EnergyLevelTracker } from '../sensory/EnergyLevelTracker';
import { GentleProductivityMetrics } from '../metrics/GentleProductivityMetrics';
import { StreakCounter } from '../celebration/StreakCounter';
import { CelebrationOverlay } from '../celebration/CelebrationOverlay';
import { RoutineTemplates } from '../routines/RoutineTemplates';

export function NDDashboard() {
  const settings = useStore($settings);
  const tasks = useStore($tasks);
  const selectedTaskId = useStore($selectedTaskId);
  const contextState = useStore($contextState);
  const streakMessage = useStore($streakMessage);

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationLevel, setCelebrationLevel] = useState<'small' | 'medium' | 'large'>('small');

  // Handle task completion celebrations
  useEffect(() => {
    if (shouldShowCelebration()) {
      setCelebrationLevel(getCelebrationLevel());
      setShowCelebration(true);
    }
  }, [contextState.totalCompletions]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  // Determine what to show based on executive load setting
  const executiveLoad = settings.ndSettings?.executiveLoad || 'standard';
  const isMinimalMode = executiveLoad === 'minimal';

  return (
    <div className="h-full overflow-y-auto bg-theme-panel">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Celebration Overlay */}
        <CelebrationOverlay
          show={showCelebration}
          level={celebrationLevel}
          message={streakMessage || 'Parabéns!'}
          onComplete={handleCelebrationComplete}
        />

        {/* Primary Focus Area - Single attention focus */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Focus Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Priorities - Executive Function Scaffolding */}
            <TodaysPriorities />

            {/* Routine Templates - For autism predictability */}
            {!isMinimalMode && <RoutineTemplates />}
          </div>

          {/* Supporting Information Column */}
          <div className="space-y-6">
            {/* Context Panel - Working memory support */}
            <ContextPanel />

            {/* Energy Level Tracker - Sensory regulation */}
            <EnergyLevelTracker />

            {/* Streak Counter - Dopamine feedback */}
            {settings.ndSettings?.streakTracking && (
              <StreakCounter />
            )}

            {/* Gentle Productivity Metrics */}
            {!isMinimalMode && <GentleProductivityMetrics />}
          </div>
        </div>

        {/* Overwhelm Reduction Message */}
        {isMinimalMode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-green-800 mb-2">
              Modo Simplificado Ativo 🌱
            </h3>
            <p className="text-green-700 text-sm">
              Mostrando apenas o essencial para reduzir sobrecarga cognitiva. 
              Você pode alterar isso nas configurações quando se sentir pronto.
            </p>
          </div>
        )}

        {/* Status Indicators - Always visible for autism predictability */}
        <div className="bg-theme-sidebar rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
                <span className="text-theme-muted">Sistema: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />
                <span className="text-theme-muted">
                  Último salvamento: {new Date().toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            <div className="text-theme-muted">
              {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'} no total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}