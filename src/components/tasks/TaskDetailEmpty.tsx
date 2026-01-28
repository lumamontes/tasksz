/**
 * TaskDetailEmpty Component
 * ND-friendly dashboard when no task is selected
 */

import { useStore } from '@nanostores/react';
import { $settings } from '../../stores/settingsStore';
import { $tasks } from '../../stores/tasksStore';
import { $user, getUserName } from '../../stores/userStore';
import { TodaysPriorities } from '../executive/TodaysPriorities';
import { ContextPanel } from '../context/ContextPanel';
import { EnergyLevelTracker } from '../sensory/EnergyLevelTracker';
import { GentleProductivityMetrics } from '../metrics/GentleProductivityMetrics';
import { StreakCounter } from '../celebration/StreakCounter';
import { Card } from '../ui/Card';
import { CheckSquare, Calendar, Plus, CheckCircle } from 'lucide-react';

export function TaskDetailEmpty() {
  const settings = useStore($settings);
  const tasks = useStore($tasks);
  const user = useStore($user);
  
  // Get user name
  const userName = getUserName();
  const isFirstTime = tasks.length === 0;
  
  // Show ND dashboard if user has enabled ND features
  const showNDDashboard = settings.ndSettings?.executiveLoad !== 'complex';
  
  if (showNDDashboard) {
    return (
      <div className="h-full overflow-y-auto bg-theme-panel">
        <div className="p-6 space-y-6">
          {/* Welcome Message */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-theme-text mb-2">
              Painel de Hoje 🌱
            </h2>
            <p className="text-theme-muted">
              Organize seu dia com estrutura e gentileza
            </p>
          </div>

          {/* ND Dashboard Components */}
          <div className="space-y-6">
            <TodaysPriorities />
            <ContextPanel />
            <EnergyLevelTracker />
            <StreakCounter />
            <GentleProductivityMetrics />
          </div>
        </div>
      </div>
    );
  }

  // First time user experience
  if (isFirstTime) {
    return (
      <div className="h-full overflow-y-auto bg-theme-panel">
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            {/* Warm Welcome */}
            <div className="text-center mb-12">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-theme-accent/20 to-theme-accent/10 rounded-full flex items-center justify-center">
                <CheckSquare className="w-12 h-12 text-theme-accent" />
              </div>
              <h2 className="text-3xl font-bold text-theme-text mb-4">
                Olá, {userName}! 👋
              </h2>
              <p className="text-theme-muted text-lg mb-6">
                Que bom ter você aqui! Vamos organizar suas tarefas de uma forma simples e eficaz.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-theme-accent/10 text-theme-accent rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Pronto para começar</span>
              </div>
            </div>

            {/* Tutorial with Example Task */}
            <div className="space-y-8">
              <Card padding="lg" variant="sidebar">
                <h3 className="text-xl font-semibold text-theme-text mb-6 flex items-center gap-3">
                  <Plus className="w-6 h-6 text-theme-accent" />
                  Como funciona
                </h3>
                
                {/* Example Task Component */}
                <div className="mb-6">
                  <p className="text-sm text-theme-muted mb-4">Exemplo de como suas tarefas ficarão:</p>
                  <div className="bg-theme-bg rounded-xl border border-theme-border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-5 h-5 rounded border-2 border-theme-accent bg-theme-accent flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-theme-text font-medium">Organizar meu workspace</span>
                    </div>
                    <div className="ml-8 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-theme-muted">
                        <div className="w-3 h-3 rounded border border-theme-border"></div>
                        <span>Limpar mesa</span>
                      </div>
                      <div className="flex items-center gap-2 text-theme-muted">
                        <div className="w-3 h-3 rounded border border-theme-border"></div>
                        <span>Organizar cabos</span>
                      </div>
                      <div className="flex items-center gap-2 text-theme-muted">
                        <div className="w-3 h-3 rounded border border-theme-border"></div>
                        <span>Arquivar documentos</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-theme-muted">
                      <Calendar className="w-3 h-3" />
                      <span>Hoje, 27 de janeiro de 2026</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-theme-accent text-white flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <div>
                      <h4 className="font-semibold text-theme-text">Crie sua primeira tarefa</h4>
                      <p className="text-theme-muted">Use o botão "Nova Tarefa" na barra lateral</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-theme-accent text-white flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <div>
                      <h4 className="font-semibold text-theme-text">Quebre em pequenos passos</h4>
                      <p className="text-theme-muted">Adicione subtarefas para facilitar a execução</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-theme-accent text-white flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <div>
                      <h4 className="font-semibold text-theme-text">Acompanhe seu progresso</h4>
                      <p className="text-theme-muted">Marque subtarefas concluídas e veja seu avanço</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Encouragement */}
              <div className="text-center">
                <p className="text-theme-muted mb-4">
                  ✨ Você está a um clique de se organizar melhor!
                </p>
                <p className="text-sm text-theme-muted">
                  Comece criando sua primeira tarefa na barra lateral →
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Returning user with no task selected
  return (
    <div className="h-full overflow-y-auto bg-theme-panel">
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-theme-sidebar rounded-full flex items-center justify-center">
              <CheckSquare className="w-10 h-10 text-theme-accent" />
            </div>
            <h2 className="text-2xl font-semibold text-theme-text mb-3">
              Olá novamente, {userName}! 👋
            </h2>
            <p className="text-theme-muted text-lg">
              Selecione uma tarefa na lista ao lado para continuar trabalhando, ou crie uma nova tarefa.
            </p>
          </div>

          {/* Quick Stats or Tips */}
          <div className="space-y-6">
            <Card padding="md" variant="sidebar">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-theme-accent" />
                Dicas para ser mais produtivo
              </h3>
              <ul className="space-y-3 text-theme-text">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-secondary-500" />
                  <span>Quebre tarefas grandes em passos menores</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-secondary-500" />
                  <span>Use o calendário para agendar tarefas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-secondary-500" />
                  <span>Experimente o Pomodoro para manter o foco</span>
                </li>
              </ul>
            </Card>

            {/* Today's Focus */}
            <Card padding="md" variant="sidebar">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-theme-accent" />
                Foco de Hoje
              </h3>
              <div className="space-y-3 text-sm text-theme-muted">
                <p>✨ Escolha uma tarefa importante para começar</p>
                <p>⏰ Reserve um tempo sem distrações</p>
                <p>🎯 Celebre cada pequeno progresso</p>
                <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
                  <p className="text-secondary-700 text-xs">
                    <strong>Lembre-se:</strong> Não existe produtividade perfeita. O importante é começar, no seu ritmo.
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card padding="md" variant="sidebar">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-theme-accent" />
                Ações Rápidas
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button className="p-3 bg-theme-bg hover:bg-secondary-50 rounded-lg text-left transition-colors">
                  <div className="font-medium text-theme-text">Nova Tarefa</div>
                  <div className="text-xs text-theme-muted">Ctrl/Cmd + N</div>
                </button>
                <button className="p-3 bg-theme-bg hover:bg-secondary-50 rounded-lg text-left transition-colors">
                  <div className="font-medium text-theme-text">Pomodoro</div>
                  <div className="text-xs text-theme-muted">25min + pausa</div>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
