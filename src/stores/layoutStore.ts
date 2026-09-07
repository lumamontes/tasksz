/**
 * Layout Store
 * Shared state for resizable panels across Astro islands
 */

import { atom } from 'nanostores';

export const MIN_LEFT_WIDTH = 300;
export const MAX_LEFT_WIDTH = 640;
export const DEFAULT_LEFT_WIDTH = 360;
const STORAGE_KEY = 'task-panels-width';
export const SIDEBAR_STORAGE_KEY = 'task-sidebar-collapsed';

export const $leftPanelWidth = atom<number>(DEFAULT_LEFT_WIDTH);
export const $isResizing = atom<boolean>(false);
export const $sidebarCollapsed = atom<boolean>(false);

function clampWidth(width: number): number {
  return Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, width));
}

export function loadLeftPanelWidth() {
  if (typeof window === 'undefined') return;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const width = parseInt(saved, 10);
    if (width >= MIN_LEFT_WIDTH && width <= MAX_LEFT_WIDTH) {
      $leftPanelWidth.set(width);
    }
  }
}

export function setLeftPanelWidth(width: number) {
  $leftPanelWidth.set(clampWidth(width));
}

export function saveLeftPanelWidth() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, String($leftPanelWidth.get()));
}

export function setIsResizing(value: boolean) {
  $isResizing.set(value);
}

export function resetLeftPanelWidth() {
  $leftPanelWidth.set(DEFAULT_LEFT_WIDTH);
  saveLeftPanelWidth();
}

export function loadSidebarCollapsed() {
  if (typeof window === 'undefined') return;
  $sidebarCollapsed.set(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
}

export function toggleSidebarCollapsed() {
  const next = !$sidebarCollapsed.get();
  $sidebarCollapsed.set(next);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  }
}