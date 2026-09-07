/**
 * SidebarLoginCta Component (React Island)
 * Fills the blank space above the sidebar footer.
 *   - Anonymous guest: a gentle CTA inviting sign-in (opens AuthModal).
 *   - Signed-in: shows the account email + "Sair".
 * Renders expanded and collapsed variants; the collapse CSS picks the winner.
 */

import { useStore } from '@nanostores/react';
import { $auth, signOut, openAuthModal } from '../../stores/authStore';
import { useStoreInit } from '../../hooks/useStoreInit';
import { LogIn, LogOut } from 'lucide-react';

export function SidebarLoginCta() {
  const auth = useStore($auth);
  useStoreInit({ auth: true });

  if (auth.userId) {
    // Signed in: show account + sign out.
    return (
      <>
        {/* Expanded: email + Sair */}
        <div className="sidebar-label w-full flex flex-col items-center gap-2">
          <span className="text-xs text-theme-muted truncate max-w-full" title={auth.email ?? undefined}>
            {auth.email ?? 'usuário'}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={auth.isSubmitting}
            className="text-xs text-theme-muted hover:text-theme-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent rounded"
          >
            Sair da conta
          </button>
        </div>

        {/* Collapsed: sign out icon */}
        <div className="sidebar-collapsed-only">
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={auth.isSubmitting}
            className="text-theme-muted hover:text-theme-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent rounded"
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </>
    );
  }

  // Anonymous guest: login CTA.
  return (
    <>
      {/* Expanded */}
      <div className="sidebar-label w-full flex flex-col items-center gap-2 bg-theme-bg border border-theme-border rounded-xl px-4 py-4 text-center">
        <p className="text-sm text-theme-text font-medium leading-snug">
          Sincronize entre dispositivos
        </p>
        <p className="text-xs text-theme-muted leading-snug">
          É rápido, sem custo e opcional.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="mt-1 inline-flex items-center gap-1.5 text-sm text-theme-accent hover:text-theme-accent/80 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent rounded"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          Entrar
        </button>
      </div>

      {/* Collapsed */}
      <div className="sidebar-collapsed-only">
        <button
          type="button"
          onClick={openAuthModal}
          className="text-theme-muted hover:text-theme-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent rounded"
          aria-label="Entrar"
          title="Entrar"
        >
          <LogIn className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}