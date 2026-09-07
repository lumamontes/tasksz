/**
 * AuthModal Component
 * Modal dialog hosting the sign-in/sign-up form. Opened from the sidebar
 * CTA, the landing page, and (as a fallback) the settings account section.
 */

import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $auth, closeAuthModal } from '../../stores/authStore';
import { AuthForm } from './AuthForm';
import { useStoreInit } from '../../hooks/useStoreInit';

export function AuthModal() {
  const auth = useStore($auth);

  useStoreInit({ auth: true });

  // Close on Escape.
  useEffect(() => {
    if (!auth.isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [auth.isModalOpen]);

  // Auto-close once signed in (covers email+password immediate sessions).
  useEffect(() => {
    if (auth.userId) closeAuthModal();
  }, [auth.userId]);

  if (!auth.isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
      aria-label="Entrar no Tarefitas"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl p-6"
      >
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-theme-text">
            {auth.userId ? 'Tudo sincronizado' : 'Entrar no Tarefitas'}
          </h2>
          <p className="text-sm text-theme-muted mt-1">
            Sincronize suas tarefas entre dispositivos.
          </p>
        </div>

        <AuthForm />
      </div>
    </div>
  );
}