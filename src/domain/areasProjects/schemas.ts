import { z } from 'zod';

const nameSchema = z.string().trim().min(1, 'Informe um nome.').max(120, 'Use no máximo 120 caracteres.');

export const DEFAULT_AREA_COLOR = '#8b7cf6';

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
