'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Settings, Sun, Moon, Monitor } from 'lucide-react'
import { UserSettings } from '@/types/settings'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: UserSettings['preferences']
  onSave: (settings: UserSettings['preferences']) => void
}

const THEMES = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
] as const

export default function SettingsDialog({ 
  open, 
  onClose, 
  settings: initialSettings,
  onSave 
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(initialSettings)

  // Update local settings when initial settings change
  useEffect(() => {
    setLocalSettings(initialSettings)
  }, [initialSettings])

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  const handleWorkDaysChange = (direction: 'increase' | 'decrease') => {
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const currentDaysSet = new Set(localSettings.workDays)
    
    if (direction === 'increase' && localSettings.workDays.length < 7) {
      // Add the next day in sequence
      for (const day of daysOrder) {
        if (!currentDaysSet.has(day)) {
          setLocalSettings(prev => ({
            ...prev,
            workDays: [...prev.workDays, day].sort(
              (a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)
            )
          }))
          break
        }
      }
    } else if (direction === 'decrease' && localSettings.workDays.length > 1) {
      // Remove the last day
      setLocalSettings(prev => ({
        ...prev,
        workDays: prev.workDays.slice(0, -1)
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Work Days ({localSettings.workDays.length})</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWorkDaysChange('decrease')}
                    disabled={localSettings.workDays.length <= 1}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center text-sm">
                    {localSettings.workDays.join(', ')}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWorkDaysChange('increase')}
                    disabled={localSettings.workDays.length >= 7}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Week Starts On</Label>
                <Select 
                  value={localSettings.weekStartDay}
                  onValueChange={(value: 'Mon' | 'Sun') => 
                    setLocalSettings(prev => ({ ...prev, weekStartDay: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mon">Monday</SelectItem>
                    <SelectItem value="Sun">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Format</Label>
                <Select 
                  value={localSettings.timeFormat}
                  onValueChange={(value: '12' | '24') => 
                    setLocalSettings(prev => ({ ...prev, timeFormat: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12-hour</SelectItem>
                    <SelectItem value="24">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup
                value={localSettings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') =>
                  setLocalSettings(prev => ({ ...prev, theme: value }))
                }
                className="grid grid-cols-3 gap-2"
              >
                {THEMES.map(({ label, value, icon: Icon }) => (
                  <div key={value}>
                    <RadioGroupItem
                      value={value}
                      id={value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={value}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Icon className="mb-2 h-4 w-4" />
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}