import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { $projects } from "../../stores/projectsStore";

interface TaskOrganizationFieldsProps {
  projectId?: string;
  onProjectChange: (projectId: string | undefined) => void;
}

export function TaskOrganizationFields({
  projectId,
  onProjectChange,
}: TaskOrganizationFieldsProps) {
  const projects = useStore($projects);
  const selectedProject = projects.find((project) => project.id === projectId);
  const [projectQuery, setProjectQuery] = useState(selectedProject?.name || "");
  const [projectOpen, setProjectOpen] = useState(false);

  useEffect(() => {
    if (selectedProject) setProjectQuery(selectedProject.name);
    else if (!projectId) setProjectQuery("");
  }, [projectId, selectedProject?.id, selectedProject?.name]);

  const matchingProjects = projects
    .filter(
      (project) =>
        !projectQuery.trim() ||
        project.name
          .toLocaleLowerCase()
          .includes(projectQuery.trim().toLocaleLowerCase()),
    )
    .slice(0, 8);

  const chooseProject = (nextProjectId: string) => {
    const project = projects.find((item) => item.id === nextProjectId);
    if (!project) return;
    onProjectChange(project.id);
    setProjectQuery(project.name);
    setProjectOpen(false);
  };

  const removeProject = () => {
    onProjectChange(undefined);
    setProjectQuery("");
    setProjectOpen(false);
  };

  return (
    <div className="space-y-2 border-t border-theme-border pt-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-theme-muted">
        Organização{" "}
        <span className="font-normal normal-case tracking-normal">
          (opcional)
        </span>
      </h3>
      <div className="relative">
        <label
          htmlFor="task-project"
          className="mb-1 block text-xs font-medium text-theme-muted"
        >
          Projeto <span className="font-normal">(opcional)</span>
        </label>
        {projectId && (selectedProject || projectQuery) && !projectOpen ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setProjectOpen(true)}
              className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text hover:border-theme-accent"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-theme-accent" />
              <span className="truncate">
                {selectedProject?.name || projectQuery}
              </span>
            </button>
            <button
              type="button"
              onClick={removeProject}
              aria-label="Remover projeto da tarefa"
              className="rounded-md p-1.5 text-theme-muted hover:bg-theme-sidebar hover:text-theme-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-theme-muted"
              aria-hidden="true"
            />
            <input
              id="task-project"
              value={projectQuery}
              onChange={(event) => {
                setProjectQuery(event.target.value);
                onProjectChange(undefined);
                setProjectOpen(true);
              }}
              onFocus={() => setProjectOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setProjectOpen(false);
              }}
              placeholder={
                projects.length > 0
                  ? "Selecione um projeto"
                  : "Nenhum projeto criado"
              }
              autoComplete="off"
              className="w-full rounded-lg border border-theme-border bg-theme-bg py-2.5 pl-9 pr-3 text-sm text-theme-text outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
              role="combobox"
              aria-expanded={projectOpen}
              aria-controls="task-project-options"
            />
          </div>
        )}
        {projectOpen && matchingProjects.length > 0 && (
          <div
            id="task-project-options"
            role="listbox"
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-theme-border bg-theme-bg p-1 shadow-lg"
          >
            {matchingProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseProject(project.id)}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-theme-text hover:bg-theme-sidebar"
              >
                {project.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {projects.length === 0 && (
        <p className="text-xs text-theme-muted">
          Crie um projeto em Áreas para organizar tarefas por projeto.
        </p>
      )}
    </div>
  );
}
