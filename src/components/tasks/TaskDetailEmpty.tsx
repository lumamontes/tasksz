/**
 * TaskDetailEmpty Component
 * Orientation and guidance for users when no task is selected
 */

import { Card } from '../ui/Card';

export function TaskDetailEmpty() {
  return (
    <div className="h-full overflow-y-auto bg-theme-panel">
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-theme-sidebar rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-theme-text mb-3">
              Bem-vindo ao Gerenciador de Tarefas
            </h2>
            <p className="text-theme-muted text-lg">
              Selecione uma tarefa na lista ao lado para ver os detalhes, ou crie uma nova tarefa para começar.
            </p>
          </div>

          {/* Quick Guide */}
          <div className="space-y-6">
            <Card padding="md" variant="sidebar">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Comece rápido
              </h3>
              <ul className="space-y-3 text-theme-text">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center text-sm font-semibold mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Crie uma nova tarefa</p>
                    <p className="text-sm text-theme-muted">Clique no botão "Nova" na lista de tarefas</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center text-sm font-semibold mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Adicione subtarefas</p>
                    <p className="text-sm text-theme-muted">Quebre tarefas grandes em passos menores e mais gerenciáveis</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center text-sm font-semibold mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Use o Pomodoro para focar</p>
                    <p className="text-sm text-theme-muted">Acompanhe seu tempo de foco e faça pausas regulares</p>
                  </div>
                </li>
              </ul>
            </Card>

            {/* Tips Section */}
            <Card padding="md" variant="sidebar">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Dicas para melhor produtividade
              </h3>
              <ul className="space-y-2 text-theme-text">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-theme-accent mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Quebre tarefas grandes em subtarefas para manter o foco e reduzir a ansiedade de começar</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-theme-accent mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Feche os detalhes da tarefa (Escape) quando quiser ver apenas a lista</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-theme-accent mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Use o timer Pomodoro destacável para manter a consciência do tempo sem distrações</span>
                </li>
              </ul>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card padding="md" variant="sidebar">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Atalhos de teclado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-theme-muted">Navegar tarefas</span>
                  <kbd className="px-2 py-1 bg-theme-panel border border-theme-border rounded text-theme-text font-mono">
                    J / K
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-theme-muted">Fechar detalhes</span>
                  <kbd className="px-2 py-1 bg-theme-panel border border-theme-border rounded text-theme-text font-mono">
                    Esc
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-theme-muted">Modo foco</span>
                  <kbd className="px-2 py-1 bg-theme-panel border border-theme-border rounded text-theme-text font-mono">
                    F
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-theme-muted">Salvar (ao editar)</span>
                  <kbd className="px-2 py-1 bg-theme-panel border border-theme-border rounded text-theme-text font-mono">
                    Enter
                  </kbd>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
