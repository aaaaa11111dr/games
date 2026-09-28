import { reactive, watch } from 'vue'
export interface Alarm { id: string; title: string; due: string; enabled: boolean; firedFor: string }
interface TimeState { alarms: Alarm[]; countdown: { title: string; end: number; remaining: number; status: 'idle' | 'running' | 'paused' | 'finished' }; storageError: string }
const key = 'oj_time_v1'
function load(): Omit<TimeState, 'storageError'> {
  const fallback: Omit<TimeState, 'storageError'> = { alarms: [], countdown: { title: '专注训练', end: 0, remaining: 1500, status: 'idle' } }
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    if (!saved) return fallback
    const c = saved.countdown
    return { alarms: Array.isArray(saved.alarms) ? saved.alarms.filter((a: Alarm) => a && typeof a.id === 'string' && typeof a.due === 'string' && typeof a.title === 'string') : [],
      countdown: c && ['idle', 'running', 'paused', 'finished'].includes(c.status) && Number.isFinite(c.end) && Number.isFinite(c.remaining) && c.remaining >= 0 ? c : fallback.countdown }
  } catch { return fallback }
}
export const timeStore = reactive<TimeState>({ ...load(), storageError: '' })
watch(() => [timeStore.alarms, timeStore.countdown], () => {
  try { localStorage.setItem(key, JSON.stringify({ alarms: timeStore.alarms, countdown: timeStore.countdown })); timeStore.storageError = '' }
  catch { timeStore.storageError = '计时数据保存失败，请检查浏览器存储空间。' }
}, { deep: true, flush: 'sync' })
