/**
 * AreaListPanel (island)
 * Searchable list of the owner's Areas. Selection is shared with the detail
 * pane through the Areas workspace store.
 */

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Plus } from 'lucide-react';
import { $areas } from '../../stores/areasStore';
import { $projects } from '../../stores/projectsStore';
import { countProjectsByArea, filterByName } from '../../stores/areasSelectors';
import { $resolvedAreasWorkspace, openArea, openCreateAreaDialog } from '../../stores/areasWorkspaceStore';
import { ColorDot, PrimaryButton, SearchField } from '../areas-projects/ui';
import { isRendered } from '../../utils/accessibility';
import { countLabel } from '../../utils/text';

export function AreaListPanel() {
  const areas = useStore($areas);
  const projects = useStore($projects);
  const { area: selectedArea, pane } = useStore($resolvedAreasWorkspace);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  // Compact layouts: coming back from the detail pane hides the focused
  // control, so continue from the selected Area.
  useEffect(() => {
    if (pane !== 'list') return;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!isRendered(listRef.current)) return;
      if (active && active !== document.body && isRendered(active)) return;
      listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [pane]);

  const visibleAreas = filterByName(areas, query);
  const projectCounts = countProjectsByArea(projects);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-theme-border px-5 pb-4">
        <div className="min-w-0 flex-1">
          <SearchField label="Filtrar áreas" value={query} onChange={setQuery} />
        </div>
        <PrimaryButton onClick={openCreateAreaDialog} icon={<Plus className="h-4 w-4" />} label="Nova área" />
      </div>
      <ul ref={listRef} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {visibleAreas.map((area) => {
          const selected = selectedArea?.id === area.id;
          return (
            <li key={area.id}>
              <button
                type="button"
                onClick={() => openArea(area.id)}
                aria-current={selected || undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent ${selected ? 'bg-theme-accent/10 text-theme-text' : 'text-theme-muted hover:bg-theme-sidebar hover:text-theme-text'}`}
              >
                <ColorDot color={area.color} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{area.name}</span>
                  <span className="mt-0.5 block text-xs text-theme-muted">{countLabel(projectCounts.get(area.id) ?? 0, 'projeto', 'projetos')}</span>
                </span>
              </button>
            </li>
          );
        })}
        {visibleAreas.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-theme-muted">
            {areas.length === 0 ? 'Nenhuma área criada ainda.' : 'Nenhuma área encontrada.'}
          </li>
        )}
      </ul>
    </div>
  );
}
