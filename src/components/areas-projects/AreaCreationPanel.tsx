import { addArea } from '../../stores/areasStore';
import type { AreaInput } from '../../domain/areasProjects/schemas';
import { EntityForm } from './EntityForm';

interface AreaCreationPanelProps {
  onCreated: (areaId: string) => void;
}

export function AreaCreationPanel({ onCreated }: AreaCreationPanelProps) {
  const create = async (input: AreaInput) => {
    const areaId = await addArea(input);
    onCreated(areaId);
  };

  return (
    <div className="max-w-xl py-8">
      <p className="text-xs font-medium uppercase tracking-widest text-theme-muted">Opcional</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-theme-text">Crie uma área quando fizer sentido</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-theme-muted">Áreas ajudam a separar contextos da sua vida. Você também pode continuar usando o Tarefitas sem criar nenhuma.</p>
      <div className="mt-6 max-w-md">
        <EntityForm kind="area" variant="panel" onSubmit={create} submitLabel="Criar área" />
      </div>
    </div>
  );
}
