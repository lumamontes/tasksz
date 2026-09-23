import { z } from 'zod';

export const entityInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe um nome.').max(120, 'Use no máximo 120 caracteres.'),
  description: z.string().trim().max(200, 'Use no máximo 200 caracteres.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Escolha uma cor válida.'),
});

export const areaInputSchema = entityInputSchema.extend({
  description: z.string().trim().max(160, 'Use no máximo 160 caracteres.'),
});

export const projectInputSchema = entityInputSchema.extend({
  areaId: z.string().trim().min(1, 'Escolha uma área.'),
});

export const projectCreateSchema = projectInputSchema.extend({
  areaId: z.string().trim().min(1, 'Escolha uma área.'),
});

export type AreaInput = z.infer<typeof areaInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type EntityInput = AreaInput | ProjectInput;
