import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env ourselves - this
// is a plain Node script (not run through Vite), so import.meta.env isn't
// populated here the way it is in the app. No dependency added; this reads
// the same .env file the app already uses, instead of a second hardcoded
// copy of the credentials living in this script.
function loadEnv(envPath = path.resolve('.env')) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Pulling database schema from Supabase...\n');

// Query to get table information
const query = `
SELECT
  t.table_name,
  json_agg(
    json_build_object(
      'column_name', c.column_name,
      'data_type', c.data_type,
      'is_nullable', c.is_nullable,
      'column_default', c.column_default,
      'character_maximum_length', c.character_maximum_length
    ) ORDER BY c.ordinal_position
  ) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
`;

try {
  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('❌ RPC Error:', error);
    console.log('\n📌 Trying alternative method...\n');

    // Alternative: Query each known table
    const tables = ['profiles', 'posts', 'comments', 'likes'];

    for (const table of tables) {
      console.log(`\n📋 Checking table: ${table}`);
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (tableError) {
        console.log(`   ❌ Error: ${tableError.message}`);
      } else {
        console.log(`   ✅ Table exists`);
      }
    }

  } else {
    console.log('✅ Schema retrieved successfully!\n');
    console.log(JSON.stringify(data, null, 2));

    // Save to file
    fs.writeFileSync(
      'database-schema.json',
      JSON.stringify(data, null, 2)
    );
    console.log('\n💾 Saved to database-schema.json');
  }

} catch (err) {
  console.error('❌ Unexpected error:', err);
}

// Check RLS policies
console.log('\n🔒 Checking RLS policies...\n');
const policiesQuery = `
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
`;

try {
  const { data, error } = await supabase.rpc('exec_sql', { query: policiesQuery });

  if (error) {
    console.error('❌ Could not fetch RLS policies:', error.message);
  } else {
    console.log('✅ RLS Policies:\n');
    console.log(JSON.stringify(data, null, 2));

    fs.writeFileSync(
      'rls-policies.json',
      JSON.stringify(data, null, 2)
    );
    console.log('\n💾 Saved to rls-policies.json');
  }
} catch (err) {
  console.error('❌ Error fetching policies:', err);
}

console.log('\n✅ Done!\n');
