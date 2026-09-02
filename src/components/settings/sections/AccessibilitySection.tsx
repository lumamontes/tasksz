/**
 * AccessibilitySection Component
 * Accessibility and motion settings
 */

import { useStore } from '@nanostores/react';
import { $settings, updateSettings, pauseEverything } from '../../../stores/settingsStore';

export function AccessibilitySection() {
  const settings = useStore($settings);

  return (
    <div className="space-y-6">
      
      {/* Focus Mode */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Modo Foco</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div>
            <div className="font-medium text-theme-text">Ativar modo foco</div>
            <div className="text-sm text-theme-muted">
              Esconde distrações e mostra apenas a tarefa atual, próxima subtarefa e pomodoro. Pressione <kbd className="px-1.5 py-0.5 bg-theme-bg text-theme-text rounded text-xs">F</kbd> para alternar rapidamente.
            </div>
          </div>
          <button
            onClick={() => updateSettings({ focusModeEnabled: !settings.focusModeEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
              settings.focusModeEnabled ? 'bg-theme-accent' : 'bg-theme-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                settings.focusModeEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>
      
      {/* Reduce Motion */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Movimento</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div>
            <div className="font-medium text-theme-text">Reduzir movimento</div>
            <div className="text-sm text-theme-muted">
              Minimiza animações para conforto sensorial e redução de distrações
            </div>
          </div>
          <button
            onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
              settings.reduceMotion ? 'bg-theme-accent' : 'bg-theme-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Celebrations */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Feedback</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div>
            <div className="font-medium text-theme-text">Celebrações ao concluir</div>
            <div className="text-sm text-theme-muted">
              Mostra uma mensagem breve quando você conclui tarefas. Desativado por padrão.
            </div>
          </div>
          <button
            onClick={() => updateSettings({ celebrationsEnabled: !settings.celebrationsEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
              settings.celebrationsEnabled ? 'bg-theme-accent' : 'bg-theme-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                settings.celebrationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Focus Indicators */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Navegação</h3>
        <div className="p-3 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="font-medium text-theme-text mb-2">Navegação por teclado</div>
          <div className="text-sm text-theme-muted space-y-1">
            <div><kbd className="px-2 py-1 bg-theme-bg text-theme-text rounded text-xs">Tab</kbd> - Navegar entre elementos</div>
            <div><kbd className="px-2 py-1 bg-theme-bg text-theme-text rounded text-xs">Enter</kbd> / <kbd className="px-2 py-1 bg-theme-bg text-theme-text rounded text-xs">Space</kbd> - Ativar botões</div>
            <div><kbd className="px-2 py-1 bg-theme-bg text-theme-text rounded text-xs">Esc</kbd> - Fechar modais</div>
            <div><kbd className="px-2 py-1 bg-theme-bg text-theme-text rounded text-xs">Ctrl + Enter</kbd> - Salvar edições</div>
          </div>
        </div>
      </div>

      {/* High Contrast Recommendation */}
      {settings.themeId !== 'high-contrast' && (
        <div>
          <h3 className="text-base font-medium text-theme-text mb-4">Contraste</h3>
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-blue-800">Dica de Acessibilidade</div>
                <div className="text-sm text-blue-700 mt-1">
                  Para melhor legibilidade, considere usar o tema "Alto Contraste" na seção Aparência.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Info */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Leitores de Tela</h3>
        <div className="p-3 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="font-medium text-theme-text mb-2">Compatibilidade</div>
          <div className="text-sm text-theme-muted space-y-1">
            <div>• NVDA (Windows)</div>
            <div>• JAWS (Windows)</div>
            <div>• VoiceOver (macOS/iOS)</div>
            <div>• TalkBack (Android)</div>
            <div>• Orca (Linux)</div>
          </div>
        </div>
      </div>

      {/* Motion Preview */}
      {!settings.reduceMotion && (
        <div>
          <h3 className="text-base font-medium text-theme-text mb-4">Prévia de Movimento</h3>
          <div className="p-3 rounded-lg border border-theme-border bg-theme-sidebar">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-theme-accent rounded-full animate-bounce"></div>
              <span className="text-sm text-theme-muted">Animação ativada</span>
            </div>
          </div>
        </div>
      )}

      {/* Pausar Tudo */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Pausar Tudo</h3>
        <div className="p-4 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text mb-1">Parar tudo agora</div>
              <div className="text-sm text-theme-muted">
                Para o pomodoro, desativa sons e congela animações. Útil quando precisa de uma pausa completa.
              </div>
            </div>
            <button
              onClick={pauseEverything}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm font-medium"
            >
              Pausar Tudo
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}