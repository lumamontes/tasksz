/**
 * Persistence Layer
 * Handles localStorage operations with versioning and migrations
 */

import type { Task, Subtask } from '../types';
import { $tasks, $subtasks, $selectedTaskId, $taskFilter } from './tasksStore';
import { $settings, type SettingsState } from './settingsStore';
import { $user, type UserState } from './userStore';

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = 'tarefitas_v1_';

interface StorageData {
  version: number;
  tasks: Task[];
  subtasks: Subtask[];
  selectedTaskId: string | null;
  taskFilter: 'all' | 'today' | 'in-progress' | 'completed' | 'archived';
  settings: SettingsState;
  user: UserState;
  lastSaved: string;
}

// Debounced save function
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = 500;

// Track if persistence is already set up to prevent multiple subscriptions
let isSetup = false;

function debouncedSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveToLocalStorage();
  }, SAVE_DEBOUNCE_MS);
}

// Save current state to localStorage
export function saveToLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    const data: StorageData = {
      version: STORAGE_VERSION,
      tasks: $tasks.get(),
      subtasks: $subtasks.get(),
      selectedTaskId: $selectedTaskId.get(),
      taskFilter: $taskFilter.get(),
      settings: $settings.get(),
      user: $user.get(),
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`${STORAGE_PREFIX}data`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Load state from localStorage
export function loadFromLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}data`);
    if (!stored) return false;
    
    const data: StorageData = JSON.parse(stored);
    
    // Handle version migrations if needed
    if (data.version !== STORAGE_VERSION) {
      migrateData(data);
    }
    
    // Parse dates
    const tasks = data.tasks.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt)
    }));
    
    // Set store values
    $tasks.set(tasks);
    $subtasks.set(data.subtasks);
    $selectedTaskId.set(data.selectedTaskId);
    if (data.taskFilter) {
      $taskFilter.set(data.taskFilter);
    }
    
    // Ensure settings have all required fields, especially customPalette
    if (data.settings) {
      // Ensure customPalette exists
      if (!data.settings.customPalette || typeof data.settings.customPalette !== 'object') {
        data.settings.customPalette = {
          bg: '#f8f7f4',
          panel: '#ffffff',
          sidebar: '#fefefe',
          text: '#2d3436',
          mutedText: '#636e72',
          accent: '#6c5ce7',
          border: '#dfe6e9'
        };
      }
      $settings.set(data.settings);
    }
    
    // Load user data
    if (data.user) {
      $user.set(data.user);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return false;
  }
}

// Handle data migrations
function migrateData(data: any) {
  // Migrate settings to add new fields with defaults
  if (data.settings) {
    if (data.settings.focusModeEnabled === undefined) {
      data.settings.focusModeEnabled = false;
    }
    // Ensure customPalette exists and has all required properties
    if (!data.settings.customPalette || typeof data.settings.customPalette !== 'object') {
      data.settings.customPalette = {
        bg: '#f8f7f4',
        panel: '#ffffff',
        sidebar: '#fefefe',
        text: '#2d3436',
        mutedText: '#636e72',
        accent: '#6c5ce7',
        border: '#dfe6e9'
      };
    }
  }
  
  // Migrate tasks to add calendar fields
  if (data.tasks) {
    data.tasks = data.tasks.map((task: any) => {
      // Add calendar fields if they don't exist
      if (task.scheduledDate === undefined) {
        task.scheduledDate = undefined;
      }
      if (task.recurring === undefined) {
        task.recurring = undefined;
      }
      // Remove nextStep field if it exists (deprecated)
      if (task.nextStep !== undefined) {
        delete task.nextStep;
      }
      return task;
    });
  }
  
  // Migrate user data - if no user data exists, initialize it
  if (!data.user) {
    data.user = {
      status: 'anonymous',
      profile: null
    };
  }
  
  console.log('Data migrated to latest version');
}

// Clear all stored data
export function clearLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}data`);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

// Seed demo data
export function seedDemoData() {
  const demoTasks: Task[] = [
    {
      id: 'task_1',
      title: 'Responder e-mail',
      description: 'Todos os e-mails que estão no endereço principal do google',
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
      archived: false
    },
    {
      id: 'task_2',
      title: 'Postar no Instagram',
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 1,
      archived: false
    },
    {
      id: 'task_3',
      title: 'Ir na terapia',
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 2,
      archived: false
    }
  ];
  
  const demoSubtasks: Subtask[] = [
    {
      id: 'subtask_1',
      taskId: 'task_1',
      title: 'Responder e-mail',
      done: false,
      order: 0
    },
    {
      id: 'subtask_2',
      taskId: 'task_1',
      title: 'Responder e-mail',
      done: false,
      order: 1
    },
    {
      id: 'subtask_3',
      taskId: 'task_1',
      title: 'Responder e-mail',
      done: false,
      order: 2
    },
    {
      id: 'subtask_4',
      taskId: 'task_1',
      title: 'Responder e-mail',
      done: false,
      order: 3
    }
  ];
  
  $tasks.set(demoTasks);
  $subtasks.set(demoSubtasks);
  $selectedTaskId.set('task_1');
}

// Setup auto-save listeners
export function setupPersistence() {
  if (typeof window === 'undefined') return;
  
  // Prevent multiple setups
  if (isSetup) return;
  isSetup = true;
  
  // Load existing data or seed demo data
  const loaded = loadFromLocalStorage();
  if (!loaded) {
    seedDemoData();
  }
  
  // Listen for changes and auto-save
  $tasks.subscribe(debouncedSave);
  $subtasks.subscribe(debouncedSave);
  $selectedTaskId.subscribe(debouncedSave);
  $taskFilter.subscribe(debouncedSave);
  $settings.subscribe(debouncedSave);
  $user.subscribe(debouncedSave);
}