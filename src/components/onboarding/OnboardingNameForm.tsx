/**
 * OnboardingNameForm Component
 * Simple, gentle name capture screen
 */

import { useState, useEffect, useRef } from 'react';
import { setUserName, hasCompletedOnboarding } from '../../stores/userStore';
import { useStoreInit } from '../../hooks/useStoreInit';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function OnboardingNameForm() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize stores using centralized hook
  useStoreInit({ persistence: true });

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Check if user already completed onboarding
  useEffect(() => {
    const checkExistingUser = setTimeout(() => {
      if (hasCompletedOnboarding()) {
        window.location.href = '/app/tarefas';
      }
    }, 200);
    
    return () => clearTimeout(checkExistingUser);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    // Save name (accept empty, will use fallback)
    const userName = name.trim() || '';
    setUserName(userName);
    
    // Force save to localStorage immediately
    const { saveToLocalStorage } = await import('../../stores/persistence');
    saveToLocalStorage();
    
    // Small delay for better UX, then redirect
    setTimeout(() => {
      window.location.href = '/app/tarefas';
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" variant="sidebar" className="shadow-sm">
          <h1 className="text-3xl md:text-4xl font-semibold text-theme-text mb-8 text-center">
            Como devemos te chamar?
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              ref={inputRef}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva aqui"
              helperText="Você pode deixar em branco se preferir"
              maxLength={50}
              autoComplete="name"
              size="lg"
              fullWidth
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              size="large"
              className="w-full"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
