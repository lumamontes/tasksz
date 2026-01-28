/**
 * NDSettingsSection Component
 * Settings panel specifically for neurodivergent-friendly features
 */

import { useStore } from '@nanostores/react';
import { $settings, updateNDSettings } from '../../stores/settingsStore';

export function NDSettingsSection() {
  const settings = useStore($settings);
  const ndSettings = settings.ndSettings || {
    stimLevel: 'optimal' as const,
    focusMode: 'attention-support' as const,
    changeAnxiety: 'medium' as const,
    executiveLoad: 'standard' as const,
    animationIntensity: 'minimal' as const,
    colorContrast: 'medium' as const,
    texturePatterns: false,
    focusRingStyle: 'subtle' as const,
    celebrationStyle: 'minimal' as const,
    streakTracking: true,
    contextReminders: true,
    routineTemplates: true,
    randomizeOrder: false,
    hyperfocusBreaks: true
  };

  const handleToggle = (key: keyof typeof ndSettings, value: boolean) => {
    updateNDSettings({ [key]: value });
  };

  const handleSelect = (key: keyof typeof ndSettings, value: any) => {
    updateNDSettings({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-2">
          Recursos Neurodivergentes
        </h3>
        <p className="text-sm text-theme-muted mb-6">
          Configurações específicas para TDAH e autismo
        </p>
      </div>

      {/* Executive Function Support */}
      <div className="space-y-4">
        <h4 className="font-medium text-theme-text">Suporte às Funções Executivas</h4>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ndSettings.contextReminders}
              onChange={(e) => handleToggle('contextReminders', e.target.checked)}
              className="rounded border-theme-border"
            />
            <div>
              <div className="text-sm font-medium text-theme-text">Lembretes de Contexto</div>
              <div className="text-xs text-theme-muted">Painel "O que eu estava fazendo?"</div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ndSettings.streakTracking}
              onChange={(e) => handleToggle('streakTracking', e.target.checked)}
              className="rounded border-theme-border"
            />
            <div>
              <div className="text-sm font-medium text-theme-text">Contador de Sequência</div>
              <div className="text-xs text-theme-muted">Feedback visual de momentum</div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ndSettings.randomizeOrder}
              onChange={(e) => handleToggle('randomizeOrder', e.target.checked)}
              className="rounded border-theme-border"
            />
            <div>
              <div className="text-sm font-medium text-theme-text">Embaralhar Tarefas</div>
              <div className="text-xs text-theme-muted">Previne tédio com novidade</div>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text mb-2">
            Nível de Complexidade da Interface
          </label>
          <select
            value={ndSettings.executiveLoad}
            onChange={(e) => handleSelect('executiveLoad', e.target.value)}
            className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-panel text-theme-text"
          >
            <option value="minimal">Mínimo - Apenas essencial</option>
            <option value="standard">Padrão - Recursos principais</option>
            <option value="complex">Completo - Todos os recursos</option>
          </select>
        </div>
      </div>

      {/* ADHD-Specific Features */}
      <div className="space-y-4">
        <h4 className="font-medium text-theme-text">Recursos para TDAH</h4>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ndSettings.hyperfocusBreaks}
              onChange={(e) => handleToggle('hyperfocusBreaks', e.target.checked)}
              className="rounded border-theme-border"
            />
            <div>
              <div className="text-sm font-medium text-theme-text">Proteção contra Hiperfoco</div>
              <div className="text-xs text-theme-muted">Lembretes automáticos de pausa</div>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Estilo de Celebração
            </label>
            <select
              value={ndSettings.celebrationStyle}
              onChange={(e) => handleSelect('celebrationStyle', e.target.value)}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-panel text-theme-text"
            >
              <option value="none">Sem celebrações</option>
              <option value="minimal">Mínima - Apenas texto</option>
              <option value="full">Completa - Com confetes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Modo de Foco
            </label>
            <select
              value={ndSettings.focusMode}
              onChange={(e) => handleSelect('focusMode', e.target.value)}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-panel text-theme-text"
            >
              <option value="attention-support">Suporte à Atenção</option>
              <option value="hyperfocus-protection">Proteção Hiperfoco</option>
            </select>
          </div>
        </div>
      </div>

      {/* Autism-Specific Features */}
      <div className="space-y-4">
        <h4 className="font-medium text-theme-text">Recursos para Autismo</h4>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ndSettings.routineTemplates}
              onChange={(e) => handleToggle('routineTemplates', e.target.checked)}
              className="rounded border-theme-border"
            />
            <div>
              <div className="text-sm font-medium text-theme-text">Templates de Rotina</div>
              <div className="text-xs text-theme-muted">Estruturas previsíveis pré-definidas</div>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Ansiedade com Mudanças
            </label>
            <select
              value={ndSettings.changeAnxiety}
              onChange={(e) => handleSelect('changeAnxiety', e.target.value)}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-panel text-theme-text"
            >
              <option value="low">Baixa - Mudanças são OK</option>
              <option value="medium">Média - Avisos básicos</option>
              <option value="high">Alta - Máxima previsibilidade</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Intensidade de Animações
            </label>
            <select
              value={ndSettings.animationIntensity}
              onChange={(e) => handleSelect('animationIntensity', e.target.value)}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-panel text-theme-text"
            >
              <option value="none">Nenhuma</option>
              <option value="minimal">Mínima</option>
              <option value="standard">Padrão</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sensory Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-theme-text">Configurações Sensoriais</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Contraste de Cores
            </label>
            <select
              value={ndSettings.colorContrast}
              onChange={(e) => handleSelect('colorContrast', e.target.value)}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-panel text-theme-text"
            >
              <option value="soft">Suave</option>
              <option value="medium">Médio</option>
              <option value="high">Alto</option>
            </select>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ndSettings.texturePatterns}
              onChange={(e) => handleToggle('texturePatterns', e.target.checked)}
              className="rounded border-theme-border"
            />
            <div>
              <div className="text-sm font-medium text-theme-text">Padrões de Textura</div>
              <div className="text-xs text-theme-muted">Fundos sutis para agrupamento</div>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Estilo do Anel de Foco
            </label>
            <select
              value={ndSettings.focusRingStyle}
              onChange={(e) => handleSelect('focusRingStyle', e.target.value)}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-panel text-theme-text"
            >
              <option value="subtle">Sutil</option>
              <option value="bold">Destacado</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💙 Estas configurações foram projetadas com base em pesquisas sobre neurodivergência. 
          Ajuste conforme suas necessidades específicas - você é o especialista em seu próprio cérebro!
        </p>
      </div>
    </div>
  );
}