export interface UserSettings {
  id: string
  user_id: string
  preferences: {
    workDays: string[]
    theme: 'light' | 'dark' | 'system'
    weekStartDay: 'Mon' | 'Sun'
    timeFormat: '12' | '24'
    [key: string]: any
  }
  created_at: string
  updated_at: string
} 