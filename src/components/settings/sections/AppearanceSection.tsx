/**
 * AppearanceSection Component
 * Theme selection and custom palette editor
 */

import { useStore } from '@nanostores/react';
import { $settings, updateSettings, updateCustomPalette, resetAppearance, type ThemeId, type CustomPalette } from '../../../stores/settingsStore';

export function AppearanceSection() {
  const settings = useStore($settings);

  const themes = [
    {
      id: 'calm-beige' as ThemeId,
      name: 'Bege Calmo',
      description: 'Cores suaves e modernas para reduzir o estímulo visual',
      preview: { bg: '#f8f7f4', accent: '#6c5ce7' }
    },
    {
      id: 'high-contrast' as ThemeId,
      name: 'Alto Contraste',
      description: 'Contraste máximo para melhor legibilidade',
      preview: { bg: '#ffffff', accent: '#0066cc' }
    },
    {
      id: 'low-stimulation' as ThemeId,
      name: 'Baixo Estímulo',
      description: 'Tons de cinza suaves para sensibilidade visual',
      preview: { bg: '#f8f8f8', accent: '#666666' }
    },
    {
      id: 'custom' as ThemeId,
      name: 'Personalizado',
      description: 'Crie sua própria combinação de cores',
      preview: { 
        bg: settings.customPalette?.bg || '#fafafa', 
        accent: settings.customPalette?.accent || '#d99f6c' 
      }
    }
  ];

  const handleThemeChange = (themeId: ThemeId) => {
    updateSettings({ themeId });
  };

  const handleCustomColorChange = (property: keyof CustomPalette, value: string) => {
    updateCustomPalette({ [property]: value });
  };

  return (
    <div className="space-y-6">
      
      {/* Theme Selection */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Tema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`p-4 rounded-lg border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                settings.themeId === theme.id
                  ? 'border-theme-accent bg-[var(--accent)]/10'
                  : 'border-theme-border hover:border-theme-accent/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {/* Color Preview */}
                <div className="flex gap-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-theme-border"
                    style={{ backgroundColor: theme.preview.bg }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-theme-border"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>
                <span className="font-medium text-theme-text">{theme.name}</span>
                {settings.themeId === theme.id && (
                  <svg className="w-4 h-4 text-theme-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-theme-muted">{theme.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Palette Editor */}
      {settings.themeId === 'custom' && (
        <div>
          <h3 className="text-base font-medium text-theme-text mb-4">Paleta Personalizada</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(settings.customPalette || {}).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-theme-text mb-2 capitalize">
                  {key === 'bg' ? 'Fundo do App' :
                   key === 'panel' ? 'Fundo do Painel' :
                   key === 'sidebar' ? 'Fundo da Barra Lateral' :
                   key === 'text' ? 'Texto Principal' :
                   key === 'mutedText' ? 'Texto Secundário' :
                   key === 'accent' ? 'Cor de Destaque' :
                   key === 'border' ? 'Bordas' : key}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleCustomColorChange(key as keyof CustomPalette, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-theme-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleCustomColorChange(key as keyof CustomPalette, e.target.value)}
                    className="flex-1 px-3 py-2 border border-theme-border rounded-lg bg-theme-sidebar text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Live Preview */}
          <div className="mt-4 p-4 border border-theme-border rounded-lg">
            <h4 className="text-sm font-medium text-theme-text mb-2">Prévia</h4>
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: settings.customPalette?.sidebar || '#ffffff' }}
            >
              <div className="mb-2">
                <span style={{ color: settings.customPalette?.text || '#5f6d73' }}>
                  Texto principal
                </span>
              </div>
              <div className="mb-2">
                <span style={{ color: settings.customPalette?.mutedText || '#737373' }}>
                  Texto secundário
                </span>
              </div>
              <div 
                className="inline-block px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: settings.customPalette?.accent || '#d99f6c' }}
              >
                Elemento destacado
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Density Toggle */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Densidade</h3>
        <div className="flex gap-3">
          {[
            { value: 'cozy', label: 'Confortável', description: 'Mais espaço, ideal para focar' },
            { value: 'compact', label: 'Compacta', description: 'Menos espaço, mais informação' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => updateSettings({ density: option.value as 'cozy' | 'compact' })}
              className={`flex-1 p-3 rounded-lg border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                settings.density === option.value
                  ? 'border-theme-accent bg-[var(--accent)]/10'
                  : 'border-theme-border hover:border-theme-accent/50'
              }`}
            >
              <div className="font-medium text-theme-text">{option.label}</div>
              <div className="text-sm text-theme-muted mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bars Toggle */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Barras de Progresso</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div>
            <div className="font-medium text-theme-text">Mostrar barras de progresso</div>
            <div className="text-sm text-theme-muted">Ajuda a visualizar o andamento das tarefas</div>
          </div>
          <button
            onClick={() => updateSettings({ showProgressBars: !settings.showProgressBars })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
                      settings.showProgressBars ? 'bg-theme-accent' : 'bg-theme-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                        settings.showProgressBars ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
          </button>
        </label>
      </div>

      {/* Reset Appearance */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Restaurar Aparência</h3>
        <div className="p-4 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text mb-1">Restaurar configurações de aparência</div>
              <div className="text-sm text-theme-muted">Volta tema, densidade e barras de progresso para os padrões</div>
            </div>
            <button
              onClick={resetAppearance}
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