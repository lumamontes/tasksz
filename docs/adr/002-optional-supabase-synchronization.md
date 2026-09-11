# ADR-002: Optional bidirectional synchronization with Supabase

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

Users need access to the same tasks on multiple devices, but cloud storage
must not be required for the core local experience. Implementing custom sync
logic would duplicate checkpointing, conflict handling, deletion handling, and
Realtime subscriptions.

## Decision

Use RxDB's official `replicateSupabase` plugin for two-way synchronization of
the `tasks`, `subtasks`, `settings`, and `profile` collections.

Replication is started only for the currently authenticated account and is
cancelled on sign-out or account changes. It runs live with incremental pulls,
push batches, checkpoints, soft-delete handling, and Supabase Realtime updates.
The UI observes local RxDB data and does not wait for a network round trip.

The client maps local camelCase fields to the server's snake_case fields in the
replication modifiers. Supabase is an infrastructure detail behind the local
store, not the UI's data source.

## Consequences

- Multi-device access is available without making cloud sync mandatory.
- Offline writes can be made locally and synchronized when an account and
  connection are available.
- The replication plugin owns protocol details instead of application code.
- Sync errors must be surfaced as state without making the local app unusable.
- The remote schema must follow RxDB replication requirements.
