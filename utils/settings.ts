import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { UserSettings } from '@/types/settings'

const supabase = createClientComponentClient()

const DEFAULT_PREFERENCES = {
  workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  theme: 'system'
} as const

export async function getUserSettings(): Promise<UserSettings | null> {
  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching user settings:', error)
    return null
  }

  return settings
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