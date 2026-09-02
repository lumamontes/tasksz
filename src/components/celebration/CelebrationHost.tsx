/**
 * CelebrationHost Component (island)
 * Holds the celebration trigger based on completion events.
 * Hydrates lazily (client:idle) so confetti code stays out of the
 * initial task islands. Disabled by default (settings.celebrationsEnabled).
 */

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $settings } from '../../stores/settingsStore';
import {
  $completionStreak,
  $contextState,
  shouldShowCelebration,
  getCelebrationLevel,
  getCelebrationMessage,
} from '../../stores/ndStore';
import { CelebrationOverlay } from './CelebrationOverlay';

export function CelebrationHost() {
  const settings = useStore($settings);
  const context = useStore($contextState);
  const streak = useStore($completionStreak);
  const [show, setShow] = useState(false);
  const [level, setLevel] = useState<'small' | 'medium' | 'large'>('small');

  useEffect(() => {
    if (!settings.celebrationsEnabled || !shouldShowCelebration()) return;
    setLevel(getCelebrationLevel());
    setShow(true);
  }, [context.totalCompletions, settings.celebrationsEnabled]);

  return (
    <CelebrationOverlay
      show={show}
      level={level}
      message={streak > 0 ? getCelebrationMessage() : 'Tarefa concluída.'}
      onComplete={() => setShow(false)}
    />
  );
}