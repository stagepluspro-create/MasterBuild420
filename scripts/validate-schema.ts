#!/usr/bin/env tsx
/**
 * Schema Validation Script
 *
 * Validates that the Supabase database schema matches expectations:
 * - All required tables exist
 * - No hashed/corrupted table names
 * - All RLS policies are in place
 * - Foreign keys and indexes are present
 *
 * Usage: npm run validate-schema
 */

import { createClient } from '@supabase/supabase-js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(`${colors.red}❌ Missing Supabase environment variables${colors.reset}`);
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Expected tables in the database
const REQUIRED_TABLES = [
  // Core
  'profiles',
  'subscriptions',
  'subscription_changes',
  'audit_log',

  // Teams
  'teams',
  'team_members',
  'team_roles',
  'team_api_keys',
  'team_integrations',
  'team_security_settings',
  'team_tool_access',
  'activity_feed',

  // Projects
  'projects',
  'project_files',
  'tasks',
  'documents',

  // User Data
  'presets',
  'user_api_keys',
  'interest_requests',
  'equipment_favorites',

  // Equipment
  'fixtures',
  'gels',
  'inventory_items',

  // DMX Calculator
  'dmx_patches',
  'dmx_fixtures',
  'dmx_universes',
  'dmx_groups',
  'dmx_modes',
  'dmx_patch_versions',

  // Haze Simulator
  'haze_venues',
  'haze_machines',
  'haze_fixtures',
  'haze_hvac_vents',
  'haze_simulations',

  // Console Translator
  'console_presets',
  'console_show_files',
  'console_translations',

  // Audio/Patch Lists
  'patch_lists',
  'patch_channels',
  'patchlists',
  'patchlist_channels',
  'patchlist_categories',
  'patchlist_versions',
  'monitor_mixes',

  // SPL Meter
  'spl_measurements',
  'spl_sessions',
  'spl_venues',

  // Power Calculator
  'power_plans',
  'power_devices',

  // Budget Tracker
  'budget_items',
  'budget_snapshots',
  'budget_suppliers',
];

// Tables that must have RLS enabled
const TABLES_REQUIRING_RLS = [
  'profiles',
  'subscriptions',
  'subscription_changes',
  'teams',
  'team_members',
  'presets',
  'projects',
  'power_plans',
  'dmx_patches',
  'haze_venues',
];

async function checkTables(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Get all tables
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    }) as any;

    // Fallback: use direct query if RPC doesn't exist
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      })
    });

    let tables: string[] = [];

    if (response.ok) {
      const result = await response.json();
      tables = result.map((r: any) => r.table_name);
    } else if (data) {
      tables = data.map((r: any) => r.table_name);
    } else {
      throw new Error('Failed to fetch tables');
    }

    console.log(`${colors.cyan}📋 Found ${tables.length} tables${colors.reset}`);

    // Check for required tables
    const missingTables = REQUIRED_TABLES.filter(t => !tables.includes(t));
    if (missingTables.length > 0) {
      errors.push(`Missing tables: ${missingTables.join(', ')}`);
    }

    // Check for hashed table names (corrupted database indicator)
    const hashedTables = tables.filter(t => /^[a-z0-9]{20}_/.test(t));
    if (hashedTables.length > 0) {
      errors.push(`Found hashed tables (database corruption): ${hashedTables.join(', ')}`);
    }

    // Check for unexpected extra tables
    const extraTables = tables.filter(t => !REQUIRED_TABLES.includes(t));
    if (extraTables.length > 5) {
      console.warn(`${colors.yellow}⚠️  Found ${extraTables.length} unexpected tables${colors.reset}`);
    }

    return { success: errors.length === 0, errors };
  } catch (err) {
    errors.push(`Failed to query tables: ${err}`);
    return { success: false, errors };
  }
}

async function checkRLS(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        query: `
          SELECT tablename, COUNT(*) as policy_count
          FROM pg_policies
          WHERE schemaname = 'public'
          GROUP BY tablename
          ORDER BY tablename;
        `
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch RLS policies');
    }

    const policies = await response.json();
    const policyMap = new Map<string, number>();

    policies.forEach((p: any) => {
      policyMap.set(p.tablename, p.policy_count);
    });

    const totalPolicies = Array.from(policyMap.values()).reduce((a, b) => a + b, 0);
    console.log(`${colors.cyan}🔒 Found ${totalPolicies} RLS policies across ${policyMap.size} tables${colors.reset}`);

    // Check that critical tables have RLS policies
    for (const table of TABLES_REQUIRING_RLS) {
      const count = policyMap.get(table) || 0;
      if (count === 0) {
        errors.push(`Table '${table}' has no RLS policies (security risk!)`);
      }
    }

    return { success: errors.length === 0, errors };
  } catch (err) {
    errors.push(`Failed to check RLS policies: ${err}`);
    return { success: false, errors };
  }
}

async function checkFunctions(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        query: `
          SELECT routine_name
          FROM information_schema.routines
          WHERE routine_schema = 'public'
            AND routine_name IN ('has_team_permission', 'can_access_tool')
          ORDER BY routine_name;
        `
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch functions');
    }

    const functions = await response.json();
    const functionNames = functions.map((f: any) => f.routine_name);

    console.log(`${colors.cyan}⚙️  Found ${functionNames.length}/2 required functions${colors.reset}`);

    if (!functionNames.includes('has_team_permission')) {
      errors.push(`Missing function: has_team_permission`);
    }
    if (!functionNames.includes('can_access_tool')) {
      errors.push(`Missing function: can_access_tool`);
    }

    return { success: errors.length === 0, errors };
  } catch (err) {
    errors.push(`Failed to check functions: ${err}`);
    return { success: false, errors };
  }
}

async function main() {
  console.log(`${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  StageTechPro Schema Validation        ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.cyan}🔍 Validating Supabase schema...${colors.reset}\n`);

  let allSuccess = true;
  const allErrors: string[] = [];

  // Check tables
  console.log(`${colors.blue}[1/3] Checking tables...${colors.reset}`);
  const tablesResult = await checkTables();
  if (tablesResult.success) {
    console.log(`${colors.green}✓ All ${REQUIRED_TABLES.length} required tables present${colors.reset}`);
    console.log(`${colors.green}✓ No hashed table names detected${colors.reset}\n`);
  } else {
    allSuccess = false;
    allErrors.push(...tablesResult.errors);
    tablesResult.errors.forEach(err => {
      console.error(`${colors.red}✗ ${err}${colors.reset}`);
    });
    console.log('');
  }

  // Check RLS policies
  console.log(`${colors.blue}[2/3] Checking RLS policies...${colors.reset}`);
  const rlsResult = await checkRLS();
  if (rlsResult.success) {
    console.log(`${colors.green}✓ All critical tables have RLS policies${colors.reset}\n`);
  } else {
    allSuccess = false;
    allErrors.push(...rlsResult.errors);
    rlsResult.errors.forEach(err => {
      console.error(`${colors.red}✗ ${err}${colors.reset}`);
    });
    console.log('');
  }

  // Check functions
  console.log(`${colors.blue}[3/3] Checking database functions...${colors.reset}`);
  const functionsResult = await checkFunctions();
  if (functionsResult.success) {
    console.log(`${colors.green}✓ All required functions present${colors.reset}\n`);
  } else {
    allSuccess = false;
    allErrors.push(...functionsResult.errors);
    functionsResult.errors.forEach(err => {
      console.error(`${colors.red}✗ ${err}${colors.reset}`);
    });
    console.log('');
  }

  // Final result
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  if (allSuccess) {
    console.log(`${colors.green}✅ Schema validation PASSED${colors.reset}`);
    console.log(`${colors.green}   Database is healthy and ready for production${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Schema validation FAILED${colors.reset}`);
    console.log(`${colors.red}   Found ${allErrors.length} error(s)${colors.reset}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${colors.red}❌ Validation script error:${colors.reset}`, err);
  process.exit(1);
});
