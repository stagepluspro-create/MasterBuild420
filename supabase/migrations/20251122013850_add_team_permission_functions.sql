/*
  # Add Team Permission Helper Functions

  1. New Functions
    - `has_team_permission(p_team_id, p_user_id, p_permission)` - Check if user has specific permission in team
    - `can_access_tool(p_team_id, p_user_id, p_tool_id)` - Check if user can access specific tool in team

  2. Purpose
    - These functions are used by the team-service to check user permissions
    - They provide efficient permission checking without multiple client queries

  3. Security
    - Functions run with invoker rights (not elevated privileges)
    - Check actual team membership before permission checks
*/

-- Function to check if user has a specific permission in a team
CREATE OR REPLACE FUNCTION has_team_permission(
  p_team_id uuid,
  p_user_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_member_role text;
  v_permissions jsonb;
BEGIN
  -- Get the user's role and permissions in the team
  SELECT role, permissions
  INTO v_member_role, v_permissions
  FROM team_members
  WHERE team_id = p_team_id
    AND user_id = p_user_id
    AND joined_at IS NOT NULL
    AND status = 'active';

  -- If not a member, return false
  IF v_member_role IS NULL THEN
    RETURN false;
  END IF;

  -- Owners and admins have all permissions
  IF v_member_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;

  -- Check custom permissions
  IF v_permissions IS NOT NULL AND v_permissions ? p_permission THEN
    RETURN (v_permissions->p_permission)::boolean;
  END IF;

  -- Default deny
  RETURN false;
END;
$$;

-- Function to check if user can access a specific tool in a team
CREATE OR REPLACE FUNCTION can_access_tool(
  p_team_id uuid,
  p_user_id uuid,
  p_tool_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_is_member boolean;
  v_tool_access_enabled boolean;
BEGIN
  -- Check if user is an active team member
  SELECT EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND joined_at IS NOT NULL
      AND status = 'active'
  ) INTO v_is_member;

  -- If not a member, deny access
  IF NOT v_is_member THEN
    RETURN false;
  END IF;

  -- Check if there's a specific tool access entry
  SELECT enabled
  INTO v_tool_access_enabled
  FROM team_tool_access
  WHERE team_id = p_team_id
    AND user_id = p_user_id
    AND tool_id = p_tool_id;

  -- If specific access entry exists, return its value
  IF v_tool_access_enabled IS NOT NULL THEN
    RETURN v_tool_access_enabled;
  END IF;

  -- Default: team members can access all tools unless explicitly restricted
  RETURN true;
END;
$$;
