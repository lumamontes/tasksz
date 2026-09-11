/**
 * Input Component
 * Accessible form input with consistent styling
 * ND-safe: Clear labels, proper focus states
 */

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { useStore } from '@nanostores/react';
import { $settings } from '../../stores/settingsStore';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const settings = useStore($settings);
    const generatedId = useId();

    const inputId = id || `input-${generatedId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const sizeClasses = {
      sm: settings.fontScale === 'sm' ? 'px-3 py-1.5 text-sm' :
          settings.fontScale === 'lg' ? 'px-4 py-2 text-base' :
          settings.fontScale === 'xl' ? 'px-5 py-2.5 text-lg' :
          'px-3 py-2 text-sm',
      md: settings.fontScale === 'sm' ? 'px-4 py-2 text-sm' :
          settings.fontScale === 'lg' ? 'px-5 py-3 text-base' :
          settings.fontScale === 'xl' ? 'px-6 py-3.5 text-lg' :
          'px-4 py-2.5 text-base',
      lg: settings.fontScale === 'sm' ? 'px-5 py-3 text-base' :
          settings.fontScale === 'lg' ? 'px-6 py-4 text-lg' :
          settings.fontScale === 'xl' ? 'px-7 py-4.5 text-xl' :
          'px-5 py-3.5 text-lg',
    };

    const transitionClass = settings.reduceMotion ? '' : 'transition-colors duration-150';

    const inputClasses = [
      'w-full bg-theme-sidebar border rounded-lg',
      'text-theme-text placeholder-theme-muted',
      'focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent',
      sizeClasses[size],
      transitionClass,
      error && 'border-red-500 focus:ring-red-500',
      !error && 'border-theme-border',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block mb-2 font-medium text-theme-text ${
              settings.fontScale === 'sm' ? 'text-sm' :
              settings.fontScale === 'lg' ? 'text-base' :
              settings.fontScale === 'xl' ? 'text-lg' :
              'text-sm'
            }`}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className={`mt-1 text-red-600 ${
              settings.fontScale === 'sm' ? 'text-xs' :
              settings.fontScale === 'lg' ? 'text-sm' :
              settings.fontScale === 'xl' ? 'text-base' :
              'text-xs'
            }`}
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            className={`mt-1 text-theme-muted ${
              settings.fontScale === 'sm' ? 'text-xs' :
              settings.fontScale === 'lg' ? 'text-sm' :
              settings.fontScale === 'xl' ? 'text-base' :
              'text-xs'
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
