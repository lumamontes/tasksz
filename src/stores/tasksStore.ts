/**
 * Tasks and Subtasks Store
 * Manages tasks, subtasks, and selected task state
 */

import { atom, computed } from 'nanostores';
import type { Task, Subtask } from '../types';

// Core state atoms
export const $tasks = atom<Task[]>([]);
export const $subtasks = atom<Subtask[]>([]);
export const $selectedTaskId = atom<string | null>(null);
export const $taskFilter = atom<'all' | 'today' | 'in-progress' | 'completed' | 'archived'>('all');

// Computed values
export const $selectedTask = computed([$tasks, $selectedTaskId], (tasks, selectedId) => {
  if (!selectedId) return null;
  return tasks.find(task => task.id === selectedId) || null;
});

export const $selectedTaskSubtasks = computed([$subtasks, $selectedTaskId], (subtasks, selectedId) => {
  if (!selectedId) return [];
  return subtasks
    .filter(subtask => subtask.taskId === selectedId)
    .sort((a, b) => a.order - b.order);
});

export const $taskProgress = computed([$selectedTaskSubtasks], (subtasks) => {
  if (subtasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
  
  const completed = subtasks.filter(s => s.done).length;
  const total = subtasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
});

// Get progress for a specific task
export function getTaskProgress(taskId: string) {
  const subtasks = $subtasks.get();
  const taskSubtasks = subtasks.filter(s => s.taskId === taskId);
  if (taskSubtasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
  
  const completed = taskSubtasks.filter(s => s.done).length;
  const total = taskSubtasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

// Filtered tasks based on current filter
export const $filteredTasks = computed([$tasks, $taskFilter, $subtasks], (tasks, filter, subtasks) => {
  let filtered = [...tasks];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (filter) {
    case 'today':
      // Tasks created today or with subtasks worked on today
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
      break;
    case 'in-progress':
      // Tasks with at least one incomplete subtask
      filtered = filtered.filter(task => {
        const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
        if (taskSubtasks.length === 0) return false; // No subtasks = not in progress
        return taskSubtasks.some(s => !s.done);
      });
      break;
    case 'completed':
      // Tasks where all subtasks are done
      filtered = filtered.filter(task => {
        const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
        if (taskSubtasks.length === 0) return false; // No subtasks = not completed
        return taskSubtasks.every(s => s.done);
      });
      break;
    case 'archived':
      filtered = filtered.filter(task => task.archived);
      break;
    case 'all':
    default:
      filtered = filtered.filter(task => !task.archived);
      break;
  }
  
  return filtered;
});

// Selected task index within filtered list
export const $selectedTaskIndex = computed([$filteredTasks, $selectedTaskId], (filteredTasks, selectedId) => {
  if (!selectedId) return -1;
  return filteredTasks.findIndex(task => task.id === selectedId);
});

// Action to set filter
export function setTaskFilter(filter: 'all' | 'today' | 'in-progress' | 'completed' | 'archived') {
  $taskFilter.set(filter);
}

// Action functions
export function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) {
  const tasks = $tasks.get();
  const newTask: Task = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: tasks.length
  };
  
  $tasks.set([...tasks, newTask]);
  return newTask.id;
}

export function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) {
  const tasks = $tasks.get();
  const updatedTasks = tasks.map(task => 
    task.id === id 
      ? { ...task, ...updates, updatedAt: new Date() }
      : task
  );
  
  $tasks.set(updatedTasks);
}

export function deleteTask(id: string) {
  const tasks = $tasks.get();
  const subtasks = $subtasks.get();
  
  // Remove task and its subtasks
  $tasks.set(tasks.filter(task => task.id !== id));
  $subtasks.set(subtasks.filter(subtask => subtask.taskId !== id));
  
  // Clear selection if deleted task was selected
  if ($selectedTaskId.get() === id) {
    $selectedTaskId.set(null);
  }
}

export function selectTask(id: string | null) {
  $selectedTaskId.set(id);
}

export function reorderTasks(reorderedTasks: Task[]) {
  const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
    ...task,
    order: index,
    updatedAt: new Date()
  }));
  
  $tasks.set(tasksWithNewOrder);
}

// Subtask actions
export function addSubtask(taskId: string, title: string) {
  const subtasks = $subtasks.get();
  const existingSubtasks = subtasks.filter(s => s.taskId === taskId);
  
  const newSubtask: Subtask = {
    id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    taskId,
    title,
    done: false,
    order: existingSubtasks.length
  };
  
  $subtasks.set([...subtasks, newSubtask]);
  return newSubtask.id;
}

export function updateSubtask(id: string, updates: Partial<Omit<Subtask, 'id' | 'taskId'>>) {
  const subtasks = $subtasks.get();
  const updatedSubtasks = subtasks.map(subtask =>
    subtask.id === id 
      ? { ...subtask, ...updates }
      : subtask
  );
  
  $subtasks.set(updatedSubtasks);
}

export function deleteSubtask(id: string) {
  const subtasks = $subtasks.get();
  $subtasks.set(subtasks.filter(subtask => subtask.id !== id));
}

export function toggleSubtaskDone(id: string) {
  const subtasks = $subtasks.get();
  const updatedSubtasks = subtasks.map(subtask =>
    subtask.id === id 
      ? { ...subtask, done: !subtask.done }
      : subtask
  );
  
  $subtasks.set(updatedSubtasks);
}

export function reorderSubtasks(taskId: string, reorderedSubtasks: Subtask[]) {
  const allSubtasks = $subtasks.get();
  const otherSubtasks = allSubtasks.filter(s => s.taskId !== taskId);
  
  const reorderedWithNewOrder = reorderedSubtasks.map((subtask, index) => ({
    ...subtask,
    order: index
  }));
  
  $subtasks.set([...otherSubtasks, ...reorderedWithNewOrder]);
}