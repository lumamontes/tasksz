# ADR-005: Authentication is independent from synchronization

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

Authentication and local persistence have different failure modes. A Supabase
schema error, unavailable network, or replication startup failure must not make
a valid local session appear logged out or prevent the user from using local
tasks.

## Decision

Publish the authenticated user state as soon as the auth provider returns a
session. Start account re-keying and Supabase replication afterward as best
effort operations. Keep authentication behind the provider interface, with
Supabase as the current default and email/password plus Google OAuth flows.

On sign-out, stop all active replication and clear account-scoped reactive
state. Sync status and errors are reported separately from auth state, with a
reload recommendation for errors that indicate stale schema or client assets.

## Consequences

- Local task use continues when cloud sync is unavailable.
- Auth UI accurately reflects a valid session even during sync failures.
- Account transitions need explicit state clearing and guest-row re-keying.
- Sync failures remain visible and actionable without being conflated with
  credential failures.
