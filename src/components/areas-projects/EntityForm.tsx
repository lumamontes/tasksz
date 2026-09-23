import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '@nanostores/react';
import { areaInputSchema, projectInputSchema, type EntityInput } from '../../domain/areasProjects/schemas';
import { $areas } from '../../stores/areasStore';

interface EntityFormProps {
  kind: 'area' | 'project';
  defaultValues?: Partial<EntityInput>;
  resetKey?: string;
  onSubmit: (input: EntityInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  variant?: 'default' | 'panel';
}

const emptyValues: EntityInput = { name: '', description: '', color: '#8b7cf6' };

export function EntityForm({ kind, defaultValues, resetKey, onSubmit, onCancel, submitLabel = 'Salvar', variant = 'default' }: EntityFormProps) {
  const schema = kind === 'area' ? areaInputSchema : projectInputSchema;
  const areas = useStore($areas);
  const form = useForm<EntityInput>({
    resolver: zodResolver(schema),
    defaultValues: { ...emptyValues, ...defaultValues },
  });

  useEffect(() => {
    // A identidade do registro define o limite para reiniciar o rascunho.
    form.reset({ ...emptyValues, ...defaultValues });
  }, [resetKey, form]);

  const submit = async (input: EntityInput) => {
    try {
      await onSubmit(input);
      form.clearErrors();
    } catch (error) {
      form.setError('root', { message: error instanceof Error ? error.message : 'Não foi possível salvar.' });
    }
  };

  const isArea = kind === 'area';
  const nameError = form.formState.errors.name?.message;
  const descriptionError = form.formState.errors.description?.message;
  const rootError = form.formState.errors.root?.message;

  const isPanel = variant === 'panel';

  return (
    <form onSubmit={form.handleSubmit(submit)} className={isPanel ? 'space-y-5' : 'space-y-2'}>
      <div>
        <label htmlFor={`${kind}-name`} className="mb-1.5 block text-sm font-medium text-theme-text">Nome {kind === 'area' ? 'da área' : 'do projeto'}</label>
        <input
          id={`${kind}-name`}
        {...form.register('name')}
        autoFocus
        maxLength={120}
        placeholder={isArea ? 'Ex.: Trabalho' : 'Ex.: Lançamento do site'}
        aria-invalid={Boolean(nameError)}
        className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
        />
        {nameError && <p className="mt-1 text-xs text-red-600" role="alert">{nameError}</p>}
      </div>
      <div>
        <label htmlFor={`${kind}-description`} className="mb-1.5 block text-sm font-medium text-theme-text">Descrição <span className="font-normal text-theme-muted">(opcional)</span></label>
        <input
          id={`${kind}-description`}
        {...form.register('description')}
        maxLength={isArea ? 160 : 200}
        placeholder={isArea ? 'Ex.: Onde ficam suas responsabilidades profissionais' : 'Ex.: Reunir as tarefas desta iniciativa'}
        aria-invalid={Boolean(descriptionError)}
        className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
        />
        {descriptionError && <p className="mt-1 text-xs text-red-600" role="alert">{descriptionError}</p>}
      </div>
      {isArea && (
        <div>
          <label htmlFor="area-color" className="mb-1.5 block text-sm font-medium text-theme-text">Cor da área</label>
          <div className="flex items-center gap-3">
            <input id="area-color" {...form.register('color')} type="color" className="h-10 w-12 cursor-pointer rounded-lg border border-theme-border bg-theme-bg p-1" />
            <span className="text-xs text-theme-muted">Use uma cor para reconhecer esta área de relance.</span>
          </div>
        </div>
      )}
      {!isArea && (
        <div>
          <label htmlFor="project-area" className="mb-1.5 block text-sm font-medium text-theme-text">Área do projeto</label>
          <select id="project-area" {...form.register('areaId')} className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20">
             {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </select>
        </div>
      )}
      {rootError && <p className="text-xs text-red-600" role="alert">{rootError}</p>}
      <div className="flex justify-end gap-3 border-t border-theme-border pt-4 text-sm">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-theme-muted hover:bg-theme-bg hover:text-theme-text">Cancelar</button>}
        <button type="submit" disabled={form.formState.isSubmitting} className={isPanel ? 'rounded-lg bg-theme-accent px-4 py-2 font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50' : 'rounded-lg px-3 py-2 font-medium text-theme-accent hover:bg-theme-accent/10 disabled:opacity-50'}>
          {form.formState.isSubmitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
