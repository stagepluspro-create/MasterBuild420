/*
  # Fix RLS Performance Issues - Part 3: Power Plans

  1. Tables Updated
    - power_plans
    - power_plan_devices
    - power_plan_versions

  2. Changes
    - Wrap all auth.uid() calls with (select auth.uid())
    - Remove duplicate policies
    - Fix column name (power_plan_id not plan_id)
*/

-- =====================================================
-- POWER PLANS
-- =====================================================

DROP POLICY IF EXISTS "Team admins can update team power plans" ON power_plans;
CREATE POLICY "Team admins can update team power plans" ON power_plans
  FOR UPDATE TO authenticated
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = power_plans.team_id
      AND tm.user_id = (select auth.uid())
      AND tm.role IN ('owner', 'admin')
      AND tm.joined_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Team members can view team power plans" ON power_plans;
CREATE POLICY "Team members can view team power plans" ON power_plans
  FOR SELECT TO authenticated
  USING (
    (team_id IS NULL AND user_id = (select auth.uid()))
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = power_plans.team_id
        AND tm.user_id = (select auth.uid())
        AND tm.joined_at IS NOT NULL
      )
    )
  );

DROP POLICY IF EXISTS "Team owners can delete team power plans" ON power_plans;
CREATE POLICY "Team owners can delete team power plans" ON power_plans
  FOR DELETE TO authenticated
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = power_plans.team_id
      AND t.owner_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own power plans" ON power_plans;
CREATE POLICY "Users can create power plans" ON power_plans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own power plans" ON power_plans;
CREATE POLICY "Users can delete power plans" ON power_plans
  FOR DELETE TO authenticated
  USING (team_id IS NULL AND user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own power plans" ON power_plans;
CREATE POLICY "Users can update power plans" ON power_plans
  FOR UPDATE TO authenticated
  USING (team_id IS NULL AND user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own power plans" ON power_plans;

-- =====================================================
-- POWER PLAN DEVICES
-- =====================================================

DROP POLICY IF EXISTS "Team members can manage devices in team power plans" ON power_plan_devices;
CREATE POLICY "Team members can manage team power plan devices" ON power_plan_devices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_devices.power_plan_id
      AND tm.user_id = (select auth.uid())
      AND tm.joined_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can manage devices in own power plans" ON power_plan_devices;
CREATE POLICY "Users can manage own power plan devices" ON power_plan_devices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      WHERE pp.id = power_plan_devices.power_plan_id
      AND pp.user_id = (select auth.uid())
      AND pp.team_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can view devices in accessible power plans" ON power_plan_devices;

-- =====================================================
-- POWER PLAN VERSIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can create versions for editable power plans" ON power_plan_versions;
CREATE POLICY "Users can create power plan versions" ON power_plan_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM power_plans pp
      LEFT JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_versions.power_plan_id
      AND (
        (pp.team_id IS NULL AND pp.user_id = (select auth.uid()))
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can view versions of accessible power plans" ON power_plan_versions;
CREATE POLICY "Users can view power plan versions" ON power_plan_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM power_plans pp
      LEFT JOIN team_members tm ON pp.team_id = tm.team_id
      WHERE pp.id = power_plan_versions.power_plan_id
      AND (
        (pp.team_id IS NULL AND pp.user_id = (select auth.uid()))
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );
