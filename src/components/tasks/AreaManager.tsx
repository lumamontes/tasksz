import { EntityManager } from '../areas-projects/EntityManager';

export function AreaManager({ onClose }: { onClose: () => void }) {
  return <EntityManager kind="area" onClose={onClose} />;
}
