import { z } from 'zod';

const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.').optional();

export const taskDraftSchema = z.object({
  title: z.string().trim().min(1, 'Digite um título para a tarefa.').max(200),
  description: z.string().trim().max(1000),
  scheduledDate: optionalDate,
  startDate: optionalDate,
  endDate: optionalDate,
  projectId: z.string().optional(),
}).refine((draft) => !draft.startDate || !draft.endDate || draft.startDate <= draft.endDate, {
  path: ['endDate'],
  message: 'A data de início deve ser anterior ou igual à data de fim.',
});

export type TaskDraft = z.infer<typeof taskDraftSchema>;
