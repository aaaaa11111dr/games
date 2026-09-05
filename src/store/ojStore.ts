/**
 * Unified data store: primary = backend API (IP-auth'd),
 * fallback = localStorage when backend unreachable.
 * API endpoints use relative path '/api/...' — works both in dev (vite proxy)
 * and in production (nginx reverse-proxy).
 */
import { reactive, watch } from 'vue'
import type { OJData, DailyRecord, AllOJSummary } from '../types'

const STORAGE_KEY_OJ = 'oj_tracker_data'
const STORAGE_KEY_DAILY = 'oj_tracker_daily'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}
function saveToStorage<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export interface OJUserData {
  [ojId: string]: { userId: string; data: OJData | null }
}

export const ojStore = reactive<{
  userData: OJUserData
  dailyRecords: DailyRecord[]
  backendOnline: boolean
}>({
  userData: loadFromStorage<OJUserData>(STORAGE_KEY_OJ, {}),
  dailyRecords: loadFromStorage<DailyRecord[]>(STORAGE_KEY_DAILY, []),
  backendOnline: false,
})

// --- network helpers ---
const API_BASE = '' // relative; vite proxy dev, nginx in prod
let useBackend = true

async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!useBackend) return null
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
    if (!res.ok) { useBackend = false; return null }
    const json = await res.json().catch(() => null)
    return json as T
  } catch {
    useBackend = false
    return null
  }
}

// --- load from backend on boot ---
async function bootstrap() {
  const userRes = await api<{ success: boolean; data: OJUserData }>('/api/user/oj-data')
  if (userRes?.success && userRes.data && Object.keys(userRes.data).length > 0) {
    ojStore.userData = userRes.data
    useBackend = true
    ojStore.backendOnline = true
  }
  const dailyRes = await api<{ success: boolean; records: DailyRecord[] }>('/api/user/daily?days=365')
  if (dailyRes?.success && dailyRes.records?.length) {
    ojStore.dailyRecords = dailyRes.records
  }
  // if backend empty OR fallback-mode, make sure localStorage still has current data
}
bootstrap()

// watchers — always persist to localStorage as backup
watch(() => ojStore.userData, v => saveToStorage(STORAGE_KEY_OJ, v), { deep: true })
watch(() => ojStore.dailyRecords, v => saveToStorage(STORAGE_KEY_DAILY, v), { deep: true })

// --- public API ---
export async function setOJData(ojId: string, userId: string, data: OJData) {
  ojStore.userData[ojId] = { userId, data }
  await api('/api/user/oj-data', {
    method: 'POST',
    body: JSON.stringify({ ojId, userId, data }),
  })
}

export function getOJData(ojId: string): OJData | null {
  return ojStore.userData[ojId]?.data || null
}

export function getUserId(ojId: string): string {
  return ojStore.userData[ojId]?.userId || ''
}

export function getAllSummary(): AllOJSummary {
  const summary: AllOJSummary = { total: 0, byOJ: {}, lastUpdated: new Date().toISOString() }
  for (const [ojId, entry] of Object.entries(ojStore.userData)) {
    const d = entry.data
    if (d) { summary.byOJ[ojId] = d; summary.total += d.totalSolved }
  }
  return summary
}

export async function addDailyProblem(ojId: string, problemId: string, title: string) {
  const today = new Date().toISOString().split('T')[0]
  const time = new Date().toTimeString().split(' ')[0]

  let record = ojStore.dailyRecords.find(r => r.date === today)
  if (!record) {
    record = { date: today, problems: [], totalCount: 0 }
    ojStore.dailyRecords.push(record)
  }
  record.problems.push({ oj: ojId, problemId, title, time })
  record.totalCount++

  await api('/api/user/daily', {
    method: 'POST',
    body: JSON.stringify({ oj: ojId, problemId, title }),
  })
}

export function getDailyRecords(days = 30): DailyRecord[] {
  const result: DailyRecord[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const existing = ojStore.dailyRecords.find(r => r.date === dateStr)
    result.push(existing || { date: dateStr, problems: [], totalCount: 0 })
  }
  return result
}

export async function clearAllData() {
  ojStore.userData = {}
  ojStore.dailyRecords = []
  await api('/api/user/all', { method: 'DELETE' })
}
