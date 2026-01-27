/**
 * TaskFilters Component
 * Filter buttons for tasks sidebar
 */

import { useStore } from '@nanostores/react';
import { $taskFilter, setTaskFilter } from '../../stores/tasksStore';

export function TaskFilters() {
  const currentFilter = useStore($taskFilter);

  const filters = [
    { id: 'all' as const, label: 'Todas' },
    { id: 'today' as const, label: 'Hoje' },
    { id: 'in-progress' as const, label: 'Em andamento' },
    { id: 'completed' as const, label: 'Concluídas' },
    { id: 'archived' as const, label: 'Arquivadas' },
  ];

  return (
    <div className="space-y-2" role="list" aria-label="Filtros de tarefas">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => setTaskFilter(filter.id)}
          role="listitem"
          aria-pressed={currentFilter === filter.id}
          className={`w-full text-left px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent ${
            currentFilter === filter.id
              ? 'bg-theme-accent/10 text-theme-text'
              : 'text-theme-muted hover:bg-theme-bg hover:text-theme-text'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
