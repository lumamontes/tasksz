# ADR-004: Versioned and backward-compatible data migration

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

Tarefitas already had users with task data in localStorage and may have users
with older RxDB schemas. Losing local tasks during the move to local-first
storage is unacceptable. Existing exports also contain dates serialized as
strings even though the domain model uses `Date` values.

## Decision

Register `RxDBMigrationPlugin` before creating collections and use explicit RxDB
schema versions and migration strategies. The current task migration preserves
existing documents while filling the newer `createdBy` field from
`accountId` when necessary.

At startup, migrate the legacy `tarefitas_v1_data` localStorage payload into
RxDB through the same domain-to-document mapping used by normal writes. Accept
both `Date` and ISO/string date values during migration. Remove the legacy key
only after every import operation succeeds; retain it when migration fails so
the user can retry.

When a user signs in, guest rows are re-keyed to that account before sync
starts. Rows that already belong to another account are never relabeled.

## Consequences

- Existing browser data survives the storage architecture change.
- Schema evolution is explicit instead of relying on destructive recreation.
- Migration and normal writes share field and date normalization rules.
- Failed migrations can be retried without requiring manual data recovery.
- Future breaking changes require a new version and tested migration strategy.
