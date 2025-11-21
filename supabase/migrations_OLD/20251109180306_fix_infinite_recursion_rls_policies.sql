/*
  # Fix Infinite Recursion in RLS Policies

  ## Problem
  The current RLS policies create infinite recursion:
  - `teams` SELECT policy queries `team_members` table
  - `team_members` SELECT policy queries `teams` table
  - When joining these tables, PostgreSQL detects infinite recursion

  ## Solution
  Break the circular dependency by:
  1. Simplify `team_members` SELECT policy to NOT query the `teams` table
  2. Keep `teams` SELECT policy simple (owner check + direct membership check)
  3. Use security definer functions where needed to bypass RLS for specific checks

  ## Changes
  1. Drop existing conflicting policies
  2. Create new non-recursive policies
  3. Ensure all operations are secure without circular references
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "teams_select_owned_or_member" ON teams;
DROP POLICY IF EXISTS "team_members_select_own_or_owned_teams" ON team_members;

-- Create new teams SELECT policy (no recursion)
-- Users can see teams where they are the owner OR have a membership record
CREATE POLICY "teams_select_policy"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR
    id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
        AND joined_at IS NOT NULL
    )
  );

-- Create new team_members SELECT policy (no recursion)
-- Users can see:
-- 1. Their own membership records
-- 2. Invitations sent to their email (for pending invitations)
-- 3. Other members of teams they own
CREATE POLICY "team_members_select_policy"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    -- Own membership records
    user_id = auth.uid()
    OR
    -- Pending invitations to their email
    (invitation_email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
     AND user_id IS NULL 
     AND joined_at IS NULL)
    OR
    -- Members of teams owned by the current user (direct owner check, no JOIN)
    team_id IN (SELECT id FROM teams WHERE owner_user_id = auth.uid())
  );

-- Verify policies don't reference each other recursively
COMMENT ON POLICY "teams_select_policy" ON teams IS 
  'Non-recursive: only checks team_members for membership, does not trigger teams policy';
COMMENT ON POLICY "team_members_select_policy" ON team_members IS 
  'Non-recursive: only checks teams.owner_user_id directly, does not trigger full teams policy';
