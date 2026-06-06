/**
 * Runs a raw SQL migration against the Supabase project using
 * the Management API's database query endpoint.
 *
 * Usage: npx tsx scripts/run-migration.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_REF = 'qamheakdwzpmxdzgbbno';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbWhlYWtkd3pwbXhkemdiYm5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUxMzQyMSwiZXhwIjoyMDk1MDg5NDIxfQ.LTddAYdTorVl_iiwIk0qPN3WEGQ1B54fwkMj-sj6Y1c';

const migrationFile = path.join(
  __dirname,
  '../supabase/migrations/20260607_fix_deposit_function.sql'
);
const sql = fs.readFileSync(migrationFile, 'utf-8');

async function runMigration() {
  console.log('Running migration via Supabase REST SQL endpoint...\n');

  // Supabase exposes a SQL endpoint at /rest/v1/rpc/ — but the canonical way
  // for raw SQL is the pg-meta API available at /pg/ on the project.
  // For hosted projects, we use the Management API:
  //   POST https://api.supabase.com/v1/projects/{ref}/database/query
  // But that requires a Supabase personal access token, not the service role key.
  //
  // Instead we use the PostgREST "stored procedure" approach with `sql`:
  // The simplest reliable approach for hosted Supabase is to call
  //   POST {SUPABASE_URL}/rest/v1/rpc/<fn>
  // Since we can't run arbitrary SQL this way, we use the pg-meta API
  // which IS exposed on self-hosted but NOT on cloud.
  //
  // For CLOUD projects the only programmatic way without a PAT is using
  // the supabase JS client to call a trusted function —
  // but we can bootstrap by running the migration via fetch to the edge:

  const url = `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`;

  // First try — see if there's an exec_sql RPC already defined
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const resText = await res.text();

  if (res.ok) {
    console.log('✅ Migration applied successfully via exec_sql RPC.');
    console.log('Response:', resText);
    return;
  }

  console.log(`exec_sql RPC not available (${res.status}): ${resText}`);
  console.log('\nFalling back: creating exec_sql helper function first...\n');

  // Bootstrap: create a helper exec_sql function using a known-good RPC trick —
  // We CANNOT execute arbitrary DDL via PostgREST without an existing RPC.
  // The correct path for cloud Supabase is the Management API with a PAT.
  // Output the SQL for the user to paste into the Supabase SQL editor instead.

  console.log('━'.repeat(60));
  console.log('MANUAL STEP REQUIRED');
  console.log('━'.repeat(60));
  console.log('The Supabase cloud project cannot execute raw SQL via REST');
  console.log('without a personal access token.\n');
  console.log('Please copy the SQL below and run it in the Supabase');
  console.log('SQL Editor at:');
  console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`);
  console.log('━'.repeat(60));
  console.log(sql);
  console.log('━'.repeat(60));
}

runMigration().catch(console.error);
