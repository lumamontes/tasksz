/**
 * TaskForm Component
 * Simplified, progressive task creation form for v1
 * Starts simple with just a title, expands for more details
 */

import React, { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { Button } from '../ui/Button';

interface TaskFormProps {
  task?: Task; // undefined for creating new task
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({ task, onSave, onCancel, isLoading = false }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Initialize form with task data when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setShowDetails(true); // Always show details when editing
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      archived: task?.archived || false,
    };

    onSave(taskData);
  };


  return (
    <div className="bg-theme-sidebar rounded-xl border border-theme-border p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-theme-text">
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>
        {!task && (
          <p className="text-sm text-theme-muted mt-1">
            Start with a title. You can add more details later.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title - Always visible */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-theme-text mb-2">
            What do you need to do?
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            className={`
              w-full px-4 py-3 text-lg border rounded-lg transition-colors bg-theme-bg text-theme-text
              focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none
              ${error ? 'border-red-300 bg-red-50' : 'border-theme-border'}
            `}
            placeholder="e.g., Review project proposal"
            autoFocus
            maxLength={200}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Expandable Details Section */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-theme-border animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-theme-text mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-theme-border rounded-lg transition-colors resize-none bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
                placeholder="Add more details about this task..."
                maxLength={1000}
              />
            </div>

          </div>
        )}

        {/* Toggle Details Button */}
        {!task && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-sm text-theme-accent hover:opacity-80 font-medium py-2 flex items-center justify-center gap-2 transition-colors"
          >
            {showDetails ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Add more details (optional)
              </>
            )}
          </button>
        )}

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-theme-border">
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            size="medium"
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            size="medium"
            isLoading={isLoading}
            disabled={isLoading}
            className="flex-1 sm:flex-none sm:min-w-[120px]"
          >
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  );
}
