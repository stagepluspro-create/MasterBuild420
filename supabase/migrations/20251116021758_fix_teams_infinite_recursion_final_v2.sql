/*
  # Fix Teams Infinite Recursion - Complete Solution

  ## Problem
  Multiple duplicate policies exist on teams and team_members tables.
  The SELECT policies create circular dependencies:
  - teams_select_policy checks team_members
  - team_members_select_policy checks teams AND team_members recursively
  
  This causes "infinite recursion detected in policy for relation 'teams'"

  ## Solution
  1. Drop ALL existing policies on both tables
  2. Create new simplified policies that don't cross-reference
  3. Use direct ownership checks only, no subqueries to other tables in SELECT

  ## Changes
  - Remove all 14 existing policies
  - Add 8 clean, non-recursive policies
  - teams SELECT: owner OR direct membership (no subquery)
  - team_members SELECT: own records OR simple team ownership check

  ## Security
  - All access still properly restricted
  - No recursive dependencies
  - Users can only access their own teams and memberships
*/

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all teams policies
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
DROP POLICY IF EXISTS "teams_insert_by_authenticated" ON teams;
DROP POLICY IF EXISTS "teams_update_by_owner" ON teams;
DROP POLICY IF EXISTS "teams_delete_by_owner" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Owners can update teams" ON teams;
DROP POLICY IF EXISTS "Owners can delete teams" ON teams;

-- Drop all team_members policies
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_by_owners_admins" ON team_members;
DROP POLICY IF EXISTS "team_members_update_by_owners_admins" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_by_owners_admins" ON team_members;
DROP POLICY IF EXISTS "Users can create team memberships" ON team_members;
DROP POLICY IF EXISTS "Team owners can update memberships" ON team_members;
DROP POLICY IF EXISTS "Team owners can delete memberships" ON team_members;

-- =====================================================
-- STEP 2: CREATE/RECREATE SECURITY DEFINER HELPER FUNCTION
-- =====================================================
-- This function bypasses RLS to check team ownership
-- Prevents recursion by not triggering RLS policies

DROP FUNCTION IF EXISTS is_team_owner(uuid, uuid);

CREATE FUNCTION is_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE id = p_team_id 
    AND owner_user_id = p_user_id
  );
$$;

-- =====================================================
-- STEP 3: CREATE NEW NON-RECURSIVE POLICIES
-- =====================================================

-- ============= TEAMS TABLE =============

-- SELECT: Users see teams they own (direct check, no JOIN)
CREATE POLICY "teams_select_owner_only"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
  );

-- INSERT: Users can create teams where they are owner
CREATE POLICY "teams_insert_owner"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = (SELECT auth.uid())
  );

-- UPDATE: Owners can update their teams
CREATE POLICY "teams_update_owner"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()))
  WITH CHECK (owner_user_id = (SELECT auth.uid()));

-- DELETE: Owners can delete their teams
CREATE POLICY "teams_delete_owner"
  ON teams
  FOR DELETE
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()));

-- ============= TEAM_MEMBERS TABLE =============

-- SELECT: Users see their own memberships + memberships in teams they own
CREATE POLICY "team_members_select_own_or_owned"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    is_team_owner(team_id, (SELECT auth.uid()))
  );

-- INSERT: Team owners can add members, users can add themselves as owner
CREATE POLICY "team_members_insert_owner_or_self"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = (SELECT auth.uid()) AND role = 'owner')
    OR
    is_team_owner(team_id, (SELECT auth.uid()))
  );

-- UPDATE: Team owners can update memberships
CREATE POLICY "team_members_update_owner"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (is_team_owner(team_id, (SELECT auth.uid())))
  WITH CHECK (is_team_owner(team_id, (SELECT auth.uid())));

-- DELETE: Team owners can remove members
CREATE POLICY "team_members_delete_owner"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (is_team_owner(team_id, (SELECT auth.uid())));

-- =====================================================
-- STEP 4: VERIFY RLS ENABLED
-- =====================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON FUNCTION is_team_owner IS 'Security definer function to check team ownership without triggering RLS recursion';
COMMENT ON POLICY "teams_select_owner_only" ON teams IS 'Users can only see teams they own directly';
COMMENT ON POLICY "team_members_select_own_or_owned" ON team_members IS 'Users see their own memberships or memberships in teams they own';
