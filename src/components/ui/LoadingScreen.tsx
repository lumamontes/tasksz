/**
 * LoadingScreen Component
 * Full-screen loading state
 * ND-safe: Calm, clear feedback
 */

import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-theme-panel rounded-full flex items-center justify-center">
          <LoadingSpinner size="md" className="text-theme-accent" />
        </div>
        <p className="text-theme-muted">{message}</p>
      </div>
    </div>
  );
}
