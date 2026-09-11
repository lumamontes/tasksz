/**
 * SidebarGreeting Component (React Island)
 * Personalized greeting with an initials avatar.
 * Shows the name only when signed in (derived from the auth account, not from
 * any local onboarding step). Anonymous guests get a neutral greeting.
 */

import { useStore } from '@nanostores/react';
import { $auth, getAuthDisplayName } from '../../stores/authStore';
import { getInitials } from '../../utils/text';

function getGreeting(date: Date): string {
  const hours = date.getHours();
  if (hours < 12) return 'Bom dia';
  if (hours < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function SidebarGreeting() {
  const auth = useStore($auth);
  const displayName = getAuthDisplayName();
  const now = new Date();
  const formattedDate = `Hoje · ${now.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  })}`;

  return (
    <div className="flex items-center gap-3 min-w-0 sidebar-label">
      <span
        aria-hidden="true"
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-theme-accent/10 text-theme-accent select-none"
      >
        {displayName ? (
          getInitials(displayName)
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" x2="9.01" y1="9" y2="9" />
            <line x1="15" x2="15.01" y1="9" y2="9" />
          </svg>
        )}
      </span>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-theme-text mb-0.5 truncate">
          {displayName ? `Olá, ${displayName} :)` : getGreeting(now)}
        </h1>
        <p className="text-sm text-theme-muted truncate">{formattedDate}</p>
      </div>
    </div>
  );
}
