/**
 * IconButton Component
 * Accessible icon-only button
 * ND-safe: Clear focus states, proper labels
 */

import { type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { $settings } from '../../stores/settingsStore';

export interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  'aria-label': string;
  'aria-describedby'?: string;
  variant?: 'default' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  onClick,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
}: IconButtonProps) {
  const settings = useStore($settings);

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const variantClasses = {
    default: 'text-theme-muted hover:text-theme-text hover:bg-theme-sidebar',
    ghost: 'text-theme-muted hover:text-theme-text hover:bg-theme-bg',
    accent: 'text-theme-accent hover:bg-theme-accent/10',
  };

  const transitionClass = settings.reduceMotion ? '' : 'transition-colors duration-150';

  const classes = [
    'inline-flex items-center justify-center rounded-lg',
    'focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2',
    sizeClasses[size],
    variantClasses[variant],
    transitionClass,
    disabled && 'opacity-50 cursor-not-allowed',
    !disabled && 'cursor-pointer',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {icon}
    </button>
  );
}
