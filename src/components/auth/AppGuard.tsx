/**
 * AppGuard Component
 * Redirects to onboarding if user hasn't set their name
 * Uses useStoreInit hook to avoid duplicate initialization
 */

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $user, hasCompletedOnboarding } from '../../stores/userStore';
import { useStoreInit } from '../../hooks/useStoreInit';
import { LoadingScreen } from '../ui/LoadingScreen';

interface AppGuardProps {
  children: React.ReactNode;
}

export function AppGuard({ children }: AppGuardProps) {
  const user = useStore($user);
  const [isChecking, setIsChecking] = useState(true);

  // Initialize stores using centralized hook
  useStoreInit({ persistence: true, settings: true });

  useEffect(() => {
    // Check onboarding status after persistence is loaded
    const checkOnboarding = () => {
      const completed = hasCompletedOnboarding();
      
      if (!completed) {
        // Redirect to onboarding
        window.location.href = '/onboarding/nome';
      } else {
        setIsChecking(false);
      }
    };

    // Small delay to ensure persistence is loaded
    const timeoutId = setTimeout(checkOnboarding, 200);
    
    return () => clearTimeout(timeoutId);
  }, []); // Empty deps - only check once on mount

  if (isChecking) {
    return <LoadingScreen message="Carregando..." />;
  }

  return <>{children}</>;
}
