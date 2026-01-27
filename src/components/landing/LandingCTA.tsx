/**
 * LandingCTA Component
 * Client-side CTA buttons that check for existing user
 */

import { useEffect, useState } from 'react';
import { hasCompletedOnboarding } from '../../stores/userStore';
import { setupPersistence } from '../../stores/persistence';

interface LandingCTAProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function LandingCTA({ variant = 'primary', children }: LandingCTAProps) {
  const [href, setHref] = useState('/onboarding/nome');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setupPersistence();
    
    // Check if user already completed onboarding
    const checkUser = setTimeout(() => {
      if (hasCompletedOnboarding()) {
        setHref('/app/tarefas');
      }
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(checkUser);
  }, []);

  const baseClasses = variant === 'primary'
    ? 'inline-flex items-center justify-center px-8 py-4 bg-theme-accent text-white rounded-xl font-medium text-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2'
    : 'inline-flex items-center justify-center px-8 py-4 bg-theme-sidebar border-2 border-theme-accent text-theme-text rounded-xl font-medium text-lg hover:bg-theme-panel/20 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2';

  if (!isReady) {
    return (
      <div className={baseClasses} aria-hidden="true">
        {children}
      </div>
    );
  }

  return (
    <a href={href} className={baseClasses}>
      {children}
    </a>
  );
}
