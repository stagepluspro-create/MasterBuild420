/*
  # Fix Team Member Insert Policy

  1. Problem
    - Current INSERT policy for team_members checks if user is already team owner/admin
    - This creates a circular dependency when creating new teams
    - User creates team → tries to add themselves as owner → policy fails because they're not a member yet

  2. Solution
    - Allow users to insert themselves as members if they own the team (check teams.owner_user_id)
    - This allows the initial owner insertion after team creation

  3. Security
    - Still maintains security by checking team ownership
    - Only team owners can add the initial member record
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Team owners and admins can invite members" ON team_members;

-- Create new INSERT policy that allows team owners to add themselves
CREATE POLICY "Team owners can add members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can insert if they own the team
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = auth.uid()
    )
    OR
    -- OR if user is already an admin/owner member (for inviting others)
    (
      team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
          AND joined_at IS NOT NULL
      )
    )
  );
