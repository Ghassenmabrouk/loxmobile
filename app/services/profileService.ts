import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  avatar_url: string;
  date_of_birth?: string;
  vip_status: boolean;
  total_rides: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  ride_updates: boolean;
  promotional_offers: boolean;
  language: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  static async createProfile(userId: string, email: string, fullName: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        phone_number: '',
        avatar_url: '',
        vip_status: false,
        total_rides: 0,
        rating: 5.0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    await this.createDefaultSettings(userId);

    return data;
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  }

  static async getSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    return data;
  }

  static async createDefaultSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        push_notifications: true,
        email_notifications: true,
        sms_notifications: false,
        ride_updates: true,
        promotional_offers: false,
        language: 'en',
        currency: 'USD',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating settings:', error);
      return null;
    }

    return data;
  }

  static async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return null;
    }

    return data;
  }

  static async getSavedLocations(userId: string): Promise<SavedLocation[]> {
    const { data, error } = await supabase
      .from('saved_locations')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved locations:', error);
      return [];
    }

    return data || [];
  }

  static async addSavedLocation(
    userId: string,
    location: Omit<SavedLocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<SavedLocation | null> {
    const { data, error } = await supabase
      .from('saved_locations')
      .insert({
        user_id: userId,
        ...location,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding saved location:', error);
      return null;
    }

    return data;
  }

  static async updateSavedLocation(
    locationId: string,
    updates: Partial<SavedLocation>
  ): Promise<SavedLocation | null> {
    const { data, error } = await supabase
      .from('saved_locations')
      .update(updates)
      .eq('id', locationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating saved location:', error);
      return null;
    }

    return data;
  }

  static async deleteSavedLocation(locationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_locations')
      .delete()
      .eq('id', locationId);

    if (error) {
      console.error('Error deleting saved location:', error);
      return false;
    }

    return true;
  }
}
