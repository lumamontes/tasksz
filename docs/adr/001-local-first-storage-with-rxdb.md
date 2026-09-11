# ADR-001: Local-first storage with RxDB

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

Tarefitas must remain usable without an account, a network connection, or a
configured Supabase project. The previous localStorage persistence was too
small for growth and made reactive updates and future synchronization harder to
control.

## Decision

Use RxDB backed by IndexedDB through the Dexie storage adapter as the local
source of truth. Keep Nanostores as the reactive application facade. The bridge
in `src/lib/rxdb/bridge.ts` is the only layer that maps RxDB documents to
domain objects and Nanostore atoms.

The UI reads and writes through stores and actions. It does not read IndexedDB,
RxDB, or Supabase directly.

## Consequences

- The app works locally before authentication and without network access.
- IndexedDB provides substantially more capacity than localStorage.
- RxDB observables update the UI from the same data that synchronization uses.
- Persistence and domain mapping have one explicit boundary.
- Browser storage remains device-local until the user opts into an account.
