/*
  # Fix RLS Performance Issues - Part 4: SPL Meter

  1. Tables Updated
    - spl_sessions
    - spl_measurements
    - spl_calibrations

  2. Changes
    - Wrap all auth.uid() calls with (select auth.uid())
    - Remove duplicate policies
*/

-- =====================================================
-- SPL SESSIONS
-- =====================================================

DROP POLICY IF EXISTS "Team members can view project sessions" ON spl_sessions;
CREATE POLICY "Team members can view project sessions" ON spl_sessions
  FOR SELECT TO authenticated
  USING (
    (project_id IS NULL AND user_id = (select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = spl_sessions.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can create own sessions" ON spl_sessions;
CREATE POLICY "Users can create sessions" ON spl_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sessions" ON spl_sessions;
CREATE POLICY "Users can delete sessions" ON spl_sessions
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own sessions" ON spl_sessions;
CREATE POLICY "Users can update sessions" ON spl_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own sessions" ON spl_sessions;

-- =====================================================
-- SPL MEASUREMENTS
-- =====================================================

DROP POLICY IF EXISTS "Team members can view project measurements" ON spl_measurements;
CREATE POLICY "Team members can view project measurements" ON spl_measurements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spl_sessions s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE s.id = spl_measurements.session_id
      AND (
        s.user_id = (select auth.uid())
        OR p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can create measurements for own sessions" ON spl_measurements;
CREATE POLICY "Users can create measurements" ON spl_measurements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spl_sessions s
      WHERE s.id = spl_measurements.session_id
      AND s.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own measurements" ON spl_measurements;
CREATE POLICY "Users can delete measurements" ON spl_measurements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spl_sessions s
      WHERE s.id = spl_measurements.session_id
      AND s.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own measurements" ON spl_measurements;

-- =====================================================
-- SPL CALIBRATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can create own calibrations" ON spl_calibrations;
CREATE POLICY "Users can create calibrations" ON spl_calibrations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own calibrations" ON spl_calibrations;
CREATE POLICY "Users can delete calibrations" ON spl_calibrations
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own calibrations" ON spl_calibrations;
CREATE POLICY "Users can update calibrations" ON spl_calibrations
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own calibrations" ON spl_calibrations;
CREATE POLICY "Users can view calibrations" ON spl_calibrations
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
