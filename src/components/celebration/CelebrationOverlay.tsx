/**
 * CelebrationOverlay Component
 * Subtle completion feedback shown briefly when a task finishes.
 * Honors the "reduce motion" setting and stays intentionally minimal.
 */

import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { $settings } from '../../stores/settingsStore';
import confetti from 'canvas-confetti';

interface CelebrationOverlayProps {
  show: boolean;
  level: 'small' | 'medium' | 'large';
  message: string;
  onComplete: () => void;
}

export function CelebrationOverlay({ show, level, message, onComplete }: CelebrationOverlayProps) {
  const settings = useStore($settings);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    setIsVisible(true);

    // Small, optional confetti burst (skipped when motion is reduced)
    if (!settings.reduceMotion) {
      triggerConfetti(level);
    }

    // Auto-hide shortly after
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out
    }, 1500);

    return () => clearTimeout(timer);
  }, [show, level, settings.reduceMotion, onComplete]);

  const triggerConfetti = (level: 'small' | 'medium' | 'large') => {
    const baseConfig = {
      angle: 90,
      spread: 45,
      startVelocity: 30,
      decay: 0.9,
      gravity: 0.7,
      colors: ['#6c5ce7', '#74b9ff', '#00d084', '#fdcb6e'],
    };

    const particleCount = 30;

    switch (level) {
      case 'small':
        confetti({
          ...baseConfig,
          particleCount: Math.floor(particleCount * 0.5),
          origin: { x: 0.5, y: 0.6 },
        });
        break;
      case 'medium':
        confetti({ ...baseConfig, particleCount, origin: { x: 0.5, y: 0.6 }, spread: 60 });
        break;
      case 'large':
        confetti({ ...baseConfig, particleCount, origin: { x: 0.25, y: 0.6 } });
        confetti({ ...baseConfig, particleCount, origin: { x: 0.75, y: 0.6 } });
        confetti({
          ...baseConfig,
          particleCount: Math.floor(particleCount * 0.7),
          origin: { x: 0.5, y: 0.4 },
        });
        break;
    }
  };

  if (!show || !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${
        settings.reduceMotion ? '' : 'transition-opacity duration-300'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`bg-theme-accent text-white px-8 py-6 rounded-2xl shadow-xl max-w-sm mx-4 text-center scale-90 ${
          settings.reduceMotion ? '' : 'animate-pulse'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}