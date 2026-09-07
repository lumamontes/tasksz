/**
 * SidebarCollapseButton Component (React Island)
 * Toggles the sidebar collapsed state. Owns BOTH the store mutation and the
 * DOM class on the <aside id="sidebar-navigation">, so the collapse is applied
 * by the same React instance that changes the state — no cross-bundle
 * subscription can desync them.
 *
 * On mount it reconciles its store from localStorage so the icon and class are
 * correct even if the inline <script> initializer hasn't run yet (or the store
 * module was duplicated across bundles).
 */

import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { $sidebarCollapsed, toggleSidebarCollapsed, SIDEBAR_STORAGE_KEY } from '../../stores/layoutStore';

const SIDEBAR_ID = 'sidebar-navigation';

function applyCollapsedClass(collapsed: boolean): void {
  const aside = document.getElementById(SIDEBAR_ID);
  if (!aside) return;
  aside.classList.toggle('sidebar-collapsed', collapsed);
}

export function SidebarCollapseButton() {
  const collapsed = useStore($sidebarCollapsed);
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  useEffect(() => {
    const persisted = window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    const current = $sidebarCollapsed.get();
    if (persisted !== current) {
      $sidebarCollapsed.set(persisted);
    } else {
      applyCollapsedClass(current);
    }
  }, []);

  useEffect(() => {
    applyCollapsedClass(collapsed);
  }, [collapsed]);

  return (
    <button
      type="button"
      onClick={() => toggleSidebarCollapsed()}
      aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
      aria-expanded={!collapsed}
      aria-pressed={collapsed}
      className="shrink-0 p-1.5 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}