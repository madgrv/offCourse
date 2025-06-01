// Script to run the two-week diet plan migration directly
// This bypasses the need for admin authentication

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
config();

// Get current directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key for direct database access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This should be in your .env file

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Starting two-week diet plan migration...');
  
  try {
    // Read the SQL migration file
    const migrationFilePath = join(
      __dirname, 
      '../app/api/diet/migrate-to-two-week/migration.sql'
    );
    
    const migrationSql = readFileSync(migrationFilePath, 'utf8');
    
    // Execute the SQL directly using the service role key
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      throw error;
    }
    
    console.log('Migration completed successfully!');
    console.log('Results:', data);
    
    // Now let's verify the migration worked
    const { data: columnCheck, error: columnError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'diet_food_items' 
            AND column_name = 'week'` 
    });
    
    if (columnError) {
      console.error('Error verifying migration:', columnError);
    } else {
      console.log('Column verification:', columnCheck);
    }
    
    // Check if we have week 2 items
    const { data: week2Count, error: countError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT COUNT(*) FROM diet_food_items WHERE week = 2` 
    });
    
    if (countError) {
      console.error('Error counting week 2 items:', countError);
    } else {
      console.log('Week 2 items count:', week2Count);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration();
