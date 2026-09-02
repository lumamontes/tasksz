/**
 * Base type definitions for Tarefitas components
 */

export interface BaseComponentProps {
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  id?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  calendarEnabled?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  estimatedDuration: number; // minutes
  steps: RoutineStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineStep {
  id: string;
  name: string;
  description?: string;
  estimatedDuration: number; // minutes
  orderIndex: number;
  completed?: boolean;
}

export interface RoutineProgress {
  routineId: string;
  currentStepIndex: number;
  completedSteps: number;
  totalSteps: number;
  startedAt?: Date;
  lastActiveAt?: Date;
  completedAt?: Date;
  state: 'idle' | 'in-progress' | 'completed' | 'paused';
}

export interface CalendarEvent {
  id: string;
  routineId: string;
  calendarEventId: string;
  scheduledAt: Date;
  duration: number;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
}

export interface SyncMetadata {
  userId?: string;
  lastSyncAt?: Date;
  conflictCount: number;
  migrationCompletedAt?: Date;
}

// Task Management Types (updated for new structure)
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  done: boolean;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
  archived: boolean;
  // Calendar associations
  scheduledDate?: string;        // YYYY-MM-DD (local date, no time)
  recurring?: {
    type: "daily" | "weekly";
    daysOfWeek?: number[];       // 0–6 (Sun–Sat), only for weekly
  };
}

// New types for the app structure
export type Section = 'tasks' | 'configuracoes';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startTime: Date;
  duration: number;
  completed: boolean;
}

export interface Settings {
  showProgressBars: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
  theme: 'calm-beige' | 'high-contrast' | 'low-stimulation';
  fontSize: 'small' | 'medium' | 'large';
  density: 'cozy' | 'compact';
  pomodoro: PomodoroSettings;
}

export interface Habit {
  id: number;
  userId: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  color: string;
  active: boolean;
  createdAt: Date;
}

export interface HabitCompletion {
  id: number;
  habitId: number;
  completedAt: Date;
  notes?: string;
  count: number;
}

export interface PomodoroSession {
  id: number;
  userId: number;
  taskId?: number;
  duration: number; // in minutes (typically 25)
  breakDuration: number; // in minutes (typically 5 or 15)
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface UserPreferences {
  id: number;
  userId: number;
  theme: 'light' | 'dark';
  pomodoroWorkDuration: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  notificationSounds: boolean;
  notificationVibration: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}