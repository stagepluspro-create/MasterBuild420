/*
  # StageTechPro - Initial Database Schema

  ## Overview
  This migration creates the complete base database schema for StageTechPro.
  All tables, functions, triggers, and initial setup required for the application.

  ## Core Tables
  1. profiles - User profile data linked to auth.users
  2. subscriptions - User subscription tiers and trial management
  3. teams - Team workspaces (up to 30 members)
  4. team_members - Team membership with roles and invitations
  5. projects - Team projects for organizing work
  6. presets - User/team presets for tools (saved configurations)
  7. audit_log - Activity tracking and usage analytics
  8. interest_requests - User requests for upcoming tools

  ## Tool-Specific Tables
  9. power_plans - Power calculator saved plans
  10. power_devices - Power calculator devices
  11. dmx_patches - DMX calculator patch configurations
  12. dmx_fixtures - DMX calculator fixture library
  13. spl_measurements - SPL meter measurement history
  14. spl_venues - SPL meter venue presets
  15. patch_lists - Audio patch list configurations
  16. patch_channels - Audio patch list channel mappings
  17. monitor_mixes - Audio monitor mix configurations

  ## Utility Tables
  18. tasks - Project task management
  19. project_files - File attachments for projects
  20. documents - Team documentation
  21. inventory_items - Equipment inventory tracking
  22. budget_items - Budget planning and tracking
  23. budget_snapshots - Budget version history
  24. activity_feed - Team activity notifications

  ## Security
  - All tables have RLS enabled
  - Policies will be applied in subsequent migrations
  - Proper foreign key relationships
  - Indexes for performance
*/

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES TABLE
-- =====================================================

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  settings jsonb DEFAULT '{"units": "metric", "theme": "dark"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_email ON profiles(email);

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'pro' CHECK (tier IN ('pro', 'team')),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'canceled')),
  seats integer NOT NULL DEFAULT 1,
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + interval '7 days'),
  subscription_start timestamptz,
  subscription_end timestamptz,
  paypal_transaction_id text,
  paypal_subscription_id text,
  auto_renew boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- TEAMS TABLE
-- =====================================================

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  max_seats integer NOT NULL DEFAULT 30,
  description text,
  logo_url text,
  contact_email text,
  archived boolean DEFAULT false,
  settings jsonb DEFAULT '{"units": "metric", "theme": "dark"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_teams_owner ON teams(owner_user_id);
CREATE INDEX idx_teams_archived ON teams(archived) WHERE archived = false;

-- =====================================================
-- TEAM MEMBERS TABLE
-- =====================================================

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invitation_email text,
  invitation_token text,
  invitation_expires_at timestamptz,
  invited_by uuid REFERENCES profiles(id),
  invited_at timestamptz,
  joined_at timestamptz,
  last_active timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_invitation_email ON team_members(invitation_email) WHERE invitation_email IS NOT NULL;
CREATE INDEX idx_team_members_invitation_token ON team_members(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE UNIQUE INDEX idx_team_members_team_user ON team_members(team_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_team_members_team_invitation ON team_members(team_id, invitation_email) WHERE invitation_email IS NOT NULL;

-- =====================================================
-- PROJECTS TABLE
-- =====================================================

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  start_date date,
  end_date date,
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_projects_owner ON projects(owner_user_id);
CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_status ON projects(status);

-- =====================================================
-- PRESETS TABLE
-- =====================================================

CREATE TABLE presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  name text NOT NULL,
  payload jsonb NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  shared_with_team boolean DEFAULT false,
  shared_by uuid REFERENCES profiles(id),
  shared_at timestamptz,
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_presets_user_tool ON presets(user_id, tool_id);
CREATE INDEX idx_presets_project ON presets(project_id);
CREATE INDEX idx_presets_shared ON presets(shared_with_team) WHERE shared_with_team = true;

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  tool_id text,
  meta jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_log_user_action ON audit_log(user_id, action);
CREATE INDEX idx_audit_log_tool ON audit_log(tool_id) WHERE tool_id IS NOT NULL;
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- =====================================================
-- INTEREST REQUESTS TABLE
-- =====================================================

CREATE TABLE interest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

ALTER TABLE interest_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_interest_requests_tool ON interest_requests(tool_id);
CREATE INDEX idx_interest_requests_status ON interest_requests(status);

-- =====================================================
-- POWER PLANS TABLE
-- =====================================================

CREATE TABLE power_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  voltage integer NOT NULL DEFAULT 120,
  max_amps integer NOT NULL DEFAULT 20,
  power_factor numeric DEFAULT 0.9,
  safety_margin numeric DEFAULT 0.2,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE power_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_power_plans_user ON power_plans(user_id);
CREATE INDEX idx_power_plans_project ON power_plans(project_id);
CREATE INDEX idx_power_plans_team ON power_plans(team_id);

-- =====================================================
-- POWER DEVICES TABLE
-- =====================================================

CREATE TABLE power_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES power_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  watts integer NOT NULL,
  amps numeric,
  quantity integer DEFAULT 1,
  circuit_number integer,
  notes text,
  device_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE power_devices ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_power_devices_plan ON power_devices(plan_id);
CREATE INDEX idx_power_devices_circuit ON power_devices(circuit_number);

-- =====================================================
-- DMX PATCHES TABLE
-- =====================================================

CREATE TABLE dmx_patches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dmx_patches ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_dmx_patches_user ON dmx_patches(user_id);
CREATE INDEX idx_dmx_patches_project ON dmx_patches(project_id);
CREATE INDEX idx_dmx_patches_team ON dmx_patches(team_id);

-- =====================================================
-- DMX FIXTURES TABLE
-- =====================================================

CREATE TABLE dmx_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id uuid NOT NULL REFERENCES dmx_patches(id) ON DELETE CASCADE,
  fixture_number integer NOT NULL,
  manufacturer text,
  model text,
  mode text,
  universe integer NOT NULL,
  address integer NOT NULL,
  channel_count integer NOT NULL,
  notes text,
  position jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dmx_fixtures ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_dmx_fixtures_patch ON dmx_fixtures(patch_id);
CREATE INDEX idx_dmx_fixtures_universe ON dmx_fixtures(universe, address);

-- =====================================================
-- SPL MEASUREMENTS TABLE
-- =====================================================

CREATE TABLE spl_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id uuid,
  measurement_name text NOT NULL,
  spl_value numeric NOT NULL,
  frequency_weighting text DEFAULT 'A' CHECK (frequency_weighting IN ('A', 'C', 'Z')),
  time_weighting text DEFAULT 'Fast' CHECK (time_weighting IN ('Fast', 'Slow', 'Impulse')),
  location text,
  notes text,
  ambient_noise numeric,
  max_peak numeric,
  duration_seconds integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE spl_measurements ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_spl_measurements_user ON spl_measurements(user_id);
CREATE INDEX idx_spl_measurements_venue ON spl_measurements(venue_id);
CREATE INDEX idx_spl_measurements_date ON spl_measurements(created_at DESC);

-- =====================================================
-- SPL VENUES TABLE
-- =====================================================

CREATE TABLE spl_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  venue_type text,
  capacity integer,
  compliance_limit numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE spl_venues ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_spl_venues_user ON spl_venues(user_id);

-- =====================================================
-- PATCH LISTS TABLE
-- =====================================================

CREATE TABLE patch_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  console_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patch_lists ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_patch_lists_user ON patch_lists(user_id);
CREATE INDEX idx_patch_lists_project ON patch_lists(project_id);
CREATE INDEX idx_patch_lists_team ON patch_lists(team_id);

-- =====================================================
-- PATCH CHANNELS TABLE
-- =====================================================

CREATE TABLE patch_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_list_id uuid NOT NULL REFERENCES patch_lists(id) ON DELETE CASCADE,
  channel_number integer NOT NULL,
  input_source text,
  output_destination text,
  label text,
  microphone_type text,
  cable_length integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patch_channels ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_patch_channels_list ON patch_channels(patch_list_id);
CREATE INDEX idx_patch_channels_number ON patch_channels(channel_number);

-- =====================================================
-- MONITOR MIXES TABLE
-- =====================================================

CREATE TABLE monitor_mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_list_id uuid NOT NULL REFERENCES patch_lists(id) ON DELETE CASCADE,
  mix_number integer NOT NULL,
  performer_name text,
  mix_type text,
  notes text,
  channels jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE monitor_mixes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_monitor_mixes_list ON monitor_mixes(patch_list_id);

-- =====================================================
-- TASKS TABLE
-- =====================================================

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES profiles(id),
  due_date date,
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- =====================================================
-- PROJECT FILES TABLE
-- =====================================================

CREATE TABLE project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  description text,
  tags text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  author_id uuid NOT NULL REFERENCES profiles(id),
  folder text,
  tags text[],
  is_public boolean DEFAULT false,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_documents_team ON documents(team_id);
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_documents_folder ON documents(folder);

-- =====================================================
-- INVENTORY ITEMS TABLE
-- =====================================================

CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  quantity integer DEFAULT 1,
  unit text,
  location text,
  serial_number text,
  purchase_date date,
  purchase_price numeric,
  condition text CHECK (condition IN ('new', 'good', 'fair', 'poor', 'repair')),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inventory_team ON inventory_items(team_id);
CREATE INDEX idx_inventory_user ON inventory_items(user_id);
CREATE INDEX idx_inventory_category ON inventory_items(category);

-- =====================================================
-- BUDGET ITEMS TABLE
-- =====================================================

CREATE TABLE budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  item_name text NOT NULL,
  description text,
  estimated_cost numeric NOT NULL DEFAULT 0,
  actual_cost numeric,
  quantity integer DEFAULT 1,
  supplier text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'paid')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_budget_items_project ON budget_items(project_id);
CREATE INDEX idx_budget_items_user ON budget_items(user_id);
CREATE INDEX idx_budget_items_category ON budget_items(category);

-- =====================================================
-- BUDGET SNAPSHOTS TABLE
-- =====================================================

CREATE TABLE budget_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_name text NOT NULL,
  snapshot_data jsonb NOT NULL,
  total_estimated numeric,
  total_actual numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_budget_snapshots_project ON budget_snapshots(project_id);
CREATE INDEX idx_budget_snapshots_user ON budget_snapshots(user_id);

-- =====================================================
-- ACTIVITY FEED TABLE
-- =====================================================

CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_activity_feed_team ON activity_feed(team_id);
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_project ON activity_feed(project_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.subscriptions (user_id, tier, status, seats, trial_start, trial_end)
  VALUES (
    NEW.id,
    'pro',
    'trial',
    1,
    now(),
    now() + interval '7 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_power_plans_updated_at BEFORE UPDATE ON power_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dmx_patches_updated_at BEFORE UPDATE ON dmx_patches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spl_venues_updated_at BEFORE UPDATE ON spl_venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patch_lists_updated_at BEFORE UPDATE ON patch_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();