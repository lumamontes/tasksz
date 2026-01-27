/**
 * TaskItem Component
 * Individual task display with accessibility features for neurodivergent users
 */

import React, { useState } from 'react';
import type { Task } from '../../types';
import { Button } from '../ui/Button';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

const priorityColors = {
  1: 'bg-secondary-200 text-secondary-800', // Low - cream
  2: 'bg-peach-medium text-white', // Medium - peach
  3: 'bg-brown-accent text-white', // High - brown
};

const priorityLabels = {
  1: 'Low',
  2: 'Medium', 
  3: 'High',
};

export function TaskItem({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDueDate = (date?: Date): string => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === -1) return 'Due yesterday';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div 
      className={`
        bg-white rounded-xl border transition-all duration-200 ease-out
        ${task.completed 
          ? 'border-secondary-300 bg-secondary-50 opacity-75' 
          : isOverdue 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
        }
        ${showDetails ? 'ring-2 ring-primary-200' : ''}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onToggleComplete(task.id)}
            className={`
              mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150
              focus:ring-2 focus:ring-primary-300 focus:outline-none
              ${task.completed
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'border-gray-300 hover:border-primary-400 bg-white'
              }
            `}
            aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
          >
            {task.completed && (
              <svg 
                className="w-3 h-3" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 
                  className={`font-medium text-base leading-snug ${
                    task.completed ? 'text-gray-500 line-through' : 'text-slate'
                  }`}
                >
                  {task.title}
                </h3>
                
                {task.description && showDetails && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Priority badge */}
              <span 
                className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0
                  ${priorityColors[task.priority]}
                `}
                aria-label={`Priority: ${priorityLabels[task.priority]}`}
              >
                {priorityLabels[task.priority]}
              </span>
            </div>

            {/* Meta information */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {task.dueDate && (
                <span 
                  className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}
                  aria-label={`Due date: ${formatDueDate(task.dueDate)}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {formatDueDate(task.dueDate)}
                </span>
              )}

              {task.estimatedDuration && (
                <span 
                  className="flex items-center gap-1"
                  aria-label={`Estimated duration: ${task.estimatedDuration} minutes`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {task.estimatedDuration}m
                </span>
              )}

              {task.category && task.category !== 'general' && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {task.category}
                </span>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1">
                  {task.tags.slice(0, 3).map(tag => (
                    <span 
                      key={tag}
                      className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="text-gray-500 text-xs">
                      +{task.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost" 
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls={`task-details-${task.id}`}
          >
            {showDetails ? 'Less details' : 'More details'}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost" 
              size="small"
              onClick={() => onEdit(task)}
              aria-label={`Edit task: ${task.title}`}
            >
              Edit
            </Button>
            
            <Button
              variant="ghost" 
              size="small"
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label={`Delete task: ${task.title}`}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}