-- Realtime DELETE events need the old row so read-only projections can apply
-- tombstones without guessing which version was removed.
-- This is additive and does not change task data or permissions.
alter table public.tasks replica identity full;
