/**
 * Area and Project forms. Each form serves both create and edit flows;
 * validation and normalization live in the domain schemas.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useStore } from '@nanostores/react';
import { useForm, type FieldValues, type UseFormRegisterReturn, type UseFormReturn } from 'react-hook-form';
import {
  areaInputSchema,
  DEFAULT_AREA_COLOR,
  projectInputSchema,
  type AreaInput,
  type ProjectInput,
} from '../../domain/areasProjects/schemas';
import { $areas } from '../../stores/areasStore';

const inputClassName = 'w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20';

interface FormProps<T> {
  defaultValues?: Partial<T>;
  onSubmit: (input: T) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

function useSubmitWithRootError<T extends FieldValues>(form: UseFormReturn<T>, onSubmit: (input: T) => Promise<void>) {
  return form.handleSubmit(async (input) => {
    try {
      await onSubmit(input);
    } catch (error) {
      form.setError('root', { message: error instanceof Error ? error.message : 'Não foi possível salvar.' });
    }
  });
}

function TextField({ id, label, optional, error, maxLength, placeholder, autoFocus, registration }: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  maxLength: number;
  placeholder: string;
  autoFocus?: boolean;
  registration: UseFormRegisterReturn;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-theme-text">
        {label}{optional && <span className="font-normal text-theme-muted"> (opcional)</span>}
      </label>
      <input
        id={id}
        {...registration}
        autoFocus={autoFocus}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={inputClassName}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}

function FormFooter({ rootError, submitting, submitLabel, onCancel }: {
  rootError?: string;
  submitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <>
      {rootError && <p className="text-xs text-red-600" role="alert">{rootError}</p>}
      <div className="flex justify-end gap-3 border-t border-theme-border pt-4 text-sm">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-theme-muted hover:bg-theme-bg hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent">Cancelar</button>}
        <button type="submit" disabled={submitting} className="rounded-lg bg-theme-accent px-4 py-2 font-medium text-white shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-50">
          {submitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </>
  );
}

export function AreaForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Salvar' }: FormProps<AreaInput>) {
  const form = useForm<AreaInput>({
    resolver: zodResolver(areaInputSchema),
    defaultValues: { name: '', description: '', color: DEFAULT_AREA_COLOR, ...defaultValues },
  });
  const submit = useSubmitWithRootError(form, onSubmit);
  const { errors, isSubmitting } = form.formState;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <TextField id="area-name" label="Nome da área" autoFocus maxLength={120} placeholder="Ex.: Trabalho" error={errors.name?.message} registration={form.register('name')} />
      <TextField id="area-description" label="Descrição" optional maxLength={160} placeholder="Ex.: Onde ficam suas responsabilidades profissionais" error={errors.description?.message} registration={form.register('description')} />
      <div>
        <label htmlFor="area-color" className="mb-1.5 block text-sm font-medium text-theme-text">Cor da área</label>
        <div className="flex items-center gap-3">
          <input id="area-color" {...form.register('color')} type="color" aria-describedby="area-color-hint" className="h-10 w-12 cursor-pointer rounded-lg border border-theme-border bg-theme-bg p-1" />
          <span id="area-color-hint" className="text-xs text-theme-muted">Use uma cor para reconhecer esta área de relance.</span>
        </div>
        {errors.color?.message && <p className="mt-1 text-xs text-red-600" role="alert">{errors.color.message}</p>}
      </div>
      <FormFooter rootError={errors.root?.message} submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} />
    </form>
  );
}

export function ProjectForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Salvar' }: FormProps<ProjectInput>) {
  const areas = useStore($areas);
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: { name: '', description: '', areaId: '', ...defaultValues },
  });
  const submit = useSubmitWithRootError(form, onSubmit);
  const { errors, isSubmitting } = form.formState;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <TextField id="project-name" label="Nome do projeto" autoFocus maxLength={120} placeholder="Ex.: Lançamento do site" error={errors.name?.message} registration={form.register('name')} />
      <TextField id="project-description" label="Descrição" optional maxLength={200} placeholder="Ex.: Reunir as tarefas desta iniciativa" error={errors.description?.message} registration={form.register('description')} />
      <div>
        <label htmlFor="project-area" className="mb-1.5 block text-sm font-medium text-theme-text">Área do projeto</label>
        <select id="project-area" {...form.register('areaId')} aria-invalid={Boolean(errors.areaId)} className={inputClassName}>
          {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
        </select>
        {errors.areaId?.message && <p className="mt-1 text-xs text-red-600" role="alert">{errors.areaId.message}</p>}
      </div>
      <FormFooter rootError={errors.root?.message} submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} />
    </form>
  );
}
