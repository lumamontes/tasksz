/**
 * Defaults are the well-known keys every `supabase start` uses locally.
 * The URL must stay on localhost so this suite can never hit a hosted project.
 */
export const LOCAL_SUPABASE = {
  url: process.env.LOCAL_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  anonKey: process.env.LOCAL_SUPABASE_ANON_KEY
    ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  serviceRoleKey: process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY
    ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};

const host = new URL(LOCAL_SUPABASE.url).hostname;
if (host !== '127.0.0.1' && host !== 'localhost') {
  throw new Error(`The Supabase suite only runs against a local Supabase, got ${LOCAL_SUPABASE.url}`);
}
