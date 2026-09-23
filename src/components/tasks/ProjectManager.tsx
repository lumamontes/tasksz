import { EntityManager } from '../areas-projects/EntityManager';

export function ProjectManager({ onClose }: { onClose: () => void }) {
  return <EntityManager kind="project" onClose={onClose} />;
}
