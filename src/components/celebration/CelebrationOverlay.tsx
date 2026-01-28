/**
 * CelebrationOverlay Component
 * Provides dopamine-driven feedback for task completion
 * Respects ND settings for animation intensity and sensory considerations
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

    const celebrationStyle = settings.ndSettings?.celebrationStyle || 'minimal';
    if (celebrationStyle === 'none') {
      onComplete();
      return;
    }

    setIsVisible(true);

    // Trigger confetti based on level and user preferences
    if (celebrationStyle === 'full') {
      triggerConfetti(level);
    }

    // Auto-hide after duration
    const duration = celebrationStyle === 'minimal' ? 1500 : 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [show, level, settings.ndSettings?.celebrationStyle, onComplete]);

  const triggerConfetti = (level: 'small' | 'medium' | 'large') => {
    const intensity = settings.ndSettings?.animationIntensity || 'minimal';
    if (intensity === 'none') return;

    const baseConfig = {
      angle: 90,
      spread: 45,
      startVelocity: 30,
      decay: 0.9,
      gravity: 0.7,
      colors: ['#6c5ce7', '#74b9ff', '#00d084', '#fdcb6e']
    };

    let particleCount = 50;
    let origin = { x: 0.5, y: 0.6 };

    if (intensity === 'minimal') {
      particleCount = Math.floor(particleCount * 0.3);
    }

    switch (level) {
      case 'small':
        confetti({
          ...baseConfig,
          particleCount: Math.floor(particleCount * 0.5),
          origin
        });
        break;
      case 'medium':
        confetti({
          ...baseConfig,
          particleCount,
          origin,
          spread: 60
        });
        break;
      case 'large':
        // Burst from multiple points
        confetti({
          ...baseConfig,
          particleCount,
          origin: { x: 0.25, y: 0.6 }
        });
        confetti({
          ...baseConfig,
          particleCount,
          origin: { x: 0.75, y: 0.6 }
        });
        confetti({
          ...baseConfig,
          particleCount: Math.floor(particleCount * 0.7),
          origin: { x: 0.5, y: 0.4 }
        });
        break;
    }
  };

  if (!show || !isVisible) return null;

  const celebrationStyle = settings.ndSettings.celebrationStyle;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${
        settings.reduceMotion ? '' : 'transition-opacity duration-300'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="alert"
      aria-live="polite"
    >
      <div className={`bg-theme-accent text-white px-8 py-6 rounded-2xl shadow-xl max-w-sm mx-4 text-center ${
        settings.reduceMotion ? '' : 'animate-pulse'
      } ${celebrationStyle === 'minimal' ? 'scale-90' : 'scale-100'}`}>
        <div className="text-4xl mb-3">
          {level === 'large' && '🎉'}
          {level === 'medium' && '✨'}
          {level === 'small' && '💚'}
        </div>
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}