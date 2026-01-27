/**
 * Settings Store
 * Comprehensive settings for neurodivergent-friendly customization
 */

import { atom } from 'nanostores';
import type { Section } from '../types';

export type ThemeId = "calm-beige" | "high-contrast" | "low-stimulation" | "custom";
export type FontId = "system" | "inter" | "atkinson" | "lexend" | "opendyslexic";

export interface CustomPalette {
  bg: string;          // app background
  panel: string;       // main panel background
  sidebar: string;     // sidebar background
  text: string;        // primary text
  mutedText: string;   // secondary text/labels
  accent: string;      // highlights, selected pills, progress fill
  border: string;      // subtle separators
}

export interface SettingsState {
  themeId: ThemeId;
  customPalette: CustomPalette;
  fontId: FontId;
  fontScale: "sm" | "md" | "lg" | "xl";
  density: "cozy" | "compact";
  showProgressBars: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
  pomodoroSound: "none" | "white-noise" | "pink-noise" | "brown-noise" | "rain" | "cafe";
  soundVolume: number;
  tickSoundEnabled: boolean;
  focusModeEnabled: boolean; // Focus mode toggle
  pomodoro: {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    cyclesBeforeLongBreak: number;
  };
}

// Predefined theme palettes
const themePalettes: Record<Exclude<ThemeId, 'custom'>, CustomPalette> = {
  'calm-beige': {
    bg: '#f8f7f4',
    panel: '#ffffff',
    sidebar: '#fefefe',
    text: '#2d3436',
    mutedText: '#636e72',
    accent: '#6c5ce7',
    border: '#dfe6e9'
  },
  'high-contrast': {
    bg: '#ffffff',
    panel: '#ffffff',
    sidebar: '#f5f5f5',
    text: '#000000',
    mutedText: '#444444',
    accent: '#0066cc',
    border: '#000000'
  },
  'low-stimulation': {
    bg: '#f8f8f8',
    panel: '#f0f0f0',
    sidebar: '#ffffff',
    text: '#555555',
    mutedText: '#888888',
    accent: '#666666',
    border: '#dddddd'
  }
};

// Default settings
const defaultSettings: SettingsState = {
  themeId: 'calm-beige',
  customPalette: {
    bg: '#f8f7f4',
    panel: '#ffffff',
    sidebar: '#fefefe',
    text: '#2d3436',
    mutedText: '#636e72',
    accent: '#6c5ce7',
    border: '#dfe6e9'
  },
  fontId: 'system',
  fontScale: 'md',
  density: 'cozy',
  showProgressBars: true,
  reduceMotion: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true,
  soundEnabled: false,
  pomodoroSound: 'none',
  soundVolume: 0.6,
  tickSoundEnabled: false,
  focusModeEnabled: false,
  pomodoro: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4
  }
};

// State atoms
export const $settings = atom<SettingsState>(defaultSettings);
export const $currentSection = atom<Section | 'configuracoes'>('tasks');
export const $previousSettings = atom<SettingsState | null>(null);

// Theme and font application
export function applyTheme(settings: SettingsState) {
  if (typeof document === 'undefined') return;
  
  const palette = settings.themeId === 'custom' 
    ? (settings.customPalette || themePalettes['calm-beige'])
    : (themePalettes[settings.themeId] || themePalettes['calm-beige']);
  
  // Ensure palette has all required properties
  if (!palette || !palette.bg) {
    console.warn('Invalid palette, using default');
    const defaultPalette = themePalettes['calm-beige'];
    const root = document.documentElement;
    root.style.setProperty('--bg', defaultPalette.bg);
    root.style.setProperty('--panel', defaultPalette.panel);
    root.style.setProperty('--sidebar', defaultPalette.sidebar);
    root.style.setProperty('--text', defaultPalette.text);
    root.style.setProperty('--muted', defaultPalette.mutedText);
    root.style.setProperty('--accent', defaultPalette.accent);
    root.style.setProperty('--border', defaultPalette.border);
    return;
  }
  
  const root = document.documentElement;
  root.style.setProperty('--bg', palette.bg);
  root.style.setProperty('--panel', palette.panel);
  root.style.setProperty('--sidebar', palette.sidebar);
  root.style.setProperty('--text', palette.text);
  root.style.setProperty('--muted', palette.mutedText);
  root.style.setProperty('--accent', palette.accent);
  root.style.setProperty('--border', palette.border);
}

export function applyFont(settings: SettingsState) {
  if (typeof document === 'undefined') return;
  
  const fontStacks: Record<FontId, string> = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    atkinson: '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    lexend: '"Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    opendyslexic: '"OpenDyslexic", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };
  
  const scaleMap = { sm: '14px', md: '16px', lg: '18px', xl: '20px' };
  
  const root = document.documentElement;
  root.style.setProperty('--font-family', fontStacks[settings.fontId]);
  root.style.setProperty('--font-size-base', scaleMap[settings.fontScale]);
}

// Action functions
export function updateSettings(updates: Partial<SettingsState>) {
  const current = $settings.get();
  $previousSettings.set(current); // Store for undo
  const updated = { ...current, ...updates };
  $settings.set(updated);
  
  // Apply changes immediately
  applyTheme(updated);
  applyFont(updated);
}

export function updatePomodoroSettings(updates: Partial<SettingsState['pomodoro']>) {
  const current = $settings.get();
  $previousSettings.set(current);
  const updated = {
    ...current,
    pomodoro: { ...current.pomodoro, ...updates }
  };
  $settings.set(updated);
}

export function updateCustomPalette(updates: Partial<CustomPalette>) {
  const current = $settings.get();
  $previousSettings.set(current);
  const updated = {
    ...current,
    themeId: 'custom' as ThemeId,
    customPalette: { ...current.customPalette, ...updates }
  };
  $settings.set(updated);
  applyTheme(updated);
}

export function setCurrentSection(section: Section | 'configuracoes') {
  $currentSection.set(section);
}

export function resetSettings() {
  $previousSettings.set($settings.get());
  $settings.set(defaultSettings);
  applyTheme(defaultSettings);
  applyFont(defaultSettings);
}

export function undoSettings() {
  const previous = $previousSettings.get();
  if (previous) {
    $settings.set(previous);
    $previousSettings.set(null);
    applyTheme(previous);
    applyFont(previous);
  }
}

// Section-level reset functions
export function resetAppearance() {
  $previousSettings.set($settings.get());
  const current = $settings.get();
  const updated = {
    ...current,
    themeId: defaultSettings.themeId,
    customPalette: defaultSettings.customPalette,
    density: defaultSettings.density,
    showProgressBars: defaultSettings.showProgressBars
  };
  $settings.set(updated);
  applyTheme(updated);
}

export function resetSounds() {
  $previousSettings.set($settings.get());
  const current = $settings.get();
  const updated = {
    ...current,
    soundEnabled: defaultSettings.soundEnabled,
    pomodoroSound: defaultSettings.pomodoroSound,
    soundVolume: defaultSettings.soundVolume,
    tickSoundEnabled: defaultSettings.tickSoundEnabled
  };
  $settings.set(updated);
}

export function resetPomodoro() {
  $previousSettings.set($settings.get());
  const current = $settings.get();
  const updated = {
    ...current,
    pomodoro: defaultSettings.pomodoro
  };
  $settings.set(updated);
}

// Global "Pausar tudo" action - stops pomodoro, sounds, animations
export async function pauseEverything() {
  // Import dynamically to avoid circular dependency
  if (typeof window !== 'undefined') {
    const { resetCountdown } = await import('./pomodoroStore');
    resetCountdown();
  }
  
  $previousSettings.set($settings.get());
  const current = $settings.get();
  const updated = {
    ...current,
    soundEnabled: false,
    reduceMotion: true // Freeze animations
  };
  $settings.set(updated);
}

// Initialize theme and font on load
export function initializeSettings() {
  if (typeof window === 'undefined') return; // Only run on client
  
  const settings = $settings.get();
  // Ensure customPalette exists before applying theme
  if (settings.themeId === 'custom' && (!settings.customPalette || !settings.customPalette.bg)) {
    // Fallback to default if custom palette is invalid
    const updated = {
      ...settings,
      customPalette: settings.customPalette || themePalettes['calm-beige']
    };
    $settings.set(updated);
    applyTheme(updated);
    applyFont(updated);
  } else {
    applyTheme(settings);
    applyFont(settings);
  }
}

// Get theme palette for current settings
export function getCurrentPalette(): CustomPalette {
  const settings = $settings.get();
  if (settings.themeId === 'custom') {
    return settings.customPalette || themePalettes['calm-beige'];
  }
  return themePalettes[settings.themeId] || themePalettes['calm-beige'];
}