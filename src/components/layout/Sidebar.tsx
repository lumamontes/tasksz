/**
 * Sidebar Component
 * Left sidebar with greeting, sections, and task list
 */

import { useStore } from '@nanostores/react';
import { $currentSection, setCurrentSection, $settings } from '../../stores/settingsStore';
import { $taskFilter, setTaskFilter } from '../../stores/tasksStore';
import { $user, getUserName } from '../../stores/userStore';
import { TaskFilters } from '../tasks/TaskFilters';
import { useState, useEffect } from 'react';
import type { Section } from '../../types';

export function Sidebar() {
  const currentSection = useStore($currentSection);
  const user = useStore($user);
  const [isClient, setIsClient] = useState(false);
  
  // Use client-side only user name to avoid hydration mismatch
  const userName = isClient ? getUserName() : 'Pessoa';
  const userInitial = userName.charAt(0).toUpperCase();

  // Set client flag after mount to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get current date in Portuguese
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Format date to match Figma: "Hoje, 12 de fevereiro de 2026"
  const formattedDate = `Hoje, ${currentDate.split(',')[1]?.trim()}`;

  const sections: Array<{ id: Section | 'configuracoes'; label: string }> = [
    { id: 'tasks', label: 'Tarefas' },
    { id: 'calendar', label: 'Calendário' },
    { id: 'pomodoro', label: 'Pomodoro' },
    { id: 'configuracoes', label: 'Configurações' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="p-6 border-b border-theme-border">
        <h1 className="text-xl font-semibold text-theme-text mb-2">
          Bem vinde, {userName} :)
        </h1>
        <p className="text-sm text-theme-muted">
          {formattedDate}
        </p>
      </div>

      {/* Sections */}
      <nav className="p-6 border-b border-theme-border" role="navigation" aria-label="Seções do aplicativo">
        <h2 id="sections-heading" className="text-sm font-medium text-theme-text mb-4">
          Seções
        </h2>
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
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Task Filters */}
      {currentSection === 'tasks' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 id="tasks-heading" className="text-sm font-medium text-theme-text mb-4">
            Filtros
          </h2>
          <TaskFilters />
        </div>
      )}

      {/* User Avatar */}
      <div className="p-6 border-t border-theme-border">
        <div className="flex items-center gap-3">
          {user.profile?.avatarUrl ? (
            <img 
              src={user.profile.avatarUrl} 
              alt={userName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-theme-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">{userInitial}</span>
            </div>
          )}
          <span className="text-sm font-medium text-theme-text">{userName}</span>
        </div>
      </div>
    </div>
  );
}
