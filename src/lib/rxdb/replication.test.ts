import { describe, expect, it, vi } from 'vitest';

vi.mock('../supabase', () => ({
  getSupabase: () => null,
}));

vi.mock('./database', () => ({
  getRxDb: vi.fn(),
  startReplication: vi.fn(),
}));

vi.mock('../../stores/syncStore', () => ({
  dismissReloadRecommendation: vi.fn(),
  recommendReload: vi.fn(),
  setSyncError: vi.fn(),
}));

import { startSyncForAccount } from './replication';

describe('replication lifecycle', () => {
  it('does not deadlock when starting without Supabase', async () => {
    await expect(startSyncForAccount('account-1')).resolves.toBeUndefined();
  });
});
