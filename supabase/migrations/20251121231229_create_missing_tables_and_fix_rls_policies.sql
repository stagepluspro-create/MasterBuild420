/*
  # Create Missing Tables and Fix RLS Policies
  
  ## Summary
  This migration creates missing tables referenced by application code and adds missing RLS policies.
  
  ## New Tables Created
  
  ### Equipment System
  - `equipment_favorites` - User equipment favorites with user_id, equipment_type, equipment_id
  
  ### Haze Simulator System
  - `haze_venues` - Venue configurations for haze simulation
  - `haze_machines` - Haze machine placements
  - `haze_hvac_vents` - HVAC vent configurations
  - `haze_fixtures` - Light fixture placements for haze visualization
  - `haze_simulations` - Saved simulation results
  
  ### Console Translator System
  - `console_show_files` - Uploaded console show files
  - `console_translations` - Translation results
  
  ## RLS Policies Added
  
  ### Profiles Table
  - INSERT policy for new user registration (linked to auth.users)
  
  ### Subscriptions Table
  - INSERT policy for new subscription creation
  
  ### All New Tables
  - Complete CRUD policies following the security model:
    - User-owned tables: user_id = auth.uid()
    - Team-scoped tables: team membership validation
  
  ## Security Model Applied
  - All tables have RLS enabled
  - Restrictive policies requiring authentication
  - User ownership and team membership validation
  - No overly permissive policies
*/

-- ============================================================================
-- EQUIPMENT FAVORITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  equipment_type text NOT NULL CHECK (equipment_type IN ('microphones', 'speakers', 'consoles', 'fixtures')),
  equipment_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, equipment_type, equipment_id)
);

ALTER TABLE equipment_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equipment favorites"
  ON equipment_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create equipment favorites"
  ON equipment_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own equipment favorites"
  ON equipment_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_equipment_favorites_user_id ON equipment_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_favorites_type ON equipment_favorites(equipment_type);

-- ============================================================================
-- HAZE SIMULATOR TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS haze_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  width_m numeric NOT NULL DEFAULT 10,
  length_m numeric NOT NULL DEFAULT 10,
  height_m numeric NOT NULL DEFAULT 3,
  grid_resolution integer NOT NULL DEFAULT 50,
  obstacles jsonb DEFAULT '[]'::jsonb,
  temperature_c numeric DEFAULT 20,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE haze_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own haze venues and team venues"
  ON haze_venues FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create haze venues"
  ON haze_venues FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own haze venues"
  ON haze_venues FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own haze venues"
  ON haze_venues FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_haze_venues_user_id ON haze_venues(user_id);
CREATE INDEX IF NOT EXISTS idx_haze_venues_team_id ON haze_venues(team_id);
CREATE INDEX IF NOT EXISTS idx_haze_venues_project_id ON haze_venues(project_id);

-- ============================================================================
-- HAZE MACHINES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS haze_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  machine_type text NOT NULL,
  output_cfm numeric NOT NULL DEFAULT 3000,
  position_x numeric NOT NULL DEFAULT 0,
  position_y numeric NOT NULL DEFAULT 0,
  position_z numeric NOT NULL DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE haze_machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view machines in their venues"
  ON haze_machines FOR SELECT
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues
      WHERE user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can create machines in their venues"
  ON haze_machines FOR INSERT
  TO authenticated
  WITH CHECK (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update machines in their venues"
  ON haze_machines FOR UPDATE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete machines in their venues"
  ON haze_machines FOR DELETE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_haze_machines_venue_id ON haze_machines(venue_id);

-- ============================================================================
-- HAZE HVAC VENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS haze_hvac_vents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  vent_type text NOT NULL CHECK (vent_type IN ('intake', 'exhaust')),
  airflow_cfm numeric NOT NULL DEFAULT 1000,
  position_x numeric NOT NULL DEFAULT 0,
  position_y numeric NOT NULL DEFAULT 0,
  position_z numeric NOT NULL DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE haze_hvac_vents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vents in their venues"
  ON haze_hvac_vents FOR SELECT
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues
      WHERE user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can create vents in their venues"
  ON haze_hvac_vents FOR INSERT
  TO authenticated
  WITH CHECK (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vents in their venues"
  ON haze_hvac_vents FOR UPDATE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vents in their venues"
  ON haze_hvac_vents FOR DELETE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_haze_hvac_vents_venue_id ON haze_hvac_vents(venue_id);

-- ============================================================================
-- HAZE FIXTURES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS haze_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  fixture_type text NOT NULL,
  beam_angle numeric NOT NULL DEFAULT 25,
  intensity numeric NOT NULL DEFAULT 1.0,
  position_x numeric NOT NULL DEFAULT 0,
  position_y numeric NOT NULL DEFAULT 0,
  position_z numeric NOT NULL DEFAULT 0,
  rotation_x numeric DEFAULT 0,
  rotation_y numeric DEFAULT 0,
  rotation_z numeric DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE haze_fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fixtures in their venues"
  ON haze_fixtures FOR SELECT
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues
      WHERE user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can create fixtures in their venues"
  ON haze_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fixtures in their venues"
  ON haze_fixtures FOR UPDATE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fixtures in their venues"
  ON haze_fixtures FOR DELETE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM haze_venues WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_haze_fixtures_venue_id ON haze_fixtures(venue_id);

-- ============================================================================
-- HAZE SIMULATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS haze_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  simulation_params jsonb NOT NULL,
  results jsonb NOT NULL,
  time_to_fill_sec numeric,
  time_to_clear_sec numeric,
  coverage_score numeric,
  uniformity_score numeric,
  safety_warnings jsonb DEFAULT '[]'::jsonb,
  optimal_placement jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE haze_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view simulations in their venues"
  ON haze_simulations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    venue_id IN (
      SELECT id FROM haze_venues
      WHERE user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can create simulations"
  ON haze_simulations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own simulations"
  ON haze_simulations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_haze_simulations_venue_id ON haze_simulations(venue_id);
CREATE INDEX IF NOT EXISTS idx_haze_simulations_user_id ON haze_simulations(user_id);

-- ============================================================================
-- CONSOLE TRANSLATOR TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS console_show_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  source_console text NOT NULL,
  parsed_data jsonb,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'parsed', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE console_show_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own console show files and team files"
  ON console_show_files FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create console show files"
  ON console_show_files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own console show files"
  ON console_show_files FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own console show files"
  ON console_show_files FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_console_show_files_user_id ON console_show_files(user_id);
CREATE INDEX IF NOT EXISTS idx_console_show_files_team_id ON console_show_files(team_id);
CREATE INDEX IF NOT EXISTS idx_console_show_files_project_id ON console_show_files(project_id);

-- ============================================================================

CREATE TABLE IF NOT EXISTS console_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_file_id uuid NOT NULL REFERENCES console_show_files(id) ON DELETE CASCADE,
  target_console text NOT NULL,
  translated_data jsonb NOT NULL,
  mapping_report jsonb,
  conflicts jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE console_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own console translations"
  ON console_translations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create console translations"
  ON console_translations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own console translations"
  ON console_translations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own console translations"
  ON console_translations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_console_translations_user_id ON console_translations(user_id);
CREATE INDEX IF NOT EXISTS idx_console_translations_source_file_id ON console_translations(source_file_id);

-- ============================================================================
-- FIX MISSING RLS POLICIES ON EXISTING TABLES
-- ============================================================================

-- Profiles table: Add INSERT policy for user registration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can create own profile'
  ) THEN
    CREATE POLICY "Users can create own profile"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Subscriptions table: Add INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'subscriptions'
    AND policyname = 'Users can create own subscription'
  ) THEN
    CREATE POLICY "Users can create own subscription"
      ON subscriptions FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
