/**
 * OnboardingNameForm Component
 * Simple, gentle name capture screen
 */

import { useState, useEffect, useRef } from 'react';
import { setUserName, hasCompletedOnboarding } from '../../stores/userStore';
import { setupPersistence } from '../../stores/persistence';
import { googleAuth } from '../../stores/auth';

export function OnboardingNameForm() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Initialize persistence and check if user already completed onboarding
  useEffect(() => {
    setupPersistence();
    
    // Check if user already completed onboarding (redirect to app if they did)
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
        <div className="bg-theme-sidebar rounded-2xl border border-theme-border p-8 md:p-12 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-semibold text-theme-text mb-8 text-center">
            Como devemos te chamar?
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="sr-only">
                Seu nome
              </label>
              <input
                ref={inputRef}
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva aqui"
                className="w-full px-6 py-4 text-lg bg-theme-bg border-2 border-theme-border rounded-xl text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent transition-colors"
                maxLength={50}
                autoComplete="name"
                aria-label="Seu nome (opcional)"
              />
              <p className="mt-3 text-sm text-theme-muted text-center">
                Você pode deixar em branco se preferir
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-theme-accent text-white rounded-xl font-medium text-lg hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Optional Google Login */}
          <div className="mt-6 pt-6 border-t border-theme-border">
            <p className="text-sm text-theme-muted text-center mb-4">
              Ou entre com Google (opcional)
            </p>
            <button
              type="button"
              className="w-full px-6 py-3 bg-theme-sidebar border-2 border-theme-border text-theme-text rounded-xl font-medium hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 flex items-center justify-center gap-3"
              onClick={async () => {
                googleAuth.initialize();
                const profile = await googleAuth.signIn();
                if (profile) {
                  // Force save to localStorage immediately
                  const { saveToLocalStorage } = await import('../../stores/persistence');
                  saveToLocalStorage();
                  
                  // Small delay, then redirect
                  setTimeout(() => {
                    window.location.href = '/app/tarefas';
                  }, 300);
                }
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>
            <p className="text-xs text-theme-muted text-center mt-3">
              Usamos apenas para salvar seus dados, se quiser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
