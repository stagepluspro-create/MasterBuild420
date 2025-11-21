/*
  # Haze & Atmosphere Simulator Schema

  ## Purpose
  Store venue configurations, simulation presets, and analysis results for the Haze & Atmosphere Simulator tool.

  ## Tables Created
  
  1. **haze_venues**
     - Stores venue layouts with dimensions, obstacles, and physical properties
     - Links to user/team ownership
     - Includes venue metadata (name, description, dimensions)
  
  2. **haze_machines**
     - Fog/haze machine configurations within venues
     - Output rates, placement coordinates, machine types
  
  3. **haze_hvac_vents**
     - HVAC system configuration
     - Vent positions, CFM ratings, intake/output designation
  
  4. **haze_fixtures**
     - Light fixture positions and beam properties
     - Used for visibility calculations
  
  5. **haze_simulations**
     - Saved simulation results and analysis
     - Time-to-fill, coverage metrics, safety warnings
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data or team-shared data
  - Proper foreign key relationships established
*/

-- Haze venues table
CREATE TABLE IF NOT EXISTS haze_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  width_m numeric NOT NULL DEFAULT 20,
  length_m numeric NOT NULL DEFAULT 30,
  height_m numeric NOT NULL DEFAULT 8,
  grid_resolution integer NOT NULL DEFAULT 200,
  obstacles jsonb DEFAULT '[]'::jsonb,
  temperature_c numeric DEFAULT 20,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Haze machines table
CREATE TABLE IF NOT EXISTS haze_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  machine_type text NOT NULL DEFAULT 'haze',
  output_m3_per_min numeric NOT NULL DEFAULT 5,
  position_x numeric NOT NULL,
  position_y numeric NOT NULL,
  position_z numeric NOT NULL DEFAULT 1.5,
  direction_angle numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  warmup_time_sec integer DEFAULT 180,
  fluid_capacity_ml integer DEFAULT 2500,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- HVAC vents table
CREATE TABLE IF NOT EXISTS haze_hvac_vents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  vent_type text NOT NULL CHECK (vent_type IN ('supply', 'return', 'exhaust')),
  cfm numeric NOT NULL DEFAULT 400,
  position_x numeric NOT NULL,
  position_y numeric NOT NULL,
  position_z numeric NOT NULL DEFAULT 2.5,
  direction_x numeric DEFAULT 0,
  direction_y numeric DEFAULT 0,
  direction_z numeric DEFAULT -1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Light fixtures for beam visibility
CREATE TABLE IF NOT EXISTS haze_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  fixture_type text NOT NULL DEFAULT 'moving_head',
  position_x numeric NOT NULL,
  position_y numeric NOT NULL,
  position_z numeric NOT NULL DEFAULT 5,
  beam_angle numeric DEFAULT 15,
  intensity numeric DEFAULT 1.0,
  pan_angle numeric DEFAULT 0,
  tilt_angle numeric DEFAULT 45,
  color text DEFAULT '#FFFFFF',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Simulation results table
CREATE TABLE IF NOT EXISTS haze_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES haze_venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  simulation_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  time_to_fill_sec numeric,
  time_to_clear_sec numeric,
  coverage_score numeric,
  uniformity_score numeric,
  safety_warnings jsonb DEFAULT '[]'::jsonb,
  optimal_placement jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_haze_venues_user_id ON haze_venues(user_id);
CREATE INDEX IF NOT EXISTS idx_haze_venues_team_id ON haze_venues(team_id);
CREATE INDEX IF NOT EXISTS idx_haze_venues_project_id ON haze_venues(project_id);
CREATE INDEX IF NOT EXISTS idx_haze_machines_venue_id ON haze_machines(venue_id);
CREATE INDEX IF NOT EXISTS idx_haze_hvac_vents_venue_id ON haze_hvac_vents(venue_id);
CREATE INDEX IF NOT EXISTS idx_haze_fixtures_venue_id ON haze_fixtures(venue_id);
CREATE INDEX IF NOT EXISTS idx_haze_simulations_venue_id ON haze_simulations(venue_id);
CREATE INDEX IF NOT EXISTS idx_haze_simulations_user_id ON haze_simulations(user_id);

-- Enable RLS
ALTER TABLE haze_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE haze_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE haze_hvac_vents ENABLE ROW LEVEL SECURITY;
ALTER TABLE haze_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE haze_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for haze_venues
CREATE POLICY "Users can view own venues"
  ON haze_venues FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own venues"
  ON haze_venues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own venues"
  ON haze_venues FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own venues"
  ON haze_venues FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for haze_machines
CREATE POLICY "Users can view machines in their venues"
  ON haze_machines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_machines.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert machines in their venues"
  ON haze_machines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_machines.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update machines in their venues"
  ON haze_machines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_machines.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete machines in their venues"
  ON haze_machines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_machines.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

-- RLS Policies for haze_hvac_vents
CREATE POLICY "Users can view vents in their venues"
  ON haze_hvac_vents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_hvac_vents.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vents in their venues"
  ON haze_hvac_vents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_hvac_vents.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vents in their venues"
  ON haze_hvac_vents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_hvac_vents.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vents in their venues"
  ON haze_hvac_vents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_hvac_vents.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

-- RLS Policies for haze_fixtures
CREATE POLICY "Users can view fixtures in their venues"
  ON haze_fixtures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_fixtures.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fixtures in their venues"
  ON haze_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_fixtures.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fixtures in their venues"
  ON haze_fixtures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_fixtures.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fixtures in their venues"
  ON haze_fixtures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM haze_venues
      WHERE haze_venues.id = haze_fixtures.venue_id
      AND haze_venues.user_id = auth.uid()
    )
  );

-- RLS Policies for haze_simulations
CREATE POLICY "Users can view own simulations"
  ON haze_simulations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations"
  ON haze_simulations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations"
  ON haze_simulations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulations"
  ON haze_simulations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
