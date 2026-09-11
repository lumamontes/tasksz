/**
 * TypographySection Component
 * Font selection and scaling options
 */

import { useStore } from '@nanostores/react';
import { $settings, updateSettings, type FontId } from '../../../stores/settingsStore';

export function TypographySection() {
  const settings = useStore($settings);

  const fonts = [
    {
      id: 'system' as FontId,
      name: 'Sistema',
      description: 'Fonte padrão do sistema',
      sample: 'Aa Bb Cc 123',
      stack: 'system-ui'
    },
    {
      id: 'inter' as FontId,
      name: 'Inter',
      description: 'Moderna e legível para interfaces',
      sample: 'Aa Bb Cc 123',
      stack: 'Inter'
    },
    {
      id: 'atkinson' as FontId,
      name: 'Atkinson Hyperlegible',
      description: 'Especialmente desenhada para baixa visão',
      sample: 'Aa Bb Cc 123',
      stack: 'Atkinson Hyperlegible'
    },
    {
      id: 'lexend' as FontId,
      name: 'Lexend',
      description: 'Otimizada para melhor compreensão de leitura',
      sample: 'Aa Bb Cc 123',
      stack: 'Lexend'
    },
  ];

  const fontScales = [
    { value: 'sm', label: 'Pequena', description: '14px base' },
    { value: 'md', label: 'Média', description: '16px base' },
    { value: 'lg', label: 'Grande', description: '18px base' },
    { value: 'xl', label: 'Extra Grande', description: '20px base' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Font Selection */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Fonte</h3>
        <div className="space-y-3">
          {fonts.map(font => (
            <button
              key={font.id}
              onClick={() => updateSettings({ fontId: font.id })}
              className={`w-full p-4 rounded-lg border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                settings.fontId === font.id
                  ? 'border-theme-accent bg-[var(--accent)]/10'
                  : 'border-theme-border hover:border-theme-accent/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-theme-text">{font.name}</span>
                  {settings.fontId === font.id && (
                    <svg className="inline w-4 h-4 text-theme-accent ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-theme-muted mb-2">{font.description}</p>
              <div 
                className="text-lg"
                style={{ fontFamily: font.stack }}
              >
                {font.sample}
              </div>
            </button>
          ))}
        </div>
        
      </div>

      {/* Font Scale */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Tamanho da Fonte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {fontScales.map(scale => (
            <button
              key={scale.value}
              onClick={() => updateSettings({ fontScale: scale.value as any })}
              className={`p-3 rounded-lg border text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                settings.fontScale === scale.value
                  ? 'border-theme-accent bg-[var(--accent)]/10'
                  : 'border-theme-border hover:border-theme-accent/50'
              }`}
            >
              <div className="font-medium text-theme-text">{scale.label}</div>
              <div className="text-xs text-theme-muted mt-1">{scale.description}</div>
              {settings.fontScale === scale.value && (
                <svg className="w-4 h-4 text-theme-accent mx-auto mt-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
