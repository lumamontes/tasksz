/**
 * AppGuard Component
 * Redirects to onboarding if user hasn't set their name
 */

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $user, hasCompletedOnboarding } from '../../stores/userStore';
import { setupPersistence } from '../../stores/persistence';

interface AppGuardProps {
  children: React.ReactNode;
}

export function AppGuard({ children }: AppGuardProps) {
  const user = useStore($user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Initialize persistence first
    setupPersistence();
    
    // Small delay to ensure persistence is loaded
    const checkUser = setTimeout(() => {
      const completed = hasCompletedOnboarding();
      
      if (!completed) {
        // Redirect to onboarding
        window.location.href = '/onboarding/nome';
      } else {
        setIsChecking(false);
      }
    }, 200);
    
    return () => clearTimeout(checkUser);
  }, [user]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-theme-panel rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-theme-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
