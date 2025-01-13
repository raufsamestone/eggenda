'use client'

import { useState, useEffect } from 'react'
import { UserSettings } from '@/types/settings'
import { getUserSettings, updateUserPreference } from '@/utils/settings'

const DEFAULT_SETTINGS = {
  workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  theme: 'system' as const,
  weekStartDay: 'Mon' as const,
  timeFormat: '24' as const
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const userSettings = await getUserSettings()
        setSettings(userSettings)
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const updateSetting = async <K extends keyof UserSettings['preferences']>(
    key: K,
    value: UserSettings['preferences'][K]
  ) => {
    try {
      const updatedSettings = await updateUserPreference(key, value)
      if (updatedSettings) {
        setSettings(updatedSettings)
      }
    } catch (error) {
      console.error(`Error updating ${key} setting:`, error)
    }
  }

  return {
    settings: settings?.preferences || DEFAULT_SETTINGS,
    isLoading,
    updateSetting
  }
} 