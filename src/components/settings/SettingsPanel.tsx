/**
 * SettingsPanel Component
 * ND-friendly settings with accessibility options
 */

import { useStore } from '@nanostores/react';
import { $settings, updateSettings, updatePomodoroSettings } from '../../stores/settingsStore';
import { useState } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const settings = useStore($settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="bg-theme-sidebar rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-theme-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-theme-text">Configurações</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-theme-bg rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="p-6 space-y-6">
            
            {/* Accessibility Settings */}
            <div>
              <h3 className="text-lg font-medium text-theme-text mb-4">Acessibilidade</h3>
              <div className="space-y-4">
                
                {/* Progress Bars */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-theme-text">Mostrar barras de progresso</label>
                    <p className="text-xs text-theme-muted">Ajuda a visualizar o andamento das tarefas</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ showProgressBars: !settings.showProgressBars })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showProgressBars ? 'bg-theme-accent' : 'bg-theme-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                        settings.showProgressBars ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-theme-text">Reduzir movimento</label>
                    <p className="text-xs text-theme-muted">Minimiza animações para conforto sensorial</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.reduceMotion ? 'bg-theme-accent' : 'bg-theme-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                        settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-theme-text">Sons suaves</label>
                    <p className="text-xs text-theme-muted">Notificações sonoras opcionais</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-theme-accent' : 'bg-theme-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-sm font-medium text-theme-text block mb-2">Tema</label>
                  <div className="space-y-2">
                    {[
                      { value: 'calm-beige', label: 'Bege Calmo (padrão)' },
                      { value: 'high-contrast', label: 'Alto Contraste' },
                      { value: 'low-stimulation', label: 'Baixo Estímulo' }
                    ].map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => updateSettings({ theme: theme.value as any })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          settings.theme === theme.value 
                            ? 'bg-theme-panel text-theme-text border border-theme-accent'
                            : 'hover:bg-theme-bg border border-theme-border'
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-sm font-medium text-theme-text block mb-2">Tamanho da fonte</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'small', label: 'Pequena' },
                      { value: 'medium', label: 'Média' },
                      { value: 'large', label: 'Grande' }
                    ].map(size => (
                      <button
                        key={size.value}
                        onClick={() => updateSettings({ fontSize: size.value as any })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          settings.fontSize === size.value 
                            ? 'bg-theme-panel text-theme-text border border-theme-accent'
                            : 'hover:bg-theme-bg border border-theme-border'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Density */}
                <div>
                  <label className="text-sm font-medium text-theme-text block mb-2">Densidade</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'cozy', label: 'Confortável' },
                      { value: 'compact', label: 'Compacta' }
                    ].map(density => (
                      <button
                        key={density.value}
                        onClick={() => updateSettings({ density: density.value as any })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          settings.density === density.value 
                            ? 'bg-theme-panel text-theme-text border border-theme-accent'
                            : 'hover:bg-theme-bg border border-theme-border'
                        }`}
                      >
                        {density.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pomodoro Settings */}
            <div>
              <h3 className="text-lg font-medium text-theme-text mb-4">Timer Pomodoro</h3>
              <div className="space-y-4">
                
                {/* Focus Duration */}
                <div>
                  <label className="text-sm font-medium text-theme-text block mb-2">
                    Tempo de foco (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.pomodoro.focusMinutes}
                    onChange={(e) => updatePomodoroSettings({ focusMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
                  />
                </div>

                {/* Short Break */}
                <div>
                  <label className="text-sm font-medium text-theme-text block mb-2">
                    Pausa curta (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={settings.pomodoro.shortBreakMinutes}
                    onChange={(e) => updatePomodoroSettings({ shortBreakMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
                  />
                </div>

                {/* Long Break */}
                <div>
                  <label className="text-sm font-medium text-theme-text block mb-2">
                    Pausa longa (minutos)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="30"
                    value={settings.pomodoro.longBreakMinutes}
                    onChange={(e) => updatePomodoroSettings({ longBreakMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
                  />
                </div>

                {/* Cycles before long break */}
                <div>
                  <label className="text-sm font-medium text-theme-text block mb-2">
                    Ciclos antes da pausa longa
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={settings.pomodoro.cyclesBeforeLongBreak}
                    onChange={(e) => updatePomodoroSettings({ cyclesBeforeLongBreak: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-theme-border">
            <button
              onClick={onClose}
              className="w-full bg-theme-accent text-white py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium"
            >
              Salvar configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}