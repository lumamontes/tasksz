/**
 * Button Component
 * Accessible, neurodivergent-friendly button component
 */

import React, { useCallback, useRef } from 'react';
import type { BaseComponentProps } from '../../types';

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  name?: string;
  value?: string;
  style?: React.CSSProperties;
}

const defaultProps: Partial<ButtonProps> = {
  variant: 'primary',
  size: 'medium',
  type: 'button',
  isLoading: false,
  disabled: false,
};

export const Button = React.memo<ButtonProps>((props) => {
  const {
    variant = 'primary',
    size = 'medium',
    type = 'button',
    isLoading = false,
    disabled = false,
    children,
    leftIcon,
    rightIcon,
    onClick,
    onFocus,
    onBlur,
    className = '',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    form,
    name,
    value,
    style,
  } = props;

  const lastClickTime = useRef<number>(0);
  const DEBOUNCE_MS = 300;

  // Debounce click handler to prevent double-taps
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const now = Date.now();
      if (now - lastClickTime.current < DEBOUNCE_MS) {
        event.preventDefault();
        return;
      }
      lastClickTime.current = now;

      if (!disabled && !isLoading && onClick) {
        onClick(event);
      }
    },
    [disabled, isLoading, onClick]
  );

  // Determine accessible label
  const accessibleLabel = ariaLabel || (typeof children === 'string' ? children : undefined);

  // Build class names
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-ring motion-reduce';
  const variantClasses = {
    primary: 'bg-theme-accent text-white hover:opacity-90 disabled:bg-theme-border disabled:text-theme-muted',
    secondary: 'bg-theme-panel text-theme-text border border-theme-border hover:bg-theme-sidebar',
    ghost: 'bg-transparent text-theme-accent hover:bg-theme-bg',
  };
  const sizeClasses = {
    small: 'min-h-[40px] px-4 py-2 text-sm gap-1.5',
    medium: 'min-h-[44px] px-5 py-3 text-base gap-2',
    large: 'min-h-[56px] px-6 py-4 text-lg gap-2.5',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    'rounded-lg',
    'cursor-pointer',
    'disabled:cursor-not-allowed',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      form={form}
      name={name}
      value={value}
      className={classes}
      onClick={handleClick}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled || isLoading}
      aria-label={accessibleLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={isLoading}
      style={style}
    >
      {isLoading ? (
        <span className="inline-block animate-spin" aria-hidden="true">
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      ) : (
        <>
          {leftIcon && <span className="inline-flex items-center" aria-hidden="true">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="inline-flex items-center" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
