# ADR-003: Supabase schema and security contract

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

The RxDB Supabase replication protocol requires stable primary keys, modified
timestamps, and soft-delete markers. The browser uses camelCase domain fields,
while the existing SQL convention uses snake_case. Data must also be isolated
between accounts and remain safe when accessed directly through the public
Supabase client.

## Decision

Use one Supabase table per replicated collection: `tasks`, `subtasks`,
`settings`, and `profile`. Every replicated table has a text `id` primary key,
`_modified` timestamp, and `_deleted` tombstone field. Deletes are represented
as replication-compatible tombstones rather than hard-deleting rows.

Keep database columns in snake_case and perform the camelCase mapping in
`src/lib/rxdb/database.ts`. Scope replicated rows with `account_id` and enforce
access through Row Level Security policies using the authenticated Supabase
user ID.

Enable Realtime for replicated tables. Keep project and membership access
explicitly protected by owner/member policies, with `created_by` stamped and
preserved by database triggers.

The schema script is additive and safe to re-run: it uses `if not exists`,
conditional column additions, data backfills, and policy replacement. It must
not drop existing tables or user data.

## Consequences

- Browser clients can use the public `anon` key without bypassing RLS.
- Local and remote naming conventions remain independent and explicit.
- Tombstones and timestamps support incremental live replication.
- Schema changes require coordinated RxDB schema, mapping, and SQL changes.
- `service_role` credentials must never be shipped to the browser.
