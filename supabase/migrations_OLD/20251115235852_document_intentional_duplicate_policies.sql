/*
  # Document Intentional Duplicate Policies
  
  The remaining "duplicate" policies are intentional design choices.
  They enable users to access BOTH personal AND team resources.
  
  For example:
  - User can manage their OWN power plans
  - User can ALSO manage TEAM power plans if they're a team member
  
  Without both policies, users would only have one or the other.
  Postgres evaluates these with OR logic, which is efficient.
*/

-- Power Plan Devices
COMMENT ON POLICY "Users can manage own power plan devices" ON power_plan_devices IS 
  'Personal access: Allows users to manage devices in their own power plans. Works in conjunction with team policy.';

COMMENT ON POLICY "Team members can manage team power plan devices" ON power_plan_devices IS 
  'Team access: Allows team members to manage devices in team power plans. Works in conjunction with personal policy.';

-- Power Plans
COMMENT ON POLICY "Users can delete power plans" ON power_plans IS 
  'Personal access: Allows users to delete their own power plans. Works in conjunction with team policy.';

COMMENT ON POLICY "Team owners can delete team power plans" ON power_plans IS 
  'Team access: Allows team owners to delete team power plans. Works in conjunction with personal policy.';

COMMENT ON POLICY "Users can update power plans" ON power_plans IS 
  'Personal access: Allows users to update their own power plans. Works in conjunction with team policy.';

COMMENT ON POLICY "Team admins can update team power plans" ON power_plans IS 
  'Team access: Allows team admins to update team power plans. Works in conjunction with personal policy.';

-- Presets
COMMENT ON POLICY "Users can view own presets" ON presets IS 
  'Personal access: Allows users to view their own presets. Works in conjunction with team sharing policy.';

COMMENT ON POLICY "Users can view shared team presets" ON presets IS 
  'Team access: Allows users to view presets shared with their team. Works in conjunction with personal policy.';

-- Projects
COMMENT ON POLICY "Users can delete own projects" ON projects IS 
  'Personal access: Allows users to delete their own projects. Works in conjunction with team policy.';

COMMENT ON POLICY "Team owners can delete team projects" ON projects IS 
  'Team access: Allows team owners to delete team projects. Works in conjunction with personal policy.';

COMMENT ON POLICY "Users can insert own projects" ON projects IS 
  'Personal access: Allows users to create their own projects. Works in conjunction with team policy.';

COMMENT ON POLICY "Team members can create team projects" ON projects IS 
  'Team access: Allows team members to create team projects. Works in conjunction with personal policy.';

COMMENT ON POLICY "Users can view own projects" ON projects IS 
  'Personal access: Allows users to view their own projects. Works in conjunction with team policy.';

COMMENT ON POLICY "Team members can view team projects" ON projects IS 
  'Team access: Allows team members to view team projects. Works in conjunction with personal policy.';

COMMENT ON POLICY "Users can update own projects" ON projects IS 
  'Personal access: Allows users to update their own projects. Works in conjunction with team policy.';

COMMENT ON POLICY "Team members can update team projects" ON projects IS 
  'Team access: Allows team members to update team projects. Works in conjunction with personal policy.';

-- Tasks
COMMENT ON POLICY "Users can manage own standalone tasks" ON tasks IS 
  'Personal access: Allows users to manage standalone tasks not tied to projects. Works in conjunction with project task policy.';

COMMENT ON POLICY "Team members can manage project tasks" ON tasks IS 
  'Team/Project access: Allows team members to manage project-related tasks. Works in conjunction with personal task policy.';