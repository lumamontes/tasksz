import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Plus } from 'lucide-react';
import type { Area } from '../../types';
import { $projects } from '../../stores/projectsStore';
import { filterByName, selectProjectsInArea } from '../../stores/areasSelectors';
import { openCreateProjectDialog, showAreaOverview } from '../../stores/areasWorkspaceStore';
import { BackLink, EmptyRow, PrimaryButton, SearchField } from '../areas-projects/ui';
import { ProjectListCard } from './ProjectListCard';

export function AreaProjectList({ area }: { area: Area }) {
  const projects = useStore($projects);
  const [query, setQuery] = useState('');
  const visibleProjects = filterByName(selectProjectsInArea(projects, area.id), query);

  return (
    <section className="mx-auto max-w-3xl p-6 lg:p-8" aria-labelledby="area-projects-title">
      <BackLink onClick={showAreaOverview}>{area.name}</BackLink>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-theme-muted">Área</p>
          <h2 id="area-projects-title" tabIndex={-1} className="mt-2 break-words text-2xl font-semibold text-theme-text focus:outline-none">Projetos de {area.name}</h2>
        </div>
        <PrimaryButton onClick={() => openCreateProjectDialog(area.id)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>Novo projeto</PrimaryButton>
      </div>
      <div className="mt-6 mb-4">
        <SearchField label="Filtrar projetos" value={query} onChange={setQuery} tone="bg" />
      </div>
      <ProjectListCard label={`Projetos de ${area.name}`} projects={visibleProjects} empty={<EmptyRow>Nenhum projeto encontrado.</EmptyRow>} />
    </section>
  );
}
