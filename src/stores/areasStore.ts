import { atom } from 'nanostores';
import type { Area } from '../types';
import { rxInsertArea, rxRemoveArea, rxUpdateArea, rxUpdateProject } from '../lib/rxdb/bridge';
import { $projects } from './projectsStore';
import { areaInputSchema, type AreaInput } from '../domain/areasProjects/schemas';

export const $areas = atom<Area[]>([]);

export const SUGGESTED_AREA_NAMES = ['Autocuidado', 'Trabalho', 'Estudos', 'Casa', 'Lazer'] as const;

const SUGGESTED_AREAS: AreaInput[] = [
  { name: 'Autocuidado', description: 'Rotinas de cuidado pessoal e bem-estar.', color: '#8b7cf6' },
  { name: 'Trabalho', description: 'Responsabilidades e projetos profissionais.', color: '#4f8df7' },
  { name: 'Estudos', description: 'Escola, faculdade e desenvolvimento pessoal.', color: '#5c82d6' },
  { name: 'Casa', description: 'Manutenção e responsabilidades do lar.', color: '#2da58a' },
  { name: 'Lazer', description: 'Atividades que trazem descanso e prazer.', color: '#e39a3b' },
];

export async function addArea(input: AreaInput) {
  const parsed = areaInputSchema.parse(input);

  const areas = $areas.get();
  const area: Area = {
    id: `area_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: parsed.name,
    description: parsed.description || undefined,
    color: parsed.color,
    order: areas.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await rxInsertArea(area);
  return area.id;
}

export async function addSuggestedAreas(): Promise<number> {
  const existingNames = new Set($areas.get().map((area) => area.name.trim().toLocaleLowerCase()));
  const missing = SUGGESTED_AREAS.filter((area) => !existingNames.has(area.name.toLocaleLowerCase()));
  for (const area of missing) await addArea(area);
  return missing.length;
}

export async function updateArea(id: string, updates: AreaInput) {
  const area = $areas.get().find((item) => item.id === id);
  if (!area) throw new Error('Área não encontrada.');
  const parsed = areaInputSchema.parse(updates);
  await rxUpdateArea(id, { ...area, ...parsed, description: parsed.description || undefined, updatedAt: new Date() });
}

export async function deleteArea(id: string) {
  const projects = $projects.get().filter((item) => item.areaId === id);
  await Promise.all(projects.map((project) => rxUpdateProject(project.id, { ...project, areaId: undefined, updatedAt: new Date() })));
  await rxRemoveArea(id);
}
