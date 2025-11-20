import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export interface Patchlist {
  id: string;
  user_id: string;
  project_id?: string | null;
  name: string;
  description?: string | null;
  show_name?: string | null;
  venue?: string | null;
  date?: string | null;
  engineer_name?: string | null;
  console_type?: string | null;
  console_config?: any;
  version: number;
  is_template: boolean;
  template_category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatchlistChannel {
  id: string;
  patchlist_id: string;
  channel_number: string;
  source_name: string;
  category: string;
  signal_type: "audio" | "video" | "lighting" | "data";
  input_type?: string | null;
  physical_location?: string | null;
  snake_input?: string | null;
  console_channel?: string | null;
  destination?: string | null;
  monitor_sends?: string[];
  notes?: string | null;
  color?: string | null;
  sort_order: number;
  stage_plot_prop_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatchlistCategory {
  id: string;
  patchlist_id: string;
  name: string;
  color: string;
  sort_order: number;
  is_collapsed: boolean;
  start_channel?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface ConsolePreset {
  id: string;
  name: string;
  manufacturer: string;
  total_inputs: number;
  total_outputs: number;
  aux_sends: number;
  config_data?: any;
  is_public: boolean;
}

export interface MonitorMix {
  id: string;
  patchlist_id: string;
  mix_name: string;
  mix_number: number;
  assigned_to?: string | null;
  physical_location?: string | null;
  channel_assignments: any;
  notes?: string | null;
  sort_order: number;
}

export const patchlistService = {
  async createPatchlist(data: Partial<Patchlist>) {
    const { data: patchlist, error } = await supabase
      .from("patchlists")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return patchlist;
  },

  async getPatchlists(userId: string) {
    const { data, error } = await supabase
      .from("patchlists")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPatchlist(patchlistId: string) {
    const { data, error } = await supabase
      .from("patchlists")
      .select("*")
      .eq("id", patchlistId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updatePatchlist(patchlistId: string, updates: Partial<Patchlist>) {
    const { data, error } = await supabase
      .from("patchlists")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", patchlistId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePatchlist(patchlistId: string) {
    const { error } = await supabase
      .from("patchlists")
      .delete()
      .eq("id", patchlistId);

    if (error) throw error;
  },

  async getChannels(patchlistId: string) {
    const { data, error } = await supabase
      .from("patchlist_channels")
      .select("*")
      .eq("patchlist_id", patchlistId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createChannel(data: Partial<PatchlistChannel>) {
    const { data: channel, error } = await supabase
      .from("patchlist_channels")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return channel;
  },

  async updateChannel(channelId: string, updates: Partial<PatchlistChannel>) {
    const { data, error } = await supabase
      .from("patchlist_channels")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", channelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteChannel(channelId: string) {
    const { error } = await supabase
      .from("patchlist_channels")
      .delete()
      .eq("id", channelId);

    if (error) throw error;
  },

  async bulkCreateChannels(channels: Partial<PatchlistChannel>[]) {
    const { data, error } = await supabase
      .from("patchlist_channels")
      .insert(channels)
      .select();

    if (error) throw error;
    return data || [];
  },

  async bulkDeleteChannels(channelIds: string[]) {
    const { error } = await supabase
      .from("patchlist_channels")
      .delete()
      .in("id", channelIds);

    if (error) throw error;
  },

  async getCategories(patchlistId: string) {
    const { data, error } = await supabase
      .from("patchlist_categories")
      .select("*")
      .eq("patchlist_id", patchlistId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createCategory(data: Partial<PatchlistCategory>) {
    const { data: category, error } = await supabase
      .from("patchlist_categories")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return category;
  },

  async updateCategory(categoryId: string, updates: Partial<PatchlistCategory>) {
    const { data, error } = await supabase
      .from("patchlist_categories")
      .update(updates)
      .eq("id", categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(categoryId: string) {
    const { error } = await supabase
      .from("patchlist_categories")
      .delete()
      .eq("id", categoryId);

    if (error) throw error;
  },

  async getConsolePresets() {
    const { data, error } = await supabase
      .from("console_presets")
      .select("*")
      .eq("is_public", true)
      .order("manufacturer", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getMonitorMixes(patchlistId: string) {
    const { data, error } = await supabase
      .from("monitor_mixes")
      .select("*")
      .eq("patchlist_id", patchlistId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createMonitorMix(data: Partial<MonitorMix>) {
    const { data: mix, error } = await supabase
      .from("monitor_mixes")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return mix;
  },

  async updateMonitorMix(mixId: string, updates: Partial<MonitorMix>) {
    const { data, error } = await supabase
      .from("monitor_mixes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", mixId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMonitorMix(mixId: string) {
    const { error } = await supabase
      .from("monitor_mixes")
      .delete()
      .eq("id", mixId);

    if (error) throw error;
  },

  async createVersion(patchlistId: string, userId: string, changeSummary?: string) {
    const patchlist = await this.getPatchlist(patchlistId);
    const channels = await this.getChannels(patchlistId);
    const categories = await this.getCategories(patchlistId);

    const snapshot = {
      patchlist,
      channels,
      categories,
    };

    const { data, error } = await supabase
      .from("patchlist_versions")
      .insert({
        patchlist_id: patchlistId,
        version_number: patchlist.version,
        snapshot_data: snapshot,
        change_summary: changeSummary,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getVersions(patchlistId: string) {
    const { data, error } = await supabase
      .from("patchlist_versions")
      .select("*")
      .eq("patchlist_id", patchlistId)
      .order("version_number", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
