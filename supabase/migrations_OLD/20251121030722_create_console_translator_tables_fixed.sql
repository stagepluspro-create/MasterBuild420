/*
  # Console Translator Schema

  ## Purpose
  Store showfile uploads, conversion jobs, mapping profiles, and conversion history
  for the Multi-Console Translator tool that converts between lighting console formats.

  ## Tables Created
  
  1. **console_showfiles** - Uploaded source showfiles with vendor detection
  2. **mapping_profiles** - Reusable conversion templates
  3. **console_conversions** - Conversion job records
  4. **console_fixtures** - Parsed fixture data from showfiles
  5. **console_mappings** - Fixture-level mapping configurations

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data or team-shared data
*/

-- Console showfiles table
CREATE TABLE IF NOT EXISTS console_showfiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  vendor text NOT NULL CHECK (vendor IN ('grandma2', 'grandma3', 'hog4', 'eos', 'avolites', 'onyx', 'chamsys', 'unknown')),
  filename text NOT NULL,
  storage_path text NOT NULL,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'parsed', 'error')),
  parse_error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  fixture_count integer DEFAULT 0,
  cue_count integer DEFAULT 0,
  universe_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mapping profiles table (must exist before console_conversions)
CREATE TABLE IF NOT EXISTS mapping_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  source_vendor text NOT NULL,
  target_vendor text NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Console conversions table
CREATE TABLE IF NOT EXISTS console_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_showfile_id uuid REFERENCES console_showfiles(id) ON DELETE SET NULL,
  source_vendor text NOT NULL,
  target_vendor text NOT NULL,
  profile_id uuid REFERENCES mapping_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  output_storage_path text,
  conflicts jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,
  mapping_stats jsonb DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Console fixtures table
CREATE TABLE IF NOT EXISTS console_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  showfile_id uuid NOT NULL REFERENCES console_showfiles(id) ON DELETE CASCADE,
  fixture_index integer NOT NULL,
  original_id text,
  manufacturer text,
  model text,
  mode text,
  universe integer,
  address integer,
  channel_count integer,
  position_x numeric,
  position_y numeric,
  position_z numeric,
  attributes jsonb DEFAULT '{}'::jsonb,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Console mappings table
CREATE TABLE IF NOT EXISTS console_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_id uuid NOT NULL REFERENCES console_conversions(id) ON DELETE CASCADE,
  source_fixture_id uuid REFERENCES console_fixtures(id) ON DELETE SET NULL,
  source_manufacturer text NOT NULL,
  source_model text NOT NULL,
  source_mode text,
  target_manufacturer text NOT NULL,
  target_model text NOT NULL,
  target_mode text,
  target_universe integer,
  target_address integer,
  channel_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  is_manual_override boolean DEFAULT false,
  warnings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_console_showfiles_user_id ON console_showfiles(user_id);
CREATE INDEX IF NOT EXISTS idx_console_showfiles_team_id ON console_showfiles(team_id);
CREATE INDEX IF NOT EXISTS idx_console_showfiles_vendor ON console_showfiles(vendor);
CREATE INDEX IF NOT EXISTS idx_console_showfiles_status ON console_showfiles(status);

CREATE INDEX IF NOT EXISTS idx_console_conversions_user_id ON console_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_console_conversions_source_showfile_id ON console_conversions(source_showfile_id);
CREATE INDEX IF NOT EXISTS idx_console_conversions_status ON console_conversions(status);

CREATE INDEX IF NOT EXISTS idx_console_fixtures_showfile_id ON console_fixtures(showfile_id);
CREATE INDEX IF NOT EXISTS idx_console_fixtures_manufacturer_model ON console_fixtures(manufacturer, model);

CREATE INDEX IF NOT EXISTS idx_console_mappings_conversion_id ON console_mappings(conversion_id);
CREATE INDEX IF NOT EXISTS idx_console_mappings_source_fixture_id ON console_mappings(source_fixture_id);

CREATE INDEX IF NOT EXISTS idx_mapping_profiles_user_id ON mapping_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mapping_profiles_team_id ON mapping_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_mapping_profiles_vendors ON mapping_profiles(source_vendor, target_vendor);

-- Enable RLS
ALTER TABLE console_showfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE console_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE console_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE console_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for console_showfiles
CREATE POLICY "Users can view own showfiles"
  ON console_showfiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own showfiles"
  ON console_showfiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own showfiles"
  ON console_showfiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own showfiles"
  ON console_showfiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for console_conversions
CREATE POLICY "Users can view own conversions"
  ON console_conversions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions"
  ON console_conversions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversions"
  ON console_conversions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversions"
  ON console_conversions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for console_fixtures
CREATE POLICY "Users can view fixtures in their showfiles"
  ON console_fixtures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM console_showfiles
      WHERE console_showfiles.id = console_fixtures.showfile_id
      AND console_showfiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fixtures in their showfiles"
  ON console_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM console_showfiles
      WHERE console_showfiles.id = console_fixtures.showfile_id
      AND console_showfiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fixtures in their showfiles"
  ON console_fixtures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM console_showfiles
      WHERE console_showfiles.id = console_fixtures.showfile_id
      AND console_showfiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fixtures in their showfiles"
  ON console_fixtures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM console_showfiles
      WHERE console_showfiles.id = console_fixtures.showfile_id
      AND console_showfiles.user_id = auth.uid()
    )
  );

-- RLS Policies for console_mappings
CREATE POLICY "Users can view mappings in their conversions"
  ON console_mappings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM console_conversions
      WHERE console_conversions.id = console_mappings.conversion_id
      AND console_conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert mappings in their conversions"
  ON console_mappings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM console_conversions
      WHERE console_conversions.id = console_mappings.conversion_id
      AND console_conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update mappings in their conversions"
  ON console_mappings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM console_conversions
      WHERE console_conversions.id = console_mappings.conversion_id
      AND console_conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete mappings in their conversions"
  ON console_mappings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM console_conversions
      WHERE console_conversions.id = console_mappings.conversion_id
      AND console_conversions.user_id = auth.uid()
    )
  );

-- RLS Policies for mapping_profiles
CREATE POLICY "Users can view own and public profiles"
  ON mapping_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own profiles"
  ON mapping_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON mapping_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON mapping_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
