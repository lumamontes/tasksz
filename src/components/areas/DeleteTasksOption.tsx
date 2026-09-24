/** Opt-in checkbox: by default, tasks survive their Project's deletion. */
export function DeleteTasksOption({ taskCount, checked, onChange, scope, className = '' }: {
  taskCount: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Ends the label, e.g. "deste projeto". */
  scope: string;
  className?: string;
}) {
  const tasksLabel = taskCount === 1 ? 'a tarefa' : `as ${taskCount} tarefas`;
  return (
    <label className={`flex items-start gap-3 ${className}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 accent-red-600" />
      <span className="text-sm">
        <span className="block text-theme-text">Excluir também {tasksLabel} {scope}</span>
        <span className="block text-xs text-theme-muted">
          {checked ? 'As tarefas e suas subtarefas serão excluídas.' : 'Sem marcar, as tarefas continuam na sua lista, sem projeto.'}
        </span>
      </span>
    </label>
  );
}
