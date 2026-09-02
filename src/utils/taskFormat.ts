/**
 * Task formatting helpers
 * Shared, pure-ish formatters used to render task content as plain text or
 * markdown (clipboard copy, batch actions, etc.).
 */

import type { Task } from '../types';
import { $subtasks } from '../stores/tasksStore';
import { parseDateLocal } from './dateUtils';
import { htmlToPlainText } from './text';

export function formatLongDate(dateStr: string): string {
  return parseDateLocal(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function taskToMarkdown(task: Task): string {
  const subtasks = $subtasks
    .get()
    .filter((s) => s.taskId === task.id)
    .sort((a, b) => a.order - b.order);

  const lines: string[] = [];
  lines.push(`# ${task.title}`);
  if (task.scheduledDate) lines.push(`Data: ${formatLongDate(task.scheduledDate)}`);
  if (task.description) lines.push(`Descrição:\n${htmlToPlainText(task.description)}`);
  if (subtasks.length > 0) {
    lines.push('Subtarefas:');
    subtasks.forEach((s) => lines.push(`- [${s.done ? 'x' : ' '}] ${s.title}`));
  }
  return lines.join('\n');
}

export function tasksToMarkdown(tasks: Task[]): string {
  return tasks.map(taskToMarkdown).join('\n\n---\n\n');
}