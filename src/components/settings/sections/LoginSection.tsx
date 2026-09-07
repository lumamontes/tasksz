/**
 * LoginSection Component
 * Account & sync status inside Settings. The sign-in form itself lives in a
 * modal (`AuthModal`), reached from the sidebar CTA and landing page — this
 * section only reflects the current status and lets you sign out.
 */

import { useStore } from '@nanostores/react';
import { $auth, signOut, openAuthModal } from '../../../stores/authStore';
import { getAuthProvider } from '../../../lib/auth';
import { useStoreInit } from '../../../hooks/useStoreInit';

export function LoginSection() {
  const auth = useStore($auth);

  useStoreInit({ auth: true });

  const configured = getAuthProvider().isConfigured;

  // Guest-first: nothing to do when sync isn't configured.
  if (!configured) {
    return (
      <div>
        <p className="text-theme-muted text-sm leading-relaxed">
          O Tarefitas funciona 100% no seu dispositivo, sem precisar de conta.
          A sincronização entre dispositivos é opcional.
        </p>
      </div>
    );
  }

  if (auth.userId) {
    return (
      <div className="space-y-4">
        <p className="text-theme-muted text-sm leading-relaxed">
          Conectado como{' '}
          <span className="text-theme-text font-medium">{auth.email ?? 'usuário'}</span>.
          Seus dados serão sincronizados entre seus dispositivos.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={auth.isSubmitting}
            className="px-4 py-2 rounded-lg border border-theme-border bg-theme-bg text-theme-text text-sm font-medium hover:border-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent disabled:opacity-50"
          >
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-theme-muted text-sm leading-relaxed">
        Crie uma conta (ou entre) para sincronizar suas tarefas entre
        dispositivos. Sem conta, tudo continua funcionando localmente.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openAuthModal}
          disabled={auth.isSubmitting}
          className="px-4 py-2 rounded-lg bg-theme-accent text-white text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent disabled:opacity-50"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}