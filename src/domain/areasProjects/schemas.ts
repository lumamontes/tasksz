import { z } from 'zod';

const nameSchema = z.string().trim().min(1, 'Informe um nome.').max(120, 'Use no máximo 120 caracteres.');

export const DEFAULT_AREA_COLOR = '#8b7cf6';

/** A small, balanced palette for quick Area setup. Values remain user-editable. */
export const AREA_COLOR_PRESETS = [
  { name: 'Lavanda', value: '#8b7cf6' },
  { name: 'Azul', value: '#5b8def' },
  { name: 'Verde', value: '#5ca58f' },
  { name: 'Ocre', value: '#d49a5b' },
  { name: 'Coral', value: '#d87878' },
  { name: 'Malva', value: '#a078b8' },
  { name: 'Musgo', value: '#7d9665' },
  { name: 'Rosa', value: '#c47b9b' },
] as const;

export const areaInputSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(160, 'Use no máximo 160 caracteres.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Escolha uma cor válida.'),
});

/** Projects are owner-scoped and must live inside one of the owner's Areas. */
export const projectInputSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(200, 'Use no máximo 200 caracteres.'),
  areaId: z.string().trim().min(1, 'Escolha uma área.'),
});

export type AreaInput = z.infer<typeof areaInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
