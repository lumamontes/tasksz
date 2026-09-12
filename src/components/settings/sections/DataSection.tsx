/**
 * DataSection Component
 * Data export, import and reset functionality
 */

import { useStore } from '@nanostores/react';
import { $tasks, $subtasks } from '../../../stores/tasksStore';
import { $settings, resetSettings } from '../../../stores/settingsStore';
import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { rxImportBackup, rxClearAllData } from '../../../lib/rxdb/bridge';
import type { Task, Subtask } from '../../../types';
import type { SettingsState } from '../../../stores/settingsStore';

export function DataSection() {
  const tasks = useStore($tasks);
  const subtasks = useStore($subtasks);
  const settings = useStore($settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const themeLabels: Record<SettingsState['themeId'], string> = {
    'calm-beige': 'Bege calmo',
    'high-contrast': 'Alto contraste',
    'low-stimulation': 'Baixa estimulação',
    custom: 'Personalizado',
  };

  const exportData = () => {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      tasks,
      subtasks,
      settings,
      meta: {
        totalTasks: tasks.length,
        totalSubtasks: subtasks.length,
        appVersion: '1.0.0'
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarefitas-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Basic validation
        if (!data.tasks && !data.subtasks && !data.settings) {
          alert('Arquivo de backup inválido. Verifique se o arquivo contém todos os dados necessários.');
          return;
        }

        if (confirm('Isso irá substituir todos os seus dados atuais. Tem certeza que deseja continuar?')) {
          const tasks = Array.isArray(data.tasks) ? (data.tasks as Task[]) : [];
          const subtasks = Array.isArray(data.subtasks) ? (data.subtasks as Subtask[]) : [];
          const settings = (data.settings as SettingsState | undefined);

          await rxImportBackup({ tasks, subtasks, settings });
          alert('Backup restaurado com sucesso!');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Erro ao ler o arquivo. Verifique se é um backup válido do Tarefitas.');
      } finally {
        // Allow re-selecting the same file
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 10000); // Auto-cancel after 10s
      return;
    }

    setShowResetConfirm(false);
    await rxClearAllData();
    resetSettings();

    // Clear app-owned legacy state without removing the Supabase session.
    try {
      [
        'tarefitas_v1_miniTimer',
        'tarefitas_v1_pomodoro',
        'tarefitas_v1_data',
        'tarefitas_overwhelm_mode',
      ].forEach((key) => localStorage.removeItem(key));
    } catch {
      // best-effort
    }

    // Reload page to reset all stores
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      
      {/* Data Overview */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Visão Geral dos Dados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="sm" variant="sidebar">
            <div className="text-2xl font-semibold text-theme-text">{tasks.length}</div>
            <div className="text-sm text-theme-muted">Tarefas</div>
          </Card>
          <Card padding="sm" variant="sidebar">
            <div className="text-2xl font-semibold text-theme-text">{subtasks.length}</div>
            <div className="text-sm text-theme-muted">Subtarefas</div>
          </Card>
          <Card padding="sm" variant="sidebar">
            <div className="text-2xl font-semibold text-theme-text">{themeLabels[settings.themeId] ?? settings.themeId}</div>
            <div className="text-sm text-theme-muted">Tema Atual</div>
          </Card>
        </div>
      </div>

      {/* Export Data */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Exportar Dados</h3>
        <Card padding="md" variant="sidebar">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-medium text-theme-text mb-2">Fazer backup dos seus dados</div>
              <div className="text-sm text-theme-muted mb-4">
                Salva todas as suas tarefas, subtarefas e configurações em um arquivo JSON. 
                Recomendamos fazer backups regularmente.
              </div>
              <Button
                onClick={exportData}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
              >
                Baixar Backup
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Import Data */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Importar Dados</h3>
        <Card padding="md" variant="sidebar">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-medium text-theme-text mb-2">Restaurar backup</div>
              <div className="text-sm text-theme-muted mb-4">
                Carrega dados de um arquivo de backup. Isso irá substituir todos os seus dados atuais.
              </div>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Escolher Arquivo
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-theme-muted">Apenas arquivos .json</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Reset to Defaults */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Restaurar Padrões</h3>
        <Card padding="md" variant="sidebar" className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-medium text-red-800 mb-2">Apagar todos os dados</div>
              <div className="text-sm text-red-700 mb-4">
                Remove todas as tarefas, subtarefas e configurações. Esta ação não pode ser desfeita. 
                Certifique-se de fazer um backup antes.
              </div>
              <Button
                onClick={resetAllData}
                variant={showResetConfirm ? 'primary' : 'secondary'}
                className={
                  showResetConfirm
                    ? 'bg-red-700 hover:bg-red-800 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }
              >
                {showResetConfirm ? 'Confirmar Reset' : 'Restaurar Padrões'}
              </Button>
              {showResetConfirm && (
                <p className="text-xs text-red-600 mt-2">
                  Clique novamente para confirmar. Esta ação é irreversível.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Info */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Armazenamento</h3>
        <Card padding="sm" variant="sidebar">
          <div className="text-sm text-theme-muted space-y-1">
            <div>• Seus dados ficam armazenados localmente no dispositivo (IndexedDB)</div>
            <div>• Sem login, nada é enviado para servidores externos</div>
            <div>• Com login, os dados sincronizam com sua conta <span className="font-medium">tarefitas</span> via Supabase</div>
            <div>• Faça backups regularmente para não perder seus dados</div>
          </div>
        </Card>
      </div>

    </div>
  );
}
