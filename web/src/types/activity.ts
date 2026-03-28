export type ActivityLevel = 'info' | 'success' | 'error'

export type ActivityEntry = {
  id: string
  time: string
  level: ActivityLevel
  message: string
}
