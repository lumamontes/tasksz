import { useStore } from '@nanostores/react';
import { useState } from 'react';
import type { Area, Project } from '../../types';
import { $areas, deleteArea, updateArea } from '../../stores/areasStore';
import { $projects, deleteProject, updateProject } from '../../stores/projectsStore';
import { projectInputSchema, type EntityInput } from '../../domain/areasProjects/schemas';
import { EntityForm } from './EntityForm';
import { Pencil, Trash2 } from 'lucide-react';

type Entity = Area | Project;

interface EntityManagerProps {
  kind: 'area' | 'project';
  onClose: () => void;
}

export function EntityManager({ kind, onClose }: EntityManagerProps) {
  const areas = useStore($areas);
  const projects = useStore($projects);
  const entities: Entity[] = kind === 'area' ? areas : projects;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = kind === 'area' ? 'Gerenciar áreas' : 'Gerenciar projetos';
  const description = kind === 'area'
    ? 'Áreas são privadas e só organizam suas tarefas.'
    : 'Projetos podem receber colaboração no futuro.';

  const save = async (input: EntityInput) => {
    if (!editingId) return;
    if (kind === 'area') await updateArea(editingId, input);
    else await updateProject(editingId, projectInputSchema.parse(input));
    setEditingId(null);
  };

  const remove = async (entity: Entity) => {
    if (!confirm(`Excluir ${kind === 'area' ? 'a área' : 'o projeto'} “${entity.name}”? As tarefas serão mantidas sem ${kind === 'area' ? 'área' : 'projeto'}.`)) return;
    try {
      if (kind === 'area') await deleteArea(entity.id);
      else await deleteProject(entity.id);
      setError(null);
    } catch {
      setError(`Não foi possível excluir ${kind === 'area' ? 'a área' : 'o projeto'}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="dialog" aria-modal="true" aria-labelledby={`${kind}-manager-title`}>
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-theme-border bg-theme-panel p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 id={`${kind}-manager-title`} className="text-lg font-semibold text-theme-text">{title}</h2><p className="mt-1 text-sm text-theme-muted">{description}</p></div>
          <button type="button" onClick={onClose} className="text-sm text-theme-muted hover:text-theme-text">Fechar</button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        {entities.length === 0 ? <p className="py-8 text-center text-sm text-theme-muted">Nenhum item criado ainda.</p> : (
           <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-bg">
             {entities.map((entity) => editingId === entity.id ? (
               <div key={entity.id} className="border-b border-theme-border bg-theme-sidebar p-4 last:border-b-0">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-theme-muted">Editando {kind === 'area' ? 'área' : 'projeto'}</p>
                <EntityForm
                  kind={kind}
                  resetKey={entity.id}
                   defaultValues={{ name: entity.name, description: entity.description || '', color: 'color' in entity ? entity.color || '#8b7cf6' : '#8b7cf6', ...('areaId' in entity ? { areaId: entity.areaId } : {}) }}
                  onSubmit={save}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
               <div key={entity.id} className="group flex items-center gap-3 border-b border-theme-border px-4 py-3 last:border-b-0 hover:bg-theme-sidebar">
                 {kind === 'area' && 'color' in entity && <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entity.color || 'var(--theme-accent)' }} />}
                 <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-theme-text">{entity.name}</p>{entity.description && <p className="truncate text-xs text-theme-muted">{entity.description}</p>}</div>
                 <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                   <button type="button" onClick={() => setEditingId(entity.id)} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg hover:text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent" aria-label={`Editar ${entity.name}`} title="Editar"><Pencil className="h-4 w-4" /></button>
                   <button type="button" onClick={() => { void remove(entity); }} className="rounded-lg p-2 text-theme-muted hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={`Excluir ${entity.name}`} title="Excluir"><Trash2 className="h-4 w-4" /></button>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
