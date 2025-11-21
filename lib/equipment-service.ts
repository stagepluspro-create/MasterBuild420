import { createClient } from '@/lib/supabase-browser';
import microphonesData from '@/data/microphones_v2.json';
import speakersData from '@/data/speakers_v2.json';
import consolesData from '@/data/consoles_v2.json';
import fixturesData from '@/data/fixtures_v2.json';

export type EquipmentType = 'microphones' | 'speakers' | 'consoles' | 'fixtures';

export interface Microphone {
  id: string;
  manufacturer: string;
  model: string;
  type: string;
  pattern: string;
  frequency_response: string;
  impedance: string;
  sensitivity: string;
  max_spl: string;
  phantom_power: string;
  connector: string;
  applications: string[];
  notes?: string;
}

export interface Speaker {
  id: string;
  manufacturer: string;
  model: string;
  type: string;
  wattage: string;
  impedance: string;
  frequency_range: string;
  spl: string;
  coverage: string;
  weight: string;
  dimensions: string;
  applications: string[];
  notes?: string;
}

export interface Console {
  id: string;
  manufacturer: string;
  model: string;
  type: string;
  channels: string;
  faders: string;
  bus_count: string;
  effects: string;
  connectivity: string[];
  dimensions: string;
  weight: string;
  applications: string[];
  notes?: string;
}

export interface Fixture {
  id: string;
  manufacturer: string;
  model: string;
  type: string;
  wattage: string;
  light_source: string;
  color_temp: string;
  beam_angle: string;
  dmx_channels: string;
  weight: string;
  dimensions: string;
  applications: string[];
  notes?: string;
}

export type Equipment = Microphone | Speaker | Console | Fixture;

interface SearchFilters {
  query?: string;
  manufacturer?: string;
  type?: string;
  application?: string;
}

// Load data from JSON files
const equipmentData = {
  microphones: microphonesData as Microphone[],
  speakers: speakersData as Speaker[],
  consoles: consolesData as Console[],
  fixtures: fixturesData as Fixture[],
};

export class EquipmentService {
  /**
   * Search equipment by filters
   */
  static searchEquipment(
    equipmentType: EquipmentType,
    filters: SearchFilters = {}
  ): Equipment[] {
    let results = equipmentData[equipmentType] || [];

    // Filter by search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter((item: Equipment) => {
        return (
          item.manufacturer.toLowerCase().includes(query) ||
          item.model.toLowerCase().includes(query) ||
          (item.notes && item.notes.toLowerCase().includes(query))
        );
      });
    }

    // Filter by manufacturer
    if (filters.manufacturer) {
      results = results.filter(
        (item: Equipment) => item.manufacturer === filters.manufacturer
      );
    }

    // Filter by type
    if (filters.type) {
      results = results.filter((item: Equipment) => item.type === filters.type);
    }

    // Filter by application
    if (filters.application) {
      results = results.filter((item: Equipment) =>
        item.applications?.includes(filters.application!)
      );
    }

    return results;
  }

  /**
   * Get single equipment by ID
   */
  static getEquipmentById(
    equipmentType: EquipmentType,
    id: string
  ): Equipment | null {
    const items = equipmentData[equipmentType] || [];
    return items.find((item: Equipment) => item.id === id) || null;
  }

  /**
   * Get all unique manufacturers
   */
  static getManufacturers(equipmentType: EquipmentType): string[] {
    const items = equipmentData[equipmentType] || [];
    const manufacturers = new Set(
      items.map((item: Equipment) => item.manufacturer)
    );
    return Array.from(manufacturers).sort();
  }

  /**
   * Get all unique types
   */
  static getTypes(equipmentType: EquipmentType): string[] {
    const items = equipmentData[equipmentType] || [];
    const types = new Set(items.map((item: Equipment) => item.type));
    return Array.from(types).sort();
  }

  /**
   * Get all unique applications
   */
  static getApplications(equipmentType: EquipmentType): string[] {
    const items = equipmentData[equipmentType] || [];
    const applications = new Set(
      items.flatMap((item: Equipment) => item.applications || [])
    );
    return Array.from(applications).sort();
  }

  /**
   * Compare multiple equipment items
   */
  static compareEquipment(
    equipmentType: EquipmentType,
    ids: string[]
  ): Equipment[] {
    const items = equipmentData[equipmentType] || [];
    return items.filter((item: Equipment) => ids.includes(item.id));
  }

  /**
   * Add equipment to favorites (user-specific)
   */
  static async addToFavorites(
    userId: string,
    equipmentType: EquipmentType,
    equipmentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from('equipment_favorites').insert({
        user_id: userId,
        equipment_type: equipmentType,
        equipment_id: equipmentId,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove equipment from favorites
   */
  static async removeFromFavorites(
    userId: string,
    equipmentType: EquipmentType,
    equipmentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('equipment_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('equipment_type', equipmentType)
        .eq('equipment_id', equipmentId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's favorite equipment
   */
  static async getFavorites(
    userId: string,
    equipmentType?: EquipmentType
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const supabase = createClient();

      let query = supabase
        .from('equipment_favorites')
        .select('*')
        .eq('user_id', userId);

      if (equipmentType) {
        query = query.eq('equipment_type', equipmentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if equipment is favorited
   */
  static async isFavorited(
    userId: string,
    equipmentType: EquipmentType,
    equipmentId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('equipment_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('equipment_type', equipmentType)
        .eq('equipment_id', equipmentId)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      return false;
    }
  }
}
