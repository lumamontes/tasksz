/**
 * SidebarNavigation Component (React Island)
 * Interactive navigation buttons for sidebar sections
 */

import { useStore } from '@nanostores/react';
import { $currentSection, setCurrentSection } from '../../stores/settingsStore';
import type { Section } from '../../types';
  import { CheckSquare, Settings } from 'lucide-react';
export function SidebarNavigation() {
  const currentSection = useStore($currentSection);

  const sections: Array<{ id: Section; label: string, icon: React.ReactNode }> = [
    { id: 'tasks', label: 'Tarefas' , icon: <CheckSquare /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings /> }
  ];

  return (
    <div className="space-y-2" role="tablist" aria-labelledby="sections-heading">
      {sections.map(section => (
        <button
          key={section.id}
          onClick={() => setCurrentSection(section.id)}
          role="tab"
          aria-selected={currentSection === section.id}
          aria-controls={`${section.id}-panel`}
          className={`w-full text-left px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent ${
            currentSection === section.id
              ? 'bg-theme-accent/10 text-theme-text'
              : 'text-theme-muted hover:bg-theme-bg hover:text-theme-text'
          }`}
        >
          <span className="inline-flex mr-2 align-middle">{section.icon}</span>
          {section.label}
        </button>
      ))}
    </div>
  );
}
