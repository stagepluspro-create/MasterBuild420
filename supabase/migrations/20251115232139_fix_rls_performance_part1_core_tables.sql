/*
  # Fix RLS Performance Issues - Part 1: Core Tables

  1. Overview
    - Optimizes RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - Prevents re-evaluation of auth functions for each row
    - Improves query performance at scale

  2. Tables Updated
    - teams
    - team_members
    - project_files
    - tasks
    - documents
    - inventory_items
    - budget_items
    - activity_feed

  3. Security
    - All policies maintain existing security logic
    - Only optimization: wrapping auth calls with SELECT
*/

-- =====================================================
-- TEAMS
-- =====================================================

DROP POLICY IF EXISTS "teams_select_policy" ON teams;
CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT TO authenticated
  USING (
    owner_user_id = (select auth.uid())
    OR id IN (
      SELECT team_id FROM team_members
      WHERE user_id = (select auth.uid()) AND joined_at IS NOT NULL
    )
  );

-- =====================================================
-- TEAM MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT TO authenticated
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

-- =====================================================
-- PROJECT FILES
-- =====================================================

DROP POLICY IF EXISTS "Team members can upload project files" ON project_files;
CREATE POLICY "Team members can upload project files" ON project_files
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_files.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Team members can view project files" ON project_files;
CREATE POLICY "Team members can view project files" ON project_files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_files.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

-- =====================================================
-- TASKS
-- =====================================================

DROP POLICY IF EXISTS "Team members can manage project tasks" ON tasks;
CREATE POLICY "Team members can manage project tasks" ON tasks
  FOR ALL TO authenticated
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = tasks.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Team members can view project tasks" ON tasks;
CREATE POLICY "Team members can view project tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = tasks.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage own standalone tasks" ON tasks;
CREATE POLICY "Users can manage own standalone tasks" ON tasks
  FOR ALL TO authenticated
  USING (project_id IS NULL AND created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own standalone tasks" ON tasks;
CREATE POLICY "Users can view own standalone tasks" ON tasks
  FOR SELECT TO authenticated
  USING (project_id IS NULL AND created_by = (select auth.uid()));

-- =====================================================
-- DOCUMENTS
-- =====================================================

DROP POLICY IF EXISTS "Team members can manage project documents" ON documents;
CREATE POLICY "Team members can manage project documents" ON documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = documents.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Team members can view project documents" ON documents;
CREATE POLICY "Team members can view project documents" ON documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = documents.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

-- =====================================================
-- INVENTORY ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Team admins can manage inventory" ON inventory_items;
CREATE POLICY "Team admins can manage inventory" ON inventory_items
  FOR ALL TO authenticated
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = inventory_items.team_id
      AND tm.user_id = (select auth.uid())
      AND tm.role IN ('owner', 'admin')
      AND tm.joined_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Team members can view team inventory" ON inventory_items;
CREATE POLICY "Team members can view team inventory" ON inventory_items
  FOR SELECT TO authenticated
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = inventory_items.team_id
      AND tm.user_id = (select auth.uid())
      AND tm.joined_at IS NOT NULL
    )
  );

-- =====================================================
-- BUDGET ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Team members can manage project budget" ON budget_items;
CREATE POLICY "Team members can manage project budget" ON budget_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = budget_items.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Team members can view project budget" ON budget_items;
CREATE POLICY "Team members can view project budget" ON budget_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = budget_items.project_id
      AND (
        p.owner_user_id = (select auth.uid())
        OR (tm.user_id = (select auth.uid()) AND tm.joined_at IS NOT NULL)
      )
    )
  );

-- =====================================================
-- ACTIVITY FEED
-- =====================================================

DROP POLICY IF EXISTS "Team members can create activity" ON activity_feed;
CREATE POLICY "Team members can create activity" ON activity_feed
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = activity_feed.team_id
      AND tm.user_id = (select auth.uid())
      AND tm.joined_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Team members can view team activity" ON activity_feed;
CREATE POLICY "Team members can view team activity" ON activity_feed
  FOR SELECT TO authenticated
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = activity_feed.team_id
      AND tm.user_id = (select auth.uid())
      AND tm.joined_at IS NOT NULL
    )
  );
