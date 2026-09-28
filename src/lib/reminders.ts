export interface Reminder { id: string; due: string; enabled: boolean; firedFor: string }
export function dueReminders<T extends Reminder>(plans: T[], now = Date.now()): T[] {
  return plans.filter(p => p.enabled && p.due && p.firedFor !== p.due && Number.isFinite(Date.parse(p.due)) && Date.parse(p.due) <= now)
}
