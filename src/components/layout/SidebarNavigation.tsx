/**
 * SidebarNavigation Component (React Island)
 * Interactive navigation buttons for sidebar sections.
 * Icons use the app-wide lucide sizing (w-4 h-4) for consistency.
 *
 * Collapse is fully CSS-driven by the `.sidebar-collapsed` class on the
 * <aside id="sidebar-navigation"> (see global.css): labels are hidden and
 * icons centered by CSS, so the rail looks correct even if the React store
 * and the DOM class ever fall out of sync. React only provides the hover
 * tooltip title.
 */

import { useStore } from '@nanostores/react';
import { $currentSection, setCurrentSection } from '../../stores/settingsStore';
import { $sidebarCollapsed } from '../../stores/layoutStore';
import type { Section } from '../../types';
import { CheckSquare, Settings } from 'lucide-react';

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'tasks', label: 'Tarefas' },
  { id: 'configuracoes', label: 'Configurações' },
];

const SECTION_ICONS = {
  tasks: CheckSquare,
  configuracoes: Settings,
} as const;

export function SidebarNavigation() {
  const currentSection = useStore($currentSection);
  const collapsed = useStore($sidebarCollapsed);

  return (
    <div
      className={`space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}
      role="tablist"
      aria-labelledby="sections-heading"
    >
      {SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        return (
          <button
            key={section.id}
            onClick={() => setCurrentSection(section.id)}
            role="tab"
            aria-selected={currentSection === section.id}
            aria-controls={`${section.id}-panel`}
            title={collapsed ? section.label : undefined}
            className={`
              w-full flex items-center gap-2.5 rounded-md text-sm font-medium
              transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent
              px-3 py-2 sidebar-nav-button
            `}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate sidebar-nav-label">{section.label}</span>
          </button>
        );
      })}
    </div>
  );
}