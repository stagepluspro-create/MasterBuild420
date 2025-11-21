/*
  # Basic RLS Policies for All Tables

  ## Overview
  This migration creates basic CRUD policies for all tables to allow users
  to access their own data. Policies are restrictive by default.

  ## Security Principles
  - Users can only access their own data
  - Team members can access team data
  - No public access without authentication
  - All policies use (select auth.uid()) for performance
*/

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- TEAMS POLICIES
-- =====================================================

CREATE POLICY "Users can view teams they own or belong to"
  ON teams FOR SELECT
  TO authenticated
  USING (
    owner_user_id = (select auth.uid())
    OR id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = (select auth.uid()));

CREATE POLICY "Team owners can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (owner_user_id = (select auth.uid()))
  WITH CHECK (owner_user_id = (select auth.uid()));

CREATE POLICY "Team owners can delete their teams"
  ON teams FOR DELETE
  TO authenticated
  USING (owner_user_id = (select auth.uid()));

-- =====================================================
-- TEAM MEMBERS POLICIES
-- =====================================================

CREATE POLICY "Users can view team members in their teams"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (select auth.uid())
    )
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can invite members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (select auth.uid())
    )
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
      AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can update members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (select auth.uid())
    )
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
      AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team owners and admins can remove members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_user_id = (select auth.uid())
    )
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
      AND joined_at IS NOT NULL
    )
  );

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own projects and team projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_user_id = (select auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = (select auth.uid()));

CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_user_id = (select auth.uid()))
  WITH CHECK (owner_user_id = (select auth.uid()));

CREATE POLICY "Project owners can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_user_id = (select auth.uid()));

-- =====================================================
-- PRESETS POLICIES
-- =====================================================

CREATE POLICY "Users can view own presets and shared presets"
  ON presets FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (
      shared_with_team = true
      AND project_id IN (
        SELECT id FROM projects
        WHERE team_id IN (
          SELECT team_id FROM team_members
          WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Users can create presets"
  ON presets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own presets"
  ON presets FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own presets"
  ON presets FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- AUDIT LOG POLICIES
-- =====================================================

CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- INTEREST REQUESTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own interest requests"
  ON interest_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create interest requests"
  ON interest_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own interest requests"
  ON interest_requests FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own interest requests"
  ON interest_requests FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- POWER PLANS POLICIES
-- =====================================================

CREATE POLICY "Users can view own power plans and team plans"
  ON power_plans FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create power plans"
  ON power_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own power plans"
  ON power_plans FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own power plans"
  ON power_plans FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- POWER DEVICES POLICIES
-- =====================================================

CREATE POLICY "Users can view devices in their power plans"
  ON power_devices FOR SELECT
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM power_plans WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create devices in their power plans"
  ON power_devices FOR INSERT
  TO authenticated
  WITH CHECK (
    plan_id IN (
      SELECT id FROM power_plans WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update devices in their power plans"
  ON power_devices FOR UPDATE
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM power_plans WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete devices in their power plans"
  ON power_devices FOR DELETE
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM power_plans WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- DMX PATCHES POLICIES
-- =====================================================

CREATE POLICY "Users can view own dmx patches and team patches"
  ON dmx_patches FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create dmx patches"
  ON dmx_patches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own dmx patches"
  ON dmx_patches FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own dmx patches"
  ON dmx_patches FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- DMX FIXTURES POLICIES
-- =====================================================

CREATE POLICY "Users can view fixtures in their dmx patches"
  ON dmx_fixtures FOR SELECT
  TO authenticated
  USING (
    patch_id IN (
      SELECT id FROM dmx_patches WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create fixtures in their dmx patches"
  ON dmx_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    patch_id IN (
      SELECT id FROM dmx_patches WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update fixtures in their dmx patches"
  ON dmx_fixtures FOR UPDATE
  TO authenticated
  USING (
    patch_id IN (
      SELECT id FROM dmx_patches WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete fixtures in their dmx patches"
  ON dmx_fixtures FOR DELETE
  TO authenticated
  USING (
    patch_id IN (
      SELECT id FROM dmx_patches WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- SPL MEASUREMENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own spl measurements"
  ON spl_measurements FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create spl measurements"
  ON spl_measurements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own spl measurements"
  ON spl_measurements FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own spl measurements"
  ON spl_measurements FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SPL VENUES POLICIES
-- =====================================================

CREATE POLICY "Users can view own spl venues"
  ON spl_venues FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create spl venues"
  ON spl_venues FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own spl venues"
  ON spl_venues FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own spl venues"
  ON spl_venues FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PATCH LISTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own patch lists and team patch lists"
  ON patch_lists FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create patch lists"
  ON patch_lists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own patch lists"
  ON patch_lists FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own patch lists"
  ON patch_lists FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PATCH CHANNELS POLICIES
-- =====================================================

CREATE POLICY "Users can view channels in their patch lists"
  ON patch_channels FOR SELECT
  TO authenticated
  USING (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create channels in their patch lists"
  ON patch_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update channels in their patch lists"
  ON patch_channels FOR UPDATE
  TO authenticated
  USING (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete channels in their patch lists"
  ON patch_channels FOR DELETE
  TO authenticated
  USING (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- MONITOR MIXES POLICIES
-- =====================================================

CREATE POLICY "Users can view mixes in their patch lists"
  ON monitor_mixes FOR SELECT
  TO authenticated
  USING (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create mixes in their patch lists"
  ON monitor_mixes FOR INSERT
  TO authenticated
  WITH CHECK (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update mixes in their patch lists"
  ON monitor_mixes FOR UPDATE
  TO authenticated
  USING (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete mixes in their patch lists"
  ON monitor_mixes FOR DELETE
  TO authenticated
  USING (
    patch_list_id IN (
      SELECT id FROM patch_lists WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- TASKS POLICIES
-- =====================================================

CREATE POLICY "Users can view tasks in their projects"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can create tasks in their projects"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can update tasks in their projects"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can delete tasks in their projects"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PROJECT FILES POLICIES
-- =====================================================

CREATE POLICY "Users can view files in their projects"
  ON project_files FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can upload files to their projects"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (select auth.uid())
    AND (
      project_id IN (
        SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
      )
      OR project_id IN (
        SELECT id FROM projects
        WHERE team_id IN (
          SELECT team_id FROM team_members
          WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Users can delete files they uploaded"
  ON project_files FOR DELETE
  TO authenticated
  USING (uploaded_by = (select auth.uid()));

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

CREATE POLICY "Team members can view team documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team members can create documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (select auth.uid())
    AND team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Document authors can update their documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Document authors can delete their documents"
  ON documents FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- =====================================================
-- INVENTORY ITEMS POLICIES
-- =====================================================

CREATE POLICY "Users can view own inventory and team inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- BUDGET ITEMS POLICIES
-- =====================================================

CREATE POLICY "Users can view budget items in their projects"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR project_id IN (
      SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
    )
    OR project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can create budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- BUDGET SNAPSHOTS POLICIES
-- =====================================================

CREATE POLICY "Users can view snapshots in their projects"
  ON budget_snapshots FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR project_id IN (
      SELECT id FROM projects WHERE owner_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create budget snapshots"
  ON budget_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- ACTIVITY FEED POLICIES
-- =====================================================

CREATE POLICY "Team members can view team activity"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team members can create activity"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );