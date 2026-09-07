/**
 * LandingLogin Component
 * "Entrar" button on the landing page that opens the shared AuthModal.
 */

import { openAuthModal } from '../../stores/authStore';
import { LogIn } from 'lucide-react';

export function LandingLogin() {
  return (
    <button
      type="button"
      onClick={openAuthModal}
      className="inline-flex items-center gap-2 underline text-theme-accent hover:text-theme-accent/80 transition duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent rounded cursor-pointer"
    >
      <LogIn className="w-4 h-4" aria-hidden="true" />
      Entrar
    </button>
  );
}