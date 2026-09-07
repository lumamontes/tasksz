/**
 * SoundSection Component
 * Pomodoro sound and duration settings.
 */

import { useStore } from '@nanostores/react';
import { $settings, updateSettings, updatePomodoroSettings, resetSounds, resetPomodoro } from '../../../stores/settingsStore';

export function SoundSection() {
  const settings = useStore($settings);

  return (
    <div className="space-y-6">

      {/* Master Sound Toggle */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Sons</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div>
            <div className="font-medium text-theme-text">Som ao finalizar sessão</div>
            <div className="text-sm text-theme-muted">
              Toca uma melodia suave quando uma sessão de foco ou pausa termina.
            </div>
          </div>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
              settings.soundEnabled ? 'bg-theme-accent' : 'bg-theme-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Pomodoro Settings */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Durações do Pomodoro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Tempo de foco (min)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.pomodoro.focusMinutes}
              onChange={(e) => updatePomodoroSettings({ focusMinutes: parseInt(e.target.value) || 25 })}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-sidebar text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Pausa curta (min)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={settings.pomodoro.shortBreakMinutes}
              onChange={(e) => updatePomodoroSettings({ shortBreakMinutes: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-sidebar text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Pausa longa (min)
            </label>
            <input
              type="number"
              min="15"
              max="30"
              value={settings.pomodoro.longBreakMinutes}
              onChange={(e) => updatePomodoroSettings({ longBreakMinutes: parseInt(e.target.value) || 15 })}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-sidebar text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>
        </div>
      </div>

      {/* Reset Sounds */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Restaurar Sons</h3>
        <div className="p-4 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text mb-1">Restaurar configuração de som</div>
              <div className="text-sm text-theme-muted">Volta o som para o estado inicial, ou seja, desligado</div>
            </div>
            <button
              onClick={resetSounds}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm font-medium"
            >
              Restaurar
            </button>
          </div>
        </div>
      </div>

      {/* Reset Pomodoro */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Restaurar Pomodoro</h3>
        <div className="p-4 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text mb-1">Restaurar configurações do pomodoro</div>
              <div className="text-sm text-theme-muted">Volta as durações de foco e pausa ao jeito de antes</div>
            </div>
            <button
              onClick={resetPomodoro}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm font-medium"
            >
              Restaurar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}