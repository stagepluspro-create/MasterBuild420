/*
  # Replace ALL Policies with Granular CRUD Policies

  ## Overview
  This migration replaces broad "ALL" policies with specific SELECT, INSERT,
  UPDATE, and DELETE policies for better security control and auditability.

  ## Tables Updated
  - cable_labels
  - dmx_fixtures
  - dmx_groups
  - dmx_universes
  - monitor_mixes
  - patchlist_categories
  - patchlist_channels
  - patchlist_versions
  - routing_flows
  - stage_plot_props
  - power_plan_devices (already has 2 ALL policies)
  - tasks (already has 2 ALL policies)

  ## Benefits
  - Better audit trail of specific operations
  - More precise permission control
  - Easier to debug permission issues
  - Follows PostgreSQL best practices
*/

-- =====================================================
-- cable_labels: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage cable labels" ON cable_labels;

CREATE POLICY "Users can view cable labels"
  ON cable_labels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = cable_labels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create cable labels"
  ON cable_labels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = cable_labels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cable labels"
  ON cable_labels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = cable_labels.patchlist_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = cable_labels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cable labels"
  ON cable_labels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = cable_labels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- dmx_fixtures: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage fixtures" ON dmx_fixtures;

CREATE POLICY "Users can view fixtures"
  ON dmx_fixtures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_fixtures.patch_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create fixtures"
  ON dmx_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_fixtures.patch_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fixtures"
  ON dmx_fixtures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_fixtures.patch_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_fixtures.patch_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fixtures"
  ON dmx_fixtures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_fixtures.patch_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- dmx_groups: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage groups" ON dmx_groups;

CREATE POLICY "Users can view groups"
  ON dmx_groups FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create groups"
  ON dmx_groups FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update groups"
  ON dmx_groups FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete groups"
  ON dmx_groups FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- dmx_universes: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage universes" ON dmx_universes;

CREATE POLICY "Users can view universes"
  ON dmx_universes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_universes.patch_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create universes"
  ON dmx_universes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_universes.patch_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update universes"
  ON dmx_universes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_universes.patch_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_universes.patch_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete universes"
  ON dmx_universes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_universes.patch_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- monitor_mixes: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage monitor mixes" ON monitor_mixes;

CREATE POLICY "Users can view monitor mixes"
  ON monitor_mixes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = monitor_mixes.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create monitor mixes"
  ON monitor_mixes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = monitor_mixes.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update monitor mixes"
  ON monitor_mixes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = monitor_mixes.patchlist_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = monitor_mixes.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete monitor mixes"
  ON monitor_mixes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = monitor_mixes.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- patchlist_categories: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage patchlist categories" ON patchlist_categories;

CREATE POLICY "Users can view patchlist categories"
  ON patchlist_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_categories.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create patchlist categories"
  ON patchlist_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_categories.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update patchlist categories"
  ON patchlist_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_categories.patchlist_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_categories.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patchlist categories"
  ON patchlist_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_categories.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- patchlist_channels: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage patchlist channels" ON patchlist_channels;

CREATE POLICY "Users can view patchlist channels"
  ON patchlist_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_channels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create patchlist channels"
  ON patchlist_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_channels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update patchlist channels"
  ON patchlist_channels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_channels.patchlist_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_channels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patchlist channels"
  ON patchlist_channels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_channels.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- patchlist_versions: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage patchlist versions" ON patchlist_versions;

CREATE POLICY "Users can view patchlist versions"
  ON patchlist_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_versions.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create patchlist versions"
  ON patchlist_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_versions.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update patchlist versions"
  ON patchlist_versions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_versions.patchlist_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_versions.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patchlist versions"
  ON patchlist_versions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_versions.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- routing_flows: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage routing flows" ON routing_flows;

CREATE POLICY "Users can view routing flows"
  ON routing_flows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = routing_flows.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create routing flows"
  ON routing_flows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = routing_flows.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update routing flows"
  ON routing_flows FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = routing_flows.patchlist_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = routing_flows.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete routing flows"
  ON routing_flows FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = routing_flows.patchlist_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- stage_plot_props: Replace ALL with specific policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage custom props" ON stage_plot_props;

CREATE POLICY "Users can view custom props"
  ON stage_plot_props FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create custom props"
  ON stage_plot_props FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update custom props"
  ON stage_plot_props FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete custom props"
  ON stage_plot_props FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- power_plan_devices: Replace ALL policies with specific ones
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own power plan devices" ON power_plan_devices;
DROP POLICY IF EXISTS "Team members can manage team power plan devices" ON power_plan_devices;

-- User-owned devices
CREATE POLICY "Users can view own power plan devices"
  ON power_plan_devices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      WHERE pp.id = power_plan_devices.power_plan_id
      AND pp.user_id = auth.uid()
      AND pp.team_id IS NULL
    )
  );

CREATE POLICY "Users can create own power plan devices"
  ON power_plan_devices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM power_plans pp
      WHERE pp.id = power_plan_devices.power_plan_id
      AND pp.user_id = auth.uid()
      AND pp.team_id IS NULL
    )
  );

CREATE POLICY "Users can update own power plan devices"
  ON power_plan_devices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      WHERE pp.id = power_plan_devices.power_plan_id
      AND pp.user_id = auth.uid()
      AND pp.team_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM power_plans pp
      WHERE pp.id = power_plan_devices.power_plan_id
      AND pp.user_id = auth.uid()
      AND pp.team_id IS NULL
    )
  );

CREATE POLICY "Users can delete own power plan devices"
  ON power_plan_devices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      WHERE pp.id = power_plan_devices.power_plan_id
      AND pp.user_id = auth.uid()
      AND pp.team_id IS NULL
    )
  );

-- Team-owned devices
CREATE POLICY "Team members can view team power plan devices"
  ON power_plan_devices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_devices.power_plan_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team members can create team power plan devices"
  ON power_plan_devices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM power_plans pp
      JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_devices.power_plan_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team members can update team power plan devices"
  ON power_plan_devices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_devices.power_plan_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM power_plans pp
      JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_devices.power_plan_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team members can delete team power plan devices"
  ON power_plan_devices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_devices.power_plan_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  );

-- =====================================================
-- tasks: Replace ALL policies with specific ones
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own standalone tasks" ON tasks;
DROP POLICY IF EXISTS "Team members can manage project tasks" ON tasks;

-- Standalone tasks
CREATE POLICY "Users can view own standalone tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (project_id IS NULL AND created_by = auth.uid());

CREATE POLICY "Users can create own standalone tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (project_id IS NULL AND created_by = auth.uid());

CREATE POLICY "Users can update own standalone tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (project_id IS NULL AND created_by = auth.uid())
  WITH CHECK (project_id IS NULL AND created_by = auth.uid());

CREATE POLICY "Users can delete own standalone tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (project_id IS NULL AND created_by = auth.uid());

-- Project tasks
CREATE POLICY "Team members can view project tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = tasks.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can create project tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = tasks.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can update project tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = tasks.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  )
  WITH CHECK (
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = tasks.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can delete project tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = tasks.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );
