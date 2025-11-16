/*
  # Fix Missing RLS Policies - Security Enhancement

  ## Overview
  This migration adds missing RLS policies to ensure complete CRUD coverage
  for tables that currently have gaps in their security policies.

  ## Changes Made

  ### 1. budget_items Table
  Added policies for:
  - INSERT: Allow team members to create budget items
  - UPDATE: Allow team members to update budget items
  - DELETE: Allow team members to delete budget items

  ### 2. documents Table
  Added policies for:
  - INSERT: Allow team members to upload documents
  - UPDATE: Allow team members to update documents
  - DELETE: Allow team members to delete documents

  ### 3. inventory_items Table
  Added policies for:
  - INSERT: Allow team members to add inventory items
  - UPDATE: Allow team members to update inventory items
  - DELETE: Allow team members to delete inventory items

  ### 4. project_files Table
  Added policies for:
  - UPDATE: Allow team members to update file metadata
  - DELETE: Allow team members to delete files

  ### 5. dmx_patch_versions Table
  Added policies for:
  - UPDATE: Allow users to update version metadata
  - DELETE: Allow users to delete old versions

  ## Security Notes
  - All policies verify authentication using auth.uid()
  - Team-based resources check team membership
  - Policies follow principle of least privilege
  - Consistent with existing policy patterns
*/

-- =====================================================
-- budget_items: Add missing write policies
-- =====================================================

CREATE POLICY "Team members can insert budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = budget_items.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = budget_items.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = budget_items.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = budget_items.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

-- =====================================================
-- documents: Add missing write policies
-- =====================================================

CREATE POLICY "Team members can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = documents.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = documents.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = documents.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = documents.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

-- =====================================================
-- inventory_items: Add missing write policies
-- =====================================================

CREATE POLICY "Team members can add inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = inventory_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team members can update inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = inventory_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  )
  WITH CHECK (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = inventory_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  );

CREATE POLICY "Team members can delete inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = inventory_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.joined_at IS NOT NULL
    )
  );

-- =====================================================
-- project_files: Add missing UPDATE/DELETE policies
-- =====================================================

CREATE POLICY "Team members can update project files"
  ON project_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_files.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_files.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

CREATE POLICY "Team members can delete project files"
  ON project_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_files.project_id
      AND (p.owner_user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.joined_at IS NOT NULL))
    )
  );

-- =====================================================
-- dmx_patch_versions: Add missing UPDATE/DELETE policies
-- =====================================================

CREATE POLICY "Users can update patch versions"
  ON dmx_patch_versions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_patch_versions.patch_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_patch_versions.patch_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patch versions"
  ON dmx_patch_versions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dmx_patches p
      WHERE p.id = dmx_patch_versions.patch_id
      AND p.user_id = auth.uid()
    )
  );
