/**
 * EnergyLevelTracker Component  
 * Helps users track and communicate their current energy/spoon levels
 * Adapts UI recommendations based on energy state
 */

import { useStore } from '@nanostores/react';
import { $energyLevel, updateEnergyLevel } from '../../stores/ndStore';
import { $settings } from '../../stores/settingsStore';
import { Battery, BatteryLow, Zap } from 'lucide-react';

export function EnergyLevelTracker() {
  const energyLevel = useStore($energyLevel);
  const settings = useStore($settings);

  const energyOptions = [
    {
      level: 'low' as const,
      icon: BatteryLow,
      label: 'Baixa Energia',
      description: 'Preciso de tarefas simples e rápidas',
      color: 'text-red-600 bg-red-50 border-red-200',
      activeColor: 'bg-red-100 border-red-300'
    },
    {
      level: 'medium' as const,
      icon: Battery,
      label: 'Energia Estável',
      description: 'Posso fazer tarefas moderadas',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      activeColor: 'bg-yellow-100 border-yellow-300'
    },
    {
      level: 'high' as const,
      icon: Zap,
      label: 'Alta Energia',
      description: 'Pronto para tarefas complexas!',
      color: 'text-green-600 bg-green-50 border-green-200',
      activeColor: 'bg-green-100 border-green-300'
    }
  ];

  const handleEnergyChange = (level: 'low' | 'medium' | 'high') => {
    updateEnergyLevel(level);
  };

  return (
    <div className="bg-theme-sidebar rounded-xl p-4">
      <h3 className="text-sm font-semibold text-theme-text mb-3">
        Como está sua energia?
      </h3>
      
      <div className="space-y-2">
        {energyOptions.map(({ level, icon: Icon, label, description, color, activeColor }) => (
          <button
            key={level}
            onClick={() => handleEnergyChange(level)}
            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
              settings.reduceMotion ? '' : 'duration-200'
            } focus:outline-none focus:ring-2 focus:ring-theme-accent ${
              energyLevel === level 
                ? `${activeColor} ${color.split(' ')[0]} font-medium`
                : `${color} hover:${activeColor.split(' ')[0]}`
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs opacity-75">{description}</div>
              </div>
              {energyLevel === level && (
                <div className="w-2 h-2 bg-current rounded-full" aria-hidden="true" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Energy-based recommendations */}
      <div className="mt-4 p-3 bg-theme-bg rounded-lg">
        <h4 className="text-xs font-semibold text-theme-text mb-2">
          Recomendação
        </h4>
        <p className="text-xs text-theme-muted">
          {energyLevel === 'low' && (
            <>
              Foque em tarefas rápidas (5-15min) ou organize/revise trabalhos existentes. 
              Considere fazer uma pausa ou atividade relaxante.
            </>
          )}
          {energyLevel === 'medium' && (
            <>
              Bom momento para tarefas de duração média (15-45min) ou quebrar 
              tarefas grandes em pedaços menores.
            </>
          )}
          {energyLevel === 'high' && (
            <>
              Aproveite para tarefas complexas, criativas ou que exigem muito foco. 
              É um ótimo momento para começar projetos novos!
            </>
          )}
        </p>
      </div>
    </div>
  );
}