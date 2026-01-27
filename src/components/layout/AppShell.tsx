/**
 * AppShell Layout Component
 * Two-column layout matching the Figma design
 */

import { useStore } from '@nanostores/react';
import { $currentSection, $settings, updateSettings } from '../../stores/settingsStore';
import { useEffect } from 'react';
import { useStoreInit } from '../../hooks/useStoreInit';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { Sidebar } from './Sidebar';
import { TasksView } from '../tasks/TasksView';
import { PomodoroView } from '../pomodoro/PomodoroView';
import { CalendarView } from '../calendar/CalendarView';
import { SettingsPage } from '../settings/SettingsPage';
import { FocusModeView } from '../focus/FocusModeView';
import { MiniPomodoro } from '../pomodoro/MiniPomodoro';

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const currentSection = useStore($currentSection);
  const settings = useStore($settings);

  // Initialize stores using centralized hook
  useStoreInit({ persistence: true, settings: true, miniTimer: true });

  // Apply density classes to root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = `density-${settings.density}`;
    }
  }, [settings.density]);

  // Keyboard shortcut for Focus Mode using custom hook
  useKeyboardShortcut(
    () => {
      updateSettings({ focusModeEnabled: !settings.focusModeEnabled });
    },
    {
      key: 'f',
      enabled: true,
      ignoreInputs: true,
    }
  );

  // Render the appropriate main panel content based on current section
  const renderMainPanel = () => {
    switch (currentSection) {
      case 'tasks':
        return <TasksView />;
      case 'pomodoro':
        return <PomodoroView />;
      case 'calendar':
        return <CalendarView />;
      case 'configuracoes':
        return <SettingsPage />;
      default:
        return <TasksView />;
    }
  };

  // If Focus Mode is enabled, show only FocusModeView
  if (settings.focusModeEnabled) {
    return (
      <div className="h-screen bg-theme-bg font-sans text-theme-text overflow-hidden">
        <FocusModeView />
        {children}
        {/* Floating Mini Pomodoro Timer */}
        <MiniPomodoro />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-theme-bg font-sans text-theme-text overflow-hidden">
      {/* Skip Links for Accessibility */}
      <div className="sr-only">
        <a 
          href="#main-content"
          className="focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-theme-accent text-white px-4 py-2 rounded-lg z-50"
        >
          Pular para o conteúdo principal
        </a>
        <a 
          href="#sidebar-navigation"
          className="focus:not-sr-only focus:absolute focus:top-4 focus:left-40 bg-theme-accent text-white px-4 py-2 rounded-lg z-50"
        >
          Pular para a navegação
        </a>
      </div>

      {/* Left Sidebar */}
      <aside 
        id="sidebar-navigation"
        className="w-80 bg-theme-sidebar border-r border-theme-border shrink-0"
        role="navigation"
        aria-label="Navegação principal"
      >
        <Sidebar />
      </aside>

      {/* Main Panel */}
      <main 
        id="main-content"
        className="flex-1 bg-theme-panel overflow-hidden"
        role="main"
        aria-label={`Conteúdo da seção ${currentSection}`}
      >
        {renderMainPanel()}
      </main>

      {/* Optional children slot */}
      {children}

      {/* Floating Mini Pomodoro Timer */}
      <MiniPomodoro />
    </div>
  );
}