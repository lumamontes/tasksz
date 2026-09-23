import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { areaInputSchema, projectCreateSchema } from '../../domain/areasProjects/schemas';
import { $areas, addArea } from '../../stores/areasStore';
import { $projects, addProject } from '../../stores/projectsStore';

interface TaskOrganizationFieldsProps {
  areaId?: string;
  projectId?: string;
  onAreaChange: (areaId: string | undefined) => void;
  onProjectChange: (projectId: string | undefined) => void;
}

const DEFAULT_AREA_COLOR = '#8b7cf6';

function useDebouncedValue(value: string, delay = 120) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

export function TaskOrganizationFields({ areaId, projectId, onAreaChange, onProjectChange }: TaskOrganizationFieldsProps) {
  const areas = useStore($areas);
  const projects = useStore($projects);
  const selectedArea = areas.find((area) => area.id === areaId);
  const selectedProject = projects.find((project) => project.id === projectId);
  const effectiveAreaId = areaId || selectedProject?.areaId;
  const effectiveArea = areas.find((area) => area.id === effectiveAreaId);
  const [areaQuery, setAreaQuery] = useState(selectedArea?.name || '');
  const [projectQuery, setProjectQuery] = useState(selectedProject?.name || '');
  const [areaOpen, setAreaOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedAreaQuery = useDebouncedValue(areaQuery.trim().toLocaleLowerCase());
  const debouncedProjectQuery = useDebouncedValue(projectQuery.trim().toLocaleLowerCase());

  useEffect(() => {
    if (selectedArea) setAreaQuery(selectedArea.name);
  }, [selectedArea?.id, selectedArea?.name]);

  useEffect(() => {
    if (selectedProject) setProjectQuery(selectedProject.name);
  }, [selectedProject?.id, selectedProject?.name]);

  const matchingAreas = areas.filter((area) => !debouncedAreaQuery || area.name.toLocaleLowerCase().includes(debouncedAreaQuery)).slice(0, 6);
  const scopedProjects = projects.filter((project) => project.areaId === effectiveAreaId);
  const matchingProjects = scopedProjects.filter((project) => !debouncedProjectQuery || project.name.toLocaleLowerCase().includes(debouncedProjectQuery)).slice(0, 6);

  const chooseArea = (nextAreaId: string) => {
    const area = areas.find((item) => item.id === nextAreaId);
    if (!area) return;
    onAreaChange(area.id);
    onProjectChange(undefined);
    setAreaQuery(area.name);
    setProjectQuery('');
    setAreaOpen(false);
    setError(null);
  };

  const createArea = async () => {
    const name = areaQuery.trim();
    const parsed = areaInputSchema.safeParse({ name, description: '', color: DEFAULT_AREA_COLOR });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Informe um nome de área.');
      return;
    }
    try {
      const nextAreaId = await addArea(parsed.data);
      onAreaChange(nextAreaId);
      onProjectChange(undefined);
      setAreaQuery(name);
      setProjectQuery('');
      setAreaOpen(false);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar a área.');
    }
  };

  const chooseProject = (nextProjectId: string) => {
    const project = projects.find((item) => item.id === nextProjectId);
    if (!project) return;
    onProjectChange(project.id);
    if (project.areaId) onAreaChange(project.areaId);
    setProjectQuery(project.name);
    setProjectOpen(false);
    setError(null);
  };

  const createProject = async () => {
    const name = projectQuery.trim();
    const parsed = projectCreateSchema.safeParse({ name, description: '', color: DEFAULT_AREA_COLOR, areaId: effectiveAreaId });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Informe um nome de projeto.');
      return;
    }
    try {
      const nextProjectId = await addProject(parsed.data);
      onProjectChange(nextProjectId);
      setProjectOpen(false);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar o projeto.');
    }
  };

  const removeArea = () => {
    onAreaChange(undefined);
    onProjectChange(undefined);
    setAreaQuery('');
    setProjectQuery('');
    setAreaOpen(false);
    setProjectOpen(false);
  };

  const removeProject = () => {
    onProjectChange(undefined);
    setProjectQuery('');
    setProjectOpen(false);
  };

  return (
    <div className="space-y-2 border-t border-theme-border pt-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-theme-muted">Organização <span className="font-normal normal-case tracking-normal">(opcional)</span></h3>
      <div className="relative">
        <label htmlFor="task-area" className="mb-1 block text-xs font-medium text-theme-muted">Área</label>
        {effectiveAreaId && (effectiveArea || areaQuery) && !areaOpen ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAreaOpen(true)} className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-theme-accent/40 bg-theme-accent/10 px-3 py-2 text-sm text-theme-text hover:border-theme-accent">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: effectiveArea?.color || 'var(--theme-accent)' }} />
              <span className="truncate">{effectiveArea?.name || areaQuery}</span>
            </button>
            <button type="button" onClick={removeArea} aria-label="Remover área da tarefa" className="rounded-md p-1.5 text-theme-muted hover:bg-theme-sidebar hover:text-theme-text"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-theme-muted" aria-hidden="true" />
            <input id="task-area" value={areaQuery} onChange={(event) => { setAreaQuery(event.target.value); onAreaChange(undefined); onProjectChange(undefined); setAreaOpen(true); }} onFocus={() => setAreaOpen(true)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (matchingAreas[0] && matchingAreas[0].name.toLocaleLowerCase() === areaQuery.trim().toLocaleLowerCase()) chooseArea(matchingAreas[0].id); else void createArea(); } if (event.key === 'Escape') setAreaOpen(false); }} placeholder="Ex.: Trabalho, Casa, Faculdade" autoComplete="off" className="w-full rounded-lg border border-theme-border bg-theme-bg py-2.5 pl-9 pr-3 text-sm text-theme-text outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20" role="combobox" aria-expanded={areaOpen} aria-controls="task-area-options" />
          </div>
        )}
        {areaOpen && (matchingAreas.length > 0 || areaQuery.trim()) && (
          <div id="task-area-options" role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-theme-border bg-theme-bg p-1 shadow-lg">
            {matchingAreas.map((area) => <button key={area.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseArea(area.id)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-theme-text hover:bg-theme-bg"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: area.color || 'var(--theme-accent)' }} />{area.name}</button>)}
            {areaQuery.trim() && !areas.some((area) => area.name.toLocaleLowerCase() === areaQuery.trim().toLocaleLowerCase()) && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => void createArea()} className="flex w-full items-center gap-2 rounded-md border-t border-theme-border px-3 py-2 text-left text-sm font-medium text-theme-accent hover:bg-theme-accent/10"><Plus className="h-4 w-4" />Criar “{areaQuery.trim()}”</button>}
          </div>
        )}
      </div>
      {effectiveAreaId && (
        <div className="relative">
           <label htmlFor="task-project" className="mb-1 block text-xs font-medium text-theme-muted">Projeto <span className="font-normal">(opcional)</span></label>
          {projectId && (selectedProject || projectQuery) && !projectOpen ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setProjectOpen(true)} className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text hover:border-theme-accent">
                <span className="h-2 w-2 shrink-0 rounded-full bg-theme-accent" />
                <span className="truncate">{selectedProject?.name || projectQuery}</span>
              </button>
              <button type="button" onClick={removeProject} aria-label="Remover projeto da tarefa" className="rounded-md p-1.5 text-theme-muted hover:bg-theme-sidebar hover:text-theme-text"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <input id="task-project" value={projectQuery} onChange={(event) => { setProjectQuery(event.target.value); onProjectChange(undefined); setProjectOpen(true); }} onFocus={() => setProjectOpen(true)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (matchingProjects[0] && matchingProjects[0].name.toLocaleLowerCase() === projectQuery.trim().toLocaleLowerCase()) chooseProject(matchingProjects[0].id); else void createProject(); } if (event.key === 'Escape') setProjectOpen(false); }} placeholder="Selecione ou crie um projeto" autoComplete="off" className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20" role="combobox" aria-expanded={projectOpen} aria-controls="task-project-options" />
          )}
          {projectOpen && (matchingProjects.length > 0 || projectQuery.trim()) && (
            <div id="task-project-options" role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-theme-border bg-theme-bg p-1 shadow-lg">
              {matchingProjects.map((project) => <button key={project.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseProject(project.id)} className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-theme-text hover:bg-theme-bg">{project.name}</button>)}
              {projectQuery.trim() && !projects.some((project) => project.name.toLocaleLowerCase() === projectQuery.trim().toLocaleLowerCase() && project.areaId === effectiveAreaId) && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => void createProject()} className="flex w-full items-center gap-2 rounded-md border-t border-theme-border px-3 py-2 text-left text-sm font-medium text-theme-accent hover:bg-theme-accent/10"><Plus className="h-4 w-4" />Criar “{projectQuery.trim()}”</button>}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
