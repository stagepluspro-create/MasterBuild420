/*
  # Fix Security Issues - Stage Tech Pro

  ## Overview
  Fixes critical security vulnerabilities and performance issues

  ## Issues Addressed
  1. Duplicate RLS Policies - Remove conflicts
  2. Function Search Path Vulnerabilities - Add secure search paths
  3. Unused Indexes - Drop to improve write performance
*/

-- =====================================================
-- STEP 1: REMOVE DUPLICATE RLS POLICIES
-- =====================================================

-- audit_log - Keep newer policy
DROP POLICY IF EXISTS "Users can create audit logs" ON audit_log;

-- interest_requests - Keep newer policy
DROP POLICY IF EXISTS "Users can create interest requests" ON interest_requests;

-- presets - Consolidate
DROP POLICY IF EXISTS "Users can create presets" ON presets;

-- projects - Keep most specific
DROP POLICY IF EXISTS "Users can create personal projects" ON projects;

-- tasks - Consolidate overlapping
DROP POLICY IF EXISTS "Team members can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own standalone tasks" ON tasks;

-- budget_items - Keep most specific
DROP POLICY IF EXISTS "Team members can manage project budget" ON budget_items;

-- documents - Keep most specific
DROP POLICY IF EXISTS "Team members can manage project documents" ON documents;

-- inventory_items - Keep most specific
DROP POLICY IF EXISTS "Team admins can manage inventory" ON inventory_items;

-- =====================================================
-- STEP 2: FIX FUNCTION SEARCH PATH VULNERABILITIES
-- =====================================================

-- Fix set_subscription_seats
CREATE OR REPLACE FUNCTION set_subscription_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.seats IS NULL THEN
    IF NEW.tier = 'team' THEN
      NEW.seats := 30;
    ELSE
      NEW.seats := 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_power_plan_updated_at (with CASCADE handling)
DROP TRIGGER IF EXISTS power_plans_updated_at ON power_plans;
DROP FUNCTION IF EXISTS update_power_plan_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_power_plan_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE power_plans
  SET updated_at = NOW()
  WHERE id = NEW.plan_id;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER power_plans_updated_at
  AFTER INSERT OR UPDATE OR DELETE ON power_plan_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_power_plan_updated_at();

-- Fix get_universe_usage if exists
DROP FUNCTION IF EXISTS get_universe_usage(uuid) CASCADE;
CREATE OR REPLACE FUNCTION get_universe_usage(universe_id_param uuid)
RETURNS TABLE (
  universe_number integer,
  used_channels integer,
  available_channels integer,
  utilization_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    du.universe_number,
    COALESCE(SUM(dm.channel_count), 0)::integer as used_channels,
    512 - COALESCE(SUM(dm.channel_count), 0)::integer as available_channels,
    ROUND((COALESCE(SUM(dm.channel_count), 0) / 512.0) * 100, 2) as utilization_percent
  FROM dmx_universes du
  LEFT JOIN dmx_fixtures df ON df.universe_id = du.id
  LEFT JOIN dmx_modes dm ON dm.id = df.dmx_mode_id
  WHERE du.id = universe_id_param
  GROUP BY du.universe_number;
END;
$$;

-- Fix check_dmx_address_overlap if exists
DROP FUNCTION IF EXISTS check_dmx_address_overlap(integer, integer, uuid) CASCADE;
CREATE OR REPLACE FUNCTION check_dmx_address_overlap(
  start_addr integer,
  channel_cnt integer,
  universe_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  overlap_count integer;
BEGIN
  SELECT COUNT(*) INTO overlap_count
  FROM dmx_fixtures df
  JOIN dmx_modes dm ON dm.id = df.dmx_mode_id
  WHERE df.universe_id = universe_id_param
    AND df.start_address < (start_addr + channel_cnt)
    AND (df.start_address + dm.channel_count) > start_addr;
  
  RETURN overlap_count > 0;
END;
$$;

-- =====================================================
-- STEP 3: DROP UNUSED INDEXES (Performance Optimization)
-- =====================================================

-- Drop all unused indexes in batches
DROP INDEX IF EXISTS idx_gels_manufacturer, idx_gels_code, idx_gels_name_search;
DROP INDEX IF EXISTS idx_profile_files_fixture_id;
DROP INDEX IF EXISTS idx_presets_shared_with_team, idx_presets_shared_by, idx_presets_parent_id;
DROP INDEX IF EXISTS idx_presets_user_id, idx_presets_project_id, idx_presets_tool_id;
DROP INDEX IF EXISTS idx_presets_user_tool, idx_presets_shared, idx_presets_user_tool_project;
DROP INDEX IF EXISTS idx_presets_templates, idx_presets_payload_gin;
DROP INDEX IF EXISTS idx_team_members_invitation_token, idx_team_members_team_id;
DROP INDEX IF EXISTS idx_team_members_user_team, idx_team_members_team_joined;
DROP INDEX IF EXISTS idx_team_members_invitation_email, idx_team_members_user_joined;
DROP INDEX IF EXISTS idx_team_members_invited_by, idx_team_members_team_role, idx_team_members_pending;
DROP INDEX IF EXISTS idx_subscription_changes_created_at, idx_subscriptions_status;
DROP INDEX IF EXISTS idx_monitor_mixes_patchlist_id;
DROP INDEX IF EXISTS idx_patchlists_project_id, idx_patchlist_channels_category;
DROP INDEX IF EXISTS idx_patchlist_versions_patchlist_id, idx_patchlist_versions_created_by;
DROP INDEX IF EXISTS idx_patchlist_categories_patchlist_id, idx_patchlist_channels_list_category;
DROP INDEX IF EXISTS idx_patchlists_user_project;
DROP INDEX IF EXISTS idx_routing_flows_patchlist_id, idx_profiles_email;
DROP INDEX IF EXISTS idx_teams_owner_user_id;
DROP INDEX IF EXISTS idx_projects_owner_user_id, idx_projects_team_id, idx_projects_team_created;
DROP INDEX IF EXISTS idx_interest_requests_tool_id, idx_interest_requests_user_id, idx_interest_tool_created;
DROP INDEX IF EXISTS idx_audit_log_user_id, idx_audit_log_tool_id, idx_audit_log_created_at;
DROP INDEX IF EXISTS idx_audit_user_time_action;
DROP INDEX IF EXISTS idx_activity_team_id, idx_activity_project_id, idx_activity_created_at;
DROP INDEX IF EXISTS idx_activity_user_project_time, idx_activity_team_time, idx_activity_feed_user_id;
DROP INDEX IF EXISTS idx_project_files_project_id, idx_project_files_uploaded_by;
DROP INDEX IF EXISTS idx_tasks_project_id, idx_tasks_assigned_to, idx_tasks_status, idx_tasks_created_by;
DROP INDEX IF EXISTS idx_tasks_project_status_assigned, idx_tasks_assigned_status;
DROP INDEX IF EXISTS idx_documents_project_id, idx_documents_created_by;
DROP INDEX IF EXISTS idx_documents_project_type, idx_documents_content_gin;
DROP INDEX IF EXISTS idx_inventory_team_id, idx_inventory_project_id, idx_inventory_team_category;
DROP INDEX IF EXISTS idx_budget_project_id, idx_budget_items_created_by;
DROP INDEX IF EXISTS idx_budget_project_category, idx_budget_status_due;
DROP INDEX IF EXISTS idx_stage_plot_props_user, idx_stage_plot_props_category, idx_stage_plot_user_category;
DROP INDEX IF EXISTS idx_fixtures_brand, idx_fixtures_type, idx_fixtures_use_case;
DROP INDEX IF EXISTS idx_fixtures_ip_rating, idx_fixtures_cri;
DROP INDEX IF EXISTS idx_fixtures_model_search, idx_fixtures_brand_search;
DROP INDEX IF EXISTS idx_dmx_modes_fixture_id;
DROP INDEX IF EXISTS idx_power_plans_user_id, idx_power_plans_team_id, idx_power_plans_project_id;
DROP INDEX IF EXISTS idx_power_plan_devices_plan_id, idx_power_plan_versions_plan_id;
DROP INDEX IF EXISTS idx_power_plan_versions_created_by, idx_power_devices_plan_phase;
DROP INDEX IF EXISTS idx_power_plans_user_project;
DROP INDEX IF EXISTS idx_spl_sessions_user_id, idx_spl_sessions_project_id, idx_spl_sessions_start_time;
DROP INDEX IF EXISTS idx_spl_measurements_session_id, idx_spl_measurements_timestamp;
DROP INDEX IF EXISTS idx_spl_calibrations_user_id, idx_spl_calibrations_active;
DROP INDEX IF EXISTS idx_spl_measurements_session_time, idx_spl_sessions_user_project;
DROP INDEX IF EXISTS idx_dmx_patches_project_id, idx_dmx_universes_patch_id;
DROP INDEX IF EXISTS idx_dmx_universes_universe_number, idx_dmx_fixtures_universe_id;
DROP INDEX IF EXISTS idx_dmx_fixtures_universe, idx_dmx_fixtures_start_address;
DROP INDEX IF EXISTS idx_dmx_fixtures_group_name, idx_dmx_fixtures_fixture_id;
DROP INDEX IF EXISTS idx_dmx_fixtures_dmx_mode_id, idx_dmx_patch_versions_patch_id;
DROP INDEX IF EXISTS idx_dmx_groups_user_id, idx_dmx_patch_versions_user_id;
DROP INDEX IF EXISTS idx_dmx_fixtures_patch_universe, idx_dmx_fixtures_patch_group;
DROP INDEX IF EXISTS idx_dmx_patches_user_project;
DROP INDEX IF EXISTS idx_cable_labels_channel_id, idx_cable_labels_patchlist_id;
DROP INDEX IF EXISTS idx_console_presets_created_by, idx_console_presets_public;
DROP INDEX IF EXISTS idx_console_presets_user_mfr, idx_console_config_gin;

-- Ensure critical index for auth exists
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_active 
  ON subscriptions(user_id) 
  WHERE status IN ('active', 'trial');