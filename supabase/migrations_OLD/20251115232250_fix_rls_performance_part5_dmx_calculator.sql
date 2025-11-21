/*
  # Fix RLS Performance Issues - Part 5: DMX Calculator

  1. Tables Updated
    - dmx_patches
    - dmx_universes
    - dmx_fixtures
    - dmx_patch_versions
    - dmx_groups

  2. Changes
    - Wrap all auth.uid() calls with (select auth.uid())
    - Remove duplicate policies
*/

-- =====================================================
-- DMX PATCHES
-- =====================================================

DROP POLICY IF EXISTS "Users can create own patches" ON dmx_patches;
CREATE POLICY "Users can create patches" ON dmx_patches
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own patches" ON dmx_patches;
CREATE POLICY "Users can delete patches" ON dmx_patches
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own patches" ON dmx_patches;
CREATE POLICY "Users can update patches" ON dmx_patches
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own patches" ON dmx_patches;
CREATE POLICY "Users can view patches" ON dmx_patches
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- DMX UNIVERSES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage universes of own patches" ON dmx_universes;
DROP POLICY IF EXISTS "Users can view universes of own patches" ON dmx_universes;

CREATE POLICY "Users can manage universes" ON dmx_universes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_universes.patch_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- DMX FIXTURES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage fixtures of own patches" ON dmx_fixtures;
DROP POLICY IF EXISTS "Users can view fixtures of own patches" ON dmx_fixtures;

CREATE POLICY "Users can manage fixtures" ON dmx_fixtures
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_fixtures.patch_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- DMX PATCH VERSIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can create versions for own patches" ON dmx_patch_versions;
CREATE POLICY "Users can create patch versions" ON dmx_patch_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_patch_versions.patch_id
      AND p.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view versions of own patches" ON dmx_patch_versions;
CREATE POLICY "Users can view patch versions" ON dmx_patch_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_patch_versions.patch_id
      AND p.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- DMX GROUPS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own groups" ON dmx_groups;
DROP POLICY IF EXISTS "Users can view own groups" ON dmx_groups;

CREATE POLICY "Users can manage groups" ON dmx_groups
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()));
