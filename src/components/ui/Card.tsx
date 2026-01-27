/**
 * Card Component
 * Reusable card container with consistent styling
 * ND-safe: Calm, clear boundaries
 */

import { type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { $settings } from '../../stores/settingsStore';

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'sidebar' | 'panel';
  onClick?: () => void;
  'aria-label'?: string;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  onClick,
  'aria-label': ariaLabel,
}: CardProps) {
  const settings = useStore($settings);

  const paddingClasses = {
    none: '',
    sm: settings.density === 'compact' ? 'p-3' : 'p-4',
    md: settings.density === 'compact' ? 'p-4' : 'p-6',
    lg: settings.density === 'compact' ? 'p-6' : 'p-8',
  };

  const variantClasses = {
    default: 'bg-theme-panel border-theme-border',
    sidebar: 'bg-theme-sidebar border-theme-border',
    panel: 'bg-theme-panel border-theme-border',
  };

  const baseClasses = 'rounded-xl border';
  const transitionClass = settings.reduceMotion ? '' : 'transition-colors duration-150';
  const interactiveClass = onClick ? 'cursor-pointer hover:border-theme-accent/50' : '';

  const classes = [
    baseClasses,
    paddingClasses[padding],
    variantClasses[variant],
    transitionClass,
    interactiveClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </Component>
  );
}
