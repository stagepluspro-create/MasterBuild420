/*
  # Add Comprehensive Team Features for Teams Dashboard (V2)

  ## Overview
  This migration adds all necessary database structures to support a full-featured
  team management dashboard with:
  - Role-based permissions system
  - Tool access controls per user and role
  - Team and user API keys
  - Integration management
  - Enhanced activity tracking
  - Team settings and preferences
  - Security features

  ## New Tables
  1. `team_roles` - Custom role definitions with permissions
  2. `team_tool_access` - Tool access control per user/role
  3. `team_api_keys` - Team-level API keys for integrations
  4. `user_api_keys` - User-level API keys within teams
  5. `team_integrations` - Third-party service connections
  6. `team_security_settings` - Security policies per team

  ## Modified Tables
  - `teams` - Add description, logo_url, contact_email, archived fields
  - `team_members` - Add last_active, status (active/suspended) fields

  ## Security
  - All tables have RLS enabled
  - Permissions enforced at database level
*/

-- Add new fields to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'description'
  ) THEN
    ALTER TABLE teams ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE teams ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE teams ADD COLUMN contact_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'archived'
  ) THEN
    ALTER TABLE teams ADD COLUMN archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'settings'
  ) THEN
    ALTER TABLE teams ADD COLUMN settings jsonb DEFAULT '{"units": "metric", "theme": "dark"}'::jsonb;
  END IF;
END $$;

-- Add new fields to team_members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE team_members ADD COLUMN last_active timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'status'
  ) THEN
    ALTER TABLE team_members ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE team_members ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Team Roles: Define custom roles with permissions
CREATE TABLE IF NOT EXISTS team_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, name)
);

ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;

-- Team Tool Access: Control which users can access which tools
CREATE TABLE IF NOT EXISTS team_tool_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  enabled boolean DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id, tool_id)
);

ALTER TABLE team_tool_access ENABLE ROW LEVEL SECURITY;

-- Team API Keys: Team-level API keys
CREATE TABLE IF NOT EXISTS team_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked boolean DEFAULT false,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, name)
);

ALTER TABLE team_api_keys ENABLE ROW LEVEL SECURITY;

-- User API Keys: Per-user API keys within teams
CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked boolean DEFAULT false,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_id, name)
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Team Integrations: Third-party service connections
CREATE TABLE IF NOT EXISTS team_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  integration_type text NOT NULL,
  integration_name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  last_sync_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, integration_type, integration_name)
);

ALTER TABLE team_integrations ENABLE ROW LEVEL SECURITY;

-- Team Security Settings: Security policies per team
CREATE TABLE IF NOT EXISTS team_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  enforce_mfa boolean DEFAULT false,
  allowed_email_domains text[],
  session_timeout_minutes integer DEFAULT 480,
  ip_whitelist text[],
  require_password_change_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id)
);

ALTER TABLE team_security_settings ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_roles_team_id ON team_roles(team_id);
CREATE INDEX IF NOT EXISTS idx_team_tool_access_team_user ON team_tool_access(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_tool_access_tool_id ON team_tool_access(tool_id);
CREATE INDEX IF NOT EXISTS idx_team_api_keys_team_id ON team_api_keys(team_id);
CREATE INDEX IF NOT EXISTS idx_team_api_keys_key_prefix ON team_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_team_id ON user_api_keys(team_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_prefix ON user_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_team_integrations_team_id ON team_integrations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_integrations_type ON team_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_team_security_settings_team_id ON team_security_settings(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_last_active ON team_members(last_active);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- RLS Policies for team_roles
CREATE POLICY "Team members can view team roles"
  ON team_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_roles.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can create roles"
  ON team_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_roles.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can update roles"
  ON team_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_roles.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can delete roles"
  ON team_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_roles.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
    AND NOT is_system
  );

-- RLS Policies for team_tool_access
CREATE POLICY "Team members can view tool access"
  ON team_tool_access FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tool_access.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can manage tool access"
  ON team_tool_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tool_access.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tool_access.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  );

-- RLS Policies for team_api_keys
CREATE POLICY "Team members can view team API keys"
  ON team_api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can manage team API keys"
  ON team_api_keys FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  );

-- RLS Policies for user_api_keys
CREATE POLICY "Users can view own API keys"
  ON user_api_keys FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = user_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can manage own API keys"
  ON user_api_keys FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for team_integrations
CREATE POLICY "Team members can view integrations"
  ON team_integrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_integrations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can manage integrations"
  ON team_integrations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_integrations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_integrations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
      AND team_members.joined_at IS NOT NULL
    )
  );

-- RLS Policies for team_security_settings
CREATE POLICY "Team members can view security settings"
  ON team_security_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_security_settings.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners can manage security settings"
  ON team_security_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_security_settings.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_security_settings.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'
      AND team_members.joined_at IS NOT NULL
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION has_team_permission(
  p_team_id uuid,
  p_user_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_has_permission boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = p_team_id
    AND tm.user_id = p_user_id
    AND tm.joined_at IS NOT NULL
    AND tm.status = 'active'
    AND (
      tm.role = 'owner'
      OR (tm.permissions ? p_permission AND (tm.permissions->p_permission)::boolean = true)
    )
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;

CREATE OR REPLACE FUNCTION can_access_tool(
  p_team_id uuid,
  p_user_id uuid,
  p_tool_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_can_access boolean;
BEGIN
  SELECT enabled INTO v_can_access
  FROM team_tool_access
  WHERE team_id = p_team_id
  AND user_id = p_user_id
  AND tool_id = p_tool_id;

  IF v_can_access IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND joined_at IS NOT NULL
      AND status = 'active'
    ) INTO v_can_access;
  END IF;

  RETURN COALESCE(v_can_access, false);
END;
$$;

-- Create default security settings for existing teams
INSERT INTO team_security_settings (team_id)
SELECT id FROM teams
WHERE NOT EXISTS (
  SELECT 1 FROM team_security_settings WHERE team_id = teams.id
)
ON CONFLICT (team_id) DO NOTHING;