import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { FolderKanban, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { Area, Project, Task } from '../../types';
import { $areas, addArea, deleteArea, updateArea } from '../../stores/areasStore';
import { $projects, addProject, deleteProject, updateProject } from '../../stores/projectsStore';
import { $selectedTaskId, $tasks, selectTask } from '../../stores/tasksStore';
import { EntityForm } from '../areas-projects/EntityForm';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';
import { areaInputSchema, projectInputSchema, type EntityInput } from '../../domain/areasProjects/schemas';

type DetailMode = 'area' | 'projects';
type ProjectTab = 'overview' | 'tasks';

export function AreasController() {
  const areas = useStore($areas);
  const projects = useStore($projects);
  const tasks = useStore($tasks);
  const selectedTaskId = useStore($selectedTaskId);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [areaQuery, setAreaQuery] = useState('');
  const [projectQuery, setProjectQuery] = useState('');
  const [detailMode, setDetailMode] = useState<DetailMode>('area');
  const [projectTab, setProjectTab] = useState<ProjectTab>('overview');
  const [editing, setEditing] = useState(false);
  const [creatingArea, setCreatingArea] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleAreas = areas.filter((area) => area.name.toLocaleLowerCase().includes(areaQuery.trim().toLocaleLowerCase()));
  const selectedArea = areas.find((area) => area.id === selectedAreaId) || visibleAreas[0];
  const areaProjects = selectedArea ? projects.filter((project) => project.areaId === selectedArea.id) : [];
  const visibleProjects = areaProjects.filter((project) => project.name.toLocaleLowerCase().includes(projectQuery.trim().toLocaleLowerCase()));
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const projectTasks = selectedProject ? tasks.filter((task) => task.projectId === selectedProject.id) : [];

  useEffect(() => {
    if (!selectedAreaId && areas[0]) setSelectedAreaId(areas[0].id);
    if (selectedAreaId && !areas.some((area) => area.id === selectedAreaId)) {
      setSelectedAreaId(areas[0]?.id || null);
      setSelectedProjectId(null);
    }
  }, [areas, selectedAreaId]);

  useEffect(() => {
    if (selectedProjectId && !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [projects, selectedProjectId]);

  const chooseArea = (area: Area) => {
    setSelectedAreaId(area.id);
    setSelectedProjectId(null);
    setDetailMode('area');
    setEditing(false);
    setCreatingProject(false);
  };

  const chooseProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setProjectTab('overview');
    setEditing(false);
    setCreatingProject(false);
  };

  const saveArea = async (input: EntityInput) => {
    if (!selectedArea) return;
    await updateArea(selectedArea.id, areaInputSchema.parse(input));
    setEditing(false);
  };

  const saveProject = async (input: EntityInput) => {
    if (!selectedProject) return;
    await updateProject(selectedProject.id, projectInputSchema.parse(input));
    setEditing(false);
  };

  const createNewArea = async (input: EntityInput) => {
    await addArea(areaInputSchema.parse(input));
    setCreatingArea(false);
  };

  const createNewProject = async (input: EntityInput) => {
    if (!selectedArea) return;
    const id = await addProject(projectInputSchema.parse({ ...input, areaId: selectedArea.id }));
    setSelectedProjectId(id);
    setCreatingProject(false);
    setDetailMode('area');
  };

  const removeArea = async () => {
    if (!selectedArea || !confirm(`Excluir a área “${selectedArea.name}”? As tarefas serão mantidas.`)) return;
    try {
      await deleteArea(selectedArea.id);
      setError(null);
    } catch {
      setError('Não foi possível excluir a área.');
    }
  };

  const removeProject = async () => {
    if (!selectedProject || !confirm(`Excluir o projeto “${selectedProject.name}”? As tarefas serão mantidas sem projeto.`)) return;
    try {
      await deleteProject(selectedProject.id);
      setError(null);
    } catch {
      setError('Não foi possível excluir o projeto.');
    }
  };

  const renderTaskRow = (task: Task) => (
    <button key={task.id} type="button" onClick={() => selectTask(task.id)} className="flex w-full items-center gap-3 border-b border-theme-border px-4 py-3 text-left last:border-b-0 hover:bg-theme-sidebar">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-theme-border" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-sm text-theme-text">{task.title}</span>
      {task.scheduledDate && <span className="text-xs text-theme-muted">{task.scheduledDate}</span>}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <aside className="flex w-[22rem] shrink-0 flex-col border-r border-theme-border bg-theme-bg" aria-label="Áreas">
        <div className="border-b border-theme-border p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-medium uppercase tracking-widest text-theme-muted">Workspace</p><h1 className="mt-1 text-xl font-semibold text-theme-text">Áreas</h1></div>
            <button type="button" onClick={() => setCreatingArea(true)} className="rounded-lg bg-theme-accent p-2 text-white hover:opacity-90" aria-label="Nova área" title="Nova área"><Plus className="h-4 w-4" /></button>
          </div>
          <label className="relative mt-4 block"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-theme-muted" aria-hidden="true" /><input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="Filtrar áreas" className="w-full rounded-lg border border-theme-border bg-theme-panel py-2 pl-9 pr-3 text-sm text-theme-text outline-none focus:border-theme-accent" /></label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {visibleAreas.map((area) => {
            const count = projects.filter((project) => project.areaId === area.id).length;
            return <button key={area.id} type="button" onClick={() => chooseArea(area)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${selectedArea?.id === area.id ? 'bg-theme-accent/10 text-theme-text' : 'text-theme-muted hover:bg-theme-sidebar hover:text-theme-text'}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: area.color || 'var(--theme-accent)' }} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{area.name}</span><span className="mt-0.5 block text-xs text-theme-muted">{count} {count === 1 ? 'projeto' : 'projetos'}</span></span>
            </button>;
          })}
          {visibleAreas.length === 0 && <p className="px-3 py-8 text-center text-sm text-theme-muted">Nenhuma área encontrada.</p>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-theme-panel">
        {selectedTaskId ? <TaskDetailPanel /> : <>
        {error && <p className="mx-auto mt-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{error}</p>}
        {!selectedArea ? <div className="flex h-full items-center justify-center p-8 text-center"><div><h2 className="text-lg font-semibold text-theme-text">Comece por uma área</h2><p className="mt-1 text-sm text-theme-muted">Áreas agrupam projetos e deixam seu trabalho mais fácil de encontrar.</p><button type="button" onClick={() => setCreatingArea(true)} className="mt-4 rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white">Nova área</button></div></div> : selectedProject ? (
          <section className="mx-auto max-w-3xl p-6 lg:p-8">
            <button type="button" onClick={() => setSelectedProjectId(null)} className="mb-5 text-sm text-theme-muted hover:text-theme-text">← {selectedArea.name}</button>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-widest text-theme-muted">Projeto</p><h2 className="mt-2 text-2xl font-semibold text-theme-text">{selectedProject.name}</h2><p className="mt-1 text-sm text-theme-muted">{selectedProject.description || 'Sem descrição.'}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => setEditing(!editing)} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg hover:text-theme-text" aria-label="Editar projeto" title="Editar"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void removeProject()} className="rounded-lg p-2 text-theme-muted hover:bg-red-50 hover:text-red-600" aria-label="Excluir projeto" title="Excluir"><Trash2 className="h-4 w-4" /></button></div></div>
            <div className="mt-8 flex gap-5 border-b border-theme-border"><button type="button" onClick={() => setProjectTab('overview')} className={`border-b-2 pb-3 text-sm font-medium ${projectTab === 'overview' ? 'border-theme-accent text-theme-text' : 'border-transparent text-theme-muted'}`}>Visão geral</button><button type="button" onClick={() => setProjectTab('tasks')} className={`border-b-2 pb-3 text-sm font-medium ${projectTab === 'tasks' ? 'border-theme-accent text-theme-text' : 'border-transparent text-theme-muted'}`}>Tarefas <span className="ml-1 text-xs text-theme-muted">{projectTasks.length}</span></button></div>
            {editing ? <div className="mt-6"><EntityForm kind="project" resetKey={selectedProject.id} defaultValues={{ name: selectedProject.name, description: selectedProject.description || '', areaId: selectedProject.areaId }} onSubmit={saveProject} onCancel={() => setEditing(false)} variant="panel" /></div> : projectTab === 'tasks' ? <div className="mt-6 overflow-hidden rounded-xl border border-theme-border bg-theme-bg">{projectTasks.length ? projectTasks.map(renderTaskRow) : <p className="p-6 text-sm text-theme-muted">Nenhuma tarefa neste projeto.</p>}</div> : <div className="mt-6 rounded-xl border border-theme-border bg-theme-bg p-5"><p className="text-sm text-theme-muted">Este projeto tem {projectTasks.length} {projectTasks.length === 1 ? 'tarefa' : 'tarefas'}.</p><button type="button" onClick={() => setProjectTab('tasks')} className="mt-4 text-sm font-medium text-theme-accent hover:underline">Ver tarefas</button></div>}
          </section>
        ) : detailMode === 'projects' ? (
          <section className="mx-auto max-w-3xl p-6 lg:p-8"><button type="button" onClick={() => setDetailMode('area')} className="mb-5 text-sm text-theme-muted hover:text-theme-text">← {selectedArea.name}</button><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-widest text-theme-muted">Área</p><h2 className="mt-2 text-2xl font-semibold text-theme-text">Projetos de {selectedArea.name}</h2></div><button type="button" onClick={() => setCreatingProject(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Novo projeto</button></div><label className="relative mt-6 block"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-theme-muted" aria-hidden="true" /><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Filtrar projetos" className="w-full rounded-lg border border-theme-border bg-theme-bg py-2 pl-9 pr-3 text-sm text-theme-text outline-none focus:border-theme-accent" /></label><div className="mt-4 divide-y divide-theme-border overflow-hidden rounded-xl border border-theme-border bg-theme-bg">{visibleProjects.map((project) => <button key={project.id} type="button" onClick={() => chooseProject(project)} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-theme-sidebar"><FolderKanban className="h-4 w-4 text-theme-muted" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-theme-text">{project.name}</span><span className="text-xs text-theme-muted">{tasks.filter((task) => task.projectId === project.id).length} tarefas</span></span></button>)}{visibleProjects.length === 0 && <p className="p-6 text-sm text-theme-muted">Nenhum projeto encontrado.</p>}</div></section>
        ) : (
          <section className="mx-auto max-w-3xl p-6 lg:p-8"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedArea.color || 'var(--theme-accent)' }} /><p className="text-xs font-medium uppercase tracking-widest text-theme-muted">Área</p></div><h2 className="mt-2 text-2xl font-semibold text-theme-text">{selectedArea.name}</h2><p className="mt-1 text-sm text-theme-muted">{selectedArea.description || 'Organize projetos e tarefas relacionadas.'}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => setEditing(!editing)} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg hover:text-theme-text" aria-label="Editar área" title="Editar"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void removeArea()} className="rounded-lg p-2 text-theme-muted hover:bg-red-50 hover:text-red-600" aria-label="Excluir área" title="Excluir"><Trash2 className="h-4 w-4" /></button></div></div>{editing ? <div className="mt-8"><EntityForm kind="area" resetKey={selectedArea.id} defaultValues={{ name: selectedArea.name, description: selectedArea.description || '', color: selectedArea.color }} onSubmit={saveArea} onCancel={() => setEditing(false)} variant="panel" /></div> : <><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-theme-border bg-theme-bg p-4"><p className="text-2xl font-semibold text-theme-text">{areaProjects.length}</p><p className="mt-1 text-xs text-theme-muted">projetos</p></div><div className="rounded-xl border border-theme-border bg-theme-bg p-4"><p className="text-2xl font-semibold text-theme-text">{tasks.filter((task) => areaProjects.some((project) => project.id === task.projectId)).length}</p><p className="mt-1 text-xs text-theme-muted">tarefas</p></div></div><div className="mt-8 flex items-center justify-between"><h3 className="font-semibold text-theme-text">Projetos</h3><button type="button" onClick={() => setDetailMode('projects')} className="text-sm font-medium text-theme-accent hover:underline">Ver todos</button></div><div className="mt-3 divide-y divide-theme-border overflow-hidden rounded-xl border border-theme-border bg-theme-bg">{areaProjects.slice(0, 5).map((project) => <button key={project.id} type="button" onClick={() => chooseProject(project)} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-theme-sidebar"><FolderKanban className="h-4 w-4 text-theme-muted" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-theme-text">{project.name}</span><span className="text-xs text-theme-muted">{tasks.filter((task) => task.projectId === project.id).length}</span></button>)}{areaProjects.length === 0 && <button type="button" onClick={() => setCreatingProject(true)} className="flex w-full items-center gap-2 p-5 text-left text-sm text-theme-muted hover:bg-theme-sidebar"><Plus className="h-4 w-4" />Criar o primeiro projeto</button>}</div></>}</section>
        )}
        </>}
      </main>

      {creatingArea && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"><div className="w-full max-w-lg rounded-xl border border-theme-border bg-theme-panel p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-theme-text">Nova área</h2><button type="button" onClick={() => setCreatingArea(false)} aria-label="Fechar"><X className="h-5 w-5 text-theme-muted" /></button></div><EntityForm kind="area" onSubmit={createNewArea} onCancel={() => setCreatingArea(false)} variant="panel" /></div></div>}
      {creatingProject && selectedArea && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"><div className="w-full max-w-lg rounded-xl border border-theme-border bg-theme-panel p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-theme-muted">{selectedArea.name}</p><h2 className="mt-1 text-lg font-semibold text-theme-text">Novo projeto</h2></div><button type="button" onClick={() => setCreatingProject(false)} aria-label="Fechar"><X className="h-5 w-5 text-theme-muted" /></button></div><EntityForm kind="project" defaultValues={{ areaId: selectedArea.id }} onSubmit={createNewProject} onCancel={() => setCreatingProject(false)} variant="panel" /></div></div>}
    </div>
  );
}
