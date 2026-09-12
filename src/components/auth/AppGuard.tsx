/**
 * AppGuard Component
 * Initializes stores once and renders its children when ready.
 * (The old name-onboarding redirect was removed — the app is guest-first.)
 */

import { useStore } from '@nanostores/react';
import { useStoreInit } from '../../hooks/useStoreInit';
import { $persistenceReady } from '../../stores/persistence';
import { LoadingScreen } from '../ui/LoadingScreen';

interface AppGuardProps {
  children: React.ReactNode;
}

export function AppGuard({ children }: AppGuardProps) {
  const persistenceReady = useStore($persistenceReady);

  useStoreInit({ persistence: true, settings: true });

  if (!persistenceReady) {
    return <LoadingScreen message="Carregando..." />;
  }

  return <>{children}</>;
}
