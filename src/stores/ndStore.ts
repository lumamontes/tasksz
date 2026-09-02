/**
 * ND-Specific Store
 * Tracks streaks, context, energy levels, and provides neurodivergent-friendly features
 */

import { atom, computed } from 'nanostores';
import type { Task } from '../types';

// State atoms
export const $completionStreak = atom<number>(0);
export const $lastCompletionTime = atom<Date | null>(null);
export const $currentContext = atom<string | null>(null);
export const $energyLevel = atom<'low' | 'medium' | 'high'>('medium');
export const $overwhelmLevel = atom<'calm' | 'elevated' | 'overwhelmed'>('calm');
export const $focusSessionStart = atom<Date | null>(null);
export const $lastTaskCompleted = atom<string | null>(null);

// Context tracking
export interface ContextState {
  currentTask: string | null;
  previousTask: string | null;
  sessionStart: Date | null;
  totalCompletions: number;
  todayCompletions: number;
}

export const $contextState = atom<ContextState>({
  currentTask: null,
  previousTask: null,
  sessionStart: null,
  totalCompletions: 0,
  todayCompletions: 0
});

// Celebration helpers
export function shouldShowCelebration(): boolean {
  const streak = $completionStreak.get();
  return streak > 0 && (streak % 3 === 0 || streak === 1);
}

export function getCelebrationLevel(): 'small' | 'medium' | 'large' {
  const streak = $completionStreak.get();
  if (streak >= 10) return 'large';
  if (streak >= 5) return 'medium';
  return 'small';
}

export function getCelebrationMessage(): string {
  const streak = $completionStreak.get();
  const level = getCelebrationLevel();

  switch (level) {
    case 'large':
      return `Impressionante — ${streak} tarefas em sequência.`;
    case 'medium':
      return `Bom ritmo — ${streak} tarefas em sequência.`;
    default:
      return 'Tarefa concluída.';
  }
}

// Hyperfocus protection
export const $focusSessionDuration = computed([$focusSessionStart], (start) => {
  if (!start) return 0;
  return Math.floor((Date.now() - start.getTime()) / (1000 * 60)); // minutes
});

export const $needsBreakReminder = computed([$focusSessionDuration], (duration) => {
  return duration > 90; // Suggest break after 90 minutes
});

// Action functions
export function recordTaskCompletion(taskId: string) {
  const now = new Date();
  const lastCompletion = $lastCompletionTime.get();
  
  // Update streak logic (reset if more than 4 hours since last completion)
  if (lastCompletion && (now.getTime() - lastCompletion.getTime()) < 4 * 60 * 60 * 1000) {
    $completionStreak.set($completionStreak.get() + 1);
  } else {
    $completionStreak.set(1);
  }
  
  $lastCompletionTime.set(now);
  $lastTaskCompleted.set(taskId);
  
  // Update context state
  const context = $contextState.get();
  $contextState.set({
    ...context,
    totalCompletions: context.totalCompletions + 1,
    todayCompletions: context.todayCompletions + 1
  });
}

export function startTaskContext(taskId: string) {
  const context = $contextState.get();
  $contextState.set({
    ...context,
    previousTask: context.currentTask,
    currentTask: taskId,
    sessionStart: new Date()
  });
  
  // Start focus session tracking
  if (!$focusSessionStart.get()) {
    $focusSessionStart.set(new Date());
  }
}

export function clearTaskContext() {
  const context = $contextState.get();
  $contextState.set({
    ...context,
    previousTask: context.currentTask,
    currentTask: null
  });
}

export function endFocusSession() {
  $focusSessionStart.set(null);
}

export function updateEnergyLevel(level: 'low' | 'medium' | 'high') {
  $energyLevel.set(level);
}

export function updateOverwhelmLevel(level: 'calm' | 'elevated' | 'overwhelmed') {
  $overwhelmLevel.set(level);
}

// Reset daily counters (call at midnight)
export function resetDailyCounters() {
  const context = $contextState.get();
  $contextState.set({
    ...context,
    todayCompletions: 0
  });
}