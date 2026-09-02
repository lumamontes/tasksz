/**
 * SettingsPage Component
 * Settings page for personalizing the app.
 */

import { useState } from 'react';
import { AppearanceSection } from './sections/AppearanceSection';
import { TypographySection } from './sections/TypographySection';
import { AccessibilitySection } from './sections/AccessibilitySection';
import { SoundSection } from './sections/SoundSection';
import { DataSection } from './sections/DataSection';
import { UndoToast } from './UndoToast';

export function SettingsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('aparencia');

  const sections = [
    { id: 'aparencia', title: 'Aparência', component: AppearanceSection },
    { id: 'tipografia', title: 'Tipografia', component: TypographySection },
    { id: 'acessibilidade', title: 'Acessibilidade', component: AccessibilitySection },
    { id: 'sons', title: 'Pomodoro & Sons', component: SoundSection },
    { id: 'dados', title: 'Dados', component: DataSection },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div data-section="configuracoes" className="h-full overflow-y-auto bg-theme-panel">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-theme-text mb-2">
            Configurações
          </h1>
          <p className="text-theme-muted">
            Personalize o Tarefitas do seu jeito. Todas as mudanças são aplicadas
            imediatamente.
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {sections.map(({ id, title, component: Component }) => (
            <div key={id} className="bg-theme-sidebar border border-theme-border rounded-xl overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[var(--bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-inset"
              >
                <h2 className="text-lg font-semibold text-theme-text">{title}</h2>
                <svg 
                  className={`w-5 h-5 text-theme-muted transition-transform duration-200 ${
                    expandedSection === id ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Section Content */}
              {expandedSection === id && (
                <div className="px-6 pb-6">
                  <Component />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-theme-border text-center">
          <p className="text-sm text-theme-muted">
            Tarefitas v1.0 — Seus dados ficam salvos apenas neste navegador.
          </p>
        </div>
      </div>

      {/* Undo Toast */}
      <UndoToast />
    </div>
  );
}