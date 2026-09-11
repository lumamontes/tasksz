import { useStore } from '@nanostores/react';
import { $syncState, dismissReloadRecommendation } from '../../stores/syncStore';

export function SyncReloadNotice() {
  const sync = useStore($syncState);
  if (!sync.reloadRecommended) return null;

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 z-[60] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-theme-border bg-theme-sidebar px-4 py-3 text-sm text-theme-text shadow-lg"
    >
      <span className="flex-1">Uma atualização está disponível para manter a sincronização funcionando.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-lg bg-theme-accent px-3 py-1.5 text-white hover:opacity-90"
      >
        Recarregar
      </button>
      <button
        type="button"
        onClick={dismissReloadRecommendation}
        aria-label="Fechar aviso de atualização"
        className="shrink-0 text-theme-muted hover:text-theme-text"
      >
        Agora não
      </button>
    </div>
  );
}
