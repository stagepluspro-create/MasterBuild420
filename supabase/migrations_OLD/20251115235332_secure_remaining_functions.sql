/*
  # Secure Remaining Functions
  
  Adds search_path to functions that don't have it
*/

-- Secure the 5-parameter version of check_dmx_address_overlap
DROP FUNCTION IF EXISTS check_dmx_address_overlap(uuid, integer, integer, integer, uuid) CASCADE;
CREATE FUNCTION check_dmx_address_overlap(
  p_patch_id uuid,
  p_universe integer,
  p_start_address integer,
  p_end_address integer,
  p_exclude_fixture_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  overlap_count integer;
BEGIN
  SELECT COUNT(*) INTO overlap_count
  FROM dmx_fixtures df
  WHERE df.patch_id = p_patch_id
    AND df.universe = p_universe
    AND df.id != COALESCE(p_exclude_fixture_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND df.start_address < p_end_address
    AND (df.start_address + df.channel_count) > p_start_address;
  
  RETURN overlap_count > 0;
END;
$$;

-- Secure the 2-parameter version of get_universe_usage
DROP FUNCTION IF EXISTS get_universe_usage(uuid, integer) CASCADE;
CREATE FUNCTION get_universe_usage(
  p_patch_id uuid,
  p_universe_number integer
)
RETURNS TABLE (
  universe_number integer,
  used_channels integer,
  available_channels integer,
  utilization_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_universe_number as universe_number,
    COALESCE(SUM(df.channel_count), 0)::integer as used_channels,
    512 - COALESCE(SUM(df.channel_count), 0)::integer as available_channels,
    ROUND((COALESCE(SUM(df.channel_count), 0) / 512.0) * 100, 2) as utilization_percent
  FROM dmx_fixtures df
  WHERE df.patch_id = p_patch_id
    AND df.universe = p_universe_number
  GROUP BY p_universe_number;
END;
$$;

-- Update is_team_member to add pg_temp
DROP FUNCTION IF EXISTS is_team_member(uuid, uuid) CASCADE;
CREATE FUNCTION is_team_member(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_members 
    WHERE team_id = p_team_id 
      AND user_id = p_user_id 
      AND joined_at IS NOT NULL
  );
END;
$$;

-- Update is_team_owner to add pg_temp
DROP FUNCTION IF EXISTS is_team_owner(uuid, uuid) CASCADE;
CREATE FUNCTION is_team_owner(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM teams 
    WHERE id = p_team_id 
      AND owner_user_id = p_user_id
  );
END;
$$;