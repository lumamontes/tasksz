/**
 * TaskList Component
 * Main task list with filtering and sorting capabilities
 */

import React, { useState, useMemo } from 'react';
import type { Task } from '../../types';
import { TaskItem } from './TaskItem';
import { Button } from '../ui/Button';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onCreateTask: () => void;
}

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';
type SortType = 'priority' | 'dueDate' | 'created' | 'title';

export function TaskList({ 
  tasks, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onCreateTask 
}: TaskListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('priority');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];
    const now = new Date();

    // Apply filters
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(task => 
          !task.completed && 
          task.dueDate && 
          new Date(task.dueDate) < now
        );
        break;
      // 'all' shows everything
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'priority':
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // High to low
          }
          // Secondary sort by due date
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;

        case 'dueDate':
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;

        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        case 'title':
          return a.title.localeCompare(b.title);

        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, filter, sort, searchQuery]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      all: tasks.length,
      pending: tasks.filter(t => !t.completed).length,
      completed: tasks.filter(t => t.completed).length,
      overdue: tasks.filter(t => 
        !t.completed && 
        t.dueDate && 
        new Date(t.dueDate) < now
      ).length,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate">Tasks</h2>
          <p className="text-sm text-gray-600 mt-1">
            {counts.pending} pending • {counts.completed} completed
          </p>
        </div>
        
        <Button onClick={onCreateTask} size="medium">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Task
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="task-search" className="block text-sm font-medium text-slate mb-2">
            Search tasks
          </label>
          <input
            id="task-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, category, or tags..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-slate mb-2">
              Filter
            </label>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Task filters">
              {(Object.keys(counts) as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                    ${filter === filterType
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  role="tab"
                  aria-selected={filter === filterType}
                  aria-controls="task-list"
                >
                  {filterType} ({counts[filterType]})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="sort-select" className="block text-sm font-medium text-slate mb-2">
              Sort by
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none bg-white"
            >
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="created">Recently Created</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div id="task-list" role="region" aria-live="polite" aria-label="Task list">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filter !== 'all' ? 'No matching tasks' : 'No tasks yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first task.'
              }
            </p>
            {(!searchQuery && filter === 'all') && (
              <Button onClick={onCreateTask} variant="primary">
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {tasks.length > 0 && (
        <div className="bg-secondary-50 rounded-xl border border-secondary-200 p-6">
          <h3 className="text-lg font-medium text-slate mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{counts.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">{counts.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{counts.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate">
                {counts.completed > 0 ? Math.round((counts.completed / counts.all) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}