/*
  # Fix Remaining ALL Policies

  ## Overview
  This migration replaces the remaining "ALL" policies with granular CRUD policies
  for the last 5 tables that still use broad permissions.

  ## Tables Updated
  - team_api_keys
  - team_integrations
  - team_security_settings
  - team_tool_access
  - user_api_keys

  ## Security Benefits
  - Complete audit trail for all operations
  - Fine-grained permission control
  - Better debugging and monitoring
  - Consistent policy structure across all tables
*/

-- =====================================================
-- team_api_keys: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Team owners and admins can manage team API keys" ON team_api_keys;

CREATE POLICY "Team owners and admins can create team API keys"
  ON team_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can update team API keys"
  ON team_api_keys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can delete team API keys"
  ON team_api_keys FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_api_keys.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

-- =====================================================
-- team_integrations: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Team owners and admins can manage integrations" ON team_integrations;

CREATE POLICY "Team owners and admins can create integrations"
  ON team_integrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_integrations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can update integrations"
  ON team_integrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_integrations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_integrations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can delete integrations"
  ON team_integrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_integrations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

-- =====================================================
-- team_security_settings: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Team owners can manage security settings" ON team_security_settings;

CREATE POLICY "Team owners can create security settings"
  ON team_security_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_security_settings.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'::text
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners can update security settings"
  ON team_security_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_security_settings.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'::text
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_security_settings.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'::text
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners can delete security settings"
  ON team_security_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_security_settings.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'::text
      AND team_members.joined_at IS NOT NULL
    )
  );

-- =====================================================
-- team_tool_access: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Team owners and admins can manage tool access" ON team_tool_access;

CREATE POLICY "Team owners and admins can create tool access"
  ON team_tool_access FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tool_access.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can update tool access"
  ON team_tool_access FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tool_access.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tool_access.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can delete tool access"
  ON team_tool_access FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tool_access.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND team_members.joined_at IS NOT NULL
    )
  );

-- =====================================================
-- user_api_keys: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own API keys" ON user_api_keys;

CREATE POLICY "Users can create own API keys"
  ON user_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON user_api_keys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON user_api_keys FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
