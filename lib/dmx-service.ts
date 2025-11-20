import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export interface DMXPatch {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  show_name?: string;
  venue?: string;
  universe_count: number;
  notes?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface DMXUniverse {
  id: string;
  patch_id: string;
  universe_number: number;
  name?: string;
  protocol: "DMX512" | "Art-Net" | "sACN";
  node_address?: string;
  notes?: string;
  created_at: string;
}

export interface DMXFixture {
  id: string;
  patch_id: string;
  universe_id: string;
  fixture_id?: string;
  fixture_name: string;
  fixture_type?: string;
  universe: number;
  start_address: number;
  end_address: number;
  channel_count: number;
  mode_name?: string;
  dmx_mode_id?: string;
  group_name?: string;
  group_color?: string;
  quantity: number;
  unit_number: number;
  notes?: string;
  power_w?: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DMXGroup {
  id: string;
  user_id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
}

export interface UniverseUsage {
  total_channels: number;
  used_channels: number;
  available_channels: number;
  fixture_count: number;
  usage_percent: number;
}

export interface AddressOverlap {
  fixture_id: string;
  fixture_name: string;
  start_address: number;
  end_address: number;
}

export const dmxService = {
  async createPatch(data: {
    user_id: string;
    name: string;
    show_name?: string;
    venue?: string;
    project_id?: string;
  }): Promise<DMXPatch> {
    const { data: patch, error } = await supabase
      .from("dmx_patches")
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("dmx_universes").insert({
      patch_id: patch.id,
      universe_number: 1,
      name: "Universe 1",
      protocol: "DMX512",
    });

    return patch;
  },

  async getPatches(userId: string): Promise<DMXPatch[]> {
    const { data, error } = await supabase
      .from("dmx_patches")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPatchById(patchId: string): Promise<DMXPatch | null> {
    const { data, error } = await supabase
      .from("dmx_patches")
      .select("*")
      .eq("id", patchId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updatePatch(
    patchId: string,
    updates: Partial<DMXPatch>
  ): Promise<DMXPatch> {
    const { data, error } = await supabase
      .from("dmx_patches")
      .update(updates)
      .eq("id", patchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePatch(patchId: string): Promise<void> {
    const { error } = await supabase
      .from("dmx_patches")
      .delete()
      .eq("id", patchId);

    if (error) throw error;
  },

  async getUniverses(patchId: string): Promise<DMXUniverse[]> {
    const { data, error } = await supabase
      .from("dmx_universes")
      .select("*")
      .eq("patch_id", patchId)
      .order("universe_number", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createUniverse(data: {
    patch_id: string;
    universe_number: number;
    name?: string;
    protocol?: "DMX512" | "Art-Net" | "sACN";
  }): Promise<DMXUniverse> {
    const { data: universe, error } = await supabase
      .from("dmx_universes")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return universe;
  },

  async updateUniverse(
    universeId: string,
    updates: Partial<DMXUniverse>
  ): Promise<DMXUniverse> {
    const { data, error } = await supabase
      .from("dmx_universes")
      .update(updates)
      .eq("id", universeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUniverse(universeId: string): Promise<void> {
    const { error } = await supabase
      .from("dmx_universes")
      .delete()
      .eq("id", universeId);

    if (error) throw error;
  },

  async getFixtures(patchId: string): Promise<DMXFixture[]> {
    const { data, error } = await supabase
      .from("dmx_fixtures")
      .select("*")
      .eq("patch_id", patchId)
      .order("universe", { ascending: true })
      .order("start_address", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getFixturesByUniverse(
    patchId: string,
    universeNumber: number
  ): Promise<DMXFixture[]> {
    const { data, error } = await supabase
      .from("dmx_fixtures")
      .select("*")
      .eq("patch_id", patchId)
      .eq("universe", universeNumber)
      .order("start_address", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createFixture(data: Omit<DMXFixture, "id" | "created_at" | "updated_at">): Promise<DMXFixture> {
    const { data: fixture, error } = await supabase
      .from("dmx_fixtures")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return fixture;
  },

  async createFixtures(fixtures: Omit<DMXFixture, "id" | "created_at" | "updated_at">[]): Promise<DMXFixture[]> {
    const { data, error } = await supabase
      .from("dmx_fixtures")
      .insert(fixtures)
      .select();

    if (error) throw error;
    return data || [];
  },

  async updateFixture(
    fixtureId: string,
    updates: Partial<DMXFixture>
  ): Promise<DMXFixture> {
    const { data, error } = await supabase
      .from("dmx_fixtures")
      .update(updates)
      .eq("id", fixtureId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFixture(fixtureId: string): Promise<void> {
    const { error } = await supabase
      .from("dmx_fixtures")
      .delete()
      .eq("id", fixtureId);

    if (error) throw error;
  },

  async deleteFixtures(fixtureIds: string[]): Promise<void> {
    const { error } = await supabase
      .from("dmx_fixtures")
      .delete()
      .in("id", fixtureIds);

    if (error) throw error;
  },

  async checkAddressOverlap(
    patchId: string,
    universe: number,
    startAddress: number,
    endAddress: number,
    excludeFixtureId?: string
  ): Promise<AddressOverlap[]> {
    const { data, error } = await supabase.rpc("check_dmx_address_overlap", {
      p_patch_id: patchId,
      p_universe: universe,
      p_start_address: startAddress,
      p_end_address: endAddress,
      p_exclude_fixture_id: excludeFixtureId || null,
    });

    if (error) throw error;
    return data || [];
  },

  async getUniverseUsage(
    patchId: string,
    universeNumber: number
  ): Promise<UniverseUsage> {
    const { data, error } = await supabase.rpc("get_universe_usage", {
      p_patch_id: patchId,
      p_universe_number: universeNumber,
    });

    if (error) throw error;
    return data?.[0] || {
      total_channels: 512,
      used_channels: 0,
      available_channels: 512,
      fixture_count: 0,
      usage_percent: 0,
    };
  },

  async getGroups(userId: string): Promise<DMXGroup[]> {
    const { data, error } = await supabase
      .from("dmx_groups")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createGroup(data: {
    user_id: string;
    name: string;
    color?: string;
    description?: string;
  }): Promise<DMXGroup> {
    const { data: group, error } = await supabase
      .from("dmx_groups")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return group;
  },

  async updateGroup(
    groupId: string,
    updates: Partial<DMXGroup>
  ): Promise<DMXGroup> {
    const { data, error } = await supabase
      .from("dmx_groups")
      .update(updates)
      .eq("id", groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from("dmx_groups")
      .delete()
      .eq("id", groupId);

    if (error) throw error;
  },

  async createVersion(
    patchId: string,
    userId: string,
    changeSummary: string
  ): Promise<void> {
    const patch = await this.getPatchById(patchId);
    const fixtures = await this.getFixtures(patchId);
    const universes = await this.getUniverses(patchId);

    const { error } = await supabase.from("dmx_patch_versions").insert({
      patch_id: patchId,
      version_number: patch?.version || 1,
      user_id: userId,
      change_summary: changeSummary,
      snapshot_data: {
        patch,
        fixtures,
        universes,
      },
    });

    if (error) throw error;
  },

  calculateNextAvailableAddress(
    fixtures: DMXFixture[],
    universe: number
  ): number {
    const universeFixtures = fixtures.filter((f) => f.universe === universe);
    if (universeFixtures.length === 0) return 1;

    const sortedFixtures = [...universeFixtures].sort(
      (a, b) => a.start_address - b.start_address
    );

    for (let i = 0; i < sortedFixtures.length - 1; i++) {
      const current = sortedFixtures[i];
      const next = sortedFixtures[i + 1];
      const gapStart = current.end_address + 1;
      const gapEnd = next.start_address - 1;

      if (gapEnd >= gapStart) {
        return gapStart;
      }
    }

    const lastFixture = sortedFixtures[sortedFixtures.length - 1];
    const nextAddress = lastFixture.end_address + 1;

    return nextAddress <= 512 ? nextAddress : 1;
  },

  validateAddress(
    startAddress: number,
    channelCount: number
  ): { valid: boolean; error?: string } {
    if (startAddress < 1 || startAddress > 512) {
      return { valid: false, error: "Start address must be between 1 and 512" };
    }

    const endAddress = startAddress + channelCount - 1;
    if (endAddress > 512) {
      return {
        valid: false,
        error: `Fixture exceeds universe capacity (end address: ${endAddress})`,
      };
    }

    return { valid: true };
  },
};
