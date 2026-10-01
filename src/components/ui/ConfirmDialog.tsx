/**
 * ConfirmDialog Component
 * In-app confirmation for destructive or bulk actions. The dialog runs the
 * action itself so a failure stays visible next to the button that caused it.
 */

import { useCallback, useId, useState, type ReactNode } from 'react';
import { Dialog } from './Dialog';

export interface ConfirmRequest {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  /** Danger actions focus "Cancelar" first so Enter never confirms by accident. */
  tone?: 'danger' | 'default';
  /** Message shown when `onConfirm` throws. */
  failureMessage?: string;
  onConfirm: () => Promise<unknown> | unknown;
}

interface ConfirmDialogProps extends ConfirmRequest {
  onCancel: () => void;
  /** Extra controls, e.g. what to do with related records. */
  children?: ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = 'danger',
  failureMessage = 'Não foi possível concluir a ação. Tente novamente.',
  onConfirm,
  onCancel,
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const descriptionId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError(failureMessage);
      setBusy(false);
    }
  };

  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <Dialog title={title} onClose={cancel} role="alertdialog" describedBy={description ? descriptionId : undefined}>
      {description && <div id={descriptionId} className="text-sm leading-6 text-theme-muted">{description}</div>}
      {children && <div className="mt-5">{children}</div>}
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-6 flex justify-end gap-3 text-sm">
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          autoFocus={tone === 'danger'}
          className="rounded-lg px-3 py-2 text-theme-muted hover:bg-theme-bg hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={busy || confirmDisabled}
          autoFocus={tone !== 'danger'}
          className={`rounded-lg px-4 py-2 font-medium text-white shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${tone === 'danger' ? 'bg-red-600 focus-visible:ring-red-500' : 'bg-theme-accent focus-visible:ring-theme-accent'}`}
        >
          {busy ? 'Aguarde…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

/**
 * Local confirmation state for components that confirm simple actions:
 * `requestConfirm({ ... })` opens the dialog and `confirmDialog` renders it.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = useCallback(() => setRequest(null), []);

  const confirmDialog = request ? (
    <ConfirmDialog
      {...request}
      onCancel={close}
      onConfirm={async () => {
        await request.onConfirm();
        close();
      }}
    />
  ) : null;

  return { requestConfirm: setRequest, confirmDialog };
}
