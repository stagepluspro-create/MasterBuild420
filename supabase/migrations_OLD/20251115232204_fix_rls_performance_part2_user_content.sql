/*
  # Fix RLS Performance Issues - Part 2: User Content Tables

  1. Tables Updated
    - stage_plot_props
    - subscription_changes
    - patchlists (consolidate duplicate policies)
    - patchlist_channels
    - patchlist_categories
    - patchlist_versions
    - console_presets
    - routing_flows
    - monitor_mixes
    - cable_labels

  2. Changes
    - Wrap all auth.uid() calls with (select auth.uid())
    - Remove duplicate policies
    - Consolidate similar policies
*/

-- =====================================================
-- STAGE PLOT PROPS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own custom props" ON stage_plot_props;
CREATE POLICY "Users can manage custom props" ON stage_plot_props
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own custom props" ON stage_plot_props;

-- =====================================================
-- SUBSCRIPTION CHANGES
-- =====================================================

DROP POLICY IF EXISTS "Users can create subscription changes" ON subscription_changes;
CREATE POLICY "Users can create subscription changes" ON subscription_changes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own subscription changes" ON subscription_changes;
CREATE POLICY "Users can view subscription changes" ON subscription_changes
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PATCHLISTS (Remove duplicates)
-- =====================================================

DROP POLICY IF EXISTS "Users can create own patchlists" ON patchlists;
DROP POLICY IF EXISTS "Users can create patchlists" ON patchlists;
CREATE POLICY "Users can create patchlists" ON patchlists
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own patchlists" ON patchlists;
DROP POLICY IF EXISTS "Users can delete their patchlists" ON patchlists;
CREATE POLICY "Users can delete patchlists" ON patchlists
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own patchlists" ON patchlists;
DROP POLICY IF EXISTS "Users can update their patchlists" ON patchlists;
CREATE POLICY "Users can update patchlists" ON patchlists
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own patchlists" ON patchlists;
DROP POLICY IF EXISTS "Users can view their patchlists" ON patchlists;
CREATE POLICY "Users can view patchlists" ON patchlists
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PATCHLIST CHANNELS
-- =====================================================

DROP POLICY IF EXISTS "Users can create channels in own patchlists" ON patchlist_channels;
DROP POLICY IF EXISTS "Users can delete channels in own patchlists" ON patchlist_channels;
DROP POLICY IF EXISTS "Users can update channels in own patchlists" ON patchlist_channels;
DROP POLICY IF EXISTS "Users can view channels of own patchlists" ON patchlist_channels;
DROP POLICY IF EXISTS "Users can manage patchlist channels" ON patchlist_channels;

CREATE POLICY "Users can manage patchlist channels" ON patchlist_channels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_channels.patchlist_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PATCHLIST CATEGORIES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage categories in own patchlists" ON patchlist_categories;
DROP POLICY IF EXISTS "Users can manage patchlist categories" ON patchlist_categories;

CREATE POLICY "Users can manage patchlist categories" ON patchlist_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_categories.patchlist_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PATCHLIST VERSIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can create patchlist versions" ON patchlist_versions;
DROP POLICY IF EXISTS "Users can manage versions of own patchlists" ON patchlist_versions;
DROP POLICY IF EXISTS "Users can view patchlist versions" ON patchlist_versions;

CREATE POLICY "Users can manage patchlist versions" ON patchlist_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = patchlist_versions.patchlist_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- CONSOLE PRESETS
-- =====================================================

DROP POLICY IF EXISTS "Users can create own console presets" ON console_presets;
CREATE POLICY "Users can create console presets" ON console_presets
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own console presets" ON console_presets;
CREATE POLICY "Users can delete console presets" ON console_presets
  FOR DELETE TO authenticated
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own console presets" ON console_presets;
CREATE POLICY "Users can update console presets" ON console_presets
  FOR UPDATE TO authenticated
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view all public console presets" ON console_presets;
CREATE POLICY "Users can view public console presets" ON console_presets
  FOR SELECT TO authenticated
  USING (is_public = true OR created_by = (select auth.uid()));

-- =====================================================
-- ROUTING FLOWS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage routing flows in own patchlists" ON routing_flows;
CREATE POLICY "Users can manage routing flows" ON routing_flows
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = routing_flows.patchlist_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- MONITOR MIXES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage monitor mixes" ON monitor_mixes;
DROP POLICY IF EXISTS "Users can manage monitor mixes in own patchlists" ON monitor_mixes;

CREATE POLICY "Users can manage monitor mixes" ON monitor_mixes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = monitor_mixes.patchlist_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- CABLE LABELS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage cable labels in own patchlists" ON cable_labels;
CREATE POLICY "Users can manage cable labels" ON cable_labels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patchlists p
      WHERE p.id = cable_labels.patchlist_id
      AND p.user_id = (select auth.uid())
    )
  );
