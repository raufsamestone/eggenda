import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { UserSettings } from '@/types/settings'
import { supabase } from './supabase/client'

const DEFAULT_PREFERENCES = {
  workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  theme: 'system'
} as const

// User Settings'i getiren fonksiyon
export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('No authenticated user found');
      return null;
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    return settings;
  } catch (error) {
    console.error('Unexpected error fetching user settings:', error);
    return null;
  }
}

// Yeni ayarları kaydetmek için fonksiyon
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating user settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating user settings:', error);
    return false;
  }
}

export async function updateUserPreference<K extends keyof UserSettings['preferences']>(
  key: K,
  value: UserSettings['preferences'][K]
): Promise<UserSettings | null> {
  try {
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id, preferences')
      .single()

    if (existingSettings) {
      // Update existing settings
      const newPreferences = {
        ...existingSettings.preferences,
        [key]: value
      }

      const { data: settings, error } = await supabase
        .from('user_settings')
        .update({ preferences: newPreferences })
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) throw error
      return settings
    } else {
      // Create new settings
      const { data: settings, error } = await supabase
        .from('user_settings')
        .insert([{
          preferences: {
            ...DEFAULT_PREFERENCES,
            [key]: value
          }
        }])
        .select()
        .single()

      if (error) throw error
      return settings
    }
  } catch (error) {
    console.error(`Error updating ${key} preference:`, error)
    return null
  }
}

// Helper function to get a specific preference with type safety
export function getPreference<K extends keyof UserSettings['preferences']>(
  settings: UserSettings | null,
  key: K,
  defaultValue: UserSettings['preferences'][K]
): UserSettings['preferences'][K] {
  return settings?.preferences?.[key] ?? defaultValue
}