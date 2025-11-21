/*
  # Add Missing CRUD Policies for Teams Table

  ## Problem
  The teams table only has a SELECT policy defined. Users cannot create, update, or delete teams.
  This causes "infinite recursion detected in policy for relation 'teams'" error when attempting
  to insert a new team.

  ## Solution
  Add INSERT, UPDATE, and DELETE policies for the teams table that:
  1. Allow authenticated users to create teams where they are the owner
  2. Allow team owners to update their teams
  3. Allow team owners to delete their teams
  4. Do not create circular dependencies with team_members table

  ## Changes
  1. Add teams INSERT policy
  2. Add teams UPDATE policy
  3. Add teams DELETE policy
  4. Add team_members INSERT policy for owner self-enrollment

  ## Security
  - Users can only create teams where they are the owner
  - Users can only update/delete teams they own
  - No recursive policy dependencies
*/

-- =====================================================
-- TEAMS TABLE - ADD MISSING CRUD POLICIES
-- =====================================================

-- INSERT: Users can create teams where they are the owner
DROP POLICY IF EXISTS "Users can create teams" ON teams;
CREATE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = (SELECT auth.uid())
  );

-- UPDATE: Owners can update their teams
DROP POLICY IF EXISTS "Owners can update teams" ON teams;
CREATE POLICY "Owners can update teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    owner_user_id = (SELECT auth.uid())
  );

-- DELETE: Owners can delete their teams
DROP POLICY IF EXISTS "Owners can delete teams" ON teams;
CREATE POLICY "Owners can delete teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
  );

-- =====================================================
-- TEAM_MEMBERS TABLE - ADD INSERT POLICY
-- =====================================================

-- INSERT: Users can add themselves to teams, or team owners can add members
DROP POLICY IF EXISTS "Users can create team memberships" ON team_members;
CREATE POLICY "Users can create team memberships"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can add themselves as owner when creating a team
    (user_id = (SELECT auth.uid()) AND role = 'owner')
    OR
    -- Team owners can add other members
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (SELECT auth.uid())
    )
  );

-- UPDATE: Team owners can update member roles and status
DROP POLICY IF EXISTS "Team owners can update memberships" ON team_members;
CREATE POLICY "Team owners can update memberships"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (SELECT auth.uid())
    )
  );

-- DELETE: Team owners can remove members
DROP POLICY IF EXISTS "Team owners can delete memberships" ON team_members;
CREATE POLICY "Team owners can delete memberships"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

-- Add helpful comments
COMMENT ON POLICY "Users can create teams" ON teams IS
  'Allows authenticated users to create teams where they are the owner';

COMMENT ON POLICY "Owners can update teams" ON teams IS
  'Allows team owners to update their team information';

COMMENT ON POLICY "Owners can delete teams" ON teams IS
  'Allows team owners to delete their teams';

COMMENT ON POLICY "Users can create team memberships" ON team_members IS
  'Allows users to add themselves as owner, or allows team owners to add members';

-- Verify RLS is enabled
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
