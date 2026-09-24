/**
 * Classifies replication errors. RxDB wraps handler failures in an
 * `RC_PUSH` / `RC_PULL` error whose `parameters.errors` holds the Supabase
 * errors, so every check looks at the wrapper and at each wrapped error.
 */

interface ErrorLike {
  code?: unknown;
  status?: unknown;
  message?: unknown;
  parameters?: { errors?: unknown[] };
}

function causes(error: unknown): ErrorLike[] {
  const value = (error ?? {}) as ErrorLike;
  const wrapped = Array.isArray(value.parameters?.errors) ? (value.parameters.errors as ErrorLike[]) : [];
  return [value, ...wrapped];
}

const codeOf = (error: ErrorLike) => String(error.code ?? '');
const messageOf = (error: ErrorLike) => String(error.message ?? '');

/** JWT problems (expired, issued in the future) resolve once the session refreshes. */
const isAuthTokenError = (error: ErrorLike) => /^PGRST3\d\d$/.test(codeOf(error));

/** A malformed query or RLS denial: retrying the same request cannot succeed. */
export function isPermanentSyncError(error: unknown): boolean {
  return causes(error).some((cause) => {
    const code = codeOf(cause);
    if (isAuthTokenError(cause)) return false;
    return (
      /^PGRST\d+$/.test(code) ||
      code === '42501' ||
      code === '42703' ||
      /failed to parse order|column .* does not exist|row-level security policy/i.test(messageOf(cause))
    );
  });
}

/**
 * Handled by the replication itself: duplicate inserts resolve as conflicts,
 * and a row pushed before the row it references (foreign key, e.g. a task
 * before its Project) succeeds on the next retry.
 */
export function isExpectedSyncError(error: unknown): boolean {
  const all = causes(error);
  const wrapped = all.slice(1);
  const relevant = wrapped.length ? wrapped : all;
  return relevant.every((cause) => {
    const code = codeOf(cause);
    return (
      code === '23505' ||
      code === '23503' ||
      isAuthTokenError(cause) ||
      /duplicate key value|unique constraint|violates foreign key constraint/i.test(messageOf(cause))
    );
  });
}

/** The client is older than the remote schema. */
export function shouldRecommendReload(error: unknown): boolean {
  return causes(error).some((cause) => {
    const code = codeOf(cause);
    return code === '42703' || code === 'PGRST100' || code === 'PGRST204'
      || /column .* does not exist|failed to parse (filter|order)/i.test(messageOf(cause));
  });
}

/** The most useful message to show: the first wrapped cause, else the wrapper. */
export function syncErrorMessage(error: unknown): string {
  const [wrapper, first] = causes(error);
  return messageOf(first ?? wrapper) || 'Falha na sincronização.';
}
