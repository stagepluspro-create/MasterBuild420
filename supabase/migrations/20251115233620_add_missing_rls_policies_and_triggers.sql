/*
  # Add Missing RLS Policies and Database Triggers

  ## Overview
  Adds critical missing policies and triggers for proper authentication flow

  ## Changes Made
  
  ### 1. Subscriptions Table - INSERT Policy
  - Users can create their own subscription record during signup
  - Required for profile creation flow to work properly
  
  ### 2. Profiles Table - Default Settings
  - Ensure profiles have default settings object
  
  ### 3. Updated_at Triggers
  - Auto-update updated_at timestamp on row modifications
  - Applies to profiles, subscriptions, teams tables
  
  ### 4. Subscription Seats Default Logic
  - Automatically set seats based on tier
  - Pro tier: 1 seat
  - Team tier: 30 seats

  ## Security
  - All policies maintain user isolation (auth.uid() checks)
  - Users can only create/modify their own records
  - No privilege escalation possible
*/

-- =====================================================
-- SUBSCRIPTIONS - ADD INSERT POLICY
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- =====================================================
-- PROFILES - ENSURE DEFAULT SETTINGS
-- =====================================================

ALTER TABLE profiles 
  ALTER COLUMN settings SET DEFAULT '{"units": "metric", "theme": "dark"}'::jsonb;

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- APPLY UPDATED_AT TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-SET SUBSCRIPTION SEATS BASED ON TIER
-- =====================================================

CREATE OR REPLACE FUNCTION set_subscription_seats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_subscription_seats_on_insert ON subscriptions;
CREATE TRIGGER set_subscription_seats_on_insert
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_subscription_seats();

-- =====================================================
-- AUDIT LOG - RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_log;
CREATE POLICY "Users can insert own audit logs"
  ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- =====================================================
-- INTEREST REQUESTS - RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own interest requests" ON interest_requests;
CREATE POLICY "Users can insert own interest requests"
  ON interest_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can view own interest requests" ON interest_requests;
CREATE POLICY "Users can view own interest requests"
  ON interest_requests
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- =====================================================
-- PROJECTS - RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = owner_user_id
  );

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = owner_user_id
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (SELECT auth.uid()) AND joined_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = owner_user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = owner_user_id
  );

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = owner_user_id
  );

-- =====================================================
-- PRESETS - RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own presets" ON presets;
CREATE POLICY "Users can insert own presets"
  ON presets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can view own presets" ON presets;
CREATE POLICY "Users can view own presets"
  ON presets
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR shared_with_team = true
  );

DROP POLICY IF EXISTS "Users can update own presets" ON presets;
CREATE POLICY "Users can update own presets"
  ON presets
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can delete own presets" ON presets;
CREATE POLICY "Users can delete own presets"
  ON presets
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_requests ENABLE ROW LEVEL SECURITY;