import { createClient } from "@/lib/supabase-browser";
import type { VenueConfig, HazeMachine, HVACVent, LightFixture, SimulationResult } from './types';

// Create client inside functions to avoid SSR issues
const getSupabase = () => createClient();

export interface DBVenue {
  id: string;
  user_id: string;
  team_id?: string;
  project_id?: string;
  name: string;
  description?: string;
  width_m: number;
  length_m: number;
  height_m: number;
  grid_resolution: number;
  obstacles: any;
  temperature_c: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBSimulation {
  id: string;
  venue_id: string;
  user_id: string;
  name: string;
  simulation_params: any;
  results: any;
  time_to_fill_sec?: number;
  time_to_clear_sec?: number;
  coverage_score?: number;
  uniformity_score?: number;
  safety_warnings: any;
  optimal_placement?: any;
  created_at: string;
}

export const hazeService = {
  async createVenue(venue: Partial<DBVenue>): Promise<DBVenue> {
    const { data, error } = await getSupabase()
      .from('haze_venues')
      .insert(venue)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getVenues(userId: string): Promise<DBVenue[]> {
    const { data, error } = await getSupabase()
      .from('haze_venues')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getVenue(venueId: string): Promise<DBVenue | null> {
    const { data, error } = await getSupabase()
      .from('haze_venues')
      .select('*')
      .eq('id', venueId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateVenue(venueId: string, updates: Partial<DBVenue>): Promise<DBVenue> {
    const { data, error } = await getSupabase()
      .from('haze_venues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', venueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteVenue(venueId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('haze_venues')
      .delete()
      .eq('id', venueId);

    if (error) throw error;
  },

  async getMachines(venueId: string): Promise<any[]> {
    const { data, error } = await getSupabase()
      .from('haze_machines')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return data || [];
  },

  async createMachine(machine: any): Promise<any> {
    const { data, error } = await getSupabase()
      .from('haze_machines')
      .insert(machine)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMachine(machineId: string, updates: any): Promise<any> {
    const { data, error } = await getSupabase()
      .from('haze_machines')
      .update(updates)
      .eq('id', machineId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMachine(machineId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('haze_machines')
      .delete()
      .eq('id', machineId);

    if (error) throw error;
  },

  async getVents(venueId: string): Promise<any[]> {
    const { data, error } = await getSupabase()
      .from('haze_hvac_vents')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return data || [];
  },

  async createVent(vent: any): Promise<any> {
    const { data, error } = await getSupabase()
      .from('haze_hvac_vents')
      .insert(vent)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVent(ventId: string, updates: any): Promise<any> {
    const { data, error } = await getSupabase()
      .from('haze_hvac_vents')
      .update(updates)
      .eq('id', ventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteVent(ventId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('haze_hvac_vents')
      .delete()
      .eq('id', ventId);

    if (error) throw error;
  },

  async getFixtures(venueId: string): Promise<any[]> {
    const { data, error } = await getSupabase()
      .from('haze_fixtures')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return data || [];
  },

  async createFixture(fixture: any): Promise<any> {
    const { data, error } = await getSupabase()
      .from('haze_fixtures')
      .insert(fixture)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFixture(fixtureId: string, updates: any): Promise<any> {
    const { data, error } = await getSupabase()
      .from('haze_fixtures')
      .update(updates)
      .eq('id', fixtureId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFixture(fixtureId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('haze_fixtures')
      .delete()
      .eq('id', fixtureId);

    if (error) throw error;
  },

  async saveSimulation(simulation: Partial<DBSimulation>): Promise<DBSimulation> {
    const { data, error } = await getSupabase()
      .from('haze_simulations')
      .insert(simulation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSimulations(venueId: string): Promise<DBSimulation[]> {
    const { data, error } = await getSupabase()
      .from('haze_simulations')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
