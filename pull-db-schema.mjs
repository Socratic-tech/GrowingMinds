import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aaiovfryjlcdijdyknik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaW92ZnJ5amxjZGlqZHlrbmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxODU5OTQsImV4cCI6MjA1Mjc2MTk5NH0.8d1b-e0edbe09c263e1dc89f9be4f06fb3c8f7c61fd10bd59f3e79a8c67dc';

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
