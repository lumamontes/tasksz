/**
 * AuthForm Component
 * The email/password + Google sign-in form, reusable in the modal and the
 * settings account section. Guest-first: works fully local when sync is not
 * configured.
 */

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  $auth,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from '../../stores/authStore';
import { useStoreInit } from '../../hooks/useStoreInit';

export function AuthForm() {
  const auth = useStore($auth);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useStoreInit({ auth: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.isSubmitting) return;
    const ok =
      mode === 'signin'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);
    if (ok) {
      setPassword('');
      setEmail('');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-theme-muted text-sm leading-relaxed">
        Crie uma conta (ou entre) para sincronizar suas tarefas entre
        dispositivos. Sem conta, tudo continua funcionando localmente.
      </p>

      {/* Google sign-in (same Supabase project the other apps use) */}
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={auth.isSubmitting}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-theme-border bg-white text-theme-text text-sm font-medium hover:border-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent disabled:opacity-50"
      >
        <GoogleIcon />
        Continuar com Google
      </button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="flex-1 h-px bg-theme-border" />
        <span className="text-xs text-theme-muted">ou</span>
        <span className="flex-1 h-px bg-theme-border" />
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-theme-border p-1 w-fit" role="tablist" aria-label="Modo de autenticação">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => setMode('signin')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
            mode === 'signin' ? 'bg-theme-accent/10 text-theme-text' : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => setMode('signup')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
            mode === 'signup' ? 'bg-theme-accent/10 text-theme-text' : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-theme-text mb-1.5">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-4 py-2.5 border border-theme-border rounded-lg bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
            placeholder="voce@exemplo.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-theme-text mb-1.5">
            Senha
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              className="w-full px-4 py-2.5 pr-16 border border-theme-border rounded-lg bg-theme-bg text-theme-text focus:ring-2 focus:ring-theme-accent focus:border-theme-accent outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-sm text-theme-muted hover:text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-r-lg"
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        {auth.error && (
          <p className="text-sm text-red-600" role="alert">
            {auth.error}
          </p>
        )}

        <button
          type="submit"
          disabled={auth.isSubmitting}
          className="w-full px-4 py-2.5 rounded-lg bg-theme-accent text-white text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent disabled:opacity-50"
        >
          {auth.isSubmitting
            ? 'Processando…'
            : mode === 'signin'
              ? 'Entrar'
              : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}

/** Official Google "G" mark (lucide has no brand icons). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}