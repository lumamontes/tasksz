/**
 * AppGuard Component
 * Initializes stores once and renders its children when ready.
 * (The old name-onboarding redirect was removed — the app is guest-first.)
 */

import { useEffect, useState } from 'react';
import { useStoreInit } from '../../hooks/useStoreInit';
import { LoadingScreen } from '../ui/LoadingScreen';

interface AppGuardProps {
  children: React.ReactNode;
}

export function AppGuard({ children }: AppGuardProps) {
  const [isChecking, setIsChecking] = useState(true);

  useStoreInit({ persistence: true, settings: true });

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsChecking(false), 200);
    return () => clearTimeout(timeoutId);
  }, []);

  if (isChecking) {
    return <LoadingScreen message="Carregando..." />;
  }

  return <>{children}</>;
}